import {switchLM55, switchLM70, switchLM85, switchLMS, switchLM1000Hz, switchLM500Hz, switchLMBefehl40} from './lightController.js';

export let blinker1 = false;
export let blinker2 = true;
const interval = setInterval(function () {
    blinker1 = !blinker1;
    blinker2 = !blinker2;
}, 500);

let hauptLM = [switchLM55, switchLM70, switchLM85, switchLMBefehl40, switchLM500Hz, switchLM1000Hz];

function getSwitchNachBlaueGeschwindigkeit(blaueNummer) {
    let fun;
    switch(nummer) {
        case 85: fun = switchLM85; break;
        case 70: fun = switchLM70; break;
        case 55: fun = switchLM55; break;
        default: log.error('Blau LM mit Nummer ' + nummer + ' ist nicht vorhanden')
    }
}

export function restriktiv() {
    console.log("restriktiv xd");
    switchLM70(blinker1);
    switchLM85(blinker2);
    return !blinker1;
}

export function zwangsbremsungLM() {
    switchLMS(true);
    switchLM1000Hz(blinker1);
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
        case 1: blauerLM(blinker1); switchLM1000Hz(true); break;
        case 2: blauerLM(blinker1); break;
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

export function alleLMAusschalten() {
    hauptLM.forEach((_func)=>{
        _func(false);
    });
}