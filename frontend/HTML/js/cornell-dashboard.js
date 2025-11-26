const API_BASE = "https://otaklar-backend-czh69.ondigitalocean.app";
const grid = document.getElementById('notes-grid');
const addNoteBtn = document.getElementById('add-note-btn');
const logoutBtn = document.getElementById('logout-btn');

function formatDate(ts) {
  const date = new Date(ts);
  return date.toLocaleString();
}

function buildCard(doc) {
  const col = document.createElement('div');
  col.className = 'col-12 col-md-4 mb-4';

  const card = document.createElement('div');
  card.className = 'card h-100 shadow-sm';

  const img = document.createElement('img');
  img.src =
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340"><rect width="600" height="340" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="18">Generando vista previa...</text></svg>';
  img.alt = 'Cornell note';
  img.className = 'border-bottom';

  const body = document.createElement('div');
  body.className = 'card-body';

  const wrapper = document.createElement('div');
  wrapper.className = 'container-fluid d-flex flex-column justify-content-center align-items-center text-center';

  const titleEl = document.createElement('strong');
  const titleP = document.createElement('p');
  titleP.textContent = doc.title || 'Documento';
  titleEl.appendChild(titleP);

  const updated = document.createElement('p');
  updated.textContent = `Última actualización: ${formatDate(doc.updated_at)}`;

  const btnWrap = document.createElement('div');
  btnWrap.className = 'container-fluid d-flex justify-content-center';

  const link = document.createElement('a');
  link.className = 'btn btn-primary w-50';
  link.href = `./cornell-editor.html?id=${doc.id}`;
  link.textContent = 'Abrir';

  btnWrap.appendChild(link);
  wrapper.appendChild(titleEl);
  wrapper.appendChild(updated);
  wrapper.appendChild(btnWrap);
  body.appendChild(wrapper);
  card.appendChild(img);
  card.appendChild(body);
  col.appendChild(card);

  setThumbnail(doc, img);

  return col;
}

async function loadDocuments() {
  try {
    const res = await fetch(`${API_BASE}/documents`, { credentials: 'include', cache: 'no-store' });

    if (res.status === 401) {
      window.location.href = './login.html';
      return;
    }

    if (!res.ok) {
      grid.innerHTML = '<p class="text-center text-muted">No se pudieron cargar tus notas.</p>';
      return;
    }

    const docs = await res.json();
    if (!docs.length) {
      grid.innerHTML = '<p class="text-center text-muted">Aún no tienes notas guardadas.</p>';
      return;
    }

    grid.innerHTML = '';
    docs.forEach((doc) => {
      grid.appendChild(buildCard(doc));
    });
  } catch (err) {
    grid.innerHTML = '<p class="text-center text-muted">Error al cargar las notas.</p>';
    console.error(err);
  }
}

loadDocuments();

async function createNewNote() {
  try {
    const res = await fetch(`${API_BASE}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: 'Nueva nota',
        contentA: {},
        contentB: {},
      }),
    });

    if (res.status === 401) {
      window.location.href = './login.html';
      return;
    }

    if (!res.ok) {
      alert('No se pudo crear la nota.');
      return;
    }

    const doc = await res.json();
    window.location.href = `./cornell-editor.html?id=${doc.id}`;
  } catch (err) {
    console.error(err);
    alert('No se pudo crear la nota.');
  }
}

if (addNoteBtn) {
  addNoteBtn.addEventListener('click', createNewNote);
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('No se pudo cerrar sesión', err);
    } finally {
      window.location.href = './login.html';
    }
  });
}

const detailCache = new Map();

async function fetchDocDetail(id) {
  if (detailCache.has(id)) return detailCache.get(id);
  const res = await fetch(`${API_BASE}/api/documents/${id}`, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo obtener documento');
  const data = await res.json();
  detailCache.set(id, data);
  return data;
}

function deltaToText(delta) {
  if (!delta || !delta.ops) return '';
  return delta.ops
    .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
    .join('');
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxY = 300) {
  const paragraphs = text.split(/\r?\n/);
  let truncated = false;
  const buffer = 12; // leave a little room before the cutoff

  for (let p = 0; p < paragraphs.length; p++) {
    const paragraph = paragraphs[p];
    const words = paragraph.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
      if (y > maxY - buffer) {
        truncated = true;
        break;
      }
    }
    ctx.fillText(line, x, y);
    if (truncated || y > maxY - buffer) break;
    if (p < paragraphs.length - 1) {
      y += lineHeight;
      if (y > maxY - buffer) {
        truncated = true;
        break;
      }
    }
  }

}

function createThumbnail(detail) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px Arial';
  ctx.fillText(detail.title || 'Documento', 20, 40);

  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(20, 60, canvas.width - 40, canvas.height - 100);
  ctx.strokeRect(20, 60, (canvas.width - 40) * 0.32, canvas.height - 100);

  ctx.fillStyle = '#0f172a';
  ctx.font = '16px Arial';
  ctx.fillText('Cue', 30, 85);
  ctx.fillText('Notes', canvas.width * 0.32 + 35, 85);

  ctx.fillStyle = '#334155';
  ctx.font = '14px Arial';
  const cueText = deltaToText(detail.contentA || {});
  const notesText = deltaToText(detail.contentB || {});
  wrapText(ctx, cueText || 'Sin contenido', 30, 110, (canvas.width - 40) * 0.3, 18);
  wrapText(ctx, notesText || 'Sin contenido', canvas.width * 0.32 + 35, 110, (canvas.width - 40) * 0.64, 18);

  return canvas.toDataURL('image/png');
}

async function setThumbnail(doc, imgEl) {
  try {
    const detail = await fetchDocDetail(doc.id);
    const dataUrl = createThumbnail(detail);
    imgEl.src = dataUrl;
  } catch (err) {
    console.error('No se pudo generar vista previa', err);
    imgEl.src = '../../multimedia/cornell-dashboard/img/cornell-example.png';
  }
}
