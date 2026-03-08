window.DATA_SET = {
  "_comment": "TEMPLATE - Copy and customize this file for new vocabulary sets",

  "id": "template",
  "name": "Template Name (English)",
  "name_ru": "Название шаблона (Russian)",
  "nameFr": "Nom du modèle (French - shown as title)",

  "_supportsForms_comment": "Set to true if items have gender/number forms (like adjectives, nouns with articles)",
  "supportsForms": true,

  "_rule_comment": "Optional - grammar rule card shown at bottom of page",
  "rule": {
    "source_fr": "Rule Title in French",
    "summary_fr": "Brief rule summary in French",
    "summary_eng": "Brief rule summary in English",
    "summary_ru": "Краткое описание правила на русском",

    "patterns": [
      {
        "type": "pattern_name",
        "grammar_eng": "English grammar explanation",
        "grammar_ru": "Объяснение грамматики на русском",
        "examples": [
          { "ms": "example_ms", "fs": "example_fs", "mp": "example_mp", "fp": "example_fp" }
        ]
      }
    ]
  },

  "items": [
    {
      "_comment": "FORMAT A: Simple vocabulary (supportsForms: false)",
      "a": "English word",
      "a_ru": "Русское слово",
      "b": "French word"
    },
    {
      "_comment": "FORMAT B: With forms (supportsForms: true) - for adjectives",
      "fr": "base_french_word",
      "eng": { "ms": "English", "fs": "English", "mp": "English", "fp": "English" },
      "ru": { "ms": "м.р. ед.ч.", "fs": "ж.р. ед.ч.", "mp": "м.р. мн.ч.", "fp": "ж.р. мн.ч." },
      "forms": { "ms": "masc_sing", "fs": "fem_sing", "mp": "masc_plur", "fp": "fem_plur" }
    },
    {
      "_comment": "FORMAT C: Nouns with fixed gender - only provide applicable forms",
      "fr": "masculine_noun",
      "eng": { "ms": "singular", "mp": "plural" },
      "ru": { "ms": "ед.ч.", "mp": "мн.ч." },
      "forms": { "ms": "un noun", "mp": "des nouns" }
    },
    {
      "_comment": "FORMAT D: Multiple accepted answers (array)",
      "fr": "word_with_variants",
      "eng": { "ms": "meaning" },
      "ru": { "ms": "значение" },
      "forms": { "ms": ["variant1", "variant2"] }
    }
  ]
}
;
