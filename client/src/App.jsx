import { useState, useEffect } from "react";
import socket from "./socket";
import HomeView from "./views/HomeView";
import TeacherSetup from "./views/TeacherSetup";
import TeacherLobby from "./views/TeacherLobby";
import TeacherGame from "./views/TeacherGame";
import StudentJoin from "./views/StudentJoin";
import StudentLobby from "./views/StudentLobby";
import StudentGame from "./views/StudentGame";
import Leaderboard from "./views/Leaderboard";

export default function App() {
  const [view, setView] = useState("home");
  const [gameState, setGameState] = useState({
    pin: null,
    name: null,
    role: null, // "teacher" | "student"
    question: null,
    leaderboard: [],
    players: [],
    answerResult: null,
    answeredCount: { answered: 0, total: 0 },
    isLastQuestion: false,
  });
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // ─── LEHRER EVENTS ───────────────────────────────────────────────────────
    socket.on("game_created", ({ pin }) => {
      setGameState((s) => ({ ...s, pin, role: "teacher" }));
      setView("teacher-lobby");
    });

    socket.on("player_joined", ({ players }) => {
      setGameState((s) => ({ ...s, players }));
    });

    socket.on("answer_progress", (count) => {
      setGameState((s) => ({ ...s, answeredCount: count }));
    });

    // ─── SCHÜLER EVENTS ──────────────────────────────────────────────────────
    socket.on("join_success", ({ pin, name }) => {
      setGameState((s) => ({ ...s, pin, name, role: "student" }));
      setView("student-lobby");
    });

    socket.on("answer_result", (result) => {
      setGameState((s) => ({ ...s, answerResult: result }));
    });

    // ─── BEIDE ───────────────────────────────────────────────────────────────
    socket.on("game_started", () => {
      // Warte auf show_question
    });

    socket.on("show_question", (question) => {
      setGameState((s) => ({
        ...s,
        question,
        answerResult: null,
        answeredCount: { answered: 0, total: s.players.length },
      }));
      setView((prev) => (prev.startsWith("teacher") ? "teacher-game" : "student-game"));
    });

    socket.on("show_leaderboard", ({ leaderboard, isLast, currentQuestion, totalQuestions }) => {
      setGameState((s) => ({
        ...s,
        leaderboard,
        isLastQuestion: isLast,
        currentQuestion,
        totalQuestions,
      }));
      setView("leaderboard");
    });

    socket.on("game_over", ({ leaderboard }) => {
      setGameState((s) => ({ ...s, leaderboard, isLastQuestion: true }));
      setView("leaderboard");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("game_created");
      socket.off("player_joined");
      socket.off("answer_progress");
      socket.off("join_success");
      socket.off("answer_result");
      socket.off("game_started");
      socket.off("show_question");
      socket.off("show_leaderboard");
      socket.off("game_over");
    };
  }, []);

  const goHome = () => {
    setView("home");
    setGameState({
      pin: null,
      name: null,
      role: null,
      question: null,
      leaderboard: [],
      players: [],
      answerResult: null,
      answeredCount: { answered: 0, total: 0 },
      isLastQuestion: false,
    });
  };

  return (
    <div className="min-h-screen text-white">
      {!connected && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-50 text-sm font-bold shadow-lg">
          ⚠️ Verbindung unterbrochen – versuche erneut zu verbinden…
        </div>
      )}

      {view === "home" && <HomeView setView={setView} />}
      {view === "teacher-setup" && <TeacherSetup setView={setView} setGameState={setGameState} />}
      {view === "teacher-lobby" && (
        <TeacherLobby gameState={gameState} setView={setView} goHome={goHome} />
      )}
      {view === "teacher-game" && (
        <TeacherGame gameState={gameState} setView={setView} goHome={goHome} />
      )}
      {view === "student-join" && <StudentJoin setView={setView} setGameState={setGameState} />}
      {view === "student-lobby" && <StudentLobby gameState={gameState} goHome={goHome} />}
      {view === "student-game" && <StudentGame gameState={gameState} />}
      {view === "leaderboard" && (
        <Leaderboard gameState={gameState} goHome={goHome} />
      )}
    </div>
  );
}
