const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { createWorker } = require("tesseract.js");

const app = express();
const upload = multer({ dest: "uploads/" });

/**
 * OCR en español
 */
async function ocrImageEspañol(imagePath) {
  const worker = await createWorker("spa");

  try {
    const { data } = await worker.recognize(imagePath);
    console.log("📝 Texto detectado:", data.text.slice(0, 150));
    return data.text;
  } catch (error) {
    console.error("❌ Error en OCR:", error);
    return null;
  } finally {
    await worker.terminate();
  }
}

/**
 * Detección de orientación usando modelo OSD
 */
async function detectarOrientacionImagen(imagePath) {
  const worker = await createWorker("osd", {
    langPath: path.join(__dirname, "tessdata"), // Asegúrate de tener osd.traineddata aquí
    legacy: true,
    tessedit_ocr_engine_mode: 0, // Legacy OCR Engine (requerido)
  });

  try {
    const { data } = await worker.detect(imagePath);
    console.log("🧭 Resultado de la orientación:", data);
    return data;
  } catch (error) {
    console.error("❌ Error detectando orientación:", error);
    return null;
  } finally {
    await worker.terminate();
  }
}

/**
 * Endpoint para subir imagen y procesar OCR + orientación
 */
app.post("/ocr-image", upload.single("imgFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió imagen" });
    }

    const imgPath = path.resolve(req.file.path);

    // 1️⃣ Detecta orientación
    const orientacion = await detectarOrientacionImagen(imgPath);

    // 2️⃣ Ejecuta OCR español
    const text = await ocrImageEspañol(imgPath);

    // 3️⃣ Borra archivo temporal
    fs.unlinkSync(imgPath);

    res.json({ text, orientacion });
  } catch (err) {
    console.error("Error OCR:", err);
    res.status(500).json({ error: "Error al procesar imagen OCR" });
  }
});

app.use(express.static("public"));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor OCR corriendo en http://localhost:${PORT}`);
});
