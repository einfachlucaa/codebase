/* ---------- AUTO-PAIRING: Klammern & Anführungszeichen ----------
   Gemeinsam genutzt von der Projekte-IDE und den Code-Aufgaben in Lektionen.
   onChanged(newValue) wird aufgerufen, wenn sich durch die Automatik etwas
   geändert hat, damit der Aufrufer seinen eigenen State synchron hält. */
const AUTOPAIR_MAP = { "(":")", "[":"]", "{":"}", '"':'"', "'":"'" };
const AUTOPAIR_CLOSERS = [")","]","}",'"',"'"];
function handleAutoPair(ev, onChanged){
  const ta = ev.target;
  const key = ev.key;

  if (AUTOPAIR_MAP[key]){
    const start = ta.selectionStart, end = ta.selectionEnd;
    const closing = AUTOPAIR_MAP[key];
    ev.preventDefault();
    if (start !== end){
      // Markierten Text mit dem Paar umschließen, statt ihn zu ersetzen.
      const selected = ta.value.slice(start, end);
      ta.value = ta.value.slice(0, start) + key + selected + closing + ta.value.slice(end);
      ta.selectionStart = start + 1; ta.selectionEnd = start + 1 + selected.length;
    } else {
      ta.value = ta.value.slice(0, start) + key + closing + ta.value.slice(start);
      ta.selectionStart = ta.selectionEnd = start + 1;
    }
    onChanged(ta.value);
    return true;
  }

  if (AUTOPAIR_CLOSERS.includes(key) && ta.selectionStart===ta.selectionEnd){
    // Schließendes Zeichen direkt vor dem Cursor? Dann nur drüberspringen,
    // statt ein zweites einzufügen (so gibt's nie "doppelte" Klammern).
    const pos = ta.selectionStart;
    if (ta.value[pos]===key){
      ev.preventDefault();
      ta.selectionStart = ta.selectionEnd = pos+1;
      return true;
    }
  }

  if (key==="Backspace" && ta.selectionStart===ta.selectionEnd){
    // Löscht man direkt zwischen einem automatisch erzeugten Paar, werden
    // beide Zeichen auf einmal entfernt (fühlt sich sonst "klebrig" an).
    const pos = ta.selectionStart;
    if (pos>0){
      const before = ta.value[pos-1], after = ta.value[pos];
      if (AUTOPAIR_MAP[before]===after){
        ev.preventDefault();
        ta.value = ta.value.slice(0, pos-1) + ta.value.slice(pos+1);
        ta.selectionStart = ta.selectionEnd = pos-1;
        onChanged(ta.value);
        return true;
      }
    }
  }
  return false;
}

/* ---------- CLIENTSEITIGE CODE-AUSFÜHRUNG ----------
   Kein externer Dienst mehr nötig (Piston ist seit Feb. 2026 nicht mehr frei
   zugänglich). JavaScript läuft in einem streng gesandboxten iframe
   (sandbox="allow-scripts", KEIN allow-same-origin -> vollständig isoliert,
   kann weder auf die Seite noch auf Cookies/Storage zugreifen). Python läuft
   über Pyodide, einen echten Python-Interpreter als WebAssembly, direkt im
   Browser — ebenfalls ohne jede Server-Beteiligung. */

function runJsSandboxed(code){
  return new Promise((resolve)=>{
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.setAttribute("sandbox", "allow-scripts"); // bewusst OHNE allow-same-origin
    document.body.appendChild(iframe);

    const timeout = setTimeout(()=>{
      cleanup();
      resolve({ stdout:"", stderr:"Zeitüberschreitung (5s) — evtl. eine Endlosschleife?" });
    }, 5000);
    function handler(ev){
      if (ev.source !== iframe.contentWindow) return;
      clearTimeout(timeout);
      cleanup();
      resolve(ev.data);
    }
    function cleanup(){
      window.removeEventListener("message", handler);
      setTimeout(()=>iframe.remove(), 0);
    }
    window.addEventListener("message", handler);

    const safeCode = String(code).replace(/<\/script/gi, "<\\/script");
    iframe.srcdoc = `<script>
      const __logs = [];
      const __fmt = (a) => { try { return typeof a==="object" ? JSON.stringify(a) : String(a); } catch { return String(a); } };
      console.log = console.info = console.warn = (...args) => { __logs.push(args.map(__fmt).join(" ")); };
      console.error = (...args) => { __logs.push("[Fehler] " + args.map(__fmt).join(" ")); };
      let __err = "";
      try {
        ${safeCode}
      } catch(e) { __err = e.message || String(e); }
      parent.postMessage({ stdout: __logs.join("\\n"), stderr: __err }, "*");
    <\/script>`;
  });
}

