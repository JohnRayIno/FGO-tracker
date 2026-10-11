# Fate Tracker

Fate Tracker is a lightweight Fate/Grand Order servant material tracker. It helps you compare what each servant still needs for ascension, skill leveling, and append skill progression, and it can also show the combined shopping list for your entire roster.

## Features

- Search servants by name and filter by class, rarity, and region.
- Browse the combined NA and JP servant list, with JP-only servants clearly marked.
- Track all four ascension stages for each servant.
- Set current and target levels for all three skills.
- Track append skill levels, including current and target values.
- Enter owned material quantities to see remaining deficits and bottlenecked items.
- Switch between single-servant mode and full-roster mode.
- View a combined shopping list for all tracked servants.
- Import and export inventory data as JSON from the browser.
- Persist tracker state, inventory, and fetched servant data in `localStorage`.
- Sign up and sign in with a Supabase email/password account.
- Sync tracker state and inventory to the signed-in account.

## Getting Started

Access the website at [https://fgo-tracker-kohl.vercel.app/](https://fgo-tracker-kohl.vercel.app/).

## Deploying to Vercel

This is a static frontend and does not require a build command.

1. Import the repository into Vercel.
2. Choose **Other** as the Framework Preset, or leave the framework unset.
3. Leave the Build Command blank.
4. Use the project root as the Output Directory.
5. Deploy the project.

The included [`vercel.json`](./vercel.json) adds production security headers.

## How to Use

- Search for a servant in the top panel.
- Use the region filter to show all servants, NA servants only, or JP-only servants.
- Select a result to add it to the tracker.
- Use the tabs to switch between tracked servants.
- Check off ascension stages that are already complete.
- Set the current skill and append skill levels for each servant.
- Adjust the target level for the skills you plan to raise.
- Update your owned quantity per material to see what remains to buy.
- In roster mode, select the combined tab to view the total shopping list across all tracked servants.
- Use the inventory export/import buttons to save or restore your stockpile as JSON.

## Data Source

Servant and material data is fetched from the [Atlas Academy API](https://api.atlasacademy.io/). The app uses the English JP servant list as its complete catalog, marks servants already released in North America (`NA`), and requests servant details from the appropriate NA or JP endpoint.

An internet connection is required the first time servant data is loaded. After that, cached data may remain usable offline depending on the browser's storage state.

## Project Structure

The project uses a lightweight feature-driven structure while remaining a static browser app with no build step:

| Path | Purpose |
| --- | --- |
| `index.html` | Application shell and page markup |
| `shared/styles.css` | Shared layout, colors, typography, and responsive styling |
| `features/servants/api.js` | Atlas Academy requests, region selection, and servant-data caching |
| `features/progression/materials.js` | Ascension, skill, append-skill, and combined material calculations |
| `features/tracker/state.js` | Tracker state, roster behavior, and persistence |
| `features/tracker/ui.js` | Rendering, search, controls, tab switching, and modal UI |
| `features/auth/config.js` | Public Supabase project configuration |
| `features/auth/auth.js` | Email/password authentication and cloud synchronization |
| `supabase/schema.sql` | User data table and row-level security policies |

## Local Storage

The tracker stores data in the browser under these keys:

- `cl_state` for selected servants, roster mode, and tracked progress
- `cl_inventory` for owned material quantities
- `cl_basic2` for the cached combined servant list and NA availability flags
- `cl_svt_<id>` for cached servant detail data

To reset the tracker, clear this site's local storage from your browser's developer tools.

## Supabase account setup

The account system uses Supabase Auth and a PostgreSQL table protected by Row Level Security (RLS).

### Configure Supabase

1. Create a Supabase project.
2. Open the Supabase SQL Editor and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Confirm that the `user_data` table has RLS enabled and policies for select, insert, update, and delete.
4. Open Authentication > Providers and enable **Email**.
5. Choose whether new accounts must confirm their email address.
6. Open Project Settings > API and copy the project URL and public publishable/anon key into [`features/auth/config.js`](./features/auth/config.js):

   ```js
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-public-anon-key';
   ```

7. In Authentication > URL Configuration, set the Site URL to your Vercel URL.
8. Add the Vercel URL to the Redirect URLs list.
9. Deploy or redeploy the project on Vercel.

The **Sign in** button becomes available after both configuration values are present.

Only the public publishable/anon key belongs in `config.js`. Never use a Supabase service-role key in frontend code.

### Account behavior

- A user can create an account or sign in from the **Sign in** button.
- On first sign-in, existing local tracker data is migrated if the account has no saved cloud data.
- Once signed in, tracker state and inventory are saved to both local storage and the user's Supabase row.
- Returning users load their saved cloud state after authentication.
- Signing out stops cloud synchronization but does not delete local browser data.
- **Reset all data** clears local data and deletes the signed-in user's cloud row.
- If Supabase is unavailable or not configured, the app continues using local storage.

### Testing the integration

1. Create a test account from the app.
2. Confirm the account email if email confirmation is enabled.
3. Add a servant and change an inventory quantity.
4. Sign out, then sign in again.
5. Confirm that the servant and inventory are restored.
6. Test with a second account to confirm it cannot see the first account's data.

## Security

- Imported inventory JSON is checked for a plain object, numeric material IDs, and non-negative integer quantities.
- Saved tracker state is normalized before use so malformed or stale `localStorage` data cannot set arbitrary values.
- API and imported values are escaped before HTML rendering, and remote image URLs are restricted to HTTPS.
- Production deployments on Vercel receive a Content Security Policy and standard browser security headers from `vercel.json`.
- Passwords are handled by Supabase Auth; the application never receives or stores password hashes. Supabase's browser client stores its session locally so it can maintain the sign-in state. Do not store API secrets or other sensitive data in this client-side application.
- Keep `.env` files and local logs out of version control; `.gitignore` includes these patterns.

## Notes

This project is an unofficial fan-made tool and is not affiliated with or endorsed by Aniplex, Delightworks, TYPE-MOON, or Lasengle. Fate/Grand Order and all servant names, art, and game data are the property of their respective owners.