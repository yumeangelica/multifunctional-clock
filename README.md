# Multifunctional Clock

A static Vanilla JavaScript app combining a real-time clock, precision stopwatch, and deadline-based countdown timer.

Originally created in 2020 and polished in 2026 with yumeangelica's warm mauve design system, self-hosted Comfortaa, mobile-first controls, and quieter screen-reader behavior.

## Features

### Real-time clock

- Local date and time with a 12/24-hour toggle
- Time-based greetings, angel-number messages, and the original time easter eggs
- System-aware light/dark switch with a saved preference and mauve-derived themes

### Stopwatch

- `requestAnimationFrame` timing with `HH:MM:SS.mmm` display
- Start, pause, resume, lap, and reset actions
- Split and total time for every recorded lap

### Countdown timer

- 30-second and 5/10/15/30-minute presets
- Custom minutes and seconds with accessible step controls
- Deadline-based timing that corrects drift after background-tab throttling
- Start, pause, resume, clear, and an inline completion alert
- Web Audio notification unlocked by the user's Start action

## Interaction and accessibility

- Three direct mode buttons with explicit selected state
- Native controls, visible keyboard focus, 44px+ targets, zoom-friendly layout
- Space starts/pauses the active stopwatch or timer; Escape pauses it
- The clock updates visually without being announced every second
- Reduced-motion and forced-colors support

The implementation follows WCAG 2.2 AA-oriented practices, but complete conformance still requires assistive-technology and device testing.

## Technology

- Semantic HTML, modern CSS, and Vanilla JavaScript
- Date, Performance, Web Audio, and `requestAnimationFrame` browser APIs
- Self-hosted Comfortaa 400/600/700 under the SIL Open Font License
- No runtime dependencies, package manager, or build step

## Run locally

Open `index.html`, or run `python3 -m http.server 4174` and visit `http://localhost:4174`.

## Project structure

```text
index.html       Static clock, stopwatch, and timer controls
styles.css       Palette A tokens, dark variant, and mobile-first styles
app.js           Time-tool state and interactions
theme.js         Early theme setup, switch state, and saved preference
copyright.js     Current footer year
fonts/           Local Comfortaa files and OFL license
```

## License

Application code and content are licensed under [CC BY-NC-SA 4.0](LICENSE). Comfortaa remains under the SIL Open Font License in `fonts/OFL.txt`.

---

Created with love by [yumeangelica](https://yumeangelica.github.io) · 2020–2026
