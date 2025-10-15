const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto"); // Añadimos esta importación

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

    const wompiResponse = await axios({
      method: "post",
      url: "https://sandbox.wompi.co/v1/payment_links",
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
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        customer_data: {
          email: customer_email,
          full_name: customer_name,
          phone_number: customer_phone,
        },
        redirect_url: `${process.env.FRONTEND_URL}/order-confirmation`,
      },
    });

    // Construir la URL de redirección usando el ID del payment link
    const paymentUrl = `https://checkout.wompi.co/l/${wompiResponse.data.data.id}`;

    return res.json({
      redirectUrl: paymentUrl,
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
