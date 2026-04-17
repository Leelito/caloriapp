{
  "expo": {
    "name": "CaloriApp",
    "slug": "caloriapp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0d0f14"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.caloriapp.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./adaptive-icon.png",
        "backgroundColor": "#0d0f14"
      },
      "package": "com.caloriapp.app",
      "versionCode": 1
    },
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "CaloriApp needs access to your photos to analyze food.",
          "cameraPermission": "CaloriApp needs access to your camera to take food photos."
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "42ae6734-7e1f-4850-bafd-b9b03f80bd5d"
      }
    },
    "owner": "jaboncillo"
  }
}
