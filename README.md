# Multifunctional Clock

A multifunctional web app featuring a real-time clock, stopwatch, and countdown timer. Built with vanilla JavaScript, HTML, and CSS — zero external dependencies.

Originally developed in 2020, modernized in 2024–2026 with full accessibility support, responsive design, and a portfolio-synced pink aesthetic.

## Features

### Real-Time Clock
- Live time and date display
- 12/24-hour format toggle
- Time-based greeting messages (Good Morning, Good Evening, etc.)
- Angel number alerts (11:11, 22:22, etc.)
- Easter egg greetings for specific times

### Stopwatch
- High-precision timing using `requestAnimationFrame`
- Start, stop, lap, and reset functionality
- Chronological lap recording with scrollable list
- Time format: HH:MM´SS´´MMM

### Countdown Timer
- Quick preset buttons (5, 10, 15, 30 min, 30 sec)
- Custom time input with spinner controls
- Live time preview
- Audio alerts using Web Audio API
- Pause, resume, and clear functionality
- Input validation with error feedback

## Technologies

- **Vanilla JavaScript (ES6+)** — no frameworks or libraries
- **HTML5** — semantic markup with comprehensive ARIA support
- **CSS3** — custom properties, Flexbox, responsive design, dark mode
- **Google Fonts (Inter)** — consistent typography across portfolio
- **Web Audio API** — timer completion sound
- **Zero Dependencies** — no Bootstrap, no npm packages

## Accessibility & UX

- Fully keyboard-navigable (Space to start/stop, Escape to stop, Arrow keys for spinner adjustment)
- Screen reader announcements via ARIA live regions
- `prefers-reduced-motion` support
- `prefers-contrast: high` support
- `prefers-color-scheme: dark` support
- `:focus-visible` styles for keyboard users only
- Touch-optimized with 44px+ minimum tap targets
- Responsive from 360px to desktop

## Project Structure

```
├── index.html      # Main HTML document
├── styles.css      # All styles with CSS custom properties
├── app.js          # Clock, stopwatch, timer logic and UI
├── copyright.js    # Dynamic footer copyright year
├── LICENSE         # CC BY-NC-SA 4.0
└── README.md
```

## Getting Started

1. Clone or download the project files
2. Open `index.html` in any modern web browser
3. Use the dropdown to switch between clock modes

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+
- Mobile: iOS Safari, Chrome Mobile, Samsung Internet

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. See the [LICENSE](LICENSE) file for details.

---

**Created with love by [yumeangelica](https://yumeangelica.github.io) | 2020–2026**