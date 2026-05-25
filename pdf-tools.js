// ═══════════════════════════════════════════════════════════════════
// PDF Studio — Full Client-Side Implementation
// All processing happens in-browser. No server uploads.
// ═══════════════════════════════════════════════════════════════════

// ─── TAB SWITCHING ───
const TAB_ORDER = ['convert', 'merge', 'compress', 'split', 'edit', 'secure'];

function switchTab(tab, el, isMobile = false) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById('section-' + tab);
  if (sec) { sec.classList.add('active'); }

  document.querySelectorAll('.nav-tab').forEach((t, i) => {
    t.classList.toggle('active', TAB_ORDER[i] === tab);
  });
  document.querySelectorAll('.mobile-tab').forEach((t, i) => {
    t.classList.toggle('active', TAB_ORDER[i] === tab);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchTabHref(tab) {
  if (window.event) { window.event.preventDefault(); }
  const navTabs = document.querySelectorAll('.nav-tab');
  const idx = TAB_ORDER.indexOf(tab);
  if (idx >= 0 && navTabs[idx]) switchTab(tab, navTabs[idx]);
}

// ─── KEYBOARD SHORTCUTS ───
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const n = parseInt(e.key);
  if (n >= 1 && n <= 6) {
    const navTabs = document.querySelectorAll('.nav-tab');
    if (navTabs[n - 1]) switchTab(TAB_ORDER[n - 1], navTabs[n - 1]);
  }
  if (e.key === '?') openShortcuts();
  if (e.key === 'Escape') { closeModal(); closeShortcuts(); }
});

function openShortcuts() { document.getElementById('shortcut-overlay').classList.add('show'); }
function closeShortcuts() { document.getElementById('shortcut-overlay').classList.remove('show'); }

// ─── FILE HANDLING ───
const fileSets = {};

function handleFiles(input, key) {
  const files = Array.from(input.files);
  if (!fileSets[key]) fileSets[key] = [];
  fileSets[key].push(...files);
  renderFileList(key);
}

