const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Category = require("../models/Category");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.sofilu.shop";

router.get("/", async (req, res) => {
  res.header("Content-Type", "application/xml");
  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // URL Principal
  xml += `<url><loc>${FRONTEND_URL}/</loc><priority>1.0</priority></url>`;

  // URLs de Categorías
  const categories = await Category.find();
  for (const category of categories) {
    xml += `<url><loc>${FRONTEND_URL}/category/${category.slug}</loc><priority>0.8</priority></url>`;
  }

  // URLs de Productos
  const products = await Product.find();
  for (const product of products) {
    xml += `<url><loc>${FRONTEND_URL}/product/${product._id}</loc><priority>0.6</priority></url>`;
  }

  xml += `</urlset>`;
  res.send(xml);
});

module.exports = router;
