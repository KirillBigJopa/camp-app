const API_URL =
    "https://camp-app-ciic.onrender.com";

const socket = io(API_URL);
let localStream;
let peerConnection;
let pendingCandidates = [];
let currentChatId = null;
let onlineUsers = [];
const unread = {};
const user = JSON.parse(localStorage.getItem("user"));
const servers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

const messagesDiv = document.getElementById("messages");
const chatTitle = document.getElementById("chatTitle");
if (!user || user.role !== "admin") {
    alert("Нет доступа");

    window.location.href = "login.html";
}
// 🔥 получить онлайн пользователей
socket.emit("get_online_users");

socket.on("online_users_list", (users) => {
    onlineUsers = users;
});

// 🔥 получение новых сообщений (realtime)
socket.on("receive_message", (msg) => {
    if (msg.chatId === currentChatId) {
        addMessage(msg);
    }
});

// 🔔 уведомления
socket.on("admin_notification", (data) => {
    const { chatId } = data;

    if (chatId !== currentChatId) {
        unread[chatId] = (unread[chatId] || 0) + 1;

        const audio = new Audio("sounds/notification.mp3");
        audio.play();

        updateChatList();
    }
});

// 🔥 загрузка списка чатов
async function updateChatList() {

    const res = await fetch(`${API_URL}/api/chat`);

    const chats = await res.json();

    const list = document.getElementById("chatList");

    list.innerHTML = "";

    chats.forEach(chat => {

        const div = document.createElement("div");

        div.className =
            "chat-item " +
            (chat._id === currentChatId ? "active" : "");

        const fullName =
            chat.userId?.fullName || "Без имени";

        // инициалы
        const initials = fullName
            .split(" ")
            .map(w => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

        const isOnline =
            onlineUsers.includes(chat.userId?._id);

        const unreadCount = unread[chat._id] || 0;

        const lastMessage =
            chat.lastMessage || "Нет сообщений";

        div.innerHTML = `

            <div class="avatar">
                ${initials}
            </div>

            <div class="chat-info">

                <div class="chat-top">

                    <div class="chat-name">
                        ${fullName}
                    </div>

                    <div class="chat-time">
                        ${isOnline ? "🟢" : ""}
                    </div>

                </div>

                <div class="chat-preview">
                    ${lastMessage}
                </div>

            </div>

            ${unreadCount > 0
                ? `<div class="badge">${unreadCount}</div>`
                : ""
            }

        `;

        div.onclick = () => {

            currentChatId = chat._id;

            openChat(chat._id);

            document
                .querySelectorAll(".chat-item")
                .forEach(el => el.classList.remove("active"));

            div.classList.add("active");
        };

        list.appendChild(div);
    });
}

// 🔥 открытие чата
async function openChat(chatId) {
    currentChatId = chatId;

    console.log("OPEN CHAT:", chatId);

    // подключение к комнате
    socket.emit("admin_join_chat", chatId);

    // сброс непрочитанных
    unread[chatId] = 0;

    // загрузка истории
    const res = await fetch(`${API_URL}/api/message/${chatId}`, {
        headers: {
            Authorization: "Bearer " + localStorage.getItem("token")
        }
    });

    const messages = await res.json();

    messagesDiv.innerHTML = "";

    messages.forEach(addMessage);

    chatTitle.innerText = "Чат: " + chatId;

    updateChatList();
}

// 🔥 добавление сообщения
function addMessage(msg) {
    const div = document.createElement("div");

    div.classList.add("message");

    if (msg.sender === "admin") div.classList.add("admin");
    else if (msg.sender === "user") div.classList.add("user");
    else div.classList.add("bot");

    div.innerText = msg.text;

    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 🔥 отправка сообщения
function send() {
    const input = document.getElementById("msgInput");
    const text = input.value.trim();

    if (!text || !currentChatId) return;

    socket.emit("send_message", {
        chatId: currentChatId,
        sender: "admin",
        text
    });

    input.value = "";
}

// 🔌 подключение
socket.on("connect", () => {
    console.log("ADMIN CONNECTED:", socket.id);
});
socket.on("incoming_call", async ({ offer, chatId }) => {

    console.log("📞 входящий звонок");

    // 🔥 ВАЖНО
    currentChatId = chatId;

    const accept = confirm("Входящий видеозвонок. Принять?");

    if (!accept) return;

    document.getElementById("callUI").style.display = "flex";

    localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });

    document.getElementById("localVideo").srcObject = localStream;

    peerConnection = new RTCPeerConnection(servers);

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        document.getElementById("remoteVideo").srcObject =
            event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {

        if (event.candidate) {

            socket.emit("ice_candidate", {
                chatId: currentChatId,
                candidate: event.candidate
            });

        }
    };

    await peerConnection.setRemoteDescription(offer);

    for (const candidate of pendingCandidates) {
        await peerConnection.addIceCandidate(candidate);
    }

    pendingCandidates = [];

    const answer = await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(answer);

    // 🔥 ОТПРАВКА ANSWER

    socket.emit("answer_call", {
        chatId: currentChatId,
        answer
    });

});
socket.on("call_accepted", async ({ answer }) => {
    console.log("✅ звонок принят");

    await peerConnection.setRemoteDescription(answer);
    for (const candidate of pendingCandidates) {
        await peerConnection.addIceCandidate(candidate);
    }
    pendingCandidates = [];
});
socket.on("ice_candidate", async ({ candidate }) => {
    if (!peerConnection || !peerConnection.remoteDescription) {
        pendingCandidates.push(candidate);
        return;
    }

    try {
        await peerConnection.addIceCandidate(candidate);
    } catch (e) {
        console.error("ICE error", e);
    }
});
function toggleMic() {
    if (!localStream) return;

    const track = localStream.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;

    document.getElementById("micBtn").style.background =
        track.enabled ? "#2a2a2f" : "gray";
}

function toggleCamera() {
    if (!localStream) return;

    const track = localStream.getVideoTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;

    document.getElementById("camBtn").style.background =
        track.enabled ? "#2a2a2f" : "gray";
}
function endCall() {
    // закрыть соединение
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    // остановить камеру и микрофон
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    // очистить видео
    document.getElementById("localVideo").srcObject = null;
    document.getElementById("remoteVideo").srcObject = null;

    // 🔥 СКРЫТЬ ОКНО ЗВОНКА
    document.getElementById("callUI").style.display = "none";

    console.log("📴 звонок завершён");
}
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
}
function logout() {
    socket.disconnect(); // 🔥 остановка соединения

    localStorage.clear();

    window.location.href = "login.html";
}

// старт
updateChatList();
document
    .getElementById("msgInput")
    .addEventListener("keydown", (e) => {

        if (e.key === "Enter") {
            send();
        }

    });