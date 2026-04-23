# Mobile Icon Asset Status

The app now uses MaterialCommunityIcons again for a cleaner mobile UI.

## What changed

- Restored icon rendering with @expo/vector-icons in src/components/Icon.js.
- Re-enabled startup icon font preload in App.js.
- Re-added expo-font plugin config in app.json to bundle icon font assets in builds.
- Reinstalled @expo/vector-icons and expo-font with Expo-53-compatible versions.

## Offline asset note

Icon font files are required and bundled for stable rendering.

Bundled font path:

- node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf
