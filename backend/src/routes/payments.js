const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const { authMiddleware } = require("../middleware/authMiddleware");

const WOMPI_API_URL = "https://sandbox.wompi.co/v1";

// --- RUTA PARA CREAR LA TRANSACCIÓN (LA QUE FALLABA) ---
router.post("/create-transaction", [authMiddleware], async (req, res) => {
  const {
    amount,
    customer_email,
    customer_phone,
    customer_name,
    redirect_url,
  } = req.body;
  const reference = `sofilu-ref-${Date.now()}`;

  // Generamos la firma de integridad DENTRO de esta ruta
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  const amountInCents = Math.round(amount * 100);
  const concatenatedString = `${reference}${amountInCents}COP${integritySecret}`;
  const signature = crypto
    .createHash("sha256")
    .update(concatenatedString)
    .digest("hex");

  try {
    const response = await axios.post(
      `${WOMPI_API_URL}/checkouts`,
      {
        // La creación del checkout es más simple
        amount_in_cents: amountInCents,
        currency: "COP",
        customer_email: customer_email,
        reference: reference,
        redirect_url: redirect_url,
        "signature:integrity": signature,
        customer_data: {
          full_name: customer_name,
          phone_number: customer_phone,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WOMPI_PUBLIC_KEY}`, // ¡Usa la llave PÚBLICA para el checkout!
        },
      }
    );

    // El checkout devuelve un ID diferente
    const checkout = response.data.data;
    res.json({ checkoutId: checkout.id });
  } catch (error) {
    console.error(
      "Error al crear el checkout en Wompi:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "No se pudo crear el checkout." });
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
