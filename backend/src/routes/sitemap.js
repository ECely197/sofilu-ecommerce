/**
 * @fileoverview Genera dinámicamente el sitemap.xml del sitio para SEO.
 * Este archivo ayuda a los motores de búsqueda a descubrir e indexar
 * las páginas de productos y categorías.
 */

const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Category = require("../models/Category");

// URL base del frontend, obtenida de variables de entorno con un fallback seguro.
const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.sofilu.shop";

/**
 * @route   GET /sitemap.xml
 * @desc    Genera y sirve el archivo sitemap.xml.
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const urls = [];

    // 1. URL Principal (Homepage) - Máxima prioridad
    urls.push(createUrlEntry(`${FRONTEND_URL}/`, 1.0));

    // 2. URLs de Categorías - Prioridad alta
    const categories = await Category.find().select("slug");
    for (const category of categories) {
      urls.push(
        createUrlEntry(`${FRONTEND_URL}/category/${category.slug}`, 0.8)
      );
    }

    // 3. URLs de Productos - Prioridad media
    const products = await Product.find().select("_id");
    for (const product of products) {
      urls.push(createUrlEntry(`${FRONTEND_URL}/product/${product._id}`, 0.6));
    }

    // 4. Construcción del XML final
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls.join("")}
      </urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (error) {
    console.error("Error al generar el sitemap:", error);
    res.status(500).send("Error al generar el sitemap.");
  }
});

/**
 * Función de utilidad para crear una entrada <url> del sitemap.
 * @param {string} loc - La URL de la página.
 * @param {number} priority - La prioridad de la URL (0.0 a 1.0).
 * @returns {string} Un string con el bloque XML <url>.
 */
function createUrlEntry(loc, priority) {
  return `<url><loc>${loc}</loc><priority>${priority}</priority></url>`;
}

module.exports = router;
