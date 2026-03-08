import { OpenRouter } from "@openrouter/sdk";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Sadece POST kabul edilir' });

    try {
        const { messages, fileData } = req.body;
        let userPrompt = messages[messages.length - 1].content;
        let contextMessages = [];

        // 1. PDF İşleme
        if (fileData) {
            try {
                const base64Data = fileData.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const data = await pdf(buffer);
                
                // PDF içeriğini sistem mesajı olarak ekle
                contextMessages.push({
                    role: "system",
                    content: `Kullanıcı bir PDF yükledi. İçerik: ${data.text.substring(0, 5000)}`
                });
            } catch (pdfErr) {
                console.error("PDF okuma hatası:", pdfErr);
            }
        }

        // 2. OpenRouter Bağlantısı
        const openrouter = new OpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY // Vercel'e ekleyeceğiz
        });

        // Mesajları birleştir
        const finalMessages = [...contextMessages, ...messages];

        // 3. Yanıtı Al (Streaming yerine direkt yanıt - Vercel Serverless için daha stabil)
        const response = await openrouter.chat.send({
            model: "nvidia/nemotron-3-nano-30b-a3b:free",
            messages: finalMessages
        });

        const reply = response.choices[0]?.message?.content || "Yanıt alınamadı.";
        return res.status(200).json({ reply: reply });

    } catch (err) {
        console.error("Hata:", err.message);
        return res.status(500).json({ error: "Sunucu hatası: " + err.message });
    }
}