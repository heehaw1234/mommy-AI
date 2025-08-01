import 'dotenv/config';

export default {
  "expo": {
    "name": "stuHack",
    "slug": "stuHack",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "stuhack",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "extra": {
      "supabaseUrl": process.env.SUPABASE_URL,
      "supabaseAnonKey": process.env.SUPABASE_ANON_KEY,
      "huggingFaceToken": process.env.HUGGING_FACE_TOKEN,
      "openaiApiKey": process.env.OPENAI_API_KEY,
      "eas": {
        "projectId": "9c45afb0-813e-4ede-acd5-b6c4db47c467"
      }
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "package": "com.zhengchong.mommyai",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
