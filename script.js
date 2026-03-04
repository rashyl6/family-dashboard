/* ═══════════════════════════════════════════════════════════════
   OUR WEEK — Family Dashboard Script
   Renders all JSON data files into the UI
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─── Helpers ───────────────────────────────────────────────── */

function $(id) { return document.getElementById(id); }

function fetchJSON(path) {
  return fetch(path + '?v=' + Date.now())
    .then(r => { if (!r.ok) throw new Error(path + ' not found'); return r.json(); })
    .catch(e => { console.warn(e.message); return null; });
}

/** Parse YYYY-MM-DD as local date (no timezone shift) */
function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Days between today and a date string */
function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseDate(dateStr);
  if (!target) return null;
  return Math.round((target - today) / 86400000);
}

function formatShortDate(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function dayLabel(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '';
  return d.toLocaleDateString('sv-SE', { weekday: 'short' });
}

function monthLabel(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '';
  return d.toLocaleDateString('sv-SE', { month: 'short' }).toUpperCase();
}

function dayOfMonth(dateStr) {
  const d = parseDate(dateStr);
  return d ? d.getDate() : '';
}

function isToday(dateStr) {
  const today = new Date();
  const d = parseDate(dateStr);
  return d && d.toDateString() === today.toDateString();
}

function urgencyClass(days) {
  if (days === null) return 'ok';
  if (days < 0)   return 'urgent';
  if (days < 14)  return 'urgent';
  if (days < 60)  return 'warning';
  return 'ok';
}

function dueLabelForHw(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return '';
  if (days < 0)  return 'Försenad!';
  if (days === 0) return 'Idag!';
  if (days === 1) return 'Imorgon';
  return 'Inlämning ' + formatShortDate(dateStr);
}

function isUrgentHw(dateStr) {
  const d = daysUntil(dateStr);
  return d !== null && d <= 1;
}

/* ─── Section 1 — Header ────────────────────────────────────── */
function renderHeader(config) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('sv-SE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  $('header-date').textContent = dateStr;
  $('footer-date').textContent = dateStr;
  if (config && config.familyName) {
    document.title = config.familyName;
    $('family-name').textContent = config.familyName;
  }
}

/* ─── Section 2 — Narrative ─────────────────────────────────── */
function renderNarrative(data) {
  if (!data) return;
  const el = $('narrative-text');
  const text = data.text || '';
  // Split on sentence boundaries and render each as a paragraph
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  if (sentences.length > 1) {
    el.innerHTML = sentences.map(s => `<p>${s}</p>`).join('');
  } else {
    el.textContent = text;
  }
  if (data.updatedAt) {
    $('narrative-meta').textContent = 'Vecka fr.o.m. ' + formatShortDate(data.week) + ' · Uppdaterad ' + formatShortDate(data.updatedAt);
  }
}

/* ─── Section 3 — Week Ahead ────────────────────────────────── */
function renderWeek(data) {
  const strip = $('week-strip');
  if (!strip) return;

  // Build Mon–Sun of current week
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay(); // 0=Sun, 1=Mon...6=Sat
  const daysToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    days.push({ iso, d });
  }

  // Index events by date
  const eventsByDate = {};
  if (data && data.events) {
    data.events.forEach(ev => {
      if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
      eventsByDate[ev.date].push(ev);
    });
  }

  strip.innerHTML = '';
  days.forEach(({ iso, d }) => {
    const dayEl = document.createElement('div');
    dayEl.className = 'week-day' + (isToday(iso) ? ' today' : '');

    const dayName = d.toLocaleDateString('sv-SE', { weekday: 'short' });
    const dayNum  = d.getDate();

    let html = `
      <div class="week-day-label">${dayName}</div>
      <div class="week-day-date">${dayNum}</div>
    `;

    const evs = eventsByDate[iso] || [];
    evs.forEach(ev => {
      const color = ev.color || '#4A5568';
      html += `<div class="week-event" style="border-color:${color}">
        ${ev.time ? `<span class="week-event-time">${ev.time}</span>` : ''}
        ${ev.title}
      </div>`;
    });

    dayEl.innerHTML = html;
    strip.appendChild(dayEl);
  });
}

