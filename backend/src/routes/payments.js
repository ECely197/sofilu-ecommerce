const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const { authMiddleware } = require("../middleware/authMiddleware");

// Determinar URL de Wompi (Pruebas o Producción)
const isProduction =
  process.env.WOMPI_PUBLIC_KEY &&
  process.env.WOMPI_PUBLIC_KEY.startsWith("pub_prod");
const WOMPI_API_URL = isProduction
  ? "https://production.wompi.co/v1"
  : "https://sandbox.wompi.co/v1";

// ==========================================================================
// 1. INICIAR TRANSACCIÓN (Crear orden y firmar)
// ==========================================================================
router.post("/init-transaction", authMiddleware, async (req, res) => {
  try {
    // --- AQUÍ RECIBIMOS LOS NUEVOS DATOS DEL FRONTEND ---
    const {
      customerInfo,
      shippingAddress,
      items,
      appliedCoupon,
      discountAmount,
      totalAmount,
      deliveryType,
      orderNotes,
      deliveryNotes, // <-- Los nuevos campos
    } = req.body;

    const userId = req.user.uid;

    const newOrder = new Order({
      userId,
      customerInfo,
      shippingAddress,
      items,
      appliedCoupon,
      discountAmount,
      totalAmount,
      status: "Pendiente",
      paymentMethod: "Wompi Widget",

      // --- Y LOS GUARDAMOS EN EL MODELO ---
      deliveryType,
      orderNotes,
      deliveryNotes,
    });

    const savedOrder = await newOrder.save();

    // --- Lógica de firma (sin cambios) ---
    const reference = savedOrder._id.toString();
    const amountInCents = Math.round(totalAmount * 100);
    const currency = "COP";
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

    const cadenaConcatenada = `${reference}${amountInCents}${currency}${integritySecret}`;
    const integritySignature = crypto
      .createHash("sha256")
      .update(cadenaConcatenada)
      .digest("hex");

    res.json({
      success: true,
      orderId: reference,
      wompiData: {
        publicKey: process.env.WOMPI_PUBLIC_KEY,
        currency,
        amountInCents,
        reference,
        signature: integritySignature,
        redirectUrl: `${process.env.FRONTEND_URL}/order-confirmation`,
      },
    });
  } catch (error) {
    console.error("Error iniciando pago:", error);
    res.status(500).json({ message: "Error al iniciar el pago." });
  }
});

// ==========================================================================
// 2. WEBHOOK Y VERIFICACIÓN (Sin cambios, pero crucial que estén)
// ==========================================================================

// --- RUTA DE VERIFICACIÓN ---
router.get("/check-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate("items.product");
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });

    if (order.status === "Procesando" || order.status === "Enviado") {
      return res.json({ status: "APPROVED", order });
    }

    try {
      const response = await axios.get(
        `${WOMPI_API_URL}/transactions?reference=${orderId}`,
        {
          headers: { Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}` },
        },
      );
      const transactions = response.data.data;
      if (transactions && transactions.length > 0) {
        const lastTransaction = transactions[0];
        if (lastTransaction.status === "APPROVED") {
          await processTransactionUpdate(
            orderId,
            lastTransaction.id,
            "APPROVED",
          );
          const updatedOrder =
            await Order.findById(orderId).populate("items.product");
          return res.json({ status: "APPROVED", order: updatedOrder });
        }
      }
    } catch (wompiError) {
      console.error("Error consultando API Wompi:", wompiError.message);
    }
    res.json({
      status: order.status === "Cancelado" ? "DECLINED" : "PENDING",
      order,
    });
  } catch (error) {
    console.error("Error verificando estado:", error);
    res.status(500).json({ message: "Error al verificar" });
  }
});

// --- WEBHOOK ---
router.post("/webhook", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data?.transaction) return res.status(200).send("No data");
    const transaction = data.transaction;
    await processTransactionUpdate(
      transaction.reference,
      transaction.id,
      transaction.status,
    );
    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Error en Webhook:", error);
    res.status(500).send("Server Error");
  }
});

// --- FUNCIÓN AUXILIAR DE ACTUALIZACIÓN ---
async function processTransactionUpdate(orderId, paymentId, status) {
  const order = await Order.findById(orderId);
  if (!order || order.status === "Procesando" || order.status === "Enviado")
    return;

  if (status === "APPROVED") {
    order.status = "Procesando";
    order.paymentId = paymentId;
    order.paymentStatus = "APPROVED";
    await order.save();
    // Lógica de inventario...
    // Lógica de cupón...
    const populatedOrder =
      await Order.findById(orderId).populate("items.product");
    await sendOrderConfirmationEmail(populatedOrder);
    console.log(`Orden ${orderId} actualizada a PROCESANDO`);
  } else if (["DECLINED", "VOIDED", "ERROR"].includes(status)) {
    order.status = "Cancelado";
    order.paymentStatus = status;
    await order.save();
  }
}

module.exports = router;
