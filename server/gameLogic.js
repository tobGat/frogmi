// Spielzustand: alle laufenden Spiele im RAM
const games = {};

// Pending-disconnect timers: socketId → TimeoutHandle
// Prevents immediate removal when a player briefly loses connection.
const disconnectTimers = {};

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
    // Players who were removed after the grace period but may still rejoin.
    // Keyed by name so they can be found without a socketId.
    formerPlayers: {},
    teacherSocketId,
    answerTimer: null,
    previousLeaderboard: {},
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

  game.players[socketId] = { name, score: 0, answers: {}, answered: false, streak: 0 };
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
    // Relative elapsed time (server-side) avoids client/server clock drift
    elapsedMs: game.questionStart ? Math.max(0, Date.now() - game.questionStart) : 0,
    type: q.type || "mc",
  };
}

function startQuestionTimer(pin) {
  const game = games[pin];
  if (!game) return;
  game.questionStart = Date.now();
  // Streak-Reset für Spieler, die letzte Frage nicht beantwortet haben
  if (game.currentQuestion > 0) {
    Object.values(game.players).forEach((p) => {
      if (p.answers[game.currentQuestion - 1] === undefined) p.streak = 0;
    });
  }
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
    const fraction = 1 - responseMs / (timerSeconds * 1000);
    if (fraction >= 0) {
      points = Math.max(100, Math.round(1000 * fraction));
    }
    player.streak += 1;
  } else {
    player.streak = 0;
  }

  player.answered = true;
  player.score += points;
  player.answers[game.currentQuestion] = { answerIndex, correct, points };

  return { correct, points, totalScore: player.score, streak: player.streak };
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
  const prev = game.previousLeaderboard || {};

  const sorted = Object.values(game.players)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((p, i) => {
      const rank = i + 1;
      const prevRank = prev[p.name];
      const rankChange = prevRank != null ? prevRank - rank : 0;
      return { rank, name: p.name, score: p.score, streak: p.streak, rankChange };
    });

  const newPrev = {};
  sorted.forEach((p) => { newPrev[p.name] = p.rank; });
  game.previousLeaderboard = newPrev;

  return sorted;
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

// ── Reconnect / Grace-Period helpers ─────────────────────────────────────────

/**
 * Schedule a player removal after `delayMs` ms.
 * `onRemoved(players)` is called after actual deletion so the server can
 * broadcast the updated player list to the teacher.
 */
function scheduleRemovePlayer(pin, socketId, delayMs, onRemoved) {
  // Cancel any previously scheduled removal for this socket
  if (disconnectTimers[socketId]) {
    clearTimeout(disconnectTimers[socketId]);
  }
  disconnectTimers[socketId] = setTimeout(() => {
    delete disconnectTimers[socketId];
    const game = games[pin];
    if (game) {
      const player = game.players[socketId];
      if (player) {
        // Archive by name so the player can rejoin later with their score intact
        game.formerPlayers[player.name] = { ...player };
        delete game.players[socketId];
      }
    }
    onRemoved(getPlayerList(pin));
  }, delayMs);
}

/** Cancel a pending removal (called when player reconnects before timeout). */
function cancelScheduledRemoval(socketId) {
  if (disconnectTimers[socketId]) {
    clearTimeout(disconnectTimers[socketId]);
    delete disconnectTimers[socketId];
    return true;
  }
  return false;
}

/**
 * Allow a player to rejoin with a new socketId (after refresh / reconnect).
 * Finds the existing player entry by name and re-keys it to the new socketId.
 * Works during lobby, question, and leaderboard phases.
 * Returns { success, prevSocketId } or { error }.
 */
function rejoinPlayer(pin, newSocketId, name) {
  const game = games[pin];
  if (!game) return { error: "Spiel nicht gefunden" };

  // 1. Player is still in the active list (brief reconnect, same or new socketId)
  const activeEntry = Object.entries(game.players).find(([, p]) => p.name === name);
  if (activeEntry) {
    const [prevSocketId, playerData] = activeEntry;
    if (prevSocketId === newSocketId) return { success: true, prevSocketId: null };
    delete game.players[prevSocketId];
    game.players[newSocketId] = playerData;
    return { success: true, prevSocketId };
  }

  // 2. Player was archived (grace period expired) – late rejoin with score restored
  const archived = game.formerPlayers[name];
  if (archived) {
    delete game.formerPlayers[name];
    // Reset the `answered` flag so they can participate in the current question
    game.players[newSocketId] = { ...archived, answered: false };
    return { success: true, prevSocketId: null };
  }

  return { error: "Spieler nicht gefunden – bitte neu beitreten" };
}

/**
 * Return enough state for a rejoining student to continue where they left off.
 */
function getRejoinState(pin, socketId) {
  const game = games[pin];
  if (!game) return null;
  const player = game.players[socketId];
  return {
    pin,
    name: player?.name ?? null,
    status: game.status,
    currentQuestion: game.status === "question" ? getCurrentQuestion(pin) : null,
    leaderboard: game.status === "leaderboard" ? getLeaderboard(pin) : null,
    totalQuestions: game.questions.length,
    currentQuestionIndex: game.currentQuestion,
  };
}

/**
 * Return info about the correct answer for the question that just finished.
 * Used to display the solution on the leaderboard screen.
 */
function getCorrectAnswerInfo(pin) {
  const game = games[pin];
  if (!game) return null;
  const q = game.questions[game.currentQuestion];
  if (!q) return null;
  const isTF = (q.type || "mc") === "tf";
  return {
    index: q.correct,
    text: isTF ? (q.correct === 0 ? "Wahr" : "Falsch") : (q.answers?.[q.correct] ?? ""),
    type: q.type || "mc",
    label: isTF ? null : ["A", "B", "C", "D"][q.correct] ?? null,
  };
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
  scheduleRemovePlayer,
  cancelScheduledRemoval,
  rejoinPlayer,
  getRejoinState,
  getCorrectAnswerInfo,
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
