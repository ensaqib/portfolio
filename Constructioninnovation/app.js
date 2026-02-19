// ================================================================
// CONSTRUCTION INNOVATION PLATFORM — APP ENGINE v2026.2 (FINAL)
// All modules, PDF generation, project management, MEP subcategories
// ================================================================
'use strict';

const STATE = {
  currentPage: 'dashboard',
  currentUser: { id:'U001', name:'Engr. Saqib Hussain (PE)', role:'admin', avatar:'SH' },
  darkMode: true,
  drawingMEPFilter: 'all',
  ncrTab: 'ncr',
  charts: {},
};

document.addEventListener('DOMContentLoaded', () => { initApp(); });

// ── INIT ──────────────────────────────────────────────────────
function initApp() {
  const D = window.APP_DATA;
  const proj = D.ACTIVE_PROJECT;

  // Set project info
  updateProjectDisplay(proj);

  // Set user
  document.getElementById('sidebar-user-name').textContent = STATE.currentUser.name;
  document.getElementById('sidebar-user-role').textContent = 'ADMIN';
  document.getElementById('sidebar-user-avatar').textContent = 'SH';

  // Populate project switcher
  const switcher = document.getElementById('project-switcher');
  if (switcher) {
    switcher.innerHTML = D.PROJECTS.map(p => `<option value="${p.id}" ${p.id===proj.id?'selected':''}>${p.code} — ${p.name.substring(0,28)}…</option>`).join('');
    switcher.addEventListener('change', () => {
      const p = D.PROJECTS.find(x => x.id === switcher.value);
      if (p) { D.ACTIVE_PROJECT = p; updateProjectDisplay(p); renderPage(STATE.currentPage); showToast('Project Switched', p.name, 'info'); }
    });
  }

  setupNavigation();
  setupHeaderActions();
  setupNotifications(D.NOTIFICATIONS);
  navigateTo('dashboard');
}

function updateProjectDisplay(proj) {
  const el = document.getElementById('project-name-display');
  if (el) el.textContent = proj.name;
  const ref = document.getElementById('project-ref');
  if (ref) ref.textContent = proj.code;
  const fill = document.getElementById('sidebar-progress-fill');
  if (fill) fill.style.width = proj.currentProgress + '%';
  const pct = document.getElementById('sidebar-progress-pct');
  if (pct) pct.textContent = proj.currentProgress + '%';
}

// ── NAVIGATION ────────────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.page); });
  });
}

function navigateTo(page) {
  STATE.currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  document.querySelectorAll('.page-section').forEach(sec => sec.classList.toggle('active', sec.id === 'page-' + page));
  const titles = { dashboard:'Dashboard Overview', projects:'Project Management', drawings:'Drawing Register', materials:'Material Submittal Register', methods:'Method Statement Register', testing:'Test & Commissioning Register', ncr:'NCR / RFI / Site Instructions', procurement:'Procurement Tracker', progress:'Progress Tracker', hse:'HSE Register', subcontractors:'Subcontractor Management', cost:'Cost Control', manpower:'Manpower & Equipment', closeout:'Project Closeout' };
  const el = document.getElementById('header-page-title');
  if (el) el.textContent = titles[page] || 'Dashboard';
  renderPage(page);
  document.querySelector('.sidebar')?.classList.remove('open');
}

function renderPage(page) {
  const map = { dashboard:renderDashboard, projects:renderProjects, drawings:renderDrawings, materials:renderMaterials, methods:renderMethods, testing:renderTesting, ncr:renderNCRPage, procurement:renderProcurement, progress:renderProgress, hse:renderHSE, subcontractors:renderSubcontractors, cost:renderCost, manpower:renderManpower, closeout:renderCloseout };
  if (map[page]) setTimeout(() => map[page](), 50);
}

// ── HEADER ────────────────────────────────────────────────────
function setupHeaderActions() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    STATE.darkMode = !STATE.darkMode;
    document.body.classList.toggle('light-mode', !STATE.darkMode);
    document.getElementById('theme-toggle').innerHTML = STATE.darkMode ? '☀️' : '🌙';
    showToast('Theme', STATE.darkMode ? 'Dark mode' : 'Light mode', 'info');
  });
  document.getElementById('notif-btn').addEventListener('click', e => { e.stopPropagation(); document.getElementById('notif-panel').classList.toggle('open'); });
  document.addEventListener('click', e => { if (!e.target.closest('#notif-panel') && !e.target.closest('#notif-btn')) document.getElementById('notif-panel').classList.remove('open'); });
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
  // Top search bar removed; no listener needed
}

