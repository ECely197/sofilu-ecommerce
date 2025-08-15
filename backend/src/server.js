// ==========================================================================
// 1. IMPORTACIONES
// ==========================================================================
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

// Importación de TODAS las Rutas
const productRoutes = require("./routes/products");
const wishlistRoutes = require("./routes/wishlist");
// const reviewRoutes = require("./routes/reviews"); // Los quitamos al revertir
const orderRoutes = require("./routes/orders");
const userRoutes = require("./routes/users");
const couponRoutes = require("./routes/coupons");
const settingsRoutes = require("./routes/settings");

// ==========================================================================
// 2. INICIALIZACIÓN
// ==========================================================================
const app = express();
const PORT = process.env.PORT || 8080;

const serviceAccountPath = path.join(__dirname, "..", "serviceAccountKey.json");
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ==========================================================================
// 3. MIDDLEWARES
// ==========================================================================
const allowedOrigins = [
  "https://sofilu-ecommerce.vercel.app",
  "http://localhost:4200",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));

// --- ¡CORRECCIÓN CLAVE AQUÍ! ---
// Aumentamos el límite de tamaño para el cuerpo de la petición.
// '50mb' es un valor generoso que debería ser más que suficiente.
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
// ---------------------------------

// AÑADIMOS UN MIDDLEWARE DE LOGGING GLOBAL
// Este se ejecutará para CADA petición que llegue al servidor.
app.use((req, res, next) => {
  console.log(
    `--- GLOBAL LOG: Petición entrante: ${req.method} ${req.path} ---`
  );
  next();
});

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
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
// app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/settings", settingsRoutes);

// ==========================================================================
// 6. ARRANQUE DEL SERVIDOR
// ==========================================================================
app.listen(PORT, () => {
  console.log(`Servidor de Sofilu corriendo en http://localhost:${PORT}`);
});

//re_du3b6eQN_9nwmpbEu5UYBhLzGcno7Csxm
