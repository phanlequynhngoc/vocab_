"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  formatInterval,
  schedule,
  type Rating,
  type ReviewCard,
} from "@/lib/srs";

const labels: Record<Rating, string> = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
};

function getSpeechLanguage(card: ReviewCard) {
  if (card.word_language) {
    return card.word_language;
  }

  // Fallback nếu vocabulary cũ chưa có word_language
  if (/[\u4e00-\u9fff]/.test(card.word)) {
    return "zh-CN";
  }

  if (/[\u3040-\u30ff]/.test(card.word)) {
    return "ja-JP";
  }

  if (/[\uac00-\ud7af]/.test(card.word)) {
    return "ko-KR";
  }

  return "en-US";
}

export function ReviewClient({ cards }: { cards: ReviewCard[] }) {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(0);

  const supabase = useMemo(() => createClient(), []);

  const card = cards[index];

  const previews = useMemo(() => {
    if (!card) return null;

    return ([1, 2, 3, 4] as Rating[]).reduce(
      (acc, rating) => {
        acc[rating] = formatInterval(
          schedule(card, rating).newInterval
        );

        return acc;
      },
      {} as Record<Rating, string>
    );
  }, [card]);

  /*
   * Phát âm từ vựng
   */
  function speakWord() {
    if (!card) return;

    if (!("speechSynthesis" in window)) {
      setError("Trình duyệt này không hỗ trợ phát âm.");
      return;
    }

    window.speechSynthesis.cancel();

    const language = getSpeechLanguage(card);

    const utterance = new SpeechSynthesisUtterance(card.word);

    utterance.lang = language;

    // Tốc độ hơi chậm để dễ nghe khi học
    utterance.rate = 0.85;
    utterance.pitch = 1;

    /*
     * Tìm voice phù hợp với ngôn ngữ.
     * Nếu không tìm thấy thì trình duyệt sẽ dùng
     * voice mặc định của hệ thống.
     */
    const voices = window.speechSynthesis.getVoices();

    const exactVoice = voices.find(
      (voice) =>
        voice.lang.toLowerCase() === language.toLowerCase()
    );

    const languageVoice = voices.find(
      (voice) =>
        voice.lang
          .toLowerCase()
          .startsWith(language.split("-")[0].toLowerCase())
    );

    if (exactVoice) {
      utterance.voice = exactVoice;
    } else if (languageVoice) {
      utterance.voice = languageVoice;
    }

    utterance.onstart = () => {
      setSpeaking(true);
      setError("");
    };

    utterance.onend = () => {
      setSpeaking(false);
    };

    utterance.onerror = () => {
      setSpeaking(false);
      setError("Không thể phát âm từ này trên thiết bị hiện tại.");
    };

    window.speechSynthesis.speak(utterance);
  }

  /*
   * Khi chuyển sang flashcard mới,
   * dừng âm thanh của flashcard trước.
   */
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, [card?.id]);

  /*
   * Khi rời khỏi trang ôn,
   * dừng speech synthesis.
   */
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  async function rate(rating: Rating) {
    if (!card || busy) return;

    setBusy(true);
    setError("");

    window.speechSynthesis?.cancel();
    setSpeaking(false);

    const result = schedule(card, rating);

    const { error: rpcError } = await supabase.rpc(
      "review_vocabulary",
      {
        p_vocabulary_id: card.id,
        p_rating: rating,
        p_next_review: result.nextReview,
        p_state: result.state,
        p_difficulty: result.difficulty,
        p_stability: result.stability,
        p_previous_interval: result.previousInterval,
        p_new_interval: result.newInterval,
      }
    );

    if (rpcError) {
      setError(rpcError.message);
      setBusy(false);
      return;
    }

    setDone((v) => v + 1);
    setIndex((v) => v + 1);
    setShowAnswer(false);
    setBusy(false);
  }

  /*
   * Hết flashcard
   */
  if (!card) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 text-center">
        <div className="text-5xl">✅</div>

        <h1 className="mt-4 text-2xl font-bold">
          Hoàn thành phiên ôn
        </h1>

        <p className="mt-2 text-zinc-500">
          Bạn đã xử lý {done} flashcards.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-3 font-semibold text-white"
        >
          Về Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">

      {/* Progress */}
      <div className="mb-3 flex items-center justify-between text-sm text-zinc-500">
        <span>
          {index + 1} / {cards.length}
        </span>

        <span>
          {done} reviewed
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full bg-indigo-600 transition-all"
          style={{
            width: `${(index / cards.length) * 100}%`,
          }}
        />
      </div>

      {/* Flashcard */}
      <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-10">

        <div className="min-h-52 grid place-items-center text-center">

          <div>

            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Recall
            </p>

            {/* Word + pronunciation button */}
            <div className="mt-4 flex items-center justify-center gap-3">

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {card.word}
              </h1>

              <button
                type="button"
                onClick={speakWord}
                disabled={speaking}
                aria-label="Nghe phát âm"
                title="Nghe phát âm"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-2xl transition hover:bg-zinc-100 disabled:opacity-60"
              >
                {speaking ? "🔊" : "🔈"}
              </button>

            </div>

            {/* Phonetic */}
            {card.phonetic && (
              <p className="mt-3 text-lg text-zinc-500">
                {card.phonetic}
              </p>
            )}

            {/* Language */}
            {card.word_language && (
              <p className="mt-1 text-xs text-zinc-400">
                {card.word_language}
              </p>
            )}

            {/* Part of speech */}
            {card.part_of_speech && (
              <p className="mt-1 text-sm text-zinc-400">
                {card.part_of_speech}
              </p>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

          </div>

        </div>

        {/* Show answer */}
        {!showAnswer ? (
          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="mt-6 w-full rounded-xl bg-zinc-900 px-5 py-4 font-bold text-white hover:bg-zinc-800"
          >
            SHOW ANSWER
          </button>
        ) : (
          <div className="mt-6 border-t border-zinc-200 pt-6">

            {/* Meaning */}
            <div className="rounded-2xl bg-zinc-50 p-5">

              <p className="text-xl font-bold">
                {card.meaning}
              </p>

              {card.example && (
                <p className="mt-3 italic text-zinc-600">
                  “{card.example}”
                </p>
              )}

              {card.note && (
                <p className="mt-3 text-sm text-zinc-500">
                  Note: {card.note}
                </p>
              )}

            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Rating */}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">

              {([1, 2, 3, 4] as Rating[]).map(
                (rating) => (

                  <button
                    key={rating}
                    type="button"
                    onClick={() => rate(rating)}
                    disabled={busy}
                    className={`rounded-xl border px-3 py-3 font-semibold disabled:opacity-50 ${
                      rating === 1
                        ? "border-red-200 bg-red-50 text-red-700"
                        : rating === 2
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : rating === 3
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-blue-200 bg-blue-50 text-blue-700"
                    }`}
                  >

                    <span className="block">
                      {labels[rating]}
                    </span>

                    <span className="mt-1 block text-xs font-normal opacity-75">
                      {previews?.[rating]}
                    </span>

                  </button>

                )
              )}

            </div>

          </div>
        )}

      </section>

    </div>
  );
}