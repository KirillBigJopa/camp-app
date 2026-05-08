let chatId;
let localStream;
let peerConnection;
let pendingCandidates = [];

const API_URL =
    "https://camp-app-ciic.onrender.com";

const socket = io(API_URL, {
    transports: ["websocket", "polling"]
});
const token = localStorage.getItem("token");

// ✅ сначала читаем user
const userRaw = localStorage.getItem("user");

let user = null;

try {
    user = JSON.parse(userRaw);
} catch (e) {
    console.log("❌ ошибка парсинга user");
}

const userId = user?._id;

console.log("USER:", user);
console.log("USER ID:", userId);

const servers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};
// DOM
const chat = document.getElementById("chat");
const input = document.getElementById("msg");

// ✅ только если есть userId
if (userId) {
    socket.emit("register", { userId });
}
if (userRaw && userRaw !== "undefined") {
    user = JSON.parse(userRaw);
}



async function initChat() {
    const res = await fetch(`${API_URL}/api/chat/my`, {
        headers: {
            Authorization: "Bearer " + token
        }
    });

    if (!res.ok) {
        console.log("❌ Ошибка авторизации");
        return;
    }

    const chat = await res.json();

    chatId = chat._id;
    console.log("CHAT LOADED:", chatId);
    console.log("MY CHAT:", chatId);

    startSocket();
    console.log("SOCKET STARTED");
}
function startSocket() {
    if (!chatId) {
        console.log("❌ chatId null, socket не запускаем");
        return;
    }
    console.log("JOIN CHAT:", chatId);
    socket.emit("join_chat", chatId);
    loadMessages();
}
async function loadMessages() {
    chat.innerHTML = "";

    const res = await fetch(`${API_URL}/api/message/${chatId}`, {
        headers: {
            Authorization: "Bearer " + token
        }
    });
    const messages = await res.json();

    messages.forEach(addMessage);
}


// realtime
socket.on("receive_message", (msg) => {
    console.log("MESSAGE RECEIVED", msg);
    addMessage(msg);
});

// добавление сообщения
function addMessage(msg) {
    const div = document.createElement("div");
    div.classList.add("message");

    if (msg.sender === "user") div.classList.add("user");
    else if (msg.sender === "admin") div.classList.add("admin");
    else div.classList.add("bot");

    div.innerText = msg.text;

    // 🔥 кнопки
    if (msg.buttons && msg.buttons.length > 0) {
        const btnContainer = document.createElement("div");

        msg.buttons.forEach(btn => {
            const button = document.createElement("button");
            button.innerText = btn.text;

            button.onclick = () => {
                sendQuick(btn.value);
            };

            btnContainer.appendChild(button);
        });

        div.appendChild(btnContainer);
    }

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function sendQuick(text) {
    if (!chatId) return;

    socket.emit("send_message", {
        chatId,
        sender: "user",
        text
    });
}
// отправка
function send() {
    if (!chatId) {
        console.log("❌ chatId ещё не готов");
        return;
    }

    const text = input.value.trim();
    if (!text) return;

    socket.emit("send_message", {
        chatId,
        sender: "user",
        text
    });

    input.value = "";
}
async function startCall() {

    console.log("START CALL");

    const callUI = document.getElementById("callUI");

    if (!callUI) {
        console.log("❌ callUI не найден");
        return;
    }

    callUI.style.display = "flex"; // 🔥 обязательно

    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
    } catch (e) {
        console.error("❌ нет доступа к камере", e);
        return;
    }

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



    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "login.html";
    }

}
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



function logout() {

    socket.disconnect();

    localStorage.clear();

    window.location.href = "login.html";
}



function endCall() {

    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    document.getElementById("localVideo").srcObject = null;
    document.getElementById("remoteVideo").srcObject = null;

    document.getElementById("callUI").style.display = "none";

    console.log("📴 звонок завершён");
}
initChat();
document
    .getElementById("msg")
    .addEventListener("keydown", (e) => {

        if (e.key === "Enter") {
            send();
        }

    });