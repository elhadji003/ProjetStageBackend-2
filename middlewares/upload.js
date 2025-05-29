const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/avatars";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Exemple: user id venant d'une authentification (ici mock)
    const userId = req.user?.id || "unknown";
    cb(
      null,
      `${userId}-${Date.now()}${path.extname(file.originalname).toLowerCase()}`
    );
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    console.log(
      "Upload fichier:",
      file.originalname,
      file.mimetype,
      mimetype,
      extname
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Seules les images sont acceptées"));
  },
});

module.exports = upload;
