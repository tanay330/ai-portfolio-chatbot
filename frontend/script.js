// ==============================
// Configuration
// ==============================

const API_BASE_URL = "http://127.0.0.1:8000";

// ==============================
// Common elements
// ==============================

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const themeToggle = document.getElementById("theme-toggle");

const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");

const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");

// ==============================
// Sidebar
// ==============================

sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
});

// ==============================
// Theme
// ==============================

themeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark", themeToggle.checked);
});

// ==============================
// Navigation
// ==============================

navItems.forEach((item) => {
    item.addEventListener("click", () => {
        const viewName = item.dataset.view;

        navItems.forEach((nav) => nav.classList.remove("active"));
        item.classList.add("active");

        views.forEach((view) => view.classList.remove("active"));
        document.getElementById(`${viewName}-view`).classList.add("active");

        if (viewName === "chat") {
            pageTitle.textContent = "AI Portfolio Assistant";
            pageSubtitle.textContent =
                "Ask questions about Tanay's professional profile.";
        } else {
            pageTitle.textContent = "Job Description Matcher";
            pageSubtitle.textContent =
                "Compare a job description with Tanay's candidate profile.";
        }
    });
});

// ==============================
// CHAT
// ==============================

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const newChatButton = document.getElementById("new-chat-button");

async function getChatResponse(message) {
    const loadingMessage = document.createElement("div");
    loadingMessage.classList.add("message", "ai-message");
    loadingMessage.textContent = "Tanay's AI assistant is typing...";
    chatBox.appendChild(loadingMessage);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        if (!response.ok) {
            throw new Error(`Chat API error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder(); 
        let answer = "";
        while (true) {
        const { value, done } = await reader.read();

        if (done) {
        break;
    }

        const chunk = decoder.decode(value, { stream: true });

        answer += chunk;
        loadingMessage.textContent = answer;
        chatBox.scrollTop = chatBox.scrollHeight;
}

    } catch (error) {
        loadingMessage.remove();
        appendMessage(
            "ai",
            "Sorry, I couldn't connect to the AI assistant right now."
        );
        console.error(error);
    }
}

function sendMessage() {
    const message = userInput.value.trim();

    if (!message) {
        return;
    }

    appendMessage("user", message);
    userInput.value = "";
    getChatResponse(message);
}

function appendMessage(sender, message) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    if (sender === "user") {
        messageElement.classList.add("user-message");
    } else {
        messageElement.classList.add("ai-message");
    }

    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

sendButton.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

document.querySelectorAll(".suggestion").forEach((button) => {
    button.addEventListener("click", () => {
        userInput.value = button.textContent;
        sendMessage();
    });
});

newChatButton.addEventListener("click", () => {
    chatBox.innerHTML = `
        <div class="welcome">
            <div class="welcome-icon">✦</div>
            <h2>Hi! I'm Tanay's AI portfolio assistant.</h2>
            <p>Ask me about Tanay's experience, skills, projects, education, or background.</p>
            <div class="suggestions">
                <button class="suggestion">Does Tanay have Python experience?</button>
                <button class="suggestion">Which project demonstrates his backend skills?</button>
                <button class="suggestion">What technologies has he worked with?</button>
            </div>
        </div>
    `;

    document.querySelectorAll(".suggestion").forEach((button) => {
        button.addEventListener("click", () => {
            userInput.value = button.textContent;
            sendMessage();
        });
    });
});

// ==============================
// JD MATCHER
// ==============================

const jdFileInput = document.getElementById("jd-file");
const dropZone = document.getElementById("drop-zone");
const fileLabel = document.getElementById("file-label");
const matchButton = document.getElementById("match-button");
const uploadStatus = document.getElementById("upload-status");
const resultCard = document.getElementById("result-card");

let selectedFile = null;

jdFileInput.addEventListener("change", () => {
    handleFileSelection(jdFileInput.files[0]);
});

function handleFileSelection(file) {
    if (!file) {
        return;
    }

    const extension = file.name.split(".").pop().toLowerCase();

    if (!["pdf", "docx"].includes(extension)) {
        selectedFile = null;
        matchButton.disabled = true;
        fileLabel.textContent = "Choose a PDF or DOCX";
        uploadStatus.textContent = "Only PDF and DOCX files are supported.";
        return;
    }

    selectedFile = file;
    fileLabel.textContent = file.name;
    uploadStatus.textContent = "File selected. Ready to analyze.";
    matchButton.disabled = false;
}

["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.add("dragging");
    });
});

["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.remove("dragging");
    });
});

dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files[0];
    handleFileSelection(file);
});

matchButton.addEventListener("click", matchJD);

async function matchJD() {
    if (!selectedFile) {
        return;
    }

    matchButton.disabled = true;
    matchButton.textContent = "Analyzing...";
    uploadStatus.textContent = "Uploading JD and generating match analysis...";

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
        const response = await fetch(`${API_BASE_URL}/match-jd`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`JD API error: ${response.status}`);
        }

        const result = await response.json();

        renderMatchResult(result);

        uploadStatus.textContent = "Analysis completed.";

    } catch (error) {
        uploadStatus.textContent =
            "Something went wrong while analyzing the JD.";
        console.error(error);
    } finally {
        matchButton.disabled = false;
        matchButton.textContent = "Analyze JD";
    }
}

function renderMatchResult(result) {
    const matchedSkills = result.matched_skills || [];
    const missingSkills = result.missing_skills || [];

    resultCard.innerHTML = `
        <div class="result-header">
            <div class="score">${result.match_percentage}%</div>
            <div>
                <h2>JD Match Analysis</h2>
                <p class="result-text">Comparison based on the candidate profile.</p>
            </div>
        </div>

        <div class="result-section">
            <h3>Matched Requirements</h3>
            <div class="tags">
                ${
                    matchedSkills.length
                        ? matchedSkills
                              .map(
                                  (skill) =>
                                      `<span class="tag match">${escapeHtml(skill)}</span>`
                              )
                              .join("")
                        : `<span class="result-text">No matched requirements found.</span>`
                }
            </div>
        </div>

        <div class="result-section">
            <h3>Missing / Unsupported Requirements</h3>
            <div class="tags">
                ${
                    missingSkills.length
                        ? missingSkills
                              .map(
                                  (skill) =>
                                      `<span class="tag missing">${escapeHtml(skill)}</span>`
                              )
                              .join("")
                        : `<span class="result-text">No missing requirements identified.</span>`
                }
            </div>
        </div>

        <div class="result-section">
            <h3>Relevant Experience</h3>
            <p class="result-text">${escapeHtml(
                result.relevant_experience || "Not available."
            )}</p>
        </div>

        <div class="result-section">
            <h3>Relevant Projects</h3>
            <p class="result-text">${escapeHtml(
                result.relevant_projects || "Not available."
            )}</p>
        </div>

        <div class="result-section">
            <h3>Explanation</h3>
            <p class="result-text">${escapeHtml(
                result.explanation || "No explanation provided."
            )}</p>
        </div>
    `;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
