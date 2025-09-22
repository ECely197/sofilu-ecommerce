/**
 * @fileoverview Servicio de Email.
 * Este módulo se encarga de configurar el transporte de correo (Nodemailer)
 * y de la lógica para renderizar y enviar correos electrónicos transaccionales.
 * Está desacoplado de las rutas para promover una arquitectura limpia.
 */

const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

// 1. Configuración del Transporter de Nodemailer
// Se utiliza un único transporter que se reutiliza en toda la aplicación.
// La configuración se obtiene de variables de entorno para mayor seguridad.
const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  secure: true,
  port: 465,
  auth: {
    user: "resend", // El usuario para la API de Resend es siempre "resend"
    pass: process.env.RESEND_API_KEY, // La clave de API se carga de forma segura
  },
});

/**
 * Renderiza y envía un correo de confirmación de pedido.
 * @param {object} order - El objeto de pedido completo de Mongoose.
 * @returns {Promise<void>} No devuelve nada, pero registra el éxito o el error.
 * @throws {Error} Lanza un error si la renderización de la plantilla o el envío fallan.
 */
async function sendOrderConfirmationEmail(order) {
  try {
    // 2. Renderización de la plantilla EJS
    const templatePath = path.join(
      __dirname,
      "../views/order-confirmation-email.ejs"
    );

    // Es una buena práctica convertir el documento de Mongoose a un objeto plano
    // antes de pasarlo a una plantilla para evitar problemas con getters/virtuals.
    const orderObject = order.toObject();

    // Renderiza el archivo EJS a un string HTML, inyectando los datos del pedido.
    const html = await ejs.renderFile(templatePath, { order: orderObject });

    // 3. Configuración de las opciones del correo
    const mailOptions = {
      from: "Sofilu Store <onboarding@resend.dev>", // Dirección de remitente amigable
      to: order.customerInfo.email, // Email del cliente
      bcc: "edwincely6@gmail.com", // Copia oculta para el administrador
      subject: `Confirmación de tu pedido #${order._id
        .toString()
        .slice(-6)
        .toUpperCase()}`, // Asunto claro y útil
      html: html, // El cuerpo del correo es el HTML renderizado
    };

    // 4. Envío del correo
    await transporter.sendMail(mailOptions);
    console.log(
      `Correo de confirmación enviado exitosamente a: ${order.customerInfo.email}`
    );
  } catch (error) {
    console.error(
      "ERROR: No se pudo enviar el correo de confirmación de pedido.",
      error
    );
    // En una aplicación real, aquí se podría registrar el error en un servicio de monitoreo.
  }
}

module.exports = { sendOrderConfirmationEmail };
