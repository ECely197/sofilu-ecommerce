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
  port: 587, // CAMBIO: Usamos 587 en lugar de 465
  secure: false, // CAMBIO: false para puerto 587 (usa STARTTLS automáticamente)
  auth: {
    user: "resend",
    pass: process.env.RESEND_API_KEY,
  },
  // Opciones adicionales para evitar timeouts en Render
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: true,
  },
  connectionTimeout: 10000, // 10 segundos
  greetingTimeout: 10000, // 10 segundos
  socketTimeout: 10000, // 10 segundos
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
      `[Email Service] Se encontraron ${adminEmails.length} administradores para notificar.`,
    );
    return adminEmails;
  } catch (error) {
    console.error(
      "ERROR: No se pudo obtener la lista de administradores:",
      error,
    );
    return []; // Devolvemos un array vacío en caso de error
  }
}

/**
 * Renderiza y envía un correo de confirmación de pedido AL CLIENTE y A TODOS LOS ADMINS.
 * @param {object} order - El objeto de pedido completo de Mongoose.
 */
async function sendOrderConfirmationEmail(order) {
  // --- CHIVATO #1: ¿Se está leyendo la API Key? ---
  console.log("[Email Service] Verificando RESEND_API_KEY...");
  if (!process.env.RESEND_API_KEY) {
    console.error(
      "[Email Service] ¡ERROR FATAL! La variable de entorno RESEND_API_KEY no fue encontrada.",
    );
    return; // Detenemos la función si no hay clave
  }
  console.log("[Email Service] RESEND_API_KEY encontrada.");

  try {
    const adminRecipients = await getAdminEmails();
    const templatePath = path.join(
      __dirname,
      "../views/order-confirmation-email.ejs",
    );
    const html = await ejs.renderFile(templatePath, {
      order: order.toObject(),
    });

    const mailOptions = {
      from: "Sofilu Store <ventas@sofilu.shop>",
      to: order.customerInfo.email,
      bcc: adminRecipients,
      subject: `¡Nuevo Pedido Confirmado! #${order._id
        .toString()
        .slice(-6)
        .toUpperCase()}`,
      html: html,
    };

    // --- CHIVATO #2: ¿Qué se va a enviar? ---
    console.log(
      "[Email Service] Intentando enviar correo con las siguientes opciones:",
      {
        from: mailOptions.from,
        to: mailOptions.to,
        bcc: mailOptions.bcc,
        subject: mailOptions.subject,
      },
    );

    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] ¡Correo enviado exitosamente a Resend!`);
  } catch (error) {
    console.error(
      "[Email Service] ERROR al intentar enviar con transporter.sendMail:",
      error,
    );
  }
}

module.exports = { sendOrderConfirmationEmail };
