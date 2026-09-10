const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

// Jeder Key = eine eigene Rangliste. "scoreField" bestimmt, welcher Wert
// im Leaderboard als "Score" angezeigt/sortiert wird.
const BOARDS = {
  xp: { sort: { "progress.level": -1, "progress.xp": -1 }, scoreField: "totalXp", label: "⭐ XP" },
  coins: { sort: { "progress.coins": -1 }, scoreField: "coins", label: "🪙 Coins" },
  gems: { sort: { "progress.gems": -1 }, scoreField: "gems", label: "💎 Gems" },
  streak: { sort: { "progress.streak": -1 }, scoreField: "streak", label: "🔥 Streak" },
  bubble: { sort: { "progress.bubbleHigh": -1 }, scoreField: "bubbleHigh", label: "🫧 Bubble Shooter" },
  tap: { sort: { "progress.tapHigh": -1 }, scoreField: "tapHigh", label: "⚡ TapTap Arrow" },
  memory: { sort: { "progress.memoryHigh": -1 }, scoreField: "memoryHigh", label: "🧠 Memory Match" },
  quizrush: { sort: { "progress.quizRushHigh": -1 }, scoreField: "quizRushHigh", label: "🚀 Quiz Rush" },
};

const getLeaderboard = asyncHandler(async (req, res) => {
  const key = BOARDS[req.query.sortBy] ? req.query.sortBy : "xp";
  const board = BOARDS[key];
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

  const users = await User.find({ banned: false })
    .select("username avatar progress")
    .sort(board.sort)
    .limit(limit)
    .lean();

  const xpForLevel = (level) => 500 + (level - 1) * 250;
  const rows = users.map((u) => {
    let totalXp = u.progress.xp;
    for (let lv = 1; lv < u.progress.level; lv++) totalXp += xpForLevel(lv);
    const values = {
      totalXp, coins: u.progress.coins, gems: u.progress.gems, streak: u.progress.streak,
      bubbleHigh: u.progress.bubbleHigh, tapHigh: u.progress.tapHigh,
      memoryHigh: u.progress.memoryHigh, quizRushHigh: u.progress.quizRushHigh,
    };
    return {
      username: u.username,
      avatar: u.avatar,
      level: u.progress.level,
      coins: u.progress.coins,
      gems: u.progress.gems,
      streak: u.progress.streak,
      totalXp,
      score: values[board.scoreField],
    };
  });

  res.json({
    rows,
    boards: Object.entries(BOARDS).map(([k, b]) => ({ key: k, label: b.label })),
  });
});

module.exports = { getLeaderboard };
