import 'dotenv/config';

export default {
  "expo": {
    "name": "LifeLink",
    "slug": "lifelinkapp-mobile",
    "scheme": "lifelink",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/appIcon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/appIcon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "FOREGROUND_SERVICE",
        "ACCESS_BACKGROUND_LOCATION",
        "RECORD_AUDIO",
        "MODIFY_AUDIO_SETTINGS",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ],
      "package": "com.anonymous.lifelinkappmobile"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    extra: {
      apiBaseUrl: process.env.API_BASE_URL,
      webResetUrl: process.env.WEB_RESET_URL,
      eas: {
        projectId: "e1095969-8a34-4956-b0e6-a22aae516b8c"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-video"
    ]
  },
  "cli": {
  "appVersionSource": "appVersion"
}
}