const express = require("express");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const { PutCommand, ScanCommand, GetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { doc, TABLE } = require("../lib/dynamo");
const { s3, BUCKET, PUBLIC_URL_BASE } = require("../lib/s3");

const router = express.Router();

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const err = new Error("Chi chap nhan anh PNG, JPEG, WEBP hoac GIF");
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

function photoUrl(key) {
  if (!key) return null;
  return `${PUBLIC_URL_BASE}/${BUCKET}/${key}`;
}

// Sinh S3 key an toan: doc lap voi ten file goc, tranh ky tu # ? % ... lam hong URL
function safePhotoKey(originalname) {
  const ext = (originalname.match(/\.[a-zA-Z0-9]+$/) || [""])[0].toLowerCase();
  return `${uuid()}${ext}`;
}

function isFiniteInRange(value, min, max) {
  // Number("") === 0 va Number(null) === 0 trong JS - phai loai truoc, khong thi
  // gia tri rong/thieu se bi hieu nham thanh 0 hop le thay vi bao loi.
  if (value === "" || value === null || value === undefined) return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

// GET /pins - danh sach toan bo pin (tu dong lap trang qua toan bo ket qua Scan)
router.get("/", async (req, res, next) => {
  try {
    const items = [];
    let ExclusiveStartKey;
    do {
      const result = await doc.send(
        new ScanCommand({ TableName: TABLE, ExclusiveStartKey })
      );
      items.push(...(result.Items || []));
      ExclusiveStartKey = result.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    res.json(items);
  } catch (err) {
    next(err);
  }
});

// POST /pins - tao pin moi (multipart/form-data: title, description, lat, lng, photo)
router.post("/", upload.single("photo"), async (req, res, next) => {
  try {
    const { title, description, lat, lng } = req.body;
    if (!title || !isFiniteInRange(lat, -90, 90) || !isFiniteInRange(lng, -180, 180)) {
      return res.status(400).json({
        error: "title la bat buoc; lat phai la so trong [-90,90]; lng phai la so trong [-180,180]",
      });
    }

    let photoKey = null;
    if (req.file) {
      photoKey = safePhotoKey(req.file.originalname);
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

    try {
      await doc.send(new PutCommand({ TableName: TABLE, Item: item }));
    } catch (dbErr) {
      // Ghi DynamoDB that bai sau khi anh da upload len S3 -> don ngay, tranh anh mo coi.
      if (photoKey) {
        await s3
          .send(new DeleteObjectCommand({ Bucket: BUCKET, Key: photoKey }))
          .catch((cleanupErr) =>
            console.error("Don anh mo coi that bai:", photoKey, cleanupErr)
          );
      }
      throw dbErr;
    }

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// DELETE /pins/:id - xoa anh S3 truoc, xoa ban ghi DynamoDB sau (tranh anh mo coi
// neu buoc xoa DynamoDB that bai giua chung)
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = (
      await doc.send(new GetCommand({ TableName: TABLE, Key: { id } }))
    ).Item;

    if (existing?.photoKey) {
      await s3
        .send(new DeleteObjectCommand({ Bucket: BUCKET, Key: existing.photoKey }))
        .catch((err) => console.error("Xoa anh S3 that bai:", existing.photoKey, err));
    }

    await doc.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
