/**
 * Vocabulary Trainer Module
 * Encapsulated logic for all vocabulary practice pages.
 */
class VocabTrainer {
    constructor(dataFileOrSet) {
        this.DATA_SET = null;
        this.currentFrench = null;
        this.currentItem = null;
        this.currentFormLabel = "";
        this.total = 0;
        this.correct = 0;
        this.allowHotkeysInAnswer = false;
        this.currentExpectedForms = [];
        this.currentFormKey = null;

        // Sequence / History state
        this.history = []; // Array of specific item states { item, formKey, french, labels... }
        this.historyIndex = -1;
        this.seqIndex = -1;
        this.currentValidItems = [];

        // Constants
        this.LS_PREF_LANG_KEY = "ft_prefLang";
        this.FORM_LABELS_RU = { ms: "м.р., ед.ч.", fs: "ж.р., ед.ч.", mp: "м.р., мн.ч.", fp: "ж.р., мн.ч." };
        this.FORM_LABELS_EN = { ms: "m. sg.", fs: "f. sg.", mp: "m. pl.", fp: "f. pl." };

        // DOM elements
        this.settingsDetailsEl = el("settings");
        this.prefLangEl = el("prefLang");
        this.modeEl = el("mode");
        this.strictEl = el("strict");
        this.slowSpeakEl = el("slowSpeak");
        this.studyEl = el("study");
        this.randomEl = el("random");
        this.pronounceEl = el("pronounce");
        this.revealBtnEl = el("revealBtn");
        this.prevBtnEl = el("prevBtn");

        this.checkBtnEl = el("checkBtn");
        this.setTitleFrEl = el("setTitleFr");
        this.ruleCardEl = el("ruleCard");
        this.ruleBodyEl = el("ruleBody");
        this.ruleSummaryTitleEl = el("ruleSummaryTitle");
        this.answerEl = el("answer");
        this.feedbackEl = el("feedback");
        this.extraEl = el("extra");
        this.bigPromptEl = el("bigPrompt");
        this.smallPromptEl = el("smallPrompt");
        this.scorePillEl = el("scorePill");
        this.progressPillEl = el("progressPill");
        this.wordsSeenSet = new Set();
        this.formsBoxEl = el("formsBox");
        this.formsHintEl = el("formsHint");
        
        this.genderEls = { m: el("gender_m"), f: el("gender_f") };
        this.qtyEls = { s: el("qty_s"), p: el("qty_p") };

        // Bind methods for event listeners
        this._boundSetCard = this.setCard.bind(this);

        this.init(dataFileOrSet);
    }

    async init(dataFileOrSet) {
        this.setupEventListeners();
        this.loadPreferredLanguage();

        if (typeof dataFileOrSet === 'string') {
           this.DATA_SET = await loadJsonSet(dataFileOrSet);
        } else {
           this.DATA_SET = dataFileOrSet;
        }

        if (!this.DATA_SET) {
            if (this.bigPromptEl) this.bigPromptEl.textContent = "Failed to load data";
            return;
        }

        this.updateLanguageUI();
        this.applyFormsUI();
        this.updateSetTitle();
        this.renderRuleCard();
        this.updateRevealButtonState();
        this.setCard();
        this.updateScore();

        // Pre-load speech voices
        if (window.speechSynthesis) window.speechSynthesis.getVoices();
    }

    updateDataSet(set) {
        this.DATA_SET = set;
        this.wordsSeenSet.clear();
        this.applyFormsUI();
        this.updateSetTitle();
        this.renderRuleCard();
        this.setCard();
    }

