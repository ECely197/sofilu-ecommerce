/**
 * @fileoverview Genera la estructura de datos completa para el menú de navegación principal del sitio.
 * Construye dinámicamente las secciones, sus categorías y productos de muestra.
 */

const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const Product = require("../models/Product");
const Section = require("../models/Section");

/**
 * @route   GET /api/navigation
 * @desc    Obtener la estructura de navegación completa para el frontend.
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    // 1. Obtener todas las secciones base, ordenadas por nombre.
    const sections = await Section.find().sort({ name: 1 });

    // 2. Para cada sección, construir su submenú en paralelo.
    const navigationData = await Promise.all(
      sections.map(async (section) => {
        // Encontrar todas las categorías que pertenecen a esta sección.
        const categoriesInSection = await Category.find({
          section: section._id,
        });

        // Para cada categoría, obtener 4 productos de muestra aleatorios.
        const subCategories = await Promise.all(
          categoriesInSection.map(async (category) => {
            const randomProducts = await Product.aggregate([
              { $match: { category: category._id } }, // Filtrar por categoría
              { $sample: { size: 4 } }, // Tomar una muestra aleatoria
              { $project: { name: 1, images: 1, price: 1 } }, // Devolver solo campos necesarios
            ]);
            return {
              id: category.slug,
              name: category.name,
              products: randomProducts,
            };
          })
        );

        return {
          id: section.slug,
          name: section.name,
          slug: `/section/${section.slug}`, // URL amigable para el frontend
          subCategories: subCategories,
        };
      })
    );

    // 3. Añadir el enlace estático de "Inicio" al principio del array.
    const finalNavData = [
      { id: "inicio", name: "Inicio", slug: "/", subCategories: [] },
      ...navigationData,
    ];

    res.json(finalNavData);
  } catch (error) {
    console.error("Error al obtener datos de navegación:", error);
    res
      .status(500)
      .json({ message: "Error al construir los datos de navegación." });
  }
});

module.exports = router;
