// ==========================================================================
// 1. IMPORTACIONES
// ==========================================================================
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const path = require("path"); // ¡Importante para construir la ruta!
require("dotenv").config();

// Importación de Rutas
const wishlistRoutes = require("./routes/wishlist");
const reviewRoutes = require("./routes/reviews");
const orderRoutes = require("./routes/orders");
const userRoutes = require("./routes/users");
const couponRoutes = require("./routes/coupons");

// ==========================================================================
// 2. INICIALIZACIÓN
// ==========================================================================
const app = express();
const PORT = process.env.PORT || 8080;

// Inicialización de Firebase Admin (¡Esta es la forma correcta y robusta!)
const serviceAccountPath = path.join(__dirname, "..", "serviceAccountKey.json");
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ==========================================================================
// 3. MIDDLEWARES
// ==========================================================================
const { authMiddleware, adminOnly } = require("./middleware/authMiddleware");
app.use(cors());
app.use(express.json());

// ==========================================================================
// 4. CONEXIÓN A LA BASE DE DATOS
// ==========================================================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado a MongoDB Atlas con éxito"))
  .catch((error) => console.error("Error al conectar a MongoDB", error));

// ==========================================================================
// 5. RUTAS DE LA API
// ==========================================================================

// --- Moveremos las rutas de productos a su propio archivo más adelante ---
// Por ahora, las dejamos aquí para simplificar.
const Product = require("./models/Product");

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los productos" });
  }
});

// --- NUEVA RUTA: OBTENER PRODUCTOS DESTACADOS (FEATURED) ---
// GET /api/products/featured
app.get("/section/featured", async (req, res) => {
  try {
    // Busca hasta 4 productos que estén marcados como 'isFeatured'
    const featuredProducts = await Product.find({ isFeatured: true }).limit(4);
    res.json(featuredProducts);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos destacados" });
  }
});

// --- NUEVA RUTA: OBTENER PRODUCTOS EN OFERTA (ON SALE) ---
// GET /api/products/sale
app.get("/section/sale", async (req, res) => {
  try {
    // Busca todos los productos que estén marcados como 'isOnSale'
    const saleProducts = await Product.find({ isOnSale: true });
    res.json(saleProducts);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos en oferta" });
  }
});

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

app.post("/api/products", [authMiddleware, adminOnly], async (req, res) => {
  const newProduct = new Product(req.body);
  try {
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: "Error al crear el producto" });
  }
});

app.put("/api/products/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
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
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar el producto" });
  }
});

app.delete(
  "/api/products/:id",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      // Usamos el método de Mongoose 'findByIdAndDelete' para buscar y borrar en un solo paso.
      const deletedProduct = await Product.findByIdAndDelete(req.params.id);

      if (!deletedProduct) {
        // Si no se encuentra un producto con ese ID, devolvemos un 404.
        return res
          .status(404)
          .json({ message: "Producto no encontrado para eliminar" });
      }

      // Si se elimina con éxito, enviamos un mensaje de confirmación.
      res.json({ message: "Producto eliminado con éxito" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar el producto" });
    }
  }
);

// --- Rutas Modulares ---
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/coupons", couponRoutes);

// ==========================================================================
// 6. ARRANQUE DEL SERVIDOR
// ==========================================================================
app.listen(PORT, () => {
  console.log(`Servidor de Sofilu corriendo en http://localhost:${PORT}`);
});
