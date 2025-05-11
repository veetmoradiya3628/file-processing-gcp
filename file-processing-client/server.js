const express = require("express");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");

const path = require("path");
const app = express();
const port = 3000;

const storage = new Storage();
const bucket = storage.bucket("original-images-upload");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");

  const blob = bucket.file(`uploads/${Date.now()}_${req.file.originalname}`);
  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: req.file.mimetype,
  });

  blobStream.on("finish", () => {
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    res.status(200).json({ imageUrl: publicUrl });
  });

  blobStream.on("error", (err) => {
    console.error("Blob stream error:", err);
    res.status(500).send("Upload failed.");
  });

  blobStream.end(req.file.buffer);
});

app.listen(port, () => console.log(`App running at http://localhost:${port}`));
