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
    // Ahora solo recibimos 'items' y 'grandTotal' (aunque grandTotal no se usa para la preferencia)
    const { items } = req.body;

    // Log para verificar los datos recibidos
    console.log(
      "--- PAYMENTS.JS: Items recibidos del frontend:",
      JSON.stringify(items, null, 2)
    );

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Datos de items incompletos." });
    }

    // --- ¡LÓGICA SIMPLIFICADA! ---
    // Mapeamos directamente los items, añadiendo solo la moneda.
    const preferenceItems = items.map((item) => ({
      title: item.name,
      description: item.description,
      picture_url: item.picture_url,
      category_id: item.category_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: "COP", // Añadimos la moneda aquí
    }));

    const preference = {
      items: preferenceItems,

      // --- ¡AÑADIR ESTA SECCIÓN COMPLETA! ---
      payer: {
        // Asumimos que todos los compradores son personas naturales por ahora.
        // Esto es un requisito para algunos flujos de pago en Colombia.
        entity_type: "individual",
      },
      // ------------------------------------

      back_urls: {
        success: `${process.env.FRONTEND_URL}/order-confirmation?status=approved`,
        failure: `${process.env.FRONTEND_URL}/cart`,
        pending: `${process.env.FRONTEND_URL}/cart`,
      },
      auto_return: "approved",
      statement_descriptor: "SOFILU SHOP",
    };

    console.log(
      "--- PAYMENTS.JS [2/3]: Objeto de preferencia construido. Enviando a Mercado Pago... ---"
    );
    const response = await preferenceClient.create({ body: preference });

    console.log(
      "--- PAYMENTS.JS [3/3]: Preferencia creada. Devolviendo ID:",
      response.id
    );
    res.json({ id: response.id });
  } catch (error) {
    // --- Log de error más detallado ---
    console.error(
      "--- PAYMENTS.JS: ERROR al crear la preferencia de Mercado Pago ---"
    );
    // El SDK de Mercado Pago a menudo incluye detalles en error.cause o error.response
    console.error(
      "Detalles del error:",
      error.cause || error.response?.data || error.message
    );
    res.status(500).json({ error: "No se pudo generar el enlace de pago." });
  }
});

module.exports = router;
