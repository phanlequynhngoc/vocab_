export type Rating = 1 | 2 | 3 | 4;

export type ReviewCard = {
  id: string;
  word: string;
  meaning: string;
  example: string | null;
  phonetic: string | null;
  part_of_speech: string | null;
  note: string | null;

  word_language: string | null;

  state: string;
  difficulty: number;
  stability: number;
  last_review: string | null;
  next_review: string | null;
  review_count: number;
  lapse_count: number;
};

const DAY_MS = 86_400_000;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function previousIntervalDays(card: ReviewCard) {
  if (!card.last_review || !card.next_review) return 0;
  return Math.max(0, (new Date(card.next_review).getTime() - new Date(card.last_review).getTime()) / DAY_MS);
}

export function schedule(card: ReviewCard, rating: Rating, now = new Date()) {
  const previous = previousIntervalDays(card);
  const firstReview = card.review_count === 0;
  let intervalDays: number;
  let difficulty = Number(card.difficulty || 5);
  let stability = Number(card.stability || 0);

  if (rating === 1) {
    intervalDays = 10 / 1440; // 10 minutes
    difficulty = clamp(difficulty + 0.8, 1, 10);
    stability = Math.max(0.1, stability * 0.5);
  } else if (rating === 2) {
    intervalDays = firstReview ? 1 : Math.max(1, previous * 1.2, stability * 1.2);
    difficulty = clamp(difficulty + 0.25, 1, 10);
    stability = intervalDays;
  } else if (rating === 3) {
    intervalDays = firstReview ? 3 : Math.max(2, previous * 2.2, stability * 2.2);
    difficulty = clamp(difficulty - 0.2, 1, 10);
    stability = intervalDays;
  } else {
    intervalDays = firstReview ? 7 : Math.max(4, previous * 3.5, stability * 3.5);
    difficulty = clamp(difficulty - 0.5, 1, 10);
    stability = intervalDays;
  }

  const next = new Date(now.getTime() + intervalDays * DAY_MS);
  const state = rating === 1 ? "learning" : card.review_count >= 1 ? "review" : "learning";

  return {
    previousInterval: previous,
    newInterval: intervalDays,
    nextReview: next.toISOString(),
    difficulty: Number(difficulty.toFixed(3)),
    stability: Number(stability.toFixed(3)),
    state,
  };
}

export function formatInterval(days: number) {
  const minutes = Math.round(days * 1440);
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.round(days * 24);
  if (hours < 24) return `${hours}h`;
  if (days < 30) return `${Math.round(days)}d`;
  return `${Math.round(days / 30)}mo`;
}
