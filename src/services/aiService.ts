import { MoodId, AiSuggestion, AiToneMode } from '../types';

const TONE_SUGGESTIONS: Record<AiToneMode, string[]> = {
  funny: [
    "What's the most useless talent or party trick you secretly possess?",
    "If you had to be trapped in an elevator with any cartoon character for 24 hours, who would it be?",
    "What is the weirdest internet rabbit hole you fell down recently at 2 AM?",
    "What food crime do you commit that would make Italians or chefs cry?",
    "If animals could talk, which species would be the rudest?",
    "What's an irrational fear you have that makes zero logical sense?"
  ],
  deep: [
    "What is something you used to believe strongly that you completely changed your mind on?",
    "Do you think artificial intelligence will make human relationships more authentic or more alienated?",
    "If you could ask anyone in history a single question and get the absolute truth, who and what?",
    "What is something you're secretly struggling with or overthinking lately?",
    "If today was a chapter title in a book about your life, what would it be named?",
    "What is an experience you've had that you will never forget for the rest of your life?"
  ],
  friendly: [
    "What's one small win or good thing that put a genuine smile on your face today?",
    "What's a comfort movie or song that instantly fixes your mood no matter what?",
    "Are you more of an introverted recharge-at-home person or an extroverted explorer?",
    "What's something you're currently obsessed with outside of work or college?",
    "If you could teleport to any city right now for dinner, where would you go?",
    "What's the best piece of casual advice a friend has ever given you?"
  ],
  intellectual: [
    "What tech or scientific breakthrough in the next 10 years are you most excited or terrified about?",
    "If you had unlimited resources to start a company or research project tomorrow, what problem would you tackle?",
    "Do you think remote work is net positive or net negative for long-term career growth?",
    "What's a book, podcast, or essay that genuinely shifted your mental model of the world?",
    "Is coding with AI making software engineers 10x faster or making junior learning harder?",
    "What is an unpopular opinion you hold about the future of tech, college, or education?"
  ]
};

export const aiService = {
  getSuggestions(topic: MoodId, count = 4): AiSuggestion[] {
    const defaultTone: AiToneMode = topic === 'curious' ? 'deep' : topic === 'bored' ? 'funny' : topic === 'career' ? 'intellectual' : 'friendly';
    return this.getSuggestionsByTone(topic, defaultTone, count);
  },

  getSuggestionsByTone(topic: MoodId, tone: AiToneMode, count = 4): AiSuggestion[] {
    const list = TONE_SUGGESTIONS[tone] || TONE_SUGGESTIONS.friendly;
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map((text, idx) => ({
      id: `ai-suggest-${topic}-${tone}-${idx}-${Date.now()}`,
      topic,
      text,
      tone
    }));
  },

  async generateCustomPrompt(topic: MoodId, apiKey?: string): Promise<string> {
    if (!apiKey) {
      const items = this.getSuggestions(topic, 1);
      return items[0].text;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an AI wingman inside HUSH AI, an anonymous chat app. The selected topic is "${topic}". Generate exactly ONE engaging, intriguing, open-ended question to break the ice with a stranger. Keep it under 25 words. Do not use quotes or introductory fluff.`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 60
            }
          })
        }
      );

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return generatedText?.trim() || TONE_SUGGESTIONS.friendly[0];
    } catch (err) {
      console.warn("Falling back to local AI templates:", err);
      return TONE_SUGGESTIONS.friendly[0];
    }
  },

  async translateMessage(text: string, targetLang = 'English'): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Translate this chat message accurately into ${targetLang}. Return ONLY the translated text, no quotes or notes: "${text}"`
                    }
                  ]
                }
              ]
            })
          }
        );
        const data = await response.json();
        const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (translated) return translated.trim();
      } catch (err) {
        console.warn("Gemini translation error, using standard fallback:", err);
      }
    }

    return `[Translated to ${targetLang}]: ${text}`;
  },

  async queryAssistant(query: string, topic: MoodId = 'general'): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are the private AI Wingman in HUSH AI (an anonymous chat app). Current conversation topic is "${topic}". The user is privately asking: "${query}". Provide a helpful, friendly, concise answer or suggestions (under 60 words). Never pretend to be the stranger.`
                    }
                  ]
                }
              ]
            })
          }
        );
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply.trim();
      } catch (err) {
        console.warn("Gemini assistant query error:", err);
      }
    }

    const qLower = query.toLowerCase();
    if (qLower.includes('how to reply') || qLower.includes('what should i say') || qLower.includes('reply')) {
      return `Try acknowledging their point with curiosity. For example: "That's super interesting! What got you started with that?" or "Haha totally, how long have you been into that?"`;
    }
    if (qLower.includes('icebreaker') || qLower.includes('start') || qLower.includes('ask')) {
      return `Ask an open question related to ${topic}: "What's the most exciting project or idea you've thought about this week?"`;
    }
    return `Here's a suggestion for your ${topic} chat: Keep it light, ask open-ended questions, and share a small relatable experience!`;
  }
};
