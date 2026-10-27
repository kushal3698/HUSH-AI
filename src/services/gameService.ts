import { MiniGameData } from '../types';

export interface WouldYouRatherPrompt {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  category: 'funny' | 'tech' | 'deep' | 'relatable';
}

export const WOULD_YOU_RATHER_DECK: WouldYouRatherPrompt[] = [
  {
    id: 'wyr_1',
    question: "Would you rather...",
    optionA: "Never have to write documentation or attend standups again",
    optionB: "Have unlimited cloud computing budget forever",
    category: 'tech'
  },
  {
    id: 'wyr_2',
    question: "Would you rather...",
    optionA: "Accidentally send an embarrassing meme to your college group",
    optionB: "Accidentally like your crush's 5-year-old post at 3 AM",
    category: 'funny'
  },
  {
    id: 'wyr_3',
    question: "Would you rather...",
    optionA: "Know the exact date and year humanity discovers alien life",
    optionB: "Know the winning lottery numbers for next month",
    category: 'deep'
  },
  {
    id: 'wyr_4',
    question: "Would you rather...",
    optionA: "Work 4 days a week with 10-hour shifts",
    optionB: "Work 5 days a week with 6-hour shifts",
    category: 'relatable'
  },
  {
    id: 'wyr_5',
    question: "Would you rather...",
    optionA: "Be fluent in every human language on Earth",
    optionB: "Be able to communicate fluently with animals",
    category: 'deep'
  },
  {
    id: 'wyr_6',
    question: "Would you rather...",
    optionA: "Only be able to code using Notepad with zero syntax highlighting",
    optionB: "Have to explain recursion to your grandparents once every week",
    category: 'tech'
  },
  {
    id: 'wyr_7',
    question: "Would you rather...",
    optionA: "Have free unlimited food delivery for life",
    optionB: "Have free unlimited domestic flights for life",
    category: 'relatable'
  },
  {
    id: 'wyr_8',
    question: "Would you rather...",
    optionA: "Have a photographic memory for everything you read",
    optionB: "Be able to forget any movie or game so you can experience it fresh",
    category: 'deep'
  },
  {
    id: 'wyr_9',
    question: "Would you rather...",
    optionA: "Accidentally reply-all with an angry rant",
    optionB: "Have your webcam accidentally turn on in a 200-person webinar while in pajamas",
    category: 'funny'
  },
  {
    id: 'wyr_10',
    question: "Would you rather...",
    optionA: "Work on a bleeding-edge AI startup with crazy hours",
    optionB: "Have a chill government/corporate job with great work-life balance",
    category: 'tech'
  }
];

export const TWO_TRUTHS_PRESETS = [
  {
    statements: [
      "I have accidentally stayed awake coding until 6 AM",
      "I have never broken production code on a Friday",
      "I drink more than 3 cups of coffee/tea every single day"
    ],
    lieIndex: 1
  },
  {
    statements: [
      "I binge-watched an entire 10-episode season in one sitting",
      "I have run a marathon or 10K race before",
      "I have over 100 unread browser tabs open right now"
    ],
    lieIndex: 1
  },
  {
    statements: [
      "I learned to cook during lockdown and made bread from scratch",
      "I have won a local video game tournament",
      "I have never listened to K-pop in my life"
    ],
    lieIndex: 2
  }
];

export const gameService = {
  getRandomWouldYouRather(): MiniGameData {
    const prompt = WOULD_YOU_RATHER_DECK[Math.floor(Math.random() * WOULD_YOU_RATHER_DECK.length)];
    return {
      id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'would_you_rather',
      question: prompt.question,
      optionA: prompt.optionA,
      optionB: prompt.optionB,
      votes: {},
      status: 'active',
      initiatorAlias: 'You'
    };
  },

  getRandomTwoTruths(): MiniGameData {
    const preset = TWO_TRUTHS_PRESETS[Math.floor(Math.random() * TWO_TRUTHS_PRESETS.length)];
    return {
      id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'two_truths_lie',
      question: "Guess which one is the LIE! 🕵️‍♂️",
      statements: preset.statements,
      lieIndex: preset.lieIndex,
      votes: {},
      status: 'active',
      initiatorAlias: 'You'
    };
  }
};
