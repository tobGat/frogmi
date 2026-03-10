export default function StudentLobby({ gameState, goHome }) {
  const { name } = gameState;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="glass rounded-3xl p-10 shadow-2xl max-w-sm w-full">
        <div className="text-7xl mb-4">🎉</div>
        <h1 className="text-3xl font-black mb-2 drop-shadow">Du bist dabei!</h1>
        <p className="text-2xl text-yellow-300 font-black mb-6">{name}</p>
        <div className="glass-light rounded-2xl px-5 py-4 flex items-center justify-center gap-3">
          <div className="w-3 h-3 bg-emerald-300 rounded-full animate-pulse shrink-0" />
          <span className="text-white/80 font-semibold">Warte auf den Lehrer…</span>
        </div>
      </div>
      <button onClick={goHome} className="mt-8 text-white/40 hover:text-white/70 text-sm font-semibold">
        Verlassen
      </button>
    </div>
  );
}
