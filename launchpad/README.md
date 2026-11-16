# Launchpad

A mobile-friendly startup planning workspace.

## Current features
- Idea prompts based on interests and budget
- Seven-day business plan builder
- Brand name suggestions
- Social content prompts
- Launch checklist saved in the current browser
- Optional Supabase email sign-in and cloud saving for plans/checklist

## Deploy
This project is deployed with GitHub Actions to GitHub Pages.
In the repository settings, open **Pages** and set the build and deployment source to **GitHub Actions**. The workflow in `.github/workflows/deploy-launchpad.yml` will then publish the contents of this folder when the `launchpad` branch is updated.

Expected site URL:
https://ahmadzshan999-hub.github.io/ULTRON/

## Supabase
The browser uses the public publishable key in `supabase-config.js`. This key is intended for browser use. Never add a service-role key or Supabase secret to this folder.

Email sign-in redirects back to the site. Add the expected site URL above to Supabase Authentication URL Configuration (Site URL and Redirect URLs) after GitHub Pages is enabled.

The database uses Row Level Security so authenticated users can access only their own Launchpad rows.

## Current limitations
The generators use built-in starter suggestions, not a hosted AI model. No payment processing or paid features are enabled. Review provider usage and pricing before enabling any third-party service.
