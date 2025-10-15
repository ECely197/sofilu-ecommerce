const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");

// --- ¡USANDO LA LIBRERÍA CORRECTA! ---
const Wompi = require("@asincode/wompi-lib");

// Inicializa el cliente de Wompi con tus llaves y especificando el entorno de prueba.
const wompi = new Wompi({
  publicKey: process.env.WOMPI_PUBLIC_KEY, // Tu llave pública desde .env
  privateKey: process.env.WOMPI_PRIVATE_KEY, // Tu llave privada desde .env
  environment: "test", // ¡Importante! Le decimos que use el Sandbox de Wompi
});

// --- RUTA PARA CREAR LA TRANSACCIÓN ---
router.post("/create-transaction", [authMiddleware], async (req, res) => {
  const {
    amount,
    customer_email,
    customer_phone,
    customer_name,
    redirect_url,
  } = req.body;
  const reference = `sofilu-ref-${Date.now()}`; // Referencia de pago única

  try {
    const transaction = await wompi.createTransaction({
      amount_in_cents: amount * 100,
      currency: "COP",
      customer_email: customer_email,
      reference: reference,
      redirect_url: redirect_url,
      customer_data: {
        full_name: customer_name,
        phone_number: customer_phone,
      },
      // Puedes especificar los métodos de pago que quieres aceptar
      payment_methods: ["CARD", "NEQUI", "PSE", "BANCOLOMBIA_TRANSFER"],
    });

    res.json({ transactionId: transaction.id });
  } catch (error) {
    console.error("Error al crear la transacción en Wompi:", error.message);
    res.status(500).json({ message: "No se pudo crear la transacción." });
  }
});

// --- RUTA PARA VERIFICAR LA TRANSACCIÓN ---
router.get("/verify-transaction/:id", [authMiddleware], async (req, res) => {
  try {
    const transaction = await wompi.getTransaction(req.params.id);
    res.json({ status: transaction.status, reference: transaction.reference });
  } catch (error) {
    console.error("Error al verificar la transacción en Wompi:", error.message);
    res.status(500).json({ message: "No se pudo verificar la transacción." });
  }
});

module.exports = router;
