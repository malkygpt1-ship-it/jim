# Good Foundations Estimator — Prototype

Static browser prototype reverse-engineered from `gf3072.xlsx`.

## Included
- Customer/job details and estimate reference
- Searchable material and tool price lookup
- Labour hours, cost/hour and sell/hour
- Discount and quotation total
- Forecast gross profit and gross margin
- Material order list
- Browser-local draft saving and estimate archive
- Print / Save as PDF using the browser print dialog
- Mobile/Chromebook-friendly layout
- Vercel-ready static deployment

## Drive archive target
Planned Google Drive destination:
`1ew0mAy6Y7POX2TaWiPMErjIoJZxnGWSj`

The current static test build saves estimate records in browser `localStorage`. Direct Google Drive PDF/archive saving will be wired in once authentication/storage architecture is finalised.

## Workbook logic mirrored
The original workbook uses material sell prices, tool prices and labour hours × sell/hour, then applies the quote discount. Forecast margin uses material/tool cost prices plus labour hours × cost/hour.

## Prototype price book
The original workbook contains 565 material rows and 251 tool-hire rows. This first GitHub test deployment contains a representative subset of the extracted price book while the app workflow is tested. The full workbook catalogue remains preserved in the source prototype and can be migrated into the production database/storage layer.

## Deployment
Import this repository into Vercel with the repository root as the project root. No build command or environment variables are required for this static prototype.

## Production next steps
Before business use: add authentication, server-side estimate/customer storage, automatic PDF archiving, Google Drive backup, and the full workbook price catalogue.
