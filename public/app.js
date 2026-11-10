const $ = (id) => document.getElementById(id);

const load = (key, defaultValue) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const migrate = (newKey, oldKeys, defaultValue) => {
  const current = load(newKey, null);
  if (current !== null) return current;
  for (const oldKey of oldKeys) {
    const value = load(oldKey, null);
    if (value !== null) {
      save(newKey, value);
      return value;
    }
  }
  return defaultValue;
};

$('date').textContent = new Date().toLocaleDateString('ar', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
});

let tasks = migrate('ss5_tasks', ['ss4tasks', 'v4_tasks'], []);
let notes = migrate('ss5_notes', ['ss4notes', 'v4_notes'], []);
let slots = migrate('ss5_slots', ['ss4slots', 'v4_slots'], []);
let sessions = load('ss5_sessions', []);
let history = [];

function page(id) {
  document.querySelectorAll('.page').forEach((pageEl) => {
    pageEl.classList.toggle('active', pageEl.id === id);
  });
  document.querySelectorAll('.nav button').forEach((button) => {
    button.classList.toggle('active', button.dataset.page === id);
  });
}

document.querySelectorAll('[data-page]').forEach((button) => {
  button.onclick = () => page(button.dataset.page);
});

async function loadLibrary() {
  try {
    const response = await fetch('/api/library');
    const data = await response.json();
    const docs = data.documents || [];
    const cards = ['الرياضيات', 'الفيزياء', 'الكيمياء', 'علم الأحياء', 'اللغة العربية', 'اللغة الإنكليزية', 'اللغة الفرنسية'];

    $('subjectCards').innerHTML = '';
    cards.forEach((subject) => {
      const count = docs.filter((doc) => doc.subject === subject).length;
      const card = document.createElement('div');
      card.className = 'bookcard';
      card.innerHTML = `
        <b>${subject}</b>
        <p class="muted">${count ? `${count} كتاب/ملف مفهرس` : 'لم تتم إضافة ملفات بعد'}</p>
        <span class="pill">${count ? 'متاح للمدرس' : 'بانتظار الاستيراد'}</span>
      `;
      $('subjectCards').appendChild(card);
    });

    $('libraryDocs').innerHTML = '';
    if (!docs.length) {
      $('libraryDocs').textContent = 'المكتبة فارغة حالياً. ابدأ بتحميل ملفات PDF من هنا.';
    }

    docs.forEach((doc) => {
      const item = document.createElement('div');
      item.className = 'libraryitem';
      item.innerHTML = `
        <b>${doc.title}</b>
        <small>${doc.subject} • ${doc.pages || 1} صفحة • ${doc.sourceLabel || 'ملف محلي'}</small>
      `;

      const delBtn = document.createElement('button');
      delBtn.textContent = 'حذف من المكتبة';
      delBtn.onclick = async () => {
        if (!confirm('حذف هذا الكتاب وفهرسته من الجهاز؟')) return;
        await fetch(`/api/library/${encodeURIComponent(doc.id)}`, { method: 'DELETE' });
        loadLibrary();
      };
      item.appendChild(delBtn);
      $('libraryDocs').appendChild(item);
    });

    $('officialSources').innerHTML = '';
    (data.officialSources || []).forEach((src) => {
      const item = document.createElement('div');
      item.className = 'libraryitem';
      item.innerHTML = `
        <a href="${src.url}" target="_blank" rel="noopener">${src.label}</a>
        <small>${src.type} — ${src.status}</small>
      `;
      $('officialSources').appendChild(item);
    });
  } catch (error) {
    $('libraryStatus').textContent = 'تعذر تحميل المكتبة: ' + (error.message || 'خطأ غير معروف');
  }
}

$('bookForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = $('bookFile').files[0];
  if (!file) return;

  $('importBook').disabled = true;
  $('libraryStatus').textContent = 'جارٍ استخراج النص وفهرسة صفحات الكتاب…';

  const formData = new FormData();
  formData.append('book', file);
  formData.append('title', $('bookTitle').value.trim());
  formData.append('subject', $('bookSubject').value);
  formData.append('sourceUrl', $('bookSource').value.trim());

  try {
    const response = await fetch('/api/library/import', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'فشل الاستيراد');

    $('libraryStatus').textContent = `تمت فهرسة «${data.document.title}»: ${data.document.pages} صفحة، ${data.chunks} مقطعاً.`;
    $('bookForm').reset();
    await loadLibrary();
  } catch (error) {
    $('libraryStatus').textContent = 'تعذر الاستيراد: ' + (error.message || 'خطأ غير معروف');
  } finally {
    $('importBook').disabled = false;
  }
});

