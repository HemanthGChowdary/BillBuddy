export function getCurrencySymbol(code) {
  switch (code) {
    case "USD":
      return "$";
    case "CAD":
      return "C$";
    case "INR":
      return "₹";
    case "MXN":
      return "Mex$";
    default:
      return "";
  }
}

export const currencyOptions = [
  { label: "🇺🇸 USD ($)", value: "USD" },
  { label: "🇨🇦 CAD (C$)", value: "CAD" },
  { label: "🇮🇳 INR (₹)", value: "INR" },
  { label: "🇲🇽 MXN (Mex$)", value: "MXN" },
];

export function getFriendsDropdownOptions(friends, you) {
  return [
    { label: you, value: you },
    ...(friends || [])
      .filter((f) => f.name !== you)
      .map((f) => ({ label: f.name, value: f.name })),
  ];
}

// Note validation helper - limits notes to 100 words max
export function validateNoteWordCount(text) {
  if (!text || text.trim() === "") {
    return { isValid: true, wordCount: 0, error: null };
  }
  
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const maxWords = 100;
  
  if (wordCount > maxWords) {
    return {
      isValid: false,
      wordCount,
      error: `Note cannot exceed ${maxWords} words. Current: ${wordCount} words.`
    };
  }
  
  return { isValid: true, wordCount, error: null };
}

// Helper to get word count for display
export function getWordCount(text) {
  if (!text || text.trim() === "") return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
