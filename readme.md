# Punktförmige Zugbeeinflussung

## About

### What do we call PZB?

There is a great article in Wikipedia covering it, available both in [German](https://de.wikipedia.org/wiki/Punktf%C3%B6rmige_Zugbeeinflussung) and [English](https://en.wikipedia.org/wiki/Punktf%C3%B6rmige_Zugbeeinflussung).

### Why code it?

I have been interested in railroad signalling and safety systems for a long time. I figured out it would be fun trying to code one, so I did. PZB seemed like a good start. Regarding why I coded it using German variable names, I did just because it removed the need of translating [the manual I used as source](https://fahrweg.dbnetze.com/resource/blob/1356070/261ffe250bcb5eaf3cdca6f34b048e87/rw_483-0113-data.pdf) and forced me to practice a bit of German. I loved working on this project.

### Why this presentation?

I'm no web developer, it's easy to tell once you see the page. I chose HTML/CSS because I didn't want to spend a lot of time learning how to use some visual library. Regarding vanilla JS, I thought making this project using an easy language I'm not familiar with would make it both more interesting and fun, and it did. I learned a lot in the way.

## Usage

### Ok, but how does it work?

The system is not trivial to use. It's not hard, but it isn't intuitive.

The "train" can be controlled by using the throttle and brake, just like a car. The "Train speed" slider is there only to have a visual representation of the current speed, changing it does not affect the simulation.

The "PZB On/Off" switch toggles the PZB system on and off. I recommend turning it on only while stopped, otherwise you could trigger an emergency stop.

Now comes the interesting part, the PZB system itself, from left to right, the following buttons are available:

- PZB Befehl: This button should be pressed only when allowed to. It lets the train pass a signal which normally shouldn't be passed.
- PZB Frei: Under special circustances, it allows the train to 'escape' certain restrictions. Normally used when a limit is enforced and the track ahead is clear.
- PZB Wachsam: After passing a 1000Hz magnet, the driver has 2.5 seconds to confirm it by pressing this button. Then he has to reduce his speed accordingly.

The 1000Hz and 500Hz buttons allow the user to simulate travelling over an active magnet. They activate 5 seconds after being clicked.

### Limitations and planned improvements

- [ ] 1000Hz light does not flash when another 1000Hz restriction is already in place.
- [ ] All inputs are processed only when the click button is let go. E.g. "Wachsam" can not be held while travelling over a magnet.
- [ ] Add visual representation of distance travelled
- [ ] Add signal simulation instead of magnets alone
- [ ] Improve desktop interface (specially with lower width windows)
- [ ] Improve mobile interface





