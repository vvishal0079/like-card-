# Resume / Portfolio Website

Responsive portfolio built with HTML, CSS and JavaScript.

## Features
- Navbar with links to all sections (Home, About, Skills, Projects, Resume, Contact, Admin)
- Contact Me form with validation
- Responses stored as JSON (localStorage) or in Google Sheets via Apps Script
- Admin login (show/hide with CSS + JavaScript) that reveals a User Responses section with timestamps
- Light / Dark theme toggle
- Deployed with GitHub Pages

## Run locally
Open `index.html` in Chrome.

## Google Sheets setup
1. Create a Google Sheet, then Extensions > Apps Script.
2. Paste `apps-script/Code.gs`, then Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).
3. Paste the Web app URL into `SCRIPT_URL` in `script.js`.

## Live demo
https://YOUR-USERNAME.github.io/portfolio-website/

## Admin login (demo only)
username: `admin` / password: `admin123` (change in `script.js`)
