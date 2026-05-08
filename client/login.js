async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    const btn = document.getElementById("loginBtn");
    const loader = document.getElementById("loader");
    const btnText = document.getElementById("btnText");

    if (!email || !password) {
        showToast("Заполни все поля", true);
        return;
    }

    // 🔥 включаем loader
    loader.style.display = "inline-block";
    btnText.innerText = "Вход...";
    btn.disabled = true;

    // 🔥 ДАЁМ БРАУЗЕРУ ОТРИСОВАТЬ СПИННЕР
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const res = await fetch("https://camp-app-ciic.onrender.com/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            showToast("Вход выполнен");

            setTimeout(() => {
                if (data.user.role === "admin") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "user.html";
                }
            }, 1500);

        } else {
            showToast(data.error, true);
        }

    } catch (err) {
        showToast("Ошибка сервера", true);
    } finally {
        loader.style.display = "none";
        btnText.innerText = "Войти";
        btn.disabled = false;
    }
}
function showToast(text, isError = false) {
    const container = document.getElementById("toast");

    const toast = document.createElement("div");
    toast.classList.add("toast-message");

    if (isError) toast.classList.add("toast-error");

    toast.innerText = text;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}