# Add Map Overlay to Social Share

## Description
This PR addresses the request to add a new overlay option to the social share functionality.
It includes:
- A new "Overlay" theme for the social share modal, which produces an image with a transparent background.
- Logic to draw an outline of the actual run route on the map, using the `run.positions` data.
- The map is scaled and centered automatically within the poster area.
- Styling adjustments (like adding slight drop shadows to text) to ensure the white text remains legible when the background is transparent.
- A distinctive checkerboard UI pattern for the "Overlay" theme button to make it visually clear what the option does.

## Verification
- Verified map outline coordinates are correctly translated and scaled into the canvas.
- Verified background becomes transparent.
- Verified drop shadows activate when using transparent overlays.
- Ran tests suite manually using node test runner.
