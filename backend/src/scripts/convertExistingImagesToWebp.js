const mongoose = require("mongoose");
const admin = require("firebase-admin");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

// Models
const Product = require("../models/Product");
const Category = require("../models/Category");
const SpecialEvent = require("../models/SpecialEvent");
const VariantTemplate = require("../models/VariantTemplate");
const DeliveryOption = require("../models/DeliveryOption");

// Setup Firebase Admin
const serviceAccountPath = path.join(__dirname, "..", "..", "serviceAccountKey.json");
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "sofilu-ecommerce.firebasestorage.app",
});

const bucket = admin.storage().bucket();

// Helper to check if URL is already WebP
function isAlreadyWebpUrl(url) {
  if (!url) return true;
  // If it ends with .webp, or contains .webp before the query parameters
  const cleanUrl = url.split("?")[0];
  return cleanUrl.toLowerCase().endsWith(".webp");
}

// Helper to download, convert and upload image to Firebase Storage
async function convertAndUploadImage(imageUrl) {
  if (!imageUrl) return null;
  
  // If it's already a webp, skip downloading and converting
  if (isAlreadyWebpUrl(imageUrl)) {
    console.log(`  - Ya es WebP (omitido): ${imageUrl.substring(0, 80)}...`);
    return imageUrl;
  }

  try {
    console.log(`  - Descargando: ${imageUrl.substring(0, 80)}...`);
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    // Verify if it's already webp using sharp metadata
    const metadata = await sharp(buffer).metadata();
    if (metadata.format === "webp") {
      console.log(`  - Formato interno ya es WebP (omitido)`);
      return imageUrl;
    }

    console.log(`  - Convirtiendo a WebP (${metadata.format} -> webp)...`);
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();

    // Setup Storage Path
    const timestamp = Date.now();
    const uuid = uuidv4();
    const fileName = `product-images/migrated_${timestamp}_${uuid}.webp`;
    const fileRef = bucket.file(fileName);
    const downloadToken = uuidv4();

    console.log(`  - Subiendo a Firebase: ${fileName}`);
    await fileRef.save(webpBuffer, {
      metadata: {
        contentType: "image/webp",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
    console.log(`  - Éxito! Nueva URL: ${newUrl.substring(0, 80)}...`);
    return newUrl;
  } catch (error) {
    console.error(`  - Error procesando imagen ${imageUrl}:`, error.message);
    return null; // Return null so we know it failed
  }
}

async function migrate() {
  try {
    console.log("Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado con éxito.");

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    // 1. MIGRAR PRODUCTOS
    console.log("\n--- Migrando Productos ---");
    const products = await Product.find();
    console.log(`Encontrados ${products.length} productos.`);
    
    for (const prod of products) {
      let isModified = false;
      console.log(`Producto: "${prod.name}"`);

      // Migrar images array
      if (prod.images && prod.images.length > 0) {
        const newImages = [];
        for (const imgUrl of prod.images) {
          totalProcessed++;
          if (isAlreadyWebpUrl(imgUrl)) {
            newImages.push(imgUrl);
            totalSkipped++;
            continue;
          }
          const convertedUrl = await convertAndUploadImage(imgUrl);
          if (convertedUrl) {
            newImages.push(convertedUrl);
            totalUpdated++;
            isModified = true;
          } else {
            newImages.push(imgUrl); // Keep old if fail
            totalFailed++;
          }
        }
        prod.images = newImages;
      }

      // Migrar variant options images
      if (prod.variants && prod.variants.length > 0) {
        for (let vIdx = 0; vIdx < prod.variants.length; vIdx++) {
          const variant = prod.variants[vIdx];
          if (variant.options && variant.options.length > 0) {
            for (let oIdx = 0; oIdx < variant.options.length; oIdx++) {
              const option = variant.options[oIdx];
              if (option.image) {
                totalProcessed++;
                if (isAlreadyWebpUrl(option.image)) {
                  totalSkipped++;
                  continue;
                }
                const convertedUrl = await convertAndUploadImage(option.image);
                if (convertedUrl) {
                  option.image = convertedUrl;
                  totalUpdated++;
                  isModified = true;
                } else {
                  totalFailed++;
                }
              }
            }
          }
        }
      }

      if (isModified) {
        // Mark variants modified just to be sure Mongoose saves nested objects
        prod.markModified("variants");
        await prod.save();
        console.log(`  => Producto "${prod.name}" guardado.`);
      }
    }

    // 2. MIGRAR CATEGORÍAS
    console.log("\n--- Migrando Categorías ---");
    const categories = await Category.find();
    console.log(`Encontradas ${categories.length} categorías.`);

    for (const cat of categories) {
      if (cat.imageUrl) {
        totalProcessed++;
        console.log(`Categoría: "${cat.name}"`);
        if (isAlreadyWebpUrl(cat.imageUrl)) {
          totalSkipped++;
          continue;
        }
        const convertedUrl = await convertAndUploadImage(cat.imageUrl);
        if (convertedUrl) {
          cat.imageUrl = convertedUrl;
          await cat.save();
          totalUpdated++;
          console.log(`  => Categoría "${cat.name}" guardada.`);
        } else {
          totalFailed++;
        }
      }
    }

    // 3. MIGRAR EVENTOS ESPECIALES
    console.log("\n--- Migrando Eventos Especiales ---");
    const events = await SpecialEvent.find();
    console.log(`Encontrados ${events.length} eventos especiales.`);

    for (const ev of events) {
      if (ev.imageUrl) {
        totalProcessed++;
        console.log(`Evento: "${ev.title}"`);
        if (isAlreadyWebpUrl(ev.imageUrl)) {
          totalSkipped++;
          continue;
        }
        const convertedUrl = await convertAndUploadImage(ev.imageUrl);
        if (convertedUrl) {
          ev.imageUrl = convertedUrl;
          await ev.save();
          totalUpdated++;
          console.log(`  => Evento "${ev.title}" guardado.`);
        } else {
          totalFailed++;
        }
      }
    }

    // 4. MIGRAR PLANTILLAS DE VARIANTES
    console.log("\n--- Migrando Plantillas de Variantes ---");
    const templates = await VariantTemplate.find();
    console.log(`Encontradas ${templates.length} plantillas.`);

    for (const temp of templates) {
      let isModified = false;
      console.log(`Plantilla: "${temp.templateName}"`);

      if (temp.options && temp.options.length > 0) {
        for (let oIdx = 0; oIdx < temp.options.length; oIdx++) {
          const option = temp.options[oIdx];
          if (option.image) {
            totalProcessed++;
            if (isAlreadyWebpUrl(option.image)) {
              totalSkipped++;
              continue;
            }
            const convertedUrl = await convertAndUploadImage(option.image);
            if (convertedUrl) {
              option.image = convertedUrl;
              totalUpdated++;
              isModified = true;
            } else {
              totalFailed++;
            }
          }
        }
      }

      if (isModified) {
        temp.markModified("options");
        await temp.save();
        console.log(`  => Plantilla "${temp.templateName}" guardada.`);
      }
    }

    // 5. MIGRAR OPCIONES DE ENTREGA
    console.log("\n--- Migrando Opciones de Entrega ---");
    const deliveries = await DeliveryOption.find();
    console.log(`Encontradas ${deliveries.length} opciones de entrega.`);

    for (const del of deliveries) {
      if (del.imageUrl) {
        totalProcessed++;
        console.log(`Opción de entrega: "${del.name}"`);
        if (isAlreadyWebpUrl(del.imageUrl)) {
          totalSkipped++;
          continue;
        }
        const convertedUrl = await convertAndUploadImage(del.imageUrl);
        if (convertedUrl) {
          del.imageUrl = convertedUrl;
          await del.save();
          totalUpdated++;
          console.log(`  => Opción de entrega "${del.name}" guardada.`);
        } else {
          totalFailed++;
        }
      }
    }

    console.log("\n=================================");
    console.log("MIGRACIÓN FINALIZADA");
    console.log(`Total Imágenes Evaluadas: ${totalProcessed}`);
    console.log(`Total Convertidas a WebP: ${totalUpdated}`);
    console.log(`Total Omitidas (Ya WebP): ${totalSkipped}`);
    console.log(`Total Fallidas:           ${totalFailed}`);
    console.log("=================================");

  } catch (err) {
    console.error("Error fatal en el proceso de migración:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Desconectado de MongoDB.");
  }
}

migrate();
