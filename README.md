# Marvel Live Action Timeline — editable website

This is a fan-made chronological Marvel timeline built from the supplied PDF.

## What you get

- 136 timeline entries from the supplied 142-page PDF
- Poster artwork extracted from the PDF
- Search
- Era and universe filters
- Timeline/release/title/rating sorting
- Responsive mobile design
- Admin login
- Admin-only editing
- Public read-only view
- Optional personal ratings and notes
- Free hosting with GitHub Pages
- Free database/auth with Supabase

## The free architecture

**GitHub Pages** hosts the HTML/CSS/JavaScript and poster images.

**Supabase Free** stores the editable timeline and handles admin authentication.

GitHub Pages is available with GitHub Free for public repositories. Supabase currently offers a Free plan with a Postgres database and Auth; its free projects can pause after a week of inactivity, so a hobby site may occasionally need to wake up again.

## Setup

### 1. Create a Supabase project

Create a free project at https://supabase.com/

In Supabase:
1. Open **SQL Editor**.
2. Open `supabase.sql`.
3. Replace every occurrence of `YOUR_ADMIN_EMAIL` with the email address you will use for the site's admin account.
4. Run the SQL.

### 2. Create your admin account

Upload the site first or use the local site.

Click **Admin Login → Create account** and use the same email you placed in the SQL policy.

If email confirmation is enabled, confirm the email before signing in.

### 3. Add the Supabase browser config

Copy:

`config.example.js` → `config.js`

Then put in:
- your Supabase project URL
- your Supabase anon/publishable key
- your admin email

The anon/publishable key is intended for browser use. **Never put a Supabase service_role/secret key in this site.**

### 4. Put the site on GitHub Pages

Create a public GitHub repository and upload:
- `index.html`
- `styles.css`
- `app.js`
- `data.js`
- `config.js`
- `assets/`
- `supabase.sql` (optional; it does not need to be published)

Then enable **Settings → Pages** and publish from the repository branch.

Your site will get a free `github.io` address.

### 5. Import the timeline

Log into the live site as the admin.

If the database is empty, an **Import 136 entries** button appears. Click it once.

After that:
- visitors see the database version
- you see the Edit Entry buttons
- changes are saved online
- everyone sees your changes

## Editing

Each entry lets you edit:
- title
- release year
- chronological placement
- universe
- description bullets
- rating /10
- poster path or URL
- admin notes

## Important

The current timeline data is deliberately based on the supplied PDF rather than silently changing its chronology or terminology. The PDF itself says the timeline is primarily chronological, allows different universes to appear together when they meaningfully connect to the wider Marvel multiverse, and uses release order/narrative relevance where chronology cannot reliably be established.

The site is a fan project and is not affiliated with Marvel, Marvel Studios, Disney, Sony Pictures or other rights holders.
