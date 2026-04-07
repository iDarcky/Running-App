# Mapbox Integration Guide for RedLine

Integrating Mapbox into the RedLine app allows you to replace the default OpenStreetMap layer with high-quality, customizable maps, including beautiful satellite imagery (like Maxar data) and specialized outdoor/terrain layers.

## Step 1: Create a Mapbox Account and Get an Access Token

1. Go to [Mapbox.com](https://www.mapbox.com/) and create a free account.
2. Once logged in, navigate to your **Account Dashboard**.
3. Under the **Access Tokens** section, you will see a "Default public token" (it starts with `pk.`).
4. Copy this token. You will need it for the app.

## Step 2: Choose a Mapbox Style

Mapbox offers several default styles you can use. The most common ones for outdoor tracking apps are:
- **Streets:** `mapbox/streets-v12`
- **Outdoors:** `mapbox/outdoors-v12` (Great for hiking/biking!)
- **Satellite:** `mapbox/satellite-v9`
- **Satellite Streets:** `mapbox/satellite-streets-v12` (Satellite with road/trail overlays)
- **Dark:** `mapbox/dark-v11` (Great for night runs)

## Step 3: Add the Token to Your App

To keep your token secure, it's best to add it to an environment variable file.

1. In the root of your project, create a file named `.env.local` (if it doesn't exist already).
2. Add the following line, replacing `YOUR_TOKEN_HERE` with the token you copied:
   ```env
   VITE_MAPBOX_TOKEN=YOUR_TOKEN_HERE
   ```

## Step 4: Update the Map Layer in `ActiveRun.tsx`

Currently, the app uses OpenStreetMap. We need to swap the `TileLayer` component to use Mapbox.

1. Open `components/ActiveRun.tsx`.
2. Locate the `<TileLayer ... />` component inside the `<MapContainer>`.
3. Replace the existing OpenStreetMap `TileLayer` with the following Mapbox `TileLayer`.

*Note: In this example, we are using the `outdoors-v12` style, but you can change it to any style from Step 2.*

```tsx
<TileLayer
  url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
  attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>'
/>
```

## Step 5: Test the App

1. Restart your development server (`npm run dev`).
2. Start a new run in the app.
3. You should now see the beautiful Mapbox tiles rendering underneath your RedLine route!

---
**Note on Pricing:** Mapbox has a generous free tier (typically 50,000 map loads per month free). For a beta or personal tracking app, you are highly unlikely to hit this limit. If the app scales to thousands of users, you can review their pricing page.
