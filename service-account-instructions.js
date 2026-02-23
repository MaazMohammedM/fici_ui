// Instructions for setting up service account key

/*
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: fici-shoes
3. Go to Project Settings (gear icon)
4. Click "Service accounts" tab
5. Click "Generate new private key"
6. Select JSON and click "Create"
7. Save the file as "service-account-key.json" in your project root
8. Run: node import-data.js

The service account key should look like this:
{
  "type": "service_account",
  "project_id": "fici-shoes",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
*/
