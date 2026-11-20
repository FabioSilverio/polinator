# POLINATOR

Live dashboard that shows where a US traveler's vacation dollar goes furthest right now.

- **Map of the US**: each state's top international destinations (InsureMyTrip, 2025 travel-insurance purchases) and the best-value city among them today.
- **Live FX**: daily rates from [fawazahmed0/exchange-api](https://github.com/fawazahmed0/exchange-api) with 24 months of history, plus [ExchangeRate-API](https://www.exchangerate-api.com) as a fallback. A 12-month replay shows how the ranking moved.
- **Research**: recent search-trend and survey lists (eDreams, Google Flights, Nomad eSIM, InsureMyTrip) and a consensus "most desired" index.
- **Ranking**: 63 cities scored 0–100 (effective cost, real FX gain, 3-month momentum, trend signals), with estimated daily and 7-day trip prices in US$ and Google Maps links.

Live at https://polinator.vercel.app

## Stack

Static site: `index.html`, `styles.css`, `app.js`, `data.js`. D3 + topojson from jsDelivr, Inter and JetBrains Mono from Google Fonts. No build step.

```sh
npx serve .        # or any static server
vercel deploy --prod
```

## Notes

The cost index, inflation figures (except Turkey and Argentina, official Oct 2026 data), daily-spend baseline and airfares are rounded estimates, explained in the page's "Método" section. Not financial advice.
