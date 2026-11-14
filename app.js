// WinLayer onboarding prototype v1.0 (Able Marketing for WinLayer)
// First pass: one entry field, entity match and confirmation, free signup with no card.
// All records below are ILLUSTRATIVE SAMPLES. Nothing is looked up, saved or charged.

const SAMPLE_ENTITIES = [
  { uei: 'SAMPLEUEI001', name: 'Northbridge Technical Services LLC', city: 'Atlanta, GA', status: 'Active', registered: 'SAM registration active (sample)' },
  { uei: 'SAMPLEUEI002', name: 'Northbridge Logistics Inc', city: 'Savannah, GA', status: 'Active', registered: 'SAM registration active (sample)' },
  { uei: 'SAMPLEUEI003', name: 'Northbridge Creative Studio', city: 'Decatur, GA', status: 'Active', registered: 'No SAM registration found (sample)' },
];

const app = document.getElementById('app');
const S = { input: '', entity: null };
const STEPS = ['Find your company', 'Confirm', 'Create account'];
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function steps(i) {
  return `<div class="steps">${STEPS.map((s, n) => `<span class="step ${n < i ? 'done' : n === i ? 'on' : ''}">${n + 1}. ${s}</span>`).join('')}</div>`;
}

function home(msg) {
  app.innerHTML = `
    ${steps(0)}
    <section class="card hero">
      <h1>Find federal contracts your company can actually win</h1>
      <p>Start with your company name or UEI. We confirm who you are first. No credit card to start.</p>
      <form id="f" class="row">
        <input id="q" placeholder="Company name or UEI" value="${esc(S.input)}" aria-label="Company name or UEI" required>
        <button class="btn">Find My Opportunities</button>
      </form>
      <div class="demo">
        <span style="color:#9aa6bf;font-size:12px;align-self:center">Try a demo journey:</span>
        <button class="chip" data-q="SAMPLEUEI001">Valid UEI</button>
        <button class="chip" data-q="Northbridge">Ambiguous name</button>
      </div>
    </section>
    ${msg ? `<div class="state warn">${msg}</div>` : ''}`;
  document.getElementById('f').onsubmit = (e) => { e.preventDefault(); lookup(document.getElementById('q').value.trim()); };
  app.querySelectorAll('.chip').forEach((c) => (c.onclick = () => lookup(c.dataset.q)));
}

function lookup(q) {
  S.input = q;
  const up = q.toUpperCase();
  const byUei = SAMPLE_ENTITIES.find((e) => e.uei === up);
  if (byUei) return confirm(byUei);
  const hits = SAMPLE_ENTITIES.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));
  if (hits.length === 1) return confirm(hits[0]);
  if (hits.length > 1) return matches(hits);
  return home('No company found. Try the legal name or UEI.');
}

function matches(list) {
  app.innerHTML = `${steps(0)}
    <section class="card">
      <h2>We found ${list.length} possible matches</h2>
      <p class="sub">Choose your company.</p>
      ${list.map((e, i) => `<div class="match" data-i="${i}">
          <div><strong>${e.name}</strong><div class="meta">UEI ${e.uei} · ${e.city} · ${e.status}</div></div>
          <span class="tag sample">sample</span></div>`).join('')}
    </section>`;
  app.querySelectorAll('.match').forEach((el) => (el.onclick = () => confirm(list[el.dataset.i])));
}

function confirm(e) {
  app.innerHTML = `${steps(1)}
    <section class="card">
      <h2>Is this your company?</h2>
      <p class="sub">Confirm before we create your workspace.</p>
      <table class="facts">
        <tr><td>Legal name</td><td>${e.name}</td></tr>
        <tr><td>UEI</td><td>${e.uei}</td></tr>
        <tr><td>Location</td><td>${e.city}</td></tr>
        <tr><td>Registration</td><td>${e.registered}</td></tr>
      </table>
      <div class="row" style="margin-top:16px">
        <button class="btn" id="yes">Yes, this is my company</button>
        <button class="btn ghost" id="no">Not my company</button>
      </div>
    </section>`;
  document.getElementById('yes').onclick = () => { S.entity = e; signup(); };
  document.getElementById('no').onclick = () => home();
}

function signup() {
  app.innerHTML = `${steps(2)}
    <section class="card">
      <h2>Create your free workspace</h2>
      <p class="sub">Setting up for: <strong>${esc(S.entity.name)} · UEI ${S.entity.uei}</strong>. No credit card needed.</p>
      <form id="su">
        <label for="em">Work email</label><input id="em" type="email" required placeholder="you@company.com">
        <label for="pw">Password</label><input id="pw" type="password" required minlength="8" placeholder="At least 8 characters">
        <div class="row" style="margin-top:16px"><button class="btn">Create free workspace</button></div>
      </form>
    </section>`;
  document.getElementById('su').onsubmit = (ev) => { ev.preventDefault(); done(); };
}

function done() {
  app.innerHTML = `${steps(3)}
    <section class="card">
      <h2>Your workspace is created</h2>
      <p class="sub">Next in v1.1: the free first result (Company Brain Lite, opportunity previews and a readiness checklist) and the upgrade path.</p>
    </section>`;
}

home();
