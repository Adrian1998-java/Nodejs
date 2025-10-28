const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const T = require("tesseract.js");
const worker = T.createWorker();

const app = express();
const upload = multer({ dest: "uploads/" });

// Función OCR usando Tesseract.js con español
async function ocrImageEspañol(imagePath) {

  // Define the logger function to track progress
  function logProgress(event) {
    console.log(event);
  }
  T.recognize(imagePath, "spa", {
    logger: logProgress
  })
  .then((result) => {
    console.log('OCR Result:', result.data.text)
  })
  .catch((error) => {
    console.error("ERROR:",error)
  })

  const text = (await worker).recognize(imagePath);

  await worker.terminate();
  return text;
}

// Función OCR con detección de orientación
async function detectarOrientacionImagen(imagePath) {
  try {
    console.log("Analizando orientación de la imagen...");

    const { data } = await Tesseract.recognize(imagePath, "spa", {
      logger: (m) => console.log(m),
    });

    // Mostrar resultados básicos
    console.log("Texto detectado:", data.text.trim().substring(0, 100) + "...");
    
    // Mostrar datos de orientación (si existen)
    if (data && data.orientation) {
      console.log("Orientación detectada:", data.orientation);
      console.log("Rotar la imagen:", data.orientation.deg, "grados");
      return data.orientation;
    } else if (data && data.osd) {
      // Algunas versiones devuelven `osd` (Orientation and Script Detection)
      console.log("Orientación detectada:", data.osd);
      console.log("Rotar la imagen:", data.osd.rotate, "grados");
      return data.osd;
    } else {
      console.log("No se pudo detectar orientación automáticamente.");
      return null;
    }
  } catch (error) {
    console.error("Error en OCR:", error);
    return null;
  }
}

// Endpoint para subir imagen y hacer OCR
app.post("/ocr-image", upload.single("imgFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió imagen" });
    }

    const imgPath = path.resolve(req.file.path);
    const text = await ocrImageEspañol(imgPath);

    // Borra la imagen temporal
    fs.unlinkSync(imgPath);

    res.json({ text });
  } catch (err) {
    console.error("Error OCR:", err);
    res.status(500).json({ error: "Error al procesar imagen OCR" });
  }
});

// Servir archivos estáticos (opcional)
app.use(express.static("public"));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor OCR corriendo en http://localhost:${PORT}`);
});
