# Chaldea Ledger

Chaldea Ledger is a lightweight Fate/Grand Order servant material tracker. It helps you compare what each servant still needs for ascension, skill leveling, and append skill progression, and it can also show the combined shopping list for your entire roster.

## Features

- Search servants by name and filter by class.
- Track all four ascension stages for each servant.
- Set current and target levels for all three skills.
- Track append skill levels, including current and target values.
- Enter owned material quantities to see remaining deficits and bottlenecked items.
- Switch between single-servant mode and full-roster mode.
- View a combined shopping list for all tracked servants.
- Import and export inventory data as JSON from the browser.
- Persist tracker state, inventory, and fetched servant data in `localStorage`.

## Getting Started

No build tools or package installation are required.

1. Clone or download this repository.
2. Serve the project with a local static web server.
3. Open the app in a modern browser.

Example:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

If you prefer, the app can also be opened directly from `index.html`, but using a local server is recommended for the most reliable browser behavior.

## How to Use

- Search for a servant in the top panel.
- Select a result to add it to the tracker.
- Use the tabs to switch between tracked servants.
- Check off ascension stages that are already complete.
- Set the current skill and append skill levels for each servant.
- Adjust the target level for the skills you plan to raise.
- Update your owned quantity per material to see what remains to buy.
- In roster mode, select the combined tab to view the total shopping list across all tracked servants.
- Use the inventory export/import buttons to save or restore your stockpile as JSON.

## Data Source

Servant and material data is fetched from the [Atlas Academy API](https://api.atlasacademy.io/). The app requests the North America (`NA`) data and caches the servant list and detailed servant responses locally in the browser.

An internet connection is required the first time servant data is loaded. After that, cached data may remain usable offline depending on the browser's storage state.

## Project Structure

| File | Purpose |
| --- | --- |
| `index.html` | Application shell and page markup |
| `styles.css` | Layout, colors, typography, and responsive styling |
| `api.js` | Atlas Academy requests and local cache handling |
| `state.js` | Tracker state, roster behavior, and persistence |
| `materials.js` | Ascension, skill, append-skill, and combined material calculations |
| `ui.js` | Rendering, search, controls, tab switching, and modal UI |

## Local Storage

The tracker stores data in the browser under these keys:

- `cl_state` for selected servants, roster mode, and tracked progress
- `cl_inventory` for owned material quantities
- `cl_basic` for the cached servant list
- `cl_svt_<id>` for cached servant detail data

To reset the tracker, clear this site's local storage from your browser's developer tools.

## Notes

This project is an unofficial fan-made tool and is not affiliated with or endorsed by Aniplex, Delightworks, TYPE-MOON, or Lasengle. Fate/Grand Order and all servant names, art, and game data are the property of their respective owners.