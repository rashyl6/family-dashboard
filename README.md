# Our Week — Family Dashboard

A living family dashboard for a family of 5.
**Claude maintains it.** You do zero coding or manual file work.

---

## How to Use

### Viewing the dashboard

- **Locally:** Open `index.html` in any browser. Password: see family.
- **Live site:** https://rashyl6.github.io/family-dashboard/ (password protected)

### Adding photos

1. Drop photo files (JPG, PNG, WEBP) into the `photos/` folder
2. Update `photos/manifest.json` with the filenames:
   ```json
   { "photos": ["photo1.jpg", "holiday2025.jpg"] }
   ```
3. Refresh — slideshow appears automatically

### Weekly update (Claude does this)

Say **"Let's do the Monday update"** or **"Let's do the Friday update"** and Claude will:
1. Read Gmail — school emails (Unikum, Tempus), invites, anything relevant
2. Read Google Calendar — all family calendars for the next 2 weeks
3. Review `knowledge/family-memory.md`
4. Update all JSON files in `data/`
5. Write the weekly narrative in `data/narrative.json`
6. Push to GitHub → live in ~60 seconds
7. Update `knowledge/family-memory.md` with any new facts

---

## Integrations (all automatic)

| Source | What we get | How |
|--------|-------------|-----|
| Google Calendar | All events (Family, Klara, Maria, Rasmus work, Swedish holidays) | claude.ai native |
| Gmail | Unikum school notifications, Tempus förskola alerts, invites | claude.ai native |

**If Gmail or Calendar stops working:** type `/mcp` in Claude Code → click the broken integration → re-authenticate. Takes 30 seconds.

---

## File Structure

```
family-dashboard/
├── index.html              # Dashboard (open in browser)
├── style.css               # Design
├── script.js               # Logic — reads JSON, renders UI
├── data/
│   ├── config.json         # Family name, kids, colours
│   ├── narrative.json      # Claude's weekly summary
│   ├── calendar.json       # This week's events
│   ├── homework.json       # Kids' homework tasks
│   ├── exams.json          # Upcoming exams/prov
│   ├── family.json         # Adult social plans
│   ├── admin.json          # House/admin reminders
│   ├── routines.json       # Family rituals
│   └── saved.json          # Quotes, memories, notes
├── photos/
│   ├── manifest.json       # List of photo filenames
│   └── [your photos]
├── knowledge/
│   └── family-memory.md    # Claude's long-term knowledge base
└── README.md               # This file
```

---

## Data Files — Quick Reference

### `data/config.json`
Family name and kid colours. Edit once, never touch again.

### `data/narrative.json`
Claude's weekly text. Replaced each update.

### `data/calendar.json`
Events for the next 7 days. Claude pulls from Google Calendar automatically.

### `data/homework.json`
Kids' tasks. Set `"done": true` when completed.

### `data/exams.json`
Upcoming prov/exams with countdown.

### `data/admin.json`
House reminders with countdowns (dentist, car service, insurance etc).

### `data/routines.json`
Family rituals displayed permanently.

### `data/saved.json`
Quotes, memories, notes. Tell Claude to add something → it appears in the dashboard.

---

## Kid Colours

| Kid    | Age | Colour    | Hex       |
|--------|-----|-----------|-----------|
| Klara  | 10  | Purple    | `#7B5EA7` |
| Ebbe   | 8   | Blue      | `#2E86AB` |
| Lo     | 5   | Orange    | `#F4845F` |
| Adults | —   | Slate     | `#4A5568` |

---

## Security

Simple JS password gate — stops casual access, not determined attackers.
For stronger security, migrate to Netlify with server-side basic auth.

---

*Maintained by Claude · Last updated 2026-03-06*
