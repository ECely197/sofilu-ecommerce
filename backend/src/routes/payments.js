// Contenido completo para: backend/src/routes/payments.js

const express = require("express");
const router = express.Router();
const mercadopago = require("mercadopago");
const { authMiddleware } = require("../middleware/authMiddleware");

// 1. Configuramos el SDK de Mercado Pago con nuestro Access Token
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// Ruta para crear una "preferencia de pago"
router.post("/create_preference", [authMiddleware], async (req, res) => {
  try {
    const { items, grandTotal } = req.body; // Recibimos los items y el total del frontend

    // 2. Creamos un array de "items" en el formato que Mercado Pago necesita
    const preferenceItems = items.map((item) => ({
      title: item.product.name,
      description: Object.values(item.selectedVariants).join(" / "), // ej: "S / Azul"
      picture_url: item.product.images[0],
      category_id: item.product.category,
      quantity: item.quantity,
      unit_price: item.price, // El precio final del item (base + modificadores)
      currency_id: "COP",
    }));

    // 3. Creamos el objeto de "preferencia" completo
    const preference = {
      items: preferenceItems,
      // URLs a las que Mercado Pago redirigirá al usuario después del pago
      back_urls: {
        success: `${process.env.FRONTEND_URL}/order-confirmation`, // URL de éxito (simplificada por ahora)
        failure: `${process.env.FRONTEND_URL}/cart`, // Si falla, lo devolvemos al carrito
        pending: `${process.env.FRONTEND_URL}/cart`, // Si queda pendiente
      },
      auto_return: "approved", // Redirige automáticamente en caso de éxito
      statement_descriptor: "SOFILU SHOP", // Lo que aparecerá en el extracto de la tarjeta
    };

    // 4. Creamos la preferencia usando el SDK
    const response = await mercadopago.preferences.create(preference);

    // 5. Devolvemos el ID de la preferencia al frontend.
    //    Este ID es lo que el frontend necesita para renderizar el botón de pago.
    res.json({ id: response.body.id });
  } catch (error) {
    console.error("Error al crear la preferencia de Mercado Pago:", error);
    res.status(500).json({ error: "No se pudo generar el enlace de pago." });
  }
});

module.exports = router;
