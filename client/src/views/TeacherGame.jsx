import { useEffect, useState } from "react";
import socket from "../socket";

const COLORS = [
  "bg-rose-500 border-rose-300",
  "bg-sky-500 border-sky-300",
  "bg-amber-400 border-amber-200",
  "bg-emerald-500 border-emerald-300",
];
const LABELS = ["A", "B", "C", "D"];

export default function TeacherGame({ gameState, goHome }) {
  const { pin, question, answeredCount } = gameState;
  const [timeLeft, setTimeLeft] = useState(question?.timer || 20);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    if (!question) return;
    setTimeLeft(question.timer);
    setTimerKey((k) => k + 1);
  }, [question]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, timerKey]);

  if (!question) return null;

  const progress = (timeLeft / question.timer) * 100;

  return (
    <div className="min-h-screen flex flex-col px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="glass px-3 py-1 rounded-full text-sm font-bold">
          PIN: <strong className="text-yellow-300">{pin}</strong>
        </span>
        <span className="text-white/70 font-semibold text-sm">
          Frage {question.index + 1} / {question.total}
        </span>
        <button onClick={goHome} className="text-white/50 hover:text-white text-sm font-semibold">
          Beenden
        </button>
      </div>

      {/* Timer */}
      <div className="glass rounded-2xl px-4 py-3 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/70 font-semibold">Zeit</span>
          <span className={`font-black text-xl ${timeLeft <= 5 ? "text-red-300" : "text-white"}`}>
            {timeLeft}s
          </span>
        </div>
        <div className="h-4 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              timeLeft <= 5 ? "bg-red-400" : timeLeft <= 10 ? "bg-amber-400" : "bg-emerald-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Frage */}
      <div className="glass rounded-2xl p-6 mb-5 text-center shadow-lg">
        <p className="text-3xl font-black leading-tight drop-shadow">{question.text}</p>
      </div>

      {/* Antworten */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {question.answers.map((ans, i) => (
          <div
            key={i}
            className={`${COLORS[i]} border-2 rounded-2xl p-5 flex items-center gap-3 shadow-lg`}
          >
            <span className="text-2xl font-black w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center shrink-0">
              {LABELS[i]}
            </span>
            <span className="text-xl font-bold leading-tight">{ans}</span>
          </div>
        ))}
      </div>

      {/* Live-Statistik */}
      <div className="glass rounded-2xl p-4 text-center">
        <p className="text-white/60 text-sm mb-1 font-semibold">Antworten eingegangen</p>
        <p className="text-5xl font-black">
          {answeredCount.answered}
          <span className="text-white/40 text-3xl"> / {answeredCount.total}</span>
        </p>
      </div>
    </div>
  );
}
