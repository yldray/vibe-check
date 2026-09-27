# Google Play release checklist

> Policies change often. Always verify against the [Play Console Help Center](https://support.google.com/googleplay/android-developer/).

## P0
- [ ] `PLAY-001` Target API level meets the current Play requirement
- [ ] `PLAY-002` Signed with upload key; Play App Signing enabled; keystore backed up
- [ ] `PLAY-003` Data safety form matches what the app really collects (including SDKs)
- [ ] `PLAY-004` Privacy policy URL in the listing and inside the app
- [ ] `PLAY-005` Account deletion available in-app AND via a web link (if the app has accounts)
- [ ] `PLAY-006` New personal developer accounts: closed testing requirement completed (check the current tester / day rules)
- [ ] `PLAY-007` Content rating questionnaire done
- [ ] `PLAY-008` Only permissions you actually use; sensitive ones (SMS, call log, background location, all files) declared with justification
- [ ] `PLAY-009` Release build tested (R8 / ProGuard on)

## P1
- [ ] `PLAY-010` Store listing: screenshots for phone (and tablet if supported), feature graphic, short + full description
- [ ] `PLAY-011` Pre-launch report reviewed
- [ ] `PLAY-012` Staged rollout (start at 10–20%)
- [ ] `PLAY-013` Crash rate and ANR rate monitored in Android vitals
