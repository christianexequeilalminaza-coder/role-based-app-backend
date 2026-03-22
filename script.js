const API_URL = "http://localhost:3000";

// =========================
// 🔐 AUTH HANDLING
// =========================

function saveToken(token) {
    sessionStorage.setItem("authToken", token);
}

function getToken() {
    return sessionStorage.getItem("authToken");
}

function logout() {
    sessionStorage.removeItem("authToken");
    location.reload();
}

// =========================
// 🔁 NAVIGATION (SPA)
// =========================

function navigateTo(hash) {
    location.hash = hash;
}

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(pageId)?.classList.add("active");
}

window.addEventListener("hashchange", handleRoute);

function handleRoute() {
    const route = location.hash.replace("#/", "") || "home";
    showPage(route);
}

// =========================
// 🔑 LOGIN
// =========================

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPass").value;

    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            saveToken(data.token);
            alert("Login success dawg 🔥");

            setAuthUI(data.user);
            navigateTo("#/profile");
        } else {
            alert(data.error);
        }

    } catch (err) {
        alert("Server error");
    }
}

// =========================
// 📝 REGISTER
// =========================

async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById("regFirst").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPass").value;

    try {
        const res = await fetch(`${API_URL}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Registered successfully!");
            navigateTo("#/login");
        } else {
            alert(data.error);
        }

    } catch (err) {
        alert("Server error");
    }
}

// =========================
// 👤 PROFILE (PROTECTED)
// =========================

async function loadProfile() {
    const token = getToken();

    if (!token) return;

    const res = await fetch(`${API_URL}/api/profile`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();

    if (res.ok) {
        document.getElementById("profile-content").innerHTML = `
            <h3>${data.user.username}</h3>
            <p>Role: ${data.user.role}</p>
        `;
        setAuthUI(data.user);
    }
}

// =========================
// 🎭 ROLE UI CONTROL
// =========================

function setAuthUI(user) {
    document.body.classList.remove("not-authenticated");
    document.body.classList.add("authenticated");

    if (user.role === "admin") {
        document.body.classList.add("is-admin");
    }
}

// =========================
// 🚀 INIT
// =========================

window.onload = () => {
    handleRoute();

    const token = getToken();
    if (token) {
        loadProfile();
    }
};