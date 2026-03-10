import { useState } from "react";
import socket from "../socket";

export default function StudentJoin({ setView }) {
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const join = () => {
    if (!pin.trim() || !name.trim()) {
      setError("Bitte PIN und Name eingeben.");
      return;
    }
    setLoading(true);
    setError("");
    socket.emit("join_game", { pin: pin.trim(), name: name.trim() });

    socket.once("join_error", ({ message }) => {
      setError(message);
      setLoading(false);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") join();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black drop-shadow">Spiel beitreten</h1>
          <button onClick={() => setView("home")} className="text-white/60 hover:text-white text-sm font-semibold">
            ← Zurück
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-white/70 text-sm mb-1 block font-semibold">Spiel-PIN</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="123456"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={6}
              className="glass-input w-full text-4xl font-black text-center rounded-2xl px-4 py-5 tracking-widest"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm mb-1 block font-semibold">Dein Spitzname</label>
            <input
              type="text"
              placeholder="Spitzname eingeben…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={20}
              className="glass-input w-full text-2xl text-center rounded-2xl px-4 py-4"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/80 backdrop-blur border border-red-300 text-white px-4 py-3 rounded-xl mb-4 text-center font-semibold">
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={join}
          disabled={loading}
          className="w-full bg-orange-400 hover:bg-orange-300 disabled:bg-white/20 disabled:text-white/40 text-white font-black text-2xl py-5 rounded-2xl transition-all active:scale-95 shadow-xl border-b-4 border-orange-600 disabled:border-transparent"
        >
          {loading ? "Verbinde…" : "🎮 Beitreten"}
        </button>
      </div>
    </div>
  );
}
