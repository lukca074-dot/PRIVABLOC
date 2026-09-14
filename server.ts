import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure body parser with higher limit for base64 camera/uploaded images
  app.use(express.json({ limit: "25mb" }));

  // Initialize Gemini AI Client
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Verification API endpoint
  app.post("/api/verify-image", async (req, res) => {
    try {
      const { image, condition } = req.body;

      if (!image || typeof image !== "string") {
        return res.status(400).json({
          approved: false,
          confidence: 0,
          reason: "No se recibió ninguna imagen válida para verificar.",
        });
      }

      // Extract MIME type and base64 data
      const match = image.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let base64Data = image;

      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }

      const ai = getGenAI();

      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      };

      const customRuleText = condition && typeof condition === "string" && condition.trim().length > 0
        ? condition.trim()
        : "Debe aparecer exactamente una persona con una chaqueta, abrigo o cazadora completamente cerrada (cremallera o botones arriba).";

      const promptText = `Analiza detenidamente esta fotografía y determina si cumple TODOS los siguientes requisitos de acceso:

REQUISITO OBLIGATORIO DE VERIFICACIÓN DE FOTO:
"${customRuleText}"

REGLAS GENERALES DE SEGURIDAD Y AUTENTICIDAD:
1. Debe ser una FOTOGRAFÍA REAL tomada con cámara. NO se admiten dibujos, ilustraciones, modelos 3D, capturas de pantalla de móvil/PC, ni fotos tomadas a otra pantalla.
2. Si la regla exige prendas específicas, objetos, posturas o número de personas, se debe cumplir estrictamente al 100%.
3. No importa el fondo ni el lugar salvo que la regla lo especifique.

Devuelve tu evaluación en formato JSON estrictamente siguiendo la estructura indicada.
Indica 'approved': true SOLO si la foto cumple al 100% con la condición exigida.
Indica 'confidence': un número decimal de 0.00 a 1.00 con la certeza de tu evaluación.
Indica 'reason': un mensaje claro, cordial y directo en español explicando por qué la foto fue aprobada o rechazada (ejemplo: 'Foto aprobada con éxito.', 'La chaqueta está abierta.', 'No se detecta el objeto requerido.', 'La imagen parece ser un dibujo o captura de pantalla.').`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            imagePart,
            { text: promptText },
          ],
        },
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              approved: {
                type: Type.BOOLEAN,
                description: "true si y solo si la foto cumple 100% la condición exigida en una foto real.",
              },
              confidence: {
                type: Type.NUMBER,
                description: "Nivel de confianza o certeza entre 0.0 y 1.0.",
              },
              reason: {
                type: Type.STRING,
                description: "Motivo detallado en español.",
              },
            },
            required: ["approved", "confidence", "reason"],
          },
        },
      });

      const responseText = response.text || "{}";
      let parsed: { approved?: boolean; confidence?: number; reason?: string } = {};

      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing Gemini JSON response:", responseText);
        parsed = {
          approved: false,
          confidence: 0,
          reason: "Respuesta de IA no válida.",
        };
      }

      const approved = Boolean(parsed.approved);
      const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;
      const reason = parsed.reason || (approved ? "Verificación exitosa." : "La fotografía no cumple los requisitos.");

      // Strict enforcement: approved == true AND confidence >= 0.90
      if (approved && confidence >= 0.90) {
        return res.json({
          approved: true,
          confidence,
          reason,
        });
      } else {
        return res.json({
          approved: false,
          confidence,
          reason: reason || "La imagen no cumple la condición requerida para esta sala.",
        });
      }
    } catch (err: any) {
      console.error("Error in /api/verify-image:", err);
      return res.status(500).json({
        approved: false,
        confidence: 0,
        reason: err?.message || "Ocurrió un error al verificar la imagen con la IA. Inténtalo de nuevo.",
      });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
