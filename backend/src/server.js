// ==========================================================================
// MÓDULO PRINCIPAL DEL SERVIDOR - SOFILU ECOMMERCE
// ==========================================================================
// Este archivo es el punto de entrada de la aplicación backend.
// Se encarga de inicializar Express, conectar a la base de datos,
// configurar middlewares y montar las rutas de la API.
// ==========================================================================

// --------------------------------------------------------------------------
// 1. IMPORTACIÓN DE MÓDULOS
// --------------------------------------------------------------------------
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config(); // Carga las variables de entorno desde .env

// Importación de todos los módulos de rutas de la API
const productRoutes = require("./routes/products");
const wishlistRoutes = require("./routes/wishlist");
const reviewRoutes = require("./routes/reviews");
const orderRoutes = require("./routes/orders");
const userRoutes = require("./routes/users");
const couponRoutes = require("./routes/coupons");
const settingsRoutes = require("./routes/settings");
const categoryRoutes = require("./routes/categories");
const variantTemplateRoutes = require("./routes/variantTemplates");
const navigationRoutes = require("./routes/navigation");
const sectionRoutes = require("./routes/sections");
const vendorRoutes = require("./routes/vendors");
const specialEventRoutes = require("./routes/specialEvents");
const paymentRoutes = require("./routes/payments");

// --------------------------------------------------------------------------
// 2. INICIALIZACIÓN Y CONFIGURACIÓN
// --------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 8080;

// Inicialización de Firebase Admin SDK
try {
  const serviceAccountPath = path.join(
    __dirname,
    "..",
    "serviceAccountKey.json"
  );
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin SDK inicializado correctamente.");
} catch (error) {
  console.error("Error al inicializar Firebase Admin SDK:", error.message);
}

// --------------------------------------------------------------------------
// 3. MIDDLEWARES
// --------------------------------------------------------------------------

// Configuración de CORS (Cross-Origin Resource Sharing)
const allowedOrigins = [
  "https://sofilu.shop",
  "https://www.sofilu.shop",
  "https://sofilu-ecommerce.vercel.app",
  "http://localhost:4200", // Desarrollo local
  // URLs de preview de Vercel
  "https://sofilu-ecommerce-kuw79hb3s-ecely28s-projects.vercel.app",
  "https://sofilu-ecommerce-fq50p215z-ecely28s-projects.vercel.app",
  "https://sofilu-ecommerce-git-main-ecely28s-projects.vercel.app",
  "https://sofilu-ecommerce-git-main-ecely28s-projects.vercel.app",
  "https://sofilu-ecommerce-4n7egp3vc-ecely28s-projects.vercel.app",
  "https://sofilu-ecommerce-4dmykve31-ecely28s-projects.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permite peticiones sin 'origin' (como las de Postman o apps móviles)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origen no permitido bloqueado: ${origin}`);
      callback(new Error("No permitido por la política de CORS"));
    }
  },
};
app.use(cors(corsOptions));

// Middleware para parsear JSON y datos de formularios
// Se aumenta el límite para permitir payloads más grandes (ej: imágenes en base64)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Middleware de logging global para cada petición entrante
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// --------------------------------------------------------------------------
// 4. CONEXIÓN A LA BASE DE DATOS MONGODB
// --------------------------------------------------------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado a MongoDB Atlas con éxito."))
  .catch((error) =>
    console.error("Error fatal al conectar con MongoDB:", error)
  );

// --------------------------------------------------------------------------
// 5. DEFINICIÓN DE RUTAS DE LA API
// --------------------------------------------------------------------------
const apiPrefix = "/api";
app.use(`${apiPrefix}/products`, productRoutes);
app.use(`${apiPrefix}/wishlist`, wishlistRoutes);
app.use(`${apiPrefix}/reviews`, reviewRoutes);
app.use(`${apiPrefix}/orders`, orderRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/coupons`, couponRoutes);
app.use(`${apiPrefix}/settings`, settingsRoutes);
app.use(`${apiPrefix}/categories`, categoryRoutes);
app.use(`${apiPrefix}/variant-templates`, variantTemplateRoutes);
app.use(`${apiPrefix}/navigation`, navigationRoutes);
app.use(`${apiPrefix}/sections`, sectionRoutes);
app.use(`${apiPrefix}/vendors`, vendorRoutes);
app.use(`${apiPrefix}/special-events`, specialEventRoutes);
app.use(`${apiPrefix}/payments`, paymentRoutes);

// Ruta raíz de bienvenida
app.get("/", (req, res) => {
  res.send("API de Sofilu E-commerce funcionando.");
});

// --------------------------------------------------------------------------
// 6. ARRANQUE DEL SERVIDOR
// --------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor de Sofilu corriendo en http://localhost:${PORT}`);
});
