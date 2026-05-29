// /routes/navigation.js

const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const Product = require("../models/Product");
const Section = require("../models/Section"); // Usamos tu modelo de Section

/**
 * @route   GET /api/navigation
 * @desc    Obtener la estructura de navegación COMPLETA Y OPTIMIZADA.
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    // 1. Obtenemos todas las secciones y categorías de una vez.
    const sections = await Section.find().sort({ name: 1 });
    const allCategories = await Category.find();
    
    // 2. Obtenemos los IDs de todas las categorías para buscar sus productos.
    const categoryIds = allCategories.map(cat => cat._id);

    // 3. ✨ HACEMOS UNA SOLA CONSULTA A LA BASE DE DATOS ✨
    // Traemos un lote de hasta 100 productos recientes que pertenezcan a CUALQUIERA de las categorías.
    const productsForMenu = await Product.find({
      'categories': { $in: categoryIds }
    })
    .sort({ createdAt: -1 })
    .limit(100) 
    .select('name images price categories'); // Solo los campos que necesitamos.

    // 4. Creamos un "mapa" para organizar los productos rápidamente.
    const categoryProductMap = {};
    allCategories.forEach(cat => {
      categoryProductMap[cat._id] = []; // Inicializamos un array vacío para cada categoría.
    });

    // 5. Distribuimos los productos encontrados en su respectiva categoría en el mapa.
    productsForMenu.forEach(product => {
      product.categories.forEach(catId => {
        // Nos aseguramos de que la categoría exista en el mapa y que no agreguemos más de 3 productos.
        if (categoryProductMap[catId] && categoryProductMap[catId].length < 3) {
          categoryProductMap[catId].push(product);
        }
      });
    });

    // 6. Finalmente, construimos la estructura final que espera el frontend.
    const navigationData = sections.map(section => {
      const subCategories = allCategories
        .filter(cat => String(cat.section) === String(section._id))
        .map(cat => ({
          id: cat.slug,
          name: cat.name,
          slug: cat.slug, // Añadimos el slug que el frontend necesita
          products: categoryProductMap[cat._id] || [] // Tomamos los productos del mapa
        }));

      return {
        id: section.slug,
        name: section.name,
        slug: `/section/${section.slug}`,
        subCategories: subCategories,
      };
    });

    const finalNavData = [
      { id: "inicio", name: "Inicio", slug: "/", subCategories: [] },
      ...navigationData,
    ];

    res.json(finalNavData);
  } catch (error) {
    console.error("Error al construir datos de navegación:", error);
    res.status(500).json({ message: "Error al construir los datos de navegación." });
  }
});

module.exports = router;