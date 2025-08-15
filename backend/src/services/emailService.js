// Contenido para: backend/src/services/emailService.js
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

    // Renderizamos el HTML, pasándole el objeto 'order' completo a la plantilla
    const html = await ejs.renderFile(templatePath, { order });

    const mailOptions = {
      from: "Sofilu Store <onboarding@resend.dev>", // Email por defecto de Resend
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
    console.error("--- ERROR AL ENVIAR CORREO DE CONFIRMACIÓN ---");
    console.error(error); // Este error aparecerá en los logs de Render
  }
}

module.exports = { sendOrderConfirmationEmail };