/* ─── Section 4 — Kids' Corner ──────────────────────────────── */
function renderKids(config, homework, exams) {
  const kids = config && config.kids ? config.kids : [
    { name: 'Klara', color: '#7B5EA7' },
    { name: 'Ebbe',  color: '#2E86AB' },
    { name: 'Lo',    color: '#F4845F' }
  ];

  // Tab switching
  const tabs = document.querySelectorAll('.tab-btn');
  const panel = $('kids-panel');

  function renderKidPanel(kidName) {
    const kid = kids.find(k => k.name === kidName) || kids[0];
    const color = kid.color;

    // Homework
    const hwItems = (homework && homework.tasks || []).filter(t => t.kid === kidName);
    let hwHtml = '';
    if (hwItems.length === 0) {
      hwHtml = '<p class="no-items">Inga läxor inlagda.</p>';
    } else {
      hwItems.forEach(t => {
        const isDone = t.done;
        hwHtml += `
          <div class="homework-item">
            <div class="hw-check ${isDone ? 'done' : ''}" style="${isDone ? '' : 'border-color:' + color}">
              ${isDone ? '✓' : ''}
            </div>
            <div class="hw-body">
              <div class="hw-subject">${t.subject}</div>
              <div class="hw-task ${isDone ? 'done-text' : ''}">${t.task}</div>
              <div class="hw-due ${isUrgentHw(t.due) && !isDone ? 'urgent' : ''}">${dueLabelForHw(t.due)}</div>
            </div>
          </div>`;
      });
    }

    // Exams
    const examItems = (exams && exams.exams || []).filter(e => e.kid === kidName);
    let examHtml = '';
    if (examItems.length === 0) {
      examHtml = '<p class="no-items">Inga prov inlagda.</p>';
    } else {
      examItems.forEach(e => {
        const days = daysUntil(e.date);
        const daysLabel = days === null ? '' : days === 0 ? 'Idag!' : days === 1 ? 'Imorgon' : days + '';
        const daysUnit  = days > 1 ? 'dagar' : '';
        examHtml += `
          <div class="exam-item">
            <div class="exam-countdown" style="color:${color}">
              ${daysLabel}
              <span class="exam-countdown-unit">${daysUnit}</span>
            </div>
            <div class="exam-body">
              <div class="exam-subject">${e.subject}</div>
              <div class="exam-topic">${e.topic || ''}</div>
              ${e.notes ? `<div class="exam-topic" style="margin-top:2px;font-style:italic">${e.notes}</div>` : ''}
            </div>
            <div class="exam-date">${formatShortDate(e.date)}</div>
          </div>`;
      });
    }

    panel.innerHTML = `
      <div class="kid-panel active" data-kid="${kidName}">
        <div class="kid-subsection">
          <div class="kid-subsection-title">Läxor</div>
          ${hwHtml}
        </div>
        <div class="kid-subsection">
          <div class="kid-subsection-title">Kommande prov</div>
          ${examHtml}
        </div>
      </div>`;
  }

  // Initial render
  renderKidPanel(kids[0].name);

  tabs.forEach(btn => {
    btn.style.setProperty('--kid-color', kids.find(k => k.name === btn.dataset.kid)?.color || '#888');
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      renderKidPanel(btn.dataset.kid);
    });
  });
}

/* ─── Section 5 — Family Life ───────────────────────────────── */
function renderFamily(data) {
  const container = $('family-plans');
  if (!container) return;
  const plans = data && data.plans ? data.plans : [];
  if (plans.length === 0) {
    container.innerHTML = '<p class="no-items">Inga planer inlagda.</p>';
    return;
  }
  // Sort by date
  plans.sort((a, b) => a.date.localeCompare(b.date));
  container.innerHTML = plans.map(p => `
    <div class="plan-item">
      <div class="plan-date-badge">
        <div class="plan-date-day">${dayOfMonth(p.date)}</div>
        <div class="plan-date-month">${monthLabel(p.date)}</div>
      </div>
      <div class="plan-body">
        <div class="plan-title">
          <span class="plan-type-badge ${p.type || ''}">${p.type || 'plan'}</span>
          ${p.title}
        </div>
        ${p.notes ? `<div class="plan-meta">${p.notes}</div>` : ''}
      </div>
    </div>
  `).join('');
}

