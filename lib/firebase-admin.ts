import * as admin from 'firebase-admin';

// Helper function to clean up the private key string
function getFormattedPrivateKey(privateKey: string | undefined): string | undefined {
  if (!privateKey) return undefined;
  
  // If the private key is in JSON format (starts with quotation marks), parse it
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    try {
      privateKey = JSON.parse(privateKey);
    } catch (e) {
      console.error('Error parsing private key from JSON:', e);
    }
  }
  
  // Make sure all newlines are properly formatted
  return privateKey ? privateKey.replace(/\\n/g, '\n') : undefined;
}

// Check if Firebase Admin is already initialized to prevent multiple initializations
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = getFormattedPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        `Missing Firebase Admin configuration. ` +
        `ProjectId: ${projectId ? 'OK' : 'MISSING'}, ` +
        `ClientEmail: ${clientEmail ? 'OK' : 'MISSING'}, ` +
        `PrivateKey: ${privateKey ? 'OK' : 'MISSING'}`
      );
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });
    
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
    // In development, add more context to help with debugging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Firebase admin initialization details:', error.stack);
    }
  }
}

// Export the admin module and firestore for convenience
export const db = admin.firestore();
export const auth = admin.auth();
export default admin; 