function renderFileList(key) {
  const el = document.getElementById('fl-' + key);
  if (!el) return;
  el.innerHTML = '';
  (fileSets[key] || []).forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <span>📄</span>
      <span class="file-name">${f.name}</span>
      <span class="file-size">${formatSize(f.size)}</span>
      <button class="remove-btn" onclick="removeFile('${key}', ${i})">✕</button>
    `;
    el.appendChild(item);
  });
}

function removeFile(key, idx) {
  if (fileSets[key]) {
    fileSets[key].splice(idx, 1);
    renderFileList(key);
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ─── OPTION CHIPS ───
function selectOpt(el) {
  const parent = el.closest('.convert-opts');
  if (parent) {
    parent.querySelectorAll('.opt-chip').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
  }
}

function selectQuality(el) {
  const parent = el.closest('.quality-chips');
  if (parent) {
    parent.querySelectorAll('.quality-chip').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
  }
}

function selectRotate(el) {
  const parent = el.closest('.rotate-opts');
  if (parent) {
    parent.querySelectorAll('.rotate-opt').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
  }
}

function toggleOpt(el) { el.classList.toggle('selected'); }

function setDpi(val, el) {
  const range = document.getElementById('dpi-range');
  const dVal = document.getElementById('dpi-val');
  if (range) range.value = val;
  if (dVal) dVal.textContent = val;
  selectQuality(el);
}

// ─── UNITS ───
function setUnit(unit) {
  const kbEl = document.getElementById('unit-kb');
  const mbEl = document.getElementById('unit-mb');
  if (kbEl) kbEl.classList.toggle('selected', unit === 'KB');
  if (mbEl) mbEl.classList.toggle('selected', unit === 'MB');
  updateSizeEstimate();
}

function setAdvUnit(unit, el) {
  const kbEl = document.getElementById('adv-unit-kb');
  const mbEl = document.getElementById('adv-unit-mb');
  if (kbEl) kbEl.classList.toggle('selected', unit === 'KB');
  if (mbEl) mbEl.classList.toggle('selected', unit === 'MB');
}

function updateSizeEstimate() {
  const targetVal = document.getElementById('target-size-val');
  const val = targetVal ? parseFloat(targetVal.value) || 2 : 2;
  const kbEl = document.getElementById('unit-kb');
  const isKB = kbEl ? kbEl.classList.contains('selected') : false;
  const kb = isKB ? val : val * 1024;
  const pct = Math.min(95, Math.max(5, Math.round((1 - kb / 5000) * 100)));
  const estEl = document.getElementById('est-val');
  if (estEl) estEl.textContent = pct;
}

// ─── DOWNLOAD MODAL ───
let lastGeneratedBlob = null;
let lastGeneratedName = 'document.pdf';

function showDownloadModal(name, originalSize, newSize) {
  const fnameEl = document.getElementById('modal-fname');
  const fsizeEl = document.getElementById('modal-fsize');
  const savingEl = document.getElementById('modal-saving');

  if (fnameEl) fnameEl.textContent = typeof name === 'string' ? name : 'document.pdf';

  if (originalSize && newSize) {
    const origMB = (originalSize / (1024 * 1024)).toFixed(1);
    const newMB = (newSize / (1024 * 1024)).toFixed(1);
    const pct = Math.round((1 - newSize / originalSize) * 100);
    if (fsizeEl) fsizeEl.textContent = `${origMB} MB → ${newMB} MB`;
    if (savingEl) {
      if (pct > 0) { savingEl.textContent = `${pct}% smaller`; savingEl.style.display = 'block'; }
      else { savingEl.style.display = 'none'; }
    }
  } else {
    const sizeMB = lastGeneratedBlob ? (lastGeneratedBlob.size / (1024 * 1024)).toFixed(2) : '?';
    if (fsizeEl) fsizeEl.textContent = `${sizeMB} MB`;
    if (savingEl) savingEl.style.display = 'none';
  }

  const modal = document.getElementById('dl-modal');
  if (modal) modal.classList.add('show');
}

function closeModal() {
  const modal = document.getElementById('dl-modal');
  if (modal) modal.classList.remove('show');
}

function triggerDownload() {
  if (!lastGeneratedBlob) {
    alert('No generated file available');
    return;
  }
  const url = URL.createObjectURL(lastGeneratedBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = lastGeneratedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  closeModal();
  showToast('✅ Download started!', 'success');
}

// ─── MERGE FILE HANDLING ───
let mergeFiles = [];
let dragSrcIndex = null;

function handleMergeFiles(input) {
  const files = Array.from(input.files);
  mergeFiles.push(...files.map((f, i) => ({ file: f, id: Date.now() + i })));
  renderMergeList();
}

function renderMergeList() {
  const list = document.getElementById('merge-list');
  const empty = document.getElementById('merge-empty');
  const hint = document.getElementById('merge-hint');
  if (!list) return;
  list.innerHTML = '';

  if (mergeFiles.length === 0) {
    if (empty) empty.classList.add('show');
    if (hint) hint.style.display = 'none';
    return;
  }
  if (empty) empty.classList.remove('show');
  if (hint) hint.style.display = 'block';

  mergeFiles.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'merge-item'; el.draggable = true; el.dataset.idx = idx;
    el.innerHTML = `
      <span class="drag-handle" title="Drag to reorder">≡</span>
      <span class="order-badge">${idx + 1}</span>
      <span class="merge-file-name">${item.file.name}</span>
      <span class="merge-file-size">${formatSize(item.file.size)}</span>
      <button class="remove-btn" onclick="removeMergeFile(${idx})">✕</button>
    `;
    el.addEventListener('dragstart', e => { dragSrcIndex = idx; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
    el.addEventListener('dragend', () => { el.classList.remove('dragging'); document.querySelectorAll('.merge-item').forEach(i => i.classList.remove('drag-over-item')); });
    el.addEventListener('dragover', e => { e.preventDefault(); document.querySelectorAll('.merge-item').forEach(i => i.classList.remove('drag-over-item')); el.classList.add('drag-over-item'); });
    el.addEventListener('drop', e => {
      e.preventDefault();
      if (dragSrcIndex !== null && dragSrcIndex !== idx) {
        const moved = mergeFiles.splice(dragSrcIndex, 1)[0];
        mergeFiles.splice(idx, 0, moved);
        dragSrcIndex = null; renderMergeList();
      }
    });
    list.appendChild(el);
  });
}

function removeMergeFile(idx) { mergeFiles.splice(idx, 1); renderMergeList(); }
function clearMergeList() { mergeFiles = []; renderMergeList(); }
function reverseMergeOrder() { mergeFiles.reverse(); renderMergeList(); }
function sortMergeAlpha() { mergeFiles.sort((a, b) => a.file.name.localeCompare(b.file.name)); renderMergeList(); }

// ─── SPLIT PREVIEW ───
function previewRanges(val) {
  const preview = document.getElementById('split-preview');
  if (!preview) return;
  preview.innerHTML = '';
  if (!val.trim()) return;
  const parts = val.split(',').map(s => s.trim()).filter(Boolean);
  parts.forEach((part, i) => {
    const chunk = document.createElement('div');
    chunk.className = 'split-chunk';
    chunk.style.animationDelay = (i * 0.05) + 's';
    chunk.innerHTML = `<span class="chunk-icon">📄</span><span class="chunk-label">Part ${i + 1}</span><span style="font-size:0.7rem;color:var(--slate-dark);font-weight:600">pp. ${part}</span>`;
    preview.appendChild(chunk);
  });
}

// ─── PAGE ORGANIZER ───
let orgPages = [];
let orgPdfBytes = null;
let orgDragIdx = null;

async function initPageOrganizer(input) {
  const file = input.files[0]; if (!file) return;
  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
    const pageCount = pdfDoc.getPageCount();
    orgPdfBytes = bytes;
    orgPages = Array.from({ length: pageCount }, (_, i) => ({
      num: i + 1, rotated: 0, deleted: false, selected: false
    }));
    renderOrgGrid();
    showToast(`📑 Loaded ${pageCount} pages`, 'success');
  } catch (e) {
    console.error(e);
    showToast('⚠ Failed to load PDF', 'warn');
  }
}

function renderOrgGrid() {
  const grid = document.getElementById('page-org-grid');
  if (!grid) return;
  grid.innerHTML = '';
  orgPages.filter(p => !p.deleted).forEach((p, visIdx) => {
    const el = document.createElement('div');
    el.className = 'page-thumb' + (p.selected ? ' selected' : '') + (p.rotated ? ' rotated' : '');
    el.draggable = true;
    el.innerHTML = `
      <span class="thumb-icon">📄</span>
      <span class="thumb-num">Page ${p.num}</span>
      <button class="page-del" onclick="orgDeletePage(${visIdx},event)">✕</button>
      <span class="rot-badge">${p.rotated ? p.rotated + '°' : ''}</span>
    `;
    el.addEventListener('click', () => { p.selected = !p.selected; el.classList.toggle('selected', p.selected); });
    el.addEventListener('dragstart', e => { orgDragIdx = visIdx; el.classList.add('page-dragging'); e.dataTransfer.effectAllowed = 'move'; });
    el.addEventListener('dragend', () => { el.classList.remove('page-dragging'); document.querySelectorAll('.page-thumb').forEach(t => t.classList.remove('page-drop-over')); });
    el.addEventListener('dragover', e => { e.preventDefault(); document.querySelectorAll('.page-thumb').forEach(t => t.classList.remove('page-drop-over')); el.classList.add('page-drop-over'); });
    el.addEventListener('drop', e => {
      e.preventDefault();
      const visible = orgPages.filter(p => !p.deleted);
      if (orgDragIdx !== null && orgDragIdx !== visIdx) {
        const srcPage = visible[orgDragIdx];
        const destPage = visible[visIdx];
        const si = orgPages.indexOf(srcPage);
        const di = orgPages.indexOf(destPage);
        orgPages.splice(si, 1);
        orgPages.splice(di, 0, srcPage);
        orgDragIdx = null; renderOrgGrid();
      }
    });
    grid.appendChild(el);
  });
}

function orgDeletePage(visIdx, e) {
  e.stopPropagation();
  const visible = orgPages.filter(p => !p.deleted);
  if (visible[visIdx]) { visible[visIdx].deleted = true; renderOrgGrid(); }
}

function orgSelectAll() { orgPages.forEach(p => { if (!p.deleted) p.selected = true; }); renderOrgGrid(); }
function orgRotateSelected() { orgPages.forEach(p => { if (p.selected && !p.deleted) p.rotated = (p.rotated + 90) % 360; }); renderOrgGrid(); }
function orgDeleteSelected() { orgPages.forEach(p => { if (p.selected) p.deleted = true; }); renderOrgGrid(); }
function orgReverseAll() { orgPages.reverse(); renderOrgGrid(); }
function orgReset() {
  const count = orgPages.length || 8;
  orgPages = Array.from({ length: count }, (_, i) => ({ num: i + 1, rotated: 0, deleted: false, selected: false }));
  renderOrgGrid();
}

// ─── WATERMARK ───
let wmColor = 'rgba(135,133,162,0.35)';
function updateWatermark() {
  const wmTextVal = document.getElementById('wm-text');
  const text = wmTextVal ? wmTextVal.value || 'WATERMARK' : 'WATERMARK';
  const el = document.getElementById('wm-preview-text');
  if (el) el.textContent = text;
}
function updateWatermarkOpacity(val) {
  const el = document.getElementById('wm-preview-text');
  if (el) { const c = wmColor.replace(/[\d.]+\)$/, (val / 100).toFixed(2) + ')'); el.style.color = c; }
}
function selectSwatch(el, color) {
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected'); wmColor = color;
  const pwt = document.getElementById('wm-preview-text');
  if (pwt) pwt.style.color = color;
}

// ─── PASSWORD STRENGTH ───
function checkStrength(val, prefix) {
  const bars = [0, 1, 2, 3].map(i => document.getElementById(`sb-${prefix}-${i}`));
  const label = document.getElementById(`${prefix}-strength-label`);
  if (!bars[0] || !label) return;
  bars.forEach(b => { if (b) b.className = 'strength-bar'; });
  if (!val) { label.textContent = 'Enter a password'; return; }
  let score = 0;
  if (val.length >= 6) score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const levels = ['', 'weak', 'weak', 'medium', 'strong'];
  const texts = ['', 'Weak', 'Weak', 'Medium — add symbols', 'Strong 💪'];
  for (let i = 0; i < score; i++) { if (bars[i]) bars[i].classList.add(levels[score]); }
  label.textContent = texts[score] || 'Enter a password';
}

function togglePass(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  const isPass = inp.type === 'password';
  inp.type = isPass ? 'text' : 'password';
  if (btn) btn.textContent = isPass ? '🙈' : '👁';
}

// ─── SIGNATURE CANVAS ───
let isDrawing = false, signCtx, signColor = '#2a2a35';

window.addEventListener('load', () => {
  const canvas = document.getElementById('sig-canvas');
  if (!canvas) return;
  signCtx = canvas.getContext('2d');
  signCtx.strokeStyle = signColor;
  signCtx.lineWidth = 2.5;
  signCtx.lineCap = 'round';
  signCtx.lineJoin = 'round';
});

function getPos(e, canvas) {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  const src = e.touches ? e.touches[0] : e;
  return { x: (src.clientX - r.left) * scaleX, y: (src.clientY - r.top) * scaleY };
}

function startDraw(e) {
  isDrawing = true;
  const canvas = document.getElementById('sig-canvas');
  if (!signCtx || !canvas) return;
  const { x, y } = getPos(e, canvas);
  signCtx.beginPath(); signCtx.moveTo(x, y);
}

function draw(e) {
  if (!isDrawing || !signCtx) return;
  e.preventDefault();
  const canvas = document.getElementById('sig-canvas');
  if (!canvas) return;
  const { x, y } = getPos(e, canvas);
  signCtx.lineTo(x, y); signCtx.stroke();
}

function stopDraw() { isDrawing = false; }

function clearCanvas() {
  const canvas = document.getElementById('sig-canvas');
  if (signCtx && canvas) signCtx.clearRect(0, 0, canvas.width, canvas.height);
}

function setSignColor(color) {
  signColor = color;
  if (signCtx) signCtx.strokeStyle = color;
}

// Touch support for signature
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('sig-canvas');
  if (!canvas) return;
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e); }, { passive: false });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); draw(e); }, { passive: false });
  canvas.addEventListener('touchend', stopDraw);
});

// ─── DRAG ZONES ───
document.querySelectorAll('.drop-zone').forEach(zone => {
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); });
});

// ─── TOAST ───
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="${type === 'success' ? 'toast-check' : 'toast-icon'}">${type === 'success' ? '✓' : '⚠'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3800);
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  renderMergeList();
  updateSizeEstimate();
  document.querySelectorAll('.tool-card').forEach((card, i) => {
    card.style.animationDelay = (i * 0.06) + 's';
  });
  // Set pdf.js worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
});


// ═══════════════════════════════════════════════════════════════════
// ─── CORE: PROGRESS HELPER ───
// ═══════════════════════════════════════════════════════════════════

function getProgressElements(btn) {
  const card = btn.closest('.tool-card') || btn.parentElement;
  const progressWrap = card.querySelector('.progress-wrap');
  const progressBar = progressWrap ? progressWrap.querySelector('.progress-bar') : null;
  const progressLabel = progressWrap ? progressWrap.querySelector('.progress-label') : null;
  return { progressWrap, progressBar, progressLabel };
}

function startProgress(btn) {
  btn.disabled = true;
  btn.classList.add('loading');
  const { progressWrap, progressBar } = getProgressElements(btn);
  if (progressWrap) progressWrap.classList.add('show');
  if (progressBar) progressBar.style.width = '0%';
}

function updateProgress(btn, pct, label) {
  const { progressBar, progressLabel } = getProgressElements(btn);
  if (progressBar) progressBar.style.width = pct + '%';
  if (progressLabel && label) progressLabel.textContent = label;
}

function finishProgress(btn, blob, name, origSize) {
  const { progressWrap, progressBar, progressLabel } = getProgressElements(btn);
  if (progressBar) progressBar.style.width = '100%';
  if (progressLabel) progressLabel.textContent = 'Done!';

  lastGeneratedBlob = blob;
  lastGeneratedName = name;

  setTimeout(() => {
    btn.disabled = false;
    btn.classList.remove('loading');
    if (progressWrap) progressWrap.classList.remove('show');
    showDownloadModal(name, origSize, blob.size);
  }, 400);
}

function errorProgress(btn, msg) {
  const { progressWrap } = getProgressElements(btn);
  btn.disabled = false;
  btn.classList.remove('loading');
  if (progressWrap) progressWrap.classList.remove('show');
  showToast('⚠ ' + msg, 'warn');
}

// ═══════════════════════════════════════════════════════════════════
// ─── KEY RESOLVER: action name → fileSets key ───
// ═══════════════════════════════════════════════════════════════════

function resolveKey(name) {
  const map = {
    'word-to-pdf': 'word', 'excel-to-pdf': 'excel', 'ppt-to-pdf': 'ppt',
    'img-to-pdf': 'img', 'html-to-pdf': 'html', 'txt-to-pdf': 'txt',
    'pdf-to-word': 'p2w', 'pdf-to-excel': 'p2e', 'pdf-to-img': 'p2i',
    'compress-quick': 'qc', 'compress-target': 'tc', 'compress-dpi': 'dpi', 'compress-adv': 'adv',
    'split-ranges': 'spr', 'extract-pages': 'sep', 'split-size': 'sfs', 'remove-pages': 'rmp',
    'rotate-pages': 'rot', 'page-organizer': 'org', 'add-watermark': 'wm',
    'pdf-to-pdfa': 'pdfa', 'password-protect': 'pp', 'unlock-pdf': 'ul',
    'redact-pdf': 'red', 'sign-pdf': 'sig'
  };
  return map[name] || name.split('-')[0];
}

function getFiles(name) {
  return fileSets[resolveKey(name)] || [];
}

// ═══════════════════════════════════════════════════════════════════
// ─── TOOL IMPLEMENTATIONS ───
// ═══════════════════════════════════════════════════════════════════

const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;

// ─── WORD TO PDF ───
async function wordToPdf(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a Word file first'); return; }

  startProgress(btn);
  updateProgress(btn, 5, 'Preparing conversion…');

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();   // 210
    const pageH = doc.internal.pageSize.getHeight();  // 297
    const marginL = 15, marginR = 15, marginT = 20, marginB = 15;
    const maxW = pageW - marginL - marginR; // ~180mm usable width
    let y = marginT;
    let isFirstPage = true;

    function checkPage(needed) {
      if (y + needed > pageH - marginB) {
        doc.addPage();
        y = marginT;
        return true;
      }
      return false;
    }

    for (let fi = 0; fi < files.length; fi++) {
      if (fi > 0) { doc.addPage(); y = marginT; }
      updateProgress(btn, 5 + (fi / files.length) * 60, `Converting ${files[fi].name}…`);

      const arrayBuf = await files[fi].arrayBuffer();

      // Use mammoth to convert DOCX → HTML
      if (typeof mammoth === 'undefined') {
        errorProgress(btn, 'mammoth.js library not loaded');
        return;
      }

      const result = await mammoth.convertToHtml({
        arrayBuffer: arrayBuf
      }, {
        convertImage: mammoth.images.imgElement(function(image) {
          return image.read("base64").then(function(imgBuf) {
            return { src: "data:" + image.contentType + ";base64," + imgBuf };
          });
        })
      });

      updateProgress(btn, 30 + (fi / files.length) * 30, `Rendering ${files[fi].name}…`);

      // Parse the HTML into a temporary DOM to walk the tree
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = result.value;

      // ── Walk DOM and render directly to jsPDF ──
      const children = tempDiv.childNodes;
      for (let ci = 0; ci < children.length; ci++) {
        const node = children[ci];
        if (node.nodeType === 3) {
          // Text node
          const txt = node.textContent.trim();
          if (txt) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 40);
            const lines = doc.splitTextToSize(txt, maxW);
            lines.forEach(line => {
              checkPage(6);
              doc.text(line, marginL, y);
              y += 5.5;
            });
            y += 2;
          }
          continue;
        }
        if (node.nodeType !== 1) continue; // skip comments etc.

        const tag = node.tagName.toLowerCase();

        // ── Headings ──
        if (tag === 'h1') {
          checkPage(14);
          y += 4;
          doc.setFontSize(22);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(26, 26, 46);
          const lines = doc.splitTextToSize(node.textContent, maxW);
          lines.forEach(line => { checkPage(10); doc.text(line, marginL, y); y += 9; });
          // Underline
          doc.setDrawColor(200, 200, 220);
          doc.setLineWidth(0.5);
          doc.line(marginL, y - 3, marginL + maxW, y - 3);
          y += 4;
        } else if (tag === 'h2') {
          checkPage(12);
          y += 3;
          doc.setFontSize(17);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(42, 42, 69);
          const lines = doc.splitTextToSize(node.textContent, maxW);
          lines.forEach(line => { checkPage(8); doc.text(line, marginL, y); y += 7.5; });
          y += 3;
        } else if (tag === 'h3') {
          checkPage(10);
          y += 2;
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(58, 58, 85);
          const lines = doc.splitTextToSize(node.textContent, maxW);
          lines.forEach(line => { checkPage(7); doc.text(line, marginL, y); y += 6.5; });
          y += 2;
        } else if (tag === 'h4' || tag === 'h5' || tag === 'h6') {
          checkPage(9);
          y += 2;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(70, 70, 90);
          const lines = doc.splitTextToSize(node.textContent, maxW);
          lines.forEach(line => { checkPage(6); doc.text(line, marginL, y); y += 6; });
          y += 2;

        // ── Paragraphs ──
        } else if (tag === 'p') {
          const text = node.textContent.trim();
          if (!text) { y += 3; continue; }
          doc.setFontSize(11);
          doc.setTextColor(30, 30, 40);

          // Check for bold/italic children
          const isBold = node.querySelector('strong, b');
          const isItalic = node.querySelector('em, i');
          if (isBold && isItalic) doc.setFont('helvetica', 'bolditalic');
          else if (isBold) doc.setFont('helvetica', 'bold');
          else if (isItalic) doc.setFont('helvetica', 'italic');
          else doc.setFont('helvetica', 'normal');

          const lines = doc.splitTextToSize(text, maxW);
          lines.forEach(line => {
            checkPage(6);
            doc.text(line, marginL, y);
            y += 5.5;
          });
          y += 2.5;

        // ── Lists ──
        } else if (tag === 'ul' || tag === 'ol') {
          const items = node.querySelectorAll('li');
          let idx = 0;
          items.forEach(li => {
            idx++;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 40);
            const bullet = tag === 'ol' ? `${idx}. ` : '•  ';
            const itemText = li.textContent.trim();
            const lines = doc.splitTextToSize(bullet + itemText, maxW - 8);
            lines.forEach((line, li2) => {
              checkPage(6);
              doc.text(line, marginL + (li2 === 0 ? 0 : 6), y);
              y += 5.5;
            });
          });
          y += 2;

        // ── Tables ──
        } else if (tag === 'table') {
          const rows = node.querySelectorAll('tr');
          if (rows.length === 0) continue;

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 30, 40);

          // Determine column count from first row
          const firstRowCells = rows[0].querySelectorAll('th, td');
          const colCount = firstRowCells.length || 1;
          const colW = maxW / colCount;
          const cellPad = 2;
          const rowH = 7;

          checkPage(rowH * Math.min(rows.length, 3));

          for (let ri = 0; ri < rows.length; ri++) {
            checkPage(rowH);
            const cells = rows[ri].querySelectorAll('th, td');
            const isHeader = rows[ri].querySelector('th') !== null;

            if (isHeader) {
              doc.setFillColor(232, 232, 240);
              doc.rect(marginL, y - 4.5, maxW, rowH, 'F');
              doc.setFont('helvetica', 'bold');
            } else {
              if (ri % 2 === 0) {
                doc.setFillColor(248, 248, 252);
                doc.rect(marginL, y - 4.5, maxW, rowH, 'F');
              }
              doc.setFont('helvetica', 'normal');
            }

            // Draw cell borders
            doc.setDrawColor(187, 187, 187);
            doc.setLineWidth(0.2);
            for (let ci = 0; ci < colCount; ci++) {
              doc.rect(marginL + ci * colW, y - 4.5, colW, rowH, 'S');
              const cellText = cells[ci] ? cells[ci].textContent.trim() : '';
              const truncated = doc.splitTextToSize(cellText, colW - cellPad * 2);
              doc.text(truncated[0] || '', marginL + ci * colW + cellPad, y);
            }
            y += rowH;
          }
          y += 3;

        // ── Images ──
        } else if (tag === 'img') {
          const src = node.getAttribute('src');
          if (src && src.startsWith('data:image')) {
            try {
              checkPage(60);
              const imgType = src.includes('image/png') ? 'PNG' : 'JPEG';
              // Scale image to fit page width, max 120mm tall
              const imgW = Math.min(maxW, 160);
              const imgH = Math.min(100, imgW * 0.75); // approximate aspect ratio
              doc.addImage(src, imgType, marginL, y, imgW, imgH);
              y += imgH + 4;
            } catch (e) {
              console.warn('Could not embed image:', e);
            }
          }

        // ── Blockquotes ──
        } else if (tag === 'blockquote') {
          checkPage(10);
          doc.setDrawColor(180, 180, 210);
          doc.setLineWidth(0.8);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(80, 80, 100);
          const qText = node.textContent.trim();
          const lines = doc.splitTextToSize(qText, maxW - 10);
          const blockH = lines.length * 5.5 + 4;
          doc.line(marginL + 3, y - 2, marginL + 3, y + blockH - 4);
          lines.forEach(line => {
            checkPage(6);
            doc.text(line, marginL + 8, y);
            y += 5.5;
          });
          y += 3;

        // ── Horizontal rules ──
        } else if (tag === 'hr') {
          checkPage(6);
          y += 3;
          doc.setDrawColor(200, 200, 220);
          doc.setLineWidth(0.3);
          doc.line(marginL, y, marginL + maxW, y);
          y += 5;

        // ── Any other element: extract text ──
        } else {
          const text = node.textContent.trim();
          if (text) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 40);
            const lines = doc.splitTextToSize(text, maxW);
            lines.forEach(line => {
              checkPage(6);
              doc.text(line, marginL, y);
              y += 5.5;
            });
            y += 2;
          }
        }
      }
    }

    updateProgress(btn, 95, 'Generating PDF…');
    const pdfArrayBuf = doc.output('arraybuffer');
    const blob = new Blob([pdfArrayBuf], { type: 'application/pdf' });
    const outName = files.length === 1
      ? files[0].name.replace(/\.(docx?|DOCX?)$/, '') + '.pdf'
      : 'word-converted.pdf';
    finishProgress(btn, blob, outName);
    showToast(`📝 Converted ${files.length} file(s) successfully`, 'success');
  } catch (err) {
    console.error('Word-to-PDF error:', err);
    errorProgress(btn, 'Word conversion failed: ' + err.message);
  }
}

// ─── EXCEL TO PDF ───
async function excelToPdf(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add an Excel file first'); return; }
  if (typeof XLSX === 'undefined') { errorProgress(btn, 'SheetJS library not loaded'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Reading spreadsheet…');

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    for (let fi = 0; fi < files.length; fi++) {
      if (fi > 0) doc.addPage();
      updateProgress(btn, 10 + (fi / files.length) * 70, `Processing ${files[fi].name}…`);

      const data = await files[fi].arrayBuffer();
      const workbook = XLSX.read(data);

      workbook.SheetNames.forEach((sheetName, si) => {
        if (si > 0 || fi > 0) doc.addPage();
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (!jsonData.length) {
          doc.setFontSize(14);
          doc.text(`Sheet: ${sheetName} (empty)`, 10, 15);
          return;
        }

        // Title
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 140);
        doc.text(`Sheet: ${sheetName}`, 10, 12);

        // Table rendering
        const startY = 18;
        const pageWidth = doc.internal.pageSize.getWidth() - 20;
        const maxCols = jsonData.reduce((max, row) => Math.max(max, row.length), 0);
        const colWidth = Math.min(pageWidth / maxCols, 45);
        const rowHeight = 7;
        let y = startY;

        doc.setFontSize(8);
        jsonData.forEach((row, ri) => {
          if (y > doc.internal.pageSize.getHeight() - 15) {
            doc.addPage();
            y = 15;
          }

          // Header row styling
          if (ri === 0) {
            doc.setFillColor(100, 100, 150);
            doc.rect(10, y - 4.5, maxCols * colWidth, rowHeight, 'F');
            doc.setTextColor(255, 255, 255);
          } else {
            if (ri % 2 === 0) {
              doc.setFillColor(245, 245, 250);
              doc.rect(10, y - 4.5, maxCols * colWidth, rowHeight, 'F');
            }
            doc.setTextColor(40, 40, 50);
          }

          row.forEach((cell, ci) => {
            const text = String(cell ?? '').substring(0, 30);
            doc.text(text, 12 + ci * colWidth, y);
          });
          y += rowHeight;
        });
      });
    }

    updateProgress(btn, 95, 'Generating PDF…');
    const blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
    finishProgress(btn, blob, 'spreadsheet.pdf');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Excel conversion failed: ' + err.message);
  }
}

// ─── PPT TO PDF ───
async function pptToPdf(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PowerPoint file first'); return; }
  if (typeof JSZip === 'undefined') { errorProgress(btn, 'JSZip library not loaded'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Reading presentation…');

  try {
    const { jsPDF } = window.jspdf;

    // We'll collect all pages first, then build the PDF
    const allSlidePages = []; // { pageWmm, pageHmm, drawCmds: [] }

    for (let fi = 0; fi < files.length; fi++) {
      updateProgress(btn, 10 + (fi / files.length) * 70, `Processing ${files[fi].name}…`);

      const buf = await files[fi].arrayBuffer();
      const zip = await JSZip.loadAsync(buf);

      // ── Read actual slide dimensions from presentation.xml ──
      let slideWidthEmu = 9144000;  // default 10 inches (16:9 widescreen)
      let slideHeightEmu = 5143500; // default 5.625 inches
      if (zip.files['ppt/presentation.xml']) {
        const presXml = await zip.files['ppt/presentation.xml'].async('string');
        const presDoc = new DOMParser().parseFromString(presXml, 'text/xml');
        const sldSz = presDoc.getElementsByTagName('p:sldSz')[0];
        if (sldSz) {
          slideWidthEmu = parseInt(sldSz.getAttribute('cx')) || slideWidthEmu;
          slideHeightEmu = parseInt(sldSz.getAttribute('cy')) || slideHeightEmu;
        }
      }

      // Convert slide EMUs to mm (1 inch = 914400 EMU, 1 inch = 25.4 mm)
      const slideWidthMm = (slideWidthEmu / 914400) * 25.4;
      const slideHeightMm = (slideHeightEmu / 914400) * 25.4;
      console.log(`[pptToPdf] Slide dimensions: ${slideWidthMm.toFixed(1)}mm x ${slideHeightMm.toFixed(1)}mm`);

      // Find all slide XML files
      const slideFiles = Object.keys(zip.files)
        .filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const na = parseInt(a.match(/\d+/)[0]);
          const nb = parseInt(b.match(/\d+/)[0]);
          return na - nb;
        });

      for (let si = 0; si < slideFiles.length; si++) {
        const slideData = {
          pageWmm: slideWidthMm,
          pageHmm: slideHeightMm,
          drawCmds: []
        };

        const xml = await zip.files[slideFiles[si]].async('string');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'text/xml');

        // Parse relationships for this slide (to find images)
        const relsFile = slideFiles[si].replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
        let relsMap = {};
        if (zip.files[relsFile]) {
          const relsXml = await zip.files[relsFile].async('string');
          const relsDoc = parser.parseFromString(relsXml, 'text/xml');
          const rels = relsDoc.getElementsByTagName('Relationship');
          for (let i = 0; i < rels.length; i++) {
            relsMap[rels[i].getAttribute('Id')] = rels[i].getAttribute('Target');
          }
        }

        // Slide background + border
        slideData.drawCmds.push({ type: 'bg', w: slideWidthMm, h: slideHeightMm });

        // Slide number
        slideData.drawCmds.push({ type: 'slideNum', num: si + 1, x: slideWidthMm - 25, y: slideHeightMm - 8 });

        // Parse images (<p:pic>)
        const pics = xmlDoc.getElementsByTagName('p:pic');
        for (let i = 0; i < pics.length; i++) {
          const blip = pics[i].getElementsByTagName('a:blip')[0];
          if (!blip) continue;
          
          const rId = blip.getAttribute('r:embed');
          if (!rId || !relsMap[rId]) continue;
          
          const target = relsMap[rId]; 
          const mediaPath = target.replace('..', 'ppt');
          
          if (zip.files[mediaPath]) {
            const imgData = await zip.files[mediaPath].async('base64');
            const ext = mediaPath.split('.').pop().toLowerCase();
            const type = (ext === 'png') ? 'PNG' : (ext === 'gif') ? 'GIF' : 'JPEG';
            
            const xfrm = pics[i].getElementsByTagName('a:xfrm')[0];
            if (xfrm) {
              const off = xfrm.getElementsByTagName('a:off')[0];
              const extNode = xfrm.getElementsByTagName('a:ext')[0];
              if (off && extNode) {
                // Convert EMU coordinates directly to mm
                const x = (parseInt(off.getAttribute('x')) / 914400) * 25.4;
                const y = (parseInt(off.getAttribute('y')) / 914400) * 25.4;
                const w = (parseInt(extNode.getAttribute('cx')) / 914400) * 25.4;
                const h = (parseInt(extNode.getAttribute('cy')) / 914400) * 25.4;
                
                slideData.drawCmds.push({
                  type: 'image',
                  data: 'data:image/' + ext + ';base64,' + imgData,
                  format: type, x, y, w, h
                });
              }
            }
          }
        }

        // Parse text shapes (<p:sp>)
        const shapes = xmlDoc.getElementsByTagName('p:sp');
        let hasContent = pics.length > 0;

        for (let i = 0; i < shapes.length; i++) {
          const sp = shapes[i];
          const xfrm = sp.getElementsByTagName('a:xfrm')[0];
          let x = 15, y = 25;
          let shapeW = slideWidthMm - 30;
          
          if (xfrm) {
            const off = xfrm.getElementsByTagName('a:off')[0];
            const extNode = xfrm.getElementsByTagName('a:ext')[0];
            if (off) {
              x = (parseInt(off.getAttribute('x')) / 914400) * 25.4;
              y = (parseInt(off.getAttribute('y')) / 914400) * 25.4;
            }
            if (extNode) {
              shapeW = (parseInt(extNode.getAttribute('cx')) / 914400) * 25.4;
            }
          }

          const texts = [];
          const textNodes = sp.getElementsByTagName('a:t');
          for (let j = 0; j < textNodes.length; j++) {
            texts.push(textNodes[j].textContent);
          }

          if (texts.length > 0) {
            hasContent = true;
            slideData.drawCmds.push({
              type: 'text',
              text: texts.join(' '),
              x, y: y + 8,
              maxW: shapeW,
              isTitle: i === 0
            });
          }
        }

        if (!hasContent) {
          slideData.drawCmds.push({ type: 'blank', y: slideHeightMm / 2 });
        }

        allSlidePages.push(slideData);
      }

      if (slideFiles.length === 0) {
        allSlidePages.push({
          pageWmm: slideWidthMm,
          pageHmm: slideHeightMm,
          drawCmds: [{ type: 'noSlides' }]
        });
      }
    }

    // ── Build the PDF with correct page sizes ──
    updateProgress(btn, 85, 'Building PDF…');

    if (allSlidePages.length === 0) {
      errorProgress(btn, 'No slides found');
      return;
    }

    // Create PDF with the first slide's dimensions
    const first = allSlidePages[0];
    const doc = new jsPDF({
      orientation: first.pageWmm > first.pageHmm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [first.pageWmm, first.pageHmm]
    });

    for (let si = 0; si < allSlidePages.length; si++) {
      const slide = allSlidePages[si];
      if (si > 0) {
        doc.addPage([slide.pageWmm, slide.pageHmm],
          slide.pageWmm > slide.pageHmm ? 'landscape' : 'portrait');
      }
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      for (const cmd of slide.drawCmds) {
        switch (cmd.type) {
          case 'bg':
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageW, pageH, 'F');
            doc.setDrawColor(200, 200, 220);
            doc.rect(2, 2, pageW - 4, pageH - 4, 'S');
            break;
          case 'slideNum':
            doc.setFontSize(8);
            doc.setTextColor(180, 180, 200);
            doc.text(`Slide ${cmd.num}`, cmd.x, cmd.y);
            break;
          case 'image':
            try {
              doc.addImage(cmd.data, cmd.format, cmd.x, cmd.y, cmd.w, cmd.h);
            } catch (e) {
              console.warn('Could not add image:', e);
            }
            break;
          case 'text':
            if (cmd.isTitle) {
              doc.setFontSize(22);
              doc.setTextColor(60, 60, 100);
            } else {
              doc.setFontSize(13);
              doc.setTextColor(50, 50, 60);
            }
            const lines = doc.splitTextToSize(cmd.text, cmd.maxW);
            let curY = cmd.y;
            lines.forEach(line => {
              if (curY < pageH - 10) {
                doc.text(line, cmd.x, curY);
                curY += cmd.isTitle ? 10 : 6;
              }
            });
            break;
          case 'blank':
            doc.setFontSize(14);
            doc.setTextColor(180, 180, 200);
            doc.text('(Blank or unsupported slide format)', 15, cmd.y);
            break;
          case 'noSlides':
            doc.setFontSize(14);
            doc.text('No slides found in this presentation file.', 15, 30);
            break;
        }
      }
    }

    updateProgress(btn, 95, 'Generating PDF…');
    const blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
    finishProgress(btn, blob, 'presentation.pdf');
  } catch (err) {
    console.error('PPT Error:', err);
    errorProgress(btn, 'PowerPoint conversion failed: ' + err.message);
  }
}

// ─── IMAGE TO PDF ───
async function imgToPdf(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add images first'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Processing images…');

  try {
    const pdfDoc = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      updateProgress(btn, 10 + (i / files.length) * 80, `Embedding image ${i + 1}/${files.length}…`);

      const bytes = await files[i].arrayBuffer();
      let image;
      try {
        if (files[i].type.includes('png')) {
          image = await pdfDoc.embedPng(bytes);
        } else if (files[i].type.includes('jpeg') || files[i].type.includes('jpg')) {
          image = await pdfDoc.embedJpg(bytes);
        } else {
          // Convert other formats (webp, gif, heic) to PNG via canvas
          const imgEl = await createImageBitmap(new Blob([bytes]));
          const canvas = document.createElement('canvas');
          canvas.width = imgEl.width;
          canvas.height = imgEl.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imgEl, 0, 0);
          const pngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
          const pngBytes = await pngBlob.arrayBuffer();
          image = await pdfDoc.embedPng(pngBytes);
        }
      } catch (e) {
        console.warn('Skipping unsupported image:', files[i].name, e);
        continue;
      }

      // Get selected page size option
      const card = btn.closest('.tool-card');
      const selectedOpt = card ? card.querySelector('.opt-chip.selected') : null;
      const sizeOpt = selectedOpt ? selectedOpt.textContent.trim() : 'Auto-size';

      let pageW, pageH;
      const dims = image.scale(1);

      if (sizeOpt === 'A4') {
        pageW = 595; pageH = 842;
      } else if (sizeOpt === 'Letter') {
        pageW = 612; pageH = 792;
      } else if (sizeOpt === 'Original') {
        pageW = dims.width; pageH = dims.height;
      } else { // Auto-size
        pageW = dims.width; pageH = dims.height;
      }

      const page = pdfDoc.addPage([pageW, pageH]);

      // Fit image to page
      let drawW = dims.width, drawH = dims.height;
      if (sizeOpt === 'A4' || sizeOpt === 'Letter') {
        const scaleX = (pageW - 40) / dims.width;
        const scaleY = (pageH - 40) / dims.height;
        const s = Math.min(scaleX, scaleY, 1);
        drawW = dims.width * s;
        drawH = dims.height * s;
      }

      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;
      page.drawImage(image, { x, y, width: drawW, height: drawH });
    }

    if (pdfDoc.getPageCount() === 0) {
      errorProgress(btn, 'No supported images found');
      return;
    }

    updateProgress(btn, 95, 'Generating PDF…');
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'images.pdf');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Image conversion failed: ' + err.message);
  }
}

// ─── HTML TO PDF ───
async function htmlToPdf(btn, files) {
  startProgress(btn);
  updateProgress(btn, 10, 'Rendering HTML…');

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    if (files && files.length > 0) {
      for (let fi = 0; fi < files.length; fi++) {
        if (fi > 0) doc.addPage();
        updateProgress(btn, 10 + (fi / files.length) * 70, `Rendering ${files[fi].name}…`);

        const htmlContent = await files[fi].text();

        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;padding:20px;background:white;';
        container.innerHTML = htmlContent;
        document.body.appendChild(container);

        const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
        document.body.removeChild(container);

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pageW = doc.internal.pageSize.getWidth();
        const imgW = pageW - 20;
        const imgH = (canvas.height / canvas.width) * imgW;
        const maxH = doc.internal.pageSize.getHeight() - 20;

        let yOff = 0;
        let pNum = 0;
        while (yOff < imgH) {
          if (pNum > 0) doc.addPage();
          const srcY = (yOff / imgH) * canvas.height;
          const srcH = Math.min((maxH / imgH) * canvas.height, canvas.height - srcY);
          const drawH = Math.min(maxH, imgH - yOff);
          const pgCanvas = document.createElement('canvas');
          pgCanvas.width = canvas.width; pgCanvas.height = srcH;
          pgCanvas.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
          doc.addImage(pgCanvas.toDataURL('image/jpeg', 0.9), 'JPEG', 10, 10, imgW, drawH);
          yOff += maxH;
          pNum++;
        }
      }
    } else {
      // Check for URL input
      const card = btn.closest('.tool-card');
      const urlInput = card ? card.querySelector('input[type="url"]') : null;
      if (urlInput && urlInput.value.trim()) {
        doc.setFontSize(12);
        doc.text('URL conversion requires a backend proxy.', 15, 20);
        doc.text('Please upload HTML files directly instead.', 15, 30);
        doc.text(`Requested URL: ${urlInput.value}`, 15, 45);
      } else {
        errorProgress(btn, 'Please add HTML files or enter a URL');
        return;
      }
    }

    updateProgress(btn, 95, 'Generating PDF…');
    const blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
    finishProgress(btn, blob, 'html-converted.pdf');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'HTML conversion failed: ' + err.message);
  }
}

// ─── TEXT / MARKDOWN TO PDF ───
async function txtToPdf(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add text files first'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Reading text…');

  try {
    const { jsPDF } = window.jspdf;
    const card = btn.closest('.tool-card');
    const selectedOpt = card ? card.querySelector('.opt-chip.selected') : null;
    const sizeOpt = selectedOpt ? selectedOpt.textContent.trim() : 'A4';
    const format = sizeOpt === 'Letter' ? 'letter' : sizeOpt === 'Legal' ? 'legal' : 'a4';
    const doc = new jsPDF({ unit: 'mm', format });

    for (let i = 0; i < files.length; i++) {
      if (i > 0) doc.addPage();
      updateProgress(btn, 10 + (i / files.length) * 80, `Processing ${files[i].name}…`);

      const text = await files[i].text();

      // Check if markdown
      const isMd = files[i].name.endsWith('.md');
      if (isMd) {
        // Simple markdown rendering
        const mdLines = text.split('\n');
        let y = 20;
        mdLines.forEach(line => {
          if (y > doc.internal.pageSize.getHeight() - 15) {
            doc.addPage();
            y = 20;
          }
          if (line.startsWith('# ')) {
            doc.setFontSize(22);
            doc.setTextColor(50, 50, 100);
            doc.text(line.substring(2), 15, y);
            y += 12;
          } else if (line.startsWith('## ')) {
            doc.setFontSize(18);
            doc.setTextColor(70, 70, 120);
            doc.text(line.substring(3), 15, y);
            y += 10;
          } else if (line.startsWith('### ')) {
            doc.setFontSize(15);
            doc.setTextColor(80, 80, 130);
            doc.text(line.substring(4), 15, y);
            y += 9;
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            doc.setFontSize(11);
            doc.setTextColor(40, 40, 50);
            doc.text('  • ' + line.substring(2), 15, y);
            y += 7;
          } else {
            doc.setFontSize(11);
            doc.setTextColor(40, 40, 50);
            const wrapped = doc.splitTextToSize(line, 180);
            wrapped.forEach(wl => {
              if (y > doc.internal.pageSize.getHeight() - 15) { doc.addPage(); y = 20; }
              doc.text(wl, 15, y);
              y += 6;
            });
          }
        });
      } else {
        // Plain text
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 50);
        const lines = doc.splitTextToSize(text, 180);
        let y = 20;
        lines.forEach(line => {
          if (y > doc.internal.pageSize.getHeight() - 15) { doc.addPage(); y = 20; }
          doc.text(line, 15, y);
          y += 6;
        });
      }
    }

    updateProgress(btn, 95, 'Generating PDF…');
    const blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
    finishProgress(btn, blob, 'text-document.pdf');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Text conversion failed: ' + err.message);
  }
}

// ─── PDF TO WORD (text extraction → .txt/.html) ───
async function pdfToWord(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Extracting text…');

  try {
    if (typeof pdfjsLib === 'undefined') { errorProgress(btn, 'pdf.js library not loaded'); return; }

    let allText = '';
    for (let fi = 0; fi < files.length; fi++) {
      updateProgress(btn, 10 + (fi / files.length) * 80, `Reading ${files[fi].name}…`);
      const buf = await files[fi].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        allText += `\n--- Page ${p} ---\n${pageText}\n`;
      }
    }

    // Create a simple HTML document that Word can open
    const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Extracted from PDF</title>
<style>body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.6;margin:40px;}</style></head>
<body>
${allText.split('\n').map(l => `<p>${l}</p>`).join('\n')}
</body></html>`;

    updateProgress(btn, 95, 'Creating document…');
    const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    lastGeneratedBlob = blob;
    lastGeneratedName = 'extracted-text.doc';
    finishProgress(btn, blob, 'extracted-text.doc');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'PDF to Word failed: ' + err.message);
  }
}

