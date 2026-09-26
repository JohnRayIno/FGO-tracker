# Chaldea Ledger

Chaldea Ledger is a lightweight Fate/Grand Order servant material tracker. Search for servants, track ascension progress and skill levels, and compare the materials still needed for one servant or an entire roster.

## Features

- Search servants by name and filter by class.
- Track all four ascension stages.
- Set current and target levels for each skill.
- Enter owned material quantities to see remaining deficits.
- Switch between a single-servant view and a full-roster view.
- View a combined shopping list for the selected roster.
- Cache servant data and tracker progress in the browser with `localStorage`.

## Getting Started

No build tools or dependencies are required.

1. Clone or download this repository.
2. Open `index.html` in a modern browser.
3. Search for a servant and select a result to begin tracking.

For the most reliable browser behavior, serve the folder with a local static server instead of opening the file directly. For example:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Data Source

Servant and material data comes from the [Atlas Academy API](https://api.atlasacademy.io/). The app uses the North America (`NA`) endpoints and requests data as needed. The servant list and detailed servant responses are cached locally after they are fetched.

An internet connection is required the first time data is loaded. Previously cached data may continue to work offline, depending on the browser's storage state.

## Project Structure

| File | Purpose |
| --- | --- |
| `index.html` | Application shell and page markup |
| `styles.css` | Layout, colors, typography, and responsive styling |
| `api.js` | Atlas Academy requests and response caching |
| `state.js` | Tracker state, roster actions, and persistence |
| `materials.js` | Ascension, skill, and combined material calculations |
| `ui.js` | Rendering, search, controls, and app initialization |

## Local Storage

The tracker stores progress in the browser under these keys:

- `cl_state` for selected servants, modes, and progress
- `cl_inventory` for owned material quantities
- `cl_basic` for the cached servant list
- `cl_svt_<id>` for cached servant details

To reset the tracker, clear this site's local storage from the browser's developer tools.