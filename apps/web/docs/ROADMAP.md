# RedLine App: Roadmap & Quick Wins

This roadmap breaks down the massive vision for RedLine into an actionable, phased approach.

---

## 🏆 Immediate Quick Wins (Do These Now!)
These are high-impact, low-effort changes we can execute immediately within the current MVP codebase to drastically improve the app:

1. **Schema Refactor (`Run` -> `Activity`)**
   - *Effort: Low | Impact: High*
   - Refactor the `Run` interface in `types.ts` to `Activity`, adding an `activityType` enum (`RUN`, `BIKE`, `SWIM`, `HIKE`). This instantly unlocks the multi-activity pivot.
2. **Dashboard Quick Start Widgets**
   - *Effort: Low | Impact: High*
   - Add immediate "Start Run", "Start Ride", "Start Hike" shortcut buttons to the top of the Dashboard.
3. **Geist UI Polish**
   - *Effort: Low | Impact: Medium*
   - Strip out any remaining HeroUI dependencies/complexities. Ensure strict adherence to the minimal, high-contrast monochrome design with red (`#EE0000`) accents.
4. **Shoe/Gear Tracker Widget**
   - *Effort: Low | Impact: Medium*
   - Add a widget to the dashboard that shows active gear mileage at a glance, warning the user when shoes/bikes reach a certain threshold.
5. **Local Storage to IndexedDB**
   - *Effort: Medium | Impact: High*
   - GPS arrays are massive. Swap `localStorage` for `localforage` (IndexedDB wrapper) to prevent the app from crashing when saving long activities.

---

## 🗺️ Phased Product Roadmap

### Phase 1: The Multi-Sport MVP (Current Phase)
*Focus: Rock-solid local tracking and multi-activity support.*
* Complete the `Activity` data model refactor.
* Implement UI updates for different sport types (colors, icons).
* Optimize `@capacitor/geolocation` background tracking to save battery.
* Implement IndexedDB for reliable local data storage.

### Phase 2: Cloud & Accounts
*Focus: Data security and cross-device sync.*
* Integrate a backend (e.g., Supabase or Firebase).
* Implement User Authentication (Email, Google, Apple).
* Sync local IndexedDB data to the cloud seamlessly.
* Implement basic data privacy toggles (Public/Private activities).

### Phase 3: The Social Network
*Focus: Virality, retention, and community (The "Hevy/Strava" aspect).*
* Build User Profiles with asymmetric follow mechanics.
* Implement the chronological Activity Feed.
* Add the "Props/Kudos" interaction system and Commenting threads.
* Introduce "Privacy Zones" to hide start/end locations (Legal/Safety requirement).

### Phase 4: Integrations & Monetization
*Focus: Revenue and becoming the central hub of a user's fitness data.*
* Build a "RedLine Pro" subscription tier.
* Implement third-party data imports (Apple Health, Garmin, Strava API).
* Introduce generated/AI Training Plans.
* Add Leaderboards and Virtual Challenges.
