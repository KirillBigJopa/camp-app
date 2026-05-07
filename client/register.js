async function register() {
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!fullName || !email || !phone || !password) {
        showToast("Заполни все поля");
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fullName,
                email,
                phone,
                password
            })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.clear();

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            console.log("REGISTER RESPONSE:", data);
            showToast("Регистрация успешна");

            setTimeout(() => {
                window.location.href = "user.html";
            }, 1500);
        }

    } catch (err) {
        console.error(err);
        alert("Ошибка сервера");
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