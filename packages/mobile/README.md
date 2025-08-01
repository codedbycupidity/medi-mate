# MediMate Mobile App

React Native mobile application for MediMate - Your Personal Medication Assistant.

## Setup Instructions

Since the iOS and Android directories need to be generated, follow these steps:

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate iOS and Android Projects

#### Option A: Using React Native CLI (Recommended)
```bash
# Install React Native CLI globally
npm install -g react-native-cli

# Create a temporary React Native project
npx react-native init TempMobile --version 0.73.6

# Copy the ios and android folders to this project
cp -r TempMobile/ios .
cp -r TempMobile/android .

# Clean up
rm -rf TempMobile
```

#### Option B: Using Expo CLI to eject
```bash
# Install Expo CLI
npm install -g expo-cli

# Initialize and eject
expo eject
```

### 3. Update Project Configuration

After copying the platform directories, update the following files:

**iOS:**
- `ios/mobile.xcodeproj/project.pbxproj` - Update project name
- `ios/mobile/Info.plist` - Update bundle identifier and display name

**Android:**
- `android/app/build.gradle` - Update applicationId
- `android/settings.gradle` - Update project name
- `android/app/src/main/res/values/strings.xml` - Update app name

### 4. Install iOS Dependencies
```bash
cd ios
pod install
cd ..
```

### 5. Run the App

**iOS:**
```bash
npx react-native run-ios
# or
npm run ios
```

**Android:**
```bash
npx react-native run-android
# or
npm run android
```

## Project Structure

```
mobile/
├── src/
│   ├── navigation/     # App navigation setup
│   ├── screens/        # App screens
│   └── services/       # API and other services
├── ios/                # iOS specific files (needs to be generated)
├── android/            # Android specific files (needs to be generated)
└── App.tsx            # App entry point
```

## Available Scripts

- `npm start` - Start Metro bundler
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Troubleshooting

### iOS Build Issues
- Make sure you have Xcode installed
- Run `cd ios && pod install` if you see pod-related errors
- Open `ios/mobile.xcworkspace` in Xcode and configure signing

### Android Build Issues
- Make sure you have Android Studio and Android SDK installed
- Check that `ANDROID_HOME` environment variable is set
- Run `cd android && ./gradlew clean` if you see build errors