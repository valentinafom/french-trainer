/**
 * Vocabulary Trainer Module
 * Shared logic for all vocabulary practice pages.
 *
 * Usage:
 *   <script src="common.js"></script>
 *   <script src="vocab-trainer.js"></script>
 *   <script>
 *     initVocabTrainer("data/your-file.json");
 *   </script>
 */

// Form labels for different languages
const FORM_LABELS_RU = {
    ms: "м.р., ед.ч.",
    fs: "ж.р., ед.ч.",
    mp: "м.р., мн.ч.",
    fp: "ж.р., мн.ч."
};

const FORM_LABELS_EN = {
    ms: "m. sg.",
    fs: "f. sg.",
    mp: "m. pl.",
    fp: "f. pl."
};

// DOM Elements
let settingsDetailsEl, prefLangEl, modeEl, strictEl, slowSpeakEl, studyEl, pronounceEl, revealBtnEl;
let setTitleFrEl, ruleCardEl, ruleBodyEl, ruleSummaryTitleEl;
let answerEl, feedbackEl, extraEl, bigPromptEl, smallPromptEl, scorePillEl;
let formsBoxEl, formsHintEl, genderEls, qtyEls;

// State
let DATA_SET = null;
let currentFrench = null;
let currentItem = null;
let currentFormLabel = "";
let total = 0;
let correct = 0;
let allowHotkeysInAnswer = false;
let currentExpectedForms = [];
let currentFormKey = null;

const LS_PREF_LANG_KEY = "ft_prefLang";

/**
 * Initialize the vocabulary trainer
 * @param {string} dataFile - Path to the JSON data file
 */
async function initVocabTrainer(dataFile) {
    // Get DOM elements
    settingsDetailsEl = document.getElementById("settings");
    prefLangEl = el("prefLang");
    modeEl = el("mode");
    strictEl = el("strict");
    slowSpeakEl = el("slowSpeak");
    studyEl = el("study");
    pronounceEl = el("pronounce");
    revealBtnEl = el("revealBtn");
    setTitleFrEl = el("setTitleFr");
    ruleCardEl = el("ruleCard");
    ruleBodyEl = el("ruleBody");
    ruleSummaryTitleEl = el("ruleSummaryTitle");
    answerEl = el("answer");
    feedbackEl = el("feedback");
    extraEl = el("extra");
    bigPromptEl = el("bigPrompt");
    smallPromptEl = el("smallPrompt");
    scorePillEl = el("scorePill");
    formsBoxEl = el("formsBox");
    formsHintEl = el("formsHint");
    genderEls = { m: el("gender_m"), f: el("gender_f") };
    qtyEls = { s: el("qty_s"), p: el("qty_p") };

    // Setup event listeners
    setupEventListeners();

    // Load data and start
    loadPreferredLanguage();
    DATA_SET = await loadJsonSet(dataFile);

    if (!DATA_SET) {
        bigPromptEl.textContent = "Failed to load data";
        return;
    }

    updateLanguageUI();
    applyFormsUI();
    updateSetTitle();
    renderRuleCard();
    updateRevealButtonState();
    setCard();
    updateScore();

    // Pre-load speech voices
    window.speechSynthesis?.getVoices?.();
}

