/* ═══════════════════════════════════════════
   JAVASCRIPT (browser)
═══════════════════════════════════════════ */
async function runJS(code){
  clearConsole();
  switchTab('console');

  const logs = [];
  const methods = ['log','error','warn','info'];
  const orig = {};
  methods.forEach(m => {
    orig[m] = console[m];
    console[m] = (...args) => {
      orig[m](...args);
      const txt = args.map(a =>
        typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
      ).join(' ');
      logs.push({ type: m === 'log' ? 'output' : m, txt });
    };
  });

  let err = null;
  try { const fn = new Function(code); await fn(); }
  catch(e){ err = e; }

  methods.forEach(m => console[m] = orig[m]);

  showExecMeta(curLang.label, !err);
  if (!logs.length && !err) appendLine('info', '→ Code ran with no output');
  logs.forEach(l => appendLine(l.type, l.txt));
  if (err){ appendLine('error', '✗ ' + err.toString()); showToast('✗ Runtime error', 'err'); }
  else showToast('✓ Executed', 'ok');
}

/* ═══════════════════════════════════════════
   HTML (iframe)
═══════════════════════════════════════════ */
function runHTML(code){
  document.getElementById('previewFrame').srcdoc = code;
  document.getElementById('tabPrev').style.display = '';
  switchTab('preview');
  clearConsole();
  showExecMeta('HTML', true);
  appendLine('success', '✓ HTML rendered in Preview tab');
  showToast('✓ HTML rendered', 'ok');
}

/* ═══════════════════════════════════════════
   LAZY SCRIPT LOADER
═══════════════════════════════════════════ */
function loadScript(src){
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)){ resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ═══════════════════════════════════════════
   PYTHON — Pyodide (WebAssembly, offline)
═══════════════════════════════════════════ */
let _pyodide = null;

async function getPyodide(){
  if (_pyodide) return _pyodide;
  showLoader(true, '⬇ Downloading Python runtime (~10 MB)…');
  appendLine('info', '⬇ Loading Pyodide (CPython compiled to WASM)…');
  appendLine('info', '→ This only happens once. Please wait…');
  await loadScript('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js');
  showLoader(true, '⚙ Initializing Python runtime…');
  _pyodide = await window.loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'
  });
  return _pyodide;
}

async function runPython(code){
  clearConsole();
  switchTab('console');

  let py;
  try {
    py = await getPyodide();
  } catch(e) {
    showExecMeta('Python', false);
    appendLine('error', '✗ Failed to load Pyodide: ' + e.message);
    appendLine('warn', '→ Internet is needed for first-time download');
    showToast('✗ Pyodide load failed', 'err');
    return;
  }

  // Reset stdout/stderr each run
  py.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);

  let err = null;
  try {
    await py.runPythonAsync(code);
  } catch(e) {
    err = e;
  }

  const stdout = py.runPython('sys.stdout.getvalue()');
  const stderr = py.runPython('sys.stderr.getvalue()');

  const ok = !err && !stderr;
  showExecMeta('Python 3 · Pyodide', ok);

  if (stdout){
    stdout.split('\n').forEach((l, i, a) => {
      if (i === a.length-1 && !l) return;
      appendLine('output', l);
    });
  }
  if (stderr){
    stderr.split('\n').filter(Boolean).forEach(l => appendLine('warn', l));
  }
  if (err){
    appendLine('error', '✗ ' + (err.message || String(err)));
    showToast('✗ Python error', 'err');
  } else {
    if (!stdout && !stderr) appendLine('info', '→ No output');
    showToast('✓ Executed (in-browser)', 'ok');
  }
}

/* ═══════════════════════════════════════════
   LUA — wasmoon (WebAssembly, offline)
═══════════════════════════════════════════ */
let _LuaFactory = null;

async function getLuaFactory(){
  if (_LuaFactory) return _LuaFactory;
  showLoader(true, '⬇ Downloading Lua runtime…');
  const mod = await import('https://cdn.jsdelivr.net/npm/wasmoon@1.16.0/+esm');
  _LuaFactory = mod.LuaFactory;
  return _LuaFactory;
}

async function runLua(code){
  clearConsole();
  switchTab('console');

  let LuaFactory;
  try {
    LuaFactory = await getLuaFactory();
  } catch(e) {
    showExecMeta('Lua', false);
    appendLine('error', '✗ Failed to load wasmoon: ' + e.message);
    appendLine('warn', '→ Internet is needed for first-time download');
    showToast('✗ Lua runtime load failed', 'err');
    return;
  }

  showLoader(true, '⚙ Running Lua…');

  let engine;
  try {
    const factory = new LuaFactory();
    engine = await factory.createEngine();
  } catch(e) {
    showExecMeta('Lua', false);
    appendLine('error', '✗ Engine init failed: ' + e.message);
    showToast('✗ Lua error', 'err');
    return;
  }

  const outputs = [];

  // Capture print
  engine.global.set('print', (...args) =>
    outputs.push(args.map(a => a == null ? 'nil' : String(a)).join('\t'))
  );

  // Capture io.write with line buffering
  const preamble = `
local _wbuf = ""
local _raw_print = print
io = io or {}
io.write = function(...)
  for _, v in ipairs({...}) do _wbuf = _wbuf .. tostring(v) end
  while true do
    local nl = _wbuf:find("\\n")
    if not nl then break end
    _raw_print(_wbuf:sub(1, nl - 1))
    _wbuf = _wbuf:sub(nl + 1)
  end
end
io.read = function() return "" end
`;

  let err = null;
  try {
    await engine.doString(preamble + code);
    // flush remaining io.write buffer
    const buf = engine.global.get('_wbuf');
    if (buf && buf !== '') outputs.push(buf);
  } catch(e) {
    err = e;
  }

  try { engine.global.close(); } catch(_){}

  const ok = !err;
  showExecMeta('Lua 5.4 · wasmoon', ok);
  outputs.forEach(l => appendLine('output', l));
  if (err){
    const msg = String(err.message || err).replace(/\[string.*?\]:/g, 'line');
    appendLine('error', '✗ ' + msg);
    showToast('✗ Lua error', 'err');
  } else {
    if (!outputs.length) appendLine('info', '→ No output');
    showToast('✓ Executed (in-browser)', 'ok');
  }
}


