const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios"); // ¡Importante para consultar a Wompi!
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const { authMiddleware } = require("../middleware/authMiddleware");

// URL de Wompi según el entorno (Sandbox vs Producción)
// Verifica que WOMPI_PUBLIC_KEY empiece con pub_prod para saber si es prod
const isProduction =
  process.env.WOMPI_PUBLIC_KEY &&
  process.env.WOMPI_PUBLIC_KEY.startsWith("pub_prod");
const WOMPI_API_URL = isProduction
  ? "https://production.wompi.co/v1"
  : "https://sandbox.wompi.co/v1";

// ==========================================================================
// 1. INICIAR TRANSACCIÓN
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
    });

    const savedOrder = await newOrder.save();

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
// 2. WEBHOOK (Wompi avisa aquí)
// ==========================================================================
router.post("/webhook", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data?.transaction) return res.status(200).send("No data");

    const transaction = data.transaction;
    await processTransactionUpdate(
      transaction.reference,
      transaction.id,
      transaction.status
    );

    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Error en Webhook:", error);
    res.status(500).send("Server Error");
  }
});

// ==========================================================================
// 3. CONSULTAR ESTADO (Para que el Frontend verifique al cargar "Gracias")
// ==========================================================================
router.get("/check-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: "Orden no encontrada" });

    // Si ya está pagada, responder OK
    if (order.status === "Procesando" || order.status === "Enviado") {
      return res.json({ status: "APPROVED", order });
    }

    // Si sigue pendiente, CONSULTAMOS A WOMPI
    try {
      // Usamos la llave PRIVADA para consultar (debe ser la correcta: test o prod)
      const response = await axios.get(
        `${WOMPI_API_URL}/transactions?reference=${orderId}`,
        {
          headers: { Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}` },
        }
      );

      const transactions = response.data.data;
      if (transactions && transactions.length > 0) {
        // Tomamos la transacción más reciente
        const lastTransaction = transactions[0];

        // Si Wompi dice que está aprobada, actualizamos nuestra BD
        if (lastTransaction.status === "APPROVED") {
          await processTransactionUpdate(
            orderId,
            lastTransaction.id,
            "APPROVED"
          );
          // Recargamos la orden actualizada
          const updatedOrder = await Order.findById(orderId);
          return res.json({ status: "APPROVED", order: updatedOrder });
        }
      }
    } catch (wompiError) {
      console.error(
        "Error consultando API Wompi:",
        wompiError.response?.data || wompiError.message
      );
    }

    // Si llegamos aquí, sigue pendiente o fallida
    res.json({
      status: order.status === "Cancelado" ? "DECLINED" : "PENDING",
      order,
    });
  } catch (error) {
    console.error("Error verificando estado:", error);
    res.status(500).json({ message: "Error al verificar" });
  }
});

// --- FUNCIÓN AUXILIAR PARA ACTUALIZAR ORDEN E INVENTARIO ---
async function processTransactionUpdate(orderId, paymentId, status) {
  const order = await Order.findById(orderId);
  if (!order) return;

  // Evitar reprocesar
  if (order.status === "Procesando" || order.status === "Enviado") return;

  if (status === "APPROVED") {
    order.status = "Procesando";
    order.paymentId = paymentId;
    order.paymentStatus = "APPROVED";
    await order.save();

    // Descontar inventario
    for (const item of order.items) {
      // Aquí iría tu lógica completa de variantes.
      // Para simplificar, descontamos del stock global si no es variante compleja
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: -item.quantity } }
      );
    }

    // Cupón
    if (order.appliedCoupon) {
      await Coupon.updateOne(
        { code: order.appliedCoupon },
        { $inc: { timesUsed: 1 } }
      );
    }

    // Email
    const populatedOrder = await Order.findById(orderId).populate(
      "items.product"
    );
    await sendOrderConfirmationEmail(populatedOrder);
    console.log(`Orden ${orderId} actualizada a PROCESANDO`);
  } else if (["DECLINED", "VOIDED", "ERROR"].includes(status)) {
    order.status = "Cancelado";
    order.paymentStatus = status;
    await order.save();
  }
}

module.exports = router;
