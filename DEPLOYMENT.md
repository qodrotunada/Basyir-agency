# Deployment notes

## Local development

1. Install Node.js 20 or later.
2. Open this folder in a terminal.
3. Run `npm install`.
4. Run `npm run dev` and open the local URL shown in the terminal.

## Static hosting

This prototype has no server API. Build the static site with `npm run build`, then deploy the generated `dist/` directory to a static host such as Netlify, Vercel, Cloudflare Pages, or any static web server.

- Build command: `npm run build`
- Publish directory: `dist`
- No environment variables are required.
- No backend URL is required.

## Data and deployment caveat

Browser storage belongs to the site origin and the current browser/device. Moving from localhost to a hosted domain will not automatically move localStorage or sessionStorage. Export a JSON backup before changing domains, then import it on the new origin.
