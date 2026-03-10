import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import socket from "../socket";

const EMPTY_QUESTION = () => ({
  text: "",
  answers: ["", "", "", ""],
  correct: 0,
  timer: 20,
});

export default function TeacherSetup({ setView }) {
  const [questions, setQuestions] = useState([EMPTY_QUESTION()]);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const updateQuestion = (i, field, value) => {
    setQuestions((qs) => {
      const copy = [...qs];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });
  };

  const updateAnswer = (qi, ai, value) => {
    setQuestions((qs) => {
      const copy = [...qs];
      const answers = [...copy[qi].answers];
      answers[ai] = value;
      copy[qi] = { ...copy[qi], answers };
      return copy;
    });
  };

  const addQuestion = () => setQuestions((qs) => [...qs, EMPTY_QUESTION()]);

  const removeQuestion = (i) => {
    if (questions.length === 1) return;
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  };

  const importExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);

        const imported = rows.map((row) => {
          const correctLetter = String(row["Richtig"] || "A").toUpperCase().trim();
          const correctIndex = ["A", "B", "C", "D"].indexOf(correctLetter);
          return {
            text: String(row["Frage"] || ""),
            answers: [
              String(row["Antwort_A"] || ""),
              String(row["Antwort_B"] || ""),
              String(row["Antwort_C"] || ""),
              String(row["Antwort_D"] || ""),
            ],
            correct: correctIndex >= 0 ? correctIndex : 0,
            timer: Number(row["Timer (Sekunden)"] ?? row["Timer"]) || 20,
          };
        });

        if (imported.length === 0) {
          setError("Keine Fragen in der Datei gefunden.");
          return;
        }

        setQuestions(imported);
        setError("");
      } catch {
        setError("Fehler beim Importieren der Excel-Datei.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) importExcel(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) importExcel(file);
  };

  const downloadTemplate = () => {
    const data = [
      ["Frage", "Antwort_A", "Antwort_B", "Antwort_C", "Antwort_D", "Richtig", "Timer (Sekunden)"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [
      { wch: 45 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 8 }, { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fragen");
    XLSX.writeFile(wb, "frogmi-vorlage.xlsx");
  };

  const createGame = () => {
    const valid = questions.every(
      (q) => q.text.trim() && q.answers.every((a) => a.trim())
    );
    if (!valid) {
      setError("Bitte fülle alle Felder aus.");
      return;
    }
    setError("");
    socket.emit("create_game", { questions });

    socket.once("game_created", () => {
      setView("teacher-lobby");
    });
  };

  const COLORS = ["bg-rose-500", "bg-sky-500", "bg-amber-400", "bg-emerald-500"];
  const LABELS = ["A", "B", "C", "D"];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black drop-shadow">Quiz erstellen</h1>
        <button
          onClick={() => setView("home")}
          className="text-white/70 hover:text-white text-sm font-semibold"
        >
          ← Zurück
        </button>
      </div>

      {/* Excel Import */}
      <div
        className="glass rounded-2xl p-6 text-center mb-6 cursor-pointer hover:bg-white/25 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current.click()}
      >
        <p className="text-white/80 mb-3">📂 Excel-Datei hier ablegen oder</p>
        <button className="bg-violet-500 hover:bg-violet-400 text-white px-5 py-2 rounded-xl font-bold shadow">
          Datei auswählen (.xlsx)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-white/50 text-xs mt-3">
          Spalten: Frage | Antwort_A–D | Richtig (A/B/C/D) | Timer (Sekunden)
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
          className="mt-2 text-yellow-300 hover:text-yellow-200 text-sm underline underline-offset-2 font-semibold"
        >
          ⬇ Vorlage herunterladen (frogmi-vorlage.xlsx)
        </button>
      </div>

      {/* Fragen */}
      {questions.map((q, qi) => (
        <div key={qi} className="glass rounded-2xl p-5 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="font-black text-lg">Frage {qi + 1}</span>
            <button
              onClick={() => removeQuestion(qi)}
              className="text-red-300 hover:text-red-200 text-sm font-semibold disabled:opacity-30"
              disabled={questions.length === 1}
            >
              Löschen
            </button>
          </div>

          <input
            type="text"
            placeholder="Fragetext eingeben…"
            value={q.text}
            onChange={(e) => updateQuestion(qi, "text", e.target.value)}
            className="glass-input w-full rounded-xl px-4 py-3 mb-4 text-lg"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {q.answers.map((ans, ai) => (
              <div key={ai} className="flex items-center gap-2">
                <span className={`${COLORS[ai]} text-white font-black w-9 h-9 flex items-center justify-center rounded-xl shrink-0 shadow`}>
                  {LABELS[ai]}
                </span>
                <input
                  type="text"
                  placeholder={`Antwort ${LABELS[ai]}`}
                  value={ans}
                  onChange={(e) => updateAnswer(qi, ai, e.target.value)}
                  className="glass-input flex-1 rounded-xl px-3 py-2"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-5">
            <div>
              <label className="text-white/60 text-sm block mb-1 font-semibold">Richtige Antwort</label>
              <div className="flex gap-2">
                {LABELS.map((l, ai) => (
                  <button
                    key={ai}
                    onClick={() => updateQuestion(qi, "correct", ai)}
                    className={`w-10 h-10 rounded-xl font-black transition-all shadow ${
                      q.correct === ai
                        ? `${COLORS[ai]} text-white scale-110 shadow-lg`
                        : "bg-white/20 text-white/70 hover:bg-white/30"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-white/60 text-sm block mb-1 font-semibold">Timer</label>
              <select
                value={q.timer}
                onChange={(e) => updateQuestion(qi, "timer", Number(e.target.value))}
                className="glass-input rounded-xl px-3 py-2"
              >
                <option value={10}>10 Sek.</option>
                <option value={20}>20 Sek.</option>
                <option value={30}>30 Sek.</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      {error && (
        <div className="bg-red-500/80 backdrop-blur border border-red-300 text-white px-4 py-3 rounded-xl mb-4 font-semibold">
          ⚠️ {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={addQuestion}
          className="flex-1 glass hover:bg-white/25 text-white font-bold py-3 rounded-xl transition-colors"
        >
          + Frage hinzufügen
        </button>
        <button
          onClick={createGame}
          className="flex-1 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-white font-black py-3 rounded-xl text-lg shadow-lg border-b-4 border-emerald-600 transition-all"
        >
          Spiel erstellen →
        </button>
      </div>
    </div>
  );
}
