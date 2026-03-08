import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { messages, fileData } = req.body;
        let finalMessages = [...messages];

        // 1. PDF İşleme (Varsa)
        if (fileData) {
            try {
                const base64Data = fileData.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const data = await pdf(buffer);
                const pdfText = data.text.substring(0, 3000).replace(/\s+/g, ' ');
                
                finalMessages.unshift({
                    role: "system",
                    content: `Kullanıcı bir PDF yükledi. İçerik özeti: ${pdfText}`
                });
            } catch (pdfErr) {
                console.error("PDF Hatası:", pdfErr);
            }
        }

        // 2. OpenRouter API Çağrısı (Fetch ile)
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "nvidia/nemotron-3-nano-30b-a3b:free",
                "messages": finalMessages
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error || "API Hatası" });
        }

        return res.status(200).json({ reply: data.choices[0].message.content });

    } catch (err) {
        return res.status(500).json({ error: "Sistem Hatası: " + err.message });
    }
}