import { useEffect, useState } from "react";
import socket from "../socket";

const COLORS = [
  "bg-rose-500 hover:bg-rose-400 active:bg-rose-600 border-rose-700",
  "bg-sky-500 hover:bg-sky-400 active:bg-sky-600 border-sky-700",
  "bg-amber-400 hover:bg-amber-300 active:bg-amber-500 border-amber-600",
  "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 border-emerald-700",
];
const SHAPES = ["■", "●", "▲", "✦"];
const LABELS = ["A", "B", "C", "D"];

export default function StudentGame({ gameState }) {
  const { pin, question, answerResult } = gameState;
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!question) return;
    setSelected(null);

    const tick = () => {
      const elapsed = question.startedAt ? (Date.now() - question.startedAt) / 1000 : 0;
      setTimeLeft(Math.max(0, Math.floor(question.timer - elapsed)));
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [question]);

  const answer = (index) => {
    if (selected !== null) return;
    setSelected(index);
    socket.emit("submit_answer", { pin, answerIndex: index });
  };

  if (!question) return null;

  const progress = (timeLeft / question.timer) * 100;

  return (
    <div className="flex flex-col min-h-screen px-4 py-6">
      {/* Timer */}
      <div className="glass rounded-2xl px-4 py-3 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/70 font-semibold">
            Frage {question.index + 1} / {question.total}
          </span>
          <span className={`font-black text-lg ${timeLeft <= 5 ? "text-red-300" : "text-white"}`}>
            {timeLeft}s
          </span>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              timeLeft <= 5 ? "bg-red-400" : "bg-emerald-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Frage */}
      <div className="glass rounded-2xl p-5 mb-5 text-center shadow-lg">
        <p className="text-2xl font-black leading-tight drop-shadow">{question.text}</p>
      </div>

      {/* Antwort-Buttons */}
      {selected === null ? (
        <div className="grid grid-cols-2 gap-4 flex-1">
          {question.answers.map((ans, i) => (
            <button
              key={i}
              onClick={() => answer(i)}
              disabled={timeLeft === 0}
              className={`${COLORS[i]} text-white font-black text-xl rounded-2xl p-6 flex flex-col items-center justify-center gap-2 min-h-[120px] transition-all active:scale-95 shadow-xl border-b-4 disabled:opacity-50`}
            >
              <span className="text-3xl">{SHAPES[i]}</span>
              <span className="text-sm font-bold text-center leading-tight">{ans}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          {answerResult ? (
            <div className={`glass text-center p-8 rounded-3xl w-full max-w-sm shadow-2xl ${
              answerResult.correct ? "border-emerald-400 border-2" : "border-red-400 border-2"
            }`}>
              <div className="text-7xl mb-4">{answerResult.correct ? "✅" : "❌"}</div>
              <p className="text-3xl font-black mb-3 drop-shadow">
                {answerResult.correct ? "Richtig!" : "Falsch!"}
              </p>
              {answerResult.correct && (
                <p className="text-yellow-300 text-4xl font-black drop-shadow">
                  +{answerResult.points} Punkte
                </p>
              )}
              <p className="text-white/60 mt-3 font-semibold">
                Gesamt: <strong className="text-white">{answerResult.totalScore}</strong>
              </p>
            </div>
          ) : (
            <div className="glass text-center p-8 rounded-3xl w-full max-w-sm shadow-2xl">
              <div className="text-6xl mb-4">⏳</div>
              <p className="text-2xl font-black drop-shadow">Antwort gespeichert!</p>
              <p className="text-white/60 mt-2 font-semibold">Warte auf das Ergebnis…</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
