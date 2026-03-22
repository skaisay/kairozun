// ── Kairozun Collage Window ──────────────────────────────────────────────────

const i18n = {
  en: {
    collageTitle: 'Create Collage',
    collageHint: 'Select 2-9 screenshots, then click Create',
    collageCreate: 'Create',
  },
  ru: {
    collageTitle: 'Создать коллаж',
    collageHint: 'Выберите 2-9 скриншотов, затем нажмите Создать',
    collageCreate: 'Создать',
  },
};

const init = window.kairozun.getCollageInit();
const lang = init.lang || 'en';
const t = i18n[lang] || i18n.en;

document.getElementById('collage-title').textContent = t.collageTitle;
document.getElementById('collage-hint').textContent = t.collageHint;
document.getElementById('collage-create-btn').textContent = t.collageCreate;

document.getElementById('btn-close').addEventListener('click', () => window.kairozun.closeCollage());

// ── Grid ─────────────────────────────────────────────────────────────────────

const grid = document.getElementById('collage-grid');
const countEl = document.getElementById('collage-count');
const createBtn = document.getElementById('collage-create-btn');
let selected = [];
let screenshots = [];

function updateCount() {
  countEl.textContent = selected.length + ' / 9';
  createBtn.disabled = selected.length < 2;
}

async function loadGrid() {
  screenshots = await window.kairozun.getScreenshots();
  if (!screenshots || screenshots.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const img = entry.target;
      const p = img.dataset.loadPath;
      if (!p) continue;
      observer.unobserve(img);
      img.removeAttribute('data-load-path');
      window.kairozun.readScreenshot(p).then(b64 => {
        if (b64) img.src = 'data:image/png;base64,' + b64;
      }).catch(() => {});
    }
  }, { rootMargin: '200px' });

  const frag = document.createDocumentFragment();
  for (const ss of screenshots) {
    const thumb = document.createElement('div');
    thumb.className = 'collage-thumb';

    const img = document.createElement('img');
    img.alt = ss.name;
    img.src = '';
    img.dataset.loadPath = ss.path;
    thumb.appendChild(img);

    const check = document.createElement('div');
    check.className = 'collage-thumb-check';
    check.textContent = '\u2713';
    thumb.appendChild(check);

    thumb.addEventListener('click', () => {
      const idx = selected.indexOf(ss);
      if (idx >= 0) {
        selected.splice(idx, 1);
        thumb.classList.remove('selected');
      } else if (selected.length < 9) {
        selected.push(ss);
        thumb.classList.add('selected');
      }
      updateCount();
    });

    frag.appendChild(thumb);
  }
  grid.appendChild(frag);

  grid.querySelectorAll('img[data-load-path]').forEach(img => observer.observe(img));
}

loadGrid();

// ── Create Collage ───────────────────────────────────────────────────────────

createBtn.addEventListener('click', async () => {
  if (selected.length < 2) return;
  createBtn.disabled = true;
  createBtn.textContent = '...';

  try {
    const count = selected.length;
    const cols = count <= 2 ? 2 : count <= 4 ? 2 : 3;
    const rows = Math.ceil(count / cols);
    const cellW = 480;
    const cellH = 270;
    const gap = 4;
    const totalW = cols * cellW + (cols - 1) * gap;
    const totalH = rows * cellH + (rows - 1) * gap;

    const canvas = document.createElement('canvas');
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111118';
    ctx.fillRect(0, 0, totalW, totalH);

    let drawn = 0;
    for (let i = 0; i < selected.length; i++) {
      const b64 = await window.kairozun.readScreenshot(selected[i].path);
      if (!b64) continue;
      const blob = await fetch('data:image/png;base64,' + b64).then(r => r.blob());
      const bmp = await createImageBitmap(blob);
      const col = drawn % cols;
      const row = Math.floor(drawn / cols);
      const x = col * (cellW + gap);
      const y = row * (cellH + gap);
      const imgRatio = bmp.width / bmp.height;
      const cellRatio = cellW / cellH;
      let sx = 0, sy = 0, sw = bmp.width, sh = bmp.height;
      if (imgRatio > cellRatio) {
        sw = bmp.height * cellRatio;
        sx = (bmp.width - sw) / 2;
      } else {
        sh = bmp.width / cellRatio;
        sy = (bmp.height - sh) / 2;
      }
      ctx.drawImage(bmp, sx, sy, sw, sh, x, y, cellW, cellH);
      bmp.close();
      drawn++;
    }

    if (drawn < 2) return;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64Data = dataUrl.split(',')[1];
    await window.kairozun.saveEditedScreenshot({ base64Data, originalName: 'collage.jpg' });

    window.kairozun.closeCollage();
  } catch { /* ignore */ } finally {
    createBtn.textContent = t.collageCreate;
    createBtn.disabled = false;
  }
});