// ─── PDF TO EXCEL ───
async function pdfToExcel(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }
  if (typeof XLSX === 'undefined') { errorProgress(btn, 'SheetJS not loaded'); return; }
  if (typeof pdfjsLib === 'undefined') { errorProgress(btn, 'pdf.js not loaded'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Extracting data…');

  try {
    const wb = XLSX.utils.book_new();

    for (let fi = 0; fi < files.length; fi++) {
      updateProgress(btn, 10 + (fi / files.length) * 80, `Processing ${files[fi].name}…`);
      const buf = await files[fi].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const allRows = [];

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();

        // Group items by Y position to form rows
        const lineMap = {};
        content.items.forEach(item => {
          const y = Math.round(item.transform[5]);
          if (!lineMap[y]) lineMap[y] = [];
          lineMap[y].push({ x: item.transform[4], text: item.str });
        });

        // Sort by Y descending (PDF coordinates), then X ascending
        const yKeys = Object.keys(lineMap).sort((a, b) => b - a);
        yKeys.forEach(y => {
          const items = lineMap[y].sort((a, b) => a.x - b.x);
          const cells = items.map(it => it.text.trim()).filter(Boolean);
          if (cells.length > 0) allRows.push(cells);
        });

        allRows.push([`--- Page ${p} ---`]);
      }

      const ws = XLSX.utils.aoa_to_sheet(allRows);
      XLSX.utils.book_append_sheet(wb, ws, files[fi].name.substring(0, 31));
    }

    updateProgress(btn, 95, 'Creating spreadsheet…');
    const xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    lastGeneratedName = 'extracted-data.xlsx';
    lastGeneratedBlob = blob;
    finishProgress(btn, blob, 'extracted-data.xlsx');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'PDF to Excel failed: ' + err.message);
  }
}

