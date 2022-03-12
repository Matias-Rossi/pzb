
lightsOn = false;
const interval = setInterval(function() {
    lightsOn = blinkAllLights(lightsOn);
},500);

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

//Individual light controllers

speedLightOnGradient = "linear-gradient(to right, black, rgb(50, 98, 255) 400px, black 800px)";
speedLightOffGradient = "linear-gradient(to right, black, rgb(18, 33, 116) 400px, black 800px)";

function switchLM55(desiredStatus) {
    if (desiredStatus == true)
        document.getElementById("lm55").style.backgroundImage = speedLightOnGradient;
    else
    document.getElementById("lm55").style.backgroundImage = speedLightOffGradient;
}

function switchLM70(desiredStatus) {
    if (desiredStatus == true)
        document.getElementById("lm70").style.backgroundImage = speedLightOnGradient;
    else
    document.getElementById("lm70").style.backgroundImage = speedLightOffGradient;
}

function switchLM85(desiredStatus) {
    if (desiredStatus == true)
        document.getElementById("lm85").style.backgroundImage = speedLightOnGradient;
    else
    document.getElementById("lm85").style.backgroundImage = speedLightOffGradient;
}

function switchLMBefehl40(desiredStatus) {
    if (desiredStatus == true)
        document.getElementById("lmBefehl40").style.backgroundImage = "linear-gradient(to right, black, white 400px, black 800px)";
    else
    document.getElementById("lmBefehl40").style.backgroundImage = "linear-gradient(to right, black, rgb(87, 87, 87) 400px, black 800px)";
}

function switchLM500Hz(desiredStatus) {
    if (desiredStatus == true)
        document.getElementById("lm500Hz").style.backgroundImage = "linear-gradient(to right, black, red 400px, black 800px)";
    else
    document.getElementById("lm500Hz").style.backgroundImage = "linear-gradient(to right, black, rgb(97, 0, 0) 400px, black 800px)";
}

function switchLM1000Hz(desiredStatus) {
    if (desiredStatus == true)
        document.getElementById("lm1000Hz").style.backgroundImage = "linear-gradient(to right, black, yellow 400px, black 800px)";
    else
        document.getElementById("lm1000Hz").style.backgroundImage = "linear-gradient(to right, black, rgb(105, 105, 0) 400px, black 800px)";      
}