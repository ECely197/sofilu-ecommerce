// Contenido completo y corregido para: backend/src/routes/payments.js

const express = require("express");
const router = express.Router();
const { MercadoPagoConfig, Preference } = require("mercadopago"); // ¡NUEVA FORMA DE IMPORTAR!
const { authMiddleware } = require("../middleware/authMiddleware");

// --- ¡NUEVA FORMA DE INICIALIZAR! ---
// 1. Creamos un 'cliente' de Mercado Pago con nuestro Access Token.
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});
// 2. Creamos una instancia del servicio de Preferencias usando el cliente.
const preferenceClient = new Preference(client);
// ------------------------------------

// Ruta para crear una "preferencia de pago"
router.post("/create_preference", [authMiddleware], async (req, res) => {
  try {
    // ¡RECIBIMOS payerInfo!
    const { items, payerInfo } = req.body;

    if (!items || !payerInfo) {
      return res
        .status(400)
        .json({ error: "Faltan datos de items o del pagador." });
    }

    const preferenceItems = items.map((item) => ({
      title: item.name,
      description: item.description,
      picture_url: item.picture_url,
      category_id: item.category_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: "COP",
    }));

    const preference = {
      items: preferenceItems,
      // --- ¡CONSTRUIMOS EL OBJETO PAYER COMPLETO! ---
      payer: {
        name: payerInfo.name,
        surname: payerInfo.surname,
        email: payerInfo.email,
        entity_type: "individual",
      },
      // ---------------------------------------------
      back_urls: {
        success: `${process.env.FRONTEND_URL}/order-confirmation?status=approved`,
        failure: `${process.env.FRONTEND_URL}/cart`,
        pending: `${process.env.FRONTEND_URL}/cart`,
      },
      auto_return: "approved",
      statement_descriptor: "SOFILU SHOP",
    };

    const response = await preferenceClient.create({ body: preference });
    res.json({ id: response.id });
  } catch (error) {
    console.error(
      "--- PAYMENTS.JS: ERROR al crear la preferencia de Mercado Pago ---"
    );
    console.error(
      "Detalles del error:",
      error.cause || error.response?.data || error.message
    );
    res.status(500).json({ error: "No se pudo generar el enlace de pago." });
  }
});

module.exports = router;
