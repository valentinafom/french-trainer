# French Trainer 🇫🇷

A small, browser-based collection of tools for practising **French numbers and basic vocabulary**.  
Designed for self-study, revision, and pronunciation practice — **no installation required**.

Live version:  
https://valentinafom.github.io/french-trainer/

---

## Features

### French Numbers Trainer
- Practise numbers from **0 up to 2,000,000,000**
- Two modes:
  - Number → French
  - French → Number
- Predefined ranges (e.g. 0–20, 70–100, large numbers)
- Custom min/max range selection
- Uses **1990 rectified French orthography**
- Optional strict spelling (accents & punctuation)
- Built-in speech synthesis with slow pronunciation mode
- Keyboard shortcuts for faster practice

---

### Basic Vocabulary Trainer
- Topics include:
  - Days of the week
  - Months
  - Colours (adjectives)
  - Professions (nouns)
- Practice modes:
  - English → French
  - French → English
- Gender and number filters:
  - Masculine / Feminine
  - Singular / Plural
- Accepts multiple correct forms where applicable  
  (e.g. *orange / oranges*, *auteure / autrice*)
- Optional strict spelling or relaxed mode (ignores accents & punctuation)
- Pronunciation via browser speech synthesis
- Score tracking with reset option

---

## Verbs Trainer (Present Tense)

A browser-based trainer for practising **French verbs in the present tense**, designed to support both **active recall** and **guided study**.

### Features

- Practice modes:
  - **Forms** – conjugate verbs by pronoun (present tense)
  - **English → French** – translate meaning into infinitive
  - **French → English** – translate infinitive into meaning
- Verb group filters:
  - **-ER**, **-IR**, **-RE**, **Irregular**
  - If no group is selected, all verb groups are included
- Optional **verb selector** (practice a specific verb only)
- Built-in **grammar rules card** (shown in Forms mode)
- **Personalised grammar notes per verb**, including:
  - Irregular verb warnings
  - Spelling changes (*manger → mangeons*, *commencer → commençons*, etc.)
  - Elision notes (*je → j’*)
- Pronunciation using browser speech synthesis (with slow mode)
- Strict / relaxed spelling comparison
- Score tracking with reset option

---

### Study Mode

When **Study mode** is enabled:

- Answers are **automatically revealed** when a new card is shown
- The **Reveal** button is disabled (greyed out)
- No correctness feedback (✓ / ✖) is shown
- Designed for **reading, pattern recognition, and memorisation**, not testing

When **Study mode** is disabled:

- Answers must be typed and checked manually
- Feedback is shown after each attempt
- Reveal can be used on demand

---

### Current vs Previous Card Information

The interface intentionally separates information into:

- **Current card**  
  Shows the revealed answer and grammar notes for the *current* verb.

- **Previous card**  
  Shows feedback and information from the *last completed card*.

**Important design choice (expected behaviour):**

- When **Reveal is used** (or Study mode auto-reveals),  
  the *previous card information is cleared*.
- This avoids mixing feedback-driven testing with study-style revealing.
- Previous card information is only preserved when progressing normally  
  via **Check / Next** in testing mode.

This behaviour is intentional and helps keep the learning context clear.

---

## Keyboard Shortcuts

| Key | Action |
|----|-------|
| Enter | Check answer |
| N | Next card |
| R | Reveal answer |
| S | Listen (pronunciation) |
| X | Reset score |

---

## Offline Use

The app can be used **completely offline**.

1. Download project files:   
2. Open `index.html` in any modern browser (desktop or mobile).
3. No installation, build step, or server is required.

Note: Speech synthesis relies on the browser’s built-in voices, so pronunciation quality may vary between browsers and operating systems.

---

## Browser Compatibility

- Works in all modern browsers (Chrome, Firefox, Edge, Safari)
- Speech synthesis support depends on the browser
- Some browsers may:
  - Use different French accents
  - Load voices asynchronously
  - Have reduced voice quality on mobile devices

---

## Purpose

This project was created to:
- Practise French actively (typing, listening, recall)
- Avoid heavy platforms and distractions
- Complement textbooks, courses, and language-learning apps

---

## Licence

No licence restrictions.  
Feel free to use, modify, or share this project.