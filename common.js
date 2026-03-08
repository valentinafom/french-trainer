// Common utility functions for French Trainer

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

// DOM helper
const el = (id) => document.getElementById(id);

// Text normalization
function stripDiacritics(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normaliseLoose(s) {
  return stripDiacritics(
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/['']/g, "'")
      .replace(/[\s\-_.!,;:()]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function normaliseStrict(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/['']/g, "'");
}

// Random picker (handles empty arrays safely)
function pick(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// HTML escaping
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Format text in parentheses as hints
function formatHints(text) {
  if (!text) return "";
  // First escape HTML to be safe, then wrap parenthesized content
  return escapeHtml(String(text)).replace(/\(([^)]+)\)/g, '<span class="hint">($1)</span>');
}

// Settings collapse
function foldSettings(settingsDetailsEl) {
  if (settingsDetailsEl?.open) {
    settingsDetailsEl.open = false;
  }
}

// Speech synthesis
let cachedFrenchVoice = null;

function getFrenchVoice() {
  if (cachedFrenchVoice) return cachedFrenchVoice;

  const synth = window.speechSynthesis;
  const voices = synth.getVoices?.() || [];

  cachedFrenchVoice =
    voices.find(v => (v.lang || "").toLowerCase() === "fr-fr") ||
    voices.find(v => (v.lang || "").toLowerCase().startsWith("fr")) ||
    null;

  return cachedFrenchVoice;
}

// Initialize speech synthesis voice cache
if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedFrenchVoice = null;
    getFrenchVoice();
  };
}

function speakFrench(text, slowMode = false) {
  const t = String(text || "").trim();
  if (!t) return;

  if (!("speechSynthesis" in window)) return;

  const textToSpeak = t.replace(/-/g, " ");

  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(textToSpeak);
  const frVoice = getFrenchVoice();

  if (frVoice) u.voice = frVoice;
  u.lang = frVoice?.lang || "fr-FR";

  u.rate = slowMode ? 0.50 : 0.90;
  u.pitch = slowMode ? 0.95 : 1.0;

  window.speechSynthesis.speak(u);
}

// Load voices on page load
if (typeof window !== "undefined") {
  window.speechSynthesis?.getVoices?.();
}

// LocalStorage helpers
function loadFromStorage(key, defaultValue = null) {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return saved;
    }
  }
  return defaultValue;
}

function saveToStorage(key, value) {
  if (typeof value === "object") {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.setItem(key, String(value));
  }
}

// JSON data loading with error handling
async function loadJsonSet(path) {
  return new Promise((resolve, reject) => {
    // If we're loading a top level json file, change to .js
    path = path.replace('.json', '.js');
    const script = document.createElement("script");
    script.src = path;
    script.onload = () => {
      resolve(DATA_SET);
    };
    script.onerror = () => {
      console.error(`Failed to load ${path}`);
      resolve(null); 
    };
    document.head.appendChild(script);
  });
}

// Language labels
const LANG_LABELS = {
  en: "English",
  ru: "Русский",
};

// Navigation configuration - add new pages here
// labelShort: used in navbar dropdown
// labelFull: used on index.html buttons
const NAV_PAGES = [
  { id: "french-numbers", href: "french-numbers.html", labelShort: "Numbers", labelFull: "French numbers" },
  { id: "vocab", href: "vocab.html", labelShort: "Vocab", labelFull: "Thematic vocabulary" },
  { id: "verbs", href: "verbs.html", labelShort: "Verbs", labelFull: "Verbs (Present Tense)" },
  { id: "animals", href: "animals.html", labelShort: "Animals", labelFull: "Animals" }
];

// Build navbar dropdown dynamically
function buildNavbar() {
  const dropdownContent = document.querySelector(".navbar .dropdown-content");
  if (!dropdownContent) return;

  // Get current page to exclude from dropdown
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split("/").pop() || "index.html";

  // Clear existing content
  dropdownContent.innerHTML = "";

  // Add links for all pages except current
  for (const page of NAV_PAGES) {
    if (page.href === currentPage) continue;

    const link = document.createElement("a");
    link.href = page.href;
    link.textContent = page.labelFull;
    dropdownContent.appendChild(link);
  }
}

// Build index page buttons dynamically
function buildIndexButtons() {
  const tabContainer = document.querySelector(".tab");
  if (!tabContainer) return;

  // Clear existing buttons
  tabContainer.innerHTML = "";

  // Add buttons for all pages
  for (const page of NAV_PAGES) {
    const btn = document.createElement("button");
    btn.setAttribute("onclick", `go('./${page.href}')`);
    btn.setAttribute("data-page", page.id);
    btn.textContent = page.labelFull;
    tabContainer.appendChild(btn);
  }
}

