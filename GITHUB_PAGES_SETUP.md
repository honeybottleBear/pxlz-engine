# PXLZ Engine — GitHub Pages Deployment Guide

PXLZ Engine is now configured to work with GitHub Pages. Follow these steps to deploy:

## Prerequisites

- A GitHub repository (public or private)
- Git installed locally
- Node.js and pnpm installed

## Setup Instructions

### 1. Clone or Create Your Repository

```bash
# If creating a new repo:
git init
git remote add origin https://github.com/YOUR_USERNAME/pxlz-engine.git
git branch -M main
```

### 2. Build for GitHub Pages

```bash
# Build the project for GitHub Pages (sets base path to /pxlz-engine/)
pnpm build:github-pages
```

This creates a `dist/public/` directory with all static files ready for deployment.

### 3. Deploy to GitHub Pages

#### Option A: Using GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build:github-pages
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist/public
          cname: (optional: your custom domain)
```

#### Option B: Manual Deployment

```bash
# Build for GitHub Pages
pnpm build:github-pages

# Create a gh-pages branch if it doesn't exist
git checkout --orphan gh-pages

# Add the built files
git add dist/public/
git commit -m "Deploy to GitHub Pages"

# Push to GitHub
git push origin gh-pages

# Go back to main branch
git checkout main
```

### 4. Configure GitHub Pages Settings

1. Go to your repository on GitHub
2. Settings → Pages
3. Under "Build and deployment":
   - **Source**: Select "Deploy from a branch"
   - **Branch**: Select `gh-pages` (or `main` if using GitHub Actions)
   - **Folder**: Select `/ (root)`
4. Click Save

### 5. Access Your Engine

Your PXLZ Engine will be available at:
- `https://YOUR_USERNAME.github.io/pxlz-engine/`

## Important Notes

- **Base Path**: The engine is configured with a base path of `/pxlz-engine/`. If you use a custom domain, you may need to adjust this.
- **404 Handling**: The `404.html` file handles client-side routing for single-page applications.
- **Asset Paths**: All assets are automatically resolved relative to the base path.

## Custom Domain (Optional)

If you have a custom domain:

1. Update the base path in `vite.config.ts` if needed
2. Add a `CNAME` file to `client/public/` with your domain name
3. Configure DNS records pointing to GitHub Pages

## Troubleshooting

- **Blank page**: Check browser console for 404 errors. Verify the base path matches your repository name.
- **Assets not loading**: Ensure all asset paths use relative URLs or the `import` statement.
- **Routing issues**: The `404.html` file should handle all SPA routing automatically.

## Development

For local development, use:

```bash
pnpm dev
```

This runs the engine at `http://localhost:3000/` without the base path.

## Building for Production (Manus Hosting)

If deploying to Manus instead of GitHub Pages:

```bash
pnpm build
```

This creates a full production build without the GitHub Pages base path.
