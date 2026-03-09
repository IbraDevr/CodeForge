/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
let curLang   = LANGS[0];
let editor    = null;
let running   = false;
let activeTab = 'console';
let openedFile = null;

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
function init(){
  // Build language tab buttons
  const tabsEl = document.getElementById('langTabs');
  LANGS.forEach(l => {
    const b = document.createElement('button');
    b.className = 'ltab' + (l.id === curLang.id ? ' on' : '');
    b.id = 'ltab-' + l.id;
    let badge = '';
    if (!l.piston)
      badge = `<span class="eng-badge wasm" title="Runs offline in-browser">${l.id==='javascript'?'JS':l.id==='html'?'HTML':'WASM'}</span>`;
    else
      badge = `<span class="eng-badge api-chk" id="badge-${l.id}" title="Needs Piston API">API…</span>`;
    b.innerHTML = `<span class="dot" style="background:${l.dot}"></span>${l.label}${badge}`;
    b.onclick = () => selectLang(l);
    tabsEl.appendChild(b);
  });

  // Init CodeMirror
  editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
    mode: curLang.cm,
    theme: 'material-darker',
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    indentUnit: 2, tabSize: 2, indentWithTabs: false,
    extraKeys: {
      'Ctrl-Enter': runCode,
      'Cmd-Enter':  runCode,
      'Ctrl-/':     cm => cm.toggleComment(),
      'Ctrl-O':     () => document.getElementById('fileInput').click(),
    }
  });
  editor.setValue(curLang.code);

  // Cursor position
  editor.on('cursorActivity', () => {
    const c = editor.getCursor();
    document.getElementById('cursorPos').textContent = `${c.line+1}:${c.ch+1}`;
  });

  // Keep CM filling its container when resized
  const ro = new ResizeObserver(() => editor.refresh());
  ro.observe(document.getElementById('editorWrap'));
  setTimeout(() => editor.refresh(), 80);

  // Setup drag splitter
  initSplitter();

  // File input change
  document.getElementById('fileInput').addEventListener('change', e => {
    if (e.target.files[0]) loadFile(e.target.files[0]);
  });

  // Drag & drop anywhere on page
  initDragDrop();

  // Check Piston API & detect runtimes (non-blocking)
  connectPiston();
}

/* ═══════════════════════════════════════════
   DRAGGABLE SPLITTER
═══════════════════════════════════════════ */
function initSplitter(){
  const splitter  = document.getElementById('splitter');
  const mainEl    = document.getElementById('main');
  const edPanel   = document.getElementById('editorPanel');
  let dragging = false, startX = 0, startW = 0;

  const isMobile = () => window.innerWidth <= 700;

  splitter.addEventListener('mousedown', e => {
    dragging = true;
    startX   = e.clientX;
    startW   = edPanel.getBoundingClientRect().width;
    splitter.classList.add('dragging');
    document.body.style.cursor = isMobile() ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const mainW = mainEl.getBoundingClientRect().width;
    let newW = startW + (e.clientX - startX);
    newW = Math.max(200, Math.min(newW, mainW - 200));
    edPanel.style.flex = `0 0 ${newW}px`;
    editor.refresh();
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    splitter.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    editor.refresh();
  });

  // Touch support
  splitter.addEventListener('touchstart', e => {
    dragging = true;
    startX = e.touches[0].clientX;
    startW = edPanel.getBoundingClientRect().width;
    e.preventDefault();
  }, {passive:false});

  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    const mainW = mainEl.getBoundingClientRect().width;
    let newW = startW + (e.touches[0].clientX - startX);
    newW = Math.max(180, Math.min(newW, mainW - 180));
    edPanel.style.flex = `0 0 ${newW}px`;
    editor.refresh();
  });

  document.addEventListener('touchend', () => { dragging = false; });
}

/* ═══════════════════════════════════════════
   FILE OPEN — DRAG & DROP
═══════════════════════════════════════════ */
function initDragDrop(){
  const dz = document.getElementById('dropZone');
  let dragCounter = 0;

  document.addEventListener('dragenter', e => {
    if (e.dataTransfer.types.includes('Files')){
      dragCounter++;
      dz.classList.add('show');
    }
  });
  document.addEventListener('dragleave', () => {
    dragCounter--;
    if (dragCounter <= 0){ dragCounter = 0; dz.classList.remove('show'); }
  });
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => {
    e.preventDefault();
    dragCounter = 0;
    dz.classList.remove('show');
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  });
}

