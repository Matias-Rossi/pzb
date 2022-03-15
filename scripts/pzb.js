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

const zugArtO = new PZBZugArt(165, new Bremskurve(165, 85, 23, null, 45, 45), new Bremskurve(65, 45, null, 153, 45, 25));
const zugArtM = new PZBZugArt(125, new Bremskurve(125, 70, 29, null, 45, 45), new Bremskurve(50, 35, null, 153, 25, 25));
const zugArtU = new PZBZugArt(105, new Bremskurve(105, 55, 38, null, 45, 45), new Bremskurve(40, 25, null, 153, 25, 25));


/* Aux Klassen */

class AbstandabhaengigeAktivierung {
    constructor(abstand) {
        this.abstand = abstand;
    }

    sollteAktiviertWerden(beeinflussung) {
        return beeinflussung.gefahreneStrecke < this.abstand;
    }

    istKriteriumErfuellt(beeinflussung) {
        return beeinflussung.gefahreneStrecke < this.abstand;
    }
}

class ZeitabhaengigeAktivierung {
    constructor(zeit) {
        this.zeit = zeit;
    }

    sollteAktiviertWerden(beeinflussung) {
        return beeinflussung.verstricheneZeit < this.zeit;
    }

    istKriteriumErfuellt(beeinflussung) {
        return beeinflussung.verstricheneZeit < this.zeit;
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
    }

    istBegonnen() {
        return this.aktivierung.istKriteriumErfuellt(this);
    }

    istAbgelaufen() {
        return this.folgendeBeeinflussung? this.folgendeBeeinflussung.aktivierung.istKriteriumErfuellt(this) : true;
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
    }
}

class ZugPZB {
    constructor(zugArt) {
        this.zugArt = zugArt;
        this.gezeigteBeeinflussung = null;
        this.beeinflussungen = [];              //Sorted from more to less restrictive
        this.restriktivModus = true;
        this.istZwangbremsungAktiv = false;
        this.leuchtmelder = 'restriktiv';
        this.abstandSeitFrei = 0;
        this.abstandSeit1000Frei = 0;
    }

    neueBeeinflussungDurchMagnet(magnetHz) {
        let geschwindigkeitsbegrenzung;
        if(magnetHz === 1000 && this.abstandSeit1000Frei < 1250)
            geschwindigkeitsbegrenzung = this.zugArt.magnetVMax(magnetHz, 1, this.restriktivModus);
        else 
            geschwindigkeitsbegrenzung = this.zugArt.magnetVMax(magnetHz, 0, this.restriktivModus);
        let aktivierung = this.zugArt.getAktivierungKriterium(magnetHz, 0);

        let phase3 = new Beeinflussung(magnetHz, this.zugArt.magnetVMax(magnetHz, 3), this.zugArt.getAktivierungKriterium(magnetHz, 3), null);
        let phase2 = new Beeinflussung(magnetHz, this.zugArt.magnetVMax(magnetHz, 2), this.zugArt.getAktivierungKriterium(magnetHz, 2), phase3);
        let phase1 = new Beeinflussung(magnetHz, this.zugArt.magnetVMax(magnetHz, 1), this.zugArt.getAktivierungKriterium(magnetHz, 1), phase2);
        let phase0 = new Beeinflussung(magnetHz, geschwindigkeitsbegrenzung, aktivierung, false, phase1);
        
        this.beeinflussungHinzufuegen(phase0);
    }

    beeinflussungHinzufuegen(beeinflussung) {
        let aktiveBeeinflussungArt = beeinflussung.art;

        //Derzeit ist eine 500 Hz Beeinflussung aktiv
        if(this.beeinflussungen.findIndex((_elem) => {
            return _elem.art === 500;
        }) !== 1) {

            if(beeinflussung.art === 500) {
                //TODO: Refresh 500 Hz restriction
            } else {
                //TODO: Add 1000 Hz restriction to background
            }
        }
        //Derzeit ist eine 1000 Hz Beeinflussung aktiv
        else if(this.beeinflussungen.findIndex((_elem) => {
            return _elem.art === 500;
        }) !== 1) {
            if(beeinflussung.art === 500) {
                //TODO: Add 500 Hz on top of 1000 Hz
            } else {
                //TODO: Refresh 1000 Hz restriction
            }
        }
        // Keine vorhandenen Beeinflussungen
        else {
            //TODO: Add new restriction
        }

        //Abstand seit letzte Frei input prüfen. TODO: Could be added inside else over this line.
        if(this.abstandSeitFrei < 550); //TODO: Trigger Zwangsbremsung
        if(this.abstandSeit1000Frei < 1250 && beeinflussung.art === 500); //TODO: Trigger Zwangsbremsung
        if(this.abstandSeit1000Frei < 1250 && beeinflussung.art === 1000);//TODO: BS becomes active immediatly
    }

    //Bei Überschreiten der Überwachungsgeschwindigkeit true
    geschwindigkeitPruefen(aktuelleGeschwindigkeit) {
        let ueberschreiten = this.beeinflussungen.some((_beeinf) => {
            return aktuelleGeschwindigkeit > _beeinf.geschwindigkeitsbegrenzung && _beeinf.istAktiv();
        });
        return ueberschreiten;
    }

    //Beeinflussungen nach restriktiv Modus aktualisieren
    updateBeeinflussungenGeschwindigkeitbegrenzungen(restriktiv) {
        this.beeinflussungen.forEach((_beeinf) => {
            _beeinf.geschwindigkeitsbegrenzung = this.zugArt.magnetVMax(_beeinf.art, restriktiv);
        });

        //TODO: Hinzufügen/Entfernen besondere restriktiv Überwachung
    } 

    //Von mögliche Beeinflussungen 'befreien'
    frei() {
        if(this.beeinflussungen.some(_beeinf => {return _beeinf.art === 1000 && _beeinf.darfBefreitWerden;})) this.abstandSeit1000Frei = 0;
        this.beeinflussungen = this.beeinflussungen.filter(_beeinf => {return !_beeinf.darfBefreitWerden});
        //TODO: Check if can be freed from restriktiv
        //TODO: Refresh gezeigtebeeinflussung
        this.abstandSeitFrei = 0;
    }

}
