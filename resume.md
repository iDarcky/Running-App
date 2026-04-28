# Product Manager / Business Analyst Experience: RedLine App

**Project Context:** RedLine is a modern fitness tracking application featuring real-time GPS tracking, performance goal management, and an AI-powered personalized coach.

## Strategic Product Direction & Scope
* **Led the strategic pivot** of the MVP from a single-activity (running) application to a comprehensive multi-activity platform (biking, hiking, swimming) by redefining user personas, updating the data model to support diverse activity types, and restructuring the UI navigation, resulting in a significantly broader addressable market.
* **Defined and scoped the MVP feature set**, prioritizing core functionalities such as real-time GPS tracking, offline-first data synchronization, and a custom goal-tracking engine, ensuring a rapid go-to-market timeline while delivering high user value.
* **Championed an offline-first architecture**, working closely with engineering to map out data flows between local storage (`localStorage`/SQLite via Capacitor) and cloud synchronization, ensuring uninterrupted user experience in low-connectivity environments (like trails or swimming pools).

## Feature Lifecycle Management
* **Designed and delivered the "AI Coach" feature** (integrated with Google Gemini API), writing comprehensive product requirements and prompting logic that translates raw user telemetry (cadence, distance, speed) into personalized, actionable biomechanical insights and race strategies.
* **Spearheaded the development of a custom Goal Tracking engine**, defining the logic for bucketing diverse timeframes (weekly, monthly, yearly) and metrics (distance, duration, frequency) into a unified, gamified progress UI.
* **Orchestrated the implementation of real-time voice feedback** during active sessions (via Web Speech API), documenting user flows for milestone announcements to enhance hands-free accessibility during workouts.

## User Experience (UX) & Design Strategy
* **Drove the adoption of a minimalist, high-contrast UI design system** (inspired by Vercel/Geist) to differentiate the product from cluttered competitors, focusing on data legibility and intuitive mobile navigation (bottom tab bars for mobile, sidebars for desktop).
* **Optimized mapping and telemetry visualization** by defining requirements for custom interactive Leaflet/OpenStreetMap overlays, ensuring the application maintained a distinct brand identity (RedLine) without relying on generic external CDNs.
* **Collaborated on performance optimization requirements**, identifying $O(N \times M)$ bottlenecks in statistical aggregations (like shoe mileage and goal progress) and specifying the need for single-pass $O(N+M)$ algorithmic improvements to maintain a seamless UX on low-end mobile devices.

## Agile & Stakeholder Management
* **Managed the Git branching and release strategy**, instituting a 'beta' branch consolidation process to ensure rigorous QA testing of complex location-tracking features before main branch deployment.
* **Acted as the bridge between technical limitations and user needs**, balancing the desire for advanced mapping features against the constraints of an offline, restricted-network environment during initial prototyping phases.
