const express = require("express");
const router = express.Router();
const axios = require("axios");

// URLs de producción
const WOMPI_PRODUCTION_API = "https://api.wompi.co/v1";

router.post("/create-transaction", async (req, res) => {
  try {
    const {
      amount_in_cents,
      customer_email,
      customer_name,
      customer_phone,
      reference,
    } = req.body;

    console.log("Using Wompi production keys:", {
      publicKey: process.env.WOMPI_PUBLIC_KEY,
      usingProductionAPI: true,
    });

    const wompiResponse = await axios({
      method: "post",
      url: `${WOMPI_PRODUCTION_API}/payment_links`,
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
        environment: "production", // Forzar ambiente de producción
      },
    });

    console.log("Wompi Response:", {
      id: wompiResponse.data.data.id,
      environment: wompiResponse.data.data.environment,
    });

    return res.json({
      redirectUrl: `https://checkout.wompi.co/l/${wompiResponse.data.data.id}`,
      transactionId: wompiResponse.data.data.id,
      environment: "production",
    });
  } catch (error) {
    console.error("Wompi API Error:", {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    return res.status(500).json({
      message: "Error al crear el enlace de pago",
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
