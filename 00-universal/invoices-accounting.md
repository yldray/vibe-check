# Invoices and accounting

Only if the app issues, reads or matches invoices, or exports entries to an accounting system (e-invoice / UBL, VAT fields, OCR of receipts, journal or ledger exports). Duplicate document numbers are in `UNI-020`, fuzzy supplier matching in `UNI-016`, file imports in `QA-017`.

### INV-001 · Amounts with and without tax compared as if they were the same
**Severity:** P1
**Why it breaks:** An invoice total includes tax; the catalog or contract price doesn't. AI compares whichever amount field is nearest, so exact matches fail the tolerance check, real overcharges hide inside the tax difference, and one screen shows gross while the next shows net with no label. The tolerance itself is defined in several places with different values.
**How to test:** Match invoices whose net amount equals the catalog price at each tax rate, a zero-rated one and one with mixed rates; then open every screen and export that shows the amount.
**Pass:** Net is compared with net (or gross with gross); every amount is labelled gross or net; one tolerance setting.
**Fix:** Store net, tax and gross separately per line; compare at the line level in one shared function; label amounts in the UI. See `UNI-025`.

### INV-002 · Credit notes, cancellations and other document types booked as invoices
**Severity:** P0
**Why it breaks:** AI models only the normal purchase or sales invoice. A credit note, a cancellation, a return invoice or a different receipt type (e.g. a freelancer's withholding-tax receipt) goes through the same path: it is matched, approved and posted as a new charge, or the cancelled invoice stays in the books.
**How to test:** Feed one of each document type the business receives or issues, including a cancellation of an already-posted invoice.
**Pass:** Each type is recognised from the document's own type field and routed separately (reversed, offset or set aside for a person), never posted as a normal invoice.
**Fix:** Read the type and scenario fields the e-invoice format carries; an explicit allow-list of types the automation may post; a reversal path for cancellations. See `PAY-005`.

### INV-003 · Documents already in the ledger are exported again
**Severity:** P0
**Why it breaks:** "Already posted" comes from the app's own status table, not from the accounting system. Documents the accountant keyed in by hand before the automation started, or through another channel, are offered again and posted twice; a second export of the same batch does the same.
**How to test:** Key one document into the accounting system by hand, then run the export; export the same batch twice.
**Pass:** Both are refused or flagged before download, with the reason.
**Fix:** An idempotency key per document (issuer tax ID + number + date) checked against what the accounting system already holds (import its list, or query it); mark items exported in the same transaction that builds the file. See `UNI-020`.

### INV-004 · Exported entries use account codes the accounting system rejects
**Severity:** P1
**Why it breaks:** The app keeps its own copy of the chart of accounts, taken once. The accountant later opens sub-accounts under a code, retires one or adds a supplier, so the exported entry points to a parent account that can't take postings, a code that doesn't exist, or a blank line, and the whole import is rejected.
**How to test:** Export an entry whose supplier has no account yet, one whose code became a parent account, and one with a retired code.
**Pass:** The export is blocked before the file is produced, naming the code and the fix; the accountant can map the code from the app.
**Fix:** Refresh the chart of accounts on a schedule (or before every export); validate that each code exists, is active and accepts postings; let the finance user set missing mappings in the UI.

### INV-005 · Entries dated with the wrong date
**Severity:** P1
**Why it breaks:** AI uses the nearest date field: the service date, the upload date or today, instead of the document date the tax period follows. Entries land in the wrong month, or in a period that is already closed.
**How to test:** A document dated after its service date and across a month boundary; one uploaded after the period closed.
**Pass:** The entry carries the date the accounting rules require, and a closed period is refused with a message.
**Fix:** One documented rule for each date (document, service, posting, due); validate against the open period. See `UNI-026`.

### INV-006 · Eligibility checked on the invoice date instead of the service date
**Severity:** P1
**Why it breaks:** Coverage, a contract price or a policy is checked on the date the invoice was issued. A service delivered while the coverage was valid but billed after it ended is rejected, or one delivered before the start date is accepted.
**How to test:** A service inside the valid period with an invoice issued after it ends, and the reverse.
**Pass:** Eligibility and price follow the service date; the invoice date only drives the accounting period.
**Fix:** Store the service date on every line and use it for eligibility and price lookups (see `UNI-041`).

### INV-007 · Amounts misread from documents
**Severity:** P0
**Why it breaks:** AI extracts amounts from PDF text or OCR with a regex that has no left boundary and handles one decimal convention. "12.500,00" becomes "500,00", "1,250.00" becomes "1.25", and a total is taken from the first number near the word "total".
**How to test:** Run documents with amounts above 10,000, with and without thousands separators, in both decimal conventions, and with several "total" labels (subtotal, tax, grand total).
**Pass:** Every amount is read in full; the line amounts plus tax add up to the total, and a document where they don't goes to a person.
**Fix:** Anchor the pattern to word boundaries; parse by locale; prefer the structured e-invoice XML over PDF text; cross-check lines, tax and total.

### INV-008 · Invoices addressed to someone else are accepted
**Severity:** P1
**Why it breaks:** The importer reads every document it receives and never checks that the buyer's tax ID or name is the company itself. An invoice issued to a sister company, a customer or a person is matched and posted.
**How to test:** Feed an invoice whose buyer is another company.
**Pass:** Refused or set aside with the reason "not addressed to us".
**Fix:** Check the buyer tax ID against the company's own list of IDs before any matching.

### INV-009 · The first real sale can't be invoiced
**Severity:** P1
**Why it breaks:** Checkout collects what the payment provider needs, not what an invoice needs: individual or company, tax ID and tax office, billing address. Nothing reaches whoever issues invoices, so the first live sale ends in a phone call to the customer.
**How to test:** Make one live purchase as an individual and one as a company; try to issue both invoices using only what the app stored and sent.
**Pass:** Both can be issued without contacting the buyer; finance gets each sale automatically (an e-mail, an export or an e-invoice integration).
**Fix:** Billing fields in checkout, validated by type; an order export or notification for finance. See `PAY-010`.

### INV-010 · One tax ID, several accounts
**Severity:** P1
**Why it breaks:** A supplier with many branches has one tax ID and a separate ledger account per branch. AI keeps one account per tax ID, so every branch is posted to the first one found or to a catch-all account, and the branch balances never reconcile.
**How to test:** Two branches under one tax ID, one invoice each.
**Pass:** Each invoice goes to its branch's account, or is held with "which branch?" when the document doesn't say.
**Fix:** Map tax ID plus branch (address, branch code) to an account; never fall back silently to a general account. See `UNI-016`.

## Before launch

- [ ] `INV-011` **P2** The revenue dashboard matches the bank: each order stores the provider's fee (including installment fees the merchant absorbs) and the payout date, so a month reconciles with the provider's settlement report
- [ ] `INV-012` **P1** Every document routed to manual review shows a stored reason code, and the score or confidence on screen is the one that decided (see `UNI-039`)