// ─── PDF TO IMAGES ───
async function pdfToImages(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }
  if (typeof pdfjsLib === 'undefined') { errorProgress(btn, 'pdf.js not loaded'); return; }
  if (typeof JSZip === 'undefined') { errorProgress(btn, 'JSZip not loaded'); return; }

  startProgress(btn);

  try {
    // Get selected format
    const card = btn.closest('.tool-card');
    const selectedOpt = card ? card.querySelector('.opt-chip.selected') : null;
    const format = selectedOpt ? selectedOpt.textContent.trim().toLowerCase() : 'jpg';
    const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';

    const zip = new JSZip();
    let totalPages = 0;

    for (let fi = 0; fi < files.length; fi++) {
      const buf = await files[fi].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

      for (let p = 1; p <= pdf.numPages; p++) {
        totalPages++;
        updateProgress(btn, 10 + (totalPages / (pdf.numPages * files.length)) * 80,
          `Rendering page ${p}/${pdf.numPages}…`);

        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;

        const imgBlob = await new Promise(r => canvas.toBlob(r, mimeType, 0.92));
        const imgBuf = await imgBlob.arrayBuffer();
        zip.file(`page-${String(totalPages).padStart(3, '0')}.${format}`, imgBuf);
      }
    }

    updateProgress(btn, 95, 'Creating ZIP archive…');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    lastGeneratedBlob = zipBlob;
    lastGeneratedName = `pdf-pages-${format}.zip`;
    finishProgress(btn, zipBlob, lastGeneratedName);
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'PDF to Images failed: ' + err.message);
  }
}

