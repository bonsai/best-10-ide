const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Upgrade to a Gen 2 function
exports.api = functions.runWith({ cpu: 1 }).https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const pathParts = req.path.split('/').filter(Boolean);
    const collectionName = pathParts[0]; // e.g., 'bbs', 'tools', 'urls'
    const docId = pathParts[1];

    const collection = db.collection(collectionName);

    switch (req.method) {
      case 'GET':
        if (docId) {
          const doc = await collection.doc(docId).get();
          if (!doc.exists) return res.status(404).send('Not Found');
          res.status(200).json({ id: doc.id, ...doc.data() });
        } else {
          const snapshot = await collection.get();
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          res.status(200).json(items);
        }
        break;

      case 'POST':
        const newItem = req.body;
        const newDocRef = docId ? collection.doc(docId) : collection.doc();
        await newDocRef.set(newItem, { merge: true });
        res.status(201).json({ id: newDocRef.id, ...newItem });
        break;

      case 'PUT':
        if (!docId) return res.status(400).send("Bad Request: Missing ID");
        await collection.doc(docId).update(req.body);
        const updatedDoc = await collection.doc(docId).get();
        res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });
        break;

      case 'DELETE':
        if (!docId) return res.status(400).send("Bad Request: Missing ID");
        await collection.doc(docId).delete();
        res.status(204).send("");
        break;

      default:
        res.status(405).send('Method Not Allowed');
        break;
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
