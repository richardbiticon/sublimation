/* ====================================================================
   site.js — shared behaviour for both landing pages
   1. Sticky nav reveal (hidden at the top, slides in on scroll down)
   2. Typeform-style multi-step quote modal
   Triggered by any element with [data-quote]. The value ("customfuze"
   or "premium") preselects the line and shapes the email subject.
   ==================================================================== */
(function () {
  'use strict';

  /* ---------- 1. Sticky reveal nav ---------- */
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var revealAt = 340;
    var onScroll = function () {
      if (window.scrollY > revealAt) nav.classList.add('is-visible');
      else nav.classList.remove('is-visible');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 2. Quote modal ---------- */
  var ARROW = '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>';
  var BACK = '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/></svg>';

  var STEPS = [
    { key: 'name',  type: 'text',  eyebrow: 'Your quote',   q: "First, who are we quoting for?", help: "The name we'll put on the quote.", placeholder: 'Full name', required: true },
    { key: 'email', type: 'email', eyebrow: 'Contact',      q: "Where should we send it?", help: "We reply with a real quote in about 24 hours.", placeholder: 'you@email.com', required: true },
    { key: 'org',   type: 'text',  eyebrow: 'The program',  q: "What team or club is this for?", help: "Club, school, or program name.", placeholder: 'e.g. Northside Volleyball Club', required: true },
    { key: 'role',  type: 'choice', eyebrow: 'You are',     q: "What's your role?", options: ['Coach', 'Club director', 'Athletic director', 'Parent', 'Player', 'Something else'], required: true },
    { key: 'line',  type: 'choice', eyebrow: 'The line',    q: "Which line are you after?", options: ['CustomFuze (house line)', 'A premium brand', 'Not sure yet'], required: true },
    { key: 'qty',   type: 'choice', eyebrow: 'Roster size', q: "Roughly how many jerseys?", options: ['1 to 11', '12 to 24', '25 to 50', '50 or more'], required: true },
    { key: 'date',  type: 'date',   eyebrow: 'Timeline',    q: "When do you need them on the court?", help: "A rough date is fine. Leave it blank if you're still planning.", required: false },
    { key: 'notes', type: 'textarea', eyebrow: 'Anything else', q: "Anything we should know?", help: "Colors, sponsor logos, split rosters, a hard deadline. Optional.", placeholder: 'Optional', required: false }
  ];
  var LABELS = { name: 'Name', email: 'Email', org: 'Team / club', role: 'Role', line: 'Line', qty: 'Jerseys', date: 'Needed by', notes: 'Notes' };

  var answers = {};
  var stepIndex = 0;
  var context = 'customfuze';
  var modal, stepsWrap, progressEl, reviewStepEl, successStepEl;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c]; }); }
  var totalSlides = STEPS.length + 2; // + review + success

  function build() {
    modal = document.createElement('div');
    modal.className = 'quote-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Request a quote');

    var html = '';
    html += '<div class="quote-bg"></div>';
    html += '<div class="quote-progress" id="quote-progress"></div>';
    html += '<div class="quote-top">';
    html += '  <span class="quote-brand">All Volleyball <span>Quote</span></span>';
    html += '  <button type="button" class="quote-close" aria-label="Close">&times;</button>';
    html += '</div>';
    html += '<div class="quote-stage"><div class="quote-steps" id="quote-steps">';

    STEPS.forEach(function (s, i) {
      html += '<section class="quote-step" data-step="' + i + '">';
      html += '<div class="quote-eyebrow">' + ARROW + esc(s.eyebrow) + '</div>';
      html += '<h2 class="quote-question">' + esc(s.q) + '</h2>';
      if (s.help) html += '<p class="quote-help">' + esc(s.help) + '</p>';
      if (s.type === 'choice') {
        html += '<div class="quote-choices" role="listbox">';
        s.options.forEach(function (opt, oi) {
          var keyChar = String.fromCharCode(65 + oi);
          html += '<button type="button" class="quote-choice" data-value="' + esc(opt) + '">'
                + '<span class="quote-choice-key">' + keyChar + '</span><span>' + esc(opt) + '</span></button>';
        });
        html += '</div>';
      } else if (s.type === 'textarea') {
        html += '<textarea class="quote-field" rows="4" data-input placeholder="' + esc(s.placeholder || '') + '"></textarea>';
      } else {
        html += '<input class="quote-field" type="' + s.type + '" data-input placeholder="' + esc(s.placeholder || '') + '"' + (s.type === 'date' ? '' : '') + '>';
      }
      html += '<div class="quote-error" data-error></div>';
      html += '<div class="quote-actions">';
      html += '<button type="button" class="quote-next" data-next>' + (s.required ? 'OK' : 'OK') + ' ' + ARROW + '</button>';
      html += '<span class="quote-hint">press <strong>Enter</strong></span>';
      if (i > 0) html += '<button type="button" class="quote-back" data-back>' + BACK + ' Back</button>';
      html += '</div>';
      html += '</section>';
    });

    // Review step
    html += '<section class="quote-step" data-step="review">';
    html += '<div class="quote-eyebrow">' + ARROW + 'Almost done</div>';
    html += '<h2 class="quote-question">Look right?</h2>';
    html += '<p class="quote-help">Send it over and a Team Sales Specialist replies in about 24 hours.</p>';
    html += '<div class="quote-review" id="quote-review"></div>';
    html += '<div class="quote-actions">';
    html += '<button type="button" class="quote-next" id="quote-submit">Send my request ' + ARROW + '</button>';
    html += '<button type="button" class="quote-back" data-back>' + BACK + ' Back</button>';
    html += '</div>';
    html += '</section>';

    // Success step
    html += '<section class="quote-step" data-step="success">';
    html += '<div class="quote-success-icon"><svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg></div>';
    html += '<h2 class="quote-question">Request sent.</h2>';
    html += '<p class="quote-help" id="quote-success-copy">Your email app should be open with everything filled in, just hit send. If it did not open, email team@allvolleyball.com and we will take it from there.</p>';
    html += '<div class="quote-actions"><button type="button" class="quote-next" data-close-success>Done</button></div>';
    html += '</section>';

    html += '</div></div>';
    modal.innerHTML = html;
    document.body.appendChild(modal);

    stepsWrap = modal.querySelector('#quote-steps');
    progressEl = modal.querySelector('#quote-progress');
    reviewStepEl = modal.querySelector('[data-step="review"]');
    successStepEl = modal.querySelector('[data-step="success"]');

    modal.querySelector('.quote-close').addEventListener('click', close);
    modal.addEventListener('mousedown', function (e) { if (e.target === modal || e.target.classList.contains('quote-bg')) close(); });
    modal.querySelectorAll('[data-next]').forEach(function (b) { b.addEventListener('click', next); });
    modal.querySelectorAll('[data-back]').forEach(function (b) { b.addEventListener('click', back); });
    modal.querySelectorAll('[data-close-success]').forEach(function (b) { b.addEventListener('click', close); });
    modal.querySelector('#quote-submit').addEventListener('click', submit);

    STEPS.forEach(function (s, i) {
      var stepEl = stepsWrap.querySelector('[data-step="' + i + '"]');
      if (s.type === 'choice') {
        stepEl.querySelectorAll('.quote-choice').forEach(function (btn) {
          btn.addEventListener('click', function () {
            stepEl.querySelectorAll('.quote-choice').forEach(function (b) { b.classList.remove('is-selected'); });
            btn.classList.add('is-selected');
            answers[s.key] = btn.getAttribute('data-value');
            setTimeout(next, 180);
          });
        });
      }
    });

    document.addEventListener('keydown', onKey);
  }

  function currentStepEl() {
    if (stepIndex < STEPS.length) return stepsWrap.querySelector('[data-step="' + stepIndex + '"]');
    if (stepIndex === STEPS.length) return reviewStepEl;
    return successStepEl;
  }

  function showStep() {
    modal.querySelectorAll('.quote-step').forEach(function (el) { el.classList.remove('is-active'); });
    var el = currentStepEl();
    el.classList.add('is-active');
    var pct = Math.round((Math.min(stepIndex, STEPS.length) / STEPS.length) * 100);
    progressEl.style.width = pct + '%';
    var focusable = el.querySelector('[data-input]') || el.querySelector('.quote-choice') || el.querySelector('.quote-next');
    if (focusable) setTimeout(function () { focusable.focus(); }, 60);
    if (stepIndex === STEPS.length) renderReview();
  }

  function validate() {
    var s = STEPS[stepIndex];
    var el = currentStepEl();
    var errEl = el.querySelector('[data-error]');
    if (errEl) errEl.textContent = '';
    if (s.type === 'choice') {
      if (s.required && !answers[s.key]) { if (errEl) errEl.textContent = 'Pick one to continue.'; return false; }
      return true;
    }
    var input = el.querySelector('[data-input]');
    var val = input ? input.value.trim() : '';
    answers[s.key] = val;
    if (s.required && !val) { if (errEl) errEl.textContent = 'This one is required.'; return false; }
    if (s.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { if (errEl) errEl.textContent = 'That email looks off, mind checking it?'; return false; }
    return true;
  }

  function next() {
    if (stepIndex < STEPS.length) { if (!validate()) return; }
    if (stepIndex < STEPS.length) { stepIndex++; showStep(); }
  }
  function back() {
    if (stepIndex > 0) { stepIndex--; showStep(); }
  }

  function renderReview() {
    var wrap = modal.querySelector('#quote-review');
    var rows = '';
    STEPS.forEach(function (s) {
      var v = answers[s.key];
      if (!v) v = '—';
      rows += '<div class="quote-review-row"><span class="quote-review-label">' + esc(LABELS[s.key]) + '</span><span class="quote-review-value">' + esc(v) + '</span></div>';
    });
    wrap.innerHTML = rows.replace(/—/g, 'Not specified');
  }

  function submit() {
    var subjectLine = (answers.line && answers.line.indexOf('CustomFuze') === 0) || context === 'customfuze'
      ? 'CustomFuze sublimation quote' : 'Sublimation quote request';
    var subject = subjectLine + (answers.org ? ' — ' + answers.org : '');
    var body = '';
    STEPS.forEach(function (s) {
      body += LABELS[s.key] + ': ' + (answers[s.key] || 'Not specified') + '\n';
    });
    body += '\nSent from the All Volleyball site.';
    var href = 'mailto:team@allvolleyball.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    window.location.href = href;
    stepIndex = STEPS.length + 1;
    showStep();
  }

  function open(ctx) {
    if (!modal) build();
    context = ctx || 'customfuze';
    // preselect the line based on where the visitor clicked
    if (context === 'premium') answers.line = 'A premium brand';
    else if (context === 'customfuze') answers.line = 'CustomFuze (house line)';
    stepIndex = 0;
    // reflect any preselected line in the choice UI
    var lineIdx = STEPS.findIndex(function (s) { return s.key === 'line'; });
    if (lineIdx >= 0 && answers.line) {
      var lineEl = stepsWrap.querySelector('[data-step="' + lineIdx + '"]');
      lineEl.querySelectorAll('.quote-choice').forEach(function (b) {
        b.classList.toggle('is-selected', b.getAttribute('data-value') === answers.line);
      });
    }
    document.body.classList.add('quote-open');
    modal.classList.add('is-open');
    showStep();
  }

  function close() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.classList.remove('quote-open');
  }

  function onKey(e) {
    if (!modal || !modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Enter') {
      var s = STEPS[stepIndex];
      if (s && s.type === 'textarea' && e.shiftKey) return; // allow newline
      if (stepIndex < STEPS.length) { e.preventDefault(); next(); }
      else if (stepIndex === STEPS.length) { e.preventDefault(); submit(); }
      return;
    }
    // number/letter keys select choices
    if (stepIndex < STEPS.length && STEPS[stepIndex].type === 'choice') {
      var idx = -1;
      if (/^[1-9]$/.test(e.key)) idx = parseInt(e.key, 10) - 1;
      else if (/^[a-zA-Z]$/.test(e.key)) idx = e.key.toUpperCase().charCodeAt(0) - 65;
      var choices = currentStepEl().querySelectorAll('.quote-choice');
      if (idx >= 0 && idx < choices.length) { e.preventDefault(); choices[idx].click(); }
    }
  }

  // Wire every trigger
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-quote]');
    if (!trigger) return;
    e.preventDefault();
    open(trigger.getAttribute('data-quote') || 'customfuze');
  });
})();
