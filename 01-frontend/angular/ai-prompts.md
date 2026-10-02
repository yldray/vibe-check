# Angular — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this Angular project for production readiness.
Check: bypassSecurityTrust* and raw DOM writes (nativeElement.innerHTML, insertAdjacentHTML,
Renderer2 setProperty innerHTML), interceptors that send the token to every origin, environment files
and fileReplacements (localhost or secrets in the build), HttpClient calls never subscribed or
subscribed twice, form.value with disabled controls, unsubscribed observables, track $index on
changing lists, nested subscribes / mergeMap in search, zoneless or OnPush views that don't update,
XSRF setup, service worker update handling and dataGroups, route guards backed by API checks.
SSR: module-level or useValue state shared between requests, private pages cached or in ng-state,
allowedHosts / trustProxyHeaders, browser APIs during prerender. Angular version and support window.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
