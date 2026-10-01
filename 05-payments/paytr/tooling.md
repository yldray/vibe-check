# PayTR — tooling

| Purpose | Tool |
|---|---|
| Test payments | PayTR test mode (`test_mode=1`) with PayTR's test cards |
| Callback replay | curl a recorded callback body (hash recomputed with test credentials) |
| Pending results | Status inquiry API, called from a script, not by hand in the panel |
| Monitoring | A daily count of successful payments with an alert when it drops |
