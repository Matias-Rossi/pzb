import {zwangsbremsungLM, alleLMAusschalten} from './pzbLightCombinations.js';
import {ZugPZB, zugArtM, zugArtO, zugArtU} from './pzb.js';
import { gefahreneMeterRechnen } from './utils.js';

export let pzb = new ZugPZB(zugArtO);

//Inputs
let throttleLeverId = 'throttle';
let throttleLever = document.getElementById('throttle');
let brakeLeverId = 'brake';
let brakeLever = document.getElementById('brake');
const brakeLeverMax = 10;

let leistungsregler = document.getElementById(throttleLeverId).value;
let bremshebel = document.getElementById(brakeLeverId).value;
export let geschwindigkeit = 0;

//Outputs
let tachometer = document.getElementById('speedIndicator');
let tachometerSlider = document.getElementById('speedSlider');

//Angaben
let speedSlider = document.getElementById('speedSlider');
let zwangsbremsungEingeleitet = false;

export function zwangsbremsungEingeleiten() {
    let interval = setInterval( () => {
        brakeLever.value = brakeLeverMax;
        throttleLever.value = 0;
        
        //Wenn Zwangsbremsung von befreit
        if (!pzb.istZwangsbremsungAktiv) {
            clearInterval(interval);
            console.log("Zwangsbremsung ende");
            zwangsbremsungEingeleitet = false;
        };
    },200);
}

//Geschwindigkeit nach Leistungsregler & Bremshebel aktualisieren
setInterval(() => {
    //Wert aktualisieren
    leistungsregler = document.getElementById(throttleLeverId).value;
    bremshebel = document.getElementById(brakeLeverId).value;

    //Geschwindigkeit verändern
    if(bremshebel > 0) {
        geschwindigkeit = Math.round(Math.max(geschwindigkeit - bremshebel * 0.5, 0));
    } else {
        geschwindigkeit = Math.round(Math.min(geschwindigkeit + leistungsregler * 0.25, 180));
    }
    tachometer.innerHTML = geschwindigkeit;
    tachometerSlider.value = geschwindigkeit;
}, 500);

/***** EVENT LISTENERS *****/

//Leistungsregler
document.getElementById(throttleLeverId).addEventListener('change', ()=>{
    leistungsregler = document.getElementById(throttleLeverId).value;
});

//Bremshebel
document.getElementById(throttleLeverId).addEventListener('change', ()=>{
    bremshebel = document.getElementById(brakeLeverId).value;
});

//PZB ausführen
document.getElementById('pzbHauptschalter').addEventListener('click', ()=>{

    if(document.getElementById('pzbHauptschalter').checked){

        pzb.start()

        let count = 0;

        let interval = setInterval(() => {
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


//PZB Controls
//PZB Befehl
document.getElementById('befehlButton').addEventListener('click', () => {
    pzb.befehl();
});


//PZB Frei
document.getElementById('freiButton').addEventListener('click', () => {
    pzb.frei(speedSlider.value);
});


//PZB Wachsam
document.getElementById('wachsamButton').addEventListener('click', () => {
    pzb.wachsam();
});
//PZB Controls Ende


//Magnets aufrufen
let magnetInDerWarteschlange = false;

//TODO: Fix code repetition
document.getElementById('1000HzAufrufenButton').addEventListener('click', ()=> {
    magnetInDerWarteschlange = true;
    let timer = 5;
    let interval = setInterval(() => {
        console.log(timer + " until 1000Hz Magnet");
        timer--;
        if(timer === -1){
            pzb.magnetHandler(1000);
            console.log("1000Hz Magnet aufgerufen!");
            magnetInDerWarteschlange = false;
            clearInterval(interval);
        }
    }, 1000)
});

document.getElementById('500HzAufrufenButton').addEventListener('click', ()=> {
    magnetInDerWarteschlange = true;
    let timer = 5;
    let interval = setInterval(() => {
        console.log(timer + " until 500Hz Magnet");
        document.getElementById('500HzAufrufenButton').innerHTML = timer + " until 500Hz Magnet";
        timer--;
        if(timer === -1){
            pzb.magnetHandler(500);
            console.log("500Hz Magnet aufgerufen!");
            magnetInDerWarteschlange = false;
            document.getElementById('500HzAufrufenButton').innerHTML = "500Hz Aufrufen";
            clearInterval(interval);
        }
    }, 1000)
});

function setMagnetTimer(magnetHz, buttonId) {
    let timer = 5;
    let interval = setInterval(() => {
        //console.log(timer + " until " + magnetHz + " Magnet");
        document.getElementById(buttonId).innerHTML = timer + " until " + magnetHz + " Magnet";
        timer--;
        if(timer === -1){
            pzb.magnetHandler(magnetHz);
            console.log(magnetHz + " Magnet aufgerufen!");
            magnetInDerWarteschlange = false;
            document.getElementById(buttonId).innerHTML = magnetHz + " Aufrufen";
            clearInterval(interval);
        }
    }, 1000)
}