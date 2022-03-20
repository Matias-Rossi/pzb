import {switchLM55, switchLM70, switchLM85, switchLMS, switchLMG, switchLM1000Hz, switchLM500Hz, switchLMBefehl40} from './lightController.js';


export let blinker1 = false;
export let blinker2 = true;
const interval = setInterval(function () {
    blinker1 = !blinker1;
    blinker2 = !blinker2;
    blinkerIterator();
}, 500);

let hauptLM = [switchLM55, switchLM70, switchLM85, switchLMBefehl40, switchLM500Hz, switchLM1000Hz, switchLMG, switchLMS];

function getSwitchNachBlaueGeschwindigkeit(blaueNummer) {
    let fun;
    switch(blaueNummer) {
        case 85: fun = switchLM85; break;
        case 70: fun = switchLM70; break;
        case 55: fun = switchLM55; break;
        default: console.error('Blau LM mit Nummer ' + blaueNummer + ' ist nicht vorhanden')
    }
    return fun;
}

export function restriktiv() {
    //switchLM70(blinker1);
    //switchLM85(blinker2);
    blinken(switchLM70, 1);
    blinken(switchLM85, 2);
    return !blinker1;
}

//TODO: Check
export function zwangsbremsungLM() {
    switchLMS(true);
    switchLM1000Hz(blinker1);
    blinken(switchLM1000Hz, 1);
}

export function blauKonstanterLM(bs) {
    let blauerLM = getSwitchNachBlaueGeschwindigkeit(bs);
    blauerLM(true);
}

export function _1000HzLM(phase, bs) {
    //Phase: 0 = Geschwindigkeit A; 1 = Geschwindigkeit B; 2 = Darf befreit werden;3 = Überwachung Ende
    let blauerLM = getSwitchNachBlaueGeschwindigkeit(bs);
    switch(phase) {
        case 0: 
        //case 1: blauerLM(blinker1); switchLM1000Hz(true); break;
        case 1: blinken(blauerLM, 2); switchLM1000Hz(true); break;
        //case 2: blauerLM(blinker1); break;
        case 2: blinken(blauerLM, 2); break;
        case 3: break;
    }
}

export function _500HzLM(phase, bs) {
    //Phase: 0 = Geschwindigkeit A; 1 = Geschwindigkeit B; 2 = Darf befreit werden;3 = Überwachung Ende
    let blauerLM = getSwitchNachBlaueGeschwindigkeit(bs);
    switch(phase) {
        case 0: 
        case 1: 
        case 2: switchLM500Hz(true); break;
        case 3: break;
    }
}

export function geschwindigkeitsueberschreitungLM() {
    blinken(switchLMG, 1);
}

//Blinkers
let blinker1Lichter = [];
let blinker2Lichter = [];

export function alleLMAusschalten() {
    hauptLM.forEach((_func)=>{
        _func(false);
    });
    blinker1Lichter = [];
    blinker2Lichter = [];
}

function blinken(leuchtmelderFunc, blinkerN) {
    if(blinkerN == 1)
        blinker1Lichter.push(leuchtmelderFunc)
    else 
        blinker2Lichter.push(leuchtmelderFunc)
}

function blinkerIterator() {
    blinker1Lichter.forEach((_lm) => {
        _lm(blinker1);
    });
    blinker2Lichter.forEach((_lm) => {
        _lm(blinker2);
    });
}