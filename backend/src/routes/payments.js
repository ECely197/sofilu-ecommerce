const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { authMiddleware } = require("../middleware/authMiddleware");

// --- ¡ÚNICA RUTA! SOLO PARA GENERAR LA FIRMA DE INTEGRIDAD ---
router.post("/create-signature", [authMiddleware], async (req, res) => {
  const { reference, amount_in_cents, currency } = req.body;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

  try {
    const concatenatedString = `${reference}${amount_in_cents}${currency}${integritySecret}`;
    const hash = crypto
      .createHash("sha256")
      .update(concatenatedString)
      .digest("hex");
    res.json({ signature: hash });
  } catch (error) {
    console.error("Error al generar la firma de integridad:", error);
    res.status(500).json({ message: "No se pudo generar la firma." });
  }
});

router.get("/verify-transaction-status/:id", async (req, res) => {
  try {
    // La verificación se hace directamente contra la API de Wompi, no se necesita llave privada
    const response = await axios.get(
      `${WOMPI_API_URL}/transactions/${req.params.id}`
    );
    const transaction = response.data.data;
    res.json({ status: transaction.status });
  } catch (error) {
    console.error(
      "Error al verificar la transacción:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "No se pudo verificar la transacción." });
  }
});

module.exports = router;