function drawTasks() {
  const ul = $('taskList');
  ul.innerHTML = '';

  tasks.forEach((task, index) => {
    const item = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.onchange = () => {
      tasks[index].done = checkbox.checked;
      save('ss5_tasks', tasks);
      drawTasks();
    };

    const text = document.createElement('span');
    text.textContent = task.text;

    const remove = document.createElement('button');
    remove.textContent = 'حذف';
    remove.onclick = () => {
      tasks.splice(index, 1);
      save('ss5_tasks', tasks);
      drawTasks();
    };

    item.append(checkbox, text, remove);
    ul.appendChild(item);
  });

  $('pending').textContent = tasks.filter((task) => !task.done).length;
  $('completed').textContent = tasks.filter((task) => task.done).length;
}

function addTask() {
  const value = $('taskInput').value.trim();
  if (!value) return;
  tasks.push({ text: value, done: false });
  save('ss5_tasks', tasks);
  $('taskInput').value = '';
  drawTasks();
}

function drawNotes() {
  $('notesList').innerHTML = '';
  notes.forEach((note, index) => {
    const item = document.createElement('div');
    item.className = 'entry';
    const text = document.createElement('span');
    text.textContent = `${note.title} — ${note.body}`;
    const remove = document.createElement('button');
    remove.textContent = 'حذف';
    remove.onclick = () => {
      notes.splice(index, 1);
      save('ss5_notes', notes);
      drawNotes();
    };
    item.append(text, remove);
    $('notesList').appendChild(item);
  });
  $('notesCount').textContent = notes.length;
}

function addNote() {
  const title = $('noteTitle').value.trim();
  const body = $('noteBody').value.trim();
  if (!title || !body) return;
  notes.push({ title, body });
  save('ss5_notes', notes);
  $('noteTitle').value = '';
  $('noteBody').value = '';
  drawNotes();
}

function drawSlots() {
  $('slots').innerHTML = '';
  slots.forEach((slot, index) => {
    const item = document.createElement('div');
    item.className = 'entry';
    const text = document.createElement('span');
    text.textContent = `${slot.day} • ${slot.time} • ${slot.subject}`;
    const remove = document.createElement('button');
    remove.textContent = 'حذف';
    remove.onclick = () => {
      slots.splice(index, 1);
      save('ss5_slots', slots);
      drawSlots();
    };
    item.append(text, remove);
    $('slots').appendChild(item);
  });
}

function addSlot() {
  const time = $('slotTime').value;
  if (!time) return;
  slots.push({
    day: $('day').value,
    subject: $('subject').value,
    time
  });
  save('ss5_slots', slots);
  drawSlots();
}

let total = 1500;
let left = 1500;
let timer = null;

function showClock() {
  const minutes = String(Math.floor(left / 60)).padStart(2, '0');
  const seconds = String(left % 60).padStart(2, '0');
  $('clock').textContent = `${minutes}:${seconds}`;
}

function setTimer(minutes) {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
    $('timerStatus').textContent = 'اختر مدة بين دقيقة و180 دقيقة.';
    return;
  }
  clearInterval(timer);
  timer = null;
  total = minutes * 60;
  left = total;
  showClock();
  $('timerBtn').textContent = 'ابدأ';
  $('timerStatus').textContent = `تم اختيار ${minutes} دقيقة`;
}

function toggleTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    $('timerBtn').textContent = 'متابعة';
    return;
  }

  if (left <= 0) left = total;
  $('timerBtn').textContent = 'إيقاف مؤقت';
  timer = setInterval(() => {
    left -= 1;
    showClock();
    if (left <= 0) {
      clearInterval(timer);
      timer = null;
      $('timerBtn').textContent = 'ابدأ من جديد';
      $('timerStatus').textContent = 'أحسنت! انتهت جلسة التركيز.';
      sessions.unshift({
        date: new Date().toISOString(),
        minutes: Math.round(total / 60),
        subject: $('subjectTutor').value
      });
      sessions = sessions.slice(0, 100);
      save('ss5_sessions', sessions);
      drawSessions();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timer);
  timer = null;
  left = total;
  showClock();
  $('timerBtn').textContent = 'ابدأ';
  $('timerStatus').textContent = 'تمت إعادة ضبط المؤقت';
}

function drawSessions() {
  $('sessionsList').innerHTML = '';
  if (!sessions.length) {
    $('sessionsList').textContent = 'لا توجد جلسات مكتملة بعد.';
    return;
  }

  sessions.forEach((session) => {
    const item = document.createElement('div');
    item.className = 'entry';
    const text = document.createElement('span');
    text.textContent = `${new Date(session.date).toLocaleString('ar')} • ${session.minutes} دقيقة • ${session.subject || 'دراسة عامة'}`;
    item.appendChild(text);
    $('sessionsList').appendChild(item);
  });
}

function addMsg(role, text) {
  const item = document.createElement('div');
  item.className = `msg ${role === 'user' ? 'me' : 'bot'}`;
  item.textContent = text;
  $('chat').appendChild(item);
  $('chat').scrollTop = $('chat').scrollHeight;
}

function quickPrompt(text) {
  $('question').value = text;
  $('question').focus();
}

function newChat() {
  history = [];
  $('chat').innerHTML = '';
  addMsg('bot', 'بدأنا محادثة جديدة. ما الدرس الذي تريد فهمه؟');
}

let selectedImage = null;
$('imageFile').addEventListener('change', (event) => {
  const file = event.target.files[0];
  selectedImage = null;
  $('imagePreview').style.display = 'none';

  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    $('chatStatus').textContent = 'اختر صورة PNG أو JPG أو WEBP لا تتجاوز 5MB.';
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    selectedImage = reader.result;
    $('imagePreview').src = reader.result;
    $('imagePreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
});

$('chatForm').onsubmit = async (event) => {
  event.preventDefault();
  const questionText = $('question').value.trim();
  if (!questionText && !selectedImage) return;

  const content = `[المرحلة: ${$('grade').value} | المادة: ${$('subjectTutor').value}]\n${questionText || 'اقرأ الصورة المرفقة واشرح محتواها وساعدني في حل السؤال خطوة بخطوة.'}`;
  addMsg('user', questionText || 'أرفقت صورة وأريد شرحها.');
  if (selectedImage) {
    const image = document.createElement('div');
    image.className = 'msg me';
    image.textContent = '📎 صورة مرفقة';
    $('chat').appendChild(image);
  }

  history.push({ role: 'user', content, image: selectedImage });
  $('send').disabled = true;
  $('chatStatus').textContent = 'جارٍ إرسال السؤال إلى المدرس الذكي…';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-12) })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'تعذر الاتصال');

    addMsg('bot', data.answer);
    history.push({ role: 'assistant', content: data.answer });
    history = history.slice(-12);
    $('chatStatus').textContent = 'تم استلام الإجابة. يمكنك طلب مزيد من التوضيح.';
    $('question').value = '';
    selectedImage = null;
    $('imageFile').value = '';
    $('imagePreview').style.display = 'none';
  } catch (error) {
    addMsg('bot', 'تعذر الحصول على الإجابة: ' + (error.message || 'خطأ غير معروف'));
    history.pop();
    $('chatStatus').textContent = 'تعذر الإرسال: ' + (error.message || 'خطأ غير معروف');
  } finally {
    $('send').disabled = false;
  }
};

function renderLexicon() {
  const entries = [
    ['مشتقة', 'Derivative / Dérivée'],
    ['معادلة', 'Equation / Équation'],
    ['قانون نيوتن', 'Newton’s Law / Loi de Newton'],
    ['تفاعل', 'Reaction / Réaction'],
    ['تغير', 'Change / Changement']
  ];

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = '<h2>معجم سريع للغات</h2>';
  const list = document.createElement('ul');
  list.className = 'list';
  entries.forEach(([ar, en]) => {
    const item = document.createElement('li');
    item.innerHTML = `<span>${ar} = ${en}</span>`;
    list.appendChild(item);
  });
  card.appendChild(list);
  document.querySelector('#tutor .card').appendChild(card);
}

renderLexicon();
drawTasks();
drawNotes();
drawSlots();
drawSessions();
showClock();
loadLibrary();
newChat();
