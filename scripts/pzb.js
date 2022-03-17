/*
 * BS = Blue Speed (Limit, as shown in the panel, can be 85, 70 or 55 depending on braking power)
 * SL = Speed Limit
*/
/*
* The Punktförmige Zugbeeinflusung representation modelled here takes into account the following states:
*  - Normal
* 
*  - Restricted    -> Max. 45 km/h
* 
*  - Restricted 1000Hz
* 
*  - 1000Hz        -> BS enforced for 1250m, 1000 Hz light on for 700 meters (Can be canceled cia 'PZB Frei'). Speed limit light will flash.
*        If found while another restriction is in place:
*          * 1000Hz: the SL will be active for another 1250m
*          * Restrictive 1000Hz: the new SL will be enforced after the previous restritive mode expires
*        After confirming via 'PZB Wachsam', the 1000 Hz will be off for 0.5 seconds
* 
*  - Recently cleared 
*          * Train will be forced to stop if a 1000 Hz or 500 Hz is triggered in the 550 meters following a 'PZB Frei' input
*          * Once cleared from 1000 Hz supervision, if another 1000 Hz magnet is found in the following 1250m, the BS will be enforced immediatly
*          * Once cleared from a 1000 Hz, if a 500 Hz magnet is found in the following 1250m, a forced stop will be activated
* 
*  - 500Hz         -> Speed limit reduced in 153 meters in 2 steps. Enforced for 250 meters and it is not possible to cancel.
* 
*  - Restricted 500Hz
*          * If restricted mode was activated 0-100m after the 500Hz magnet, the restrictive mode will be engaged for 200m
*          * If restricted mode was activated 100-250m after the 500Hz magnet, the mode will be engaged for 250m
*          * If already in 1000Hz restrictive monitoring, 500Hz will be triggered alongside a new 200m restrictive mode
*   
*  - 2000Hz        -> Forced complete stop "Zwangsbremsung"
*  - 2000Hz B40    -> When 2000Hz Magnet crossed with 'Befehl 40' active, a 40km/h speed limit is enforced. Prior restrictions will not be canceled. 
*                          *B40 light will be lit from 2000Hz magnet until the button is no longer being pressed.
* 
* 'Restricted' state will be triggered whenever the train is in 1000Hz or 500Hz state and the speed has not exceeded 10 km/h for at least 15 seconds.
* An eventual 1000 Hz supervision might reappear after a 500 Hz supervision expires. The 1000 Hz will end at 1250 meters from the magnet that triggered it.
* Active supervisions are not replaced by new supervisions, they continue to operate in the background.
* The train can be forced to stop in any state.
* 
* Train driver has 2.5 seconds to press 'PZB Wachsam' when going over a magnet.
*/
import { blauKonstanterLM, restriktiv, zwangsbremsungLM, _1000HzLM, _500HzLM, alleLMAusschalten, geschwindigkeitsueberschreitungLM } from "./pzbLightCombinations.js";
//import { blinker1, blinker2 } from './lightController.js'


class Bremskurve {
    constructor(geschwindigkeitA, geschwindigkeitB, zeit, abstand, restriktivA, restriktivB) {
        this.geschwindigkeitA = geschwindigkeitA;
        this.geschwindigkeitB = geschwindigkeitB;
        this.zeit = zeit;
        this.abstand = abstand;
        this.restriktivA = restriktivA;
        this.restriktivB = restriktivB;
    }
}
class PZBZugArt {
    constructor(vMax, bremskurve1000Hz, bremskurve500Hz) {
        this.vMax = vMax;
        this.bremskurve1000Hz = bremskurve1000Hz;
        this.bremskurve500Hz = bremskurve500Hz;
    }

