
const WS_URL = 'wss://echo-ws-service.herokuapp.com';
let socket = null;
let isSocketConnected = false;

const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const geoBtn = document.getElementById('geoBtn');
const wsStatusLabel = document.getElementById('wsStatusLabel');

function scrollToBottom() {
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function addMessage(content, type, extraMeta = null) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    let bubbleHtml = '';
    let metaText = '';

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });

    if (type === 'user') {
        messageDiv.classList.add('user-message');
        bubbleHtml = `<div class="bubble user-bubble">${escapeHtml(content)}</div>`;
        metaText = `Вы • ${timeStr}`;
    } 
    else if (type === 'server') {
        messageDiv.classList.add('server-message');
        bubbleHtml = `<div class="bubble server-bubble">📡 ${escapeHtml(content)}</div>`;
        metaText = `Эхо-сервер • ${timeStr}`;
    }
    else if (type === 'location') {
        messageDiv.classList.add('location-message');
        bubbleHtml = `<div class="bubble location-bubble">📍 <span>Моя геопозиция:</span> ${content}</div>`;
        metaText = `Вы (геолокация) • ${timeStr}`;
    }

    messageDiv.innerHTML = bubbleHtml;
    const metaSpan = document.createElement('div');
    metaSpan.className = 'message-meta';
    metaSpan.innerText = metaText;
    messageDiv.appendChild(metaSpan);
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
    });
}

// Отправка текстового сообщения на сервер через WebSocket
function sendTextMessage(text) {
    if (!text.trim()) {
        return false;
    }
    if (!isSocketConnected || !socket || socket.readyState !== WebSocket.OPEN) {
        addMessage('⚠️ Соединение с сервером потеряно. Перезагрузите страницу или подождите переподключения.', 'server');
        return false;
    }
    
    const trimmed = text.trim();
    // 1. Показываем сообщение пользователя в чате
    addMessage(trimmed, 'user');
    
    // 2. Отправляем на сервер
    socket.send(trimmed);
    
    // Очищаем input
    messageInput.value = '';
    messageInput.focus();
    return true;
}

// Обработка геолокации (кнопка)
function sendGeolocation() {
    if (!navigator.geolocation) {
        addMessage('❌ Ваш браузер не поддерживает геолокацию.', 'server');
        return;
    }
    
    if (!isSocketConnected || !socket || socket.readyState !== WebSocket.OPEN) {
        addMessage('⚠️ Нет соединения с WebSocket. Невозможно отправить данные геолокации.', 'server');
        return;
    }
    
    // Показываем "загрузка"
    addMessage('⏳ Определение местоположения...', 'server');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            // Создаём ссылку на OpenStreetMap
            const osmLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
            const linkHtml = `<a href="${osmLink}" target="_blank" rel="noopener noreferrer">📍 Открыть карту (${latitude.toFixed(5)}, ${longitude.toFixed(5)})</a>`;
            
            // Добавляем сообщение о геолокации в чат
            addMessage(linkHtml, 'location');
            
            // Отправляем данные на сервер (ответ эхо-сервера будет проигнорирован)
            const geoPayload = `🌍 Геолокация: ${latitude}, ${longitude}`;
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(geoPayload);
            }
            
            // Удаляем сообщение о загрузке
            const allMsgs = messagesContainer.querySelectorAll('.message');
            if (allMsgs.length > 0) {
                const lastMsgDiv = allMsgs[allMsgs.length - 2];
                if (lastMsgDiv && lastMsgDiv.querySelector('.bubble') && 
                    lastMsgDiv.querySelector('.bubble').innerText.includes('⏳ Определение местоположения')) {
                    lastMsgDiv.remove();
                }
            }
        },
        (error) => {
            let errorMsg = '';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = '❌ Доступ к геолокации запрещён. Разрешите доступ в настройках браузера.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = '❌ Информация о местоположении недоступна.';
                    break;
                case error.TIMEOUT:
                    errorMsg = '❌ Время получения геолокации истекло.';
                    break;
                default:
                    errorMsg = '❌ Ошибка геолокации.';
            }
            // удаляем загрузочное сообщение
            const allMsgs = messagesContainer.querySelectorAll('.message');
            if (allMsgs.length > 0) {
                const lastMsg = allMsgs[allMsgs.length-1];
                if (lastMsg && lastMsg.querySelector('.bubble') && 
                    lastMsg.querySelector('.bubble').innerText.includes('⏳ Определение местоположения')) {
                    lastMsg.remove();
                }
            }
            addMessage(errorMsg, 'server');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function initWebSocket() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return;
    }
    
    socket = new WebSocket(WS_URL);
    
    socket.onopen = () => {
        console.log('WebSocket соединение установлено');
        isSocketConnected = true;
        wsStatusLabel.innerHTML = '✅ Online · эхо активен';
        wsStatusLabel.classList.add('ws-connected');
        wsStatusLabel.classList.remove('ws-disconnected');
    };
    
    socket.onmessage = (event) => {
        let receivedData = event.data;
        if (typeof receivedData !== 'string') {
            receivedData = String(receivedData);
        }
        
        // Игнорируем ответ эхо-сервера на геолокацию
        const isGeoEcho = receivedData.includes('🌍 Геолокация:') || 
                          (receivedData.includes('Геолокация:') && receivedData.includes(','));
        
        if (isGeoEcho) {
            console.log('Игнорируем эхо-ответ геолокации: ', receivedData);
            return;
        }
        
        // Выводим обычный эхо-ответ на текстовое сообщение
        if (receivedData && receivedData.trim() !== '') {
            addMessage(receivedData, 'server');
        } else {
            addMessage('(пустой ответ сервера)', 'server');
        }
    };
    
    socket.onerror = (error) => {
        console.error('WebSocket ошибка:', error);
        wsStatusLabel.innerHTML = '⚠️ Ошибка соединения';
        wsStatusLabel.classList.add('ws-disconnected');
        isSocketConnected = false;
        addMessage('⚠️ Ошибка WebSocket. Попробуйте обновить страницу.', 'server');
    };
    
    socket.onclose = (event) => {
        console.log('WebSocket закрыт', event.code, event.reason);
        isSocketConnected = false;
        wsStatusLabel.innerHTML = '🔴 Отключено · переподключение...';
        wsStatusLabel.classList.add('ws-disconnected');
        // переподключение через 3 секунды
        setTimeout(() => {
            if (!socket || socket.readyState === WebSocket.CLOSED) {
                initWebSocket();
            }
        }, 3000);
    };
}

// Функция проверки состояния перед отправкой
function ensureSocketAndSendText() {
    if (!isSocketConnected || !socket || socket.readyState !== WebSocket.OPEN) {
        addMessage('❌ Соединение с сервером отсутствует. Пожалуйста, подождите восстановления связи.', 'server');
        return false;
    }
    const rawText = messageInput.value;
    if (!rawText.trim()) {
        addMessage('✏️ Введите текст сообщения', 'server');
        return false;
    }
    sendTextMessage(rawText);
    return true;
}

sendBtn.addEventListener('click', () => {
    ensureSocketAndSendText();
});

geoBtn.addEventListener('click', () => {
    if (!isSocketConnected || !socket || socket.readyState !== WebSocket.OPEN) {
        addMessage('❌ Нет соединения с WebSocket. Геолокация недоступна.', 'server');
        return;
    }
    sendGeolocation();
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        ensureSocketAndSendText();
    }
});

// Старт WebSocket
initWebSocket();

window.addEventListener('load', () => {
    messageInput.focus();
});