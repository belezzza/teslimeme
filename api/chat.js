import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import pdf from 'pdf-parse';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { messages, selectedModel, fileData } = req.body;
        let finalMessages = [...messages];

        // Eğer bir dosya gönderilmişse, içeriğini ayıkla ve sisteme tanıt
        if (fileData) {
            const buffer = Buffer.from(fileData.split(',')[1], 'base64');
            const data = await pdf(buffer);
            finalMessages.push({ 
                role: "system", 
                content: `Kullanıcı bir PDF yükledi. İçeriği şudur: ${data.text}. Lütfen bu içeriğe göre yanıt ver veya özetle.` 
            });
        }

        const token = process.env["GITHUB_TOKEN"];
        const client = ModelClient("https://models.github.ai/inference", new AzureKeyCredential(token));

        const response = await client.path("/chat/completions").post({
            body: { messages: finalMessages, model: selectedModel || "gpt-4o" }
        });

        if (isUnexpected(response)) return res.status(400).json(response.body.error);

        res.status(200).json({ reply: response.body.choices[0].message.content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}