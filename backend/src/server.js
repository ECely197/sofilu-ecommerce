const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("./models/Product");

const wishlistRoutes = require("./routes/wishlist");
const reviewRoutes = require("./routes/reviews");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado a MongoDB Atlas con exito"))
  .catch((error) => console.error("Error al coenctar a MOngoDB", error));

//Ruta para obtener todos los productos
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los productos" });
  }
});

// Ruta para obtener producto por id

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el producto" });
  }
});
// ¡Conectamos las nuevas rutas!
// Le decimos a Express: "Cualquier petición que empiece con '/api/wishlist',
// envíasela a nuestro archivo 'wishlistRoutes' para que la maneje".
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.get("/api/greeting", (req, res) => {
  res.json({
    message: "¡Conectado! Este mensaje viene desde el backend de Sofilu.",
  });
});
app.listen(PORT, () => {
  console.log(`Servidor de Sofilu corriendo en http://localhost:${PORT}`);
});
