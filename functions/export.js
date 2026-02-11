
const admin = require("firebase-admin");

// The Admin SDK should automatically find credentials if the user is logged in
// via the Firebase CLI or if GOOGLE_APPLICATION_CREDENTIALS is set.
try {
  admin.initializeApp();
} catch (e) {
  // Ignore re-initialization error
  if (e.code !== 'app/duplicate-app') {
    console.error('Firebase admin initialization error', e);
    process.exit(1);
  }
}

const db = admin.firestore();

async function exportCollection(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) {
      console.log(JSON.stringify([], null, 2));
      return;
    }
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(JSON.stringify(items, null, 2));
  } catch (error) {
    // Send error to stderr to not pollute the JSON output
    console.error(`Error exporting collection ${collectionName}:`, error);
    process.exit(1);
  }
}

const collection = process.argv[2];
if (!collection) {
  console.error('Please provide a collection name as an argument.');
  process.exit(1);
}

exportCollection(collection);
