// WinLayer onboarding prototype v1.1 (Able Marketing for WinLayer)
// Signup-to-first-result flow per the v7 Free Workspace Activation and Upgrade Spec (Nov 5, 2026).
// All records below are ILLUSTRATIVE SAMPLES. Nothing is looked up, saved or charged.

const SAMPLE_ENTITIES = [
  { uei: 'SAMPLEUEI001', name: 'Northbridge Technical Services LLC', city: 'Atlanta, GA', status: 'Active', registered: 'SAM registration active (sample)', naics: ['541512 Computer Systems Design', '541519 Other Computer Related Services'], cage: 'SMPL1', stage: 'established' },
  { uei: 'SAMPLEUEI002', name: 'Northbridge Logistics Inc', city: 'Savannah, GA', status: 'Active', registered: 'SAM registration active (sample)', naics: ['488510 Freight Transportation Arrangement'], cage: 'SMPL2', stage: 'established' },
  { uei: 'SAMPLEUEI003', name: 'Northbridge Creative Studio', city: 'Decatur, GA', status: 'Active', registered: 'No SAM registration found (sample)', naics: [], cage: null, stage: 'new' },
];
const STATES = {
  SAMPLEINACTIV: { kind: 'bad', title: 'This entity is inactive', body: 'The record for this UEI shows an expired or inactive registration. You can still create a free workspace, but federal opportunities will need an active SAM registration.' },
  SAMPLENOTFND: { kind: 'warn', title: 'No public record found', body: 'We could not find an entity for that UEI. Check the 12 characters, search by legal company name instead, or continue with a profile you enter yourself.' },
  SAMPLERATELM: { kind: 'warn', title: 'Lookup is busy right now', body: 'The public records service is rate-limiting requests. Try again in about a minute. Your input is kept.' },
  SAMPLEDOWN01: { kind: 'bad', title: 'Records service unavailable', body: 'We cannot reach public entity records at the moment. You can continue with a profile you enter yourself and verify it later.' },
};
const SAMPLE_OPPS = [
  { title: 'IT help desk and end-user support services', agency: 'Sample federal civilian agency', date: 'Responses due Dec 15, 2026 (sample)', source: 'Indexed public notice (sample record)', why: 'Matches your NAICS 541512 and the "help desk" capability on your profile.' },
  { title: 'Cloud migration support, small business set-aside', agency: 'Sample defense support agency', date: 'Responses due Jan 8, 2027 (sample)', source: 'Indexed public notice (sample record)', why: 'Small business set-aside in NAICS 541519, which is on your registration.' },
  { title: 'Network operations center staffing', agency: 'Sample regional office', date: 'Sources sought, due Dec 2, 2026 (sample)', source: 'Indexed public notice (sample record)', why: 'Sources sought notice; your listed capabilities include network operations.' },
];

const app = document.getElementById('app');
const S = { input: '', entity: null, unverified: false, email: '', profile: { capabilities: 'Help desk, network operations, cloud migration', website: '' }, pendingAction: null, plan: 'free' };
const STEPS = ['Find your company', 'Confirm', 'Create account', 'First result'];

