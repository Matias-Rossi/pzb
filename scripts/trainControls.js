import {zwangsbremsungLM, alleLMAusschalten} from './pzbLightCombinations.js';
import {ZugPZB, zugArtM, zugArtO, zugArtU} from './pzb.js';
import { gefahreneMeter } from './environment.js';
import { gefahreneMeterRechnen } from './utils.js';

export let pzb = new ZugPZB(zugArtO);

let speedSlider = document.getElementById('speedSlider');
let zwangsbremsungEingeleitet = false;

export function zwangsbremsungEingeleiten() {
    zwangsbremsungLM(true); //TODO: Mit ZugPZB direkt verbinden
    let interval = setInterval( () => {
        speedSlider.value = Math.max(parseInt(speedSlider.value)-1, 0);
        //speedSlider.trigger('change');
        sliderChange(speedSlider.value);
        
        //Wenn Zwangsbremsung von befreit
        if (!pzb.istZwangsbremsungAktiv) {  //TODO: Repalce for frei
            clearInterval(interval);
            console.log("Zwangsbremsung ende");
            zwangsbremsungLM(false); //TODO: Mit ZugPZB direkt verbinden
            zwangsbremsungEingeleitet = false;
        };
    },200);
}


/***** EVENT LISTENERS *****/

//PZB ausführen
document.getElementById('pzbHauptschalter').addEventListener('click', ()=>{

    if(document.getElementById('pzbHauptschalter').checked){

        pzb.restriktiverModus = true;
        pzb.updateGezeigteBeeinflussung();
        let count = 0;

        let interval = setInterval(() => {
            let geschwindigkeit = speedSlider.value;
            let letzteGefahreneStreckeAngaben = gefahreneMeterRechnen(geschwindigkeit, 250);

            //"Einmal pro Sekunde" Prüfungen
            if(count % 4 == 0? true:false) {
                pzb.schleichfahrtPruefen(geschwindigkeit);
                pzb.vMaxPruefen(geschwindigkeit);
                pzb.beeinflussungenVerstricheneZeitAktualisieren();
            }
            count++;
            
            //PZB Überwachung ausführen
            pzb.runPZB(geschwindigkeit, letzteGefahreneStreckeAngaben);
            
            //Zwangsbremsung eingeleitet?
            if(pzb.istZwangsbremsungAktiv && !zwangsbremsungEingeleitet) {
                zwangsbremsungEingeleitet = true;
                zwangsbremsungEingeleiten();
            }
            
            //Ausführung unterbrechen
            if(!document.getElementById('pzbHauptschalter').checked) {
                clearInterval(interval);
                alleLMAusschalten();
            }
            
        }, 250);
    }
    
});

//PZB Frei
document.getElementById('freiButton').addEventListener('click', () => {
    //console.log(pzb);
    pzb.frei(speedSlider.value);
    //console.log(pzb);
});

//Magnets aufrufen
document.getElementById('1000HzAufrufenButton').addEventListener('click', ()=> {
    pzb.neueBeeinflussungDurchMagnet(1000);
    console.log("1000Hz Magnet aufgerufen!");
});

document.getElementById('500HzAufrufenButton').addEventListener('click', ()=> {
    pzb.neueBeeinflussungDurchMagnet(500);
    console.log("1000Hz Magnet aufgerufen!");
});