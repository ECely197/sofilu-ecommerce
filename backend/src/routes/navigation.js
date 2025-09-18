// En: backend/src/routes/navigation.js
const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const Product = require("../models/Product");

router.get("/", async (req, res) => {
  try {
    const allCategories = await Category.find().sort({ name: 1 });

    const categoryDataPromises = allCategories.map(async (category) => {
      const randomProducts = await Product.aggregate([
        { $match: { category: category._id } },
        { $sample: { size: 4 } },
      ]);

      return {
        id: `${category.slug}-all`,
        name: category.name,
        products: randomProducts,
      };
    });

    const categoryData = await Promise.all(categoryDataPromises);

    const navigationData = [
      { id: "inicio", name: "Inicio", slug: "/", subCategories: [] },
      {
        id: "productos",
        name: "Productos",
        slug: "/search",
        subCategories: categoryData.filter((c) =>
          ["sabanas", "pijamas", "batas", "toallas", "cobijas"].includes(
            c.id.split("-")[0]
          )
        ),
      },
      {
        id: "servicios",
        name: "Servicios",
        slug: "/search",
        subCategories: categoryData.filter((c) =>
          ["cojines", "cubrelechos"].includes(c.id.split("-")[0])
        ),
      },
    ];

    res.json(navigationData);
  } catch (error) {
    console.error("Error al obtener datos de navegación:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los datos de navegación" });
  }
});

module.exports = router;
