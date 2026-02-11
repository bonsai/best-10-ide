const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

admin.initializeApp();
const db = admin.firestore();

// Rename the function to force a clean deployment
exports.api_v2 = onRequest(
  {
    cpu: 1,
    region: "us-central1",
    cors: true, // Automatically handle CORS
  },
  async (req, res) => {
    try {
      const pathParts = req.path.split("/").filter(Boolean);
      const collectionName = pathParts[0];
      const docId = pathParts[1];

      if (!collectionName) {
        return res.status(400).send("Bad Request: Collection name is missing.");
      }

      const collection = db.collection(collectionName);

      switch (req.method) {
        case "GET":
          if (docId) {
            const doc = await collection.doc(docId).get();
            if (!doc.exists) return res.status(404).send("Not Found");
            res.status(200).json({ id: doc.id, ...doc.data() });
          } else {
            let query = collection;
            if (collectionName === 'bbs') {
                query = query.orderBy('createdAt', 'desc');
            }
            const snapshot = await query.get();
            const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            res.status(200).json(items);
          }
          break;

        case "POST":
          const newItem = req.body;
          if (collectionName === 'bbs') {
              newItem.createdAt = admin.firestore.FieldValue.serverTimestamp();
          }
          const docRef = docId ? collection.doc(docId) : collection.doc();
          await docRef.set(newItem, { merge: true });
          res.status(201).json({ id: docRef.id, ...newItem });
          break;

        case "PUT":
          if (!docId) return res.status(400).send("Bad Request: Missing ID");
          await collection.doc(docId).update(req.body);
          const updatedDoc = await collection.doc(docId).get();
          res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });
          break;

        case "DELETE":
          if (!docId) return res.status(400).send("Bad Request: Missing ID");
          await collection.doc(docId).delete();
          res.status(204).send("");
          break;

        default:
          res.status(405).send("Method Not Allowed");
          break;
      }
    } catch (error) {
      logger.error("API Error:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);
