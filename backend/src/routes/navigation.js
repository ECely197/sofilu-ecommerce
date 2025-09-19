// En: backend/src/routes/navigation.js
const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const Product = require("../models/Product");
const Section = require("../models/Section");

router.get("/", async (req, res) => {
  try {
    const sections = await Section.find().sort({ name: 1 });

    // Para cada sección, encontramos sus categorías hijas
    const navigationData = await Promise.all(
      sections.map(async (section) => {
        const categoriesInSection = await Category.find({
          section: section._id,
        });

        // Para cada categoría, obtenemos 4 productos de muestra
        const subCategoriesPromises = categoriesInSection.map(
          async (category) => {
            const randomProducts = await Product.aggregate([
              { $match: { category: category._id } },
              { $sample: { size: 4 } },
            ]);
            return {
              id: category.slug,
              name: category.name,
              products: randomProducts,
            };
          }
        );

        const subCategories = await Promise.all(subCategoriesPromises);

        return {
          id: section.slug,
          name: section.name,
          slug: `/section/${section.slug}`,
          subCategories: subCategories,
        };
      })
    );

    // Añadimos el enlace de "Inicio" manualmente
    const finalNavData = [
      { id: "inicio", name: "Inicio", slug: "/", subCategories: [] },
      ...navigationData,
    ];

    res.json(finalNavData);
  } catch (error) {
    console.error("Error al obtener datos de navegación:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los datos de navegación" });
  }
});

module.exports = router;
