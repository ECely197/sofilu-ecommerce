const express = require("express");
const router = express.Router();
const crypto = require("crypto"); // Nativo de Node.js para encriptar
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const { authMiddleware } = require("../middleware/authMiddleware");

// ==========================================================================
// 1. INICIAR TRANSACCIÓN (Generar Firma para Widget)
// ==========================================================================
router.post("/init-transaction", authMiddleware, async (req, res) => {
  try {
    const {
      customerInfo,
      shippingAddress,
      items,
      appliedCoupon,
      discountAmount,
      totalAmount,
    } = req.body;

    const userId = req.user.uid;

    // 1. Crear la Orden en Base de Datos (Estado: Pendiente)
    // Usamos el _id de Mongo como la "Referencia" única para Wompi
    const newOrder = new Order({
      userId,
      customerInfo,
      shippingAddress,
      items,
      appliedCoupon,
      discountAmount,
      totalAmount,
      status: "Pendiente", // Importante: Aún no está pagada
      paymentMethod: "Wompi Widget",
    });

    const savedOrder = await newOrder.save();

    // 2. Preparar datos para Wompi
    // Wompi exige valores en CENTAVOS (multiplicar por 100) y cadena exacta.
    const reference = savedOrder._id.toString();
    const amountInCents = Math.round(totalAmount * 100);
    const currency = "COP";

    // OJO: Asegúrate de tener WOMPI_INTEGRITY_SECRET en tu archivo .env
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

    if (!integritySecret) {
      throw new Error(
        "Falta el secreto de integridad en las variables de entorno"
      );
    }

    // 3. GENERAR HASH DE INTEGRIDAD (SHA-256)
    // Fórmula: Referencia + MontoEnCentavos + Moneda + SecretoIntegridad
    const cadenaConcatenada = `${reference}${amountInCents}${currency}${integritySecret}`;

    const integritySignature = crypto
      .createHash("sha256")
      .update(cadenaConcatenada)
      .digest("hex");

    // 4. Responder al Frontend con los datos firmados
    res.json({
      success: true,
      orderId: reference,
      wompiData: {
        publicKey: process.env.WOMPI_PUBLIC_KEY,
        currency: currency,
        amountInCents: amountInCents,
        reference: reference,
        signature: integritySignature, // La llave maestra
        redirectUrl: `${process.env.FRONTEND_URL}/order-confirmation`, // Redirección opcional
      },
    });
  } catch (error) {
    console.error("Error iniciando transacción Wompi:", error);
    res.status(500).json({ message: "Error al iniciar el pago." });
  }
});

// ==========================================================================
// 2. WEBHOOK (Wompi notifica aquí el resultado)
// ==========================================================================
router.post("/webhook", async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !data.transaction) {
      return res.status(200).send("No transaction data");
    }

    const transaction = data.transaction;
    const orderId = transaction.reference;
    const status = transaction.status; // 'APPROVED', 'DECLINED', 'ERROR'

    console.log(`[Wompi Webhook] Orden ${orderId} - Estado: ${status}`);

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).send("Order not found");

    // Si ya fue procesada, no hacer nada
    if (order.status === "Procesando" || order.status === "Enviado") {
      return res.status(200).send("Already processed");
    }

    if (status === "APPROVED") {
      order.status = "Procesando";
      order.paymentId = transaction.id;
      order.paymentStatus = "APPROVED";
      await order.save();

      // Descontar Inventario
      for (const item of order.items) {
        if (item.selectedVariants && item.selectedVariants.size > 0) {
          // Lógica variantes (simplificada para el ejemplo)
          // Deberías usar tu lógica detallada de actualización aquí
        } else {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: -item.quantity } }
          );
        }
      }

      // Enviar correo
      const populatedOrder = await Order.findById(orderId).populate(
        "items.product"
      );
      await sendOrderConfirmationEmail(populatedOrder);
    } else if (
      status === "DECLINED" ||
      status === "VOIDED" ||
      status === "ERROR"
    ) {
      order.status = "Cancelado";
      order.paymentStatus = status;
      await order.save();
    }

    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Error en Webhook:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
