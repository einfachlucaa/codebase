const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const SORT_FIELDS = {
  xp: { "progress.level": -1, "progress.xp": -1 },
  coins: { "progress.coins": -1 },
  streak: { "progress.streak": -1 },
};

const getLeaderboard = asyncHandler(async (req, res) => {
  const sortBy = SORT_FIELDS[req.query.sortBy] ? req.query.sortBy : "xp";
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

  const users = await User.find({ banned: false })
    .select("username avatar progress.level progress.xp progress.coins progress.streak")
    .sort(SORT_FIELDS[sortBy])
    .limit(limit)
    .lean();

  const xpForLevel = (level) => 500 + (level - 1) * 250;
  const rows = users.map((u) => {
    let totalXp = u.progress.xp;
    for (let lv = 1; lv < u.progress.level; lv++) totalXp += xpForLevel(lv);
    return {
      username: u.username,
      avatar: u.avatar,
      level: u.progress.level,
      totalXp,
      coins: u.progress.coins,
      streak: u.progress.streak,
    };
  });

  res.json({ rows });
});

module.exports = { getLeaderboard };
