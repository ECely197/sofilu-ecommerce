const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const { authMiddleware } = require("../middleware/authMiddleware");

const WOMPI_API_URL = "https://sandbox.wompi.co/v1";

// --- RUTA PARA CREAR LA TRANSACCIÓN ---
router.post("/create-transaction", [authMiddleware], async (req, res) => {
  const {
    amount,
    customer_email,
    customer_phone,
    customer_name,
    redirect_url,
  } = req.body;
  const reference = `sofilu-ref-${Date.now()}`;

  const transactionData = {
    amount_in_cents: Math.round(amount * 100),
    currency: "COP",
    customer_email: customer_email,
    reference: reference,
  };

  try {
    const response = await axios.post(
      `${WOMPI_API_URL}/transactions`,
      transactionData,
      {
        headers: {
          Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        },
      }
    );

    const transaction = response.data.data;
    res.json({
      transactionId: transaction.id,
      reference: transaction.reference,
    });
  } catch (error) {
    console.error(
      "Error al crear la transacción en Wompi:",
      error.response?.data?.error?.messages ||
        error.response?.data ||
        error.message
    );
    res.status(500).json({ message: "No se pudo crear la transacción." });
  }
});

// --- RUTA PARA VERIFICAR LA TRANSACCIÓN (PARA LA PÁGINA DE CONFIRMACIÓN) ---
router.get("/verify-transaction/:id", [authMiddleware], async (req, res) => {
  try {
    const response = await axios.get(
      `${WOMPI_API_URL}/transactions/${req.params.id}`,
      {
        headers: {
          // Para verificar, SÍ usamos la llave PRIVADA
          Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        },
      }
    );
    const transaction = response.data.data;
    res.json({ status: transaction.status, reference: transaction.reference });
  } catch (error) {
    console.error(
      "Error al verificar la transacción:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "No se pudo verificar la transacción." });
  }
});

module.exports = router;
