/* ---------- EXERCISE HANDLING ---------- */
function instArr(container){
  if (container==="lesson") return state.lessonInstances;
  if (container==="exam") return state.examSession ? state.examSession.instances : [];
  return state.practiceInstances;
}
function makeInstance(exId){
  const def = EXERCISES[exId];
  const inst = {exId, answered:false, correct:false, feedback:"", selected:-1, text:"", showHint:false};
  if (def.type==="order"){
    inst.order = shuffle(def.lines.slice());
    if (JSON.stringify(inst.order)===JSON.stringify(def.lines) && inst.order.length>1){
      const tmp=inst.order[0]; inst.order[0]=inst.order[inst.order.length-1]; inst.order[inst.order.length-1]=tmp;
    }
  }
  return inst;
}

function gradeInstance(inst){
  const def = EXERCISES[inst.exId];
  if (def.type==="code"){
    const missing = def.keywords.filter(k=>!inst.text.toLowerCase().includes(k.toLowerCase()));
    if (missing.length===0 && inst.text.trim()!=="") return {ok:true, msg:"Richtig gelöst! 🎉 "+def.expl};
    return {ok:false, msg:"Noch nicht ganz richtig. "+(missing.length? "Es fehlt: "+missing.join(", ")+". ":"")+"Tipp: "+def.hint};
  }
  if (def.type==="mc"){
    return inst.selected===def.correct ? {ok:true, msg:"Richtig! "+def.expl} : {ok:false, msg:"Das ist leider nicht korrekt. "+def.expl};
  }
  if (def.type==="guess"){
    const ok = inst.text.trim().toLowerCase()===def.answer.trim().toLowerCase();
    return ok ? {ok:true, msg:"Genau richtig! "+def.expl} : {ok:false, msg:`Nicht ganz. Richtige Ausgabe wäre: "${def.answer}". `+def.expl};
  }
  if (def.type==="order"){
    const ok = JSON.stringify(inst.order)===JSON.stringify(def.lines);
    return ok ? {ok:true, msg:"Perfekte Reihenfolge! "+def.expl} : {ok:false, msg:"Die Reihenfolge stimmt noch nicht. "+def.expl};
  }
  return {ok:false, msg:"Unbekannter Aufgabentyp."};
}

function checkExercise(container, idx){
  const arr = instArr(container);
  const inst = arr[idx];
  const def = EXERCISES[inst.exId];
  const result = gradeInstance(inst);
  const wasAlreadyCorrect = inst.correct;
  inst.answered = true; inst.correct = result.ok; inst.feedback = result.msg;

  if (container==="exam"){
    // Im Klausur-Modus gibt's keine Einzel-Belohnung pro Frage — nur am Ende.
    if (result.ok && !wasAlreadyCorrect) playSound("correct"); else if (!result.ok) playSound("wrong");
    render();
    return;
  }

  if (result.ok && !wasAlreadyCorrect){
    const p = progress();
    const levelBefore = p.level;
    recordExercise(p, def, inst.exId, true);
    if (container==="lesson"){
      const lesson = LESSONS.find(l=>l.id===state.lessonId);
      if (state.lessonInstances.every(i=>i.correct)) completeLesson(p, lesson);
    }
    playSound(p.level>levelBefore ? "levelup" : "correct");
  } else if (!result.ok){
    recordExercise(progress(), def, inst.exId, false);
    playSound("wrong");
  }
  render();
}
function selectOption(container, idx, opt){
  const arr = instArr(container);
  arr[idx].selected = opt; render();
}
function setText(container, idx, val, ev){
  const arr = instArr(container);
  arr[idx].text = val;
  if (ev && ev.target) updateCodeSuggestions(container, idx, ev.target);
}
function moveLine(container, idx, lineIdx, dir){
  const arr = instArr(container);
  const order = arr[idx].order;
  const j = lineIdx+dir;
  if (j<0||j>=order.length) return;
  [order[lineIdx],order[j]]=[order[j],order[lineIdx]];
  render();
}
function toggleHint(container, idx){
  const arr = instArr(container);
  arr[idx].showHint = !arr[idx].showHint; render();
}

