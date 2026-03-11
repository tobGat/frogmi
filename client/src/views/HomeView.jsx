export default function HomeView({ setView }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
      <img
        src="/logo.png"
        alt="FrogMi"
        className="w-52 h-52 object-contain drop-shadow-2xl"
      />
      <p className="text-white/80 text-lg font-medium -mt-2">
        Interaktive Quiz-App für den Unterricht
      </p>

      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-lg mt-2">
        <button
          onClick={() => setView("teacher-setup")}
          className="flex-1 bg-violet-500 hover:bg-violet-400 active:scale-95 text-white font-black text-2xl py-8 px-6 rounded-3xl shadow-xl transition-all min-h-[120px] border-b-4 border-violet-700"
        >
          👩‍🏫 Lehrer:in
        </button>
        <button
          onClick={() => setView("student-join")}
          className="flex-1 bg-orange-400 hover:bg-orange-300 active:scale-95 text-white font-black text-2xl py-8 px-6 rounded-3xl shadow-xl transition-all min-h-[120px] border-b-4 border-orange-600"
        >
          🎓 Schüler:in
        </button>
      </div>
    </div>
  );
}