function steps(i) {
  return `<div class="steps">${STEPS.map((s, n) => `<span class="step ${n < i ? 'done' : n === i ? 'on' : ''}">${n + 1}. ${s}</span>`).join('')}</div>`;
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function home(state) {
  app.innerHTML = `
    ${steps(0)}
    <section class="card hero">
      <h1>Find federal contracts your company can actually win</h1>
      <p>Start with your company name, UEI or website. We confirm who you are first, then show a free preview built from public records. No credit card to start.</p>
      <form id="f" class="row">
        <input id="q" placeholder="Company name, UEI or website" value="${esc(S.input)}" aria-label="Company name, UEI or website" required>
        <button class="btn">Find My Opportunities</button>
      </form>
      <div class="demo">
        <span style="color:#9aa6bf;font-size:12px;align-self:center">Try a demo journey:</span>
        <button class="chip" data-q="SAMPLEUEI001">Valid UEI</button>
        <button class="chip" data-q="Northbridge">Ambiguous name</button>
        <button class="chip" data-q="northbridgetech.example">Website only</button>
        <button class="chip" data-q="SAMPLENOTFND">No public record</button>
        <button class="chip" data-q="SAMPLEINACTIV">Inactive</button>
        <button class="chip" data-q="SAMPLERATELM">Rate-limited</button>
        <button class="chip" data-q="SAMPLEDOWN01">Unavailable</button>
      </div>
    </section>
    ${state ? `<div class="state ${state.kind}"><strong>${state.title}</strong><br>${state.body}
      <div class="row" style="margin-top:10px"><button class="btn small ghost" id="manual">Continue with a profile I enter</button></div></div>` : ''}`;
  document.getElementById('f').onsubmit = (e) => { e.preventDefault(); lookup(document.getElementById('q').value.trim()); };
  app.querySelectorAll('.chip').forEach((c) => (c.onclick = () => lookup(c.dataset.q)));
  const m = document.getElementById('manual');
  if (m) m.onclick = () => { S.entity = null; S.unverified = true; signup(); };
}

function lookup(q) {
  S.input = q;
  if (!q) return home();
  const up = q.toUpperCase();
  if (STATES[up]) return home(STATES[up]);
  const byUei = SAMPLE_ENTITIES.find((e) => e.uei === up);
  if (byUei) return confirm(byUei);
  if (/^https?:\/\//i.test(q) || /\.[a-z]{2,}$/i.test(q)) return websiteOnly(q);
  const hits = SAMPLE_ENTITIES.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));
  if (hits.length === 1) return confirm(hits[0]);
  if (hits.length > 1) return matches(hits);
  return home(STATES.SAMPLENOTFND);
}

function websiteOnly(site) {
  app.innerHTML = `${steps(0)}
    <section class="card">
      <h2>A website isn't a verified company record</h2>
      <p class="sub">We found <strong>${esc(site)}</strong>, but a website alone doesn't tell us which legal entity you are. Pick how to continue:</p>
      <div class="row">
        <button class="btn" id="byname">Search by legal name or UEI</button>
        <button class="btn ghost" id="manual">Continue unverified</button>
      </div>
      <p class="hint">If you continue unverified, your profile is marked "user-provided" until you add a UEI.</p>
    </section>`;
  document.getElementById('byname').onclick = () => { S.input = ''; home(); };
  document.getElementById('manual').onclick = () => { S.entity = null; S.unverified = true; S.profile.website = site; signup(); };
}

function matches(list) {
  app.innerHTML = `${steps(0)}
    <section class="card">
      <h2>We found ${list.length} possible matches</h2>
      <p class="sub">Choose your company. We won't guess when names are similar.</p>
      ${list.map((e, i) => `<div class="match" data-i="${i}">
          <div><strong>${e.name}</strong><div class="meta">UEI ${e.uei} · ${e.city} · ${e.status}</div></div>
          <span class="tag sample">sample</span></div>`).join('')}
      <div class="row" style="margin-top:6px"><button class="btn ghost small" id="none">None of these</button></div>
    </section>`;
  app.querySelectorAll('.match').forEach((el) => (el.onclick = () => confirm(list[el.dataset.i])));
  document.getElementById('none').onclick = () => home(STATES.SAMPLENOTFND);
}

function confirm(e) {
  app.innerHTML = `${steps(1)}
    <section class="card">
      <h2>Is this your company?</h2>
      <p class="sub">Confirm before we create your workspace. We'll carry this record into signup.</p>
      <table class="facts">
        <tr><td>Legal name</td><td>${e.name} <span class="tag verified">verified</span></td></tr>
        <tr><td>UEI</td><td>${e.uei} <span class="tag verified">verified</span></td></tr>
        <tr><td>Location</td><td>${e.city}</td></tr>
        <tr><td>Registration</td><td>${e.registered}</td></tr>
      </table>
      <div class="row" style="margin-top:16px">
        <button class="btn" id="yes">Yes, this is my company</button>
        <button class="btn ghost" id="no">Not my company</button>
      </div>
    </section>`;
  document.getElementById('yes').onclick = () => { S.entity = e; S.unverified = false; signup(); };
  document.getElementById('no').onclick = () => home();
}

