# RimWorld Universal Blueprint Library (Web)

This is the remote web frontend for the RimWorld Universal Blueprint Library.

## Features
- Displays a grid of blueprints with thumbnail, metadata, and statistics.
- Sort by popularity, newest, downloads, likes, featured, and medals.
- Filter by time range and category.
- Search by name or author.
- View detailed blueprint information dynamically fetched from XML files.
- Full-screen image viewer.
- Responsive design for mobile and desktop.

## Deployment
This project is designed to be deployed to GitHub Pages.

1. Ensure the `base` in `vite.config.ts` matches your repository name (e.g., `/Universal-Blueprints-Web/`).
2. Push to the `main` branch.
3. The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically build and deploy to GitHub Pages.

## Development
```bash
npm install
npm run dev
```

## Data Source
It expects an `index.json` file to be present in the deployment root or fetches it remotely as a fallback. Detail data is loaded dynamically from XML files listed in `index.json`.
