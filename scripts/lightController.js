import { restricted } from './pzbLightCombinations.js';
let blinker1 = false;
let blinker2 = true;
const interval = setInterval(function () {
    blinker1 = !blinker1;
    blinker2 = !blinker2;
    restricted(blinker1, blinker2);
}, 500);

function blinkAllLights(lightStatus) {
    lightStatus = !lightStatus;

    switchLM55(lightStatus);
    switchLM70(lightStatus);
    switchLM85(lightStatus);
    switchLMBefehl40(lightStatus);
    switchLM500Hz(lightStatus);
    switchLM1000Hz(lightStatus);

    return lightStatus;
}

//Misc/aux
export let brightText = "white";
export let darkText = "rgb(150, 150, 150)";
let switchFunctions = [switchLM55, switchLM70, switchLM85, switchLMBefehl40, switchLM500Hz, switchLM1000Hz];

export function changeTextColor(lightElement, desiredStatus) {
    lightElement.style.color = desiredStatus? brightText : darkText;
}


document.getElementById("befehlButton").onmousedown = function(){testLights(1)};
document.getElementById("befehlButton").onmouseup = function(){testLights(0)};
function testLights(isPressed) {
    switchFunctions.forEach(fn => fn(isPressed));
}


//Individual light controllers

export let speedLightOnGradient = "linear-gradient(to right, black, rgb(100, 170, 255) 400px, black 800px)";
export let speedLightOffGradient = "linear-gradient(to right, black, rgb(18, 33, 116) 400px, black 800px)";


export function switchLM55(desiredStatus) {
    let light = document.getElementById("lm55");
    if (desiredStatus == true) {
        light.style.backgroundImage = speedLightOnGradient;
    }
    else {
        light.style.backgroundImage = speedLightOffGradient;
    }
    changeTextColor(light, desiredStatus);
}

export function switchLM70(desiredStatus) {
    let light = document.getElementById("lm70");
    if (desiredStatus == true) {
        light.style.backgroundImage = speedLightOnGradient;
    }
    else {
        light.style.backgroundImage = speedLightOffGradient;
    }
    changeTextColor(light, desiredStatus);
}

export function switchLM85(desiredStatus) {
    let light = document.getElementById("lm85");
    if (desiredStatus == true) {
        light.style.backgroundImage = speedLightOnGradient;
    }
    else {
        light.style.backgroundImage = speedLightOffGradient;
    }
    changeTextColor(light, desiredStatus);
}

export function switchLMBefehl40(desiredStatus) {
    let light = document.getElementById("lmBefehl40");
    if (desiredStatus == true) {
        light.style.backgroundImage = "linear-gradient(to right, black, white 400px, black 800px)";
    }
    else {
        light.style.backgroundImage = "linear-gradient(to right, black, rgb(87, 87, 87) 400px, black 800px)";
    }
    changeTextColor(light, desiredStatus);
}

export function switchLM500Hz(desiredStatus) {
    let light = document.getElementById("lm500Hz");
    if (desiredStatus == true) {
        light.style.backgroundImage = "linear-gradient(to right, black, red 400px, black 800px)";
    }
    else {
        light.style.backgroundImage = "linear-gradient(to right, black, rgb(97, 0, 0) 400px, black 800px)";
    }
    changeTextColor(light, desiredStatus);
}

export function switchLM1000Hz(desiredStatus) {
    let light = document.getElementById("lm1000Hz");
    if (desiredStatus == true) {
        light.style.backgroundImage = "linear-gradient(to right, black, yellow 400px, black 800px)";
    }
    else {
        light.style.backgroundImage = "linear-gradient(to right, black, rgb(105, 105, 0) 400px, black 800px)";
    }
    changeTextColor(light, desiredStatus);
}