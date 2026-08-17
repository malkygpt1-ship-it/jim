# Good Foundations Estimator

Browser-based estimating app reverse-engineered from the original Good Foundations workbook and expanded into a current materials, tools, quotation and purchasing workflow.

## Included
- Customer/job details and estimate reference
- Searchable material and tool cost books
- Material trade discount and customer markup controls
- Tool cost markup controls
- Labour calculation and customer quote discount
- Bill of materials with internal cost, quoted value and profit
- Material purchase list with trade discount and dedicated PDF
- Editable price-book costs from inside an estimate
- Browser-local working draft recovery
- Private saved-estimate archive with paired Quote + BOM PDFs
- Newest-first Archive modal with Open / Print links for both PDFs
- Mobile/Chromebook-friendly layout
- Vercel deployment

## Private estimate archive
Saved estimates use a **Private Vercel Blob store** attached to the Vercel project. Every deliberate `Save estimate` action writes exactly two customer/job documents under the `estimates/` prefix:

- `quote.pdf`
- `bom.pdf`

The automatic working draft remains in browser local storage so an unfinished quote can recover after a refresh, but the permanent Archive is server-side.

### One-time Vercel setup
In the `goodfoundsestimator` Vercel project:
1. Open **Storage**.
2. Create a **Blob** store.
3. Set access to **Private**.
4. Connect it to Production (and Preview too if wanted).

Vercel adds the required `BLOB_READ_WRITE_TOKEN` to the project automatically when the store is connected.

Optional: set `GF_USERNAME`, `GF_PASSWORD`, and `GF_SESSION_SECRET` as Vercel environment variables to replace the legacy login credentials and use a dedicated session secret. The archive API itself is protected by the server session cookie and the Blob store remains private.

## Catalogue
The original workbook contains 565 material rows and 250 tool-hire rows. The full catalogue is loaded by the app, with current supplier enrichment and cost updates where verified.

## Deployment
The repository is connected to Vercel and production is deployed from `main`.