    setupEventListeners() {
        if (!this.revealBtnEl) return; // Prevent errors if elements don't exist
        
        this.revealBtnEl.addEventListener("click", () => this.reveal());
        if(this.prevBtnEl) this.prevBtnEl.addEventListener("click", () => this.goPrevious());

        this.checkBtnEl?.addEventListener("click", () => this.handleCheckBtn());
        el("speakBtn")?.addEventListener("click", () => this.speak());
        el("resetScoreBtn")?.addEventListener("click", () => this.resetScore());

        this.modeEl?.addEventListener("change", () => this.setCard());

        this.randomEl?.addEventListener("change", () => {
             this.saveRandomPreference();
             this.seqIndex = -1; // Reset sequential counter
             this.setCard();
        });

        this.studyEl?.addEventListener("change", () => {
            this.updateRevealButtonState();
            if (this.studyEl.checked) {
                document.body.classList.add("study-mode");
                if (!this.currentItem) this.setCard();
                this.feedbackEl.textContent = "";
                this.feedbackEl.className = "feedback";
                this.reveal();
            } else {
                document.body.classList.remove("study-mode");
            }
        });

        this.prefLangEl?.addEventListener("change", () => {
            this.savePreferredLanguage();
            this.updateLanguageUI();
            this.updateSetTitle();
            this.renderRuleCard();
            this.setCard();
        });

        const filterCbs = [...Object.values(this.genderEls), ...Object.values(this.qtyEls)];
        for (const cb of filterCbs) {
            if(cb) {
                cb.addEventListener("change", () => {
                    this.wordsSeenSet.clear();
                    this.answerEl.value = "";
                    this.feedbackEl.textContent = "";
                    this.extraEl.textContent = "";
                    this.setCard();
                });
            }
        }

        this.answerEl?.addEventListener("keydown", (e) => {
            if (e.key === "Enter") { e.preventDefault(); this.handleCheckBtn(); }
        });

        // Make sure we only attach global listener once. Since this class might be instantiated multiple times if changing pages, we need to be careful. But usually it's one per page.
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            const active = document.activeElement;
            const isEditable = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable);

            if (isEditable) {
                const isAnswerInput = active === this.answerEl;
                if (!(isAnswerInput && this.allowHotkeysInAnswer)) return;
            }