// Auto-build navigation when DOM is ready
function initNavigation() {
  buildNavbar();
  buildIndexButtons();
}

// Handle both cases: DOM already loaded or not yet
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavigation);
} else {
  // DOM already loaded, run immediately
  initNavigation();
}

// Keyboard shortcuts handler
function setupKeyboardShortcuts(handlers, answerEl = null) {
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const active = document.activeElement;
    const isEditable =
      active &&
      (active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.isContentEditable);

    if (isEditable && answerEl) {
      const isAnswerInput = active === answerEl;
      if (!(isAnswerInput && handlers.allowHotkeysInAnswer?.() === true)) return;
    }

    const key = e.key.toLowerCase();

    if (handlers[key]) {
      e.preventDefault();
      handlers[key]();
    }
  });
}
// -----------------------------
// Navigation
// -----------------------------
function go(url) {
  window.location.href = url;
}
window.go = go;

// -----------------------------
// Optional: highlight active tab
// -----------------------------
function highlightActiveTab() {
  const path = location.pathname;
  document.querySelectorAll(".tab button").forEach((btn) => {
    if (btn.dataset.page && path.includes(btn.dataset.page)) {
      btn.classList.add("active");
    }
  });
}
document.addEventListener("DOMContentLoaded", highlightActiveTab);

// -----------------------------
// Google Translate callback (must be global)
// -----------------------------
window.googleTranslateElementInit = function googleTranslateElementInit() {
  if (!window.google?.translate?.TranslateElement) return;

  new google.translate.TranslateElement(
    { pageLanguage: "en" },
    "google_translate_element"
  );
};

// If translate script is blocked, show a helpful message
document.addEventListener("DOMContentLoaded", () => {
  const host = document.getElementById("google_translate_element");
  if (!host) return;

  // If widget doesn't appear within 2s, likely blocked
  setTimeout(() => {
    const widgetLoaded =
      host.querySelector("select") ||
      host.querySelector("iframe") ||
      host.textContent.trim().length > 0;

    if (!widgetLoaded) {
      console.warn("Google Translate widget did not load (blocked or failed).");
      host.innerHTML =
        '<div style="font-size:12px;color:#6D8196;">' +
        'Translate widget not available (may be blocked by an ad/privacy blocker or browser settings).' +
        "</div>";
    }
  }, 2000);
});

// -----------------------------
// Mobile UI: Move topic selector
// -----------------------------
function setupMobileTopicMover() {
    const mobileAnchor = document.getElementById("mobileTopicAnchor");
    const labelEl = document.getElementById("currentTopicLabel");
    if (!mobileAnchor || !labelEl) return;
    
    const dropdown = labelEl.closest(".dropdown");
    const desktopAnchor = document.querySelector(".controls-container");
    
    if (!dropdown || !desktopAnchor) return;

    const moveTopicDropdown = () => {
        const isMobile = window.matchMedia("(max-width: 600px)").matches;
        
        if (isMobile && dropdown.parentElement !== mobileAnchor) {
            mobileAnchor.appendChild(dropdown);
            mobileAnchor.style.display = "block";
            // Set margin so it looks nice inside settings
            dropdown.style.display = "block";
        } else if (!isMobile && dropdown.parentElement !== desktopAnchor) {
            desktopAnchor.insertBefore(dropdown, desktopAnchor.firstChild);
            mobileAnchor.style.display = "none";
            dropdown.style.display = "inline-block";
        }
    };

    window.addEventListener("resize", moveTopicDropdown);
    moveTopicDropdown();
}

document.addEventListener("DOMContentLoaded", setupMobileTopicMover);

// -----------------------------
// Mobile UI: Auto-scroll card to top when keyboard opens
// -----------------------------
function setupMobileAutoScroll() {
    const answerInput = document.getElementById("answer");
    if (!answerInput) return;

    answerInput.addEventListener("focus", () => {
        if (window.matchMedia("(max-width: 600px)").matches) {
            // Delay slightly to allow the virtual keyboard to fully open
            setTimeout(() => {
                const titleEl = document.getElementById("setTitleFr") || answerInput.closest(".card");
                if (titleEl) {
                    titleEl.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, 300);
        }
    });
}

document.addEventListener("DOMContentLoaded", setupMobileAutoScroll);