function signup() {
  const who = S.entity ? `${S.entity.name} · UEI ${S.entity.uei}` : 'Unverified company profile';
  app.innerHTML = `${steps(2)}
    <section class="card">
      <h2>Create your free workspace</h2>
      <p class="sub">Setting up for: <strong>${esc(who)}</strong>. No credit card needed for the free workspace.</p>
      <form id="su">
        <label for="em">Work email</label><input id="em" type="email" required placeholder="you@company.com">
        <label for="pw">Password</label><input id="pw" type="password" required minlength="8" placeholder="At least 8 characters">
        <div class="row" style="margin-top:16px"><button class="btn">Create free workspace</button></div>
        <p class="hint">Sign-in is handled by WinLayer's login provider. Your confirmed company stays attached to this workspace only.</p>
      </form>
    </section>`;
  document.getElementById('su').onsubmit = (ev) => { ev.preventDefault(); S.email = document.getElementById('em').value; result(); };
}

function factsTable() {
  const e = S.entity;
  const rows = e
    ? [
        ['Legal name', e.name, 'verified'],
        ['UEI', e.uei, 'verified'],
        ['CAGE', e.cage || 'Not on record', e.cage ? 'verified' : 'unknown'],
        ['Registration status', e.registered, 'verified'],
        ['NAICS', e.naics.length ? e.naics.join('<br>') : 'None on record', e.naics.length ? 'verified' : 'unknown'],
        ['Capabilities', esc(S.profile.capabilities), 'user'],
        ['Website', S.profile.website ? esc(S.profile.website) : 'Not added', S.profile.website ? 'user' : 'unknown'],
        ['Likely agencies', e.naics.length ? 'Civilian IT and defense support buyers' : 'Not enough data yet', e.naics.length ? 'inferred' : 'unknown'],
        ['Prior awards', 'Not checked on the free tier', 'unknown'],
      ]
    : [
        ['Legal name', 'Not verified', 'unknown'],
        ['UEI', 'Not added', 'unknown'],
        ['Website', S.profile.website ? esc(S.profile.website) : 'Not added', S.profile.website ? 'user' : 'unknown'],
        ['Capabilities', esc(S.profile.capabilities), 'user'],
        ['Registration status', 'Unknown until a UEI is added', 'unknown'],
      ];
  const label = { verified: 'verified', user: 'you provided', inferred: 'inferred', unknown: 'unknown' };
  return rows.map(([k, v, t]) => `<tr><td>${k}</td><td>${v} <span class="tag ${t}">${label[t]}</span></td></tr>`).join('');
}

function checklist() {
  const e = S.entity;
  const items = [
    ['Company identity confirmed', !!e],
    ['Active SAM registration', !!(e && e.registered.startsWith('SAM registration active'))],
    ['NAICS codes on record', !!(e && e.naics.length)],
    ['Capabilities described', !!S.profile.capabilities],
    ['Website added', !!S.profile.website],
  ];
  const next = !e
    ? ['Add your UEI', 'A UEI lets us verify your company and find opportunities you can bid on.']
    : !e.registered.startsWith('SAM registration active')
    ? ['Register in SAM.gov', 'Federal agencies can only award to registered entities. This is free and usually takes a few weeks.']
    : ['Review your first opportunity', 'Open the top preview and decide if it is worth a closer look.'];
  return `<ul class="check">${items.map(([t, ok]) => `<li><span class="ic">${ok ? '✅' : '⬜'}</span>${t}</li>`).join('')}</ul>
    <div class="next"><strong>Next step: ${next[0]}</strong><p>${next[1]}</p><button class="btn small" id="nextBtn">${next[0]}</button></div>`;
}

function opps() {
  const e = S.entity;
  if (!e || !e.naics.length) {
    return `<div class="state info"><strong>No defensible matches yet</strong><br>We don't have enough verified information to suggest opportunities honestly. Complete the next step and we'll check again.</div>`;
  }
  return SAMPLE_OPPS.slice(0, 3).map((o, i) => `
    <div class="opp">
      <strong>${o.title}</strong> <span class="tag sample">illustrative</span>
      <div class="meta">${o.agency} · ${o.date} · Source: ${o.source}</div>
      <div class="why"><strong>Why it might fit:</strong> ${o.why}</div>
      <div class="actions">
        <button class="btn small lock" data-act="Analyze eligibility" data-i="${i}">Analyze eligibility</button>
        <button class="btn small ghost lock" data-act="Build capture brief" data-i="${i}">Build capture brief</button>
      </div>
    </div>`).join('');
}

