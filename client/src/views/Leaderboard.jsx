import socket from "../socket";

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_STYLES = [
  "border-yellow-400 bg-yellow-400/20",
  "border-slate-300 bg-slate-300/20",
  "border-amber-600 bg-amber-600/20",
];

export default function Leaderboard({ gameState, goHome }) {
  const { pin, leaderboard, isLastQuestion, role, currentQuestion, totalQuestions, answerResult } = gameState;

  const nextQuestion = () => {
    socket.emit("next_question", { pin });
  };

  const endGame = () => {
    socket.emit("end_game", { pin });
  };

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8">
      <div className="w-full max-w-lg">
        <h1 className="text-4xl font-black text-center mb-1 drop-shadow">
          {isLastQuestion ? "🏆 Endauswertung" : "📊 Rangliste"}
        </h1>
        {!isLastQuestion && (
          <p className="text-white/60 text-center mb-6 text-sm font-semibold">
            Frage {currentQuestion + 1} von {totalQuestions} abgeschlossen
          </p>
        )}

        {/* Antwort-Feedback für Schüler */}
        {role === "student" && (
          answerResult ? (
            <div className={`glass rounded-2xl px-5 py-4 mb-6 flex items-center gap-4 border-2 ${
              answerResult.correct ? "border-emerald-400" : "border-red-400"
            }`}>
              <span className="text-4xl">{answerResult.correct ? "✅" : "❌"}</span>
              <div>
                <p className="font-black text-lg">
                  {answerResult.correct ? "Richtig!" : "Falsch!"}
                </p>
                {answerResult.correct ? (
                  <p className="text-yellow-300 font-bold">+{answerResult.points} Punkte</p>
                ) : (
                  <p className="text-white/60 font-semibold text-sm">Leider keine Punkte</p>
                )}
              </div>
            </div>
          ) : !isLastQuestion ? (
            <div className="glass rounded-2xl px-5 py-4 mb-6 flex items-center gap-4 border-2 border-white/20">
              <span className="text-4xl">⏱️</span>
              <p className="font-bold text-white/70">Zeit abgelaufen – keine Antwort</p>
            </div>
          ) : null
        )}

        {/* Podest – Top 3 */}
        {isLastQuestion && leaderboard.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-8 mt-4">
            {/* 2. Platz */}
            <div className="flex flex-col items-center">
              <span className="text-4xl">{MEDALS[1]}</span>
              <div className="glass rounded-t-2xl w-24 h-20 flex flex-col items-center justify-center mt-2 border border-slate-300/40">
                <p className="font-bold text-sm text-center px-1 leading-tight">{leaderboard[1]?.name}</p>
                <p className="text-yellow-300 text-xs font-black">{leaderboard[1]?.score}</p>
              </div>
            </div>
            {/* 1. Platz */}
            <div className="flex flex-col items-center">
              <span className="text-5xl animate-bounce">{MEDALS[0]}</span>
              <div className="glass rounded-t-2xl w-28 h-28 flex flex-col items-center justify-center mt-2 border-2 border-yellow-400">
                <p className="font-black text-sm text-center px-1 leading-tight">{leaderboard[0]?.name}</p>
                <p className="text-yellow-300 font-black text-base">{leaderboard[0]?.score}</p>
              </div>
            </div>
            {/* 3. Platz */}
            <div className="flex flex-col items-center">
              <span className="text-4xl">{MEDALS[2]}</span>
              <div className="glass rounded-t-2xl w-24 h-16 flex flex-col items-center justify-center mt-2 border border-amber-600/40">
                <p className="font-bold text-sm text-center px-1 leading-tight">{leaderboard[2]?.name}</p>
                <p className="text-yellow-300 text-xs font-black">{leaderboard[2]?.score}</p>
              </div>
            </div>
          </div>
        )}

        {/* Liste */}
        <div className="space-y-2 mb-8">
          {leaderboard.map((p, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 border glass ${
                i < 3 && isLastQuestion ? RANK_STYLES[i] : "border-white/20"
              }`}
            >
              <span className="text-2xl w-8 text-center font-black">
                {i < 3 && isLastQuestion ? MEDALS[i] : <span className="text-white/50">{p.rank}.</span>}
              </span>
              <span className="flex-1 font-bold text-lg">{p.name}</span>
              <span className="font-black text-yellow-300 text-xl">{p.score}</span>
            </div>
          ))}
        </div>

        {/* Lehrer-Buttons */}
        {role === "teacher" && (
          <div className="flex gap-4">
            {!isLastQuestion && (
              <button
                onClick={nextQuestion}
                className="flex-1 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-white font-black text-xl py-5 rounded-2xl shadow-xl border-b-4 border-emerald-600 transition-all"
              >
                Nächste Frage →
              </button>
            )}
            <button
              onClick={isLastQuestion ? goHome : endGame}
              className={`${isLastQuestion ? "flex-1" : ""} glass hover:bg-white/25 text-white font-bold text-lg py-5 px-6 rounded-2xl transition-all`}
            >
              {isLastQuestion ? "🏠 Zur Startseite" : "Spiel beenden"}
            </button>
          </div>
        )}

        {role === "student" && isLastQuestion && (
          <button
            onClick={goHome}
            className="w-full bg-orange-400 hover:bg-orange-300 active:scale-95 text-white font-black text-lg py-4 rounded-2xl shadow-xl border-b-4 border-orange-600 transition-all"
          >
            🏠 Zur Startseite
          </button>
        )}

        {role === "student" && !isLastQuestion && (
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-white/70 font-semibold">Warte auf den Lehrer…</p>
          </div>
        )}
      </div>
    </div>
  );
}
