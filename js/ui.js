/* ═══════════════════════════════════════════
   OUTPUT HELPERS
═══════════════════════════════════════════ */
function clearConsole(){
  const v = document.getElementById('consoleView');
  v.innerHTML = '';
}

function clearOutput(){
  clearConsole();
  // Re-add empty state
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.id = 'emptyState';
  empty.innerHTML = `<div class="empty-icon">▣</div><div>Press ▶ Run to execute</div><div class="empty-sub">Ctrl + Enter shortcut</div>`;
  document.getElementById('consoleView').appendChild(empty);
  document.getElementById('previewFrame').srcdoc = '';
  document.getElementById('stime').textContent = '';
}

function appendLine(type, text){
  const v = document.getElementById('consoleView');
  const empty = document.getElementById('emptyState');
  if (empty) empty.remove();

  const pre = {output:'›', error:'✗', warn:'⚠', info:'·', success:'✓'};
  const line = document.createElement('div');
  line.className = 'cline ' + type;
  line.innerHTML = `<span class="cpre">${pre[type]||'›'}</span><span class="cval">${escHtml(text)}</span>`;
  v.appendChild(line);
  v.scrollTop = v.scrollHeight;
}

function showExecMeta(label, ok){
  const v = document.getElementById('consoleView');
  const empty = document.getElementById('emptyState');
  if (empty) empty.remove();

  const m = document.createElement('div');
  m.className = 'exec-meta';
  m.innerHTML = `<span class="ebadge ${ok?'eok':'eerr'}">${ok?'OK':'ERROR'}</span>
    <span>${label}</span><span style="color:var(--t3)">•</span>
    <span>${new Date().toLocaleTimeString()}</span>`;
  v.appendChild(m);

  const sep = document.createElement('hr');
  sep.className = 'csep';
  v.appendChild(sep);
}

function escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ═══════════════════════════════════════════
   TAB SWITCH
═══════════════════════════════════════════ */
function switchTab(tab){
  activeTab = tab;
  document.getElementById('tabCon').classList.toggle('on', tab==='console');
  document.getElementById('tabPrev').classList.toggle('on', tab==='preview');
  document.getElementById('consoleView').classList.toggle('on', tab==='console');
  document.getElementById('previewView').classList.toggle('on', tab==='preview');
}

/* ═══════════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════════ */
function showLoader(show, txt='Running…'){
  document.getElementById('loaderText').textContent = txt;
  document.getElementById('loader').classList.toggle('on', show);
}

function setStatus(state, txt){
  document.getElementById('sdot').className = 'sdot' + (state==='run' ? ' run' : '');
  document.getElementById('stext').textContent = txt;
}

let _toastTimer;
function showToast(msg, type='ok'){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.className = 'toast', 2600);
}

/* ═══════════════════════════════════════════
   START
═══════════════════════════════════════════ */
window.addEventListener('load', init);
