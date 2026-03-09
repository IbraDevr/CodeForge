/* ═══════════════════════════════════════════
   WANDBOX API — FREE, NO AUTH REQUIRED
   https://wandbox.org
═══════════════════════════════════════════ */
const WANDBOX_URL  = 'https://wandbox.org/api/compile.json';
const WANDBOX_LIST = 'https://wandbox.org/api/list.json';

// Keyed by curLang.ID (not piston name) to avoid mismatch
// Candidates ordered by preference — first available wins
const WANDBOX_CFG = {
  cpp:  { candidates: ['gcc-head','gcc-13.2.0','gcc-12.3.0','clang-head','clang-17.0.1'], filename: 'main.cpp' },
  c:    { candidates: ['gcc-head','gcc-13.2.0','gcc-12.3.0'],                             filename: 'main.c',   options: '-x c -std=c17' },
  java: { candidates: ['openjdk-head','openjdk-jdk-21+35','openjdk-jdk-17+35'],            filename: 'Main.java' },
  rust: { candidates: ['rust-head','rust-1.70.0','rust-1.65.0'],                           filename: 'main.rs'   },
  go:   { candidates: ['go-head','go-1.21.0','go-1.20.5'],                                 filename: 'main.go'   },
  ruby: { candidates: ['ruby-head','ruby-3.2.2','ruby-3.1.4'],                             filename: 'main.rb'   },
  php:  { candidates: ['php-head','php-8.2.7','php-8.1.22'],                               filename: 'main.php'  },
  bash: { candidates: ['bash','bash-5.2.15','bash-5.1.16'],                                filename: 'main.sh'   },
};

// Resolved compiler names (filled by connectPiston)
const wandboxCompilers = {};  // langId → compiler string
let wandboxOnline = false;

/* ── connectPiston — fetch compiler list, resolve best per language ── */
async function connectPiston(){
  setApiStatus('checking', 'API…');
  let list = null;

  try {
    const res = await fetchWithTimeout(WANDBOX_LIST, {}, 9000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    list = await res.json();
  } catch(e) {
    // List fetch failed — mark offline but don't block execution
    wandboxOnline = false;
    Object.keys(WANDBOX_CFG).forEach(lid => updateBadge(lid, 'offline'));
    setApiStatus('offline', 'API Offline');
    showToast('⚠ Wandbox unreachable — retrying on run', 'err');
    return;
  }

  const available = new Set(list.map(c => c.name));
  let found = 0;

  Object.entries(WANDBOX_CFG).forEach(([lid, cfg]) => {
    const match = cfg.candidates.find(c => available.has(c));
    wandboxCompilers[lid] = match || cfg.candidates[0]; // fallback to first even if not confirmed
    updateBadge(lid, match ? 'ok' : 'offline');
    if (match) found++;
  });

  wandboxOnline = true;
  setApiStatus('online', `API Online · ${found} langs`);
  showToast(`✓ Wandbox API connected (${found} compilers)`, 'ok');
}

/* ── fetch with timeout ── */
function fetchWithTimeout(url, opts={}, ms=10000){
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, {...opts, signal: ctrl.signal}).finally(() => clearTimeout(timer));
}

/* ── setApiStatus ── */
function setApiStatus(state, text){
  const dot = document.getElementById('sapiDot');
  const txt = document.getElementById('sapiText');
  if (!dot || !txt) return;
  const colors = { online:'var(--green)', offline:'var(--red)', checking:'var(--yellow)' };
  dot.style.background = colors[state] || 'var(--t3)';
  txt.textContent = text;
}

/* ── updateBadge ── */
function updateBadge(lid, state){
  const el = document.getElementById('badge-' + lid);
  if (!el) return;
  const map = {
    ok:      ['api-chk','api-off','api-ok',  'API ✓'],
    offline: ['api-chk','api-ok', 'api-off', 'API ✗'],
    checking:['api-ok', 'api-off','api-chk', 'API…'],
  };
  const [rm1,rm2,add,lbl] = map[state] || map.checking;
  el.classList.remove(rm1, rm2);
  el.classList.add(add);
  el.textContent = lbl;
  el.title = state === 'ok'
    ? `Wandbox: ${wandboxCompilers[lid] || 'available'}`
    : state === 'offline' ? 'Compiler not found on Wandbox'
    : 'Checking Wandbox API…';
}

