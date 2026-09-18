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