/* ─── Section 6 — Admin ─────────────────────────────────────── */
function renderAdmin(data) {
  const container = $('admin-list');
  if (!container) return;
  const items = data && data.items ? data.items : [];
  if (items.length === 0) {
    container.innerHTML = '<p class="no-items">Inget att hålla koll på.</p>';
    return;
  }
  // Sort by due date
  items.sort((a, b) => a.due.localeCompare(b.due));
  container.innerHTML = items.map(item => {
    const days = daysUntil(item.due);
    let countdownDisplay = '';
    let cls = 'ok';
    if (days !== null) {
      if (days < 0) {
        countdownDisplay = 'Försenad';
        cls = 'urgent';
      } else if (days === 0) {
        countdownDisplay = 'Idag';
        cls = 'urgent';
      } else if (days < 30) {
        countdownDisplay = days + 'd';
        cls = urgencyClass(days);
      } else if (days < 365) {
        countdownDisplay = Math.round(days / 30) + 'mo';
        cls = urgencyClass(days);
      } else {
        const months = Math.round(days / 30);
        countdownDisplay = Math.floor(months / 12) + 'y ' + (months % 12) + 'mo';
        cls = 'ok';
      }
    }
    return `
      <div class="admin-item">
        <div class="admin-icon">${item.icon || '📌'}</div>
        <div class="admin-body">
          <div class="admin-title">${item.title}</div>
          ${item.note ? `<div class="admin-note">${item.note}</div>` : ''}
        </div>
        <div class="admin-countdown">
          <div class="admin-countdown-num ${cls}">${countdownDisplay}</div>
          <div class="admin-countdown-label">${formatShortDate(item.due)}</div>
        </div>
      </div>`;
  }).join('');
}

/* ─── Section 7 — Goals ─────────────────────────────────────── */
function renderGoals(data) {
  const container = $('goals-list');
  if (!container) return;
  const goals = data && data.goals ? data.goals : [];
  if (goals.length === 0) {
    container.innerHTML = '<p class="no-items">Inga mål inlagda.</p>';
    return;
  }
  container.innerHTML = goals.map(g => {
    const pct = Math.min(100, Math.round((g.current / g.target) * 100));
    const color = g.color || '#4A5568';
    const progressLabel = `${g.current.toLocaleString()} / ${g.target.toLocaleString()} ${g.unit}`;
    return `
      <div class="goal-item">
        <div class="goal-header">
          <div class="goal-title-row">
            <span class="goal-icon">${g.icon || '🎯'}</span>
            <span class="goal-title">${g.title}</span>
          </div>
          <span class="goal-progress-label">${pct}%</span>
        </div>
        <div class="goal-bar-bg">
          <div class="goal-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="goal-note">${progressLabel}${g.notes ? ' · ' + g.notes : ''}</div>
      </div>`;
  }).join('');
}

/* ─── Section 8 — Routines ──────────────────────────────────── */
function renderRoutines(data) {
  const container = $('routines-grid');
  if (!container) return;
  const routines = data && data.routines ? data.routines : [];
  if (routines.length === 0) {
    container.innerHTML = '<p class="no-items">Inga rutiner inlagda.</p>';
    return;
  }
  container.innerHTML = routines.map(r => `
    <div class="routine-card" style="border-color:${r.color || '#4A5568'}">
      <div class="routine-icon">${r.icon || '📌'}</div>
      <div class="routine-title">${r.title}</div>
      <div class="routine-time">${r.time} · ${r.days}</div>
      <div class="routine-desc">${r.description}</div>
    </div>
  `).join('');
}

/* ─── Section 9 — Saved by Us ───────────────────────────────── */
function renderSaved(data) {
  const display   = $('saved-display');
  const counter   = $('saved-counter');
  const prevBtn   = $('saved-prev');
  const nextBtn   = $('saved-next');
  if (!display) return;

  const items = data && data.items ? data.items : [];
  if (items.length === 0) {
    display.innerHTML = '<div class="saved-item"><p class="saved-content">Inget sparat än.</p></div>';
    return;
  }

  let idx = 0;

  function show(i) {
    idx = (i + items.length) % items.length;
    const item = items[idx];
    const typeLabel = item.type === 'quote' ? 'Citat' : item.type === 'memory' ? 'Minne' : 'Anteckning';
    display.innerHTML = `
      <div class="saved-item">
        <div class="saved-type-label">${typeLabel}</div>
        <div class="saved-content">"${item.content}"</div>
        ${item.attribution ? `<div class="saved-attribution">— ${item.attribution}</div>` : ''}
      </div>`;
    counter.textContent = `${idx + 1} / ${items.length}`;
  }

  prevBtn.addEventListener('click', () => show(idx - 1));
  nextBtn.addEventListener('click', () => show(idx + 1));

  show(0);

  // Auto-rotate every 8 seconds
  setInterval(() => show(idx + 1), 8000);
}

