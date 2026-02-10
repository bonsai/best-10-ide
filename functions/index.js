const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fs = require("fs").promises;
const path = require("path");

admin.initializeApp();

// Define paths to data files
const dataDir = path.resolve(__dirname, "..", "data");
const toolsPath = path.join(dataDir, "tools.json");
const likesPath = path.join(dataDir, "likes.json");
const urlsPath = path.join(dataDir, "urls.json");

// Helper function to read JSON files
const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      if (filePath.endsWith('likes.json')) return {};
      if (filePath.endsWith('urls.json') || filePath.endsWith('tools.json')) return [];
    }
    throw error;
  }
};

// Helper function to write JSON files
const writeJsonFile = (filePath, data) => {
  return fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
};

exports.api = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    if (req.path.endsWith("/tools")) {
      const tools = await readJsonFile(toolsPath);
      const likes = await readJsonFile(likesPath);
      const mergedTools = tools.map(tool => ({
        ...tool,
        likes: likes[tool.name] || 0,
      }));
      res.status(200).json(mergedTools);

    } else if (req.path.endsWith("/like")) { // Handles single like, kept for potential direct use
      if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
      const { toolName } = req.body;
      if (!toolName) return res.status(400).send("Bad Request: toolName is missing");

      const likes = await readJsonFile(likesPath);
      likes[toolName] = (likes[toolName] || 0) + 1;
      await writeJsonFile(likesPath, likes);
      res.status(200).json({ likes: likes[toolName] });

    } else if (req.path.endsWith("/likes/batch")) { // Handles batch updates
      if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
      const { likes: batchLikes } = req.body;
      if (!batchLikes) return res.status(400).send("Bad Request: likes object is missing");

      const likes = await readJsonFile(likesPath);
      for (const toolName in batchLikes) {
        if (Object.prototype.hasOwnProperty.call(batchLikes, toolName)) {
            likes[toolName] = (likes[toolName] || 0) + batchLikes[toolName];
        }
      }
      await writeJsonFile(likesPath, likes);
      res.status(200).send("Batch update successful");

    } else if (req.path.endsWith("/url")) {
      if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
      const { url } = req.body;
      if (!url) return res.status(400).send("Bad Request: url is missing");

      const urls = await readJsonFile(urlsPath);
      urls.push({ url, submittedAt: new Date().toISOString() });
      await writeJsonFile(urlsPath, urls);
      res.status(200).send("URL submitted successfully");

    } else {
      res.status(404).send("Not Found");
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
