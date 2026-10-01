/* ---------- CUSTOM MODALS ----------
   Ersetzt window.alert/confirm/prompt durch In-App-Dialoge im App-Design.
   Alle drei geben ein Promise zurück, genau wie man es von confirm()/prompt()
   gewohnt ist (nur eben "await" statt synchron blockierend). */
function customAlert(message, title){
  return new Promise((resolve)=>{
    state.modal = { kind:"alert", title: title||"Hinweis", message, resolve };
    render();
  });
}
function customConfirm(message, title){
  return new Promise((resolve)=>{
    state.modal = { kind:"confirm", title: title||"Bist du sicher?", message, resolve };
    render();
  });
}
function customPrompt(message, defaultValue, title){
  return new Promise((resolve)=>{
    state.modal = { kind:"prompt", title: title||"Eingabe", message, value: defaultValue||"", resolve };
    render();
  });
}
function _resolveModal(result){
  const m = state.modal;
  if (!m) return;
  state.modal = null;
  render();
  m.resolve(result);
}
function renderModal(){
  const m = state.modal;
  if (!m) return "";
  let body = "";
  if (m.kind==="prompt"){
    body = `<input id="modalPromptInput" type="text" value="${escapeHtml(m.value)}" style="width:100%; margin-top:12px;"
      onkeydown="if(event.key==='Enter')_resolveModal(document.getElementById('modalPromptInput').value)"/>`;
  }
  const buttons = m.kind==="alert"
    ? `<button class="btn btn-primary" style="width:100%;" onclick="_resolveModal(true)">OK</button>`
    : m.kind==="confirm"
    ? `<div style="display:flex; gap:10px;">
        <button class="btn btn-secondary" style="flex:1;" onclick="_resolveModal(false)">Abbrechen</button>
        <button class="btn btn-primary" style="flex:1;" onclick="_resolveModal(true)">Bestätigen</button>
      </div>`
    : `<div style="display:flex; gap:10px; margin-top:14px;">
        <button class="btn btn-secondary" style="flex:1;" onclick="_resolveModal(null)">Abbrechen</button>
        <button class="btn btn-primary" style="flex:1;" onclick="_resolveModal(document.getElementById('modalPromptInput').value)">OK</button>
      </div>`;
  const overlayClick = m.kind==="alert" ? `onclick="if(event.target===this)_resolveModal(true)"` : "";
  return `
  <div class="modal-overlay" ${overlayClick}>
    <div class="modal-box">
      <div class="section-title" style="margin-bottom:8px;">${escapeHtml(m.title)}</div>
      <div class="body-text">${escapeHtml(m.message)}</div>
      ${body}
      <div style="margin-top:18px;">${buttons}</div>
    </div>
  </div>`;
}
