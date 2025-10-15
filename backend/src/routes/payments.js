const express = require("express");
const router = express.Router();
const axios = require("axios"); // ¡NUEVA IMPORTACIÓN!
const { authMiddleware } = require("../middleware/authMiddleware");

// URL base de la API de Wompi para el entorno de pruebas (Sandbox)
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

  // --- ¡CORRECCIÓN! ---
  // Construimos el objeto de datos sin el campo `payment_method`
  // para que Wompi muestre todos los métodos disponibles en su checkout.
  const transactionData = {
    amount_in_cents: Math.round(amount * 100), // Usamos Math.round para evitar decimales largos
    currency: "COP",
    customer_email: customer_email,
    reference: reference,
    redirect_url: redirect_url,
    customer_data: {
      full_name: customer_name,
      phone_number: customer_phone,
    },
    payment_methods: ["CARD", "PSE", "NEQUI", "BANCOLOMBIA_TRANSFER"],
  };

  try {
    // --- ¡PETICIÓN DIRECTA CON AXIOS! ---
    const response = await axios.post(
      `${WOMPI_API_URL}/transactions`,
      transactionData,
      {
        headers: {
          // La autenticación se hace con la llave privada en la cabecera
          Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        },
      }
    );

    // La respuesta de axios pone los datos dentro de `data.data`
    const transaction = response.data.data;
    res.json({
      transactionId: transaction.id,
      reference: transaction.reference,
    });
  } catch (error) {
    console.error(
      "Error al crear la transacción en Wompi:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "No se pudo crear la transacción." });
  }
});

// --- RUTA PARA VERIFICAR LA TRANSACCIÓN ---
router.get("/verify-transaction/:id", [authMiddleware], async (req, res) => {
  try {
    const response = await axios.get(
      `${WOMPI_API_URL}/transactions/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        },
      }
    );

    const transaction = response.data.data;
    res.json({ status: transaction.status, reference: transaction.reference });
  } catch (error) {
    console.error(
      "Error al verificar la transacción en Wompi:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "No se pudo verificar la transacción." });
  }
});

module.exports = router;
