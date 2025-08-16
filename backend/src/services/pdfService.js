// Contenido de depuración para: backend/src/services/pdfService.js
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");

async function createInvoicePdf(order) {
  let browser; // Declaramos el browser aquí para poder cerrarlo en el bloque 'finally'
  try {
    console.log("--- PDF TRACE: [1/6] Entrando a createInvoicePdf ---");

    const templatePath = path.join(
      __dirname,
      "../views/order-confirmation-email.ejs"
    );
    const orderObject = order.toObject();

    console.log("--- PDF TRACE: [2/6] Renderizando plantilla EJS... ---");
    const html = await ejs.renderFile(templatePath, { order: orderObject });

    console.log("--- PDF TRACE: [3/6] Iniciando Puppeteer.launch()... ---");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Medida de compatibilidad
        "--single-process", // Medida de compatibilidad
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // Para Render
    });

    console.log(
      "--- PDF TRACE: [4/6] Navegador Puppeteer iniciado. Creando nueva página... ---"
    );
    const page = await browser.newPage();

    console.log(
      "--- PDF TRACE: [5/6] Estableciendo contenido HTML y generando PDF... ---"
    );
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    console.log(
      "--- PDF TRACE: [6/6] PDF generado con éxito. Cerrando navegador... ---"
    );

    return pdfBuffer;
  } catch (error) {
    console.error("--- PDF TRACE: ¡ERROR! Fallo en la generación del PDF. ---");
    console.error(error);
    // Lanzamos el error para que la ruta lo capture y envíe el status 500
    throw new Error("Fallo al generar el PDF con Puppeteer.");
  } finally {
    // Nos aseguramos de que el navegador siempre se cierre, incluso si hay un error
    if (browser) {
      console.log(
        "--- PDF TRACE: Cerrando instancia del navegador en 'finally'. ---"
      );
      await browser.close();
    }
  }
}

module.exports = { createInvoicePdf };
