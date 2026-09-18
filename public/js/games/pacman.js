/* ---------- ARCADE: PAC-MAN ---------- */
const PACMAN_COST = 20;
// Labyrinth: # = Wand, . = Punkt, o = Power-Pellet, ' ' = leerer Gang
const PACMAN_MAP = [
  "#############",
  "#.....#.....#",
  "#o##.#.#.##o#",
  "#...........#",
  "#.##.###.##.#",
  "#....#......#",
  "###.## ##.###",
  "#....#......#",
  "#.##.###.##.#",
  "#...........#",
  "#o##.#.#.##o#",
  "#.....#.....#",
  "#############",
];
let pacmanTimerHandle = null;

function pacmanIsWall(x,y){
  const row = PACMAN_MAP[y];
  if (!row) return true;
  const ch = row[x];
  return ch === "#" || ch === undefined;
}
function pacmanCountDots(){
  let n=0;
  for (const row of PACMAN_MAP) for (const ch of row) if (ch==="."||ch==="o") n++;
  return n;
}

function startPacman(){
  if (!spendForGame("pacman", PACMAN_COST)) return;
  state.arcadeGame = "pacman";
  const grid = PACMAN_MAP.map(row=>row.split(""));
  state.pacman = {
    grid,
    player: {x:6, y:3, dir:"Right", nextDir:"Right"},
    ghosts: [
      {x:1, y:1, color:"#ff453a"},
      {x:11, y:1, color:"#64d2ff"},
      {x:6, y:9, color:"#ff9142"},
    ],
    score:0, lives:3, dotsLeft: pacmanCountDots(), over:false, won:false,
    frightened:0, // Ticks, in denen Geister fliehen (nach Power-Pellet)
  };
  render();
  startPacmanTimer();
}
function pacmanKeyHandler(e){
  const g = state.pacman;
  if (!g || g.over) return;
  const map = {ArrowUp:"Up", ArrowDown:"Down", ArrowLeft:"Left", ArrowRight:"Right", w:"Up", s:"Down", a:"Left", d:"Right"};
  const dir = map[e.key];
  if (dir){ e.preventDefault(); g.player.nextDir = dir; }
}
function stopPacmanTimer(){
  if (pacmanTimerHandle){ clearInterval(pacmanTimerHandle); pacmanTimerHandle=null; }
  document.removeEventListener("keydown", pacmanKeyHandler);
}
function startPacmanTimer(){
  stopPacmanTimer();
  document.addEventListener("keydown", pacmanKeyHandler);
  pacmanTimerHandle = setInterval(pacmanTick, 220);
}
const PACMAN_VEC = { Up:{x:0,y:-1}, Down:{x:0,y:1}, Left:{x:-1,y:0}, Right:{x:1,y:0} };

function pacmanTick(){
  const g = state.pacman;
  if (!g || g.over) return;
  const p = g.player;

  const nv = PACMAN_VEC[p.nextDir];
  if (nv && !pacmanIsWall(p.x+nv.x, p.y+nv.y)) p.dir = p.nextDir;

  const v = PACMAN_VEC[p.dir];
  let nx = p.x+v.x, ny = p.y+v.y;
  if (nx<0) nx = PACMAN_MAP[0].length-1; else if (nx>=PACMAN_MAP[0].length) nx = 0; // Tunnel-Effekt
  if (!pacmanIsWall(nx, ny)){ p.x = nx; p.y = ny; }

  const cell = g.grid[p.y][p.x];
  if (cell==="."){ g.grid[p.y][p.x]=" "; g.score+=10; g.dotsLeft--; }
  else if (cell==="o"){ g.grid[p.y][p.x]=" "; g.score+=50; g.dotsLeft--; g.frightened=25; }

  if (g.frightened>0) g.frightened--;

  g.ghosts.forEach(gh=>{
    const dirs = ["Up","Down","Left","Right"].filter(d=>{
      const dv=PACMAN_VEC[d]; return !pacmanIsWall(gh.x+dv.x, gh.y+dv.y);
    });
    if (!dirs.length) return;
    let best = dirs[Math.floor(Math.random()*dirs.length)];
    if (Math.random()<0.6){
      best = dirs.reduce((a,b)=>{
        const da=PACMAN_VEC[a], db=PACMAN_VEC[b];
        const distA = Math.hypot((gh.x+da.x)-p.x, (gh.y+da.y)-p.y);
        const distB = Math.hypot((gh.x+db.x)-p.x, (gh.y+db.y)-p.y);
        const better = g.frightened>0 ? distA>distB : distA<distB;
        return better ? a : b;
      });
    }
    const bv = PACMAN_VEC[best];
    gh.x += bv.x; gh.y += bv.y;
  });

  g.ghosts.forEach(gh=>{
    if (gh.x===p.x && gh.y===p.y){
      if (g.frightened>0){ gh.x = 6; gh.y = 5; g.score+=100; }
      else pacmanLoseLife();
    }
  });

  if (g.dotsLeft<=0) pacmanEndGame(true);
  refreshLiveArea();
}
function pacmanLoseLife(){
  const g = state.pacman;
  g.lives--;
  playSound("wrong");
  if (g.lives<=0){ pacmanEndGame(false); return; }
  g.player.x=6; g.player.y=3; g.player.dir="Right"; g.player.nextDir="Right";
}
function pacmanEndGame(won){
  const g = state.pacman;
  g.over = true; g.won = won;
  stopPacmanTimer();
  const p = progress();
  p.pacmanHigh = Math.max(p.pacmanHigh||0, g.score);
  const coinsEarned = payoutForGame(g.score);
  g.coinsEarned = coinsEarned;
  playSound(won ? "win" : "lose");
  refreshLiveArea();
}
function exitPacman(){ stopPacmanTimer(); state.pacman=null; state.arcadeGame=null; render(); }
