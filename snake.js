/* ---------- ARCADE: SNAKE ---------- */
const SNAKE_COLS = 16, SNAKE_ROWS = 12;
let snakeTimerHandle = null;

function snakeRandomCell(occupied){
  let cell;
  do { cell = {x:Math.floor(Math.random()*SNAKE_COLS), y:Math.floor(Math.random()*SNAKE_ROWS)}; }
  while (occupied.some(o=>o.x===cell.x && o.y===cell.y));
  return cell;
}
function startSnake(){
  spendForGame("snake");
  state.arcadeGame = "snake";
  const body = [{x:7,y:6},{x:6,y:6},{x:5,y:6}];
  state.snake = { body, dir:"Right", nextDir:"Right", food: snakeRandomCell(body), score:0, over:false, speed:160, xpEarned:0, startedAt:Date.now() };
  render();
  startSnakeTimer();
}
function startSnakeTimer(){
  stopSnakeTimer();
  snakeTimerHandle = setInterval(snakeTick, state.snake.speed);
}
function stopSnakeTimer(){ if (snakeTimerHandle){ clearInterval(snakeTimerHandle); snakeTimerHandle=null; } }
const SNAKE_VEC = { Up:{x:0,y:-1}, Down:{x:0,y:1}, Left:{x:-1,y:0}, Right:{x:1,y:0} };
const SNAKE_OPPOSITE = { Up:"Down", Down:"Up", Left:"Right", Right:"Left" };
function snakeSetDir(dir){
  const s = state.snake;
  if (!s || s.over) return;
  if (SNAKE_OPPOSITE[dir]===s.dir) return; // kein direktes Umdrehen erlauben
  s.nextDir = dir;
}
function snakeKeyHandler(e){
  const map = {ArrowUp:"Up", ArrowDown:"Down", ArrowLeft:"Left", ArrowRight:"Right", w:"Up", s:"Down", a:"Left", d:"Right"};
  if (map[e.key]){ e.preventDefault(); snakeSetDir(map[e.key]); }
}
function snakeTick(){
  const s = state.snake;
  if (!s || s.over) return;
  s.dir = s.nextDir;
  const v = SNAKE_VEC[s.dir];
  const head = s.body[0];
  const nx = head.x+v.x, ny = head.y+v.y;

  if (nx<0||nx>=SNAKE_COLS||ny<0||ny>=SNAKE_ROWS || s.body.some(seg=>seg.x===nx && seg.y===ny)){
    endSnake(); refreshLiveArea(); return;
  }
  s.body.unshift({x:nx,y:ny});
  if (nx===s.food.x && ny===s.food.y){
    s.score += 10;
    s.food = snakeRandomCell(s.body);
    if (s.score%50===0 && s.speed>70){ s.speed -= 10; startSnakeTimer(); } // wird mit der Zeit schneller
  } else {
    s.body.pop();
  }
  refreshLiveArea();
}
function endSnake(){
  const s = state.snake, p = progress();
  s.over = true; stopSnakeTimer();
  if (s.score>(p.snakeHigh||0)) p.snakeHigh = s.score;
  s.xpEarned = payoutForGame(s.score) + awardPlaytimeXp(s.startedAt);
}
function restartSnake(){
  const body = [{x:7,y:6},{x:6,y:6},{x:5,y:6}];
  state.snake = { body, dir:"Right", nextDir:"Right", food: snakeRandomCell(body), score:0, over:false, speed:160, xpEarned:0, startedAt:Date.now() };
  refreshLiveArea(); startSnakeTimer();
}
function exitSnake(){ stopSnakeTimer(); state.snake=null; state.arcadeGame=null; render(); }

document.addEventListener("keydown", snakeKeyHandler);

function renderSnakeGame(){
  const s = state.snake;
  if (!s) return `<div class="body-text">Lade...</div>`;
  let cells = "";
  for (let y=0;y<SNAKE_ROWS;y++){
    for (let x=0;x<SNAKE_COLS;x++){
      const isHead = s.body[0].x===x && s.body[0].y===y;
      const isBody = !isHead && s.body.some(seg=>seg.x===x && seg.y===y);
      const isFood = s.food.x===x && s.food.y===y;
      let cls = "sn-cell";
      if (isHead) cls += " sn-head";
      else if (isBody) cls += " sn-body";
      else if (isFood) cls += " sn-food";
      cells += `<div class="${cls}"></div>`;
    }
  }
  return `
  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
    <div class="title" style="margin:0;">🟢 Snake — Score ${s.score}</div>
    <button class="btn btn-secondary" onclick="exitSnake()">Beenden</button>
  </div>
  <div class="sn-grid" style="grid-template-columns:repeat(${SNAKE_COLS}, 26px);">${cells}</div>
  <div class="muted" style="margin-top:10px;">Steuerung: Pfeiltasten oder WASD</div>
  ${s.over ? `<div class="card gradient-bg casino-result-pop" style="margin-top:16px; text-align:center; max-width:400px;">
    <div style="color:white; font-weight:700; font-size:18px;">💀 Game Over</div>
    <div style="color:#ede9ff; margin:6px 0;">Score: ${s.score} · +${s.xpEarned} XP</div>
    <div style="display:flex; gap:10px; justify-content:center; margin-top:10px;">
      <button class="btn" style="background:white; color:var(--accent);" onclick="restartSnake()">Nochmal</button>
      <button class="btn btn-secondary" onclick="exitSnake()">Zurück</button>
    </div>
  </div>` : ""}`;
}
