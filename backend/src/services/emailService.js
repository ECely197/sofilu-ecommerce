// Contenido actualizado para: backend/src/services/emailService.js

const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

// --- ¡NUEVA CONFIGURACIÓN PARA RESEND! ---
const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  secure: true, // usa SSL
  port: 465,
  auth: {
    user: "resend", // Esto debe ser literalmente la palabra 'resend'
    pass: process.env.RESEND_API_KEY, // Usamos nuestra nueva clave de API
  },
});
// -----------------------------------------

/**
 * Envía un correo de confirmación de pedido.
 */
async function sendOrderConfirmationEmail(order) {
  try {
    const templatePath = path.join(
      __dirname,
      "../views/order-confirmation-email.ejs"
    );
    const html = await ejs.renderFile(templatePath, { order });

    const mailOptions = {
      // IMPORTANTE: Resend por defecto envía desde 'onboarding@resend.dev'.
      // Para usar tu propio dominio, necesitas verificarlo en el panel de Resend,
      // lo cual es muy recomendable para producción.
      from: "Sofilu Store <onboarding@resend.dev>",
      to: order.customerInfo.email,
      subject: `¡Gracias por tu pedido, ${
        order.customerInfo.name
      }! Pedido #${order._id.toString().slice(-6).toUpperCase()}`,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `--- CORREO DE CONFIRMACIÓN ENVIADO (vía Resend): ${info.messageId} ---`
    );
  } catch (error) {
    console.error(
      "--- ERROR AL ENVIAR CORREO DE CONFIRMACIÓN (vía Resend) ---"
    );
    console.error(error);
  }
}

module.exports = { sendOrderConfirmationEmail };
