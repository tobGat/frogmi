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
    correctAnswer: null, // { index, text, type, label } – set on leaderboard
  });
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    // ── Connection ──────────────────────────────────────────────────────────
    socket.on("connect", () => {
      setConnected(true);
      // After any (re)connect: try to restore a student session from storage.
      // This covers both brief network hiccups (socket auto-reconnect) and
      // page refreshes where the user wants to get back into the game.
      const raw = sessionStorage.getItem("frogmi_session");
      if (raw) {
        try {
          const { pin, name } = JSON.parse(raw);
          if (pin && name) socket.emit("rejoin_game", { pin, name });
        } catch (_) { /* malformed storage – ignore */ }
      }
    });
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
      sessionStorage.setItem("frogmi_session", JSON.stringify({ pin, name }));
      setGameState((s) => ({ ...s, pin, name, role: "student" }));
      setView("student-lobby");
    });

    socket.on("answer_result", (result) => {
      setGameState((s) => ({ ...s, answerResult: result }));
    });

    // Rejoin after reconnect / page refresh
    socket.on("rejoin_success", (state) => {
      setGameState((s) => ({
        ...s,
        pin: state.pin,
        name: state.name,
        role: "student",
      }));
      if (state.status === "question" && state.currentQuestion) {
        setGameState((s) => ({
          ...s,
          question: state.currentQuestion,
          answerResult: null,
          answeredCount: { answered: 0, total: 0 },
        }));
        setView("student-game");
      } else if (state.status === "leaderboard" && state.leaderboard) {
        setGameState((s) => ({
          ...s,
          leaderboard: state.leaderboard,
          isLastQuestion: state.currentQuestionIndex >= state.totalQuestions - 1,
          currentQuestion: state.currentQuestionIndex,
          totalQuestions: state.totalQuestions,
        }));
        setView("leaderboard");
      } else {
        setView("student-lobby");
      }
    });

    socket.on("rejoin_error", () => {
      // Session is stale – clear it so the user can join fresh
      sessionStorage.removeItem("frogmi_session");
    });

    // ─── BEIDE ───────────────────────────────────────────────────────────────
    socket.on("game_started", () => {
      // Warte auf show_question
    });

    socket.on("show_question", (question) => {
      setGameState((s) => {
        setView(s.role === "teacher" ? "teacher-game" : "student-game");
        return {
          ...s,
          question,
          answerResult: null,
          correctAnswer: null,
          answeredCount: { answered: 0, total: s.players.length },
        };
      });
    });

    socket.on("show_leaderboard", ({ leaderboard, isLast, currentQuestion, totalQuestions, correctAnswer }) => {
      setGameState((s) => ({
        ...s,
        leaderboard,
        isLastQuestion: isLast,
        currentQuestion,
        totalQuestions,
        correctAnswer: correctAnswer ?? null,
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
      socket.off("rejoin_success");
      socket.off("rejoin_error");
      socket.off("game_started");
      socket.off("show_question");
      socket.off("show_leaderboard");
      socket.off("game_over");
    };
  }, []);

  const goHome = () => {
    sessionStorage.removeItem("frogmi_session"); // intentional exit – don't auto-rejoin
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
      correctAnswer: null,
    });
  };

  // Prevent accidental back-navigation or page refresh while a game is active.
  // We push a synthetic history entry when the student is in-game so the first
  // "back" press merely pops back to this entry (triggering popstate) rather
  // than leaving the page.  On popstate we push the entry again, keeping the
  // student on the same screen.
  const inGame = gameState.role === "student" && view !== "home" && view !== "student-join";
  useEffect(() => {
    if (!inGame) return;
    // Push a sentinel entry so there's something to pop to
    window.history.pushState({ frogmi: true }, "");

    const handlePopState = () => {
      // Push the entry back so the browser's "back" stack never drains
      window.history.pushState({ frogmi: true }, "");
    };
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // triggers the browser's native "leave page?" dialog
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [inGame]);

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
