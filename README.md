# Shrine Grand Tour

An archival guide to Japan's sacred shrines and temples. Explore 102 shrines through historical lore, deity mythology, and regional significance with interactive filtering.

## Features

- **Full-text search** across deity names, shrine names, locations, and lore
- **Regional filtering** (9 regions: Hokkaido to Okinawa)
- **Prefecture filtering** (dynamic list based on region)
- **Shrine type classification** (Sohonsha, Major, Notable, Complex, Temple)
- **Responsive design** — optimized for 2K displays and mobile
- **Searchable data** — easily update shrine information in `shrines_v2.json`

## Project Structure

```
shrine-grand-tour/
├── index.html           # Main HTML entry point
├── style.css            # All styling (design tokens, responsive layout)
├── app.js               # JavaScript app logic (data fetching, filtering, rendering)
├── shrines_v2.json      # Shrine data (102 entries, easily updatable)
├── vercel.json          # Vercel deployment config (caching headers)
└── README.md
```

## Local Development

### Prerequisites
- Node.js (for `npx serve`)

### Running Locally

```bash
# Install dependencies (if needed)
npm install -g serve

# Start local server
npx serve --listen 3000

# Open http://localhost:3000 in your browser
```

**Note:** The app requires a local server to load the JSON data file. Direct `file://` opens will fail.

## Updating Shrine Data

Edit `shrines_v2.json` directly. Each shrine entry has these fields:

```json
{
  "deity": "Amaterasu",
  "title": "—",
  "domain": "Goddess of the Sun, Heaven & Imperial ancestry",
  "shrine": "Ise Jingū (Naikū — Inner Shrine)",
  "place": "Ise, Mie",
  "region": "kansai",
  "type": "Sohonsha",
  "why_visit": "Japan's most sacred Shinto site...",
  "deity_lore": "Supreme goddess of the heavens...",
  "shrine_lore": "The sacred mirror Yata no Kagami..."
}
```

- `deity` — Name of the deity or divine figure
- `title` — Human historical identity if applicable (e.g., "Emperor Meiji"), or "—"
- `domain` — Short description of the deity's powers and domains
- `shrine` — Full name of the shrine, often with romanized reading in parentheses
- `place` — City/town and prefecture (e.g., "Ise, Mie"). Some entries are prefecture-only.
- `region` — One of: `hokkaido`, `tohoku`, `kanto`, `chubu`, `kansai`, `chugoku`, `shikoku`, `kyushu`, `okinawa`
- `type` — One of: `Sohonsha`, `Complex`, `Major`, `Notable`, `Temple`
- `why_visit` — Practical notes on significance and visitor experience
- `deity_lore` — Long-form mythology and divine background
- `shrine_lore` — Historical and legendary details of the specific shrine

After editing, save and refresh your browser — the app will fetch the updated data on next load.

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect your GitHub repo to Vercel for automatic deploys on git push
```

The project deploys as a static site with zero build steps. `vercel.json` configures optimal caching:
- **shrines_v2.json**: 1-day cache + 7-day stale-while-revalidate (large file, occasionally updated)
- **CSS/JS**: 1-year immutable cache (purged on each deploy)

### Other Hosts

Works on any static file host (GitHub Pages, Netlify, etc.). Just ensure all three files (`index.html`, `style.css`, `app.js`, `shrines_v2.json`) are deployed to the same directory.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (responsive layout)

## License

2026 · Grand Shrine Tour of Japan