function result(returned) {
  app.innerHTML = `${steps(3)}
    ${returned ? `<div class="state info"><strong>Welcome back. ${esc(returned.action)} is unlocked.</strong><br>Your Company Brain Lite and the opportunity "${esc(returned.title)}" are exactly as you left them. The full analysis would run here.</div>` : ''}
    <section class="card">
      <h2>Your free preview is ready</h2>
      <p class="sub">Company Brain Lite is built from public records and what you tell us. Paid plans add deeper research; nothing here is a fit score or a win prediction.</p>
      <div class="grid2">
        <div>
          <h3>Company Brain Lite</h3>
          <table class="facts">${factsTable()}</table>
          <div class="row" style="margin-top:12px"><button class="btn small ghost" id="edit">Correct or add details</button></div>
          <form id="ef" class="hidden">
            <label for="cap">Capabilities</label><textarea id="cap" rows="2">${esc(S.profile.capabilities)}</textarea>
            <label for="web">Website</label><input id="web" value="${esc(S.profile.website)}" placeholder="https://">
            <div class="row" style="margin-top:10px"><button class="btn small">Save profile</button></div>
          </form>
        </div>
        <div>
          <h3>Federal readiness</h3>
          ${checklist()}
        </div>
      </div>
    </section>
    <section class="card">
      <h3>Opportunity previews (up to 3)</h3>
      <p class="hint" style="margin-top:0">Previews come from already-indexed notices. Deeper analysis needs a paid plan.</p>
      ${opps()}
    </section>`;
  document.getElementById('edit').onclick = () => document.getElementById('ef').classList.toggle('hidden');
  document.getElementById('ef').onsubmit = (ev) => {
    ev.preventDefault();
    S.profile.capabilities = document.getElementById('cap').value.trim();
    S.profile.website = document.getElementById('web').value.trim();
    result();
  };
  document.getElementById('nextBtn').onclick = () => { if (!S.entity) { S.input = ''; home(); } else alert('Prototype: this would open the next step.'); };
  app.querySelectorAll('[data-act]').forEach((b) => (b.onclick = () => upgrade(b.dataset.act, SAMPLE_OPPS[b.dataset.i].title)));
}

function upgrade(action, title) {
  S.pendingAction = { action, title };
  const unlocks = {
    'Analyze eligibility': 'A requirement-by-requirement eligibility check of this notice against your verified profile, with sources.',
    'Build capture brief': 'A capture brief for this notice: requirements, evaluation factors and a response outline.',
  }[action];
  const trialEnd = new Date(Date.now() + 14 * 864e5).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal">
      <h2>${action} is a paid feature</h2>
      <p class="sub"><strong>What you unlock:</strong> ${unlocks}</p>
      <div class="terms">
        <strong>Solo plan trial</strong><br>
        14-day trial. Plan price: <em>[set by WinLayer]</em>/month after the trial.<br>
        First charge: <strong>${trialEnd}</strong> unless you cancel before then.<br>
        A card is needed only now, to start the trial. Your free workspace stays free.
      </div>
      <label for="cc">Card (prototype, not charged)</label><input id="cc" placeholder="Card details are collected by the payment provider">
      <div class="row" style="margin-top:14px">
        <button class="btn" id="ok">Start trial</button>
        <button class="btn ghost" id="cancel">Not now</button>
      </div>
      <p class="hint">Demo outcomes: <a href="#" id="fail">payment fails</a> · <a href="#" id="delay">payment confirmation delayed</a></p>
      <div id="msg"></div>
    </div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  bg.querySelector('#cancel').onclick = () => { close(); S.pendingAction = null; };
  bg.querySelector('#ok').onclick = () => { close(); S.plan = 'trial'; result(S.pendingAction); };
  bg.querySelector('#fail').onclick = (e) => { e.preventDefault(); bg.querySelector('#msg').innerHTML = '<div class="state bad">Your card was declined. Nothing was charged and your free workspace is unchanged. Try another card or close this window.</div>'; };
  bg.querySelector('#delay').onclick = (e) => { e.preventDefault(); bg.querySelector('#msg').innerHTML = '<div class="state warn">Payment received; we are waiting for confirmation. This usually takes under a minute. We will bring you back to ' + action + ' when it is ready.</div>'; };
}

home();
