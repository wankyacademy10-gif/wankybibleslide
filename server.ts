import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const SYSTEM_INSTRUCTION = `
Ou se yon asistan biblik entelijan ki ede moun jwenn vèsè nan Bib la, nan lang Kreyòl, Franse, oswa Anglais.

Objektif ou se retounen tèks chak vèsè byen fòmate pou yo ka fasilman itilize yo nan prezantasyon PowerPoint (.pptx) pandan sèvis legliz.

Lè itilizatè a antre yon referans tankou “1 Wa 21:1-7” oswa “Matye 5:1-12”, ou dwe:

1. Idantifye liv la, chapit la, ak ranje vèsè yo.
2. Bay chak vèsè separeman sou nouvo liy, ak nimewo vèsè a devan tèks la.
3. Asire tout tèks soti nan yon tradiksyon piblik (pa egzanp: Bib Kreyòl 1985, Louis Segond 1910, oswa King James Version).
4. Pa ajoute okenn nòt pèsonèl, entèpretasyon, ni komantè — sèlman tèks biblik la.
5. Toujou retounen repons lan an fòma JSON.

Fòma repons ou dwe swiv modèl sa a:

{
  "book": "non liv la",
  "chapter": nimewo_chapit,
  "verses": [
    {"number": nimewo_vèsè, "text": "tèks vèsè a"},
    {"number": nimewo_vèsè, "text": "tèks vèsè a"}
  ],
  "language": "lang tèks la (Kreyòl, Français, English)",
  "source": "non tradiksyon piblik la"
}
`;

const SONG_SYSTEM_INSTRUCTION = `
Ou se yon asistan ki travay ak tèks chante. Lè itilizatè a mande yon chante pa tit oswa referans (eg. "Chant d'Espérance — vèsè 1-3" oswa "Chant: O Lord, My God"), ou dwe:

1) Verifye ke tèks la disponib nan sous piblik oswa bay yon mesaj si li gen copyright (si ou pa sèten, endike "copyright_unknown").
2) Si tèks la disponib/piblik, retounen li estriktire an JSON sèlman, san okenn eksplikasyon.

Fòma JSON:
{
  "title": "tit chante a",
  "collection": "non koleksyon si genyen",
  "author": "otè/oswa 'trad.'",
  "language": "Kreyòl/Français/English",
  "license": "public_domain" | "copyright" | "copyright_unknown",
  "lyrics": [
    {"part": "verse 1", "lines": ["Liy 1", "Liy 2", "..."]},
    {"part": "chorus", "lines": ["Liy 1", "Liy 2"]},
    ...
  ]
}
`;

app.post("/api/bible", async (req, res) => {
  try {
    const { reference, language } = req.body;
    if (!reference) {
      return res.status(400).json({ error: "Reference is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY1;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API Key (GEMINI_API_KEY1) is missing. Please configure it in AI Studio Secrets." });
    }

    const genAI = new GoogleGenAI({ apiKey });
    const prompt = `${reference} nan lang ${language || "Kreyòl"}`;

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const bibleData = JSON.parse(text);
    res.json(bibleData);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch Bible verses" });
  }
});

app.post("/api/songs", async (req, res) => {
  try {
    const { query, language } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY1;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API Key (GEMINI_API_KEY1) is missing. Please configure it in AI Studio Secrets." });
    }

    const genAI = new GoogleGenAI({ apiKey });
    const prompt = `Chèche chante sa a: "${query}" nan lang ${language || "Kreyòl"}. Si se nan Chant d'Espérance, presize nimewo a si posib.`;

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SONG_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const songData = JSON.parse(text);
    res.json(songData);
  } catch (error: any) {
    console.error("Gemini Song Error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch song lyrics" });
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