/* ---------- TAB-VERVOLLSTÄNDIGUNG (nur bei Code-Aufgaben) ---------- */
function currentWordAtEnd(text){
  const m = /[A-Za-z_][A-Za-z0-9_.]*$/.exec(text||"");
  return m ? m[0] : "";
}
function updateCodeSuggestions(container, idx, textareaEl){
  const arr = instArr(container);
  const inst = arr[idx];
  const def = EXERCISES[inst.exId];
  if (!def || def.type!=="code") return;
  const course = exerciseCourse(inst.exId);
  const word = currentWordAtEnd(textareaEl.value);
  const list = KEYWORDS_BY_COURSE[course] || [];
  const suggestions = word.length>=2
    ? list.filter(k=>k.toLowerCase().startsWith(word.toLowerCase()) && k.toLowerCase()!==word.toLowerCase()).slice(0,5)
    : [];
  textareaEl.dataset.topSuggestion = suggestions[0] || "";
  textareaEl.dataset.topWord = word;
  const box = document.getElementById(textareaEl.id + "_suggest");
  if (!box) return;
  box.innerHTML = suggestions.map(s=>
    `<button type="button" class="suggest-chip" onmousedown="event.preventDefault();" onclick="applySuggestion(document.getElementById('${textareaEl.id}'), '${container}', ${idx}, '${s.replace(/'/g,"\\'")}')">${escapeHtml(s)}</button>`
  ).join("");
}
function applySuggestion(textareaEl, container, idx, chosen){
  const word = textareaEl.dataset.topWord || "";
  const val = textareaEl.value;
  const newVal = val.slice(0, val.length-word.length) + chosen;
  textareaEl.value = newVal;
  textareaEl.focus();
  textareaEl.selectionStart = textareaEl.selectionEnd = newVal.length;
  setText(container, idx, newVal, {target:textareaEl});
  const box = document.getElementById(textareaEl.id + "_suggest");
  if (box) box.innerHTML = "";
}
function exerciseTabComplete(ev, container, idx){
  if (ev.key !== "Tab") return;
  const ta = ev.target;
  const top = ta.dataset.topSuggestion;
  if (!top) return; // kein Vorschlag da -> normales Tab-Verhalten (Fokus wechselt)
  ev.preventDefault();
  applySuggestion(ta, container, idx, top);
}

function renderExerciseWidget(inst, idx, container){
  const def = EXERCISES[inst.exId];
  let body = "";
  if (def.code) body += `<div class="code-block">${escapeHtml(def.code)}</div>`;

  const taId = `taex_${container}_${idx}`;
  if (def.type==="code"){
    body += `<textarea id="${taId}" class="ex-input" rows="3" oninput="setText('${container}',${idx},this.value,event)" onkeydown="exerciseTabComplete(event,'${container}',${idx})" ${inst.correct?"disabled":""}>${escapeHtml(inst.text)}</textarea>
    <div id="${taId}_suggest" class="suggest-row"></div>
    <div class="muted" style="margin-top:2px;">${icon("terminal",11)} Tipp: Tab vervollständigt Vorschläge automatisch.</div>`;
  } else if (def.type==="guess"){
    body += `<input class="ex-input" type="text" value="${escapeHtml(inst.text)}" oninput="setText('${container}',${idx},this.value)" ${inst.correct?"disabled":""}/>`;
  } else if (def.type==="mc"){
    body += def.opts.map((o,i)=>`<button class="opt-btn ${inst.selected===i?'selected':''}" onclick="selectOption('${container}',${idx},${i})">${escapeHtml(o)}</button>`).join("");
  } else if (def.type==="order"){
    body += inst.order.map((line,i)=>`
      <div class="order-row">
        <span>${escapeHtml(line)}</span>
        <span class="btns">
          <button class="btn btn-secondary" onclick="moveLine('${container}',${idx},${i},-1)">▲</button>
          <button class="btn btn-secondary" onclick="moveLine('${container}',${idx},${i},1)">▼</button>
        </span>
      </div>`).join("");
  }

  const feedback = inst.answered ? `<div class="feedback-box ${inst.correct?'feedback-right':'feedback-wrong'}">${escapeHtml(inst.feedback)}</div>` : "";
  const hint = inst.showHint ? `<div class="body-text" style="margin-top:10px;">💡 Tipp: ${escapeHtml(def.hint)}</div>` : "";

  return `
  <div class="card exercise-card">
    <div class="section-title">${escapeHtml(def.q)}</div>
    ${body}
    <div style="margin-top:10px; display:flex; gap:10px;">
      <button class="btn btn-secondary" onclick="toggleHint('${container}',${idx})">💡 Tipp anzeigen</button>
      <button class="btn btn-primary" onclick="checkExercise('${container}',${idx})" ${inst.correct?"disabled":""}>Code prüfen ✓</button>
    </div>
    ${hint}
    ${feedback}
  </div>`;
}
