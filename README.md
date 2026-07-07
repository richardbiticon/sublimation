# All Volleyball — Sublimation Landing Pages

Two static landing pages for All Volleyball's custom sublimated jersey program.
No build step — plain HTML, Tailwind via the Play CDN, and one shared stylesheet.

## Pages

| File | Purpose | Primary CTA | Secondary CTA |
| --- | --- | --- | --- |
| [`index.html`](index.html) | **CustomFuze** — the house line. Heavy focus on the 30-day guarantee, no brand-vs-brand comparison. | Request a CustomFuze Quote | View the Premium Brands |
| [`premium-brands.html`](premium-brands.html) | **Premium Brands** — Adidas, ASICS, Mizuno, Under Armour, with the full multi-brand comparison. | Request a Premium Brand Quote | View CustomFuze |

Each page always surfaces **both CTAs** — in the top nav, the hero, and the closing section — so a visitor can either start that page's quote or jump to the other page.

## Structure

```
index.html            CustomFuze landing (site entry point)
premium-brands.html   Premium brands landing
assets/styles.css     Shared styles for both pages
AVB Sublimate Page.html   Original single-page source (kept for reference)
```

## Notes

- **CustomFuze page** keeps a *general* "CustomFuze vs. major brands" table (lead time, minimums, etc.) but no brand-by-brand detail — that lives on the premium page.
- **Premium page** owns the brand tab switcher, per-brand products/timeline, and the four-brand comparison matrix.
- The interactive timeline calendar computes dates relative to today, per selected brand.
- Product images and brand logos load from the Shopify CDN; each product card falls back to a text tile if an image fails.
- Tailwind is loaded from the Play CDN for prototyping. For production (e.g. a Shopify port) compile Tailwind from source instead.

## Running locally

Any static file server works, e.g.:

```bash
python -m http.server 8080
# then open http://localhost:8080/
```

## Deploying to GitHub Pages

1. Push these files to a repo.
2. In **Settings → Pages**, set the source to the `main` branch (root).
3. `index.html` is served as the site root.
