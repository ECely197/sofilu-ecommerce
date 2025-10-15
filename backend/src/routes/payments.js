const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto"); // Añadimos esta importación

// Constantes para URLs de producción
const WOMPI_API_URL = "https://api.wompi.co/v1";
const WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/l";

// Ruta para generar la firma de integridad
router.post("/create-signature", async (req, res) => {
  try {
    const { reference, amount_in_cents, currency } = req.body;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

    // Crear la firma de integridad
    const concatenatedString = `${reference}${amount_in_cents}${currency}${integritySecret}`;
    const hash = crypto
      .createHash("sha256")
      .update(concatenatedString)
      .digest("hex");

    res.json({ signature: hash });
  } catch (error) {
    console.error("Error al generar la firma de integridad:", error);
    res.status(500).json({ message: "Error al generar la firma" });
  }
});

// Ruta para crear la transacción
router.post("/create-transaction", async (req, res) => {
  try {
    const {
      amount_in_cents,
      customer_email,
      customer_name,
      customer_phone,
      reference,
    } = req.body;

    // Usar URL de producción
    const wompiResponse = await axios({
      method: "post",
      url: `${WOMPI_API_URL}/payment_links`,
      headers: {
        Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        "Content-Type": "application/json",
      },
      data: {
        name: "Pago Sofilu Shop",
        description: `Orden #${reference}`,
        single_use: true,
        currency: "COP",
        amount_in_cents,
        collect_shipping: false,
        collect_customer_legal_id: false,
        customer_data: {
          email: customer_email,
          full_name: customer_name,
          phone_number: customer_phone,
        },
        redirect_url: `${process.env.FRONTEND_URL}/order-confirmation`,
        production_payment_source: true, // Forzar modo producción
      },
    });

    // URL de checkout de producción
    const checkoutUrl = `${WOMPI_CHECKOUT_URL}/${wompiResponse.data.data.id}`;

    return res.json({
      redirectUrl: checkoutUrl,
      transactionId: wompiResponse.data.data.id,
      mode: "production", // Para verificación
    });
  } catch (error) {
    console.error("Wompi API Error:", error.response?.data || error);
    return res.status(500).json({
      message: "Error al crear el enlace de pago",
      error: error.response?.data || error.message,
    });
  }
});

// Ruta para manejar las notificaciones de Wompi

module.exports = router;
