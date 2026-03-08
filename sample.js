import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import readline from "readline";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "gpt-4o"; // Genelde en stabil çalışan model budur

// Terminalden girdi almak için arayüz oluşturuyoruz
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const client = ModelClient(endpoint, new AzureKeyCredential(token));

// Sohbet geçmişini tutacak liste (Yapay zekanın önceki dediklerinizi hatırlaması için)
let messages = [
  { role: "system", content: "Sen yardımcı ve zeki bir asistansın." }
];

async function chat() {
  rl.question("\nSiz: ", async (userInput) => {
    // Çıkış komutu kontrolü
    if (userInput.toLowerCase() === "exit" || userInput.toLowerCase() === "çıkış") {
      console.log("Görüşürüz!");
      rl.close();
      return;
    }

    // Kullanıcı mesajını geçmişe ekle
    messages.push({ role: "user", content: userInput });

    try {
      const response = await client.path("/chat/completions").post({
        body: {
          messages: messages,
          model: model
        }
      });

      if (isUnexpected(response)) {
        throw response.body.error;
      }

      const assistantMessage = response.body.choices[0].message.content;
      console.log("\nAI:", assistantMessage);

      // Asistanın cevabını geçmişe ekle (Böylece bir sonraki soruda ne dediğini bilir)
      messages.push({ role: "assistant", content: assistantMessage });

    } catch (err) {
      console.error("\nBir hata oluştu:", err.message || err);
    }

    // Tekrar soru sorması için fonksiyonu yeniden çağır (Döngü)
    chat();
  });
}

console.log("--- GitHub AI Sohbet Başladı (Çıkmak için 'exit' yazın) ---");
chat();