const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");
const { sendOrderConfirmationEmail } = require("../services/emailService");

// --- OBTENER TODOS LOS PEDIDOS (PARA EL PANEL DE ADMIN) ---
// Esta es la ruta que le faltaba el .populate()
router.get("/", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      // 2. Buscamos por el nombre del cliente o por el ID del pedido
      query = {
        $or: [{ "customerInfo.name": { $regex: search, $options: "i" } }],
      };
    }

    const orders = await Order.find(query) // <-- 3. Aplicamos la consulta
      .sort({ createdAt: -1 })
      .populate("items.product");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los pedidos" });
  }
});

// --- OBTENER PEDIDOS DE UN USUARIO ESPECÍFICO (PARA EL ÁREA "MI CUENTA") ---
router.get("/user/:userId", [authMiddleware], async (req, res) => {
  if (req.user.uid !== req.params.userId) {
    return res.status(403).json({ message: "No tienes permiso." });
  }
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("items.product");
    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener los pedidos del usuario" });
  }
});

// --- OBTENER UN PEDIDO ÚNICO POR SU ID (PARA LA PÁGINA DE DETALLE) ---
router.get("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el pedido" });
  }
});

// --- CREAR UN NUEVO PEDIDO ---
router.post("/", [authMiddleware], async (req, res) => {
  try {
    const {
      customerInfo,
      shippingAddress,
      items,
      appliedCoupon,
      discountAmount,
      totalAmount,
    } = req.body;
    const userId = req.user.uid;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ message: "El carrito no puede estar vacío." });
    }

    // --- 1. Verificación de Stock y Añadir Costo a los Items ---
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Producto con ID ${item.product} no encontrado.` });
      }

      // Validar stock de variantes
      if (item.selectedVariants) {
        for (const variantName in item.selectedVariants) {
          const variant = product.variants.find((v) => v.name === variantName);
          const option = variant?.options.find(
            (o) => o.name === item.selectedVariants[variantName]
          );
          if (!option || option.stock < item.quantity) {
            return res.status(400).json({
              message: `Stock insuficiente para ${product.name} - ${option.name}.`,
            });
          }
        }
      }

      // ¡AÑADIMOS EL COSTO AL ITEM ANTES DE GUARDAR!
      // Buscamos la opción específica para obtener su costo si existe, si no, usamos el del producto base.
      let itemCost = product.costPrice || 0;
      if (item.selectedVariants) {
        const firstVariantKey = Object.keys(item.selectedVariants)[0];
        const firstVariantValue = item.selectedVariants[firstVariantKey];
        const variant = product.variants.find(
          (v) => v.name === firstVariantKey
        );
        const option = variant?.options.find(
          (o) => o.name === firstVariantValue
        );
        if (option && option.costPrice) {
          itemCost = option.costPrice;
        }
      }
      item.costPrice = itemCost * item.quantity; // Guardamos el costo total del item (costo * cantidad)
    }

    // --- 2. Crear y Guardar el Pedido ---
    const newOrder = new Order({
      userId,
      customerInfo,
      shippingAddress,
      items, // 'items' ahora contiene el 'costPrice'
      appliedCoupon,
      discountAmount,
      totalAmount,
    });
    let savedOrder = await newOrder.save();

    // --- 3. ¡ACTUALIZAR EL INVENTARIO! ---
    await Promise.all(
      items.map(async (item) => {
        const updateQuery = {};
        const product = await Product.findById(item.product); // Necesitamos recargar el producto
        if (item.selectedVariants) {
          for (const variantName in item.selectedVariants) {
            const variantIndex = product.variants.findIndex(
              (v) => v.name === variantName
            );
            if (variantIndex > -1) {
              const optionIndex = product.variants[
                variantIndex
              ].options.findIndex(
                (o) => o.name === item.selectedVariants[variantName]
              );
              if (optionIndex > -1) {
                const stockPath = `variants.${variantIndex}.options.${optionIndex}.stock`;
                updateQuery[stockPath] = -item.quantity;
              }
            }
          }
        }
        if (Object.keys(updateQuery).length > 0) {
          await Product.updateOne({ _id: item.product }, { $inc: updateQuery });
        }
      })
    );

    // --- 4. Actualizar Cupón y Enviar Correo ---
    if (appliedCoupon) {
      await Coupon.updateOne(
        { code: appliedCoupon },
        { $inc: { timesUsed: 1 } }
      );
    }
    savedOrder = await savedOrder.populate("items.product");
    sendOrderConfirmationEmail(savedOrder);

    // --- 5. Enviar Respuesta ---
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("--- RUTA POST /api/orders: ERROR ---", error);
    res
      .status(400)
      .json({ message: "Error al crear el pedido", details: error.message });
  }
});

// --- ¡NUEVA RUTA PARA EDITAR UN PEDIDO POR EL CLIENTE! ---
router.put("/:id", [authMiddleware], async (req, res) => {
  try {
    const { items: newItems } = req.body; // Solo esperamos una nueva lista de items
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    // --- Validaciones de Seguridad y Estado ---
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado." });
    }
    if (order.userId !== req.user.uid) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para editar este pedido." });
    }
    if (order.status !== "Procesando") {
      return res.status(400).json({
        message: "No puedes editar un pedido que ya ha sido enviado.",
      });
    }
    if (!newItems || newItems.length === 0) {
      return res.status(400).json({
        message:
          "El pedido no puede quedar vacío. Cancele el pedido en su lugar.",
      });
    }

    const stockChanges = new Map();

    // 2. Iteramos sobre los items ANTIGUOS para DEVOLVER su stock
    for (const oldItem of order.items) {
      const key = `${oldItem.product}-${JSON.stringify(
        oldItem.selectedVariants
      )}`;
      stockChanges.set(key, (stockChanges.get(key) || 0) + oldItem.quantity);
    }

    // 3. Iteramos sobre los items NUEVOS para RESTAR su stock
    let newSubTotal = 0;
    for (const newItem of newItems) {
      const product = await Product.findById(newItem.product);
      if (!product)
        throw new Error(`Producto ${newItem.product} no encontrado.`);

      const key = `${newItem.product}-${JSON.stringify(
        newItem.selectedVariants
      )}`;
      stockChanges.set(key, (stockChanges.get(key) || 0) - newItem.quantity);

      // Validamos el stock del nuevo item
      const option = product.variants
        .find((v) => v.name === Object.keys(newItem.selectedVariants)[0])
        ?.options.find(
          (o) => o.name === Object.values(newItem.selectedVariants)[0]
        );
      if (!option || option.stock < stockChanges.get(key) * -1) {
        // Comparamos con la cantidad neta a restar
        throw new Error(`Stock insuficiente para ${product.name}.`);
      }
      newSubTotal += newItem.price * newItem.quantity;
    }

    // 4. Aplicamos los cambios de stock en la base de datos
    for (const [key, change] of stockChanges.entries()) {
      if (change === 0) continue; // No hay cambio neto, no hacemos nada

      const [productId, variantsString] = key.split(/-(.+)/);
      const variants = JSON.parse(variantsString);
      const product = await Product.findById(productId);

      const updateQuery = {};
      for (const variantName in variants) {
        const variantIndex = product.variants.findIndex(
          (v) => v.name === variantName
        );
        if (variantIndex > -1) {
          const optionIndex = product.variants[variantIndex].options.findIndex(
            (o) => o.name === variants[variantName]
          );
          if (optionIndex > -1) {
            const stockPath = `variants.${variantIndex}.options.${optionIndex}.stock`;
            updateQuery[stockPath] = -change; // Usamos $inc con el cambio neto (negativo si restamos, positivo si sumamos)
          }
        }
      }
      if (Object.keys(updateQuery).length > 0) {
        await Product.updateOne({ _id: productId }, { $inc: updateQuery });
      }
    }

    // --- Recalcular Totales y Actualizar el Pedido ---
    const shippingCost =
      order.totalAmount -
      order.items.reduce((acc, item) => acc + item.price * item.quantity, 0) +
      (order.discountAmount || 0);
    const newTotalAmount =
      newSubTotal + shippingCost - (order.discountAmount || 0);

    order.items = newItems;
    order.totalAmount = newTotalAmount;

    const savedOrder = await order.save();
    res.json(savedOrder);
  } catch (error) {
    console.error("Error al editar el pedido:", error);
    res
      .status(400)
      .json({ message: "Error al editar el pedido", details: error.message });
  }
});

// --- ACTUALIZAR EL ESTADO DE UN PEDIDO ---
router.put("/:id/status", [authMiddleware], async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Verificación de permisos
    const isAdmin = req.user.admin === true;
    const isOwner = order.userId === req.user.uid;

    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para modificar este pedido." });
    }

    // Lógica para el Cliente
    if (isOwner && !isAdmin) {
      if (status !== "Cancelado") {
        return res
          .status(403)
          .json({ message: "Solo puedes cancelar tu pedido." });
      }
      if (order.status !== "Procesando") {
        return res.status(400).json({
          message: "No puedes cancelar un pedido que ya ha sido enviado.",
        });
      }
    }

    // Lógica para el Admin (puede cambiar a cualquier estado válido)
    if (isAdmin) {
      const allowedStatus = ["Procesando", "Enviado", "Entregado", "Cancelado"];
      if (!allowedStatus.includes(status)) {
        return res
          .status(400)
          .json({ message: "Estado no válido proporcionado" });
      }
    }

    // Si el pedido se cancela (por cliente o admin), devolvemos el stock.
    if (status === "Cancelado" && order.status !== "Cancelado") {
      await Promise.all(
        order.items.map(async (item) => {
          // Lógica para devolver el stock (similar a la de restar, pero con cantidad positiva)
          const updateQuery = {};
          const product = await Product.findById(item.product);
          if (product) {
            for (const variantName in item.selectedVariants) {
              const variantIndex = product.variants.findIndex(
                (v) => v.name === variantName
              );
              if (variantIndex > -1) {
                const optionIndex = product.variants[
                  variantIndex
                ].options.findIndex(
                  (o) => o.name === item.selectedVariants[variantName]
                );
                if (optionIndex > -1) {
                  const stockPath = `variants.${variantIndex}.options.${optionIndex}.stock`;
                  updateQuery[stockPath] = item.quantity; // Sumamos la cantidad
                }
              }
            }
            if (Object.keys(updateQuery).length > 0) {
              await Product.updateOne(
                { _id: item.product },
                { $inc: updateQuery }
              );
            }
          }
        })
      );
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error al actualizar el estado:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar el estado del pedido" });
  }
});

// --- ELIMINAR UN PEDIDO ---
router.delete("/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res
        .status(404)
        .json({ message: "Pedido no encontrado para eliminar" });
    }
    res.json({ message: "Pedido eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el pedido" });
  }
});

// --- ¡NUEVA RUTA PARA ESTADÍSTICAS DEL DASHBOARD! ---
// --- ¡RUTA DE ESTADÍSTICAS MEJORADA! ---
router.get("/summary/stats", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const [
      // Métricas de Pedidos
      totalRevenueData,
      totalOrders,
      latestOrders,
      // Métricas de Productos
      inventoryValue,
      totalProducts,
      // Métricas de Cupones
      couponPerformance,
    ] = await Promise.all([
      // 1. Métricas de Pedidos
      Order.aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(5).populate("items.product"),

      // 2. Métricas de Productos (¡NUEVO!)
      Product.aggregate([
        {
          $project: {
            // Calculamos el valor de venta y costo para productos SIN variantes
            baseSaleValue: {
              $multiply: ["$price", { $sum: "$variants.options.stock" }],
            }, // Estimación simple
            baseCostValue: {
              $multiply: ["$costPrice", { $sum: "$variants.options.stock" }],
            },
            // Calculamos el valor para productos CON variantes
            variantsSaleValue: {
              $sum: {
                $map: {
                  input: "$variants",
                  as: "v",
                  in: { $sum: "$$v.options.stock" },
                },
              },
            },
            variantsCostValue: {
              $sum: {
                $map: {
                  input: "$variants",
                  as: "v",
                  in: { $sum: "$$v.options.costPrice" },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSaleValue: {
              $sum: { $add: ["$baseSaleValue", "$variantsSaleValue"] },
            },
            totalCostValue: {
              $sum: { $add: ["$baseCostValue", "$variantsCostValue"] },
            },
          },
        },
      ]),
      Product.countDocuments(),

      // 3. Métricas de Cupones (¡NUEVO!)
      Order.aggregate([
        { $match: { appliedCoupon: { $ne: null } } }, // Solo pedidos con cupón
        {
          $group: {
            _id: "$appliedCoupon", // Agrupamos por el código del cupón
            timesUsed: { $sum: 1 },
            totalDiscount: { $sum: "$discountAmount" },
          },
        },
        { $sort: { totalDiscount: -1 } }, // Ordenamos por el que más ha descontado
      ]),
    ]);

    res.json({
      totalRevenue: totalRevenueData.length > 0 ? totalRevenueData[0].total : 0,
      totalOrders,
      totalProducts,
      latestOrders,
      inventoryValue:
        inventoryValue.length > 0
          ? inventoryValue[0]
          : { totalSaleValue: 0, totalCostValue: 0 },
      couponPerformance,
    });
  } catch (error) {
    console.error("Error al obtener las estadísticas del dashboard:", error);
    res.status(500).json({ message: "Error al obtener las estadísticas" });
  }
});

module.exports = router;
