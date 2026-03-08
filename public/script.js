const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const fileInput = document.getElementById('file-input');
const sendBtn = document.getElementById('send-btn');
const voiceToggle = document.getElementById('voice-toggle');
const typingIndicator = document.getElementById('typing');

let isVoiceEnabled = true;
let lastAIResponse = "";

// PDF İNDİRME
async function downloadLastAsPDF() {
    if (!lastAIResponse) return alert("Henüz indirilecek bir yanıt yok.");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(lastAIResponse, 180);
    doc.text(splitText, 10, 10);
    doc.save("teslimen-ozet.pdf");
}

// SESLİ YANIT
function speak(text) {
    if (!isVoiceEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    window.speechSynthesis.speak(utterance);
}

voiceToggle.addEventListener('click', () => {
    isVoiceEnabled = !isVoiceEnabled;
    voiceToggle.classList.toggle('active');
    voiceToggle.querySelector('i').className = isVoiceEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
});

async function sendMessage() {
    const text = userInput.value.trim();
    const file = fileInput.files[0];
    if (!text && !file) return;

    addMessage(text || "Dosya gönderildi.", 'user');
    userInput.value = '';
    typingIndicator.style.display = 'block';

    let fileBase64 = null;
    if (file) {
        const reader = new FileReader();
        fileBase64 = await new Promise(r => {
            reader.onload = () => r(reader.result);
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
        typingIndicator.style.display = 'none';

        if (data.reply) {
            addMessage(data.reply, 'ai');
            lastAIResponse = data.reply;
            speak(data.reply);
        }
        fileInput.value = "";
    } catch (err) {
        typingIndicator.style.display = 'none';
        addMessage("Hata: " + err.message, 'ai');
    }
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });