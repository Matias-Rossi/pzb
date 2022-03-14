/*
 * BS = Blue Speed (Limit, as shown in the panel, can be 85, 70 or 55 depending braking power)
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

class PZBZugArt {
    constructor(vMax, v1000Hz, zeit1000Hz, v500HzA, v500HzB,v500HzRestriktivIstKonstant) {
        this.vMax = vMax;
        this.v1000Hz = v1000Hz;
        this.zeit1000Hz = zeit1000Hz;
        this.v500HzA = v500HzA;
        this.v500HzB = v500HzB;
        this.v500HzRestriktivIstKonstant = v500HzRestriktivIstKonstant;
    }

    magnetVMax(magnet) {
        switch(magnet) {
            case 1000: return this.v1000Hz;
            case 500: return this.v500Hz;
            default: return 0;
        }
    }

    magnetFolgendeBeeinflussungAktivierung(magnet) {
        if(magnet == 1000) {
            return new ZeitabhaengigeAktivierung(this.zeit1000Hz);
        } else if (magnet == 500) {
            return new AbstandabhaengigeAktivierung(153);
        }
    }


}

const zugArtO = new PZBZugArt(160, 85, 23, 65, 45, false);
const zugArtM = new PZBZugArt(120, 70, 29, 50, 35, true);
const zugArtU = new PZBZugArt(105, 55, 38, 40, 25, true);

/* Aux Klassen */

class AbstandabhaengigeAktivierung {
    constructor(abstand) {
        this.abstand = abstand;
    }

    istBeeinflussungGueltig(beeinflussung) {
        return beeinflussung.gefahreneStrecke < this.abstand;
    }
}

class ZeitabhaengigeAktivierung {
    constructor(zeit) {
        this.zeit = zeit;
    }

    istBeeinflussungGueltig(beeinflussung) {
        return beeinflussung.verstricheneZeit < this.zeit;
    }
}


/* Beeinflussungen */

class Beeinflussung {
    constructor(art, geschwindigkeitsbegrenzung, zeitBisAktiv, darfBefreitWerden) {
        this.art = art;
        this.geschwindigkeitsbegrenzung = geschwindigkeitsbegrenzung;
        this.zeitBisAktiv = zeitBisAktiv;
        this.darfBefreitWerden = darfBefreitWerden;
        this.verstricheneZeit = 0;
        this.gefahreneStrecke = 0;
    }
}

class DirektBeeinflussung extends Beeinflussung {
    constructor(art, geschwindigkeitsbegrenzung, zeitBisAktiv, darfBefreitWerden, folgendeAktivierung, folgendeBeeinflusung) {
        this.folgendeAktivierung = folgendeAktivierung;
        this.folgendeBeeinflusung = folgendeBeeinflusung;
        super(art, geschwindigkeitsbegrenzung, zeitBisAktiv, darfBefreitWerden);
    }

    istBeeinflussungGueltig() {
        return this.folgendeAktivierung.istBeeinflussungGueltig(this);
    }
}

class FolgendeBeeinflussung extends Beeinflussung {
    constructor(art, geschwindigkeitsbegrenzung, darfBefreitWerden, ende) {
        this.ende = ende;
        super(art, geschwindigkeitsbegrenzung, 0, darfBefreitWerden);
    }

    istBeeinflussungGueltig() {
        return this.ende.istBeeinflussungGueltig(this);
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
    }

    neueBeeinflussungDurchMagnet(magnetHz) {
        let geschwindigkeitsbegrenzung = this.zugArt.magnetVMax(magnetHz);
        let zeitBisAktiv = magnetHz == 1000? ZeitabhaengigeAktivierung(23) : AbstandabhaengigeAktivierung(153);
        let folgendeAktivierung = this.zugArt.magnetBeeinflussungAktivierung(magnetHz);
        let beeinflussung = new DirektBeeinflussung(magnetHz, geschwindigkeitsbegrenzung, zeitBisAktiv, false, folgendeAktivierung);
        
        this.beeinflussungHinzufuegen(beeinflussung);
    }

    beeinflussungHinzufuegen(beeinflussung) {
        let aktiveBeeinflussungArt = beeinflussung.art;

        //Derzeit ist eine 500 Hz Beeinflussung aktiv
        if(this.beeinflussungen.findIndex((_elem) => {
            return _elem.art == 500;
        }) != 1) {

            if(beeinflussung.art == 500) {
                //TODO: Refresh 500 Hz restriction
            } else {
                //TODO: Add 1000 Hz restriction to background
            }
        }
        //Derzeit ist eine 1000 Hz Beeinflussung aktiv
        else if(this.beeinflussungen.findIndex((_elem) => {
            return _elem.art == 500;
        }) != 1) {
            if(beeinflussung.art == 500) {
                //TODO: Add 500 Hz on top of 1000 Hz
            } else {
                //TODO: Refresh 1000 Hz restriction
            }
        }
        // Keine vorhandenen Beeinflussungen
        else {
            //Add new restriction
        }
    }

}

