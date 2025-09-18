# Firebase Setup Instructions

Your bus tracker has been updated to use Firebase for real-time cross-device synchronization! Follow these steps to complete the setup.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "bus-tracker")
4. Disable Google Analytics (not needed for this project)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In your Firebase project console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for now)
4. Select a location closest to you
5. Click "Done"

## Step 3: Get Your Firebase Configuration

1. In the Firebase console, click the gear icon ⚙️ (Project settings)
2. Scroll down to "Your apps"
3. Click the web icon `</>` to add a web app
4. Enter an app nickname (e.g., "Bus Tracker Web")
5. Don't check "Set up Firebase Hosting" (you're already using your own hosting)
6. Click "Register app"
7. Copy the `firebaseConfig` object

## Step 4: Update Your Configuration

1. Open `/src/firebase.ts` in your project
2. Replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 5: Deploy and Test

1. Build and deploy your updated app:
   ```bash
   npm run build
   # Deploy to your hosting service
   ```

2. Visit your website and go to the "Add Bus" page
3. You should see "Firebase Connected" with a green checkmark
4. If you have existing data, click "Migrate to Firebase" to transfer it

## Step 6: Set Up Firestore Security Rules (Important!)

1. In Firebase console, go to "Firestore Database" → "Rules"
2. Replace the default rules with these more secure ones:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to bus logs and busdle templates
    match /busLogs/{document=**} {
      allow read, write: if true; // You can add authentication later
    }
    match /busdleTemplates/{document=**} {
      allow read, write: if true; // You can add authentication later
    }
    // Allow read/write access to bus bank templates
    match /busBankTemplates/{document=**} {
      allow read, write: if true; // You can add authentication later
    }
    // Allow read/write access to active bus bank (for cross-device sync)
    match /activeBusBank/{document=**} {
      allow read, write: if true; // You can add authentication later
    }
  }
}
```

3. Click "Publish"

## Features Now Available

✅ **Real-time sync** - Changes appear instantly across all devices
✅ **Automatic backup** - Your data is safely stored in the cloud  
✅ **Migration utility** - Easily transfer existing localStorage data
✅ **Fallback support** - App still works if Firebase is unavailable

## Troubleshooting

### "Firebase not configured" message
- Make sure you've updated the `firebaseConfig` in `/src/firebase.ts`
- Check that all the values are correct (no placeholder text)
- Rebuild and redeploy your app

### Data not syncing
- Check browser console for errors
- Verify Firestore rules allow read/write access
- Make sure you're using the same Firebase project on all devices

### Migration not working
- Ensure you have existing data in localStorage
- Check that Firebase is properly connected first
- Look for any error messages in the browser console

## Next Steps (Optional)

### Add Authentication
If you want to restrict access to your data:
1. Enable Firebase Authentication
2. Update Firestore rules to require authentication
3. Add login/logout functionality to your app

### Set Up Backup
Consider setting up automated backups of your Firestore data for extra security.

---

🎉 **Congratulations!** Your bus tracker now syncs across all devices. Add a bus on your phone, and watch it appear instantly on your computer!
