const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");

// --- ¡NUEVA SINTAXIS DE MERCADO PAGO V2! ---
const { MercadoPagoConfig, Preference } = require("mercadopago");

// 1. Crea un cliente de Mercado Pago con tu Access Token SECRETO.
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

router.post("/create_preference", [authMiddleware], async (req, res) => {
  const { items, payerInfo } = req.body;

  try {
    // 2. Crea un objeto de preferencia.
    const preference = new Preference(client);

    // 3. Usa el método `create` para generar la preferencia.
    const result = await preference.create({
      body: {
        items: items.map((item) => ({
          title: item.name,
          description: item.description || "",
          picture_url: item.picture_url,
          quantity: Number(item.quantity),
          currency_id: "COP",
          unit_price: Number(item.unit_price),
        })),
        payer: {
          name: payerInfo.name,
          surname: payerInfo.surname || "",
          email: payerInfo.email,
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/order-confirmation`,
          failure: `${process.env.FRONTEND_URL}/cart`, // Vuelve al carrito si falla
          pending: `${process.env.FRONTEND_URL}/cart`, // Vuelve al carrito si está pendiente
        },
        auto_return: "approved",
      },
    });

    // 4. Envía el ID de la preferencia al frontend.
    res.json({ id: result.id });
  } catch (error) {
    console.error("Error al crear la preferencia de Mercado Pago:", error);
    res.status(500).json({ message: "No se pudo generar el enlace de pago." });
  }
});

module.exports = router;
