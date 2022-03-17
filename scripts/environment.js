import {gefahreneMeterRechnen} from './utils.js';

let geschwindigkeit;
export let gefahreneMeter = 0;

function updateGeschwindigkeit() {
    geschwindigkeit = document.getElementById('speedSlider').value;
}

function updateGefahreneStrecke() {
    updateGeschwindigkeit();
    gefahreneMeter += gefahreneMeterRechnen(geschwindigkeit, 250);
    document.getElementById('traveledMeters').innerHTML = Math.round(gefahreneMeter);
}

setInterval(() => updateGefahreneStrecke(), 250);


/***** Auxiliar Functions *****/ 

