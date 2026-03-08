const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const modelSelect = document.getElementById('model-select');
const typingIndicator = document.getElementById('typing');

// Sohbet hafızası
let history = [{ role: "system", content: "Sen 'Teslimenin Yapay Zekası' isimli nazik, zeki ve yardımcı bir asistansın." }];

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Kullanıcı mesajını ekrana ve hafızaya ekle
    addMessage(text, 'user');
    userInput.value = '';
    history.push({ role: "user", content: text });

    // 2. Yükleniyor durumunu göster
    typingIndicator.style.display = 'block';
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: history,
                selectedModel: modelSelect.value 
            })
        });

        const data = await response.json();
        typingIndicator.style.display = 'none';

        if (data.reply) {
            // 3. AI yanıtını ekle ve hafızaya al
            addMessage(data.reply, 'ai');
            history.push({ role: "assistant", content: data.reply });
        } else {
            addMessage("Üzgünüm, şu an yanıt veremiyorum. Lütfen tekrar dene.", 'ai');
        }

    } catch (err) {
        typingIndicator.style.display = 'none';
        addMessage("Bağlantı hatası: Sunucuya ulaşılamadı.", 'ai');
        console.error("Hata:", err);
    }
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// KLAVYE: Enter tuşu dinleyicisi
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// TIKLAMA: Gönder butonu dinleyicisi
sendBtn.addEventListener('click', sendMessage);