    magnetVMax(magnet, phase, restriktiv) {
        //Phase: 0 = Geschwindigkeit A; 1 = Geschwindigkeit B; 2 = Darf befreit werden;3 = Überwachung Ende
        if(magnet === 1000) {
            if (restriktiv) return this.bremskurve1000Hz.restriktivA;
            else return phase === 0? this.bremskurve1000Hz.geschwindigkeitA : this.bremskurve1000Hz.geschwindigkeitB;
        } else
        if(magnet === 500) {
            if (restriktiv) {
                return phase === 0? this.bremskurve500Hz.restriktivA : this.bremskurve500Hz.restriktivB;
            } else return phase === 0? this.bremskurve500Hz.geschwindigkeitA : this.bremskurve500Hz.geschwindigkeitB;
        } else
        return this.vMax;
    }

    getAktivierungKriterium(magnet, phase) {
        if(magnet === 1000) {
            switch(phase) {
                case 0: return new ZeitabhaengigeAktivierung(0);
                case 1: return new ZeitabhaengigeAktivierung(23);
                case 2: return new AbstandabhaengigeAktivierung(700);
                case 3: return new AbstandabhaengigeAktivierung(1250);
            }
        } else {
            switch(phase){
                case 0: return new ZeitabhaengigeAktivierung(0);
                case 1: return new AbstandabhaengigeAktivierung(153);
                case 2:
                    case 3: return new AbstandabhaengigeAktivierung(250);
            }
        }
    }

}

export const zugArtO = new PZBZugArt(165, new Bremskurve(165, 85, 23, null, 45, 45), new Bremskurve(65, 45, null, 153, 45, 25));
export const zugArtM = new PZBZugArt(125, new Bremskurve(125, 70, 29, null, 45, 45), new Bremskurve(50, 35, null, 153, 25, 25));
export const zugArtU = new PZBZugArt(105, new Bremskurve(105, 55, 38, null, 45, 45), new Bremskurve(40, 25, null, 153, 25, 25));


/* Aux Klassen */

class AbstandabhaengigeAktivierung {
    constructor(abstand) {
        this.abstand = abstand;
    }

    istKriteriumErfuellt(beeinflussung) {
        return beeinflussung.gefahreneStrecke >= this.abstand;
    }
}

class ZeitabhaengigeAktivierung {
    constructor(zeit) {
        this.zeit = zeit;
    }

    istKriteriumErfuellt(beeinflussung) {
        return beeinflussung.verstricheneZeit >= this.zeit;
    }
}


/* Beeinflussungen */

class Beeinflussung {
    constructor(art, geschwindigkeitsbegrenzung, aktivierung, darfBefreitWerden, folgendeBeeinflussung) {
        //Beeinflussung 
        this.art = art;
        this.geschwindigkeitsbegrenzung = geschwindigkeitsbegrenzung;
        this.aktivierung = aktivierung;
        this.darfBefreitWerden = darfBefreitWerden;

        //Folgende Beeinflusung
        this.folgendeBeeinflussung = folgendeBeeinflussung;

        //Beeinflussung-Zug Angaben
        this.verstricheneZeit = 0;
        this.gefahreneStrecke = 0;
        this.phase = 0;
    }

    istBegonnen() {
        return this.aktivierung.istKriteriumErfuellt(this);
    }

    istAbgelaufen() {
        return this.folgendeBeeinflussung !== null? this.folgendeBeeinflussung.aktivierung.istKriteriumErfuellt(this) : true;
    }
 
    istAktiv() {
        return this.istBegonnen(this) && !this.istAbgelaufen(this);
    }

    folgendeBeeinflussungAktivieren() {
        this.art = this.folgendeBeeinflussung.art;
        this.geschwindigkeitsbegrenzung = this.folgendeBeeinflussung.geschwindigkeitsbegrenzung;
        this.aktivierung = this.folgendeBeeinflussung.aktivierung;
        this.darfBefreitWerden = this.folgendeBeeinflussung.darfBefreitWerden;
        this.folgendeBeeinflussung = this.folgendeBeeinflussung.folgendeBeeinflussung;
        this.phase++;
    }
}

/****** Zug PZB *****/

export class ZugPZB {
    constructor(zugArt) {
        this.zugArt = zugArt;
        this.gezeigteBeeinflussung = null;
        this.beeinflussungen = [];              //Sorted from more to less restrictive
        this.restriktiverModus = true;
        this.istZwangsbremsungAktiv = false;
        this.leuchtmelder = 'restriktiv';
        this.abstandSeitFrei = 0;
        this.abstandSeit1000Frei = 0;
        this.blaueLM = zugArt.bremskurve1000Hz.geschwindigkeitB;
        this.zeitUnter10kmh = 0;
        this.geschwindigkeitsueberschreitung = 0;   //0 = Keine Überschreitung; 1 = Überschreitung; 2 = ZB durch Überschreitung
        this.zeitUeberVmax = 0;
    }

    neueBeeinflussungDurchMagnet(magnetHz) {
        let geschwindigkeitsbegrenzung;
        this.abstandSeit1000Frei = 1251;   //TODO: Fix
        if(magnetHz === 1000 &&  this.abstandSeit1000Frei < 1250)
            geschwindigkeitsbegrenzung = this.zugArt.magnetVMax(magnetHz, 1, this.restriktiverModus);
        else 
            geschwindigkeitsbegrenzung = this.zugArt.magnetVMax(magnetHz, 0, this.restriktiverModus);
        let aktivierung = this.zugArt.getAktivierungKriterium(magnetHz, 0);

        let phase3 = new Beeinflussung(magnetHz, this.zugArt.magnetVMax(magnetHz, 3), this.zugArt.getAktivierungKriterium(magnetHz, 3), true, null);
        let phase2 = new Beeinflussung(magnetHz, this.zugArt.magnetVMax(magnetHz, 2), this.zugArt.getAktivierungKriterium(magnetHz, 2), true, phase3);
        let phase1 = new Beeinflussung(magnetHz, this.zugArt.magnetVMax(magnetHz, 1), this.zugArt.getAktivierungKriterium(magnetHz, 1), false, phase2);
        let phase0 = new Beeinflussung(magnetHz, geschwindigkeitsbegrenzung, aktivierung, false, phase1);
        
        this.beeinflussungHinzufuegen(phase0);
        //this.gezeigteBeeinflussung = this.beeinflussungen[0];
        this.updateGezeigteBeeinflussung();
        console.log('Added Beeinflussung');
        console.log(phase0);
        //TODO: Leuchtmelder und Inputs handlen
    }

    beeinflussungHinzufuegen(beeinflussung) {
        let aktiveBeeinflussungArt = beeinflussung.art;

        let _500HzBeeinflussungIndex = this.beeinflussungen.findIndex((_elem) => {return _elem.art === 500;});
        let _1000HzBeeinflussungIndex = this.beeinflussungen.findIndex((_elem) => {return _elem.art === 1000;});

        //Derzeit ist eine 500 Hz Beeinflussung aktiv
        if(_500HzBeeinflussungIndex !== -1) {

            //Neue 500Hz Beeinflussung
            if(beeinflussung.art === 500) {
                //500 Hz Überwachung aktualisieren
                let _ind = _500HzBeeinflussungIndex;
                this.beeinflussungen[_ind].verstricheneZeit = 0;
                this.beeinflussungen[_ind].gefahreneStrecke = 0;
                //TODO: Restriktiv Modus handeln
                return;
            }

            //Neue 1000Hz Beeinflussung 
            else {
                //TODO: Add 1000 Hz restriction to background
                let _1000HzBeeinflussungIndex = this.beeinflussungen.findIndex(_beeinf => _beeinf.art);
                if(_1000HzBeeinflussungIndex !== -1) {
                    this.beeinflussungen[_1000HzBeeinflussungIndex].verstricheneZeit = 0;
                    this.beeinflussungen[_1000HzBeeinflussungIndex].gefahreneStrecke = 0;
                    return;
                } else {
                    this.beeinflussungen.push(beeinflussung);
                    return;
                }
                //TODO: Restriktiv Modus handeln
            }
        }

        //Derzeit ist eine 1000 Hz Beeinflussung aktiv
        else if(_1000HzBeeinflussungIndex !== -1) {
            if(beeinflussung.art === 500) {
                //TODO: Add 500 Hz on top of 1000 Hz
                let _ind = this.beeinflussungen.findIndex(_beeinf => _beeinf.art);
                this.beeinflussungen[_ind + 1] = this.beeinflussungen[_ind];
                this.beeinflussungen[_ind] = beeinflussung;
            } else {
                //TODO: Refresh 1000 Hz restriction
                this.beeinflussungen[_1000HzBeeinflussungIndex].verstricheneZeit = 0;
                this.beeinflussungen[_1000HzBeeinflussungIndex].gefahreneStrecke = 0;
            }
        }
        // Keine vorhandenen Beeinflussungen
        else {
            //TODO: Add new restriction
            this.beeinflussungen.push(beeinflussung);
        }

        //Abstand seit letzte Frei input prüfen. TODO: Could be added inside else over this line.
        if(this.abstandSeitFrei < 550); //TODO: Trigger Zwangsbremsung
        if(this.abstandSeit1000Frei < 1250 && beeinflussung.art === 500); //TODO: Trigger Zwangsbremsung
        if(this.abstandSeit1000Frei < 1250 && beeinflussung.art === 1000);//TODO: BS becomes active immediatly
    }

