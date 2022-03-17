

let geschwindigkeit;
let gefahreneMeter = 0;

function updateGeschwindigkeit() {
    geschwindigkeit = document.getElementById('speedSlider').value;
}

function updateGefahreneStrecke() {
    updateGeschwindigkeit();
    // Geschwindigkeit = Abstand / Zeit    =>    Geschwindigkeit * Zeit = Abstand
    gefahreneMeter += geschwindigkeit / 12;
    document.getElementById('traveledMeters').innerHTML = Math.round(gefahreneMeter);
}

setInterval(() => updateGefahreneStrecke(), 500);


/***** Auxiliar Functions *****/ 