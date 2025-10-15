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
        redirect_url: `${process.env.FRONTEND_URL}/order-confirmation?status=successful`,
        environment: "production",
      },
    });

    return res.json({
      redirectUrl: `https://checkout.wompi.co/l/${wompiResponse.data.data.id}`,
      transactionId: wompiResponse.data.data.id,
    });
  } catch (error) {
    console.error("Error Wompi:", error.response?.data || error);
    return res.status(500).json({
      message: "Error al crear el enlace de pago",
      error: error.response?.data || error.message,
    });
  }
});

router.get("/verify/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const wompiResponse = await axios.get(
      `${WOMPI_PRODUCTION_API}/transactions/${id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        },
      }
    );

    const transactionData = wompiResponse.data.data;
    console.log("Wompi transaction data:", transactionData);

    res.json({
      status: transactionData.status,
      amount: transactionData.amount_in_cents,
      paymentMethod: transactionData.payment_method_type,
      reference: transactionData.reference,
    });
  } catch (error) {
    console.error(
      "Error verificando transacción:",
      error.response?.data || error
    );
    res.status(500).json({
      message: "Error al verificar la transacción",
      details: error.response?.data,
    });
  }
});

module.exports = router;