function setupEventListeners() {
    el("revealBtn").addEventListener("click", reveal);
    el("checkBtn").addEventListener("click", check);
    el("speakBtn").addEventListener("click", speak);
    el("resetScoreBtn").addEventListener("click", resetScore);

    modeEl.addEventListener("change", setCard);

    studyEl.addEventListener("change", () => {
        updateRevealButtonState();
        if (studyEl.checked) {
            if (!currentItem) setCard();
            feedbackEl.textContent = "";
            feedbackEl.className = "feedback";
            reveal();
        }
    });

    prefLangEl.addEventListener("change", () => {
        savePreferredLanguage();
        updateLanguageUI();
        updateSetTitle();
        renderRuleCard();
        setCard();
    });

    // Form filter checkboxes
    for (const cb of [
        ...Object.values(genderEls),
        ...Object.values(qtyEls)
    ]) {
        cb.addEventListener("change", () => {
            answerEl.value = "";
            feedbackEl.textContent = "";
            extraEl.textContent = "";
            setCard();
        });
    }

    // Keyboard shortcuts
    answerEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); check(); }
    });

    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const active = document.activeElement;
        const isEditable =
            active &&
            (active.tagName === "INPUT" ||
                active.tagName === "TEXTAREA" ||
                active.isContentEditable);

        if (isEditable) {
            const isAnswerInput = active === answerEl;
            if (!(isAnswerInput && allowHotkeysInAnswer)) return;
        }

        switch (e.key.toLowerCase()) {
            case "n": e.preventDefault(); setCard(); break;
            case "r": e.preventDefault(); reveal(); break;
            case "s": e.preventDefault(); speak(); break;
            case "x": e.preventDefault(); resetScore(); break;
        }
    });
}

function updateLanguageUI() {
    const lang = prefLangEl.value || "en";
    const langLabel = LANG_LABELS[lang] || lang;

    const optA = modeEl.querySelector('option[value="promptA_to_answerB"]');
    const optB = modeEl.querySelector('option[value="promptB_to_answerA"]');

    if (optA) optA.textContent = `${langLabel} → Français`;
    if (optB) optB.textContent = `Français → ${langLabel}`;
}

function shouldAutoReveal() {
    return !!studyEl?.checked;
}

function shouldAutoPronounce() {
    return !!pronounceEl?.checked;
}

function updateRevealButtonState() {
    const isStudy = !!studyEl?.checked;
    revealBtnEl.disabled = isStudy;
    revealBtnEl.classList.toggle("disabled", isStudy);
}

function norm(s) {
    const strict = strictEl.value === "yes";
    return strict ? normaliseStrict(s) : normaliseLoose(s);
}

function getEnabledForms() {
    const gendersChecked = Object.entries(genderEls)
        .filter(([, cb]) => !cb.disabled && cb.checked)
        .map(([k]) => k);

    const qtyChecked = Object.entries(qtyEls)
        .filter(([, cb]) => !cb.disabled && cb.checked)
        .map(([k]) => k);

    const genders = (gendersChecked.length === 0) ? ["m", "f"] : gendersChecked;
    const qtys = (qtyChecked.length === 0) ? ["s", "p"] : qtyChecked;

    const result = [];
    for (const g of genders) {
        for (const q of qtys) {
            if (g === "m" && q === "s") result.push("ms");
            if (g === "f" && q === "s") result.push("fs");
            if (g === "m" && q === "p") result.push("mp");
            if (g === "f" && q === "p") result.push("fp");
        }
    }
    return result;
}

function applyFormsUI() {
    const supports = !!DATA_SET?.supportsForms;

    formsBoxEl.style.display = "";
    formsBoxEl.style.opacity = supports ? "1" : "0.5";

    for (const cb of Object.values(genderEls)) cb.disabled = !supports;
    for (const cb of Object.values(qtyEls)) cb.disabled = !supports;

    if (supports) {
        for (const cb of Object.values(genderEls)) cb.checked = false;
        for (const cb of Object.values(qtyEls)) cb.checked = false;

        formsHintEl.textContent =
            "Select Gender and/or Quantity. If nothing is selected, it practises all forms.";
    } else {
        formsHintEl.textContent = "";
    }
}

function updateSetTitle() {
    setTitleFrEl.textContent = DATA_SET?.nameFr || DATA_SET?.name || "";
}