/* ── runPiston → Wandbox execution ── */
async function runPiston(code){
  clearConsole();
  switchTab('console');

  const lid = curLang.id;   // use lang ID, not piston name
  const cfg = WANDBOX_CFG[lid];
  if (!cfg){
    appendLine('error', `Language "${curLang.label}" is not configured for API execution`);
    return;
  }

  // Get resolved compiler or fallback
  const compiler = wandboxCompilers[lid] || cfg.candidates[0];

  if (!wandboxOnline){
    appendLine('warn', '⚠ API was offline at startup — attempting now…');
  }

  appendLine('info', `· Sending to Wandbox API (${compiler})…`);

  let data = null;
  let lastErr = null;
  const maxRetries = 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++){
    try {
      // Java: Wandbox always saves main code as "prog.java"
      // Java enforces public class name == filename, so strip "public" from class declarations
      // This lets code run without filename mismatch. Methods/fields stay unaffected.
      const sendCode = lid === 'java'
        ? code.replace(/\bpublic(\s+)(class|interface|enum)\b/g, '$2')
        : code;

      // Java requires codes[] array with exact filename "Main.java"
      // All other languages use plain "code" field
      const body = { compiler, code: sendCode, stdin: '', save: false };

      if (cfg.options) body['compiler-option-raw'] = cfg.options;

      const res = await fetchWithTimeout(WANDBOX_URL, {
        method:  'POST',
        headers: {'Content-Type': 'application/json'},
        body:    JSON.stringify(body)
      }, 20000);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
      break;

    } catch(e){
      lastErr = e;
      if (attempt < maxRetries){
        appendLine('warn', `⟳ Attempt ${attempt} failed (${e.message}) — retrying…`);
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  if (!data){
    showExecMeta(curLang.label, false);
    appendLine('error', `✗ All ${maxRetries} attempts failed: ${lastErr?.message}`);
    appendLine('info',  '· Check your internet connection');
    appendLine('info',  '· API: wandbox.org — free, no account needed');
    // Mark offline and update badges
    wandboxOnline = false;
    setApiStatus('offline', 'API Offline');
    Object.keys(WANDBOX_CFG).forEach(l => updateBadge(l, 'offline'));
    showToast('✗ API unreachable', 'err');
    return;
  }

  // SUCCESS — update status to online
  wandboxOnline = true;
  setApiStatus('online', 'API Online');
  updateBadge(lid, 'ok');

  const exitCode   = parseInt(data.status ?? '0', 10);
  const progOut    = data.program_output  || '';
  const compileOut = data.compiler_output || '';
  const compileErr = data.compiler_error  || '';
  const progErr    = data.program_error   || '';
  const ok         = exitCode === 0 && !compileErr;

  showExecMeta(`${curLang.label} · ${compiler}`, ok);

  if (compileOut) compileOut.split('\n').filter(Boolean).forEach(l => appendLine('info',  l));
  if (compileErr) compileErr.split('\n').filter(Boolean).forEach(l => appendLine('error', l));

  if (progOut){
    progOut.split('\n').forEach((l,i,a) => {
      if (i === a.length-1 && !l) return;
      appendLine('output', l);
    });
  }
  if (progErr) progErr.split('\n').filter(Boolean).forEach(l => appendLine('error', l));
  if (exitCode !== 0) appendLine('warn', `↳ Exit code ${exitCode}`);

  if (!progOut && !compileErr && !progErr && ok) appendLine('info', '→ No output');

  if (ok) showToast('✓ Executed via Wandbox', 'ok');
  else    showToast('✗ Execution error', 'err');
}

