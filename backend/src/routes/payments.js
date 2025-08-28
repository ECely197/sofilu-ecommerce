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
    console.log(
      "--- PAYMENTS.JS [1/3]: Petición recibida en /create_preference. ---"
    );
    const { items, grandTotal } = req.body;

    // Log para verificar los datos recibidos
    console.log("--- PAYMENTS.JS: Total recibido:", grandTotal);
    console.log(
      "--- PAYMENTS.JS: Items recibidos:",
      JSON.stringify(items, null, 2)
    );

    if (!items || !grandTotal) {
      console.error(
        "--- PAYMENTS.JS: ERROR - Faltan 'items' o 'grandTotal' en el body."
      );
      return res.status(400).json({ error: "Datos incompletos." });
    }

    const preferenceItems = items.map((item) => ({
      title: item.product.name,
      description: Object.values(item.selectedVariants).join(" / "),
      picture_url:
        item.product.images && item.product.images.length > 0
          ? item.product.images[0]
          : undefined,
      category_id:
        typeof item.product.category === "string"
          ? item.product.category
          : item.product.category?._id,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: "COP",
    }));

    const preference = {
      items: preferenceItems,
      back_urls: {
        success: `${process.env.FRONTEND_URL}/order-confirmation`,
        failure: `${process.env.FRONTEND_URL}/cart`,
        pending: `${process.env.FRONTEND_URL}/cart`,
        success: `${process.env.FRONTEND_URL}/order-confirmation?status=approved`,
      },
      auto_return: "approved",
      statement_descriptor: "SOFILU SHOP",
    };

    console.log(
      "--- PAYMENTS.JS [2/3]: Objeto de preferencia construido. Enviando a Mercado Pago... ---"
    );
    const response = await preferenceClient.create({ body: preference });

    console.log(
      "--- PAYMENTS.JS [3/3]: Preferencia creada con éxito. Devolviendo ID al frontend:",
      response.id
    );
    res.json({ id: response.id });
  } catch (error) {
    console.error(
      "--- PAYMENTS.JS: ERROR al crear la preferencia de Mercado Pago:",
      error
    );
    res.status(500).json({ error: "No se pudo generar el enlace de pago." });
  }
});

module.exports = router;
