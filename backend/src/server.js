const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("./models/Product");

const wishlistRoutes = require("./routes/wishlist");
const reviewRoutes = require("./routes/reviews");
const orderRoutes = require("./routes/orders"); // ¡Importar!
const userRoutes = require('./routes/users'); 

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

// --- NUEVA RUTA: Crear un nuevo producto (POST) ---
app.post("/api/products", async (req, res) => {
  // Creamos una nueva instancia de nuestro modelo Product con los datos
  // que nos llegan en el 'body' de la petición desde el frontend.
  const newProduct = new Product({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    imageUrl: req.body.imageUrl,
    category: req.body.category,
  });
  try {
    // Guardamos el nuevo producto en la base de datos.
    const savedProduct = await newProduct.save();
    // Respondemos con el producto guardado (incluyendo el _id que le dio MongoDB).
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: "Error al crear el producto" });
  }
});

// --- NUEVA RUTA: Actualizar un producto existente (PUT) ---
app.put("/api/products/:id", async (req, res) => {
  try {
    // Buscamos el producto por su ID y lo actualizamos con los nuevos datos del 'body'.
    // { new: true } le dice a Mongoose que nos devuelva el documento actualizado.
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProduct) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado para actualizar" });
    }
    // Respondemos con el producto actualizado.
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar el producto" });
  }
});
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
pp.use('/api/users', userRoutes); // ¡Usar!
app.get("/api/greeting", (req, res) => {
  res.json({
    message: "¡Conectado! Este mensaje viene desde el backend de Sofilu.",
  });
});
app.listen(PORT, () => {
  console.log(`Servidor de Sofilu corriendo en http://localhost:${PORT}`);
});
