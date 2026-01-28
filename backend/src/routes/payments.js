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
    const {
      customerInfo,
      shippingAddress,
      items,
      appliedCoupon,
      discountAmount,
      totalAmount,
      deliveryType,
      orderNotes,
      deliveryNotes,
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
      deliveryType,
      orderNotes,
      deliveryNotes,
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
// 2. VERIFICACIÓN MANUAL (Llamada por el Frontend al cargar OrderConfirmation)
// ==========================================================================
router.get("/check-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Buscamos la orden
    const order = await Order.findById(orderId).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    // 1. Si ya estaba procesada, devolvemos éxito inmediatamente (evita re-procesar)
    if (
      order.status === "Procesando" ||
      order.status === "Enviado" ||
      order.status === "Entregado"
    ) {
      return res.json({ status: "APPROVED", order });
    }

    // 2. Si sigue pendiente, consultamos a Wompi
    try {
      // Usamos la llave privada para consultar la API de Wompi
      const response = await axios.get(
        `${WOMPI_API_URL}/transactions?reference=${orderId}`,
        {
          headers: { Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}` },
        },
      );

      const transactions = response.data.data;

      if (transactions && transactions.length > 0) {
        // Tomamos la transacción más reciente
        const lastTransaction = transactions[0];

        if (lastTransaction.status === "APPROVED") {
          // --- LÓGICA DE APROBACIÓN ---
          console.log(
            `[Check-Status] Pago APROBADO en Wompi para orden ${orderId}`,
          );

          // Actualizamos la orden
          order.status = "Procesando";
          order.paymentId = lastTransaction.id;
          order.paymentStatus = "APPROVED";
          await order.save();

          // Re-popular para asegurar que el email tenga toda la info (imágenes, nombres)
          const populatedOrder =
            await Order.findById(orderId).populate("items.product");

          // ENVIAR CORREO (Intentar, pero no bloquear respuesta si falla)
          console.log(`[Check-Status] Intentando enviar correo...`);
          try {
            await sendOrderConfirmationEmail(populatedOrder);
            console.log(`[Check-Status] Correo enviado exitosamente.`);
          } catch (emailError) {
            console.error(
              `[Check-Status] ERROR enviando correo:`,
              emailError.message,
            );
          }

          return res.json({ status: "APPROVED", order: populatedOrder });
        } else if (
          ["DECLINED", "VOIDED", "ERROR"].includes(lastTransaction.status)
        ) {
          // --- LÓGICA DE RECHAZO ---
          order.status = "Cancelado";
          order.paymentStatus = lastTransaction.status;
          await order.save();
          return res.json({ status: "DECLINED", order });
        }
      }
    } catch (wompiError) {
      console.error("Error consultando API Wompi:", wompiError.message);
    }

    // Si llegamos aquí, sigue pendiente o no hubo respuesta clara
    res.json({
      status: order.status === "Cancelado" ? "DECLINED" : "PENDING",
      order,
    });
  } catch (error) {
    console.error("Error verificando estado:", error);
    res.status(500).json({ message: "Error al verificar" });
  }
});

// ==========================================================================
// 3. WEBHOOK (Respaldo asíncrono)
// ==========================================================================
router.post("/webhook", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data?.transaction) return res.status(200).send("No data");

    const transaction = data.transaction;

    // Llamamos a la función auxiliar para procesar
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

/**
 * Función auxiliar para actualizar la orden desde el Webhook.
 * Se usa para casos donde el usuario cerró el navegador antes de ver la confirmación.
 */
async function processTransactionUpdate(orderId, paymentId, status) {
  try {
    const order = await Order.findById(orderId);

    // Si no existe o ya fue procesada, no hacemos nada
    if (
      !order ||
      ["Procesando", "Enviado", "Entregado"].includes(order.status)
    ) {
      console.log(`[Webhook] Orden ${orderId} ya procesada o no encontrada.`);
      return;
    }

    if (status === "APPROVED") {
      order.status = "Procesando";
      order.paymentId = paymentId;
      order.paymentStatus = "APPROVED";
      await order.save();

      // Enviar Correo
      console.log(`[Webhook] Enviando correo para orden ${orderId}`);
      const populatedOrder =
        await Order.findById(orderId).populate("items.product");
      await sendOrderConfirmationEmail(populatedOrder);
    } else if (["DECLINED", "VOIDED", "ERROR"].includes(status)) {
      order.status = "Cancelado";
      order.paymentStatus = status;
      await order.save();
      console.log(`[Webhook] Orden ${orderId} CANCELADA.`);
    }
  } catch (error) {
    console.error(`[Webhook] Error procesando actualización:`, error);
  }
}

module.exports = router;
