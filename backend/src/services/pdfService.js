// Contenido para: backend/src/services/pdfService.js
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");

/**
 * Genera un buffer de PDF a partir de un objeto de pedido.
 * @param {object} order - El objeto del pedido populado.
 * @returns {Promise<Buffer>} - Una promesa que se resuelve con el buffer del PDF.
 */
async function createInvoicePdf(order) {
  const templatePath = path.join(
    __dirname,
    "../views/order-confirmation-email.ejs"
  );
  const orderObject = order.toObject(); // Convertimos a objeto simple

  // Renderizamos el HTML de nuestra plantilla EJS
  const html = await ejs.renderFile(templatePath, { order: orderObject });

  const browser = await puppeteer.launch({
    headless: true,
    // Args necesarios para correr en entornos como Render
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Establecemos el contenido de la página con nuestro HTML renderizado
  await page.setContent(html, { waitUntil: "networkidle0" });

  // Generamos el PDF
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

  await browser.close();

  return pdfBuffer;
}

module.exports = { createInvoicePdf };
