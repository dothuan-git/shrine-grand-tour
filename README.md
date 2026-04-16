# Shrine Grand Tour

An archival guide to Japan's sacred shrines and temples. Explore 102 shrines through historical lore, deity mythology, and regional significance with interactive filtering.

## Features

- **Full-text search** across deity names, shrine names, locations, and lore
- **Regional filtering** (9 regions: Hokkaido to Okinawa)
- **Prefecture filtering** (dynamic list based on region)
- **Shrine type classification** (Sohonsha, Major, Notable, Complex, Temple)
- **Responsive design** — optimized for 2K displays and mobile

## Project Structure

```
shrine-grand-tour/
├── index.html              # Main HTML entry point
├── style.css               # All styling (design tokens, responsive layout)
├── app.js                  # JavaScript app logic (data fetching, filtering, rendering)
├── shrines_meta.json       # Structural shrine data (102 entries)
├── shrines_detail.json     # Long-form editorial content (102 entries)
├── shrine_events.json      # Festival and ceremony data (sparse)
├── vercel.json             # Vercel deployment config (caching headers)
└── README.md
```

## Live Demo

Visit the live site: **[https://shrine-grand-tour.vercel.app/](https://shrine-grand-tour.vercel.app/)**

The app is deployed on Vercel with automatic deployments on every git push to the main branch.

## Local Development

### Prerequisites
- Node.js (for `npx serve`)

### Running Locally

```bash
npx serve --listen 3000
# Open http://localhost:3000 in your browser
```

**Note:** The app requires a local server to load JSON data. Direct `file://` opens will fail.

## Data Schema

Shrine data is split across three JSON files linked by `id` / `shrine_id`.

---

### `shrines_meta.json`

Structural and filterable fields. One entry per shrine.

```jsonc
{
  "id": 1,                                              // Primary key
  "shrine": "Ise Jingū — Naikū (Inner Shrine)",        // Full shrine name
  "deities": [
    {
      "name": "Amaterasu Ōmikami",                      // Deity name in romaji
      "kanji": "天照大御神",                             // Deity name in kanji (omit if none)
      "domain": "Goddess of the Sun, Heaven & ...",    // Deity's powers and domain
      "title": "..."                                    // Human identity if applicable (omit if none)
    }
  ],
  "location": "Ise, Mie",     // "City, Prefecture"
  "region": "kansai",         // hokkaido · tohoku · kanto · chubu · kansai · chugoku · shikoku · kyushu · okinawa
  "type": "Sohonsha",         // Sohonsha · Complex · Major · Notable · Temple
  "address": ""               // Street address (for future map integration)
}
```

---

### `shrines_detail.json`

Long-form editorial content. Linked to `shrines_meta.json` via `shrine_id`.

```jsonc
{
  "shrine_id": 1,                                   // Foreign key → shrines_meta.id
  "deity_lore": "Supreme goddess of the heavens...", // Mythology and divine background specific to this shrine and this area
  "shrine_lore": "The sacred mirror Yata no...",    // Historical and legendary details of this shrine
  "why_visit": "Japan's most sacred Shinto site...", // Practical notes on significance and visitor experience
  "best_time_to_visit": "Early morning any season...", // Seasonal and event-based visit guidance
  "prayer_focus": "All sincere prayers..."          // Primary purposes pilgrims pray for here
}
```

---

### `shrine_events.json`

Festival and ceremony data. Sparse — only shrines with notable events have entries.

```jsonc
{
  "id": 1,         // Foreign key → shrines_meta.id
  "shrine": "...", // Shrine name (denormalized for display)
  "deity": "...",  // Primary deity name (denormalized for display)
  "events": [
    {
      "name": "Grand Harvest Offering Festival (神嘗祭, Kannamesai)",
      "time": "October 15–25",  // When it occurs
      "origin": "...",          // Historical and mythological origin of the event
      "meaning": "...",         // Spiritual and cosmological significance
      "ritual": "...",          // What actually happens during the ceremony
      "prayer": "...",          // What participants pray for
      "type": {
        "category": "public_witness", // public_witness · pilgrimage_experience
        "notes": "..."                // Practical visitor guidance
      }
    }
  ]
}
```

---

## Deployment

Deployed on Vercel with automatic updates on every push to `main`. Cache policy via `vercel.json`:
- **shrines_meta.json / shrines_detail.json**: 1-day cache + 7-day stale-while-revalidate
- **CSS / JS**: 1-year immutable cache (purged on each deploy)

## Browser Support

Chrome/Edge, Firefox, Safari (all latest) · Mobile browsers

## License

2026 · Grand Shrine Tour of Japan
