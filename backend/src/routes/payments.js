const express = require("express");
const router = express.Router();
const crypto = require("crypto"); // Módulo nativo de Node.js para criptografía
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/create-signature", [authMiddleware], async (req, res) => {
  const { reference, amount_in_cents, currency } = req.body;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

  if (!reference || !amount_in_cents || !currency || !integritySecret) {
    return res
      .status(400)
      .json({ message: "Faltan datos para generar la firma." });
  }

  try {
    // Paso 1: Concatenar los valores en el orden exacto que pide Wompi
    const concatenatedString = `${reference}${amount_in_cents}${currency}${integritySecret}`;

    // Paso 2: Generar el hash SHA256
    const hash = crypto
      .createHash("sha256")
      .update(concatenatedString)
      .digest("hex");

    // Paso 3: Devolver la firma generada
    res.json({ signature: hash });
  } catch (error) {
    console.error("Error al generar la firma de integridad:", error);
    res.status(500).json({ message: "No se pudo generar la firma." });
  }
});

// Ya no necesitamos las rutas create-transaction ni verify-transaction aquí.
// La verificación la haremos en el webhook en el futuro.

module.exports = router;