/* ─── Section 10 — Slideshow ────────────────────────────────── */
function renderSlideshow() {
  // Photos are loaded from the photos/ directory.
  // Since we can't list files in a static site, we try to load a manifest
  // or fall back to the placeholder. The user populates photos/ manually.
  fetchJSON('photos/manifest.json').then(manifest => {
    const photos = manifest && manifest.photos ? manifest.photos : [];
    if (photos.length === 0) {
      $('slideshow-placeholder').style.display = '';
      return;
    }

    $('slideshow-placeholder').style.display = 'none';
    $('slideshow-controls').style.display = '';
    $('fullscreen-btn').style.display = '';

    const slidesEl = $('slideshow-slides');
    const dotsEl   = $('slide-dots');
    let current = 0;
    let timer;

    photos.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'slide' + (i === 0 ? ' active' : '');
      const img = document.createElement('img');
      img.src = 'photos/' + src;
      img.alt = 'Familjefoto ' + (i + 1);
      slide.appendChild(img);
      slidesEl.appendChild(slide);

      const dot = document.createElement('div');
      dot.className = 'slide-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    });

    function goTo(n) {
      const slides = slidesEl.querySelectorAll('.slide');
      const dots   = dotsEl.querySelectorAll('.slide-dot');
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (n + photos.length) % photos.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }

    function autoPlay() { timer = setInterval(() => goTo(current + 1), 5000); }
    function stopPlay() { clearInterval(timer); }

    $('slide-prev').addEventListener('click', () => { stopPlay(); goTo(current - 1); autoPlay(); });
    $('slide-next').addEventListener('click', () => { stopPlay(); goTo(current + 1); autoPlay(); });

    // Pause on hover
    slidesEl.addEventListener('mouseenter', stopPlay);
    slidesEl.addEventListener('mouseleave', autoPlay);

    // Fullscreen
    $('fullscreen-btn').addEventListener('click', () => {
      const container = $('slideshow');
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen && container.requestFullscreen();
      }
    });

    autoPlay();
  });
}

/* ─── Weather ───────────────────────────────────────────────── */
const WSYMB = {
  1:'☀️', 2:'🌤️', 3:'🌤️', 4:'⛅', 5:'☁️', 6:'🌫️',
  7:'🌦️', 8:'🌦️', 9:'🌧️', 10:'⛈️',
  11:'🌨️', 12:'🌨️', 13:'🌨️',
  14:'❄️', 15:'❄️', 16:'❄️', 17:'⛈️',
  18:'🌧️', 19:'🌧️', 20:'🌧️', 21:'⛈️',
  22:'🌨️', 23:'🌨️', 24:'🌨️',
  25:'❄️', 26:'❄️', 27:'❄️'
};

function getParam(params, name) {
  const p = params.find(x => x.name === name);
  return p ? p.values[0] : null;
}

