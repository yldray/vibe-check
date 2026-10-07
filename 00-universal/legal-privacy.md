# Legal and privacy

> Not legal advice. Check the rules in your target countries (GDPR, KVKK, CCPA, etc.).

- [ ] `LEGAL-001` **P0** Privacy policy published and linked (required by both app stores)
- [ ] `LEGAL-002` **P0** Users can delete their account and data. Deletion erases or anonymizes personal data, apart from what the law requires you to keep (invoices); an `IsDeleted` flag that keeps name, e-mail and phone is deactivation, and the screen must say so instead of promising deletion. A deletion scheduled for later (at the end of a paid period) has a job that runs and is monitored (see `OPS-004`)
- [ ] `LEGAL-003` **P0** Terms of service published and linked
- [ ] `LEGAL-004` **P1** Cookie consent where required: analytics, ads and other non-essential trackers load only after consent, and rejecting is as easy as accepting
- [ ] `LEGAL-005` **P1** Data processing agreements with third parties (analytics, email, AI APIs)
- [ ] `LEGAL-006` **P1** Personal data not sent to logs, AI prompts or e-mailed reports without need: a daily CSV of new users with names, e-mails and payment status stays in inboxes and gets forwarded; send counts or a link to an admin page behind login, with recipients kept in config, not code
- [ ] `LEGAL-007` **P1** A refund and cancellation policy is published and linked wherever users pay
- [ ] `LEGAL-008` **P1** A cookie policy lists the cookies and trackers the site sets and what each one is for
- [ ] `LEGAL-009` **P1** Consent checkboxes start unticked, marketing consent is separate from accepting the terms, and each form that collects personal data links the privacy notice; the privacy notice is linked for information, not something the user must "accept", and consent the law makes optional is never a condition of buying
- [ ] `LEGAL-010` **P2** Forms and the database collect only the data the app needs; no fields added "just in case"
- [ ] `LEGAL-011` **P1** Every third-party SDK and script (analytics, ads, chat, crash reporting) is listed in the privacy policy with the data it collects
- [ ] `LEGAL-012` **P0** If children may use the app: an age check and parental consent where the law asks (COPPA below 13 in the US; GDPR below 16, lower in some countries) and the store family policies are followed
- [ ] `LEGAL-013` **P1** Marketing e-mails have a working one-click unsubscribe (Gmail and Yahoo require it from bulk senders) and it is honored within 2 days
- [ ] `LEGAL-014` **P1** Fonts, images, icons, stock and AI-generated assets are licensed for commercial use, and dependency licenses allow how you ship the app
- [ ] `LEGAL-015` **P1** Business details are visible: legal name, address and a contact channel (some countries, e.g. Germany, require an imprint page; distance sales need seller details). Treat it as P0 when the site has a German-language version or sells to Germany or Austria: the imprint ([§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html)) is mandatory and a missing one draws cease-and-desist letters
- [ ] `LEGAL-020` **P1** Every support, refund and privacy-request address shown in the app, the legal texts, e-mails and the store listing exists, and a person reads it within the legal response time (one month under GDPR, 30 days under KVKK). Test: send a message to each from an outside account
- [ ] `LEGAL-021` **P1** Government ID numbers (national ID, passport) are collected only when a law or the contract requires them, stored encrypted and masked in admin screens; other personal fields (birth date, gender, occupation) are optional unless there is a stated reason (see `LEGAL-010`)

## Consumer protection

AI-generated landing pages and flows add these by default. Check every page before launch.

- [ ] `LEGAL-016` **P1** No fake social proof: invented testimonials, star ratings, user counts ("Trusted by 10,000+ teams") or logos of companies that aren't customers. Sample or demo reviews on real listings count too, even with a "sample" label
- [ ] `LEGAL-017` **P1** No claims you can't back up: "#1", "bank-level security", "GDPR / HIPAA compliant", "99.99% uptime", "AI-powered" for features that aren't
- [ ] `LEGAL-018` **P1** No dark patterns: pre-ticked boxes, confirm-shaming ("No thanks, I hate saving money"), fake countdowns or stock counters, and cancelling or unsubscribing harder than signing up. An "X% off until <date>" line and a struck-through "was" price: the end date is a real date that hides the offer and changes the price when it passes, and the "was" price is one you actually charged (in the EU, the lowest price of the 30 days before the discount)
- [ ] `LEGAL-019` **P1** Every document the UI says the user accepts ("by paying you accept the terms, cancellation policy and privacy notice") is linked right there, and the link opens that document in the user's language
