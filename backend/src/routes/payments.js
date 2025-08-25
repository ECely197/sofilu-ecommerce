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
    const { items, grandTotal } = req.body;

    const preferenceItems = items.map((item) => ({
      title: item.product.name,
      description: Object.values(item.selectedVariants).join(" / "),
      picture_url:
        item.product.images && item.product.images.length > 0
          ? item.product.images[0]
          : undefined,
      category_id: item.product.category,
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
      "--- Creando preferencia de pago con los siguientes datos: ---"
    );
    console.log(JSON.stringify(preference, null, 2));

    // 3. ¡NUEVA FORMA DE CREAR LA PREFERENCIA!
    // Usamos la instancia 'preferenceClient' que creamos al principio.
    const response = await preferenceClient.create({ body: preference });

    console.log("--- Preferencia creada con éxito. ID:", response.id, "---");

    // 4. Devolvemos el ID de la preferencia al frontend.
    res.json({ id: response.id });
  } catch (error) {
    console.error("Error al crear la preferencia de Mercado Pago:", error);
    res.status(500).json({ error: "No se pudo generar el enlace de pago." });
  }
});

module.exports = router;