async function renderWeather() {
  const todayEl = $('weather-today');
  const forecastEl = $('weather-forecast');
  if (!todayEl) return;
  try {
    const res = await fetch('https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/13.0038/lat/55.6050/data.json');
    const data = await res.json();
    const series = data.timeSeries;

    // Group by date, pick entry closest to noon (local time)
    const byDate = {};
    series.forEach(entry => {
      const d = new Date(entry.validTime);
      const dateKey = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' }).split('T')[0];
      const localHour = d.toLocaleTimeString('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', hour12: false });
      const hour = parseInt(localHour);
      if (!byDate[dateKey] || Math.abs(hour - 12) < Math.abs(byDate[dateKey].hour - 12)) {
        byDate[dateKey] = { entry, hour };
      }
    });

    const dates = Object.keys(byDate).sort().slice(0, 6);
    if (dates.length === 0) { todayEl.textContent = 'Väderdata ej tillgänglig.'; return; }

    // Today
    const todayKey = new Date().toLocaleDateString('sv-SE');
    const todayData = byDate[todayKey] || byDate[dates[0]];
    const t = getParam(todayData.entry.parameters, 't');
    const sym = getParam(todayData.entry.parameters, 'Wsymb2');
    const ws = getParam(todayData.entry.parameters, 'ws');
    const icon = WSYMB[sym] || '🌡️';
    todayEl.innerHTML = `<span class="weather-icon">${icon}</span><span class="weather-temp">${Math.round(t)}°C</span><span class="weather-wind">${Math.round(ws)} m/s</span>`;

    // 5-day forecast (skip today)
    const forecastDates = dates.filter(d => d !== todayKey).slice(0, 5);
    forecastEl.innerHTML = forecastDates.map(dateKey => {
      const { entry } = byDate[dateKey];
      const ft = getParam(entry.parameters, 't');
      const fsym = getParam(entry.parameters, 'Wsymb2');
      const ficon = WSYMB[fsym] || '🌡️';
      const dayName = new Date(dateKey).toLocaleDateString('sv-SE', { weekday: 'short' });
      return `<div class="forecast-day"><div class="forecast-name">${dayName}</div><div class="forecast-icon">${ficon}</div><div class="forecast-temp">${Math.round(ft)}°</div></div>`;
    }).join('');
  } catch(e) {
    todayEl.textContent = 'Kunde inte ladda väder.';
  }
}

/* ─── Birthdays ─────────────────────────────────────────────── */
function renderBirthdays(data) {
  const container = $('birthdays-list');
  if (!container) return;
  const birthdays = data && data.birthdays ? data.birthdays : [];
  if (birthdays.length === 0) {
    container.innerHTML = '<p class="no-items">Inga födelsedagar inlagda.</p>';
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisYear = today.getFullYear();

  const upcoming = birthdays.map(b => {
    const [month, day] = b.date.split('-').map(Number);
    let next = new Date(thisYear, month - 1, day);
    if (next < today) next = new Date(thisYear + 1, month - 1, day);
    const days = Math.round((next - today) / 86400000);
    const age = b.year ? (next.getFullYear() - b.year) : null;
    return { ...b, days, next, age };
  }).sort((a, b) => a.days - b.days).slice(0, 6);

  container.innerHTML = upcoming.map(b => {
    const daysLabel = b.days === 0 ? '🎉 Idag!' : b.days === 1 ? 'Imorgon' : `${b.days} dagar`;
    const ageLabel = b.age ? ` · fyller ${b.age}` : '';
    const color = b.color || '#4A5568';
    return `<div class="birthday-item">
      <div class="birthday-dot" style="background:${color}"></div>
      <div class="birthday-body">
        <div class="birthday-name">${b.name}${ageLabel}</div>
        <div class="birthday-date">${b.next.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}</div>
      </div>
      <div class="birthday-days ${b.days === 0 ? 'urgent' : b.days <= 7 ? 'warning' : ''}">${daysLabel}</div>
    </div>`;
  }).join('');
}

/* ─── Main Init ─────────────────────────────────────────────── */
async function init() {
  const [config, narrative, calendar, homework, exams, family, admin, routines, saved, birthdays] = await Promise.all([
    fetchJSON('data/config.json'),
    fetchJSON('data/narrative.json'),
    fetchJSON('data/calendar.json'),
    fetchJSON('data/homework.json'),
    fetchJSON('data/exams.json'),
    fetchJSON('data/family.json'),
    fetchJSON('data/admin.json'),
    fetchJSON('data/routines.json'),
    fetchJSON('data/saved.json'),
    fetchJSON('data/birthdays.json'),
  ]);

  renderHeader(config);
  renderNarrative(narrative);
  renderWeather();
  renderWeek(calendar);
  renderKids(config, homework, exams);
  renderBirthdays(birthdays);
  renderFamily(family);
  renderAdmin(admin);
  renderRoutines(routines);
  renderSaved(saved);
  renderSlideshow();
}

document.addEventListener('DOMContentLoaded', init);
