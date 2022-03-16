import {zwangsbremsungLM, alleLMAusschalten} from './pzbLightCombinations.js';
import {ZugPZB, zugArtM, zugArtO, zugArtU} from './pzb.js';

export let pzb = new ZugPZB(zugArtO);

let speedSlider = document.getElementById('speedSlider');

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
        };
    },200);
}


/***** EVENT LISTENERS *****/

//PZB ausführen
document.getElementById('pzbHauptschalter').addEventListener('click', ()=>{
    let zwangsbremsungEingeleitet = false;

    if(document.getElementById('pzbHauptschalter').checked){

        pzb.updateGezeigteBeeinflussung();

        let interval = setInterval(() => {

            //PZB Überwachung ausführen
            pzb.runPZBChecks();

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
    console.log(pzb);
    pzb.frei(speedSlider.value);
    console.log(pzb);
});