# Google Play release checklist

> Policies change often. Always verify against the [Play Console Help Center](https://support.google.com/googleplay/android-developer/).

## P0
- [ ] Target API level meets the current Play requirement
- [ ] Signed with upload key; Play App Signing enabled; keystore backed up
- [ ] Data safety form matches what the app really collects (including SDKs)
- [ ] Privacy policy URL in the listing and inside the app
- [ ] Account deletion available in-app AND via a web link (if the app has accounts)
- [ ] New personal developer accounts: closed testing requirement completed (check the current tester / day rules)
- [ ] Content rating questionnaire done
- [ ] Only permissions you actually use; sensitive ones (SMS, call log, background location, all files) declared with justification
- [ ] Release build tested (R8 / ProGuard on)

## P1
- [ ] Store listing: screenshots for phone (and tablet if supported), feature graphic, short + full description
- [ ] Pre-launch report reviewed
- [ ] Staged rollout (start at 10–20%)
- [ ] Crash rate and ANR rate monitored in Android vitals
