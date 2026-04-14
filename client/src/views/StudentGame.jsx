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

    // Record the moment this client received the question.
    // Add whatever time had already elapsed on the server (elapsedMs) so late
    // receivers or reconnecting students see the correct remaining time.
    // Using local timestamps avoids server/client clock-drift bugs.
    const clientReceivedAt = Date.now();
    const serverElapsedMs = question.elapsedMs ?? 0;

    const tick = () => {
      const totalElapsed = serverElapsedMs + (Date.now() - clientReceivedAt);
      setTimeLeft(Math.max(0, Math.floor(question.timer - totalElapsed / 1000)));
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
  const isTF = question.type === "tf";
  const urgentThreshold = isTF ? 3 : 5;
  const isUrgent = timeLeft <= urgentThreshold;

  return (
    <div className="flex flex-col min-h-screen px-4 py-6">
      {/* Timer */}
      <div className="glass rounded-2xl px-4 py-3 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/70 font-semibold">
            {isTF && <span className="text-orange-300 mr-1">⚡</span>}
            Frage {question.index + 1} / {question.total}
          </span>
          <span className={`font-black text-lg ${isUrgent ? "text-red-300" : "text-white"} ${isTF && isUrgent ? "animate-streak-fire" : ""}`}>
            {timeLeft}s
          </span>
        </div>
        <div className={`${isTF ? "h-4" : "h-3"} bg-white/20 rounded-full overflow-hidden`}>
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isUrgent ? "bg-red-400" : isTF ? "bg-orange-400" : "bg-emerald-400"
            } ${isTF && isUrgent ? "animate-pulse" : ""}`}
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
        isTF ? (
          /* Wahr/Falsch – 2 große Buttons */
          <div className="grid grid-cols-2 gap-4 flex-1">
            <button
              onClick={() => answer(0)}
              disabled={timeLeft === 0}
              className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 border-emerald-700 text-white font-black text-3xl rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[200px] transition-all active:scale-95 shadow-xl border-b-4 disabled:opacity-50"
            >
              <span className="text-5xl">✓</span>
              <span>Wahr</span>
            </button>
            <button
              onClick={() => answer(1)}
              disabled={timeLeft === 0}
              className="bg-rose-500 hover:bg-rose-400 active:bg-rose-600 border-rose-700 text-white font-black text-3xl rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[200px] transition-all active:scale-95 shadow-xl border-b-4 disabled:opacity-50"
            >
              <span className="text-5xl">✗</span>
              <span>Falsch</span>
            </button>
          </div>
        ) : (
          /* Multiple Choice – 2x2 Grid */
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
        )
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
              {answerResult.correct && answerResult.streak >= 2 && (
                <div className="mt-3 animate-streak-fire">
                  <span className={`text-3xl font-black drop-shadow-lg ${
                    answerResult.streak >= 5 ? "text-red-300" : "text-orange-300"
                  }`}>
                    {answerResult.streak >= 5 ? "\u{1F525}\u{1F525}" : "\u{1F525}"} {answerResult.streak}er Streak!
                  </span>
                </div>
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
