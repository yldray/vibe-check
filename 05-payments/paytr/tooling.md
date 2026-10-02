# PayTR — tooling

| Purpose | Tool |
|---|---|
| Test payments | PayTR test mode (`test_mode=1`) with PayTR's test cards, on a public staging URL (PayTR can't reach localhost) |
| Reference requests | PayTR's official Postman collection (github.com/paytr/paytr-postman), with the unit of every amount field |
| Callback replay | curl a form-encoded callback (hash recomputed with test credentials) and check the body is exactly `OK` (`curl -s … \| xxd`) |
| Pending results | Status inquiry API, called from a script, not by hand in the panel |
| Monitoring | A daily count of successful payments with an alert when it drops; failed notifications in the merchant panel |
