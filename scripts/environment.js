import {gefahreneMeterRechnen} from './utils.js';
import { geschwindigkeit } from './trainControls.js'

export let gefahreneMeter = 0;


function updateGefahreneStrecke() {
    gefahreneMeter += gefahreneMeterRechnen(geschwindigkeit, 250);
    document.getElementById('traveledMeters').innerHTML = Math.round(gefahreneMeter);
}

setInterval(() => updateGefahreneStrecke(), 250);


/***** Auxiliar Functions *****/ 

