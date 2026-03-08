const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const modelSelect = document.getElementById('model-select');
const typingIndicator = document.getElementById('typing');
const clearBtn = document.getElementById('clear-btn');

// 1. HAFIZA: Eski mesajları yükle
let history = JSON.parse(localStorage.getItem('chatHistory')) || [
    { role: "system", content: "Sen 'Teslimenin Yapay Zekası' isimli nazik ve zeki bir asistansın." }
];

// Sayfa yüklendiğinde hafızayı ekrana bas
window.onload = () => {
    history.forEach(msg => {
        if(msg.role !== 'system') addMessage(msg.content, msg.role === 'user' ? 'user' : 'ai');
    });
};

// 2. SES: Cevabı sesli oku
function speak(text) {
    // Tarayıcı sesleri henüz yüklenmemiş olabilir, kısa bir gecikme ekleyelim
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'tr-TR';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }, 100);
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';
    history.push({ role: "user", content: text });
    saveHistory();

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
            addMessage(data.reply, 'ai');
            history.push({ role: "assistant", content: data.reply });
            saveHistory();
            speak(data.reply); // Sesli okumayı başlat
        }
    } catch (err) {
        typingIndicator.style.display = 'none';
        addMessage("Bağlantı hatası oluştu.", 'ai');
    }
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function saveHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(history));
}

// 3. TEMİZLE: Sohbeti sıfırla
clearBtn.addEventListener('click', () => {
    if(confirm("Tüm geçmiş silinsin mi?")) {
        localStorage.removeItem('chatHistory');
        location.reload();
    }
});

userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
sendBtn.addEventListener('click', sendMessage);