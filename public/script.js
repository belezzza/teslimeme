const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const fileInput = document.getElementById('file-input');
let lastAIResponse = "";
let isVoiceEnabled = true;

// 1. PDF OLARAK İNDİRME FONKSİYONU
async function downloadLastAsPDF() {
    if (!lastAIResponse) return alert("Henüz indirilecek bir yanıt yok.");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(12);
    // Türkçe karakter desteği için basit bir temizlik (veya font eklenmeli)
    const splitText = doc.splitTextToSize(lastAIResponse, 180);
    doc.text(splitText, 10, 10);
    doc.save("ozet.pdf");
}

async function sendMessage() {
    const text = userInput.value.trim();
    const file = fileInput.files[0];
    if (!text && !file) return;

    addMessage(text || "Dosya yüklendi, özetleniyor...", 'user');
    userInput.value = '';
    document.getElementById('typing').style.display = 'block';

    let fileBase64 = null;
    if (file) {
        const reader = new FileReader();
        fileBase64 = await new Promise(resolve => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: [{ role: "user", content: text }], 
                selectedModel: document.getElementById('model-select').value,
                fileData: fileBase64
            })
        });

        const data = await response.json();
        document.getElementById('typing').style.display = 'none';
        
        if (data.reply) {
            addMessage(data.reply, 'ai');
            lastAIResponse = data.reply; // PDF için sakla
            if(isVoiceEnabled) speak(data.reply);
        }
        fileInput.value = ""; // Dosyayı temizle
    } catch (err) {
        console.error(err);
    }
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    window.speechSynthesis.speak(utterance);
}

document.getElementById('send-btn').addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });