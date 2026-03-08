import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import _pdf from 'pdf-parse/lib/pdf-parse.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { messages, selectedModel, fileData } = req.body;
        let finalMessages = [...messages];

        if (fileData) {
            try {
                const base64Data = fileData.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const data = await _pdf(buffer); // PDF okuma işlemi
                
                // İçeriği çok uzunsa kısıtla ve sisteme ekle
                const pdfText = data.text.substring(0, 4000); 
                finalMessages.push({ 
                    role: "system", 
                    content: `Kullanıcı bir PDF yükledi. İçeriği: ${pdfText}. Lütfen bu içeriği analiz et.` 
                });
            } catch (pdfErr) {
                console.error("PDF İşleme Hatası:", pdfErr);
            }
        }

        const token = process.env["GITHUB_TOKEN"];
        const client = ModelClient("https://models.github.io/inference", new AzureKeyCredential(token));

        const response = await client.path("/chat/completions").post({
            body: { 
                messages: finalMessages, 
                model: selectedModel || "gpt-4o",
                temperature: 0.7 
            }
        });

        if (isUnexpected(response)) return res.status(400).json(response.body.error);
        res.status(200).json({ reply: response.body.choices[0].message.content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}