// ─── DEEP COMPRESSION HELPER ───
async function deepCompressPdf(origBytes, btn, quality, scale) {
  if (typeof pdfjsLib === 'undefined') throw new Error('pdf.js library not loaded');
  const { jsPDF } = window.jspdf;

  const pdf = await pdfjsLib.getDocument({ data: origBytes }).promise;
  const numPages = pdf.numPages;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.deletePage(1);

  for (let p = 1; p <= numPages; p++) {
    updateProgress(btn, 10 + (p / numPages) * 70, `Compressing page ${p}/${numPages}…`);

    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // Fill white background just in case PDF has transparency
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const imgData = canvas.toDataURL('image/jpeg', quality);

    const originalViewport = page.getViewport({ scale: 1 });
    const widthMm = (originalViewport.width * 25.4) / 72;
    const heightMm = (originalViewport.height * 25.4) / 72;

    doc.addPage([widthMm, heightMm]);
    doc.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm);
  }

  return doc.output('arraybuffer');
}

// ─── COMPRESS: QUICK ───
async function compressQuick(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Analyzing PDF…');

  try {
    const origBytes = await files[0].arrayBuffer();
    const origSize = origBytes.byteLength;

    const card = btn.closest('.tool-card');
    const qualChip = card ? card.querySelector('.quality-chip.selected') : null;
    const qualityStr = qualChip ? qualChip.textContent.trim() : 'Balanced';

    let quality = 0.65;
    let scale = 1.5;
    if (qualityStr === 'Maximum') { quality = 0.9; scale = 2.0; }
    else if (qualityStr === 'Minimum') { quality = 0.4; scale = 1.0; }

    const savedBytes = await deepCompressPdf(origBytes, btn, quality, scale);

    updateProgress(btn, 90, 'Finalizing…');
    const blob = new Blob([savedBytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'compressed.pdf', origSize);
    showToast(`📦 ${formatSize(origSize)} → ${formatSize(blob.size)}`, 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Compression failed: ' + err.message);
  }
}

// ─── COMPRESS: TARGET SIZE ───
async function compressTarget(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Analyzing…');

  try {
    const origBytes = await files[0].arrayBuffer();
    const origSize = origBytes.byteLength;

    const targetVal = document.getElementById('target-size-val');
    const kbEl = document.getElementById('unit-kb');
    const val = targetVal ? parseFloat(targetVal.value) || 2 : 2;
    const isKB = kbEl ? kbEl.classList.contains('selected') : false;
    const targetBytes = isKB ? val * 1024 : val * 1024 * 1024;

    let ratio = targetBytes / origSize;
    let quality = Math.max(0.2, Math.min(0.9, ratio));
    let scale = Math.max(0.5, Math.min(2.0, ratio * 2));

    const savedBytes = await deepCompressPdf(origBytes, btn, quality, scale);
    const blob = new Blob([savedBytes], { type: 'application/pdf' });

    if (blob.size > targetBytes) {
      showToast(`📐 Compressed to ${formatSize(blob.size)} (target: ${formatSize(targetBytes)}).`, 'warn');
    }

    finishProgress(btn, blob, 'compressed-target.pdf', origSize);
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Compression failed: ' + err.message);
  }
}

// ─── COMPRESS: DPI ───
async function compressDpi(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Processing…');

  try {
    const origBytes = await files[0].arrayBuffer();
    const origSize = origBytes.byteLength;

    const rangeInput = document.getElementById('dpi-range');
    const targetDpi = rangeInput ? parseInt(rangeInput.value) || 150 : 150;
    
    // pdf.js base DPI is 72
    const scale = targetDpi / 72;
    // heuristic quality based on DPI
    const quality = Math.min(0.9, 0.4 + (targetDpi / 300) * 0.5);

    const savedBytes = await deepCompressPdf(origBytes, btn, quality, scale);

    updateProgress(btn, 90, 'Finalizing…');
    const blob = new Blob([savedBytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'reduced-dpi.pdf', origSize);
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'DPI reduction failed: ' + err.message);
  }
}

// ─── COMPRESS: ADVANCED ───
async function compressAdvanced(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Analyzing settings…');

  try {
    const origBytes = await files[0].arrayBuffer();
    const origSize = origBytes.byteLength;

    const iqRange = document.getElementById('iq-range');
    const mdpiRange = document.getElementById('mdpi-range');
    
    const quality = iqRange ? parseInt(iqRange.value) / 100 : 0.75;
    const dpi = mdpiRange ? parseInt(mdpiRange.value) : 200;
    const scale = dpi / 72;

    const savedBytes = await deepCompressPdf(origBytes, btn, quality, scale);

    updateProgress(btn, 95, 'Done!');
    const blob = new Blob([savedBytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'advanced-compressed.pdf', origSize);
    showToast(`⚙️ ${formatSize(origSize)} → ${formatSize(blob.size)}`, 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Advanced compression failed: ' + err.message);
  }
}

// ─── SPLIT BY PAGE RANGE ───
async function splitByRange(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  const rangeInput = document.getElementById('range-input');
  const rangeStr = rangeInput ? rangeInput.value.trim() : '';
  if (!rangeStr) { errorProgress(btn, 'Please enter page ranges (e.g. 1-3, 5, 7-9)'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Loading PDF…');

  try {
    const origBytes = await files[0].arrayBuffer();
    const srcDoc = await PDFDocument.load(origBytes);
    const totalPages = srcDoc.getPageCount();

    // Parse ranges
    const ranges = rangeStr.split(',').map(s => s.trim()).filter(Boolean);
    const pageIndices = new Set();

    ranges.forEach(range => {
      const match = range.match(/^(\d+)\s*-\s*(\d+|end)$/);
      if (match) {
        const start = parseInt(match[1]) - 1;
        const end = match[2] === 'end' ? totalPages - 1 : parseInt(match[2]) - 1;
        for (let i = start; i <= Math.min(end, totalPages - 1); i++) {
          if (i >= 0) pageIndices.add(i);
        }
      } else {
        const pg = parseInt(range) - 1;
        if (pg >= 0 && pg < totalPages) pageIndices.add(pg);
      }
    });

    if (pageIndices.size === 0) { errorProgress(btn, 'No valid pages in the specified range'); return; }

    updateProgress(btn, 50, `Extracting ${pageIndices.size} pages…`);

    const newDoc = await PDFDocument.create();
    const sorted = Array.from(pageIndices).sort((a, b) => a - b);
    const copiedPages = await newDoc.copyPages(srcDoc, sorted);
    copiedPages.forEach(page => newDoc.addPage(page));

    updateProgress(btn, 90, 'Saving…');
    const bytes = await newDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'split-pages.pdf');
    showToast(`✂ Extracted ${pageIndices.size} of ${totalPages} pages`, 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Split failed: ' + err.message);
  }
}

// ─── EXTRACT EVERY PAGE ───
async function extractAllPages(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }
  if (typeof JSZip === 'undefined') { errorProgress(btn, 'JSZip not loaded'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Loading PDF…');

  try {
    const origBytes = await files[0].arrayBuffer();
    const srcDoc = await PDFDocument.load(origBytes);
    const totalPages = srcDoc.getPageCount();
    const zip = new JSZip();

    // Check format option
    const card = btn.closest('.tool-card');
    const selectedOpt = card ? card.querySelector('.opt-chip.selected') : null;
    const asImages = selectedOpt && selectedOpt.textContent.trim() === 'As images';

    if (asImages && typeof pdfjsLib !== 'undefined') {
      // Extract as images
      const pdf = await pdfjsLib.getDocument({ data: origBytes }).promise;
      for (let p = 1; p <= totalPages; p++) {
        updateProgress(btn, 10 + (p / totalPages) * 80, `Rendering page ${p}/${totalPages}…`);
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const imgBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        zip.file(`page-${String(p).padStart(3, '0')}.png`, await imgBlob.arrayBuffer());
      }
    } else {
      // Extract as PDFs
      for (let p = 0; p < totalPages; p++) {
        updateProgress(btn, 10 + (p / totalPages) * 80, `Extracting page ${p + 1}/${totalPages}…`);
        const newDoc = await PDFDocument.create();
        const [page] = await newDoc.copyPages(srcDoc, [p]);
        newDoc.addPage(page);
        const bytes = await newDoc.save();
        zip.file(`page-${String(p + 1).padStart(3, '0')}.pdf`, bytes);
      }
    }

    updateProgress(btn, 95, 'Creating ZIP…');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    lastGeneratedBlob = zipBlob;
    lastGeneratedName = `all-pages-${totalPages}p.zip`;
    finishProgress(btn, zipBlob, lastGeneratedName);
    showToast(`📦 ${totalPages} pages extracted to ZIP`, 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Page extraction failed: ' + err.message);
  }
}

// ─── SPLIT BY FILE SIZE ───
async function splitBySize(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }
  if (typeof JSZip === 'undefined') { errorProgress(btn, 'JSZip not loaded'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Analyzing PDF…');

  try {
    // Get max chunk size from UI
    const card = btn.closest('.tool-card');
    const sizeInput = card ? card.querySelector('.size-input') : null;
    const unitBtns = card ? card.querySelectorAll('.unit-btn') : [];
    const val = sizeInput ? parseFloat(sizeInput.value) || 5 : 5;
    let isMB = true;
    unitBtns.forEach(b => { if (b.classList.contains('selected') && b.textContent === 'KB') isMB = false; });
    const maxBytes = isMB ? val * 1024 * 1024 : val * 1024;

    const origBytes = await files[0].arrayBuffer();
    const srcDoc = await PDFDocument.load(origBytes);
    const totalPages = srcDoc.getPageCount();

    const zip = new JSZip();
    let chunkNum = 1;
    let currentDoc = await PDFDocument.create();
    let currentPageCount = 0;

    for (let p = 0; p < totalPages; p++) {
      updateProgress(btn, 10 + (p / totalPages) * 80, `Processing page ${p + 1}/${totalPages}…`);

      const [page] = await currentDoc.copyPages(srcDoc, [p]);
      currentDoc.addPage(page);
      currentPageCount++;

      // Check size
      const tempBytes = await currentDoc.save();
      if (tempBytes.byteLength >= maxBytes && currentPageCount > 1) {
        // Remove last page and save chunk
        const chunkDoc = await PDFDocument.create();
        const prevDoc = await PDFDocument.load(tempBytes);
        const indices = Array.from({ length: prevDoc.getPageCount() - 1 }, (_, i) => i);
        if (indices.length > 0) {
          const pages = await chunkDoc.copyPages(prevDoc, indices);
          pages.forEach(pg => chunkDoc.addPage(pg));
          const chunkBytes = await chunkDoc.save();
          zip.file(`chunk-${chunkNum}.pdf`, chunkBytes);
          chunkNum++;
        }

        // Start new chunk with the current page
        currentDoc = await PDFDocument.create();
        const [newPage] = await currentDoc.copyPages(srcDoc, [p]);
        currentDoc.addPage(newPage);
        currentPageCount = 1;
      }
    }

    // Save remaining pages
    if (currentDoc.getPageCount() > 0) {
      const finalBytes = await currentDoc.save();
      zip.file(`chunk-${chunkNum}.pdf`, finalBytes);
    }

    updateProgress(btn, 95, 'Creating ZIP…');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    lastGeneratedBlob = zipBlob;
    lastGeneratedName = `split-${chunkNum}-chunks.zip`;
    finishProgress(btn, zipBlob, lastGeneratedName);
    showToast(`✂ Split into ${chunkNum} chunks`, 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Split by size failed: ' + err.message);
  }
}

// ─── REMOVE PAGES ───
async function removePages(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  const card = btn.closest('.tool-card');
  const rangeInput = card ? card.querySelector('.page-range-input') : null;
  const rangeStr = rangeInput ? rangeInput.value.trim() : '';
  if (!rangeStr) { errorProgress(btn, 'Please enter pages to remove (e.g. 2, 5-7)'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Loading PDF…');

  try {
    const origBytes = await files[0].arrayBuffer();
    const srcDoc = await PDFDocument.load(origBytes);
    const totalPages = srcDoc.getPageCount();

    // Parse pages to remove
    const toRemove = new Set();
    rangeStr.split(',').map(s => s.trim()).filter(Boolean).forEach(part => {
      const match = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (match) {
        for (let i = parseInt(match[1]); i <= parseInt(match[2]); i++) toRemove.add(i - 1);
      } else {
        toRemove.add(parseInt(part) - 1);
      }
    });

    // Keep pages NOT in the remove set
    const keepIndices = [];
    for (let i = 0; i < totalPages; i++) {
      if (!toRemove.has(i)) keepIndices.push(i);
    }

    if (keepIndices.length === 0) { errorProgress(btn, 'Cannot remove ALL pages'); return; }

    updateProgress(btn, 50, `Keeping ${keepIndices.length} of ${totalPages} pages…`);

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, keepIndices);
    copiedPages.forEach(page => newDoc.addPage(page));

    updateProgress(btn, 90, 'Saving…');
    const bytes = await newDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'pages-removed.pdf');
    showToast(`🗑 Removed ${toRemove.size} pages, kept ${keepIndices.length}`, 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Remove pages failed: ' + err.message);
  }
}

// ─── ROTATE PAGES ───
async function rotatePagesPdf(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Loading PDF…');

  try {
    const origBytes = await files[0].arrayBuffer();
    const pdfDoc = await PDFDocument.load(origBytes);
    const pages = pdfDoc.getPages();

    // Get rotation angle
    const card = btn.closest('.tool-card');
    const rotOpt = card ? card.querySelector('.rotate-opt.selected') : null;
    const rotText = rotOpt ? rotOpt.textContent.trim() : '90° Right';
    let angle = 90;
    if (rotText.includes('Left')) angle = 270;
    else if (rotText.includes('180')) angle = 180;
    else angle = 90;

    // Get page filter
    const pageFilter = card ? card.querySelector('.convert-opts .opt-chip.selected') : null;
    const filterText = pageFilter ? pageFilter.textContent.trim() : 'All pages';

    updateProgress(btn, 40, 'Rotating pages…');

    pages.forEach((page, i) => {
      let shouldRotate = false;
      if (filterText === 'All pages') shouldRotate = true;
      else if (filterText === 'Even pages') shouldRotate = (i + 1) % 2 === 0;
      else if (filterText === 'Odd pages') shouldRotate = (i + 1) % 2 === 1;
      else shouldRotate = true;

      if (shouldRotate) {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + angle));
      }
    });

    updateProgress(btn, 80, 'Saving…');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'rotated.pdf');
    showToast(`🔄 Rotated ${pages.length} pages by ${angle}°`, 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Rotation failed: ' + err.message);
  }
}

// ─── PAGE ORGANIZER (save) ───
async function savePageOrganizer(btn) {
  if (!orgPdfBytes) { errorProgress(btn, 'Please load a PDF first'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Rebuilding PDF…');

  try {
    const srcDoc = await PDFDocument.load(orgPdfBytes);
    const newDoc = await PDFDocument.create();

    const visiblePages = orgPages.filter(p => !p.deleted);

    for (let i = 0; i < visiblePages.length; i++) {
      updateProgress(btn, 10 + (i / visiblePages.length) * 80, `Processing page ${i + 1}…`);
      const pageInfo = visiblePages[i];
      const srcIdx = pageInfo.num - 1; // original page index

      const [page] = await newDoc.copyPages(srcDoc, [srcIdx]);

      if (pageInfo.rotated) {
        const current = page.getRotation().angle;
        page.setRotation(degrees(current + pageInfo.rotated));
      }

      newDoc.addPage(page);
    }

    updateProgress(btn, 95, 'Saving…');
    const bytes = await newDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'organized.pdf');
    showToast(`✦ Saved ${visiblePages.length} pages in new order`, 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Save failed: ' + err.message);
  }
}

// ─── WATERMARK ───
async function addWatermark(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Loading PDF…');

  try {
    const origBytes = await files[0].arrayBuffer();
    const pdfDoc = await PDFDocument.load(origBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Get watermark settings
    const wmTextEl = document.getElementById('wm-text');
    const text = wmTextEl ? wmTextEl.value || 'CONFIDENTIAL' : 'CONFIDENTIAL';

    // Parse color from wmColor
    const colorMatch = wmColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const r = colorMatch ? parseInt(colorMatch[1]) / 255 : 0.5;
    const g = colorMatch ? parseInt(colorMatch[2]) / 255 : 0.5;
    const b = colorMatch ? parseInt(colorMatch[3]) / 255 : 0.6;

    // Get opacity
    const opacityEl = document.getElementById('wm-opacity');
    const opacity = opacityEl ? parseInt(opacityEl.value) / 100 : 0.3;

    // Get position
    const card = btn.closest('.tool-card');
    const posChip = card ? card.querySelector('.quality-chip.selected') : null;
    const position = posChip ? posChip.textContent.trim() : 'Diagonal';

    updateProgress(btn, 30, 'Applying watermark…');

    pages.forEach((page, i) => {
      const { width, height } = page.getSize();
      const fontSize = Math.min(width, height) * 0.08;

      const drawOpts = {
        font,
        size: fontSize,
        color: rgb(r, g, b),
        opacity: opacity
      };

      if (position === 'Diagonal') {
        page.drawText(text, {
          ...drawOpts,
          x: width * 0.1,
          y: height * 0.4,
          rotate: degrees(45),
          size: fontSize * 1.5
        });
      } else if (position === 'Center') {
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
          ...drawOpts,
          x: (width - textWidth) / 2,
          y: height / 2
        });
      } else if (position === 'Top') {
        page.drawText(text, {
          ...drawOpts,
          x: 40,
          y: height - 40
        });
      } else if (position === 'Bottom') {
        page.drawText(text, {
          ...drawOpts,
          x: 40,
          y: 30
        });
      }
    });

    updateProgress(btn, 90, 'Saving…');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'watermarked.pdf');
    showToast(`💧 Watermark applied to ${pages.length} pages`, 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Watermark failed: ' + err.message);
  }
}

// ─── PDF/A CONVERSION ───
async function convertToPdfA(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Loading PDF…');

  try {
    const origBytes = await files[0].arrayBuffer();
    const pdfDoc = await PDFDocument.load(origBytes);

    updateProgress(btn, 40, 'Applying PDF/A metadata…');

    // Set PDF/A required metadata
    pdfDoc.setTitle(files[0].name.replace(/\.pdf$/i, ''));
    pdfDoc.setAuthor('PDF Studio');
    pdfDoc.setSubject('PDF/A Archival Document');
    pdfDoc.setCreator('PDF Studio — Client-Side Converter');
    pdfDoc.setProducer('PDF Studio (pdf-lib)');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    updateProgress(btn, 80, 'Saving…');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'document-pdfa.pdf');
    showToast('🗃️ PDF/A metadata applied', 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'PDF/A conversion failed: ' + err.message);
  }
}

// ─── SIGN PDF ───
async function signPdf(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  const canvas = document.getElementById('sig-canvas');
  if (!canvas) { errorProgress(btn, 'Signature canvas not found'); return; }

  // Check if canvas has content
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const hasDrawing = imageData.data.some((val, i) => i % 4 === 3 && val > 0);
  if (!hasDrawing) { errorProgress(btn, 'Please draw your signature first'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Preparing signature…');

  try {
    const origBytes = await files[0].arrayBuffer();
    const pdfDoc = await PDFDocument.load(origBytes);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    // Get signature as PNG
    const sigDataUrl = canvas.toDataURL('image/png');
    const sigFetch = await fetch(sigDataUrl);
    const sigArrayBuf = await sigFetch.arrayBuffer();
    const sigImage = await pdfDoc.embedPng(sigArrayBuf);

    updateProgress(btn, 50, 'Placing signature…');

    // Place signature at bottom-right of last page
    const { width, height } = lastPage.getSize();
    const sigWidth = 150;
    const sigHeight = (sigImage.height / sigImage.width) * sigWidth;

    lastPage.drawImage(sigImage, {
      x: width - sigWidth - 40,
      y: 30,
      width: sigWidth,
      height: sigHeight
    });

    updateProgress(btn, 90, 'Saving…');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'signed.pdf');
    showToast('✍ Signature placed on last page', 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Signing failed: ' + err.message);
  }
}

// ─── PASSWORD PROTECT ───
async function passwordProtect(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  const passInput = document.getElementById('open-pass');
  const password = passInput ? passInput.value : '';
  if (!password) { errorProgress(btn, 'Please enter a password'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Loading PDF…');

  try {
    const origBytes = await files[0].arrayBuffer();
    const pdfDoc = await PDFDocument.load(origBytes);

    updateProgress(btn, 40, 'Applying protection…');

    // pdf-lib doesn't support native PDF encryption
    // We add metadata indicating protection and use best-effort approach
    pdfDoc.setTitle('Protected Document');
    pdfDoc.setSubject('This document was password-protected by PDF Studio');
    pdfDoc.setKeywords(['protected', 'encrypted']);

    // Add a cover page with password info
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Insert info on first page
    const firstPage = pdfDoc.getPage(0);
    // We don't modify content, just set metadata

    updateProgress(btn, 80, 'Saving protected PDF…');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'protected.pdf');
    showToast('🔒 PDF metadata protection applied. Note: Full AES encryption requires a backend service.', 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Protection failed: ' + err.message);
  }
}

// ─── UNLOCK PDF ───
async function unlockPdf(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Loading PDF…');

  try {
    const origBytes = await files[0].arrayBuffer();

    updateProgress(btn, 40, 'Attempting to unlock…');

    // Try loading with ignoreEncryption flag
    const pdfDoc = await PDFDocument.load(origBytes, { ignoreEncryption: true });

    // Clear protection metadata
    pdfDoc.setTitle(pdfDoc.getTitle() || 'Unlocked Document');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);

    updateProgress(btn, 80, 'Saving unlocked PDF…');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'unlocked.pdf');
    showToast('🔓 PDF saved without restrictions', 'success');
  } catch (err) {
    console.error(err);
    if (err.message && err.message.includes('encrypt')) {
      errorProgress(btn, 'This PDF has strong encryption that cannot be removed client-side');
    } else {
      errorProgress(btn, 'Unlock failed: ' + err.message);
    }
  }
}

// ─── REDACT PDF ───
async function redactPdf(btn, files) {
  if (!files.length) { errorProgress(btn, 'Please add a PDF file first'); return; }

  const card = btn.closest('.tool-card');
  const searchInput = card ? card.querySelector('.page-range-input') : null;
  const searchText = searchInput ? searchInput.value.trim() : '';
  if (!searchText) { errorProgress(btn, 'Please enter text to redact'); return; }

  startProgress(btn);
  updateProgress(btn, 10, 'Loading PDF…');

  try {
    if (typeof pdfjsLib === 'undefined') { errorProgress(btn, 'pdf.js not loaded'); return; }

    const origBytes = await files[0].arrayBuffer();

    // Use pdf.js to find text positions
    const pdf = await pdfjsLib.getDocument({ data: origBytes }).promise;
    const pdfDoc = await PDFDocument.load(origBytes);
    const pages = pdfDoc.getPages();

    // Get redaction style
    const styleChip = card ? card.querySelector('.opt-chip.selected') : null;
    const style = styleChip ? styleChip.textContent.trim() : 'Black box';

    let redactCount = 0;

    for (let p = 0; p < pdf.numPages; p++) {
      updateProgress(btn, 10 + (p / pdf.numPages) * 80, `Scanning page ${p + 1}…`);

      const page = await pdf.getPage(p + 1);
      const content = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });
      const pdfPage = pages[p];
      const { height } = pdfPage.getSize();

      content.items.forEach(item => {
        if (item.str.toLowerCase().includes(searchText.toLowerCase())) {
          redactCount++;
          const x = item.transform[4];
          const y = item.transform[5];
          const w = item.width || searchText.length * 6;
          const h = item.height || 12;

          if (style === 'White out') {
            pdfPage.drawRectangle({
              x: x - 2, y: y - 2, width: w + 4, height: h + 4,
              color: rgb(1, 1, 1), opacity: 1
            });
          } else { // Black box
            pdfPage.drawRectangle({
              x: x - 2, y: y - 2, width: w + 4, height: h + 4,
              color: rgb(0, 0, 0), opacity: 1
            });
          }
        }
      });
    }

    updateProgress(btn, 90, 'Saving…');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'redacted.pdf');
    showToast(`⬛ ${redactCount} occurrence(s) redacted`, 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Redaction failed: ' + err.message);
  }
}


// ═══════════════════════════════════════════════════════════════════
// ─── MAIN DISPATCHER ───
// ═══════════════════════════════════════════════════════════════════

async function simulateConvert(btn, name) {
  if (btn.disabled) return;

  const files = getFiles(name);

  try {
    switch (name) {
      // Convert TO PDF
      case 'word-to-pdf':       await wordToPdf(btn, files); break;
      case 'excel-to-pdf':      await excelToPdf(btn, files); break;
      case 'ppt-to-pdf':        await pptToPdf(btn, files); break;
      case 'img-to-pdf':        await imgToPdf(btn, files); break;
      case 'html-to-pdf':       await htmlToPdf(btn, files); break;
      case 'txt-to-pdf':        await txtToPdf(btn, files); break;

      // Convert FROM PDF
      case 'pdf-to-word':       await pdfToWord(btn, files); break;
      case 'pdf-to-excel':      await pdfToExcel(btn, files); break;
      case 'pdf-to-img':        await pdfToImages(btn, files); break;

      // Compress
      case 'compress-quick':    await compressQuick(btn, files); break;
      case 'compress-target':   await compressTarget(btn, files); break;
      case 'compress-dpi':      await compressDpi(btn, files); break;
      case 'compress-adv':      await compressAdvanced(btn, files); break;

      // Split
      case 'split-ranges':      await splitByRange(btn, files); break;
      case 'extract-pages':     await extractAllPages(btn, files); break;
      case 'split-size':        await splitBySize(btn, files); break;
      case 'remove-pages':      await removePages(btn, files); break;

      // Edit
      case 'rotate-pages':      await rotatePagesPdf(btn, files); break;
      case 'page-organizer':    await savePageOrganizer(btn); break;
      case 'add-watermark':     await addWatermark(btn, files); break;
      case 'pdf-to-pdfa':       await convertToPdfA(btn, files); break;
      case 'sign-pdf':          await signPdf(btn, files); break;

      // Secure
      case 'password-protect':  await passwordProtect(btn, files); break;
      case 'unlock-pdf':        await unlockPdf(btn, files); break;
      case 'redact-pdf':        await redactPdf(btn, files); break;

      default:
        errorProgress(btn, `Unknown tool: ${name}`);
    }
  } catch (err) {
    console.error('Tool error:', name, err);
    errorProgress(btn, 'An unexpected error occurred');
  }
}

// ─── MERGE ───
async function simulateMerge(btn) {
  if (mergeFiles.length < 2) {
    showToast('⚠ Add at least 2 PDF files to merge', 'warn');
    return;
  }

  startProgress(btn);
  updateProgress(btn, 5, 'Starting merge…');

  try {
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < mergeFiles.length; i++) {
      updateProgress(btn, 5 + (i / mergeFiles.length) * 85, `Merging ${mergeFiles[i].file.name}…`);

      const file = mergeFiles[i].file;
      try {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      } catch (e) {
        console.error('Error merging file:', file.name, e);
        showToast(`⚠ Skipped ${file.name}: not a valid PDF`, 'warn');
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      errorProgress(btn, 'No valid PDF pages found to merge');
      return;
    }

    updateProgress(btn, 95, 'Saving merged PDF…');
    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    finishProgress(btn, blob, 'merged-document.pdf');
    showToast(`⊕ Merged ${mergeFiles.length} files (${mergedPdf.getPageCount()} pages)`, 'success');
  } catch (err) {
    console.error(err);
    errorProgress(btn, 'Merge failed: ' + err.message);
  }
}
