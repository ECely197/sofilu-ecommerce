/**
 * @fileoverview Servicio de Email usando la API HTTP de Resend (No SMTP).
 */
const { Resend } = require("resend"); // Importación de la librería oficial
const ejs = require("ejs");
const path = require("path");
const admin = require("firebase-admin");

// Inicializamos el cliente de Resend
const resend = new Resend(process.env.RESEND_API_KEY);

async function getAdminEmails() {
  try {
    const adminEmails = [];
    let nextPageToken;
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      listUsersResult.users.forEach((userRecord) => {
        if (userRecord.customClaims?.admin === true && userRecord.email) {
          adminEmails.push(userRecord.email);
        }
      });
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    return adminEmails;
  } catch (error) {
    console.error("Error obteniendo admins:", error);
    return [];
  }
}

async function sendOrderConfirmationEmail(order) {
  if (!process.env.RESEND_API_KEY) {
    console.error("Falta RESEND_API_KEY");
    return;
  }

  try {
    // 1. Obtener destinatarios
    const adminRecipients = await getAdminEmails();

    // 2. Renderizar HTML
    const templatePath = path.join(
      __dirname,
      "../views/order-confirmation-email.ejs",
    );
    const html = await ejs.renderFile(templatePath, {
      order: order.toObject(),
    });

    // 3. Enviar usando la API HTTP (Mucho más estable que SMTP)
    const { data, error } = await resend.emails.send({
      from: "Sofilu Store <ventas@sofilu.shop>",
      to: [order.customerInfo.email], // Resend acepta array o string
      bcc: adminRecipients.length > 0 ? adminRecipients : undefined,
      subject: `¡Nuevo Pedido Confirmado! #${order._id.toString().slice(-6).toUpperCase()}`,
      html: html,
    });

    if (error) {
      console.error("[Email Service] Error devuelto por Resend API:", error);
      return;
    }

    console.log(`[Email Service] Correo enviado. ID: ${data.id}`);
  } catch (err) {
    console.error("[Email Service] Error crítico enviando correo:", err);
  }
}

module.exports = { sendOrderConfirmationEmail };
