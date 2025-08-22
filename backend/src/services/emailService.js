// Contenido completo y final para: backend/src/services/emailService.js

const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  secure: true,
  port: 465,
  auth: {
    user: "resend",
    pass: process.env.RESEND_API_KEY,
  },
});

async function sendOrderConfirmationEmail(order) {
  try {
    const templatePath = path.join(
      __dirname,
      "../views/order-confirmation-email.ejs"
    );

    // --- ¡LA SOLUCIÓN CLAVE ESTÁ AQUÍ! ---
    // Convertimos el documento complejo de Mongoose a un objeto simple de JavaScript
    // antes de pasarlo a la plantilla. Esto elimina todos los metadatos extra.
    const orderObject = order.toObject();

    // Ahora le pasamos el objeto "limpio" a la plantilla.
    const html = await ejs.renderFile(templatePath, { order: orderObject });

    const mailOptions = {
      from: "Sofilu Store <onboarding@resend.dev>",
      to: order.customerInfo.email, // Se envía al cliente
      bcc: "edwincely6@gmail.com", // ¡Se envía una copia oculta al administrador!
      subject: `Nuevo Pedido #${order._id
        .toString()
        .slice(-6)
        .toUpperCase()} - Sofilu`,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `--- CORREO DE CONFIRMACIÓN ENVIADO a ${order.customerInfo.email} y al admin ---`
    );
  } catch (error) {
    console.error("--- ERROR AL ENVIAR CORREO DE CONFIRMACIÓN ---");
    console.error(error);
  }
}

module.exports = { sendOrderConfirmationEmail };