let _pyodidePromise = null;
function loadPyodideOnce(){
  if (_pyodidePromise) return _pyodidePromise;
  _pyodidePromise = new Promise((resolve, reject)=>{
    if (window.loadPyodide) return resolve();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Python-Umgebung (Pyodide) konnte nicht geladen werden. Internetverbindung prüfen."));
    document.head.appendChild(s);
  }).then(()=>window.loadPyodide());
  return _pyodidePromise;
}
async function runPython(code){
  let pyodide;
  try{ pyodide = await loadPyodideOnce(); }
  catch(err){ return { stdout:"", stderr: err.message }; }

  // stdout/stderr über Python's eigene io.StringIO umleiten -> robust über
  // verschiedene Pyodide-Versionen hinweg, statt auf eine spezielle JS-API zu setzen.
  pyodide.runPython("import sys, io\nsys.stdout = io.StringIO()\nsys.stderr = io.StringIO()");
  let runtimeError = "";
  try{
    await pyodide.runPythonAsync(code);
  } catch(e){
    runtimeError = String(e.message || e);
  }
  const stdout = pyodide.runPython("sys.stdout.getvalue()");
  const stderrCaptured = pyodide.runPython("sys.stderr.getvalue()");
  return { stdout, stderr: [stderrCaptured, runtimeError].filter(Boolean).join("\n") };
}

/* ---------- LUA (via Fengari — reine JS-Lua-VM, ebenfalls komplett im Browser) ----------
   HINWEIS: Konnte in dieser Sandbox nicht live gegen echten Netzwerkzugriff
   getestet werden. Die verwendete API folgt exakt der offiziellen Fengari-
   Dokumentation (github.com/fengari-lua/fengari) — bei Problemen bitte die
   genaue Fehlermeldung melden. */
let _fengariPromise = null;
function loadFengariOnce(){
  if (_fengariPromise) return _fengariPromise;
  _fengariPromise = new Promise((resolve, reject)=>{
    if (window.fengari) return resolve();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Lua-Umgebung (Fengari) konnte nicht geladen werden. Internetverbindung prüfen."));
    document.head.appendChild(s);
  });
  return _fengariPromise;
}
async function runLua(code){
  try{ await loadFengariOnce(); }
  catch(err){ return { stdout:"", stderr: err.message }; }
  try{
    const { lua, lauxlib, lualib, to_luastring } = fengari;
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);
    let output = "";
    // Globales print() umbiegen, damit wir die Ausgabe einsammeln können,
    // statt sie (wie fengari-web es standardmäßig tut) direkt auf die Seite zu schreiben.
    lua.lua_pushjsfunction(L, (Ls)=>{
      const n = lua.lua_gettop(Ls);
      const parts = [];
      for (let i=1; i<=n; i++) parts.push(lua.lua_tojsstring(Ls, i));
      output += parts.join("\t") + "\n";
      return 0;
    });
    lua.lua_setglobal(L, "print");

    const status = lauxlib.luaL_dostring(L, to_luastring(code));
    if (status !== lua.LUA_OK){
      const errMsg = lua.lua_tojsstring(L, -1);
      return { stdout: output, stderr: String(errMsg) };
    }
    return { stdout: output, stderr: "" };
  } catch(e){
    return { stdout:"", stderr: "Lua-Fehler: " + (e.message||String(e)) };
  }
}