function getMeaning(item, formKeyOverride) {
    const lang = prefLangEl.value || "en";
    const form = formKeyOverride || currentFormKey || "ms";

    // New schema with eng/ru objects
    if (item && (item.eng || item.ru)) {
        if (lang === "ru" && item.ru) return item.ru[form] ?? item.ru.ms ?? item.ru.fs ?? "";
        if (lang === "en" && item.eng) return item.eng[form] ?? item.eng.ms ?? item.eng.fs ?? "";
        if (item.eng) return item.eng[form] ?? item.eng.ms ?? item.eng.fs ?? "";
        if (item.ru) return item.ru[form] ?? item.ru.ms ?? item.ru.fs ?? "";
    }

    // Old schema with a/a_ru
    if (lang === "ru" && item.a_ru) return item.a_ru;
    if (item.a) return item.a;
    return "";
}

function getPreferredLangLabel() {
    const lang = prefLangEl.value || "en";
    return LANG_LABELS[lang] || "English";
}

function getFormLabel(formKey) {
    const lang = prefLangEl.value || "en";
    const labels = (lang === "ru") ? FORM_LABELS_RU : FORM_LABELS_EN;
    return labels?.[formKey] || "";
}

function setCard() {
    if (!DATA_SET || !DATA_SET.items.length) return;

    // Filter items that have the selected forms
    const enabledForms = getEnabledForms();
    const validItems = DATA_SET.items.filter(item => {
        if (!item.forms) return true;
        return enabledForms.some(f => item.forms[f]);
    });

    if (validItems.length === 0) {
        bigPromptEl.textContent = "No items match selected filters";
        smallPromptEl.textContent = "";
        return;
    }

    currentItem = pick(validItems);
    currentFormLabel = "";
    currentExpectedForms = [];

    if (DATA_SET.supportsForms && currentItem.forms) {
        // Get forms that exist for this item AND are enabled
        const itemForms = enabledForms.filter(f => currentItem.forms[f]);
        const chosenForm = pick(itemForms);
        currentFormKey = chosenForm;

        const formValue = currentItem.forms[chosenForm];
        currentExpectedForms = Array.isArray(formValue) ? formValue : [formValue];
        currentFrench = pick(currentExpectedForms);
        currentFormLabel = getFormLabel(chosenForm);
    } else {
        currentFormKey = null;
        currentFrench = currentItem.b ?? currentItem.fr ?? "";
        currentExpectedForms = [currentFrench];
    }

    const mode = modeEl.value;

    if (mode === "promptA_to_answerB") {
        const hint = currentFormLabel ? ` (${currentFormLabel})` : "";
        bigPromptEl.textContent = getMeaning(currentItem, currentFormKey) + hint;
        smallPromptEl.textContent = "";
        answerEl.placeholder = "Type the French…";
    } else {
        bigPromptEl.textContent = "";
        smallPromptEl.textContent = currentFrench;
        answerEl.placeholder = `Type in ${getPreferredLangLabel()}…`;
    }

    answerEl.value = "";
    allowHotkeysInAnswer = false;
    answerEl.focus();

    if (shouldAutoReveal()) {
        reveal();
    }

    if (shouldAutoPronounce()) {
        speak();
    }
}

function updateScore() {
    scorePillEl.textContent = `Score: ${correct}/${total}`;
}

function reveal() {
    if (!currentItem) return;
    const mode = modeEl.value;

    const hint = currentFormLabel ? ` (${currentFormLabel})` : "";
    bigPromptEl.textContent = getMeaning(currentItem, currentFormKey) + hint;

    if (mode === "promptA_to_answerB") {
        smallPromptEl.textContent = currentFrench;
        extraEl.innerHTML =
            `Expected: <span class="expected">${currentExpectedForms.join(" / ")}</span>` +
            ` [${getMeaning(currentItem, currentFormKey)}${hint}]`;
    } else {
        extraEl.innerHTML =
            `Expected: <span class="expected">${getMeaning(currentItem, currentFormKey)}</span>` +
            ` [${currentFrench}${hint}]`;
    }
}