    //Bei Überschreiten der Überwachungsgeschwindigkeit Zwangsbremsung eingeleiten
    geschwindigkeitPruefen(aktuelleGeschwindigkeit) {
        let beeinflussungUeberschreiten = this.beeinflussungen.some((_beeinf) => {
            return aktuelleGeschwindigkeit > _beeinf.geschwindigkeitsbegrenzung && _beeinf.istAktiv();
        });
        let restriktiveVMaxUeberschreiten = this.restriktiverModus? 45 < aktuelleGeschwindigkeit : false;
        if(beeinflussungUeberschreiten || restriktiveVMaxUeberschreiten) this.zwangsbremsungEingeleiten();
    }

    //Beeinflussungen nach restriktiver Modus aktualisieren
    updateBeeinflussungenGeschwindigkeitbegrenzungen(restriktiv) {
        this.beeinflussungen.forEach((_beeinf) => {
            _beeinf.geschwindigkeitsbegrenzung = this.zugArt.magnetVMax(_beeinf.art, restriktiv);
        });

        //TODO: besondere restriktive Überwachung hinzufügen/entfernen
    } 

    //Von möglichen Beeinflussungen 'befreien'
    frei(aktuelleGeschwindigkeit) {
        
        //Von der Zwangsbremsung befreien
        if(parseInt(aktuelleGeschwindigkeit) === 0 && this.istZwangsbremsungAktiv) {
            this.istZwangsbremsungAktiv = false;
            this.geschwindigkeitsueberschreitung = 0;
            this.updateGezeigteBeeinflussung();
            return;
        }

        //Restriktiver Modus ausschalten, wenn möglich
        if(this.beeinflussungen.length === 0 && !this.istZwangsbremsungAktiv) this.restriktiverModusSchalten(false);

        //Von Beeinflusungen befreien
        if(this.beeinflussungen.some(_beeinf => {return _beeinf.art === 1000 && _beeinf.darfBefreitWerden;})) this.abstandSeit1000Frei = 0;
        this.beeinflussungen = this.beeinflussungen.filter(_beeinf => {return !_beeinf.darfBefreitWerden});

        //TODO: Refresh gezeigte Beeinflussung
        this.abstandSeitFrei = 0;
        this.updateGezeigteBeeinflussung();

    }

    //Restriktiv Modus an oder aus (wenn möglich) schalten
    restriktiverModusSchalten(anschalten) {
        //Restriktiv Modus anschalten
        if(anschalten && !this.restriktiverModus) {
            this.updateBeeinflussungenGeschwindigkeitbegrenzungen(true);
            this.restriktiverModus = true;
        } 
        //Ausschalten
        else if(!anschalten && this.restriktiverModus) {
            this.updateBeeinflussungenGeschwindigkeitbegrenzungen(false);
            this.restriktiverModus = false;
        }
    }

