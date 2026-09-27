# Expected findings

Answer key for the two projects in `examples/`. Don't give this file to the agent under test.

## web-shop (14 planted bugs)

| # | Bug | Where | Expected IDs |
|---|---|---|---|
| 1 | `.env` with a live-looking Stripe secret key is committed | `vue-app/.env`, `.gitignore` | `UNI-001` `ENV-001` |
| 2 | Secret key used in client code through `VITE_` | `vue-app/src/api.js` | `FE-001` |
| 3 | The client sends the amount to the payment API | `vue-app/src/api.js` | `PAY-001` |
| 4 | `v-html` with user content | `vue-app/src/components/Comment.vue` | `VUE-003` |
| 5 | Service account JSON with a private key in client assets | `vue-app/src/assets/service-account.json` | `FIRE-004` |
| 6 | `bypassSecurityTrustHtml` on user text | `angular-admin/src/app/note-view.component.ts` | `NG-003` |
| 7 | Admin guard trusts `localStorage`, the API has no role check | `angular-admin/src/app/admin.guard.ts` | `NG-005` |
| 8 | All actuator endpoints exposed | `api/src/main/resources/application.properties` | `JAVA-003` |
| 9 | `permitAll` on `/**` with a TODO | `api/src/main/java/shop/SecurityConfig.java` | `JAVA-004` `UNI-003` |
| 10 | CORS `*` with credentials | `api/src/main/java/shop/SecurityConfig.java` | `SEC-005` |
| 11 | SQL built by string concatenation | `api/src/main/java/shop/OrderController.java` | `SEC-004` |
| 12 | Any order readable by ID, no owner check | `api/src/main/java/shop/OrderController.java` | `UNI-004` |
| 13 | Database password in `application.properties` | `api/src/main/resources/application.properties` | `SEC-001` |
| 14 | Firestore `if true` and Storage test-mode rules | `firebase/firestore.rules`, `firebase/storage.rules` | `FIRE-001` `FIRE-002` |

## habit-app (8 planted bugs)

| # | Bug | Where | Expected IDs |
|---|---|---|---|
| 1 | Supabase secret key in the Flutter client | `flutter_app/lib/config.dart` | `SUPA-003` `FLT-003` |
| 2 | OpenAI key in the Flutter client | `flutter_app/lib/config.dart` | `FLT-003` `MOB-001` |
| 3 | Table without RLS | `supabase/migrations/*_init.sql` | `SUPA-001` |
| 4 | `using (true)` policy | `supabase/migrations/*_init.sql` | `SUPA-002` |
| 5 | `targetSdk 30` | `android_widget/app/build.gradle` | `AND-003` `PLAY-001` |
| 6 | Network call on the main thread | `android_widget/.../MainActivity.kt` | `AND-002` |
| 7 | Secret in `BuildConfig` | `android_widget/app/build.gradle` | `MOB-001` |
| 8 | `READ_SMS` and `READ_CALL_LOG` without need | `android_widget/app/src/main/AndroidManifest.xml` | `PLAY-008` |

A bug counts as found when the report names the right file (or the right line of the right file) and the problem, even under a different but reasonable ID.
