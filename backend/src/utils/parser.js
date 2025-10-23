const CATEGORY_KEYWORDS = {
  Food: ['food', 'lunch', 'dinner', 'breakfast', 'restaurant', 'cafe', 'meal'],
  Transport: ['uber', 'taxi', 'bus', 'train', 'gas', 'fuel', 'transport', 'uber'],
  Shopping: ['shopping', 'store', 'market', 'mercado', 'supermercado', 'mall', 'clothes', 'shoes'],
  Bills: ['bill', 'electricity', 'water', 'internet', 'rent', 'subscription'],
  Entertainment: ['movie', 'cinema', 'netflix', 'spotify', 'concert', 'game'],
};

function guessCategory(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (
      keywords.some(keyword => {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(^|[^a-zà-ú])${escaped}([^a-zà-ú]|$)`, 'i');
        return regex.test(lower);
      })
    ) {
      return category;
    }
  }
  return 'Other';
}

function parseAmount(text) {
  const match = text.match(/(-?\d+[\.,]?\d*)/);
  if (!match) return null;
  const normalized = match[1].replace(',', '.');
  return parseFloat(normalized);
}

function extractDescription(text) {
  const cleaned = text.replace(/spent|gastei|paguei|pay/i, '').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function parseWhatsAppMessage(message) {
  const amount = parseAmount(message);
  const category = guessCategory(message);
  const description = extractDescription(message);
  return {
    amount,
    category,
    description,
  };
}

module.exports = {
  parseWhatsAppMessage,
};