    zwangsbremsungEingeleiten() {
        this.istZwangsbremsungAktiv = true;
        console.error("PZB is triggering Zwangsbremsung")
        //TODO: Activate train brake in trainControls.js
    }

    updateGezeigteBeeinflussung() {
        alleLMAusschalten();

        //Geschwindigkeitsüberschreitung
        if(this.geschwindigkeitsueberschreitung > 0) geschwindigkeitsueberschreitungLM();

        //Restriktiver Modus
        if(this.restriktiverModus) restriktiv();

        //Zwangsbremsung
        zwangsbremsungLM(this.istZwangsbremsungAktiv);

        //Ohne beeinflussungen
        if(this.beeinflussungen == 0 && !this.restriktiverModus) blauKonstanterLM(this.blaueLM);

        else if(this.beeinflussungen == 0);

        //1000Hz beeinflussung
        else if(this.beeinflussungen[0].art == 1000)  _1000HzLM(this.beeinflussungen[0].phase, this.blaueLM);
        
        //500Hz beeinflussung
        else if(this.beeinflussungen[0].art == 500)  _500HzLM(this.beeinflussungen[0].phase, this.blaueLM);
    }

    schleichfahrtPruefen(aktuelleGeschwindigkeit) {
        if(aktuelleGeschwindigkeit > 10) {
            this.zeitUnter10kmh = 0;
        } else {
            this.zeitUnter10kmh++;
            if(this.zeitUnter10kmh > 15 && this.beeinflussungen.length > 0) {
                this.restriktiverModusSchalten(true);
            }
        }
    }

    vMaxPruefen(aktuelleGeschwindigkeit) {
        if(aktuelleGeschwindigkeit >= this.zugArt.vMax && this.geschwindigkeitsueberschreitung === 0) {
            this.geschwindigkeitsueberschreitung = 1;
            this.updateGezeigteBeeinflussung();
        }
        else if(this.geschwindigkeitsueberschreitung === 1 && aktuelleGeschwindigkeit <= this.zugArt.vMax) {
            this.geschwindigkeitsueberschreitung = 0;
            this.updateGezeigteBeeinflussung();
        }
        
        if(aktuelleGeschwindigkeit >= this.zugArt.vMax + 5) {
            this.geschwindigkeitsueberschreitung = 2;
            this.zwangsbremsungEingeleiten();
            this.updateGezeigteBeeinflussung();
        }

    }

    beeinflussungenGefahreneStreckeAktualisieren(gefahreneMeter) {
        this.beeinflussungen.forEach(_beeinf => {
            _beeinf.gefahreneStrecke += gefahreneMeter;
        });
    }

    beeinflussungenVerstricheneZeitAktualisieren() {
        this.beeinflussungen.forEach(_beeinf => {
            _beeinf.verstricheneZeit++;
            //console.log('verstrichene Zeit: ' + _beeinf.verstricheneZeit);
        });
    }

    abgelaufeneBeeinflussungenPruefen() {
        let phase4Index = this.beeinflussungen.findIndex((_beeinf)=>{
            return _beeinf.phase === 3? true : false;
        });
        if(phase4Index !== -1) {
            this.beeinflussungen.splice(phase4Index, 1);
            console.log("Abgelaufen Beeinflusung entfernt!");
        }

        let phaseVeraendert = false;
        this.beeinflussungen.forEach(_beeinf => {
            if(_beeinf.istAbgelaufen()) {
                _beeinf.folgendeBeeinflussungAktivieren();
                phaseVeraendert = true;
                console.log("Beeinf. " + _beeinf.art + " changed to phase " + _beeinf.phase);
            }
        });

        if(phaseVeraendert) this.updateGezeigteBeeinflussung();
    }

    /*** run PZB ***/

    runPZB(aktuelleGeschwindigkeit, gefahreneMeter) {
        this.geschwindigkeitPruefen(aktuelleGeschwindigkeit);
        this.beeinflussungenGefahreneStreckeAktualisieren(gefahreneMeter);  //Seit letzten Ausführung
        this.abgelaufeneBeeinflussungenPruefen();

        //return this.istZwangsbremsungAktiv;
    }
}