function setupNotifications(notifs) {
  const panel = document.getElementById('notif-list');
  const unread = notifs.filter(n=>!n.read).length;
  document.getElementById('notif-badge-count').textContent = unread;
  document.getElementById('notif-dot').style.display = unread > 0 ? 'block' : 'none';
  panel.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read?'':'unread'}" onclick="markNotifRead(${n.id})">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="width:8px;height:8px;border-radius:50%;margin-top:5px;flex-shrink:0;background:${{warning:'#f59e0b',danger:'#f43f5e',info:'#3b82f6',success:'#10b981'}[n.type]}"></div>
        <div><div style="font-size:12.5px;color:var(--text-primary);margin-bottom:2px">${n.text}</div><div style="font-size:10px;color:var(--text-muted);font-family:'DM Mono',monospace">${n.time}</div></div>
        ${!n.read?'<div style="width:6px;height:6px;border-radius:50%;background:var(--accent-blue);margin-left:auto;margin-top:5px;flex-shrink:0"></div>':''}
      </div>
    </div>`).join('');
}

function markNotifRead(id) { const n=window.APP_DATA.NOTIFICATIONS.find(x=>x.id===id); if(n){n.read=true;setupNotifications(window.APP_DATA.NOTIFICATIONS);} }

// ── PDF ENGINE (with chart embedding) ──────────────────────────
function generatePDF(options) {
  const { title, subtitle='', kpis=[], tableHeaders=[], tableRows=[], extraHTML='', module='', charts=[] } = options;
  const today = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const proj = window.APP_DATA.ACTIVE_PROJECT;
  const logo = window.LOGO_B64 || '';
  const sig  = window.SIG_B64  || '';

  const kpiHTML = kpis.length ? `<div style="display:grid;grid-template-columns:repeat(${Math.min(kpis.length,4)},1fr);gap:8px;margin-bottom:14px">${kpis.map(k=>`<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px;text-align:center;border-top:3px solid ${k.color||'#1e3a5f'}"><div style="font-size:7.5pt;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:4px">${k.label}</div><div style="font-family:'Barlow Condensed',Arial;font-size:22pt;font-weight:800;color:${k.color||'#1e3a5f'}">${k.value}</div></div>`).join('')}</div>` : '';

  const chartsHTML = charts.length ? `<div style="display:grid;grid-template-columns:repeat(${charts.length},1fr);gap:8px;margin-bottom:14px">${charts.map(c=>`<img src="${c.data}" style="width:100%;border:1px solid #ddd;">`).join('')}</div>` : '';

  const tableHTML = tableHeaders.length ? `<table style="width:100%;border-collapse:collapse;font-size:8.5pt;margin-bottom:16px"><thead><tr>${tableHeaders.map(h=>`<th style="background:#1e3a5f;color:#fff;padding:7px 9px;text-align:left;font-weight:700;font-size:8pt;text-transform:uppercase;letter-spacing:0.5px">${h}</th>`).join('')}</tr></thead><tbody>${tableRows.map((row,i)=>`<tr style="background:${i%2===0?'#f8f9fa':'#fff'}">${row.map(cell=>`<td style="padding:6px 9px;border-bottom:1px solid #e9ecef;vertical-align:middle">${cell??'—'}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Plus Jakarta Sans',Arial,sans-serif;background:#fff;color:#1a1a2e;font-size:11pt}
.page{width:210mm;min-height:270mm;margin:0 auto;padding:14mm 14mm 28mm;position:relative}
.hdr{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1e3a5f;padding-bottom:12px;margin-bottom:14px}
.logo{height:60px;width:auto;object-fit:contain}
.hdr-mid{text-align:center;flex:1;padding:0 16px}
.ptitle{font-family:'Barlow Condensed',Arial;font-size:20pt;font-weight:800;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px}
.psub{font-size:9.5pt;color:#f59e0b;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-top:2px}
.hdr-r{text-align:right;font-size:8.5pt;color:#666;min-width:130px}
.hdr-r strong{color:#1e3a5f}
.pbox{background:#f0f4ff;border:1px solid #c7d2fe;border-radius:6px;padding:10px 14px;margin-bottom:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.pi{display:flex;flex-direction:column;gap:1px}
.pl{font-size:7.5pt;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;font-weight:600}
.pv{font-size:9.5pt;color:#1e3a5f;font-weight:700}
.sec-title{font-family:'Barlow Condensed',Arial;font-size:13pt;font-weight:800;color:#1e3a5f;border-left:4px solid #f59e0b;padding-left:10px;margin:12px 0 8px;text-transform:uppercase}
.footer{position:fixed;bottom:0;left:0;right:0;padding:6mm 14mm;border-top:2px solid #1e3a5f;display:flex;align-items:center;justify-content:space-between;background:#fff}
.fl{font-size:8pt;color:#6b7280}
.fl strong{color:#1e3a5f}
.sig-blk{display:flex;align-items:center;gap:10px}
.sig-img{height:44px;width:auto;object-fit:contain}
.sig-inf{font-size:8pt;text-align:right}
.sig-name{font-weight:700;color:#1e3a5f}
.sig-role{color:#f59e0b;font-weight:600}
.pno{font-size:8pt;color:#9ca3af;font-family:monospace}
.badge-a{background:#d1fae5;color:#065f46;padding:2px 6px;border-radius:10px;font-size:7.5pt;font-weight:700}
.badge-r{background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:10px;font-size:7.5pt;font-weight:700}
.badge-p{background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:10px;font-size:7.5pt;font-weight:700}
.badge-o{background:#ffedd5;color:#c2410c;padding:2px 6px;border-radius:10px;font-size:7.5pt;font-weight:700}
.badge-c{background:#f3f4f6;color:#374151;padding:2px 6px;border-radius:10px;font-size:7.5pt;font-weight:700}
.badge-cr{background:#fee2e2;color:#7f1d1d;padding:2px 6px;border-radius:10px;font-size:7.5pt;font-weight:700;border:1px solid #fca5a5}
@media print{body{background:#fff}.page{margin:0;padding:12mm 13mm 26mm}}
</style></head><body>
<div class="page">
<div class="hdr">
  ${logo?`<img class="logo" src="${logo}" alt="CI Logo" mix-blend-mode:multiply;background:transparent;">`:'<div style="width:70px"></div>'}
  <div class="hdr-mid"><div class="ptitle">${title}</div>${subtitle?`<div class="psub">${subtitle}</div>`:''}</div>
  <div class="hdr-r"><strong>Construction Innovation</strong><br>Date: ${today}<br>Project: ${proj.code||''}<br>Ref: CI-${module.toUpperCase()}-2026</div>
</div>
<div class="pbox">
  <div class="pi"><span class="pl">Project</span><span class="pv">${proj.name||'—'}</span></div>
  <div class="pi"><span class="pl">Client</span><span class="pv">${proj.client||'—'}</span></div>
  <div class="pi"><span class="pl">Contractor</span><span class="pv">${proj.contractor||'—'}</span></div>
  <div class="pi"><span class="pl">Consultant</span><span class="pv">${proj.consultant||'—'}</span></div>
  <div class="pi"><span class="pl">Location</span><span class="pv">${proj.location||'—'}</span></div>
  <div class="pi"><span class="pl">Contract Value</span><span class="pv">${formatCurrency(proj.contractValue)}</span></div>
</div>
${kpiHTML}
${chartsHTML}
${extraHTML}
${tableHTML}
<div class="footer">
  <div class="fl"><strong>Construction Innovation Platform</strong> | Generated: ${today}<br>Computer-generated record — valid for reference purposes only</div>
  <div class="sig-blk">${sig?`<img class="sig-img" src="${sig}" alt="Sig" mix-blend-mode:multiply;background:transparent;">`:''}
    <div class="sig-inf"><div class="sig-name">Engr. Saqib Hussain (PE)</div><div class="sig-role">Lead Electrical Engineer</div><div style="font-size:7pt;color:#6b7280">Construction Innovation</div></div>
  </div>
  <div class="pno">Page 1 of 1</div>
</div>
</div></body></html>`;

  const w = window.open('','_blank','width=1100,height=860');
  w.document.write(html);
  w.document.close();
  setTimeout(()=>{ w.focus(); w.print(); }, 900);
}

// ── STATUS BADGE HELPER ───────────────────────────────────────
function pdfBadge(status) {
  const map={approved:'badge-a',rejected:'badge-r',submitted:'badge-p','under-review':'badge-p',open:'badge-o',closed:'badge-c',pending:'badge-p',passed:'badge-a',failed:'badge-r',critical:'badge-cr'};
  const cls=map[status]||'badge-c';
  return `<span class="${cls}">${status.replace(/-/g,' ').toUpperCase()}</span>`;
}

// ── CURRENCY FORMATTERS ───────────────────────────────────────
function formatCurrency(value) {
  if (value === undefined || value === null) return '—';
  return 'SAR ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatMillions(value) {
  if (value === undefined || value === null) return '—';
  const millions = value / 1e6;
  return 'SAR ' + millions.toFixed(1) + 'M';
}

// ── PROJECTS PAGE ─────────────────────────────────────────────
function renderProjects() {
  const D = window.APP_DATA;
  const data = D.PROJECTS;
  const tableBody = document.getElementById('projects-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = data.map(p => `
    <tr>
      <td class="td-mono">${p.id}</td>
      <td>${p.code}</td>
      <td style="font-weight:600;color:var(--text-primary)">${p.name}</td>
      <td>${p.client || '—'}</td>
      <td class="td-mono">${formatMillions(p.contractValue)}</td>
      <td><div class="progress-bar" style="width:60px"><div class="progress-fill" style="width:${p.currentProgress}%"></div></div> ${p.currentProgress}%</td>
      <td>${statusBadge(p.status)}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="openEditProjectModal('${p.id}')">✎ Edit</button>
        <button class="btn btn-sm btn-danger" onclick="confirmDeleteProject('${p.id}')">🗑 Delete</button>
        <button class="btn btn-sm btn-secondary" onclick="triggerImport('projects')">Import</button>
      </td>
    </tr>`).join('');
  setupTableFilter('projects-filter-input', 'projects-table-body');
}

function openEditProjectModal(id) {
  const p = window.APP_DATA.PROJECTS.find(x => x.id === id);
  if (!p) return;
  openModal('Edit Project', '', `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Project ID</label><input class="form-control" id="ep-id" value="${p.id}"></div>
      <div class="form-group"><label class="form-label">Project Code</label><input class="form-control" id="ep-code" value="${p.code}"></div>
    </div>
    <div class="form-group"><label class="form-label">Project Name</label><input class="form-control" id="ep-name" value="${p.name}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Client</label><input class="form-control" id="ep-client" value="${p.client || ''}"></div>
      <div class="form-group"><label class="form-label">Contractor</label><input class="form-control" id="ep-contractor" value="${p.contractor || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Contract Value (SAR)</label><input class="form-control" id="ep-value" type="number" value="${p.contractValue}"></div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="ep-status">
          <option value="active" ${p.status==='active'?'selected':''}>Active</option>
          <option value="planned" ${p.status==='planned'?'selected':''}>Planned</option>
          <option value="completed" ${p.status==='completed'?'selected':''}>Completed</option>
          <option value="on-hold" ${p.status==='on-hold'?'selected':''}>On Hold</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Start Date</label><input class="form-control" id="ep-start" type="date" value="${p.startDate || ''}"></div>
      <div class="form-group"><label class="form-label">Planned End</label><input class="form-control" id="ep-end" type="date" value="${p.plannedEnd || ''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="ep-desc" rows="2">${p.description || ''}</textarea></div>`,
    () => {
      p.id = document.getElementById('ep-id').value;
      p.code = document.getElementById('ep-code').value;
      p.name = document.getElementById('ep-name').value;
      p.client = document.getElementById('ep-client').value;
      p.contractor = document.getElementById('ep-contractor').value;
      p.contractValue = parseFloat(document.getElementById('ep-value').value) || 0;
      p.status = document.getElementById('ep-status').value;
      p.startDate = document.getElementById('ep-start').value;
      p.plannedEnd = document.getElementById('ep-end').value;
      p.description = document.getElementById('ep-desc').value;
      renderProjects();
      // Update switcher
      const switcher = document.getElementById('project-switcher');
      if (switcher) {
        switcher.innerHTML = window.APP_DATA.PROJECTS.map(p => `<option value="${p.id}" ${p.id===window.APP_DATA.ACTIVE_PROJECT.id?'selected':''}>${p.code} — ${p.name.substring(0,28)}…</option>`).join('');
      }
      showToast('Project Updated', p.name, 'success');
    }
  );
}

function confirmDeleteProject(id) {
  if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
  if (!confirm('Final confirmation: Delete project permanently?')) return;
  const index = window.APP_DATA.PROJECTS.findIndex(x => x.id === id);
  if (index !== -1) {
    const deleted = window.APP_DATA.PROJECTS.splice(index, 1)[0];
    if (window.APP_DATA.ACTIVE_PROJECT.id === id && window.APP_DATA.PROJECTS.length > 0) {
      window.APP_DATA.ACTIVE_PROJECT = window.APP_DATA.PROJECTS[0];
      updateProjectDisplay(window.APP_DATA.ACTIVE_PROJECT);
    }
    renderProjects();
    const switcher = document.getElementById('project-switcher');
    if (switcher) {
      switcher.innerHTML = window.APP_DATA.PROJECTS.map(p => `<option value="${p.id}" ${p.id===window.APP_DATA.ACTIVE_PROJECT.id?'selected':''}>${p.code} — ${p.name.substring(0,28)}…</option>`).join('');
    }
    showToast('Project Deleted', deleted.name, 'warning');
  }
}

function exportProjectsCSV() {
  window.APP_DATA.exportToCSV(window.APP_DATA.PROJECTS, 'Projects');
}

function printProjectsPDF() {
  const data = window.APP_DATA.PROJECTS;
  generatePDF({
    title: 'PROJECT REGISTER',
    module: 'PRJ',
    kpis: [
      { label: 'Total Projects', value: data.length, color: '#1d4ed8' },
      { label: 'Active', value: data.filter(p => p.status === 'active').length, color: '#059669' },
      { label: 'Completed', value: data.filter(p => p.status === 'completed').length, color: '#6b7280' },
    ],
    tableHeaders: ['ID', 'Code', 'Name', 'Client', 'Contract Value', 'Progress', 'Status'],
    tableRows: data.map(p => [p.id, p.code, p.name, p.client || '—', formatCurrency(p.contractValue), p.currentProgress + '%', p.status])
  });
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  const D = window.APP_DATA, KPIs = D.computeKPIs(), proj = D.ACTIVE_PROJECT;
  document.getElementById('wb-project').textContent = proj.name;
  document.getElementById('wb-progress').textContent = KPIs.overallProgress + '%';
  document.getElementById('wb-workers').textContent = KPIs.activeWorkers;
  document.getElementById('wb-contract').textContent = formatMillions(proj.contractValue);
  document.getElementById('kpi-drawings-pending').textContent = KPIs.drawingsPending;
  document.getElementById('kpi-open-ncrs').textContent = KPIs.openNCRs + KPIs.openRFIs + KPIs.openSIs;
  document.getElementById('kpi-schedule-var').textContent = KPIs.scheduleVariance + '%';
  document.getElementById('kpi-cost-var').textContent = (KPIs.costVariance>0?'+':'') + KPIs.costVariance + '%';
  document.getElementById('kpi-progress').textContent = KPIs.overallProgress + '%';
  document.getElementById('kpi-workers').textContent = KPIs.activeWorkers;
  document.getElementById('kpi-safe-hours').textContent = (KPIs.safeManHours/1000).toFixed(0) + 'K';
  document.getElementById('kpi-ltir').textContent = KPIs.ltir;
  renderSCurveChart(); renderDisciplineChart(); renderMilestoneList(); renderDashboardActivity();
}

function renderSCurveChart() {
  const ctx = document.getElementById('scurve-chart'); if (!ctx) return;
  if (STATE.charts.scurve) STATE.charts.scurve.destroy();
  const d = window.APP_DATA.mockProgressData.sCurveData;
  STATE.charts.scurve = new Chart(ctx, { type:'line', data:{ labels:d.map(x=>x.month), datasets:[{ label:'Planned', data:d.map(x=>x.planned), borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.12)', borderWidth:2.5, pointRadius:3, tension:0.4, fill:'origin' },{ label:'Actual', data:d.map(x=>x.actual), borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.12)', borderWidth:2.5, pointRadius:3, tension:0.4, fill:'origin', spanGaps:false }] }, options:chartDefaults({ scales:{ y:{ min:0, suggestedMax:55, ticks:{ callback:v=>v+'%' } } } }) });
}

function renderDisciplineChart() {
  const ctx = document.getElementById('discipline-chart'); if (!ctx) return;
  if (STATE.charts.discipline) STATE.charts.discipline.destroy();
  const d = window.APP_DATA.mockProgressData.disciplineProgress;
  STATE.charts.discipline = new Chart(ctx, { type:'bar', data:{ labels:d.map(x=>x.name), datasets:[{ label:'Planned %', data:d.map(x=>x.planned), backgroundColor:'rgba(59,130,246,0.3)', borderColor:'#3b82f6', borderWidth:1, borderRadius:4 },{ label:'Actual %', data:d.map(x=>x.progress), backgroundColor:'rgba(16,185,129,0.7)', borderColor:'#10b981', borderWidth:1, borderRadius:4 }] }, options:chartDefaults({ scales:{ y:{ max:100, ticks:{ callback:v=>v+'%' } } } }) });
}

function renderMilestoneList() {
  const container = document.getElementById('milestone-list'); if (!container) return;
  const icons={completed:'✓','on-track':'►','at-risk':'⚠',delayed:'✗'};
  container.innerHTML = window.APP_DATA.mockProgressData.milestones.slice(0,6).map(ms=>`
    <div class="milestone-item">
      <div class="ms-icon ${ms.status}">${icons[ms.status]||'●'}</div>
      <div class="ms-info"><div class="ms-name">${ms.name}</div><div class="ms-date">Planned: ${ms.planned}${ms.actual?' | Actual: '+ms.actual:''}</div></div>
      <span class="badge badge-${ms.status==='completed'?'completed':ms.status==='on-track'?'approved':ms.status==='at-risk'?'pending':'rejected'}">${ms.status.replace('-',' ')}</span>
      ${ms.delay>0?`<span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--accent-rose)">+${ms.delay}d</span>`:''}
    </div>`).join('');
}

function renderDashboardActivity() {
  const activities=[{color:'var(--accent-emerald)',text:'DWG-010 Fire Suppression approved by consultant',time:'1h ago'},{color:'var(--accent-rose)',text:'NCR-003 raised: Improper Curing Procedure – Critical',time:'3h ago'},{color:'var(--accent-blue)',text:'MAT-003 Curtain Wall submitted for review',time:'6h ago'},{color:'var(--accent-amber)',text:'HSE-003 Near Miss: Crane swing logged',time:'1d ago'},{color:'var(--accent-violet)',text:'PO-004 HVAC Equipment partial delivery (60%)',time:'2d ago'}];
  const c = document.getElementById('activity-feed'); if(!c)return;
  c.innerHTML = activities.map(a=>`<div class="activity-item"><div class="activity-dot" style="background:${a.color}"></div><div style="flex:1"><div style="font-size:12.5px;color:var(--text-primary)">${a.text}</div><div style="font-size:10px;color:var(--text-muted);font-family:'DM Mono',monospace;margin-top:2px">${a.time}</div></div></div>`).join('');
}

async function printDashboardPDF() {
  const D=window.APP_DATA, KPIs=D.computeKPIs();
  const scurveCanvas = document.getElementById('scurve-chart');
  const disciplineCanvas = document.getElementById('discipline-chart');
  const charts = [];
  if (scurveCanvas) charts.push({ data: scurveCanvas.toDataURL('image/png') });
  if (disciplineCanvas) charts.push({ data: disciplineCanvas.toDataURL('image/png') });
  generatePDF({
    title:'DASHBOARD OVERVIEW',
    subtitle:'Live Project KPIs & Progress Summary',
    module:'DASH',
    kpis:[
      {label:'Overall Progress',value:KPIs.overallProgress+'%',color:'#1d4ed8'},
      {label:'Active Workers',value:KPIs.activeWorkers,color:'#059669'},
      {label:'Open NCRs',value:KPIs.openNCRs+KPIs.openRFIs+KPIs.openSIs,color:'#f59e0b'},
      {label:'Cost Variance',value:(KPIs.costVariance>0?'+':'')+KPIs.costVariance+'%',color:'#dc2626'},
      {label:'Safe Man Hours',value:(KPIs.safeManHours/1000).toFixed(0)+'K',color:'#059669'},
      {label:'LTIR Score',value:KPIs.ltir,color:'#f59e0b'},
      {label:'Drawings Pending',value:KPIs.drawingsPending,color:'#6366f1'},
      {label:'Schedule Variance',value:KPIs.scheduleVariance+'%',color:'#dc2626'},
    ],
    tableHeaders:['Milestone','Planned Date','Actual Date','Status','Delay (days)'],
    tableRows: D.mockProgressData.milestones.map(m=>[m.name,m.planned,m.actual||'—',pdfBadge(m.status),m.delay>0?'+'+m.delay+'d':'On time']),
    charts: charts
  });
}

// ── DRAWINGS ──────────────────────────────────────────────────
function renderDrawings() {
  const D=window.APP_DATA;
  let data = D.mockDrawingsData;
  const mepFilter = STATE.drawingMEPFilter;
  if (mepFilter === 'mep') data = data.filter(d=>d.discipline.includes('Electrical') || d.discipline.includes('Mechanical') || d.discipline.includes('Plumbing') || d.discipline.includes('HVAC') || d.discipline.includes('Firefighting'));
  else if (mepFilter === 'mechanical') data = data.filter(d=>d.discipline === 'Mechanical');
  else if (mepFilter === 'electrical') data = data.filter(d=>d.discipline === 'Electrical');
  else if (mepFilter === 'plumbing') data = data.filter(d=>d.discipline === 'Plumbing');
  else if (mepFilter === 'hvac') data = data.filter(d=>d.discipline === 'HVAC');
  else if (mepFilter === 'firefighting') data = data.filter(d=>d.discipline === 'Fire Protection');
  else if (mepFilter === 'architect') data = data.filter(d=>d.discipline === 'Architect');
  else if (mepFilter === 'civil') data = data.filter(d=>d.discipline === 'Civil');
  else if (mepFilter === 'structure') data = data.filter(d=>d.discipline === 'Structural');

  renderRegisterStats('drawings-stats',[
    {label:'Total',value:data.length,color:'blue'},
    {label:'Approved',value:data.filter(d=>d.status==='approved').length,color:'emerald'},
    {label:'Under Review',value:data.filter(d=>d.status==='under-review').length,color:'amber'},
    {label:'Rejected',value:data.filter(d=>d.status==='rejected').length,color:'rose'},
  ]);

  renderTable('drawings-table-body', data, d => `
    <tr>
      <td class="td-mono">${d.id}</td>
      <td><div style="font-weight:600;color:var(--text-primary)">${d.title}</div></td>
      <td><span class="tag">${d.discipline}</span></td>
      <td class="td-mono" style="color:var(--accent-cyan)">Rev ${d.rev}</td>
      <td>${statusBadge(d.status)}</td>
      <td class="td-mono">${d.date}</td>
      <td style="font-size:11px;color:var(--text-secondary);max-width:150px">${d.comments||'—'}</td>
      <td>
        <div style="display:flex;gap:4px">
          <a class="drive-link" href="${D.LOCAL_DRIVE.drawings}${encodeURIComponent(d.file)}" target="_blank" title="Open file from local drive">Open</a>
          <button class="btn btn-sm btn-secondary" onclick="viewDrawing('${d.id}')">View</button>
          <button class="btn btn-sm btn-secondary" onclick="editDrawingStatus('${d.id}')">Edit</button>
          <button class="btn btn-sm btn-secondary" onclick="triggerImport('drawings')">Import</button>
        </div>
      </td>
    </tr>`);

  setupTableFilter('drawing-filter-input','drawings-table-body');
  setupSelectFilter('drawing-status-filter','drawings-table-body',4);

  document.querySelectorAll('.mep-tab').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.mep-tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      STATE.drawingMEPFilter = t.dataset.mep;
      renderDrawings();
    };
  });
}

function viewDrawing(id) {
  const d=window.APP_DATA.mockDrawingsData.find(x=>x.id===id); if(!d)return;
  openModal('View Drawing','', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('Drawing ID',d.id)}${inf('Title',d.title)}
      ${inf('Discipline','<span class="tag">'+d.discipline+'</span>')}${inf('Revision','<span style="font-family:DM Mono,monospace;color:var(--accent-cyan)">Rev '+d.rev+'</span>')}
      ${inf('Status',statusBadge(d.status))}${inf('Date Submitted',d.date)}
      ${inf('Consultant',d.consultant)}${inf('Submitted By',d.submittedBy)}
    </div>
    <div style="margin-top:14px">${inf('Comments',d.comments||'No comments')}</div>
    <div style="margin-top:14px">
      <a class="drive-link" style="font-size:12px" href="${window.APP_DATA.LOCAL_DRIVE.drawings}${encodeURIComponent(d.file)}" target="_blank">📂 ${d.file}</a>
    </div>`);
}

function editDrawingStatus(id) {
  const d=window.APP_DATA.mockDrawingsData.find(x=>x.id===id); if(!d)return;
  openModal('Update Drawing Status','',`
    <div class="form-group"><label class="form-label">Drawing: ${d.title}</label></div>
    <div class="form-group"><label class="form-label">Status</label>
      <select class="form-control" id="edit-status-select">${['submitted','under-review','approved','rejected'].map(s=>`<option value="${s}"${s===d.status?' selected':''}>${capitalize(s)}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label class="form-label">Revision No.</label>
      <input class="form-control" id="edit-rev" type="number" min="1" value="${d.rev}">
    </div>
    <div class="form-group"><label class="form-label">Consultant Comments</label>
      <textarea class="form-control" id="edit-comments" rows="3">${d.comments}</textarea>
    </div>`,
  ()=>{
    d.status=document.getElementById('edit-status-select').value;
    d.rev=parseInt(document.getElementById('edit-rev').value)||d.rev;
    d.comments=document.getElementById('edit-comments').value;
    renderDrawings(); showToast('Updated',`${d.id} updated to Rev ${d.rev} — ${d.status}`,'success');
  });
}

function openAddDrawingModal() {
  openModal('Add New Drawing','',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Drawing ID</label><input class="form-control" id="nd-id" placeholder="DWG-011"></div>
      <div class="form-group"><label class="form-label">Revision</label><input class="form-control" id="nd-rev" type="number" value="1" min="1"></div>
    </div>
    <div class="form-group"><label class="form-label">Title</label><input class="form-control" id="nd-title" placeholder="Drawing title"></div>
    <div class="form-group"><label class="form-label">Discipline</label>
      <select class="form-control" id="nd-disc">${window.APP_DATA.DISCIPLINES.map(d=>`<option>${d}</option>`).join('')}</select>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Consultant</label><input class="form-control" id="nd-cons" placeholder="Meridian"></div>
      <div class="form-group"><label class="form-label">Date Submitted</label><input class="form-control" id="nd-date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
    </div>
    <div class="form-group"><label class="form-label">File Name (on local drive)</label><input class="form-control" id="nd-file" placeholder="DWG-011-Rev1.pdf"></div>
    <div class="form-group"><label class="form-label">Comments</label><textarea class="form-control" id="nd-comments" rows="2"></textarea></div>`,
  ()=>{
    const id=document.getElementById('nd-id').value||('DWG-0'+String(window.APP_DATA.mockDrawingsData.length+1).padStart(2,'0'));
    window.APP_DATA.mockDrawingsData.unshift({id,title:document.getElementById('nd-title').value||'New Drawing',discipline:document.getElementById('nd-disc').value,rev:parseInt(document.getElementById('nd-rev').value)||1,status:'submitted',submittedBy:'U001',date:document.getElementById('nd-date').value,consultant:document.getElementById('nd-cons').value,file:document.getElementById('nd-file').value||(id+'-Rev1.pdf'),comments:document.getElementById('nd-comments').value});
    renderDrawings(); showToast('Added',`${id} added to Drawing Register`,'success');
  });
}

function printDrawingsPDF() {
  const data = window.APP_DATA.mockDrawingsData;
  generatePDF({
    title:'DRAWING REGISTER',
    subtitle:'Document Control Register — All Disciplines',
    module:'DWG',
    kpis:[
      {label:'Total Drawings',value:data.length,color:'#1d4ed8'},
      {label:'Approved',value:data.filter(d=>d.status==='approved').length,color:'#059669'},
      {label:'Under Review',value:data.filter(d=>d.status==='under-review').length,color:'#f59e0b'},
      {label:'Rejected',value:data.filter(d=>d.status==='rejected').length,color:'#dc2626'},
    ],
    tableHeaders:['DWG ID','Title','Discipline','Rev','Status','Date','Consultant','Comments'],
    tableRows: data.map(d=>[d.id,d.title,d.discipline,'Rev '+d.rev,pdfBadge(d.status),d.date,d.consultant,d.comments||'—']),
  });
}

function importDrawingsCSV(file) {
  parseCSVFile(file, rows => {
    rows.forEach(r => {
      if (r.id && r.title) window.APP_DATA.mockDrawingsData.push({ id:r.id, title:r.title, discipline:r.discipline||'Civil', rev:parseInt(r.rev)||1, status:r.status||'submitted', submittedBy:'U001', date:r.date||new Date().toISOString().split('T')[0], consultant:r.consultant||'', file:r.file||'', comments:r.comments||'' });
    });
    renderDrawings(); showToast('Imported',`${rows.length} drawings imported`,'success');
  });
}

// ── MATERIALS ─────────────────────────────────────────────────
function renderMaterials() {
  const data=window.APP_DATA.mockMaterialsData;
  renderRegisterStats('materials-stats',[{label:'Total',value:data.length,color:'blue'},{label:'Approved',value:data.filter(d=>d.status==='approved').length,color:'emerald'},{label:'Pending',value:data.filter(d=>d.status==='under-review'||d.status==='submitted').length,color:'amber'},{label:'Rejected',value:data.filter(d=>d.status==='rejected').length,color:'rose'}]);
  renderTable('materials-table-body',data,m=>`
    <tr>
      <td class="td-mono">${m.id}</td>
      <td style="font-weight:600;color:var(--text-primary)">${m.item}</td>
      <td class="td-mono">${m.boqRef}</td>
      <td class="td-mono" style="color:var(--accent-amber)">${m.poNo||'—'}</td>
      <td style="color:var(--text-secondary)">${m.supplier}</td>
      <td class="td-mono" style="color:var(--accent-cyan)">Rev ${m.rev}</td>
      <td>${statusBadge(m.status)}</td>
      <td class="td-mono">${m.submitDate}</td>
      <td class="td-mono">${m.approveDate||'—'}</td>
      <td class="td-mono">${m.deliveryDate}</td>
      <td style="font-size:11px;color:var(--text-secondary)">${m.remarks||'—'}</td>
      <td>
        <a class="drive-link" href="${window.APP_DATA.LOCAL_DRIVE.materials}${encodeURIComponent(m.id+'-Rev'+m.rev+'.pdf')}" target="_blank">Open</a>
        <button class="btn btn-sm btn-secondary" onclick="viewMaterial('${m.id}')">View</button>
        <button class="btn btn-sm btn-secondary" onclick="editMaterial('${m.id}')">Edit</button>
        <button class="btn btn-sm btn-secondary" onclick="triggerImport('materials')">Import</button>
      </td>
    </tr>`);
  setupTableFilter('material-filter-input','materials-table-body');
}

function viewMaterial(id) {
  const m=window.APP_DATA.mockMaterialsData.find(x=>x.id===id); if(!m)return;
  openModal('View Material Submittal','',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('ID',m.id)}${inf('Description',m.item)}
      ${inf('BOQ Ref',m.boqRef)}${inf('PO No.',m.poNo||'—')}
      ${inf('Supplier',m.supplier)}${inf('Revision',m.rev)}
      ${inf('Status',statusBadge(m.status))}${inf('Submit Date',m.submitDate)}
      ${inf('Delivery Date',m.deliveryDate||'—')}${inf('Qty',m.qty+' '+m.unit)}
    </div>
    <div style="margin-top:14px">${inf('Remarks',m.remarks||'—')}</div>`);
}

function editMaterial(id) {
  const m=window.APP_DATA.mockMaterialsData.find(x=>x.id===id); if(!m)return;
  openModal('Edit Material Submittal','',`
    <div class="form-group"><label class="form-label">Material: ${m.item}</label></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="em-status">${['submitted','under-review','approved','rejected'].map(s=>`<option value="${s}"${s===m.status?' selected':''}>${capitalize(s)}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Revision No.</label>
        <input class="form-control" id="em-rev" type="number" min="1" value="${m.rev}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">PO Number</label><input class="form-control" id="em-po" value="${m.poNo||''}"></div>
      <div class="form-group"><label class="form-label">Approved Date</label><input class="form-control" id="em-adate" type="date" value="${m.approveDate}"></div>
    </div>
    <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="em-remarks" rows="2">${m.remarks||''}</textarea></div>`,
  ()=>{
    m.status=document.getElementById('em-status').value;
    m.rev=parseInt(document.getElementById('em-rev').value)||m.rev;
    m.poNo=document.getElementById('em-po').value;
    m.approveDate=document.getElementById('em-adate').value;
    m.remarks=document.getElementById('em-remarks').value;
    renderMaterials(); showToast('Updated',`${m.id} updated`,'success');
  });
}

function openAddMaterialModal() {
  openModal('Add Material Submittal','',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">ID</label><input class="form-control" id="nm-id" placeholder="MAT-008"></div>
      <div class="form-group"><label class="form-label">PO Reference</label><input class="form-control" id="nm-po" placeholder="PO-001"></div>
    </div>
    <div class="form-group"><label class="form-label">Material Description</label><input class="form-control" id="nm-item" placeholder="Material name"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">BOQ Reference</label><input class="form-control" id="nm-boq" placeholder="BOQ-3.1.1"></div>
      <div class="form-group"><label class="form-label">Supplier</label><input class="form-control" id="nm-supplier" placeholder="Supplier name"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Qty</label><input class="form-control" id="nm-qty" type="number" placeholder="0"></div>
      <div class="form-group"><label class="form-label">Unit</label><input class="form-control" id="nm-unit" placeholder="m³, MT, No."></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Delivery Date</label><input class="form-control" id="nm-del" type="date"></div>
      <div class="form-group"><label class="form-label">Revision</label><input class="form-control" id="nm-rev" type="number" value="1" min="1"></div>
    </div>
    <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="nm-remarks" rows="2"></textarea></div>`,
  ()=>{
    const id=document.getElementById('nm-id').value||('MAT-0'+String(window.APP_DATA.mockMaterialsData.length+1).padStart(2,'0'));
    window.APP_DATA.mockMaterialsData.unshift({id,item:document.getElementById('nm-item').value||'New Material',boqRef:document.getElementById('nm-boq').value,poNo:document.getElementById('nm-po').value,supplier:document.getElementById('nm-supplier').value,rev:parseInt(document.getElementById('nm-rev').value)||1,status:'submitted',submitDate:new Date().toISOString().split('T')[0],approveDate:'',deliveryDate:document.getElementById('nm-del').value,qty:parseFloat(document.getElementById('nm-qty').value)||0,unit:document.getElementById('nm-unit').value,remarks:document.getElementById('nm-remarks').value});
    renderMaterials(); showToast('Added',`${id} added to Material Register`,'success');
  });
}

function printMaterialsPDF() {
  const data=window.APP_DATA.mockMaterialsData;
  generatePDF({ title:'MATERIAL SUBMITTAL REGISTER', subtitle:'BOQ-Linked Material Approvals & Delivery Tracking', module:'MAT',
    kpis:[{label:'Total Items',value:data.length,color:'#1d4ed8'},{label:'Approved',value:data.filter(d=>d.status==='approved').length,color:'#059669'},{label:'Pending',value:data.filter(d=>d.status!=='approved').length,color:'#f59e0b'},{label:'Rejected',value:data.filter(d=>d.status==='rejected').length,color:'#dc2626'}],
    tableHeaders:['ID','Material','BOQ Ref','PO No.','Supplier','Rev','Status','Submit Date','Delivery Date','Remarks'],
    tableRows:data.map(m=>[m.id,m.item,m.boqRef,m.poNo||'—',m.supplier,'Rev '+m.rev,pdfBadge(m.status),m.submitDate,m.deliveryDate,m.remarks||'—']),
  });
}

// ── METHODS ───────────────────────────────────────────────────
function renderMethods() {
  const data=window.APP_DATA.mockMethodsData;
  renderRegisterStats('methods-stats',[{label:'Total',value:data.length,color:'blue'},{label:'Approved',value:data.filter(d=>d.status==='approved').length,color:'emerald'},{label:'Pending HSE',value:data.filter(d=>d.hseReview==='Pending').length,color:'amber'},{label:'Critical Risk',value:data.filter(d=>d.risk==='Critical').length,color:'rose'}]);
  renderTable('methods-table-body',data,m=>`
    <tr>
      <td class="td-mono">${m.id}</td>
      <td style="font-weight:600;color:var(--text-primary)">${m.title}</td>
      <td><span class="tag">${m.category}</span></td>
      <td>${riskBadge(m.risk)}</td>
      <td class="td-mono" style="color:var(--accent-cyan)">Rev ${m.rev}</td>
      <td>${statusBadge(m.status)}</td>
      <td><span class="badge badge-${m.hseReview==='Approved'?'approved':'pending'}">${m.hseReview}</span></td>
      <td class="td-mono">${m.date}</td>
      <td>
        <a class="drive-link" href="${window.APP_DATA.LOCAL_DRIVE.methods}${encodeURIComponent(m.file)}" target="_blank">Open</a>
        <button class="btn btn-sm btn-secondary" onclick="viewMethod('${m.id}')">View</button>
        <button class="btn btn-sm btn-secondary" onclick="editMethod('${m.id}')">Edit</button>
        <button class="btn btn-sm btn-secondary" onclick="triggerImport('methods')">Import</button>
      </td>
    </tr>`);
  setupTableFilter('method-filter-input','methods-table-body');
}

function viewMethod(id) {
  const m=window.APP_DATA.mockMethodsData.find(x=>x.id===id); if(!m)return;
  openModal('View Method Statement','',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('MS ID',m.id)}${inf('Title',m.title)}
      ${inf('Category',m.category)}${inf('Risk',riskBadge(m.risk))}
      ${inf('Status',statusBadge(m.status))}${inf('Revision',m.rev)}
      ${inf('HSE Review',m.hseReview)}${inf('Date',m.date)}
      ${inf('Submitted By',m.submittedBy)}
    </div>`);
}

function editMethod(id) {
  const m=window.APP_DATA.mockMethodsData.find(x=>x.id===id); if(!m)return;
  openModal('Edit Method Statement','',`
    <div class="form-group"><label class="form-label">Title: ${m.title}</label></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="ems-status">${['submitted','under-review','approved','rejected'].map(s=>`<option value="${s}"${s===m.status?' selected':''}>${capitalize(s)}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Revision</label><input class="form-control" id="ems-rev" type="number" min="1" value="${m.rev}"></div>
    </div>
    <div class="form-group"><label class="form-label">HSE Review</label>
      <select class="form-control" id="ems-hse"><option${m.hseReview==='Pending'?' selected':''}>Pending</option><option${m.hseReview==='Approved'?' selected':''}>Approved</option><option${m.hseReview==='Rejected'?' selected':''}>Rejected</option></select>
    </div>`,
  ()=>{
    m.status=document.getElementById('ems-status').value;
    m.rev=parseInt(document.getElementById('ems-rev').value)||m.rev;
    m.hseReview=document.getElementById('ems-hse').value;
    m.file=`${m.id}-Rev${m.rev}.pdf`;
    renderMethods(); showToast('Updated',`${m.id} updated to Rev ${m.rev}`,'success');
  });
}

function openAddMethodModal() {
  openModal('Add Method Statement','',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">MS ID</label><input class="form-control" id="nm-id" placeholder="MS-007"></div>
      <div class="form-group"><label class="form-label">Revision</label><input class="form-control" id="nm-rev" type="number" value="1" min="1"></div>
    </div>
    <div class="form-group"><label class="form-label">Title</label><input class="form-control" id="nm-title" placeholder="Method statement title"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Category</label><input class="form-control" id="nm-cat" placeholder="Structural"></div>
      <div class="form-group"><label class="form-label">Risk Level</label>
        <select class="form-control" id="nm-risk"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">HSE Review</label>
      <select class="form-control" id="nm-hse"><option>Pending</option><option>Approved</option><option>Rejected</option></select>
    </div>
    <div class="form-group"><label class="form-label">File Name</label><input class="form-control" id="nm-file" placeholder="MS-007-Rev1.pdf"></div>`,
  ()=>{
    const id=document.getElementById('nm-id').value||('MS-0'+String(window.APP_DATA.mockMethodsData.length+1).padStart(2,'0'));
    window.APP_DATA.mockMethodsData.unshift({
      id, title: document.getElementById('nm-title').value || 'New MS',
      category: document.getElementById('nm-cat').value,
      risk: document.getElementById('nm-risk').value,
      rev: parseInt(document.getElementById('nm-rev').value)||1,
      status: 'submitted',
      submittedBy: 'U001',
      date: new Date().toISOString().split('T')[0],
      hseReview: document.getElementById('nm-hse').value,
      file: document.getElementById('nm-file').value || (id+'-Rev1.pdf')
    });
    renderMethods(); showToast('Added',`${id} added to Method Statements`,'success');
  });
}

function printMethodsPDF() {
  const data=window.APP_DATA.mockMethodsData;
  generatePDF({ title:'METHOD STATEMENT REGISTER', subtitle:'Construction Methods, HSE Reviews & Risk Assessments', module:'MS',
    kpis:[{label:'Total MSs',value:data.length,color:'#1d4ed8'},{label:'Approved',value:data.filter(d=>d.status==='approved').length,color:'#059669'},{label:'HSE Pending',value:data.filter(d=>d.hseReview==='Pending').length,color:'#f59e0b'},{label:'Critical Risk',value:data.filter(d=>d.risk==='Critical').length,color:'#dc2626'}],
    tableHeaders:['MS ID','Title','Category','Risk','Rev','Status','HSE Review','Date'],
    tableRows:data.map(m=>[m.id,m.title,m.category,m.risk,'Rev '+m.rev,pdfBadge(m.status),m.hseReview,m.date]),
  });
}

// ── TESTING ───────────────────────────────────────────────────
function renderTesting() {
  const data=window.APP_DATA.mockTestingData;
  renderRegisterStats('testing-stats',[{label:'Total Tests',value:data.length,color:'blue'},{label:'Passed',value:data.filter(d=>d.status==='passed').length,color:'emerald'},{label:'Failed',value:data.filter(d=>d.status==='failed').length,color:'rose'},{label:'Pending',value:data.filter(d=>d.status==='pending').length,color:'amber'}]);
  renderTable('testing-table-body',data,t=>`
    <tr>
      <td class="td-mono">${t.id}</td>
      <td style="font-weight:600;color:var(--text-primary)">${t.system}</td>
      <td><span class="tag">${t.type}</span></td>
      <td class="td-mono">${t.date}</td>
      <td class="td-mono" style="color:var(--accent-cyan)">Rev ${t.rev}</td>
      <td>${statusBadge(t.status)}</td>
      <td>${t.cert?`<span class="td-mono" style="color:var(--accent-emerald)">${t.cert}</span>`:'—'}</td>
      <td style="font-size:11px;color:var(--text-secondary)">${t.remarks}</td>
      <td>
        ${t.file?`<a class="drive-link" href="${window.APP_DATA.LOCAL_DRIVE.testing}${encodeURIComponent(t.file)}" target="_blank">Open</a>`:'<span style="color:var(--text-muted);font-size:11px">No file</span>'}
        <button class="btn btn-sm btn-secondary" onclick="viewTest('${t.id}')">View</button>
        <button class="btn btn-sm btn-secondary" onclick="editTesting('${t.id}')">Edit</button>
        <button class="btn btn-sm btn-secondary" onclick="triggerImport('testing')">Import</button>
      </td>
    </tr>`);
}

function viewTest(id) {
  const t=window.APP_DATA.mockTestingData.find(x=>x.id===id); if(!t)return;
  openModal('View Test Record','',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('Test ID',t.id)}${inf('System',t.system)}
      ${inf('Type',t.type)}${inf('Date',t.date)}
      ${inf('Status',statusBadge(t.status))}${inf('Certificate',t.cert||'—')}
      ${inf('Revision',t.rev)}
    </div>
    <div style="margin-top:14px">${inf('Remarks',t.remarks)}</div>`);
}

function editTesting(id) {
  const t=window.APP_DATA.mockTestingData.find(x=>x.id===id); if(!t)return;
  openModal('Edit Test Record','',`
    <div class="form-group"><label class="form-label">System: ${t.system}</label></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="et-status"><option value="pending"${t.status==='pending'?' selected':''}>Pending</option><option value="passed"${t.status==='passed'?' selected':''}>Passed</option><option value="failed"${t.status==='failed'?' selected':''}>Failed</option></select>
      </div>
      <div class="form-group"><label class="form-label">Revision</label><input class="form-control" id="et-rev" type="number" min="1" value="${t.rev}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Certificate No.</label><input class="form-control" id="et-cert" value="${t.cert||''}"></div>
      <div class="form-group"><label class="form-label">Test Date</label><input class="form-control" id="et-date" type="date" value="${t.date}"></div>
    </div>
    <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="et-remarks" rows="2">${t.remarks}</textarea></div>`,
  ()=>{
    t.status=document.getElementById('et-status').value;
    t.rev=parseInt(document.getElementById('et-rev').value)||t.rev;
    t.cert=document.getElementById('et-cert').value;
    t.date=document.getElementById('et-date').value;
    t.remarks=document.getElementById('et-remarks').value;
    t.file=t.cert?`${t.id}-Rev${t.rev}.pdf`:'';
    renderTesting(); showToast('Updated',`${t.id} updated`,'success');
  });
}

function openAddTestModal() {
  openModal('Add Test Record','',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Test ID</label><input class="form-control" id="nt-id" placeholder="TC-007"></div>
      <div class="form-group"><label class="form-label">Revision</label><input class="form-control" id="nt-rev" type="number" value="1" min="1"></div>
    </div>
    <div class="form-group"><label class="form-label">System / Test</label><input class="form-control" id="nt-sys" placeholder="System name"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Type</label><input class="form-control" id="nt-type" placeholder="Structural"></div>
      <div class="form-group"><label class="form-label">Test Date</label><input class="form-control" id="nt-date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
    </div>
    <div class="form-group"><label class="form-label">Status</label>
      <select class="form-control" id="nt-status"><option value="pending">Pending</option><option value="passed">Passed</option><option value="failed">Failed</option></select>
    </div>
    <div class="form-group"><label class="form-label">Certificate No.</label><input class="form-control" id="nt-cert" placeholder="CERT-001"></div>
    <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="nt-remarks" rows="2"></textarea></div>`,
  ()=>{
    const id=document.getElementById('nt-id').value||('TC-0'+String(window.APP_DATA.mockTestingData.length+1).padStart(2,'0'));
    window.APP_DATA.mockTestingData.unshift({
      id, system: document.getElementById('nt-sys').value || 'New Test',
      type: document.getElementById('nt-type').value,
      date: document.getElementById('nt-date').value,
      rev: parseInt(document.getElementById('nt-rev').value)||1,
      status: document.getElementById('nt-status').value,
      cert: document.getElementById('nt-cert').value,
      file: document.getElementById('nt-cert').value ? (id+'-Rev1.pdf') : '',
      remarks: document.getElementById('nt-remarks').value
    });
    renderTesting(); showToast('Added',`${id} added to Test Register`,'success');
  });
}

function printTestingPDF() {
  const data=window.APP_DATA.mockTestingData;
  generatePDF({ title:'TEST & COMMISSIONING REGISTER', subtitle:'Test Certificates, Commissioning Logs & Punch Lists', module:'TC',
    kpis:[{label:'Total Tests',value:data.length,color:'#1d4ed8'},{label:'Passed',value:data.filter(d=>d.status==='passed').length,color:'#059669'},{label:'Failed',value:data.filter(d=>d.status==='failed').length,color:'#dc2626'},{label:'Pending',value:data.filter(d=>d.status==='pending').length,color:'#f59e0b'}],
    tableHeaders:['ID','System / Test','Type','Date','Rev','Status','Certificate','Remarks'],
    tableRows:data.map(t=>[t.id,t.system,t.type,t.date,'Rev '+t.rev,pdfBadge(t.status),t.cert||'—',t.remarks]),
  });
}

// ── NCR / RFI / SI ────────────────────────────────────────────
function renderNCRPage() {
  const tab = STATE.ncrTab;
  document.querySelectorAll('.ncr-tab').forEach(t => t.classList.toggle('active', t.dataset.ncrtab === tab));
  document.querySelectorAll('.ncr-sub-section').forEach(s => s.style.display = s.id === 'ncr-section-'+tab ? '' : 'none');
  if (tab === 'ncr') renderNCR();
  else if (tab === 'rfi') renderRFI();
  else renderSI();
}

function renderNCR() {
  const data=window.APP_DATA.mockNCRData;
  renderRegisterStats('ncr-stats',[{label:'Total NCRs',value:data.length,color:'blue'},{label:'Open',value:data.filter(d=>d.status==='open').length,color:'amber'},{label:'Critical',value:data.filter(d=>d.priority==='critical'&&d.status==='open').length,color:'rose'},{label:'Closed',value:data.filter(d=>d.status==='closed').length,color:'emerald'}]);
  renderTable('ncr-table-body',data,n=>`
    <tr>
      <td class="td-mono">${n.id}</td>
      <td style="font-weight:600;color:var(--text-primary)">${n.title}</td>
      <td>${priorityBadge(n.priority)}</td>
      <td><span class="badge badge-${n.status}">${n.status.toUpperCase()}</span></td>
      <td class="td-mono">${n.date}</td>
      <td class="td-mono">${n.closureDate||'—'}</td>
      <td style="font-size:11px;color:var(--text-secondary)">${n.location||'—'}</td>
      <td style="font-size:11px;color:var(--text-secondary)">${n.remarks||'—'}</td>
      <td>
        <a class="drive-link" href="${window.APP_DATA.LOCAL_DRIVE.ncr}${encodeURIComponent(n.file)}" target="_blank">Open</a>
        <button class="btn btn-sm btn-secondary" onclick="viewNCR('${n.id}')">View</button>
        <button class="btn btn-sm btn-secondary" onclick="editNCR('${n.id}')">Edit</button>
        ${n.status==='open'?`<button class="btn btn-sm btn-success" onclick="closeNCR('${n.id}')">Close</button>`:''}
        <button class="btn btn-sm btn-secondary" onclick="triggerImport('ncr')">Import</button>
      </td>
    </tr>`);
  setupTableFilter('ncr-filter-input','ncr-table-body');
}

function viewNCR(id) {
  const n=window.APP_DATA.mockNCRData.find(x=>x.id===id); if(!n)return;
  openModal('View NCR','',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('NCR ID',n.id)}${inf('Title',n.title)}
      ${inf('Priority',priorityBadge(n.priority))}${inf('Status','<span class="badge badge-'+n.status+'">'+n.status.toUpperCase()+'</span>')}
      ${inf('Date Raised',n.date)}${inf('Closure Date',n.closureDate||'—')}
      ${inf('Location',n.location||'—')}${inf('Raised By',n.raised)}
      ${inf('Assigned To',n.assignedTo)}
    </div>
    <div style="margin-top:14px">${inf('Remarks',n.remarks||'—')}</div>`);
}

function editNCR(id) {
  const n=window.APP_DATA.mockNCRData.find(x=>x.id===id); if(!n)return;
  openModal('Edit NCR','',`
    <div class="form-group"><label class="form-label">NCR: ${n.id} — ${n.title}</label></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Priority</label>
        <select class="form-control" id="en-pri"><option value="low"${n.priority==='low'?' selected':''}>Low</option><option value="medium"${n.priority==='medium'?' selected':''}>Medium</option><option value="high"${n.priority==='high'?' selected':''}>High</option><option value="critical"${n.priority==='critical'?' selected':''}>Critical</option></select>
      </div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="en-status"><option value="open"${n.status==='open'?' selected':''}>Open</option><option value="closed"${n.status==='closed'?' selected':''}>Closed</option></select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="en-loc" value="${n.location||''}"></div>
    <div class="form-group"><label class="form-label">Assigned To</label>
      <select class="form-control" id="en-assign">${window.APP_DATA.USERS.map(u=>`<option value="${u.id}"${u.id===n.assignedTo?' selected':''}>${u.name}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="en-rem" rows="2">${n.remarks||''}</textarea></div>`,
  ()=>{
    n.priority=document.getElementById('en-pri').value;
    n.status=document.getElementById('en-status').value;
    n.location=document.getElementById('en-loc').value;
    n.assignedTo=document.getElementById('en-assign').value;
    n.remarks=document.getElementById('en-rem').value;
    if(n.status==='closed'&&!n.closureDate) n.closureDate=new Date().toISOString().split('T')[0];
    renderNCR(); showToast('Updated',`${id} updated`,'success');
  });
}

function renderRFI() {
  const data=window.APP_DATA.mockRFIData;
  renderTable('rfi-table-body',data,r=>`
    <tr>
      <td class="td-mono">${r.id}</td>
      <td style="font-weight:600;color:var(--text-primary)">${r.title}</td>
      <td><span class="tag">${r.discipline||'—'}</span></td>
      <td>${priorityBadge(r.priority)}</td>
      <td><span class="badge badge-${r.status}">${r.status.toUpperCase()}</span></td>
      <td class="td-mono">${r.date}</td>
      <td class="td-mono">${r.closureDate||'—'}</td>
      <td style="font-size:11px;color:var(--text-secondary)">${r.remarks||'—'}</td>
      <td>
        <a class="drive-link" href="${window.APP_DATA.LOCAL_DRIVE.rfi}${encodeURIComponent(r.file)}" target="_blank">Open</a>
        <button class="btn btn-sm btn-secondary" onclick="viewRFI('${r.id}')">View</button>
        <button class="btn btn-sm btn-secondary" onclick="editRFI('${r.id}')">Edit</button>
        ${r.status==='open'?`<button class="btn btn-sm btn-success" onclick="closeRFI('${r.id}')">Close</button>`:''}
        <button class="btn btn-sm btn-secondary" onclick="triggerImport('rfi')">Import</button>
      </td>
    </tr>`);
}

function viewRFI(id) {
  const r=window.APP_DATA.mockRFIData.find(x=>x.id===id); if(!r)return;
  openModal('View RFI','',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('RFI ID',r.id)}${inf('Title',r.title)}
      ${inf('Discipline',r.discipline||'—')}${inf('Priority',priorityBadge(r.priority))}
      ${inf('Status','<span class="badge badge-'+r.status+'">'+r.status.toUpperCase()+'</span>')}
      ${inf('Date',r.date)}${inf('Closure Date',r.closureDate||'—')}
    </div>
    <div style="margin-top:14px">${inf('Remarks',r.remarks||'—')}</div>`);
}

function editRFI(id) {
  const r=window.APP_DATA.mockRFIData.find(x=>x.id===id); if(!r)return;
  openModal('Edit RFI','',`
    <div class="form-group"><label class="form-label">RFI: ${r.id} — ${r.title}</label></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Priority</label>
        <select class="form-control" id="er-pri"><option value="low"${r.priority==='low'?' selected':''}>Low</option><option value="medium"${r.priority==='medium'?' selected':''}>Medium</option><option value="high"${r.priority==='high'?' selected':''}>High</option><option value="critical"${r.priority==='critical'?' selected':''}>Critical</option></select>
      </div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="er-status"><option value="open"${r.status==='open'?' selected':''}>Open</option><option value="closed"${r.status==='closed'?' selected':''}>Closed</option></select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Discipline</label><input class="form-control" id="er-disc" value="${r.discipline||''}"></div>
    <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="er-rem" rows="2">${r.remarks||''}</textarea></div>`,
  ()=>{
    r.priority=document.getElementById('er-pri').value;
    r.status=document.getElementById('er-status').value;
    r.discipline=document.getElementById('er-disc').value;
    r.remarks=document.getElementById('er-rem').value;
    if(r.status==='closed'&&!r.closureDate) r.closureDate=new Date().toISOString().split('T')[0];
    renderRFI(); showToast('Updated',`${id} updated`,'success');
  });
}

function renderSI() {
  const data=window.APP_DATA.mockSIData;
  renderTable('si-table-body',data,s=>`
    <tr>
      <td class="td-mono">${s.id}</td>
      <td style="font-weight:600;color:var(--text-primary)">${s.title}</td>
      <td class="td-mono">${s.ref||'—'}</td>
      <td>${priorityBadge(s.priority)}</td>
      <td><span class="badge badge-${s.status}">${s.status.toUpperCase()}</span></td>
      <td class="td-mono">${s.date}</td>
      <td style="color:var(--accent-amber);font-family:'DM Mono',monospace">${s.costImpact||'—'}</td>
      <td style="font-size:11px;color:var(--text-secondary)">${s.remarks||'—'}</td>
      <td>
        <a class="drive-link" href="${window.APP_DATA.LOCAL_DRIVE.si}${encodeURIComponent(s.file)}" target="_blank">Open</a>
        <button class="btn btn-sm btn-secondary" onclick="viewSI('${s.id}')">View</button>
        <button class="btn btn-sm btn-secondary" onclick="editSI('${s.id}')">Edit</button>
        ${s.status==='open'?`<button class="btn btn-sm btn-success" onclick="closeSI('${s.id}')">Close</button>`:''}
        <button class="btn btn-sm btn-secondary" onclick="triggerImport('si')">Import</button>
      </td>
    </tr>`);
}

function viewSI(id) {
  const s=window.APP_DATA.mockSIData.find(x=>x.id===id); if(!s)return;
  openModal('View Site Instruction','',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('SI ID',s.id)}${inf('Title',s.title)}
      ${inf('Ref',s.ref||'—')}${inf('Priority',priorityBadge(s.priority))}
      ${inf('Status','<span class="badge badge-'+s.status+'">'+s.status.toUpperCase()+'</span>')}
      ${inf('Date',s.date)}${inf('Cost Impact',s.costImpact||'—')}
    </div>
    <div style="margin-top:14px">${inf('Remarks',s.remarks||'—')}</div>`);
}

function editSI(id) {
  const s=window.APP_DATA.mockSIData.find(x=>x.id===id); if(!s)return;
  openModal('Edit Site Instruction','',`
    <div class="form-group"><label class="form-label">SI: ${s.id} — ${s.title}</label></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Priority</label>
        <select class="form-control" id="esi-pri"><option value="low"${s.priority==='low'?' selected':''}>Low</option><option value="medium"${s.priority==='medium'?' selected':''}>Medium</option><option value="high"${s.priority==='high'?' selected':''}>High</option><option value="critical"${s.priority==='critical'?' selected':''}>Critical</option></select>
      </div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="esi-status"><option value="open"${s.status==='open'?' selected':''}>Open</option><option value="closed"${s.status==='closed'?' selected':''}>Closed</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Ref / SKT</label><input class="form-control" id="esi-ref" value="${s.ref||''}"></div>
      <div class="form-group"><label class="form-label">Cost Impact</label><input class="form-control" id="esi-cost" value="${s.costImpact||''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="esi-rem" rows="2">${s.remarks||''}</textarea></div>`,
  ()=>{
    s.priority=document.getElementById('esi-pri').value;
    s.status=document.getElementById('esi-status').value;
    s.ref=document.getElementById('esi-ref').value;
    s.costImpact=document.getElementById('esi-cost').value;
    s.remarks=document.getElementById('esi-rem').value;
    renderSI(); showToast('Updated',`${id} updated`,'success');
  });
}

function setNCRTab(tab) { STATE.ncrTab=tab; renderNCRPage(); }
function closeNCR(id) { const n=window.APP_DATA.mockNCRData.find(x=>x.id===id); if(n){n.status='closed';n.closureDate=new Date().toISOString().split('T')[0];renderNCR();showToast('Closed',`${id} closed`,'success');} }
function closeRFI(id) { const r=window.APP_DATA.mockRFIData.find(x=>x.id===id); if(r){r.status='closed';r.closureDate=new Date().toISOString().split('T')[0];renderRFI();showToast('Closed',`${id} closed`,'success');} }
function closeSI(id)  { const s=window.APP_DATA.mockSIData.find(x=>x.id===id);  if(s){s.status='closed';renderSI();showToast('Closed',`${id} closed`,'success');} }

function openAddNCRModal() {
  openModal('Raise New NCR','',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">NCR ID</label><input class="form-control" id="nn-id" placeholder="NCR-005"></div>
      <div class="form-group"><label class="form-label">Priority</label>
        <select class="form-control" id="nn-pri"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Title / Description</label><input class="form-control" id="nn-title" placeholder="Describe the non-conformance"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="nn-loc" placeholder="Site location"></div>
      <div class="form-group"><label class="form-label">Assigned To</label>
        <select class="form-control" id="nn-assign">${window.APP_DATA.USERS.map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="nn-rem" rows="2"></textarea></div>`,
  ()=>{
    const id=document.getElementById('nn-id').value||('NCR-0'+String(window.APP_DATA.mockNCRData.length+1).padStart(2,'0'));
    window.APP_DATA.mockNCRData.unshift({id,title:document.getElementById('nn-title').value||'New NCR',raised:'U001',date:new Date().toISOString().split('T')[0],status:'open',priority:document.getElementById('nn-pri').value,assignedTo:document.getElementById('nn-assign').value,closureDate:'',file:id+'.pdf',remarks:document.getElementById('nn-rem').value,location:document.getElementById('nn-loc').value});
    renderNCR(); showToast('Raised',`${id} has been raised`,'warning');
  });
}

function printNCRPDF() {
  const D=window.APP_DATA;
  generatePDF({ title:'NCR REGISTER', subtitle:'Non-Conformance Reports', module:'NCR',
    kpis:[{label:'Total NCRs',value:D.mockNCRData.length,color:'#1d4ed8'},{label:'Open',value:D.mockNCRData.filter(d=>d.status==='open').length,color:'#f59e0b'},{label:'Critical Open',value:D.mockNCRData.filter(d=>d.priority==='critical'&&d.status==='open').length,color:'#dc2626'},{label:'Closed',value:D.mockNCRData.filter(d=>d.status==='closed').length,color:'#059669'}],
    tableHeaders:['NCR ID','Title','Priority','Status','Date Raised','Closure Date','Location','Remarks'],
    tableRows:D.mockNCRData.map(n=>[n.id,n.title,n.priority.toUpperCase(),pdfBadge(n.status),n.date,n.closureDate||'Open',n.location||'—',n.remarks||'—']),
  });
}

function printRFIPDF() {
  const D=window.APP_DATA;
  generatePDF({ title:'RFI REGISTER', subtitle:'Requests for Information', module:'RFI',
    kpis:[{label:'Total RFIs',value:D.mockRFIData.length,color:'#1d4ed8'},{label:'Open',value:D.mockRFIData.filter(d=>d.status==='open').length,color:'#f59e0b'},{label:'Closed',value:D.mockRFIData.filter(d=>d.status==='closed').length,color:'#059669'},{label:'High Priority',value:D.mockRFIData.filter(d=>d.priority==='high').length,color:'#dc2626'}],
    tableHeaders:['RFI ID','Title','Discipline','Priority','Status','Date','Closure Date','Remarks'],
    tableRows:D.mockRFIData.map(r=>[r.id,r.title,r.discipline||'—',r.priority.toUpperCase(),pdfBadge(r.status),r.date,r.closureDate||'Open',r.remarks||'—']),
  });
}

function printSIPDF() {
  const D=window.APP_DATA;
  generatePDF({ title:'SITE INSTRUCTIONS', subtitle:'Issued by Consultant / Engineer', module:'SI',
    kpis:[{label:'Total SIs',value:D.mockSIData.length,color:'#1d4ed8'},{label:'Open',value:D.mockSIData.filter(d=>d.status==='open').length,color:'#f59e0b'},{label:'Closed',value:D.mockSIData.filter(d=>d.status==='closed').length,color:'#059669'},{label:'High Priority',value:D.mockSIData.filter(d=>d.priority==='high').length,color:'#dc2626'}],
    tableHeaders:['SI ID','Title','Ref / SKT','Priority','Status','Date','Cost Impact','Remarks'],
    tableRows:D.mockSIData.map(s=>[s.id,s.title,s.ref||'—',s.priority.toUpperCase(),pdfBadge(s.status),s.date,s.costImpact||'—',s.remarks||'—']),
  });
}

// ── PROCUREMENT ───────────────────────────────────────────────
function renderProcurement() {
  const data=window.APP_DATA.mockProcurementData;
  const total=data.reduce((a,p)=>a+p.poValue,0);
  renderRegisterStats('procurement-stats',[{label:'Total PO Value',value:formatMillions(total),color:'blue'},{label:'Active POs',value:data.filter(p=>p.status==='active').length,color:'emerald'},{label:'Pending Delivery',value:data.filter(p=>p.status==='pending'||p.status==='partially-delivered').length,color:'amber'},{label:'Delivered',value:data.filter(p=>p.status==='delivered').length,color:'violet'}]);
  renderTable('procurement-table-body',data,p=>{
    const pc=p.performance>=90?'var(--accent-emerald)':p.performance>=75?'var(--accent-amber)':p.performance>0?'var(--accent-rose)':'var(--text-muted)';
    return `<tr>
      <td class="td-mono" style="color:var(--accent-amber)">${p.id}</td>
      <td style="font-weight:600;color:var(--text-primary)">${p.item}</td>
      <td style="color:var(--text-secondary)">${p.vendor}</td>
      <td class="td-mono">${formatCurrency(p.poValue)}</td>
      <td>${statusBadge(p.status)}</td>
      <td class="td-mono">${p.deliveryDate}</td>
      <td style="font-size:11px;color:var(--text-secondary)">${p.payStatus}</td>
      <td><div style="display:flex;align-items:center;gap:6px"><div style="width:50px;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden"><div style="height:100%;width:${p.performance}%;background:${pc};transition:width 1s"></div></div><span style="font-family:'DM Mono',monospace;font-size:10px;color:${pc}">${p.performance||'—'}${p.performance?'%':''}</span></div></td>
      <td style="font-size:11px;color:var(--text-secondary)">${p.remarks||'—'}</td>
      <td>
        <a class="drive-link" href="${window.APP_DATA.LOCAL_DRIVE.procurement||'file:///C:/CI-Platform/Procurement/'}${encodeURIComponent(p.id+'.pdf')}" target="_blank">Open</a>
        <button class="btn btn-sm btn-secondary" onclick="viewPO('${p.id}')">View</button>
        <button class="btn btn-sm btn-secondary" onclick="editPO('${p.id}')">Edit</button>
        <button class="btn btn-sm btn-secondary" onclick="triggerImport('procurement')">Import</button>
      </td>
    </tr>`;
  });
  setupTableFilter('procurement-filter-input','procurement-table-body');
  renderProcurementChart();
}

function renderProcurementChart() {
  const ctx=document.getElementById('procurement-chart'); if(!ctx)return;
  if(STATE.charts.procurement) STATE.charts.procurement.destroy();
  const data=window.APP_DATA.mockProcurementData;
  STATE.charts.procurement=new Chart(ctx,{type:'doughnut',data:{labels:data.map(p=>p.id),datasets:[{data:data.map(p=>p.poValue),backgroundColor:['#3b82f6','#10b981','#f59e0b','#f43f5e','#8b5cf6','#06b6d4'],borderWidth:0}]},options:{...chartDefaults(),cutout:'65%',plugins:{legend:{position:'right',labels:{color:'#8a9bb8',font:{size:10}}}}}});
}

function viewPO(id) {
  const p=window.APP_DATA.mockProcurementData.find(x=>x.id===id); if(!p)return;
  openModal('Purchase Order Details','',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('PO No.',p.id)}${inf('Description',p.item)}
      ${inf('Vendor',p.vendor)}${inf('Value',formatCurrency(p.poValue))}
      ${inf('Status',statusBadge(p.status))}${inf('Delivery Date',p.deliveryDate)}
      ${inf('Payment Status',p.payStatus)}${inf('Performance',p.performance?p.performance+'%':'—')}
    </div>
    <div style="margin-top:14px">${inf('Remarks',p.remarks||'—')}</div>`);
}

function editPO(id) {
  const p=window.APP_DATA.mockProcurementData.find(x=>x.id===id); if(!p)return;
  openModal('Edit Purchase Order','',`
    <div class="form-group"><label class="form-label">Description: ${p.item}</label></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="ep-status">${['pending','active','partially-delivered','delivered'].map(s=>`<option value="${s}"${s===p.status?' selected':''}>${capitalize(s)}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Performance %</label><input class="form-control" id="ep-perf" type="number" min="0" max="100" value="${p.performance}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Delivery Date</label><input class="form-control" id="ep-deldate" type="date" value="${p.deliveryDate}"></div>
      <div class="form-group"><label class="form-label">Payment Status</label><input class="form-control" id="ep-pay" value="${p.payStatus}"></div>
    </div>
    <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="ep-remarks" rows="2">${p.remarks||''}</textarea></div>`,
  ()=>{
    p.status=document.getElementById('ep-status').value;
    p.performance=parseInt(document.getElementById('ep-perf').value)||0;
    p.deliveryDate=document.getElementById('ep-deldate').value;
    p.payStatus=document.getElementById('ep-pay').value;
    p.remarks=document.getElementById('ep-remarks').value;
    renderProcurement(); showToast('Updated',`${p.id} updated`,'success');
  });
}

function openAddPOModal() {
  openModal('Add Purchase Order','',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">PO No.</label><input class="form-control" id="np-id" placeholder="PO-006"></div>
      <div class="form-group"><label class="form-label">PO Value (SAR)</label><input class="form-control" id="np-value" type="number" placeholder="1000000"></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><input class="form-control" id="np-item" placeholder="Item description"></div>
    <div class="form-group"><label class="form-label">Vendor</label><input class="form-control" id="np-vendor" placeholder="Vendor name"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">PO Date</label><input class="form-control" id="np-podate" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label class="form-label">Delivery Date</label><input class="form-control" id="np-deldate" type="date"></div>
    </div>
    <div class="form-group"><label class="form-label">Status</label>
      <select class="form-control" id="np-status"><option value="pending">Pending</option><option value="active">Active</option><option value="partially-delivered">Partially Delivered</option><option value="delivered">Delivered</option></select>
    </div>
    <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="np-remarks" rows="2"></textarea></div>`,
  ()=>{
    const id=document.getElementById('np-id').value||('PO-0'+String(window.APP_DATA.mockProcurementData.length+1).padStart(2,'0'));
    window.APP_DATA.mockProcurementData.unshift({
      id, item: document.getElementById('np-item').value || 'New PO',
      vendor: document.getElementById('np-vendor').value,
      poValue: parseFloat(document.getElementById('np-value').value) || 0,
      status: document.getElementById('np-status').value,
      poDate: document.getElementById('np-podate').value,
      deliveryDate: document.getElementById('np-deldate').value,
      payStatus: '0% paid',
      performance: 0,
      remarks: document.getElementById('np-remarks').value
    });
    renderProcurement(); showToast('Added',`${id} added to Procurement`,'success');
  });
}

function printProcurementPDF() {
  const data=window.APP_DATA.mockProcurementData;
  const total=data.reduce((a,p)=>a+p.poValue,0);
  generatePDF({ title:'PROCUREMENT TRACKER', subtitle:'Purchase Orders, Delivery & Vendor Performance', module:'PO',
    kpis:[{label:'Total PO Value',value:formatMillions(total),color:'#1d4ed8'},{label:'Active POs',value:data.filter(d=>d.status==='active').length,color:'#059669'},{label:'Pending Delivery',value:data.filter(d=>d.status==='pending').length,color:'#f59e0b'},{label:'Avg Performance',value:(data.filter(d=>d.performance>0).reduce((a,d)=>a+d.performance,0)/data.filter(d=>d.performance>0).length||0).toFixed(0)+'%',color:'#7c3aed'}],
    tableHeaders:['PO No.','Description','Vendor','PO Value','Status','Delivery Date','Payment','Performance','Remarks'],
    tableRows:data.map(p=>[p.id,p.item,p.vendor,formatCurrency(p.poValue),pdfBadge(p.status),p.deliveryDate,p.payStatus,p.performance?p.performance+'%':'—',p.remarks||'—']),
  });
}

// ── PROGRESS ──────────────────────────────────────────────────
function renderProgress() {
  const KPIs=window.APP_DATA.computeKPIs();
  renderRegisterStats('progress-stats',[{label:'Overall Progress',value:KPIs.overallProgress+'%',color:'blue'},{label:'Schedule Variance',value:KPIs.scheduleVariance+'%',color:'amber'},{label:'Milestones Complete',value:window.APP_DATA.mockProgressData.milestones.filter(m=>m.status==='completed').length,color:'emerald'},{label:'At Risk',value:window.APP_DATA.mockProgressData.milestones.filter(m=>m.status==='at-risk').length,color:'rose'}]);
  renderMilestoneList(); renderFullSCurve(); renderDisciplineProgressBars();
}

function renderFullSCurve() {
  const ctx=document.getElementById('progress-scurve-chart'); if(!ctx)return;
  if(STATE.charts.progressScurve) STATE.charts.progressScurve.destroy();
  const d=window.APP_DATA.mockProgressData.sCurveData;
  // Use same options as dashboard for consistency
  STATE.charts.progressScurve=new Chart(ctx,{type:'line',data:{labels:d.map(x=>x.month),datasets:[{label:'Planned %',data:d.map(x=>x.planned),borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,0.1)',borderWidth:2.5,pointRadius:4,tension:0.4,fill:true},{label:'Actual %',data:d.map(x=>x.actual),borderColor:'#10b981',backgroundColor:'rgba(16,185,129,0.08)',borderWidth:2.5,pointRadius:4,tension:0.4,fill:true,spanGaps:false}]},options:chartDefaults({scales:{y:{max:60,ticks:{callback:v=>v+'%'}}}})});
}

function renderDisciplineProgressBars() {
  const c=document.getElementById('discipline-progress-list'); if(!c)return;
  c.innerHTML=window.APP_DATA.mockProgressData.disciplineProgress.map(d=>`
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:13px;font-weight:600">${d.name}</span>
        <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text-muted)">${d.progress}% / ${d.planned}% planned</span>
      </div>
      <div class="progress-bar"><div class="progress-fill ${d.progress<d.planned*0.85?'amber':''}" style="width:${d.progress}%"></div></div>
    </div>`).join('');
}

function openUpdateProgressModal() {
  const data = window.APP_DATA.mockProgressData;
  const milestonesHTML = data.milestones.map((m, i) => `
    <div class="form-row" style="margin-bottom:8px">
      <div class="form-group"><label>${m.name}</label><input class="form-control" id="ms-${i}" type="date" value="${m.actual || ''}" placeholder="Actual date"></div>
      <div class="form-group"><label>Status</label>
        <select class="form-control" id="ms-status-${i}">
          <option value="completed" ${m.status==='completed'?'selected':''}>Completed</option>
          <option value="on-track" ${m.status==='on-track'?'selected':''}>On Track</option>
          <option value="at-risk" ${m.status==='at-risk'?'selected':''}>At Risk</option>
          <option value="delayed" ${m.status==='delayed'?'selected':''}>Delayed</option>
        </select>
      </div>
    </div>`).join('');
  const disciplinesHTML = data.disciplineProgress.map((d, i) => `
    <div class="form-row" style="margin-bottom:8px">
      <div class="form-group"><label>${d.name} Progress %</label><input class="form-control" id="disc-${i}" type="number" min="0" max="100" value="${d.progress}"></div>
    </div>`).join('');
  openModal('Update Progress', '', `
    <h3>Milestones</h3>
    ${milestonesHTML}
    <h3>Discipline Progress</h3>
    ${disciplinesHTML}
    `, () => {
      data.milestones.forEach((m, i) => {
        const actualInput = document.getElementById(`ms-${i}`);
        if (actualInput) m.actual = actualInput.value || '';
        const statusSelect = document.getElementById(`ms-status-${i}`);
        if (statusSelect) m.status = statusSelect.value;
        if (m.actual && m.planned) {
          const planned = new Date(m.planned);
          const actual = new Date(m.actual);
          m.delay = Math.round((actual - planned) / (1000*60*60*24));
        } else {
          m.delay = 0;
        }
      });
      data.disciplineProgress.forEach((d, i) => {
        const input = document.getElementById(`disc-${i}`);
        if (input) d.progress = parseInt(input.value) || 0;
      });
      renderProgress();
      renderDashboard();
      showToast('Progress Updated', 'All progress values have been refreshed', 'success');
    });
}

async function printProgressPDF() {
  const D=window.APP_DATA, KPIs=D.computeKPIs();
  const scurveCanvas = document.getElementById('progress-scurve-chart');
  const charts = scurveCanvas ? [{ data: scurveCanvas.toDataURL('image/png') }] : [];
  generatePDF({ title:'WEEKLY PROGRESS REPORT', subtitle:'S-Curve, Milestone Tracking & Discipline Progress', module:'WPR',
    kpis:[{label:'Overall Progress',value:KPIs.overallProgress+'%',color:'#1d4ed8'},{label:'Schedule Variance',value:KPIs.scheduleVariance+'%',color:'#f59e0b'},{label:'Active Workers',value:KPIs.activeWorkers,color:'#059669'},{label:'Cost Variance',value:(KPIs.costVariance>0?'+':'')+KPIs.costVariance+'%',color:'#dc2626'}],
    tableHeaders:['Milestone','Planned Date','Actual Date','Status','Delay (days)'],
    tableRows:D.mockProgressData.milestones.map(m=>[m.name,m.planned,m.actual||'—',pdfBadge(m.status),m.delay>0?'+'+m.delay+'d':'On time']),
    extraHTML:`<div class="sec-title" style="font-family:'Barlow Condensed',Arial;font-size:13pt;font-weight:800;color:#1e3a5f;border-left:4px solid #f59e0b;padding-left:10px;margin:12px 0 8px;text-transform:uppercase">Discipline Progress</div>${D.mockProgressData.disciplineProgress.map(d=>`<div style="margin-bottom:8px;display:flex;align-items:center;gap:12px"><span style="width:120px;font-size:9pt;font-weight:600">${d.name}</span><div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden"><div style="height:100%;width:${d.progress}%;background:#1d4ed8"></div></div><span style="width:80px;text-align:right;font-size:9pt;font-family:monospace">${d.progress}% / ${d.planned}%</span></div>`).join('')}`,
    charts: charts
  });
}

// ── HSE ───────────────────────────────────────────────────────
function renderHSE() {
  const {incidents,stats}=window.APP_DATA.mockHSEData;
  renderRegisterStats('hse-stats',[{label:'Safe Man Hours',value:(stats.safeManHours/1000).toFixed(0)+'K',color:'emerald'},{label:'LTIR',value:stats.ltir,color:'amber'},{label:'Near Misses',value:stats.nearMiss,color:'rose'},{label:'Toolbox Talks',value:stats.toolboxTalks,color:'blue'}]);
  renderTable('hse-table-body',incidents,i=>`
    <tr>
      <td class="td-mono">${i.id}</td>
      <td><span class="badge badge-${i.type==='incident'?'rejected':'pending'}">${i.type.replace('-',' ')}</span></td>
      <td style="color:var(--text-primary);font-size:12px">${i.desc}</td>
      <td class="td-mono">${i.date}</td>
      <td>${severityBadge(i.severity)}</td>
      <td><span class="badge badge-${i.status}">${i.status.toUpperCase()}</span></td>
      <td class="td-mono">${i.casualties}</td>
      <td style="font-size:11px;color:var(--text-secondary)">${i.location||'—'}</td>
      <td style="font-size:11px;color:var(--text-secondary)">${i.correctiveAction||'—'}</td>
      <td>
        <a class="drive-link" href="${window.APP_DATA.LOCAL_DRIVE.hse||'file:///C:/CI-Platform/HSE/'}${encodeURIComponent(i.id+'.pdf')}" target="_blank">Open</a>
        <button class="btn btn-sm btn-secondary" onclick="viewHSE('${i.id}')">View</button>
        <button class="btn btn-sm btn-secondary" onclick="editHSE('${i.id}')">Edit</button>
        ${i.status==='open'?`<button class="btn btn-sm btn-success" onclick="closeHSE('${i.id}')">Close</button>`:''}
        <button class="btn btn-sm btn-secondary" onclick="triggerImport('hse')">Import</button>
      </td>
    </tr>`);
  renderHSEChart();
}

function renderHSEChart() {
  const ctx=document.getElementById('hse-chart'); if(!ctx)return;
  if(STATE.charts.hse) STATE.charts.hse.destroy();
  STATE.charts.hse=new Chart(ctx,{type:'doughnut',data:{labels:['Near Miss','Incident','LTI'],datasets:[{data:[15,3,1],backgroundColor:['#f59e0b','#f43f5e','#8b5cf6'],borderWidth:0}]},options:{...chartDefaults(),cutout:'60%',plugins:{legend:{labels:{color:'#8a9bb8',font:{size:11}}}}}});
}

function openAddHSEModal() {
  openModal('Log HSE Incident / Near Miss','',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Type</label>
        <select class="form-control" id="nh-type"><option value="near-miss">Near Miss</option><option value="incident">Incident</option><option value="dangerous-occurrence">Dangerous Occurrence</option></select>
      </div>
      <div class="form-group"><label class="form-label">Severity</label>
        <select class="form-control" id="nh-sev"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="nh-desc" rows="2" placeholder="Describe what happened"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="nh-loc" placeholder="Location on site"></div>
      <div class="form-group"><label class="form-label">Casualties</label><input class="form-control" id="nh-cas" type="number" value="0" min="0"></div>
    </div>
    <div class="form-group"><label class="form-label">Root Cause</label><input class="form-control" id="nh-root" placeholder="Root cause analysis"></div>
    <div class="form-group"><label class="form-label">Corrective Action</label><textarea class="form-control" id="nh-action" rows="2" placeholder="Corrective actions taken"></textarea></div>`,
  ()=>{
    const id='HSE-0'+String(window.APP_DATA.mockHSEData.incidents.length+1).padStart(2,'0');
    window.APP_DATA.mockHSEData.incidents.unshift({id,type:document.getElementById('nh-type').value,desc:document.getElementById('nh-desc').value||'HSE Event',date:new Date().toISOString().split('T')[0],severity:document.getElementById('nh-sev').value,status:'open',casualties:parseInt(document.getElementById('nh-cas').value)||0,location:document.getElementById('nh-loc').value,rootCause:document.getElementById('nh-root').value,correctiveAction:document.getElementById('nh-action').value,investigator:'U001'});
    renderHSE(); showToast('Logged',`${id} has been logged`,'warning');
  });
}

function closeHSE(id) { const i=window.APP_DATA.mockHSEData.incidents.find(x=>x.id===id); if(i){i.status='closed';renderHSE();showToast('Closed',`${id} closed`,'success');} }
function viewHSE(id) {
  const i=window.APP_DATA.mockHSEData.incidents.find(x=>x.id===id); if(!i)return;
  openModal('HSE Incident Detail','',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('ID',i.id)}${inf('Type',i.type)}
      ${inf('Date',i.date)}${inf('Location',i.location||'—')}
      ${inf('Severity',severityBadge(i.severity))}${inf('Status','<span class="badge badge-'+i.status+'">'+i.status.toUpperCase()+'</span>')}
      ${inf('Casualties',i.casualties)}${inf('Investigator',i.investigator||'—')}
    </div>
    <div style="margin-top:14px">${inf('Description',i.desc)}</div>
    <div style="margin-top:10px">${inf('Root Cause',i.rootCause||'—')}</div>
    <div style="margin-top:10px">${inf('Corrective Action',i.correctiveAction||'—')}</div>`);
}

function editHSE(id) {
  const i=window.APP_DATA.mockHSEData.incidents.find(x=>x.id===id); if(!i)return;
  openModal('Edit HSE Incident','',`
    <div class="form-group"><label class="form-label">Incident: ${i.id}</label></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Severity</label>
        <select class="form-control" id="eh-sev"><option value="low"${i.severity==='low'?' selected':''}>Low</option><option value="medium"${i.severity==='medium'?' selected':''}>Medium</option><option value="high"${i.severity==='high'?' selected':''}>High</option><option value="critical"${i.severity==='critical'?' selected':''}>Critical</option></select>
      </div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="eh-status"><option value="open"${i.status==='open'?' selected':''}>Open</option><option value="closed"${i.status==='closed'?' selected':''}>Closed</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="eh-loc" value="${i.location||''}"></div>
      <div class="form-group"><label class="form-label">Casualties</label><input class="form-control" id="eh-cas" type="number" value="${i.casualties||0}"></div>
    </div>
    <div class="form-group"><label class="form-label">Root Cause</label><input class="form-control" id="eh-root" value="${i.rootCause||''}"></div>
    <div class="form-group"><label class="form-label">Corrective Action</label><textarea class="form-control" id="eh-action" rows="2">${i.correctiveAction||''}</textarea></div>`,
  ()=>{
    i.severity=document.getElementById('eh-sev').value;
    i.status=document.getElementById('eh-status').value;
    i.location=document.getElementById('eh-loc').value;
    i.casualties=parseInt(document.getElementById('eh-cas').value)||0;
    i.rootCause=document.getElementById('eh-root').value;
    i.correctiveAction=document.getElementById('eh-action').value;
    renderHSE(); showToast('Updated',`${id} updated`,'success');
  });
}

function printHSEPDF() {
  const D=window.APP_DATA, {incidents,stats}=D.mockHSEData;
  generatePDF({ title:'HSE REGISTER', subtitle:'Safety Incidents, Near Misses & Performance Statistics', module:'HSE',
    kpis:[{label:'Safe Man Hours',value:(stats.safeManHours/1000).toFixed(0)+'K',color:'#059669'},{label:'LTIR',value:stats.ltir,color:'#f59e0b'},{label:'Near Misses (YTD)',value:stats.nearMiss,color:'#dc2626'},{label:'Toolbox Talks',value:stats.toolboxTalks,color:'#1d4ed8'}],
    tableHeaders:['ID','Type','Description','Date','Severity','Status','Casualties','Location','Corrective Action'],
    tableRows:incidents.map(i=>[i.id,i.type.replace('-',' ').toUpperCase(),i.desc,i.date,i.severity.toUpperCase(),pdfBadge(i.status),i.casualties,i.location||'—',i.correctiveAction||'—']),
  });
}

// ── SUBCONTRACTORS ────────────────────────────────────────────
function renderSubcontractors() {
  const data=window.APP_DATA.mockSubcontractorData;
  const totalContract=data.reduce((a,s)=>a+s.contractValue,0);
  const totalPaid=data.reduce((a,s)=>a+s.paidToDate,0);
  renderRegisterStats('sub-stats',[{label:'Active Subcontractors',value:data.filter(s=>s.status==='active').length,color:'blue'},{label:'Total Contract',value:formatMillions(totalContract),color:'violet'},{label:'Total Paid',value:formatMillions(totalPaid),color:'emerald'},{label:'Active Workers',value:data.reduce((a,s)=>a+s.workers,0),color:'cyan'}]);
  renderTable('sub-table-body',data,s=>{
    const pc=s.performance>=90?'var(--accent-emerald)':s.performance>=75?'var(--accent-amber)':s.performance>0?'var(--accent-rose)':'var(--text-muted)';
    return `<tr>
      <td class="td-mono">${s.id}</td>
      <td style="font-weight:600;color:var(--text-primary)">${s.name}</td>
      <td style="font-size:12px;color:var(--text-secondary)">${s.scope}</td>
      <td class="td-mono" style="color:var(--accent-amber)">${s.poRef||'—'}</td>
      <td><span class="badge badge-${s.status}">${s.status}</span></td>
      <td class="td-mono">${s.workers||'—'}</td>
      <td class="td-mono">${formatCurrency(s.contractValue)}</td>
      <td class="td-mono">${formatCurrency(s.paidToDate)}</td>
      <td><div style="display:flex;align-items:center;gap:6px"><div style="width:50px;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden"><div style="height:100%;width:${s.performance}%;background:${pc}"></div></div><span style="font-family:'DM Mono',monospace;font-size:11px;color:${pc}">${s.performance||'—'}${s.performance?'%':''}</span></div></td>
      <td>
        <a class="drive-link" href="${window.APP_DATA.LOCAL_DRIVE.subcontractors||'file:///C:/CI-Platform/Subcontractors/'}${encodeURIComponent(s.id+'.pdf')}" target="_blank">Open</a>
        <button class="btn btn-sm btn-secondary" onclick="viewSub('${s.id}')">View</button>
        <button class="btn btn-sm btn-secondary" onclick="editSub('${s.id}')">Edit</button>
        <button class="btn btn-sm btn-secondary" onclick="triggerImport('subcontractors')">Import</button>
      </td>
    </tr>`;
  });
}

function viewSub(id) {
  const s=window.APP_DATA.mockSubcontractorData.find(x=>x.id===id); if(!s)return;
  openModal('Subcontractor Profile','',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('ID',s.id)}${inf('Company Name',s.name)}
      ${inf('Scope',s.scope)}${inf('PO Reference','<span style="color:var(--accent-amber);font-family:DM Mono,monospace">'+s.poRef+'</span>')}
      ${inf('Status',statusBadge(s.status))}${inf('Workers On Site',s.workers||'—')}
      ${inf('Contract Value',formatCurrency(s.contractValue))}${inf('Paid to Date',formatCurrency(s.paidToDate))}
      ${inf('Contact Person',s.contactPerson||'—')}${inf('Phone',s.phone||'—')}
      ${inf('Start Date',s.startDate||'—')}${inf('End Date',s.endDate||'—')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px">
      <div style="text-align:center;padding:14px;background:var(--bg-surface);border-radius:8px"><div style="font-family:'Barlow Condensed',sans-serif;font-size:32px;font-weight:800;color:var(--accent-blue)">${s.performance||'N/A'}${s.performance?'%':''}</div><div style="font-size:11px;color:var(--text-muted)">Performance Score</div></div>
      <div style="text-align:center;padding:14px;background:var(--bg-surface);border-radius:8px"><div style="font-family:'Barlow Condensed',sans-serif;font-size:32px;font-weight:800;color:var(--accent-emerald)">${s.safety||'N/A'}${s.safety?'%':''}</div><div style="font-size:11px;color:var(--text-muted)">Safety Score</div></div>
    </div>`);
}

function editSub(id) {
  const s=window.APP_DATA.mockSubcontractorData.find(x=>x.id===id); if(!s)return;
  openModal('Edit Subcontractor','',`
    <div class="form-group"><label class="form-label">Company: ${s.name}</label></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="es-status">
          <option value="not-started" ${s.status==='not-started'?'selected':''}>Not Started</option>
          <option value="mobilizing" ${s.status==='mobilizing'?'selected':''}>Mobilizing</option>
          <option value="active" ${s.status==='active'?'selected':''}>Active</option>
          <option value="completed" ${s.status==='completed'?'selected':''}>Completed</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Workers</label><input class="form-control" id="es-workers" type="number" value="${s.workers}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Paid to Date (SAR)</label><input class="form-control" id="es-paid" type="number" value="${s.paidToDate}"></div>
      <div class="form-group"><label class="form-label">Performance %</label><input class="form-control" id="es-perf" type="number" min="0" max="100" value="${s.performance}"></div>
    </div>
    <div class="form-group"><label class="form-label">Contact Person</label><input class="form-control" id="es-contact" value="${s.contactPerson||''}"></div>
    <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="es-phone" value="${s.phone||''}"></div>`,
  ()=>{
    s.status=document.getElementById('es-status').value;
    s.workers=parseInt(document.getElementById('es-workers').value)||0;
    s.paidToDate=parseFloat(document.getElementById('es-paid').value)||0;
    s.performance=parseInt(document.getElementById('es-perf').value)||0;
    s.contactPerson=document.getElementById('es-contact').value;
    s.phone=document.getElementById('es-phone').value;
    renderSubcontractors(); showToast('Updated',`${s.id} updated`,'success');
  });
}

function openAddSubModal() {
  openModal('Add Subcontractor','',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">ID</label><input class="form-control" id="ns-id" placeholder="SC-007"></div>
      <div class="form-group"><label class="form-label">PO Reference</label><input class="form-control" id="ns-po" placeholder="PO-009"></div>
    </div>
    <div class="form-group"><label class="form-label">Company Name</label><input class="form-control" id="ns-name" placeholder="Subcontractor company name"></div>
    <div class="form-group"><label class="form-label">Scope of Work</label><input class="form-control" id="ns-scope" placeholder="e.g. MEP Mechanical Works"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Contract Value (SAR)</label><input class="form-control" id="ns-val" type="number" placeholder="1000000"></div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="ns-status"><option value="not-started">Not Started</option><option value="mobilizing">Mobilizing</option><option value="active">Active</option><option value="completed">Completed</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Contact Person</label><input class="form-control" id="ns-contact" placeholder="Name"></div>
      <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="ns-phone" placeholder="+1-555-0100"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Start Date</label><input class="form-control" id="ns-start" type="date"></div>
      <div class="form-group"><label class="form-label">End Date</label><input class="form-control" id="ns-end" type="date"></div>
    </div>`,
  ()=>{
    const id=document.getElementById('ns-id').value||('SC-0'+String(window.APP_DATA.mockSubcontractorData.length+1).padStart(2,'0'));
    window.APP_DATA.mockSubcontractorData.unshift({id,name:document.getElementById('ns-name').value||'New Subcontractor',scope:document.getElementById('ns-scope').value,status:document.getElementById('ns-status').value,workers:0,contractValue:parseFloat(document.getElementById('ns-val').value)||0,paidToDate:0,performance:0,safety:0,poRef:document.getElementById('ns-po').value,contactPerson:document.getElementById('ns-contact').value,phone:document.getElementById('ns-phone').value,startDate:document.getElementById('ns-start').value,endDate:document.getElementById('ns-end').value});
    renderSubcontractors(); showToast('Added',`${id} added to Subcontractor Register`,'success');
  });
}

function printSubPDF() {
  const data=window.APP_DATA.mockSubcontractorData;
  const totalContract=data.reduce((a,s)=>a+s.contractValue,0);
  generatePDF({ title:'SUBCONTRACTOR REGISTER', subtitle:'Scope, Payments, Performance & PO References', module:'SUB',
    kpis:[{label:'Active Subcontractors',value:data.filter(d=>d.status==='active').length,color:'#1d4ed8'},{label:'Total Contract Value',value:formatMillions(totalContract),color:'#7c3aed'},{label:'Total Workers',value:data.reduce((a,s)=>a+s.workers,0),color:'#059669'},{label:'Mobilizing',value:data.filter(d=>d.status==='mobilizing').length,color:'#f59e0b'}],
    tableHeaders:['ID','Company','Scope','PO Ref','Status','Workers','Contract Value','Paid to Date','Performance'],
    tableRows:data.map(s=>[s.id,s.name,s.scope,s.poRef||'—',s.status.toUpperCase(),formatCurrency(s.contractValue),formatCurrency(s.paidToDate),s.performance?s.performance+'%':'—']),
  });
}

// ── COST ─────────────────────────────────────────────────────
function renderCost() {
  const D=window.APP_DATA.mockCostData;
  renderRegisterStats('cost-stats',[{label:'Revised Budget',value:formatMillions(D.revisedBudget),color:'blue'},{label:'Actual Cost',value:formatMillions(D.actualCost),color:'emerald'},{label:'Forecast Final',value:formatMillions(D.forecastFinalCost),color:'amber'},{label:'Cost Variance',value:formatMillions(D.costVariance),color:'rose'}]);
  renderTable('cost-table-body',D.categories,c=>{
    const fv=c.forecast-c.budget, vc=fv>0?'var(--accent-rose)':'var(--accent-emerald)';
    return `<tr>
      <td style="font-weight:600;color:var(--text-primary)">${c.name}</td>
      <td class="td-mono">${formatCurrency(c.budget)}</td>
      <td class="td-mono">${formatCurrency(c.committed)}</td>
      <td class="td-mono">${formatCurrency(c.actual)}</td>
      <td class="td-mono">${formatCurrency(c.forecast)}</td>
      <td class="td-mono" style="color:${vc}">${fv>0?'+':''}${formatCurrency(fv)}</td>
      <td><div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100,(c.actual/c.budget*100)).toFixed(0)}%"></div></div></td>
      <td>
        <a class="drive-link" href="${window.APP_DATA.LOCAL_DRIVE.cost||'file:///C:/CI-Platform/Cost/'}${encodeURIComponent(c.name.replace(/\s+/g,'-')+'.pdf')}" target="_blank">Open</a>
        <button class="btn btn-sm btn-secondary" onclick="viewCostCategory('${c.name}')">View</button>
        <button class="btn btn-sm btn-secondary" onclick="editCostCategory('${c.name}')">Edit</button>
        <button class="btn btn-sm btn-secondary" onclick="triggerImport('cost')">Import</button>
      </td>
    </tr>`;
  });
  renderCostChart();
}

function renderCostChart() {
  const ctx=document.getElementById('cost-chart'); if(!ctx)return;
  if(STATE.charts.cost) STATE.charts.cost.destroy();
  const cats=window.APP_DATA.mockCostData.categories;
  STATE.charts.cost=new Chart(ctx,{type:'bar',data:{labels:cats.map(c=>c.name.length>12?c.name.substring(0,12)+'…':c.name),datasets:[{label:'Budget',data:cats.map(c=>+(c.budget/1e6).toFixed(2)),backgroundColor:'rgba(59,130,246,0.3)',borderColor:'#3b82f6',borderWidth:1,borderRadius:4},{label:'Forecast',data:cats.map(c=>+(c.forecast/1e6).toFixed(2)),backgroundColor:'rgba(244,63,94,0.5)',borderColor:'#f43f5e',borderWidth:1,borderRadius:4},{label:'Actual',data:cats.map(c=>+(c.actual/1e6).toFixed(2)),backgroundColor:'rgba(16,185,129,0.7)',borderColor:'#10b981',borderWidth:1,borderRadius:4}]},options:chartDefaults({scales:{y:{ticks:{callback:v=>'SAR '+v+'M'}}}})});
}

function viewCostCategory(name) {
  const c=window.APP_DATA.mockCostData.categories.find(x=>x.name===name); if(!c)return;
  const fv=c.forecast-c.budget;
  openModal('Cost Category Details','',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('Category',c.name)}${inf('Budget',formatCurrency(c.budget))}
      ${inf('Committed',formatCurrency(c.committed))}${inf('Actual Cost',formatCurrency(c.actual))}
      ${inf('Forecast Final',formatCurrency(c.forecast))}${inf('Variance',(fv>0?'+':'')+formatCurrency(fv))}
      ${inf('% Spent',(c.actual/c.budget*100).toFixed(1)+'%')}
    </div>`);
}

function editCostCategory(name) {
  const c=window.APP_DATA.mockCostData.categories.find(x=>x.name===name); if(!c)return;
  openModal('Edit Cost Category','',`
    <div class="form-group"><label class="form-label">Category: ${c.name}</label></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Budget (SAR)</label><input class="form-control" id="ec-budget" type="number" value="${c.budget}"></div>
      <div class="form-group"><label class="form-label">Committed (SAR)</label><input class="form-control" id="ec-committed" type="number" value="${c.committed}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Actual (SAR)</label><input class="form-control" id="ec-actual" type="number" value="${c.actual}"></div>
      <div class="form-group"><label class="form-label">Forecast (SAR)</label><input class="form-control" id="ec-forecast" type="number" value="${c.forecast}"></div>
    </div>`,
  ()=>{
    c.budget=parseFloat(document.getElementById('ec-budget').value)||c.budget;
    c.committed=parseFloat(document.getElementById('ec-committed').value)||c.committed;
    c.actual=parseFloat(document.getElementById('ec-actual').value)||c.actual;
    c.forecast=parseFloat(document.getElementById('ec-forecast').value)||c.forecast;
    renderCost(); showToast('Updated',`${name} updated`,'success');
  });
}

function printCostPDF() {
  const D=window.APP_DATA.mockCostData;
  generatePDF({ title:'COST CONTROL REPORT', subtitle:'Budget vs Actual vs Forecast — Full Breakdown', module:'COST',
    kpis:[{label:'Revised Budget',value:formatMillions(D.revisedBudget),color:'#1d4ed8'},{label:'Actual Cost',value:formatMillions(D.actualCost),color:'#059669'},{label:'Forecast Final',value:formatMillions(D.forecastFinalCost),color:'#f59e0b'},{label:'Cost Variance',value:formatMillions(D.costVariance),color:'#dc2626'}],
    tableHeaders:['Category','Budget','Committed','Actual','Forecast','Variance','% Spent'],
    tableRows:D.categories.map(c=>{ const fv=c.forecast-c.budget; return [c.name,formatCurrency(c.budget),formatCurrency(c.committed),formatCurrency(c.actual),formatCurrency(c.forecast),(fv>0?'+':'')+formatCurrency(fv),(c.actual/c.budget*100).toFixed(0)+'%']; }),
  });
}

// ── MANPOWER ──────────────────────────────────────────────────
function renderManpower() {
  const {today,equipment,weekly}=window.APP_DATA.mockManpowerData;
  renderRegisterStats('manpower-stats',[{label:'Total Workers Today',value:today.totalWorkers,color:'blue'},{label:'Skilled Workers',value:today.skilled,color:'emerald'},{label:'Staff',value:today.staff,color:'violet'},{label:'Equipment Active',value:equipment.filter(e=>e.status==='active').length,color:'cyan'}]);
  renderTable('manpower-table-body',weekly,w=>`
    <tr>
      <td class="td-mono">${w.week}</td>
      <td class="td-mono">${w.target}</td>
      <td class="td-mono">${w.actual??'—'}</td>
      <td class="td-mono">${w.skilled??'—'}</td>
      <td class="td-mono">${w.unskilled??'—'}</td>
      <td class="td-mono">${w.staff??'—'}</td>
      <td>${w.actual?`<div class="progress-bar"><div class="progress-fill ${w.actual<w.target*0.9?'amber':''}" style="width:${Math.min(100,w.actual/w.target*100).toFixed(0)}%"></div></div>`:'—'}</td>
      <td>${w.actual?`<span style="font-family:'DM Mono',monospace;font-size:11px;color:${w.actual>=w.target*0.95?'var(--accent-emerald)':'var(--accent-amber)'}">${(w.actual/w.target*100).toFixed(0)}%</span>`:'—'}</td>
      <td>
        <a class="drive-link" href="${window.APP_DATA.LOCAL_DRIVE.manpower||'file:///C:/CI-Platform/Manpower/'}${encodeURIComponent(w.week.replace(/\s+/g,'-')+'.pdf')}" target="_blank">Open</a>
        <button class="btn btn-sm btn-secondary" onclick="viewManpowerWeek('${w.week}')">View</button>
        <button class="btn btn-sm btn-secondary" onclick="editManpowerWeek('${w.week}')">Edit</button>
        <button class="btn btn-sm btn-secondary" onclick="triggerImport('manpower')">Import</button>
      </td>
    </tr>`);
  const ec=document.getElementById('equipment-list');
  if(ec) ec.innerHTML=equipment.map(e=>{
    const uc=e.utilization>80?'var(--accent-emerald)':e.utilization>40?'var(--accent-amber)':e.utilization>0?'var(--accent-rose)':'var(--text-muted)';
    return `<div class="equip-item">
      <span style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${e.status==='active'?'var(--accent-emerald)':e.status==='standby'?'var(--accent-amber)':'var(--accent-rose)'}"></span>
      <div class="equip-name">${e.type}</div>
      <div class="equip-bar"><div class="equip-fill" style="width:${e.utilization}%;background:${uc}"></div></div>
      <div class="equip-pct" style="color:${uc}">${e.utilization}%</div>
      <div style="display:flex;gap:3px;margin-left:4px">
        <a class="drive-link" href="${window.APP_DATA.LOCAL_DRIVE.manpower||'file:///C:/CI-Platform/Manpower/'}${encodeURIComponent(e.type.replace(/\s+/g,'-')+'.pdf')}" target="_blank" style="font-size:10px">Open</a>
        <button class="btn btn-sm btn-secondary" style="padding:2px 6px;font-size:10px" onclick="viewEquipment('${e.type}')">View</button>
        <button class="btn btn-sm btn-secondary" style="padding:2px 6px;font-size:10px" onclick="editEquipment('${e.type}')">Edit</button>
        <button class="btn btn-sm btn-secondary" style="padding:2px 6px;font-size:10px" onclick="triggerImport('manpower')">Import</button>
      </div>
    </div>`;
  }).join('');
  renderManpowerChart();
}

function renderManpowerChart() {
  const ctx=document.getElementById('manpower-chart'); if(!ctx)return;
  if(STATE.charts.manpower) STATE.charts.manpower.destroy();
  const w=window.APP_DATA.mockManpowerData.weekly;
  STATE.charts.manpower=new Chart(ctx,{type:'bar',data:{labels:w.map(x=>x.week),datasets:[{label:'Target',data:w.map(x=>x.target),backgroundColor:'rgba(59,130,246,0.3)',borderColor:'#3b82f6',borderWidth:1,borderRadius:4},{label:'Actual',data:w.map(x=>x.actual),backgroundColor:'rgba(16,185,129,0.7)',borderColor:'#10b981',borderWidth:1,borderRadius:4}]},options:chartDefaults()});
}

function viewManpowerWeek(week) {
  const w=window.APP_DATA.mockManpowerData.weekly.find(x=>x.week===week); if(!w)return;
  openModal('Weekly Manpower Details','',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('Week',w.week)}${inf('Target Workers',w.target)}
      ${inf('Actual Workers',w.actual??'—')}${inf('Skilled',w.skilled??'—')}
      ${inf('Unskilled',w.unskilled??'—')}${inf('Staff',w.staff??'—')}
      ${inf('Achievement',w.actual?((w.actual/w.target*100).toFixed(0)+'%'):'—')}
    </div>`);
}

function editManpowerWeek(week) {
  const w=window.APP_DATA.mockManpowerData.weekly.find(x=>x.week===week); if(!w)return;
  openModal('Edit Weekly Manpower Log','',`
    <div class="form-group"><label class="form-label">Week: ${w.week}</label></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Target Workers</label><input class="form-control" id="emw-target" type="number" value="${w.target}"></div>
      <div class="form-group"><label class="form-label">Actual Workers</label><input class="form-control" id="emw-actual" type="number" value="${w.actual??''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Skilled</label><input class="form-control" id="emw-skilled" type="number" value="${w.skilled??''}"></div>
      <div class="form-group"><label class="form-label">Unskilled</label><input class="form-control" id="emw-unskilled" type="number" value="${w.unskilled??''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Staff</label><input class="form-control" id="emw-staff" type="number" value="${w.staff??''}"></div>`,
  ()=>{
    w.target=parseInt(document.getElementById('emw-target').value)||w.target;
    const a=document.getElementById('emw-actual').value; w.actual=a?parseInt(a):w.actual;
    const sk=document.getElementById('emw-skilled').value; w.skilled=sk?parseInt(sk):w.skilled;
    const un=document.getElementById('emw-unskilled').value; w.unskilled=un?parseInt(un):w.unskilled;
    const st=document.getElementById('emw-staff').value; w.staff=st?parseInt(st):w.staff;
    renderManpower(); showToast('Updated',`${week} updated`,'success');
  });
}

function viewEquipment(type) {
  const e=window.APP_DATA.mockManpowerData.equipment.find(x=>x.type===type); if(!e)return;
  openModal('Equipment Details','',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('Equipment',e.type)}${inf('Status',e.status)}
      ${inf('Utilization',e.utilization+'%')}${inf('Operator',e.operator||'—')}
      ${inf('Location',e.location||'—')}
    </div>`);
}

function editEquipment(type) {
  const e=window.APP_DATA.mockManpowerData.equipment.find(x=>x.type===type); if(!e)return;
  openModal('Edit Equipment','',`
    <div class="form-group"><label class="form-label">Equipment: ${e.type}</label></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="ee-status"><option value="active"${e.status==='active'?' selected':''}>Active</option><option value="standby"${e.status==='standby'?' selected':''}>Standby</option><option value="breakdown"${e.status==='breakdown'?' selected':''}>Breakdown</option></select>
      </div>
      <div class="form-group"><label class="form-label">Utilization %</label><input class="form-control" id="ee-util" type="number" min="0" max="100" value="${e.utilization}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Operator</label><input class="form-control" id="ee-op" value="${e.operator||''}"></div>
      <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="ee-loc" value="${e.location||''}"></div>
    </div>`,
  ()=>{
    e.status=document.getElementById('ee-status').value;
    e.utilization=parseInt(document.getElementById('ee-util').value)||0;
    e.operator=document.getElementById('ee-op').value;
    e.location=document.getElementById('ee-loc').value;
    renderManpower(); showToast('Updated',`${type} updated`,'success');
  });
}

function openAddDailyLogModal() {
  openModal('Add Daily Log','',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Date</label><input class="form-control" id="dl-date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label class="form-label">Total Workers</label><input class="form-control" id="dl-total" type="number" value="0"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Skilled</label><input class="form-control" id="dl-skilled" type="number" value="0"></div>
      <div class="form-group"><label class="form-label">Unskilled</label><input class="form-control" id="dl-unskilled" type="number" value="0"></div>
    </div>
    <div class="form-group"><label class="form-label">Staff</label><input class="form-control" id="dl-staff" type="number" value="0"></div>`,
  ()=>{
    const date = document.getElementById('dl-date').value;
    const total = parseInt(document.getElementById('dl-total').value) || 0;
    const skilled = parseInt(document.getElementById('dl-skilled').value) || 0;
    const unskilled = parseInt(document.getElementById('dl-unskilled').value) || 0;
    const staff = parseInt(document.getElementById('dl-staff').value) || 0;
    window.APP_DATA.mockManpowerData.today = { date, totalWorkers: total, skilled, unskilled, staff };
    const weekIndex = window.APP_DATA.mockManpowerData.weekly.findIndex(w => w.week.includes('Week 6'));
    if (weekIndex >= 0) {
      window.APP_DATA.mockManpowerData.weekly[weekIndex].actual = total;
      window.APP_DATA.mockManpowerData.weekly[weekIndex].skilled = skilled;
      window.APP_DATA.mockManpowerData.weekly[weekIndex].unskilled = unskilled;
      window.APP_DATA.mockManpowerData.weekly[weekIndex].staff = staff;
    }
    renderManpower(); showToast('Daily Log Added', 'Manpower data updated', 'success');
  });
}

function printManpowerPDF() {
  const {today,weekly,equipment}=window.APP_DATA.mockManpowerData;
  generatePDF({ title:'MANPOWER & EQUIPMENT REPORT', subtitle:'Daily Log, Weekly Targets & Equipment Utilization', module:'MP',
    kpis:[{label:'Total Workers Today',value:today.totalWorkers,color:'#1d4ed8'},{label:'Skilled',value:today.skilled,color:'#059669'},{label:'Unskilled',value:today.unskilled,color:'#f59e0b'},{label:'Staff',value:today.staff,color:'#7c3aed'}],
    tableHeaders:['Week','Target Workers','Actual Workers','Skilled','Unskilled','Staff','Achievement %'],
    tableRows:weekly.map(w=>[w.week,w.target,w.actual??'—',w.skilled??'—',w.unskilled??'—',w.staff??'—',w.actual?(w.actual/w.target*100).toFixed(0)+'%':'—']),
    extraHTML:`<br><table style="width:100%;border-collapse:collapse;font-size:8.5pt"><thead><tr><th style="background:#1e3a5f;color:#fff;padding:7px 9px;text-align:left;font-size:8pt;text-transform:uppercase">Equipment</th><th style="background:#1e3a5f;color:#fff;padding:7px 9px;text-align:left;font-size:8pt">Status</th><th style="background:#1e3a5f;color:#fff;padding:7px 9px;text-align:left;font-size:8pt">Utilization</th><th style="background:#1e3a5f;color:#fff;padding:7px 9px;text-align:left;font-size:8pt">Operator</th><th style="background:#1e3a5f;color:#fff;padding:7px 9px;text-align:left;font-size:8pt">Location</th></tr></thead><tbody>${equipment.map((e,i)=>`<tr style="background:${i%2===0?'#f8f9fa':'#fff'}"><td style="padding:6px 9px;border-bottom:1px solid #e9ecef">${e.type}</td><td style="padding:6px 9px;border-bottom:1px solid #e9ecef">${e.status.toUpperCase()}</td><td style="padding:6px 9px;border-bottom:1px solid #e9ecef">${e.utilization}%</td><td style="padding:6px 9px;border-bottom:1px solid #e9ecef">${e.operator}</td><td style="padding:6px 9px;border-bottom:1px solid #e9ecef">${e.location||'—'}</td></tr>`).join('')}</tbody></table>`,
  });
}

// ── CLOSEOUT ──────────────────────────────────────────────────
function renderCloseout() {
  const data=window.APP_DATA.mockCloseoutData;
  renderRegisterStats('closeout-stats',[{label:'Total Items',value:data.length,color:'blue'},{label:'In Progress',value:data.filter(c=>c.status==='in-progress').length,color:'amber'},{label:'Not Started',value:data.filter(c=>c.status==='not-started').length,color:'rose'},{label:'Complete',value:data.filter(c=>c.status==='complete').length,color:'emerald'}]);
  renderTable('closeout-table-body',data,c=>`
    <tr>
      <td class="td-mono">${c.id}</td>
      <td style="font-weight:600;color:var(--text-primary)">${c.item}</td>
      <td><span class="tag">${c.category||'—'}</span></td>
      <td><span class="badge badge-${c.status==='in-progress'?'pending':c.status==='complete'?'approved':'draft'}">${c.status.replace('-',' ')}</span></td>
      <td class="td-mono">${c.due}</td>
      <td class="td-mono">${c.assignedTo}</td>
      <td style="font-size:11px;color:var(--text-secondary)">${c.remarks||'—'}</td>
      <td>
        <a class="drive-link" href="${window.APP_DATA.LOCAL_DRIVE.closeout||'file:///C:/CI-Platform/Closeout/'}${encodeURIComponent(c.id+'.pdf')}" target="_blank">Open</a>
        <button class="btn btn-sm btn-secondary" onclick="viewCloseout('${c.id}')">View</button>
        <button class="btn btn-sm btn-secondary" onclick="editCloseout('${c.id}')">Edit</button>
        ${c.status!=='complete'?`<button class="btn btn-sm btn-success" onclick="completeCloseout('${c.id}')">✓ Complete</button>`:'<span style="color:var(--accent-emerald);font-size:12px">✓ Done</span>'}
        <button class="btn btn-sm btn-secondary" onclick="triggerImport('closeout')">Import</button>
      </td>
    </tr>`);
}

function viewCloseout(id) {
  const c=window.APP_DATA.mockCloseoutData.find(x=>x.id===id); if(!c)return;
  openModal('Closeout Item Details','',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${inf('ID',c.id)}${inf('Item',c.item)}
      ${inf('Category',c.category||'—')}${inf('Status',statusBadge(c.status))}
      ${inf('Due Date',c.due)}${inf('Assigned To',c.assignedTo)}
    </div>
    <div style="margin-top:14px">${inf('Remarks',c.remarks||'—')}</div>`);
}

function editCloseout(id) {
  const c=window.APP_DATA.mockCloseoutData.find(x=>x.id===id); if(!c)return;
  openModal('Edit Closeout Item','',`
    <div class="form-group"><label class="form-label">Item: ${c.item}</label></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="ecl-status"><option value="not-started"${c.status==='not-started'?' selected':''}>Not Started</option><option value="in-progress"${c.status==='in-progress'?' selected':''}>In Progress</option><option value="complete"${c.status==='complete'?' selected':''}>Complete</option></select>
      </div>
      <div class="form-group"><label class="form-label">Due Date</label><input class="form-control" id="ecl-due" type="date" value="${c.due||''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Assigned To</label>
      <select class="form-control" id="ecl-assign">${window.APP_DATA.USERS.map(u=>`<option value="${u.id}"${u.id===c.assignedTo?' selected':''}>${u.name}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label class="form-label">Category</label><input class="form-control" id="ecl-cat" value="${c.category||''}"></div>
    <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="ecl-rem" rows="2">${c.remarks||''}</textarea></div>`,
  ()=>{
    c.status=document.getElementById('ecl-status').value;
    c.due=document.getElementById('ecl-due').value;
    c.assignedTo=document.getElementById('ecl-assign').value;
    c.category=document.getElementById('ecl-cat').value;
    c.remarks=document.getElementById('ecl-rem').value;
    renderCloseout(); showToast('Updated',`${id} updated`,'success');
  });
}

function completeCloseout(id) { const c=window.APP_DATA.mockCloseoutData.find(x=>x.id===id); if(c){c.status='complete';renderCloseout();showToast('Complete',`${id} marked complete`,'success');} }

function openAddCloseoutItemModal() {
  openModal('Add Closeout Item','',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">ID</label><input class="form-control" id="nc-id" placeholder="CL-009"></div>
      <div class="form-group"><label class="form-label">Category</label><input class="form-control" id="nc-cat" placeholder="Documentation"></div>
    </div>
    <div class="form-group"><label class="form-label">Item Description</label><input class="form-control" id="nc-item" placeholder="Closeout item"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Due Date</label><input class="form-control" id="nc-due" type="date"></div>
      <div class="form-group"><label class="form-label">Assigned To</label>
        <select class="form-control" id="nc-assign">${window.APP_DATA.USERS.map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Status</label>
      <select class="form-control" id="nc-status"><option value="not-started">Not Started</option><option value="in-progress">In Progress</option><option value="complete">Complete</option></select>
    </div>
    <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="nc-remarks" rows="2"></textarea></div>`,
  ()=>{
    const id=document.getElementById('nc-id').value||('CL-0'+String(window.APP_DATA.mockCloseoutData.length+1).padStart(2,'0'));
    window.APP_DATA.mockCloseoutData.unshift({
      id, item: document.getElementById('nc-item').value || 'New Closeout Item',
      category: document.getElementById('nc-cat').value,
      due: document.getElementById('nc-due').value,
      assignedTo: document.getElementById('nc-assign').value,
      status: document.getElementById('nc-status').value,
      remarks: document.getElementById('nc-remarks').value
    });
    renderCloseout(); showToast('Added',`${id} added to Closeout Register`,'success');
  });
}

function printCloseoutPDF() {
  const data=window.APP_DATA.mockCloseoutData;
  generatePDF({ title:'PROJECT CLOSEOUT REGISTER', subtitle:'Handover Documents, As-Built Drawings & O&M Manuals', module:'CLO',
    kpis:[{label:'Total Items',value:data.length,color:'#1d4ed8'},{label:'In Progress',value:data.filter(d=>d.status==='in-progress').length,color:'#f59e0b'},{label:'Not Started',value:data.filter(d=>d.status==='not-started').length,color:'#dc2626'},{label:'Complete',value:data.filter(d=>d.status==='complete').length,color:'#059669'}],
    tableHeaders:['ID','Closeout Item','Category','Status','Due Date','Assigned To','Remarks'],
    tableRows:data.map(c=>[c.id,c.item,c.category||'—',c.status.replace('-',' ').toUpperCase(),c.due,c.assignedTo,c.remarks||'—']),
  });
}

// ── PROJECT MANAGEMENT ────────────────────────────────────────
function openAddProjectModal() {
  openModal('Add New Project','',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Project ID</label><input class="form-control" id="np-id" placeholder="PRJ-003"></div>
      <div class="form-group"><label class="form-label">Project Code</label><input class="form-control" id="np-code" placeholder="ABC-2026"></div>
    </div>
    <div class="form-group"><label class="form-label">Project Name</label><input class="form-control" id="np-name" placeholder="Full project name"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Client</label><input class="form-control" id="np-client" placeholder="Client company name"></div>
      <div class="form-group"><label class="form-label">Contractor</label><input class="form-control" id="np-contractor" value="BuildCore International LLC"></div>
    </div>
    <div class="form-group"><label class="form-label">Consultant</label><input class="form-control" id="np-consultant" placeholder="Consulting firm"></div>
    <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="np-location" placeholder="Project site location"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Contract Value (SAR)</label><input class="form-control" id="np-value" type="number" placeholder="50000000"></div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="np-status"><option value="active">Active</option><option value="planned">Planned</option><option value="completed">Completed</option><option value="on-hold">On Hold</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Start Date</label><input class="form-control" id="np-start" type="date"></div>
      <div class="form-group"><label class="form-label">Planned End Date</label><input class="form-control" id="np-end" type="date"></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="np-desc" rows="2" placeholder="Brief project description"></textarea></div>`,
  ()=>{
    const proj={id:document.getElementById('np-id').value||('PRJ-0'+String(window.APP_DATA.PROJECTS.length+1).padStart(2,'0')),code:document.getElementById('np-code').value||'NEW-2026',name:document.getElementById('np-name').value||'New Project',client:document.getElementById('np-client').value,contractor:document.getElementById('np-contractor').value,consultant:document.getElementById('np-consultant').value,location:document.getElementById('np-location').value,contractValue:parseFloat(document.getElementById('np-value').value)||0,currency:'SAR',currentProgress:0,status:document.getElementById('np-status').value,startDate:document.getElementById('np-start').value,plannedEnd:document.getElementById('np-end').value,description:document.getElementById('np-desc').value};
    window.APP_DATA.PROJECTS.push(proj);
    const switcher=document.getElementById('project-switcher');
    if(switcher){ const opt=document.createElement('option'); opt.value=proj.id; opt.textContent=proj.code+' — '+proj.name.substring(0,28)+'…'; switcher.appendChild(opt); }
    renderProjects();
    showToast('Project Added',proj.name,'success');
  });
}

// ── CSV IMPORT ────────────────────────────────────────────────
function parseCSVFile(file, callback) {
  const reader=new FileReader();
  reader.onload=e=>{
    const lines=e.target.result.split('\n').filter(l=>l.trim());
    if(lines.length<2){showToast('Import Error','CSV has no data rows','error');return;}
    const headers=lines[0].split(',').map(h=>h.replace(/"/g,'').trim());
    const rows=lines.slice(1).map(line=>{ const vals=line.split(','); const obj={}; headers.forEach((h,i)=>{obj[h]=(vals[i]||'').replace(/"/g,'').trim();}); return obj; });
    callback(rows);
  };
  reader.readAsText(file);
}

function triggerImport(module) {
  const input=document.createElement('input'); input.type='file'; input.accept='.csv';
  input.onchange=e=>{
    const file=e.target.files[0]; if(!file)return;
    parseCSVFile(file,rows=>{
      if(module==='drawings') rows.forEach(r=>{if(r.id&&r.title)window.APP_DATA.mockDrawingsData.push({id:r.id,title:r.title,discipline:r.discipline||'Civil',rev:parseInt(r.rev)||1,status:r.status||'submitted',submittedBy:'U001',date:r.date||new Date().toISOString().split('T')[0],consultant:r.consultant||'',file:r.file||'',comments:r.comments||''});});
      else if(module==='materials') rows.forEach(r=>{if(r.id&&r.item)window.APP_DATA.mockMaterialsData.push({id:r.id,item:r.item,boqRef:r.boqRef||'',poNo:r.poNo||'',supplier:r.supplier||'',rev:parseInt(r.rev)||1,status:r.status||'submitted',submitDate:r.submitDate||new Date().toISOString().split('T')[0],approveDate:r.approveDate||'',deliveryDate:r.deliveryDate||'',qty:parseFloat(r.qty)||0,unit:r.unit||'',remarks:r.remarks||''});});
      renderPage(STATE.currentPage);
      showToast('CSV Imported',`${rows.length} records imported from ${file.name}`,'success');
    });
  };
  input.click();
}

// ── SHARED UTILITIES ──────────────────────────────────────────
function renderRegisterStats(cid,stats){const c=document.getElementById(cid);if(!c)return;c.innerHTML=stats.map(s=>`<div class="kpi-card ${s.color}"><div class="kpi-label">${s.label}</div><div class="kpi-value">${s.value}</div></div>`).join('');}

function renderTable(tbid,data,rowFn){const tb=document.getElementById(tbid);if(!tb)return;tb.innerHTML=data.length?data.map(rowFn).join(''):`<tr><td colspan="12" style="text-align:center;padding:32px;color:var(--text-muted)">No records found</td></tr>`;}

function setupTableFilter(inputId,tbodyId){const input=document.getElementById(inputId);if(!input)return;const ni=input.cloneNode(true);input.parentNode.replaceChild(ni,input);ni.addEventListener('input',debounce(e=>{const q=e.target.value.toLowerCase();Array.from(document.getElementById(tbodyId)?.querySelectorAll('tr')||[]).forEach(row=>{row.style.display=row.textContent.toLowerCase().includes(q)?'':'none';});},200));}

function setupSelectFilter(selId,tbodyId,colIndex){const sel=document.getElementById(selId);if(!sel)return;sel.addEventListener('change',()=>{const q=sel.value.toLowerCase();Array.from(document.getElementById(tbodyId)?.querySelectorAll('tr')||[]).forEach(row=>{const cell=row.cells[colIndex];if(!cell)return;row.style.display=!q||cell.textContent.toLowerCase().includes(q)?'':'none';});});}

function statusBadge(s){const map={'approved':'approved','submitted':'submitted','under-review':'review','rejected':'rejected','active':'active','completed':'completed','pending':'pending','passed':'approved','failed':'rejected','open':'open','closed':'closed','mobilizing':'mobilizing','not-started':'draft','partially-delivered':'pending','delivered':'completed','in-progress':'pending'};return `<span class="badge badge-${map[s]||'draft'}">${s.replace(/-/g,' ')}</span>`;}
function riskBadge(r){const m={Critical:'critical',High:'high',Medium:'medium',Low:'low'};return `<span class="badge badge-${m[r]||'low'}">${r}</span>`;}
function priorityBadge(p){return `<span class="badge badge-${p||'low'}">${(p||'low')}</span>`;}
function severityBadge(s){return `<span class="badge badge-${s||'low'}">${s||'low'}</span>`;}
function inf(label,value){return `<div><div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">${label}</div><div style="font-size:13px;color:var(--text-primary)">${value}</div></div>`;}
function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function debounce(fn,ms){let t;return function(...a){clearTimeout(t);t=setTimeout(()=>fn.apply(this,a),ms);};}

// ── MODAL ─────────────────────────────────────────────────────
function openModal(title,subtitle,content,onSave) {
  document.getElementById('modal-title').textContent=title;
  document.getElementById('modal-body').innerHTML=content;
  const saveBtn=document.getElementById('modal-save-btn');
  saveBtn.style.display=onSave?'':'none';
  saveBtn.onclick=()=>{if(onSave)onSave();closeModal();};
  document.getElementById('modal-overlay').classList.add('active');
}

function closeModal(){document.getElementById('modal-overlay').classList.remove('active');}
document.addEventListener('click',e=>{if(e.target.id==='modal-overlay')closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

// ── TOAST ─────────────────────────────────────────────────────
function showToast(title,message,type='info'){
  const c=document.getElementById('toast-container');
  const t=document.createElement('div'); t.className=`toast ${type}`;
  const icons={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
  t.innerHTML=`<span style="font-size:16px">${icons[type]||'ℹ️'}</span><div style="flex:1"><div style="font-weight:600;font-size:12.5px;color:var(--text-primary)">${title}</div><div style="font-size:11.5px;color:var(--text-secondary);margin-top:1px">${message}</div></div><button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;padding:0 0 0 4px">✕</button>`;
  c.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(100%)';t.style.transition='all 0.3s ease';setTimeout(()=>t.remove(),300);},4500);
}

// ── CHART DEFAULTS ────────────────────────────────────────────
function chartDefaults(o={}){
  const base={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8a9bb8',font:{family:"'DM Mono',monospace",size:11},boxWidth:10}},tooltip:{backgroundColor:'rgba(26,32,48,0.95)',titleColor:'#e8edf5',bodyColor:'#8a9bb8',borderColor:'rgba(255,255,255,0.08)',borderWidth:1,padding:10,titleFont:{family:"'Barlow Condensed',sans-serif",size:14,weight:'700'},bodyFont:{family:"'DM Mono',monospace",size:11}}},scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#4a5870',font:{family:"'DM Mono',monospace",size:10}}},y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#4a5870',font:{family:"'DM Mono',monospace",size:10}}}},animation:{duration:800,easing:'easeInOutQuart'}};
  if(o.scales){if(o.scales.x)Object.assign(base.scales.x,o.scales.x);if(o.scales.y)Object.assign(base.scales.y,o.scales.y);delete o.scales;}
  return {...base,...o};
}

// ── EXPOSE ────────────────────────────────────────────────────
const exp={navigateTo,openModal,closeModal,showToast,generatePDF,
  openAddProjectModal,openAddDrawingModal,openAddMaterialModal,openAddSubModal,openAddNCRModal,openAddHSEModal,
  openAddMethodModal,openAddTestModal,openAddPOModal,openAddDailyLogModal,openAddCloseoutItemModal,
  openUpdateProgressModal,openEditProjectModal,confirmDeleteProject,exportProjectsCSV,printProjectsPDF,
  editDrawingStatus,viewDrawing,editMaterial,viewMaterial,editMethod,viewMethod,editTesting,viewTest,
  viewPO,editPO,viewSub,editSub,viewHSE,editHSE,viewNCR,editNCR,viewRFI,editRFI,viewSI,editSI,viewCloseout,editCloseout,
  viewCostCategory,editCostCategory,viewManpowerWeek,editManpowerWeek,viewEquipment,editEquipment,
  closeNCR,closeRFI,closeSI,closeHSE,completeCloseout,
  setNCRTab,markNotifRead,triggerImport,
  printDashboardPDF,printDrawingsPDF,printMaterialsPDF,printMethodsPDF,
  printTestingPDF,printNCRPDF,printRFIPDF,printSIPDF,
  printProcurementPDF,printProgressPDF,printHSEPDF,
  printSubPDF,printCostPDF,printManpowerPDF,printCloseoutPDF,
  exportCurrentModule:(m)=>{const map={drawings:()=>window.APP_DATA.exportToCSV(window.APP_DATA.mockDrawingsData,'Drawing-Register'),materials:()=>window.APP_DATA.exportToCSV(window.APP_DATA.mockMaterialsData,'Material-Submittals'),methods:()=>window.APP_DATA.exportToCSV(window.APP_DATA.mockMethodsData,'Method-Statements'),ncr:()=>window.APP_DATA.exportToCSV(window.APP_DATA.mockNCRData,'NCR-Register'),rfi:()=>window.APP_DATA.exportToCSV(window.APP_DATA.mockRFIData,'RFI-Register'),si:()=>window.APP_DATA.exportToCSV(window.APP_DATA.mockSIData,'SI-Register'),procurement:()=>window.APP_DATA.exportToCSV(window.APP_DATA.mockProcurementData,'Procurement-Tracker'),hse:()=>window.APP_DATA.exportToCSV(window.APP_DATA.mockHSEData.incidents,'HSE-Register'),subcontractors:()=>window.APP_DATA.exportToCSV(window.APP_DATA.mockSubcontractorData,'Subcontractor-Register'),testing:()=>window.APP_DATA.exportToCSV(window.APP_DATA.mockTestingData,'Test-Commissioning'),cost:()=>window.APP_DATA.exportToCSV(window.APP_DATA.mockCostData.categories,'Cost-Control'),closeout:()=>window.APP_DATA.exportToCSV(window.APP_DATA.mockCloseoutData,'Project-Closeout')};if(map[m]){map[m]();showToast('Exported',m+' data exported as CSV','success');}},
};
Object.assign(window,exp);
