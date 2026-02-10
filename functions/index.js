const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fs = require("fs").promises;
const path = require("path");

admin.initializeApp();

// Define paths to data files
const dataDir = path.resolve(__dirname, "data");
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
    const route = req.path.split('/').pop();

    switch (route) {
      case 'tools':
        const tools = await readJsonFile(toolsPath);
        const likes = await readJsonFile(likesPath);
        const mergedTools = tools.map(tool => ({
          ...tool,
          likes: likes[tool.name] || 0,
        }));
        res.status(200).json(mergedTools);
        break;

      case 'batch': // Handles batch updates at /api/likes/batch
        if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
        const { likes: batchLikes } = req.body;
        if (!batchLikes) return res.status(400).send("Bad Request: likes object is missing");

        const currentLikes = await readJsonFile(likesPath);
        for (const toolName in batchLikes) {
          if (Object.prototype.hasOwnProperty.call(batchLikes, toolName)) {
            currentLikes[toolName] = (currentLikes[toolName] || 0) + batchLikes[toolName];
          }
        }
        await writeJsonFile(likesPath, currentLikes);
        res.status(200).send("Batch update successful");
        break;

      case 'url':
        if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
        const { url } = req.body;
        if (!url) return res.status(400).send("Bad Request: url is missing");

        const urls = await readJsonFile(urlsPath);
        urls.push({ url, submittedAt: new Date().toISOString() });
        await writeJsonFile(urlsPath, urls);
        res.status(200).send("URL submitted successfully");
        break;

      default:
        res.status(404).send("Not Found");
        break;
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
