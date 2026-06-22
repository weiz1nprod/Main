import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS Middleware
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // Unified Data Schema for single-pass processing
  const unifiedSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      quiz: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      },
      topics: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING }
          },
          required: ["title", "content"]
        }
      }
    },
    required: ["quiz", "topics"]
  };

  app.post("/api/generate-study-material", async (req, res) => {
    try {
      const { fileId, accessToken } = req.body;
      if (!fileId || !accessToken) {
        return res.status(400).json({ error: "Missing fileId or accessToken" });
      }

      console.log("Fetching PDF from Google Drive...", fileId);
      const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!driveRes.ok) {
        const errText = await driveRes.text();
        console.error("Drive API Error:", errText);
        throw new Error("Failed to fetch file from Google Drive");
      }

      const arrayBuffer = await driveRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString('base64');
      
      console.log("PDF downloaded. Igniting single Gemini extraction task to optimize time...");

      const pdfPart = {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data
        }
      };

      const generationPromise = ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              pdfPart,
              { text: "Você é um assistente acadêmico de mecânica de manutenção de aeronaves. Analise este PDF e gere em UMA única resposta:\n1. Um resumo estruturado extraindo o conteúdo principal, dividido em tópicos (title e content detalhado). Condense as informações essenciais.\n2. 5 Perguntas de Múltipla Escolha (Quiz) com 4 opções cada e explicação detalhada da correta baseadas nos tópicos extraídos." }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: unifiedSchema,
        }
      });

      const resGen = await generationPromise;

      if (!resGen.text) {
        throw new Error("Gemini generation task returned empty response.");
      }

      console.log("Extraction task completed! Sending final payload.");

      const extractedData = JSON.parse(resGen.text);

      const structuredData = {
        quiz: extractedData.quiz || [],
        topics: extractedData.topics || []
      };

      res.json(structuredData);

    } catch (error: any) {
      console.error("Error generating material:", error);
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
