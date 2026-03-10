// Spielzustand: alle laufenden Spiele im RAM
const games = {};

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createGame(questions, teacherSocketId) {
  let pin;
  do {
    pin = generatePin();
  } while (games[pin]);

  games[pin] = {
    pin,
    status: "lobby",
    questions,
    currentQuestion: 0,
    timer: 20,
    questionStart: null,
    players: {},
    teacherSocketId,
    answerTimer: null,
  };

  return pin;
}

function getGame(pin) {
  return games[pin] || null;
}

function addPlayer(pin, socketId, name) {
  const game = games[pin];
  if (!game) return { error: "Spiel nicht gefunden" };
  if (game.status !== "lobby") return { error: "Spiel hat bereits begonnen" };

  const nameTaken = Object.values(game.players).some((p) => p.name === name);
  if (nameTaken) return { error: "Dieser Name ist bereits vergeben" };

  game.players[socketId] = { name, score: 0, answers: {}, answered: false };
  return { success: true };
}

function removePlayer(pin, socketId) {
  const game = games[pin];
  if (game && game.players[socketId]) {
    delete game.players[socketId];
  }
}

function getPlayerList(pin) {
  const game = games[pin];
  if (!game) return [];
  return Object.values(game.players).map((p) => ({ name: p.name, score: p.score }));
}

function startGame(pin) {
  const game = games[pin];
  if (!game) return false;
  game.status = "question";
  game.currentQuestion = 0;
  return true;
}

function getCurrentQuestion(pin) {
  const game = games[pin];
  if (!game) return null;
  const q = game.questions[game.currentQuestion];
  return {
    index: game.currentQuestion,
    total: game.questions.length,
    text: q.text,
    answers: q.answers,
    timer: q.timer || 20,
  };
}

function startQuestionTimer(pin) {
  const game = games[pin];
  if (!game) return;
  game.questionStart = Date.now();
  // Reset answered flags
  Object.values(game.players).forEach((p) => (p.answered = false));
}

function submitAnswer(pin, socketId, answerIndex) {
  const game = games[pin];
  if (!game) return null;
  if (game.status !== "question") return null;
  const player = game.players[socketId];
  if (!player) return null;
  if (player.answered) return null; // Bereits geantwortet

  const q = game.questions[game.currentQuestion];
  const correct = answerIndex === q.correct;
  const responseMs = Date.now() - game.questionStart;
  const timerSeconds = q.timer || 20;
  let points = 0;

  if (correct) {
    points = Math.max(100, Math.round(1000 * (1 - responseMs / (timerSeconds * 1000))));
  }

  player.answered = true;
  player.score += points;
  player.answers[game.currentQuestion] = { answerIndex, correct, points };

  return { correct, points, totalScore: player.score };
}

function getAnsweredCount(pin) {
  const game = games[pin];
  if (!game) return { answered: 0, total: 0 };
  const players = Object.values(game.players);
  return {
    answered: players.filter((p) => p.answered).length,
    total: players.length,
  };
}

function allAnswered(pin) {
  const game = games[pin];
  if (!game) return false;
  const players = Object.values(game.players);
  return players.length > 0 && players.every((p) => p.answered);
}

function getLeaderboard(pin) {
  const game = games[pin];
  if (!game) return [];
  return Object.values(game.players)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score }));
}

function advanceQuestion(pin) {
  const game = games[pin];
  if (!game) return false;
  game.currentQuestion++;
  if (game.currentQuestion >= game.questions.length) {
    game.status = "finished";
    return false; // Keine weiteren Fragen
  }
  game.status = "question";
  return true;
}

function endGame(pin) {
  const game = games[pin];
  if (game) {
    if (game.answerTimer) clearTimeout(game.answerTimer);
    delete games[pin];
  }
}

function setAnswerTimer(pin, timer) {
  const game = games[pin];
  if (game) game.answerTimer = timer;
}

function clearAnswerTimer(pin) {
  const game = games[pin];
  if (game && game.answerTimer) {
    clearTimeout(game.answerTimer);
    game.answerTimer = null;
  }
}

module.exports = {
  createGame,
  getGame,
  addPlayer,
  removePlayer,
  getPlayerList,
  startGame,
  getCurrentQuestion,
  startQuestionTimer,
  submitAnswer,
  getAnsweredCount,
  allAnswered,
  getLeaderboard,
  advanceQuestion,
  endGame,
  setAnswerTimer,
  clearAnswerTimer,
};
