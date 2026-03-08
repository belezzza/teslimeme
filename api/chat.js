import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Sadece POST istekleri kabul edilir' });
    }

    try {
        const { messages, selectedModel } = req.body;
        const token = process.env["GITHUB_TOKEN"];
        const client = ModelClient("https://models.github.ai/inference", new AzureKeyCredential(token));

        const response = await client.path("/chat/completions").post({
            body: { 
                messages: messages, 
                model: selectedModel || "gpt-4o",
                temperature: 0.8
            }
        });

        if (isUnexpected(response)) {
            return res.status(400).json(response.body.error);
        }

        return res.status(200).json({ reply: response.body.choices[0].message.content });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}