/* ═══════════════════════════════════════════
   LOAD FILE
═══════════════════════════════════════════ */
const EXT_LANG_MAP = {
  js:'javascript', mjs:'javascript',
  html:'html', htm:'html',
  py:'python',
  cpp:'cpp', cc:'cpp', cxx:'cpp',
  c:'c',
  java:'java',
  lua:'lua',
  rs:'rust',
  go:'go',
  rb:'ruby',
  php:'php',
  sh:'bash', bash:'bash',
};

function loadFile(file){
  const ext = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();
  reader.onload = e => {
    const content = e.target.result;
    const matchId = EXT_LANG_MAP[ext];
    const matchLang = matchId ? LANGS.find(l => l.id === matchId) : null;

    if (matchLang && matchLang.id !== curLang.id){
      // Switch language silently
      document.getElementById('ltab-' + curLang.id).classList.remove('on');
      document.getElementById('ltab-' + matchLang.id).classList.add('on');
      curLang = matchLang;
      editor.setOption('mode', matchLang.cm);
      document.getElementById('langBadge').textContent = matchLang.label.toLowerCase();
      document.getElementById('slang').textContent = matchLang.label;
      if (matchLang.id === 'html'){
        document.getElementById('tabPrev').style.display = '';
      } else {
        document.getElementById('tabPrev').style.display = 'none';
        if (activeTab === 'preview') switchTab('console');
      }
    }

    editor.setValue(content);
    openedFile = file.name;

    // Show file name in header
    const fl = document.getElementById('fileLabel');
    fl.textContent = '📄 ' + file.name;
    fl.style.display = '';

    // Status bar
    const sf = document.getElementById('sfileStat');
    sf.textContent = '📄 ' + file.name;
    sf.style.display = '';

    clearOutput();
    showToast(`📂 Opened: ${file.name}`, 'ok');
    document.getElementById('fileInput').value = '';
    editor.refresh();
  };
  reader.readAsText(file);
}

/* ═══════════════════════════════════════════
   LANGUAGE SELECT
═══════════════════════════════════════════ */
function selectLang(lang){
  if (lang.id === curLang.id) return;
  const cur = editor.getValue();
  const dirty = cur !== curLang.code && cur.trim() !== '';
  if (dirty && !confirm(`Switch to ${lang.label}? Current code will be replaced.`)) return;

  document.getElementById('ltab-' + curLang.id).classList.remove('on');
  document.getElementById('ltab-' + lang.id).classList.add('on');
  curLang = lang;
  editor.setOption('mode', lang.cm);
  editor.setValue(lang.code);
  document.getElementById('langBadge').textContent = lang.label.toLowerCase();
  document.getElementById('slang').textContent = lang.label;

  // Clear opened file label when manually switching
  openedFile = null;
  document.getElementById('fileLabel').style.display = 'none';
  document.getElementById('sfileStat').style.display = 'none';

  clearOutput();

  if (lang.id === 'html'){
    document.getElementById('tabPrev').style.display = '';
  } else {
    document.getElementById('tabPrev').style.display = 'none';
    if (activeTab === 'preview') switchTab('console');
  }
}

/* ═══════════════════════════════════════════
   RUN CODE
═══════════════════════════════════════════ */
async function runCode(){
  if (running) return;
  const code = editor.getValue().trim();
  if (!code){ showToast('⚠ No code to run', 'err'); return; }

  running = true;
  const btn = document.getElementById('runBtn');
  btn.disabled = true;
  btn.innerHTML = '⏳ Running';

  setStatus('run', 'Executing…');
  showLoader(true, `Running ${curLang.label}…`);
  const t0 = Date.now();

  try {
    if (curLang.id === 'javascript') await runJS(code);
    else if (curLang.id === 'html')   runHTML(code);
    else if (curLang.id === 'python') await runPython(code);
    else if (curLang.id === 'lua')    await runLua(code);
    else                              await runPiston(code);
  } catch(e) {
    appendLine('error', '⚠ ' + e.message);
  }

  const elapsed = ((Date.now() - t0)/1000).toFixed(2);
  document.getElementById('stime').textContent = elapsed + 's';

  showLoader(false);
  running = false;
  btn.disabled = false;
  btn.innerHTML = '▶ Run <small style="opacity:.55;font-weight:400;font-size:.65rem">Ctrl+↵</small>';
  setStatus('idle', 'Done');
}

