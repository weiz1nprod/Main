import { GoogleGenAI, Type, Schema } from "@google/genai";

export const maxDuration = 60; // Allow up to 60 seconds on Vercel

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
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
    },
    mindmap: {
      type: Type.OBJECT,
      properties: {
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING }
            },
            required: ["id", "label"]
          }
        },
        edges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              source: { type: Type.STRING },
              target: { type: Type.STRING },
              label: { type: Type.STRING }
            },
            required: ["id", "source", "target"]
          }
        }
      },
      required: ["nodes", "edges"]
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
  required: ["flashcards", "quiz", "mindmap", "topics"]
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { fileId, accessToken } = req.body;
    if (!fileId || !accessToken) {
      return res.status(400).json({ error: "Missing fileId or accessToken" });
    }

    console.log("Fetching PDF from Google Drive...", fileId);
    // Vercel node fetch doesn't exist natively on older node, but node 18+ has global fetch
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
    
    console.log("PDF downloaded. Sending to Gemini...");

    const generation = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Data
              }
            },
            { text: "Você é um assistente acadêmico de mecânica de manutenção de aeronaves. Analise este PDF e gere:\n1. 10 Flashcards (Perguntas e Respostas curtas e diretas).\n2. 5 Perguntas de Múltipla Escolha (Quiz) com 4 opções cada e explicação detalhada da correta.\n3. Um mapa mental básico conectando os conceitos chave do material (nodes e edges curtos e diretos, máximo de 10 nodes).\n4. Resumo estruturado extraindo o conteúdo principal, dividido em tópicos (title e content detalhado). Condense as informações essenciais para não exceder limites de texto." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const responseText = generation.text;
    if (!responseText) {
      throw new Error("Gemini returned empty response.");
    }

    const structuredData = JSON.parse(responseText);
    res.status(200).json(structuredData);

  } catch (error: any) {
    console.error("Error generating material:", error);
    res.status(500).json({ error: error.message });
  }
}
