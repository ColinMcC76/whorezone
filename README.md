# MCWhoreZone Website

This repository contains the source code for **MCWhoreZone**, a playful Minecraft community website built with **Vite** and **React Router**.  
It uses a dark theme with a red accent, card‑based layouts and responsive design.  
The site features a hero banner, benefits grid, server information, gallery, FAQ preview and a final call‑to‑action on the home page.  
Additional pages include **About**, **Servers**, **Shabbot**, **FAQ** and **Contact**.

## Getting Started Locally

1. Install dependencies (requires Node.js and npm):

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   The site will be served at `http://localhost:5173` by default. Vite supports hot module replacement, so changes will reload automatically.

3. Build for production:

   ```bash
   npm run build
   ```

   This generates static files in the `dist` directory.

4. Preview the production build locally:

   ```bash
   npm run preview
   ```

## Deployment to GitHub Pages

This project is configured with a deployment script that uses the [`gh-pages`](https://github.com/tschaub/gh-pages) package. To deploy:

1. Ensure you have a GitHub repository created and that you have push access.  
2. Update the `homepage` field in `package.json` (e.g. `"homepage": "https://your-username.github.io/repository-name"`) and the `base` field in `vite.config.ts` (e.g. `base: '/repository-name/'`).  
3. Commit your changes and push them to the `main` branch.

4. Publish the site by running:

   ```bash
   npm run deploy
   ```

   This script builds the project and pushes the contents of the `dist` folder to the `gh-pages` branch. GitHub Pages will automatically serve the site from that branch.

### Custom Domain

If you want to use a custom domain (e.g. `mcwhorezone.com`), create a file named `CNAME` in the root of the `dist` folder containing just your domain name.  
When deploying via `gh-pages`, the file will be published and GitHub Pages will configure the custom domain for you.

## Configuration

Server addresses, versions and social links are centralised in `src/config/siteConfig.ts`.  
Update the values there when your IPs, ports or invite links change.

## Acknowledgements

This project uses **React Router** to handle client‑side navigation. React Router allows the application to update the view without reloading the entire page, providing a seamless experience for users【94302198689173†L80-L90】.  
Feel free to adapt and expand this project to suit your community’s needs.