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
    const transactionId = req.params.id;
    const wompiApiUrl = `https://sandbox.wompi.co/v1/transactions/${transactionId}`;

    const response = await fetch(wompiApiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Wompi API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json({ status: data.data.status });
  } catch (error) {
    console.error("Error verifying transaction:", error);
    res.status(500).json({
      message: "Error al verificar la transacción",
      error: error.message,
    });
  }
});

module.exports = router;
