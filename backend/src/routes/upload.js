const express = require("express");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

// Configuración de Multer para almacenar el archivo en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite de 10 MB
  },
});

/**
 * @route   POST /api/upload
 * @desc    Sube una imagen, la convierte a WebP y la almacena en Firebase Storage.
 * @access  Admin
 */
router.post(
  "/",
  authMiddleware,
  adminOnly,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se proporcionó ningún archivo." });
      }

      // Validar tipo de archivo
      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "El archivo debe ser una imagen válida." });
      }

      // Procesar la imagen con Sharp: Convertir a WebP con calidad 80
      const webpBuffer = await sharp(req.file.buffer)
        .webp({ quality: 80 })
        .toBuffer();

      // Configurar Firebase Storage
      const bucket = admin.storage().bucket();
      
      // Sanitizar el nombre original del archivo para quitar la extensión antigua
      const originalName = req.file.originalname;
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
      const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, "_");
      
      const fileName = `product-images/${Date.now()}_${sanitizedName}.webp`;
      const fileRef = bucket.file(fileName);

      // Generar token de descarga único
      const downloadToken = uuidv4();

      // Guardar el buffer en Firebase Storage
      await fileRef.save(webpBuffer, {
        metadata: {
          contentType: "image/webp",
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
      });

      // Construir la URL pública de descarga
      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;

      res.status(200).json({ imageUrl });
    } catch (error) {
      console.error("Error al procesar y subir la imagen:", error);
      res.status(500).json({
        message: "Error interno al procesar y subir la imagen.",
        details: error.message,
      });
    }
  }
);

module.exports = router;
