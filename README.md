# Our Week — Family Dashboard

A living family dashboard for a family of 5.
**Claude maintains it.** You do zero coding or manual file work.

---

## How to Use

### Viewing the dashboard

- **Locally:** Open `index.html` in any browser. Works instantly.
- **Live site:** Push to GitHub → enable GitHub Pages → access at `https://[username].github.io/family-dashboard/`

### Adding photos

1. Drop photo files (JPG, PNG, WEBP) into the `photos/` folder
2. Create or update `photos/manifest.json` listing the filenames:
   ```json
   { "photos": ["photo1.jpg", "holiday2025.jpg", "klara-birthday.jpg"] }
   ```
3. Refresh the page — slideshow appears automatically

### Monday update (Claude does this)

Every Monday, Claude:
1. Reads Gmail (school emails, invites, anything relevant)
2. Reads Google Calendar (next 2 weeks)
3. Reviews `knowledge/family-memory.md`
4. Chats with you about anything not in email/calendar
5. Updates all JSON files in `data/`
6. Writes the weekly narrative in `data/narrative.json`
7. Pushes to GitHub → site is live in ~30 seconds
8. Updates `knowledge/family-memory.md` with any new facts

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
│   ├── exams.json          # Upcoming exams
│   ├── family.json         # Adult social plans
│   ├── admin.json          # House/admin reminders
│   ├── goals.json          # Family goals + progress
│   ├── routines.json       # Family rituals
│   └── saved.json          # Quotes, memories, notes
├── photos/
│   ├── manifest.json       # List of photo filenames
│   └── [your photos]       # Add photos here
├── knowledge/
│   └── family-memory.md    # Claude's long-term knowledge base
└── README.md               # This file
```

---

## Data Files — Quick Reference

### `data/config.json`
Family name and kid colours. Edit once, never touch again.

### `data/narrative.json`
Claude's weekly text. Replaced every Monday.
```json
{
  "week": "2026-03-02",
  "updatedAt": "2026-03-04",
  "text": "Your narrative here..."
}
```

### `data/calendar.json`
Events for the 7-day strip. Claude pulls from Google Calendar.
- `date`: YYYY-MM-DD
- `who`: person name or "Family"
- `color`: hex code (use kid/adult colours from config)

### `data/homework.json`
Kids' tasks. Set `"done": true` when completed.

### `data/exams.json`
Upcoming exams with countdown. Claude adds from school emails.

### `data/family.json`
Social plans, date nights, weekend activities.

### `data/admin.json`
House reminders with countdowns. Claude tracks service intervals automatically.
- `remind_months_before`: how early to flag it as upcoming

### `data/goals.json`
Progress bars. Claude updates `current` values weekly.
- `target` and `current` are numbers
- `unit` is the label (kr, books, rides, etc.)

### `data/routines.json`
Family rituals displayed permanently. Rarely changes.

### `data/saved.json`
Quotes, memories, notes. You tell Claude to add something → it appears in the dashboard.
- `type`: "quote", "memory", or "note"
- `attribution`: optional, for quotes

---

## GitHub Pages Setup (one-time)

1. Create a GitHub repo (can be private)
2. Push all files to the `main` branch
3. Go to repo Settings → Pages → Source: `main` branch, root `/`
4. Site is live at `https://[username].github.io/family-dashboard/`

To let Claude push automatically:
1. Create a Personal Access Token (GitHub → Settings → Developer Settings → Fine-grained tokens)
2. Permissions: `Contents` (read + write), `Pages` (read + write)
3. Add the GitHub MCP to Claude Code:
   ```
   claude mcp add github -e GITHUB_TOKEN=<your_token> -- npx -y @modelcontextprotocol/server-github
   ```

---

## Kid Colours

| Kid    | Age | Colour    | Hex       |
|--------|-----|-----------|-----------|
| Klara  | 10  | Purple    | `#7B5EA7` |
| Ebbe   | 8   | Blue      | `#2E86AB` |
| Lo     | 5   | Orange    | `#F4845F` |
| Adults | —   | Slate     | `#4A5568` |

---

## Trigger Phrase for Updates

Just say: **"Let's do the Monday update"** and Claude will:
- Read your calendar and Gmail
- Ask about anything else happening this week
- Update all data files
- Write the new narrative
- Push to GitHub

---

*Maintained by Claude · Last updated 2026-03-04*
