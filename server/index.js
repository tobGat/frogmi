const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const gl = require("./gameLogic");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

io.on("connection", (socket) => {
  console.log(`Verbunden: ${socket.id}`);

  // ─── LEHRER ────────────────────────────────────────────────────────────────

  socket.on("create_game", ({ questions }) => {
    if (!questions || questions.length === 0) {
      socket.emit("error", { message: "Keine Fragen übergeben" });
      return;
    }
    const pin = gl.createGame(questions, socket.id);
    socket.join(pin);
    socket.emit("game_created", { pin, status: "lobby" });
    console.log(`Spiel erstellt: PIN ${pin}`);
  });

  socket.on("start_game", ({ pin }) => {
    const game = gl.getGame(pin);
    if (!game || game.teacherSocketId !== socket.id) return;

    gl.startGame(pin);
    io.to(pin).emit("game_started", { pin });

    // Erste Frage senden
    sendQuestion(pin);
  });

  socket.on("next_question", ({ pin }) => {
    const game = gl.getGame(pin);
    if (!game || game.teacherSocketId !== socket.id) return;

    gl.clearAnswerTimer(pin);
    const hasNext = gl.advanceQuestion(pin);

    if (hasNext) {
      sendQuestion(pin);
    } else {
      // Spiel vorbei
      const leaderboard = gl.getLeaderboard(pin);
      io.to(pin).emit("game_over", { leaderboard });
      gl.endGame(pin);
    }
  });

  socket.on("end_game", ({ pin }) => {
    const game = gl.getGame(pin);
    if (!game || game.teacherSocketId !== socket.id) return;

    gl.clearAnswerTimer(pin);
    const leaderboard = gl.getLeaderboard(pin);
    io.to(pin).emit("game_over", { leaderboard });
    gl.endGame(pin);
  });

  // ─── SCHÜLER ───────────────────────────────────────────────────────────────

  socket.on("join_game", ({ pin, name }) => {
    if (!pin || !name || name.trim() === "") {
      socket.emit("join_error", { message: "PIN und Name erforderlich" });
      return;
    }

    const result = gl.addPlayer(pin, socket.id, name.trim());
    if (result.error) {
      socket.emit("join_error", { message: result.error });
      return;
    }

    socket.join(pin);
    socket.data.pin = pin;
    socket.data.name = name.trim();

    socket.emit("join_success", { pin, name: name.trim() });

    // Lehrer über neuen Spieler informieren
    const players = gl.getPlayerList(pin);
    const game = gl.getGame(pin);
    if (game) {
      io.to(game.teacherSocketId).emit("player_joined", { players });
    }

    console.log(`${name} beigetreten: PIN ${pin}`);
  });

  socket.on("submit_answer", ({ pin, answerIndex }) => {
    const result = gl.submitAnswer(pin, socket.id, answerIndex);
    if (!result) return;

    socket.emit("answer_result", result);

    // Lehrer über Fortschritt informieren
    const count = gl.getAnsweredCount(pin);
    const game = gl.getGame(pin);
    if (game) {
      io.to(game.teacherSocketId).emit("answer_progress", count);
    }

    // Wenn alle geantwortet haben → sofort Leaderboard
    if (gl.allAnswered(pin)) {
      gl.clearAnswerTimer(pin);
      showLeaderboard(pin);
    }
  });

  // ─── DISCONNECT ────────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    console.log(`Getrennt: ${socket.id}`);
    const pin = socket.data.pin;
    if (pin) {
      gl.removePlayer(pin, socket.id);
      const players = gl.getPlayerList(pin);
      const game = gl.getGame(pin);
      if (game) {
        io.to(game.teacherSocketId).emit("player_joined", { players });
      }
    }
  });
});

// ─── HILFSFUNKTIONEN ─────────────────────────────────────────────────────────

function sendQuestion(pin) {
  gl.startQuestionTimer(pin); // erst Timer starten, damit startedAt in getCurrentQuestion korrekt ist
  const q = gl.getCurrentQuestion(pin);
  if (!q) return;

  io.to(pin).emit("show_question", q);

  // Auto-Leaderboard nach Timer-Ablauf
  const timer = gl.setAnswerTimer(
    pin,
    setTimeout(() => {
      showLeaderboard(pin);
    }, q.timer * 1000 + 500) // +500ms Puffer
  );
}

function showLeaderboard(pin) {
  const game = gl.getGame(pin);
  if (!game) return;

  const leaderboard = gl.getLeaderboard(pin);
  const isLast = game.currentQuestion >= game.questions.length - 1;

  game.status = "leaderboard";
  io.to(pin).emit("show_leaderboard", {
    leaderboard,
    isLast,
    currentQuestion: game.currentQuestion,
    totalQuestions: game.questions.length,
  });
}

// ─── START ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`FrogMi Server läuft auf Port ${PORT}`);
});
