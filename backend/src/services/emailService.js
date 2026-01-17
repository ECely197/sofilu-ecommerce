/**
 * @fileoverview Servicio de Email con Resend y Notificaciones a Admins.
 */

const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const admin = require("firebase-admin"); // Importamos firebase-admin

// 1. Configuración del Transporter de Nodemailer (sin cambios)
const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  secure: true,
  port: 465,
  auth: {
    user: "resend",
    pass: process.env.RESEND_API_KEY,
  },
});

/**
 * ¡NUEVO! Obtiene una lista de los correos de todos los usuarios administradores.
 * @returns {Promise<string[]>} Un array de strings con los emails de los admins.
 */
async function getAdminEmails() {
  try {
    const adminEmails = [];
    let nextPageToken;

    // Firebase lista usuarios en páginas de 1000
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

      listUsersResult.users.forEach((userRecord) => {
        // Verificamos si el usuario tiene el custom claim de admin
        if (userRecord.customClaims?.admin === true && userRecord.email) {
          adminEmails.push(userRecord.email);
        }
      });

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(
      `[Email Service] Se encontraron ${adminEmails.length} administradores para notificar.`
    );
    return adminEmails;
  } catch (error) {
    console.error(
      "ERROR: No se pudo obtener la lista de administradores:",
      error
    );
    return []; // Devolvemos un array vacío en caso de error
  }
}

/**
 * Renderiza y envía un correo de confirmación de pedido AL CLIENTE y A TODOS LOS ADMINS.
 * @param {object} order - El objeto de pedido completo de Mongoose.
 */
async function sendOrderConfirmationEmail(order) {
  try {
    // 1. Obtenemos la lista de admins ANTES de enviar el correo
    const adminRecipients = await getAdminEmails();

    // 2. Renderización de la plantilla EJS
    const templatePath = path.join(
      __dirname,
      "../views/order-confirmation-email.ejs"
    );
    const orderObject = order.toObject();
    const html = await ejs.renderFile(templatePath, { order: orderObject });

    // 3. Configuración de las opciones del correo (AHORA DINÁMICO)
    const mailOptions = {
      // --- ¡CAMBIO CRÍTICO! ---
      // Reemplaza 'ventas@sofilu.shop' por tu email verificado en Resend.
      from: "Sofilu Store <ventas@sofilu.shop>",

      to: order.customerInfo.email,

      // La copia oculta ahora es la lista de admins
      bcc: adminRecipients,

      subject: `¡Nuevo Pedido Confirmado! #${order._id
        .toString()
        .slice(-6)
        .toUpperCase()}`,
      html: html,
    };

    // 4. Envío del correo
    await transporter.sendMail(mailOptions);
    console.log(
      `Correo de confirmación enviado a: ${order.customerInfo.email} y ${adminRecipients.length} admin(s).`
    );
  } catch (error) {
    console.error(
      "ERROR: No se pudo enviar el correo de confirmación de pedido.",
      error
    );
  }
}

module.exports = { sendOrderConfirmationEmail };
