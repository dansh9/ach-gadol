/**
 * Language detection using Unicode script ranges.
 * Fast, no external deps, works for the 7 languages we support.
 */

const SCRIPT_RANGES: [RegExp, string][] = [
  [/[\u0590-\u05FF]/, "he"], // Hebrew
  [/[\u0600-\u06FF]/, "ar"], // Arabic
  [/[\u0400-\u04FF]/, "ru"], // Cyrillic → Russian
  [/[\u1200-\u137F]/, "am"], // Ethiopic → Amharic
  // Latin-based: disambiguate by common words
];

const LATIN_MARKERS: [RegExp, string][] = [
  [/\b(the|is|are|what|how|my|your|can|do|i)\b/i, "en"],
  [/\b(le|la|les|des|est|sont|je|tu|il|nous|vous)\b/i, "fr"],
  [/\b(el|la|los|las|es|son|yo|tu|nosotros|ustedes)\b/i, "es"],
];

/**
 * Detect the most likely language from a text string.
 * Returns one of: "he", "en", "ru", "am", "fr", "es", "ar"
 * Defaults to "he" if uncertain.
 */
export function detectLanguage(text: string): string {
  // Check non-Latin scripts first (fast, accurate)
  for (const [regex, lang] of SCRIPT_RANGES) {
    if (regex.test(text)) {
      return lang;
    }
  }

  // For Latin scripts, use word markers
  for (const [regex, lang] of LATIN_MARKERS) {
    if (regex.test(text)) {
      return lang;
    }
  }

  // Default to Hebrew (primary audience)
  return "he";
}
