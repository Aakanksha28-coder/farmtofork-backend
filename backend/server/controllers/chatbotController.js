// ─── Language Detection ───────────────────────────────────────────────────────
const hindiKeywords   = ['kaise', 'kya', 'mujhe', 'bechna', 'bhav', 'karo', 'hai', 'mera', 'order', 'namaste', 'kab', 'kahan', 'chahiye'];
const marathiKeywords = ['kasa', 'vikaycha', 'aahe', 'ka', 'mala', 'tumi', 'bagh', 'vapraycha', 'nahi', 'aho', 'kiti', 'namaskar'];

const detectLanguage = (msg) => {
  const lower = msg.toLowerCase();
  const marathiScore = marathiKeywords.filter(k => lower.includes(k)).length;
  const hindiScore   = hindiKeywords.filter(k => lower.includes(k)).length;
  if (marathiScore > hindiScore) return 'mr';
  if (hindiScore > 0)            return 'hi';
  return 'en';
};

// ─── Intents ──────────────────────────────────────────────────────────────────
const intents = [
  {
    name: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'namaste', 'namaskar', 'hii'],
    responses: {
      en: "Hey! 👋 I'm FarmBot. How can I help you?",
      hi: "नमस्ते! 👋 मैं FarmBot हूँ। मैं आपकी कैसे मदद कर सकता हूँ?",
      mr: "नमस्कार! 👋 मी FarmBot आहे. मी कशी मदत करू शकतो?"
    }
  },
  {
    name: 'market_price',
    keywords: ['price', 'market price', 'bhav', 'rate', 'daam', 'kimat', 'किंमत', 'भाव'],
    responses: {
      en: "Market prices change daily. You can check the Market section for latest prices 🌾",
      hi: "बाज़ार भाव रोज बदलते हैं। कृपया मार्केट सेक्शन देखें 🌾",
      mr: "बाजारभाव दररोज बदलतो. कृपया मार्केट सेक्शन तपासा 🌾"
    }
  },
  {
    name: 'sell_product',
    keywords: ['sell', 'list product', 'bechna', 'vikaycha', 'add product', 'upload', 'listing'],
    responses: {
      en: "To sell a product: Go to Dashboard → Add Product → Fill details → Submit ✅",
      hi: "प्रोडक्ट बेचने के लिए: Dashboard → Add Product → जानकारी भरें → Submit करें ✅",
      mr: "प्रोडक्ट विकण्यासाठी: Dashboard → Add Product → माहिती भरा → Submit करा ✅"
    }
  },
  {
    name: 'order_tracking',
    keywords: ['track', 'order', 'status', 'where is', 'delivery', 'shipped', 'dispatch'],
    responses: {
      en: "You can track your order in 'My Orders' section 📦",
      hi: "आप अपना ऑर्डर 'My Orders' सेक्शन में ट्रैक कर सकते हैं 📦",
      mr: "तुम्ही तुमचा ऑर्डर 'My Orders' मध्ये ट्रॅक करू शकता 📦"
    }
  },
  {
    name: 'availability',
    keywords: ['available', 'have', 'hai kya', 'aahe ka', 'stock', 'in stock', 'milel'],
    responses: {
      en: "Please check the Products page to see available items 🛒",
      hi: "उपलब्ध प्रोडक्ट देखने के लिए Products पेज देखें 🛒",
      mr: "उपलब्ध प्रोडक्ट पाहण्यासाठी Products पेज तपासा 🛒"
    }
  },
  {
    name: 'price_suggestion',
    keywords: ['₹', 'rs', 'rupee', 'tomato', 'onion', 'potato', 'sabzi', 'vegetable'],
    hasNumber: true,
    responses: {
      en: "That price seems reasonable 👍 but check market trends for better accuracy.",
      hi: "यह कीमत ठीक लगती है 👍 लेकिन बाजार भाव जरूर देखें।",
      mr: "ही किंमत योग्य आहे 👍 पण बाजारभाव तपासा."
    }
  },
  {
    name: 'help',
    keywords: ['help', 'kaise use kare', 'kasa vapraycha', 'what can you do', 'support', 'guide'],
    responses: {
      en: "I can help with selling, buying, pricing, and orders 😊",
      hi: "मैं बेचने, खरीदने और ऑर्डर में मदद कर सकता हूँ 😊",
      mr: "मी विक्री, खरेदी आणि ऑर्डरमध्ये मदत करू शकतो 😊"
    }
  }
];

const fallback = {
  en: "Sorry, I didn't understand. Try asking about prices, selling, or orders 😊",
  hi: "माफ़ कीजिए, मैं समझ नहीं पाया। कृपया अलग तरीके से पूछें 😊",
  mr: "माफ करा, मला समजले नाही. कृपया पुन्हा विचारा 😊"
};

// ─── Core matching logic ──────────────────────────────────────────────────────
const getBotResponse = (message) => {
  const lower = message.toLowerCase().trim();
  const lang  = detectLanguage(lower);
  const hasNum = /\d/.test(lower);

  for (const intent of intents) {
    const keywordMatch = intent.keywords.some(k => lower.includes(k));
    // price_suggestion requires a number in the message
    if (intent.hasNumber && (!hasNum || !keywordMatch)) continue;
    if (keywordMatch) return intent.responses[lang];
  }

  return fallback[lang];
};

// ─── Route handler ────────────────────────────────────────────────────────────
exports.chat = (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ reply: fallback.en });
  }
  const reply = getBotResponse(message);
  res.json({ reply });
};
