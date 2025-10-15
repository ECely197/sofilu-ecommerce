const express = require("express");
const router = express.Router();
const axios = require("axios");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");

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
      url: "https://sandbox.wompi.co/v1/payment_links", // Cambiamos a payment_links
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
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        customer_data: {
          email: customer_email,
          full_name: customer_name,
          phone_number: customer_phone,
        },
        redirect_url: `${process.env.FRONTEND_URL}/order-confirmation`,
      },
    });

    // La respuesta incluirá la URL de redirección
    return res.json({
      redirectUrl: wompiResponse.data.data.url,
    });
  } catch (error) {
    console.error("Wompi API Error:", {
      status: error.response?.status,
      data: error.response?.data,
    });

    return res.status(500).json({
      message: "Error al crear el enlace de pago",
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