            switch (e.key.toLowerCase()) {
                case "n": e.preventDefault(); this.setCard(); break;
                case "p": e.preventDefault(); this.goPrevious(); break;
                case "r": e.preventDefault(); this.reveal(); break;
                case "s": e.preventDefault(); this.speak(); break;
                case "x": e.preventDefault(); this.resetScore(); break;
            }
        });
    }

    updateLanguageUI() {
        if (!this.prefLangEl || !this.modeEl) return;
        const lang = this.prefLangEl.value || "en";
        const langLabel = LANG_LABELS[lang] || lang;
        const optA = this.modeEl.querySelector('option[value="promptA_to_answerB"]');
        const optB = this.modeEl.querySelector('option[value="promptB_to_answerA"]');
        if (optA) optA.textContent = `${langLabel} → Français`;
        if (optB) optB.textContent = `Français → ${langLabel}`;
    }

    shouldAutoReveal() { return !!this.studyEl?.checked; }
    shouldAutoPronounce() { return !!this.pronounceEl?.checked; }

    updateRevealButtonState() {
        if (!this.revealBtnEl) return;
        const isStudy = !!this.studyEl?.checked;
        this.revealBtnEl.disabled = isStudy;
        this.revealBtnEl.classList.toggle("disabled", isStudy);
    }

    norm(s) {
        const strict = this.strictEl?.value === "yes";
        return strict ? window.normaliseStrict(s) : window.normaliseLoose(s);
    }

    getEnabledForms() {
        const gendersChecked = Object.entries(this.genderEls).filter(([, cb]) => cb && !cb.disabled && cb.checked).map(([k]) => k);
        const qtyChecked = Object.entries(this.qtyEls).filter(([, cb]) => cb && !cb.disabled && cb.checked).map(([k]) => k);
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

    applyFormsUI() {
        if (!this.formsBoxEl) return;
        const supports = !!this.DATA_SET?.supportsForms;
        this.formsBoxEl.style.display = "";
        this.formsBoxEl.style.opacity = supports ? "1" : "0.5";

        for (const cb of Object.values(this.genderEls)) if (cb) cb.disabled = !supports;
        for (const cb of Object.values(this.qtyEls)) if (cb) cb.disabled = !supports;

        if (supports) {
            for (const cb of Object.values(this.genderEls)) if (cb) cb.checked = false;
            for (const cb of Object.values(this.qtyEls)) if (cb) cb.checked = false;
            if (this.qtyEls.s) this.qtyEls.s.checked = true;
            this.formsHintEl.textContent = "Select Gender and/or Quantity. If nothing is selected, it practises all forms.";
        } else {
            this.formsHintEl.textContent = "";
        }
    }

    updateSetTitle() {
        if(this.setTitleFrEl) this.setTitleFrEl.textContent = this.DATA_SET?.nameFr || this.DATA_SET?.name || "";
    }

    getMeaning(item, formKeyOverride) {
        const lang = this.prefLangEl?.value || "en";
        const form = formKeyOverride || this.currentFormKey || "ms";

        if (item && (item.eng || item.ru)) {
            if (lang === "ru" && item.ru) return item.ru[form] ?? item.ru.ms ?? item.ru.fs ?? "";
            if (lang === "en" && item.eng) return item.eng[form] ?? item.eng.ms ?? item.eng.fs ?? "";
            if (item.eng) return item.eng[form] ?? item.eng.ms ?? item.eng.fs ?? "";
            if (item.ru) return item.ru[form] ?? item.ru.ms ?? item.ru.fs ?? "";
        }

        if (lang === "ru" && item.a_ru) return item.a_ru;
        if (item.a) return item.a;
        return "";
    }

    getPreferredLangLabel() {
        const lang = this.prefLangEl?.value || "en";
        return LANG_LABELS[lang] || "English";
    }

    getFormLabel(formKey) {
        const lang = this.prefLangEl?.value || "en";
        const labels = (lang === "ru") ? this.FORM_LABELS_RU : this.FORM_LABELS_EN;
        return labels?.[formKey] || "";
    }

    setCard(navigateOpts = {}) {
        if (!this.DATA_SET || !this.DATA_SET.items || !this.DATA_SET.items.length) return;

        const enabledForms = this.getEnabledForms();
        const validItems = this.DATA_SET.items.filter(item => {
            if (!item.forms) return true;
            return enabledForms.some(f => item.forms[f]);
        });

        if (validItems.length === 0) {
            if(this.bigPromptEl) this.bigPromptEl.textContent = "No items match selected filters";
            if(this.smallPromptEl) this.smallPromptEl.textContent = "";
            return;
        }

        this.currentValidItems = validItems; // keep for progress tracking

        // --- History Navigation ---
        if (navigateOpts.goBack) {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.applyStateFromHistory(this.history[this.historyIndex]);
            }
            return;
        }

        // Moving forward: if we were mid-history, truncate the future
        if (this.historyIndex < this.history.length - 1 && this.historyIndex >= 0) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        const isRandom = !!this.randomEl?.checked;
        
        if (isRandom) {
            this.currentItem = pick(validItems);
        } else {
            this.seqIndex = (this.seqIndex + 1) % validItems.length;
            this.currentItem = validItems[this.seqIndex];
        }

        this.currentFormLabel = "";
        this.currentExpectedForms = [];

        if (this.DATA_SET.supportsForms && this.currentItem.forms) {
            const itemForms = enabledForms.filter(f => this.currentItem.forms[f]);
            const chosenForm = pick(itemForms);
            this.currentFormKey = chosenForm;
            const formValue = this.currentItem.forms[chosenForm];
            this.currentExpectedForms = Array.isArray(formValue) ? formValue : [formValue];
            this.currentFrench = pick(this.currentExpectedForms);
            this.currentFormLabel = this.getFormLabel(chosenForm);
        } else {
            this.currentFormKey = null;
            this.currentFrench = this.currentItem.b ?? this.currentItem.fr ?? "";
            this.currentExpectedForms = [this.currentFrench];
        }

        // Push new state to history
        this.history.push({
            item: this.currentItem,
            formKey: this.currentFormKey,
            french: this.currentFrench,
            expectedForms: [...this.currentExpectedForms],
            formLabel: this.currentFormLabel
        });
        this.historyIndex = this.history.length - 1;

        this.renderCard();
    }

    applyStateFromHistory(state) {
        this.currentItem = state.item;
        this.currentFormKey = state.formKey;
        this.currentFrench = state.french;
        this.currentExpectedForms = [...state.expectedForms];
        this.currentFormLabel = state.formLabel;
        this.renderCard();
    }

    renderCard() {
        const mode = this.modeEl?.value;
        const isStudy = !!this.studyEl?.checked;
        const extraHint = this.currentFormLabel ? ` (${this.currentFormLabel})` : "";
        const meaningWithHint = this.getMeaning(this.currentItem, this.currentFormKey) + extraHint;

        if (isStudy) {
            if (mode === "promptA_to_answerB") {
                this.bigPromptEl.innerHTML = formatHints(meaningWithHint);
                this.smallPromptEl.innerHTML = formatHints(this.currentFrench);
            } else {
                this.bigPromptEl.innerHTML = formatHints(this.currentFrench);
                this.smallPromptEl.innerHTML = formatHints(meaningWithHint);
            }
            this.answerEl.placeholder = "Study mode…";
        } else if (mode === "promptA_to_answerB") {
            this.bigPromptEl.innerHTML = formatHints(meaningWithHint);
            this.smallPromptEl.textContent = "";
            this.answerEl.placeholder = "Type the French…";
        } else {
            this.bigPromptEl.textContent = "";
            this.smallPromptEl.innerHTML = formatHints(this.currentFrench);
            this.answerEl.placeholder = `Type in ${this.getPreferredLangLabel()}…`;
        }

        this.answerEl.value = "";
        this.allowHotkeysInAnswer = false;
        if (this.checkBtnEl) {
            this.checkBtnEl.textContent = "Check";
            this.checkBtnEl.title = "press (enter) to check";
        }
        this.isChecked = false;
        this.answerEl.focus();

        // Reset feedback on new card
        if (this.feedbackEl) { this.feedbackEl.textContent = ""; this.feedbackEl.className = "feedback"; }
        if (this.extraEl) this.extraEl.innerHTML = "";

        this.updateProgress();

        if (this.shouldAutoReveal()) this.reveal();
        if (this.shouldAutoPronounce()) this.speak();
    }

    next() {
        this.setCard();
    }

    goPrevious() {
        this.setCard({ goBack: true });
    }

    updateScore() {
        if(this.scorePillEl) this.scorePillEl.textContent = `Score: ${this.correct}/${this.total}`;
    }

    updateProgress() {
        if (!this.progressPillEl) return;
        const total = this.currentValidItems?.length ?? this.DATA_SET?.items?.length ?? 0;
        const done = Math.min(this.wordsSeenSet.size, total);
        this.progressPillEl.textContent = `Words: ${done}/${total}`;
    }

    reveal() {
        if (!this.currentItem) return;

        const key = this.currentFrench || JSON.stringify(this.currentItem);
        this.wordsSeenSet.add(key);
        this.updateProgress();

        const isStudy = !!this.studyEl?.checked;
        const mode = this.modeEl?.value;
        const extraHint = this.currentFormLabel ? ` (${this.currentFormLabel})` : "";
        const meaningWithHint = this.getMeaning(this.currentItem, this.currentFormKey) + extraHint;

        if (isStudy) {
            if (mode === "promptA_to_answerB") {
                this.bigPromptEl.innerHTML = formatHints(meaningWithHint);
                this.smallPromptEl.innerHTML = formatHints(this.currentFrench);
            } else {
                this.bigPromptEl.innerHTML = formatHints(this.currentFrench);
                this.smallPromptEl.innerHTML = formatHints(meaningWithHint);
            }
            this.extraEl.innerHTML = "";
            return;
        }

        this.bigPromptEl.innerHTML = formatHints(meaningWithHint);

        if (mode === "promptA_to_answerB") {
            this.smallPromptEl.innerHTML = formatHints(this.currentFrench);
            const expected = this.currentExpectedForms.map(f => escapeHtml(f)).join(" / ");
            this.extraEl.innerHTML = `Expected: <span class="expected">${expected}</span> <br>[${escapeHtml(meaningWithHint)}]`;
        } else {
            const expected = escapeHtml(this.getMeaning(this.currentItem, this.currentFormKey));
            this.extraEl.innerHTML = `Expected: <span class="expected">${expected}</span> <br>[${escapeHtml(this.currentFrench + extraHint)}]`;
        }
    }

    handleCheckBtn() {
        if (this.isChecked) {
            this.next();
        } else {
            this.check();
        }
    }

    check() {
        if(window.foldSettings && this.settingsDetailsEl) foldSettings(this.settingsDetailsEl);
        if (!this.currentItem) return;

        const mode = this.modeEl?.value;
        const user = this.norm(this.answerEl.value);

        const ok = (mode === "promptA_to_answerB")
            ? this.currentExpectedForms.map(f => this.norm(f)).includes(user)
            : this.norm(this.getMeaning(this.currentItem)) === user;

        this.total += 1;
        if (ok) this.correct += 1;

        this.updateScore();

        if (this.shouldAutoReveal()) {
            this.setCard();
            return;
        }

        this.feedbackEl.textContent = ok ? "✓" : "✖";
        this.feedbackEl.className = "feedback " + (ok ? "ok" : "bad");
        this.reveal();
        this.allowHotkeysInAnswer = true;
        if (this.checkBtnEl) {
            this.checkBtnEl.textContent = "Next";
            this.checkBtnEl.title = "press (enter) for new card";
        }
        this.isChecked = true;
    }

    resetScore() {
        this.total = 0; this.correct = 0;
        this.updateScore();
        if(this.feedbackEl) {
            this.feedbackEl.textContent = "Score cleared.";
            this.feedbackEl.className = "feedback muted";
        }
    }

    speak() {
        if (!this.currentFrench) return;
        const slow = !!this.slowSpeakEl?.checked;
        if(window.speakFrench) speakFrench(this.currentFrench, slow);
    }

    loadPreferredLanguage() {
        const saved = localStorage.getItem(this.LS_PREF_LANG_KEY);
        if (saved && this.prefLangEl) this.prefLangEl.value = saved;
        
        const randomSaved = localStorage.getItem("ft_random");
        if (randomSaved !== null && this.randomEl) {
            this.randomEl.checked = randomSaved === "true";
        }
    }

    savePreferredLanguage() {
        if(this.prefLangEl) localStorage.setItem(this.LS_PREF_LANG_KEY, this.prefLangEl.value || "en");
    }

    saveRandomPreference() {
        if(this.randomEl) localStorage.setItem("ft_random", String(this.randomEl.checked));
    }

    fmtExampleValue(v) { return Array.isArray(v) ? v.join(" / ") : (v ?? ""); }

    fmtExample(ex) {
        const lang = this.prefLangEl?.value || "en";
        const labels = (lang === "ru") ? this.FORM_LABELS_RU : this.FORM_LABELS_EN;
        let html = '<div class="rule-grid">';
        if (ex.ms) html += `<div><b>${labels.ms}</b></div><div class="rule-code">${this.fmtExampleValue(ex.ms)}</div>`;
        if (ex.fs) html += `<div><b>${labels.fs}</b></div><div class="rule-code">${this.fmtExampleValue(ex.fs)}</div>`;
        if (ex.mp) html += `<div><b>${labels.mp}</b></div><div class="rule-code">${this.fmtExampleValue(ex.mp)}</div>`;
        if (ex.fp) html += `<div><b>${labels.fp}</b></div><div class="rule-code">${this.fmtExampleValue(ex.fp)}</div>`;
        html += '</div>';
        return html;
    }

    renderRuleCard() {
        const rule = this.DATA_SET?.rule;
        if (!rule) {
            if(this.ruleCardEl) this.ruleCardEl.style.display = "none";
            if(this.ruleBodyEl) this.ruleBodyEl.innerHTML = "";
            return;
        }

        if(this.ruleCardEl) this.ruleCardEl.style.display = "";
        const lang = this.prefLangEl?.value || "en";

        if(this.ruleSummaryTitleEl) this.ruleSummaryTitleEl.textContent = rule.source_fr;

        const summary = (lang === "ru" && rule.summary_ru) ? rule.summary_ru : (lang === "en" && rule.summary_eng) ? rule.summary_eng : rule.summary_fr || rule.summary_eng || rule.summary_ru || "";
        const patternLabel = (lang === "ru") ? "Шаблон" : "Pattern";
        const exampleLabel = (lang === "ru") ? "Примеры" : "Examples";

        const patternsHtml = (rule.patterns || []).map((p) => {
            const badge = p.type ? `<span class="rule-badge">${p.type}</span>` : "";
            const grammar = (lang === "ru" && p.grammar_ru) ? p.grammar_ru : (lang === "en" && p.grammar_eng) ? p.grammar_eng : (p.grammar_eng || p.grammar_ru || "");
            const examples = (p.examples || []).map(e => this.fmtExample(e)).join("");
            return `<div class="rule-section"><li><b>${patternLabel}:</b><span class="expected">${badge}</span></li><div class="rule-subtitle">${grammar}</div>${examples ? `<div class="tiny"><b>${exampleLabel}</b>${examples}</div>` : ""}</div>`;
        }).join("");

        if(this.ruleBodyEl) this.ruleBodyEl.innerHTML = `<div class="tiny">${summary}</div><ol>${patternsHtml}</ol>`;
    }
}
