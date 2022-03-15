let speedSlider = document.getElementById('speedSlider');

function zwangsbremsungEingeleiten() {
    let interval = setInterval( () => {
        speedSlider.value = parseInt(speedSlider.value)-1;
        //speedSlider.trigger('change');
        sliderChange(speedSlider.value);
        if (parseInt(speedSlider.value) === 0) clearInterval(interval);
    },200);

}

