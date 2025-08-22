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

    const orderObject = order.toObject();

    const html = await ejs.renderFile(templatePath, { order: orderObject });

    const mailOptions = {
      from: "Sofilu Store <onboarding@resend.dev>",
      to: order.customerInfo.email,
      bcc: "edwincely6@gmail.com",
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
