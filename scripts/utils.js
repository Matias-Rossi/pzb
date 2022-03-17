//Gefahrene Meter nach geschwindigkeit und refresh rate rechnen
export function gefahreneMeterRechnen(v, rr) {
    rr = rr/1000
    return v / (6*(1/rr))
}
