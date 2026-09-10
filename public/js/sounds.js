/* ---------- SOUNDS ----------
   Erzeugt kurze Töne direkt im Browser (Web Audio API), keine externen
   Sound-Dateien nötig. state.soundOn steuert An/Aus (Toggle in den Einstellungen). */
let _actx = null;
function _ctx(){
  if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
  return _actx;
}
function _tone(freq, duration, type, gainStart){
  if (!state.soundOn) return;
  try{
    const ctx = _ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.value = gainStart ?? 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + duration);
  } catch { /* Audio evtl. noch nicht durch User-Geste freigegeben, einfach ignorieren */ }
}
function playSound(name){
  switch(name){
    case "click": _tone(440, 0.05, "sine", 0.04); break;
    case "correct": _tone(660, 0.12, "triangle"); setTimeout(()=>_tone(880,0.15,"triangle"),90); break;
    case "wrong": _tone(180, 0.25, "sawtooth", 0.06); break;
    case "coin": _tone(1046, 0.08, "square", 0.05); setTimeout(()=>_tone(1318,0.1,"square",0.05),70); break;
    case "levelup": [523,659,784,1046].forEach((f,i)=>setTimeout(()=>_tone(f,0.2,"triangle"),i*90)); break;
    case "win": [523,659,784,1046,1318].forEach((f,i)=>setTimeout(()=>_tone(f,0.15,"triangle"),i*70)); break;
    case "lose": _tone(220,0.3,"sawtooth",0.06); setTimeout(()=>_tone(140,0.35,"sawtooth",0.06),150); break;
    case "notify": _tone(784,0.1,"sine",0.05); break;
  }
}
