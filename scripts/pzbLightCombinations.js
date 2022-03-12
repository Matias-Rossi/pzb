import {switchLM70, switchLM85} from './lightController.js';

export function restricted(blinker1, blinker2) {
    switchLM70(blinker1);
    switchLM85(blinker2);
    return !blinker1;
}