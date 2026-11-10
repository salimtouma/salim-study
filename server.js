const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const LIBRARY_FILE = path.join(DATA_DIR, 'library.json');
const MAX_FILE_SIZE_MB = 100;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(LIBRARY_FILE)) {
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify({ documents: [] }, null, 2));
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const original = file.originalname.replace(/\s+/g, '_');
    const safeName = original.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      cb(new Error('Only PDF files are allowed.'));
      return;
    }
    cb(null, true);
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function normalizeText(value = '') {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .trim();
}

function loadLibrary() {
  try {
    const raw = fs.readFileSync(LIBRARY_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.documents) ? parsed.documents : [];
  } catch (error) {
    return [];
  }
}

function saveLibrary(documents) {
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify({ documents }, null, 2));
}

function splitIntoChunks(text, chunkSize = 800) {
  const rawChunks = text.split(/(?<=[.!?\n])\s+|\n+/);
  const chunks = [];
  let current = '';

  for (const part of rawChunks) {
    const clean = normalizeText(part);
    if (!clean) continue;
    if ((current + ' ' + clean).length <= chunkSize) {
      current = current ? `${current} ${clean}` : clean;
    } else {
      if (current) chunks.push(current);
      current = clean;
    }
  }

  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

async function extractPdfText(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const parsed = await pdfParse(fileBuffer);
  return parsed.text || '';
}

function getKeywords(text) {
  return [...new Set(
    normalizeText(text)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
  )];
}

function findRelevantText(question, doc) {
  const questionWords = getKeywords(question);
  const sentences = (doc.text || '').split(/(?<=[.!?])\s+|\n+/).map(s => normalizeText(s)).filter(Boolean);

  let bestMatches = [];

  for (const sentence of sentences) {
    const norm = sentence.toLowerCase();
    let score = 0;
    for (const word of questionWords) {
      if (norm.includes(word)) score += 2;
    }
    if (score > 0) {
      bestMatches.push({ sentence, score });
    }
  }

  bestMatches.sort((a, b) => b.score - a.score);
  return bestMatches.slice(0, 3).map(item => item.sentence);
}

function buildSimpleLexicon() {
  return {
    mathematics: {
      arabic: 'الرياضيات',
      english: 'mathematics',
      french: 'mathématiques'
    },
    equation: {
      arabic: 'معادلة',
      english: 'equation',
      french: 'équation'
    },
    derivative: {
      arabic: 'مشتقة',
      english: 'derivative',
      french: 'dérivée'
    },
    physics: {
      arabic: 'الفيزياء',
      english: 'physics',
      french: 'physique'
    },
    chemistry: {
      arabic: 'الكيمياء',
      english: 'chemistry',
      french: 'chimie'
    },
    biology: {
      arabic: 'علم الأحياء',
      english: 'biology',
      french: 'biologie'
    }
  };
}

function toArabicDate(value) {
  const date = new Date(value);
  return date.toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function answerQuestion(question, docs) {
  const questionText = normalizeText(question || '');
  if (!questionText) {
    return 'سأساعدك في الفهم خطوة بخطوة. اكتب السؤال أو أرفق صورة للدرس.';
  }

  if (!docs || docs.length === 0) {
    return 'لم أجد أي كتاب مرفوع في المكتبة بعد. ارفع ملف PDF أولاً، ثم أسأله. حتى الآن يمكنني شرح الفكرة العامة فقط.';
  }

  const intro = docs.map(doc => ({ title: doc.title, subject: doc.subject, text: (doc.text || '') }));
  const matched = [];

  for (const doc of intro) {
    const hits = findRelevantText(questionText, doc);
    if (hits.length) {
      matched.push({ title: doc.title, subject: doc.subject, text: hits.join(' ') });
    }
  }

  if (!matched.length) {
    return 'لم أجد إجابة دقيقة داخل الكتب المرفوعة. لكنني أستطيع شرح الفكرة العامة بطريقة مبسّطة، مع توضيح إن أردت. إذا رفعت صفحة أو مثالاً، سأفهم السؤال بدقة أكثر.';
  }

  const sources = matched.slice(0, 2).map(item => item.title).join('، ');
  const answerText = matched
    .slice(0, 2)
    .map(item => item.text)
    .join(' ')
    .slice(0, 1600);

  const lexicon = buildSimpleLexicon();
  const terms = Object.entries(lexicon)
    .slice(0, 4)
    .map(([key, value]) => `${value.arabic} = ${value.english} / ${value.french}`)
    .join(' • ');

  return `استناداً إلى ${sources}:\n\n${answerText}\n\nشرح مبسط: ابدأ من الفكرة الأساسية، ثم اذكر المثال، ثم اعمل الخطوات بالتسلسل.\n\nمعجم سريع: ${terms}`;
}

app.get('/api/health', (_, res) => {
  res.json({ ok: true, configured: true, maxFileSizeMB: MAX_FILE_SIZE_MB });
});

app.get('/api/library', (_, res) => {
  const docs = loadLibrary();
  res.json({ documents: docs, officialSources: [
    { label: 'بوابة المناهج الرسمية', url: 'https://curricula.moed.gov.sy/', status: 'مفتوح', type: 'منهاج' },
    { label: 'مكتبة وزارة التربية', url: 'https://moe.sy/', status: 'مفتوح', type: 'منهاج' }
  ] });
});

app.delete('/api/library/:id', (req, res) => {
  const docs = loadLibrary();
  const target = docs.find(doc => doc.id === req.params.id);
  if (!target) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }

  if (target.filePath && fs.existsSync(target.filePath)) {
    fs.unlinkSync(target.filePath);
  }

  const updated = docs.filter(doc => doc.id !== req.params.id);
  saveLibrary(updated);
  res.json({ ok: true, deletedId: req.params.id });
});

app.post('/api/library/import', upload.single('book'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'PDF file is required.' });
      return;
    }

    const title = (req.body.title || 'كتاب جديد').trim() || 'كتاب جديد';
    const subject = (req.body.subject || 'عام').trim() || 'عام';
    const sourceUrl = (req.body.sourceUrl || '').trim();
    const filePath = req.file.path;

    const text = await extractPdfText(filePath);
    const chunks = splitIntoChunks(text, 900);
    const estimatedPages = Math.max(1, Math.ceil((text.split(/\s+/).length || 1) / 250));

    const doc = {
      id: `doc-${Date.now()}`,
      title,
      subject,
      sourceUrl,
      filePath,
      fileName: req.file.originalname,
      text,
      chunks,
      pages: estimatedPages,
      createdAt: new Date().toISOString(),
      sourceLabel: sourceUrl || 'ملف محلي',
      size: req.file.size
    };

    const docs = loadLibrary();
    docs.push(doc);
    saveLibrary(docs);

    res.json({ ok: true, document: { ...doc, text: undefined }, chunks: chunks.length });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message || 'Failed to import PDF.' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const docs = loadLibrary();
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const latest = messages.filter(item => item && typeof item.content === 'string').slice(-1)[0];
    const question = latest ? latest.content : '';
    const answer = await answerQuestion(question, docs);

    res.json({ ok: true, answer, at: new Date().toISOString() });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate answer.' });
  }
});

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Salim Study app running on http://localhost:${PORT}`);
});
