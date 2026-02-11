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
const bbsPath = path.join(dataDir, "bbs.json"); // Added path for bbs data

// Helper function to read JSON files
const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      if (filePath.endsWith('likes.json')) return {};
      // Added bbs.json to return an empty array if not found
      if (filePath.endsWith('urls.json') || filePath.endsWith('tools.json') || filePath.endsWith('bbs.json')) return [];
    }
    throw error;
  }
};

// Helper function to write JSON files
const writeJsonFile = (filePath, data) => {
  return fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
};

exports.api = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"); // Added PUT, DELETE
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle pre-flight OPTIONS requests
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const pathParts = req.path.split('/').filter(Boolean); // e.g., ['api', 'bbs', 'post-123']
    const route = pathParts[1];
    const id = pathParts[2];

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

      case 'batch':
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

      // New case for 'bbs' (Wiki)
      case 'bbs':
        let posts = await readJsonFile(bbsPath);

        if (req.method === 'GET' && !id) {
            res.status(200).json(posts);
        } else if (req.method === 'POST' && !id) {
            const newPost = req.body;
            if (!newPost.id || !newPost.content) {
                return res.status(400).send("Bad Request: Missing id or content");
            }
            posts.unshift(newPost);
            await writeJsonFile(bbsPath, posts);
            res.status(201).json(newPost);
        } else if (req.method === 'PUT' && id) {
            const { content } = req.body;
            let updated = false;
            posts = posts.map(p => {
                if (p.id === id) {
                    updated = true;
                    return { ...p, content };
                }
                return p;
            });
            if (!updated) return res.status(404).send("Post not found");
            await writeJsonFile(bbsPath, posts);
            res.status(200).json(posts.find(p => p.id === id));
        } else if (req.method === 'DELETE' && id) {
            const initialLength = posts.length;
            posts = posts.filter(p => p.id !== id);
            if (posts.length === initialLength) return res.status(404).send("Post not found");
            await writeJsonFile(bbsPath, posts);
            res.status(204).send("");
        } else {
            res.status(405).send('Method Not Allowed');
        }
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
