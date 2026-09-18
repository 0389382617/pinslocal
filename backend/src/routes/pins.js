const express = require("express");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const { PutCommand, ScanCommand, GetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { doc, TABLE } = require("../lib/dynamo");
const { s3, BUCKET, PUBLIC_URL_BASE } = require("../lib/s3");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

function photoUrl(key) {
  if (!key) return null;
  return `${PUBLIC_URL_BASE}/${BUCKET}/${key}`;
}

// GET /pins - danh sach toan bo pin
router.get("/", async (req, res, next) => {
  try {
    const result = await doc.send(new ScanCommand({ TableName: TABLE }));
    res.json(result.Items || []);
  } catch (err) {
    next(err);
  }
});

// POST /pins - tao pin moi (multipart/form-data: title, description, lat, lng, photo)
router.post("/", upload.single("photo"), async (req, res, next) => {
  try {
    const { title, description, lat, lng } = req.body;
    if (!title || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "title, lat, lng la bat buoc" });
    }

    let photoKey = null;
    if (req.file) {
      photoKey = `${uuid()}-${req.file.originalname}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: photoKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );
    }

    const item = {
      id: uuid(),
      title,
      description: description || "",
      lat: Number(lat),
      lng: Number(lng),
      photoKey,
      photoUrl: photoUrl(photoKey),
      createdAt: new Date().toISOString(),
    };

    await doc.send(new PutCommand({ TableName: TABLE, Item: item }));
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// DELETE /pins/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = (
      await doc.send(new GetCommand({ TableName: TABLE, Key: { id } }))
    ).Item;

    await doc.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));

    if (existing?.photoKey) {
      await s3
        .send(new DeleteObjectCommand({ Bucket: BUCKET, Key: existing.photoKey }))
        .catch(() => {});
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
