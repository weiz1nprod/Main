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

  // Extracted Data schemas for parallel processing
  const flashquizSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      flashcards: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING }
          },
          required: ["question", "answer"]
        }
      },
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
      }
    },
    required: ["flashcards", "quiz"]
  };

  const mindmapSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      mindmap: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { id: { type: Type.STRING }, label: { type: Type.STRING } },
              required: ["id", "label"]
            }
          },
          edges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { id: { type: Type.STRING }, source: { type: Type.STRING }, target: { type: Type.STRING }, label: { type: Type.STRING } },
              required: ["id", "source", "target"]
            }
          }
        },
        required: ["nodes", "edges"]
      }
    },
    required: ["mindmap"]
  };

  const topicsSchema: Schema = {
    type: Type.OBJECT,
    properties: {
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
    required: ["topics"]
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
      
      console.log("PDF downloaded. Extracting text to optimize Gemini processing speed...");
      // Dynamically import pdf-parse to avoid esbuild issues
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      const pdfText = pdfData.text;
      
      console.log(`Extracted ~${pdfText.length} characters of text. Igniting 3 parallel Gemini extraction tasks...`);

      const textPart = {
        text: `CONTEÚDO DO MATERIAL:\n\n${pdfText}\n\n=== FIM DO CONTEÚDO ===\n\n`
      };

      const flashQuizPromise = ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              textPart,
              { text: "Você é um assistente acadêmico de mecânica de manutenção de aeronaves. Analise o texto acima e gere:\n1. 10 Flashcards (Perguntas e Respostas curtas e diretas).\n2. 5 Perguntas de Múltipla Escolha (Quiz) com 4 opções cada e explicação detalhada da correta." }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: flashquizSchema,
        }
      });

      const mindmapPromise = ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              textPart,
              { text: "Você é um assistente acadêmico de mecânica de manutenção de aeronaves. Analise o texto acima e gere um mapa mental básico conectando os conceitos chave do material (nodes e edges curtos e diretos, máximo de 10 nodes)." }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: mindmapSchema,
        }
      });

      const topicsPromise = ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              textPart,
              { text: "Você é um assistente acadêmico de mecânica de manutenção de aeronaves. Analise o texto acima e gere um resumo estruturado extraindo o conteúdo principal, dividido em tópicos (title e content detalhado). Condense as informações essenciais." }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: topicsSchema,
        }
      });

      const [flashQuizRes, mindmapRes, topicsRes] = await Promise.all([
        flashQuizPromise,
        mindmapPromise,
        topicsPromise
      ]);

      if (!flashQuizRes.text || !mindmapRes.text || !topicsRes.text) {
        throw new Error("One or more Gemini generation tasks returned empty response.");
      }

      console.log("All tasks completed! Merging final payload.");

      const flashQuizData = JSON.parse(flashQuizRes.text);
      const mindmapData = JSON.parse(mindmapRes.text);
      const topicsData = JSON.parse(topicsRes.text);

      const structuredData = {
        flashcards: flashQuizData.flashcards || [],
        quiz: flashQuizData.quiz || [],
        mindmap: mindmapData.mindmap || { nodes: [], edges: [] },
        topics: topicsData.topics || []
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
