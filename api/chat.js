import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import _pdf from 'pdf-parse/lib/pdf-parse.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { messages, selectedModel, fileData } = req.body;
        let finalMessages = [...messages];

        // PDF İşleme Kısmı
        if (fileData) {
            try {
                const base64Data = fileData.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const data = await _pdf(buffer);
                
                // Mesaj limitine takılmamak için metni sınırlıyoruz
                const pdfText = data.text.substring(0, 3000); 
                finalMessages.push({ 
                    role: "system", 
                    content: `Kullanıcı bir PDF dosyası yükledi. Bu dosyanın içeriği şöyledir: ${pdfText}. Lütfen bu içeriği temel alarak kullanıcıya yardımcı ol.` 
                });
            } catch (pdfErr) {
                console.error("PDF okuma hatası:", pdfErr);
            }
        }

        const token = process.env["GITHUB_TOKEN"];
        // ÖNEMLİ DÜZELTME: .io yerine .ai olmalı
        const client = ModelClient("https://models.github.ai/inference", new AzureKeyCredential(token));

        const response = await client.path("/chat/completions").post({
            body: { 
                messages: finalMessages, 
                model: selectedModel || "gpt-4o",
                temperature: 0.7 
            }
        });

        if (isUnexpected(response)) {
            return res.status(400).json(response.body.error);
        }

        res.status(200).json({ reply: response.body.choices[0].message.content });
    } catch (err) {
        // Hata durumunda JSON dönmesini garanti ediyoruz
        res.status(500).json({ error: err.message });
    }
}