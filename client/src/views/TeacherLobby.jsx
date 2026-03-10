import socket from "../socket";

export default function TeacherLobby({ gameState, goHome }) {
  const { pin, players } = gameState;

  const startGame = () => {
    socket.emit("start_game", { pin });
  };

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black drop-shadow">Warteraum</h1>
          <button onClick={goHome} className="text-white/60 hover:text-white text-sm font-semibold">
            Beenden
          </button>
        </div>

        {/* PIN groß */}
        <div className="glass rounded-3xl p-8 text-center mb-6 shadow-2xl">
          <p className="text-white/70 text-lg mb-2 font-semibold">Schüler treten bei mit PIN:</p>
          <div className="text-8xl font-black tracking-[0.15em] text-yellow-300 drop-shadow-lg select-all my-2">
            {pin}
          </div>
          <p className="text-white/50 text-sm mt-3">
            Öffne diese Seite und wähle „Schüler"
          </p>
        </div>

        {/* Spielerliste */}
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="text-lg font-black mb-4">
            Schüler <span className="text-yellow-300">({players.length})</span>
          </h2>
          {players.length === 0 ? (
            <div className="text-center py-6 text-white/50">
              <div className="text-4xl mb-2">⏳</div>
              <p>Warte auf Schüler…</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {players.map((p, i) => (
                <div
                  key={i}
                  className="glass-light rounded-xl px-3 py-2 text-center font-bold text-sm"
                >
                  {p.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={startGame}
          disabled={players.length === 0}
          className="w-full bg-emerald-400 hover:bg-emerald-300 disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed text-white font-black text-2xl py-6 rounded-2xl transition-all active:scale-95 shadow-xl border-b-4 border-emerald-600 disabled:border-transparent"
        >
          {players.length === 0 ? "Warte auf Schüler…" : "🚀 Spiel starten"}
        </button>
      </div>
    </div>
  );
}