function check() {
    foldSettings(settingsDetailsEl);
    if (!currentItem) return;

    const mode = modeEl.value;
    const user = norm(answerEl.value);

    const ok = (mode === "promptA_to_answerB")
        ? currentExpectedForms.map(norm).includes(user)
        : norm(getMeaning(currentItem)) === user;

    total += 1;
    if (ok) correct += 1;

    updateScore();

    if (shouldAutoReveal()) {
        setCard();
        return;
    }

    feedbackEl.textContent = ok ? "✓ Correct!" : "✖ Not quite.";
    feedbackEl.className = "feedback " + (ok ? "ok" : "bad");

    reveal();
    allowHotkeysInAnswer = true;

    setCard();
}

function resetScore() {
    total = 0; correct = 0;
    updateScore();
    feedbackEl.textContent = "Score cleared.";
    feedbackEl.className = "feedback muted";
}

function speak() {
    if (!currentFrench) return;
    const slow = !!slowSpeakEl?.checked;
    speakFrench(currentFrench, slow);
}

function loadPreferredLanguage() {
    const saved = localStorage.getItem(LS_PREF_LANG_KEY);
    if (saved) prefLangEl.value = saved;
}

function savePreferredLanguage() {
    localStorage.setItem(LS_PREF_LANG_KEY, prefLangEl.value || "en");
}

// Rule card rendering
function fmtExampleValue(v) {
    if (Array.isArray(v)) return v.join(" / ");
    return v ?? "";
}

function fmtExample(ex) {
    const lang = prefLangEl.value || "en";
    const labels = (lang === "ru") ? FORM_LABELS_RU : FORM_LABELS_EN;

    let html = '<div class="rule-grid">';
    if (ex.ms) html += `<div><b>${labels.ms}</b></div><div class="rule-code">${fmtExampleValue(ex.ms)}</div>`;
    if (ex.fs) html += `<div><b>${labels.fs}</b></div><div class="rule-code">${fmtExampleValue(ex.fs)}</div>`;
    if (ex.mp) html += `<div><b>${labels.mp}</b></div><div class="rule-code">${fmtExampleValue(ex.mp)}</div>`;
    if (ex.fp) html += `<div><b>${labels.fp}</b></div><div class="rule-code">${fmtExampleValue(ex.fp)}</div>`;
    html += '</div>';
    return html;
}

function renderRuleCard() {
    const rule = DATA_SET?.rule;

    if (!rule) {
        ruleCardEl.style.display = "none";
        ruleBodyEl.innerHTML = "";
        return;
    }

    ruleCardEl.style.display = "";
    const lang = prefLangEl.value || "en";

    ruleSummaryTitleEl.textContent = rule.source_fr;

    const summary =
        (lang === "ru" && rule.summary_ru) ? rule.summary_ru :
            (lang === "en" && rule.summary_eng) ? rule.summary_eng :
                rule.summary_fr || rule.summary_eng || rule.summary_ru || "";

    const patternLabel = (lang === "ru") ? "Шаблон" : "Pattern";
    const exampleLabel = (lang === "ru") ? "Примеры" : "Examples";

    const patternsHtml = (rule.patterns || []).map((p) => {
        const badge = p.type ? `<span class="rule-badge">${p.type}</span>` : "";

        const grammar =
            (lang === "ru" && p.grammar_ru) ? p.grammar_ru :
                (lang === "en" && p.grammar_eng) ? p.grammar_eng :
                    (p.grammar_eng || p.grammar_ru || "");

        const examples = (p.examples || []).map(fmtExample).join("");

        return `
            <div class="rule-section">
                <li><b>${patternLabel}:</b><span class="expected">${badge}</span></li>
                <div class="rule-subtitle">${grammar}</div>
                ${examples ? `<div class="tiny"><b>${exampleLabel}</b>${examples}</div>` : ""}
            </div>
        `;
    }).join("");

    ruleBodyEl.innerHTML = `
        <div class="tiny">${summary}</div>
        <ol>${patternsHtml}</ol>
    `;
}
