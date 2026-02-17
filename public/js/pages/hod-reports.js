import { requireAuth, bindLogout } from "../guards.js";
import { api } from "../api.js";
import { ui } from "../ui.js";

bindLogout();
const user = await requireAuth(["hod"]);
ui.setTopbar({ title:"HOD Reports", subtitle:`Dept ${user.deptCode}`, chip:"HOD" });

const classSel = document.querySelector("#classId");
const subSel = document.querySelector("#subjectId");
const out = document.querySelector("#out");
const table = document.querySelector("#table");

let lastRows = [];

async function loadClasses(){
  const { classes } = await api("/api/hod/classes");
  classSel.innerHTML = (classes||[]).map(c=>`<option value="${c._id}">${c.name}</option>`).join("");
  await loadSubjects();
}
async function loadSubjects(){
  const classId = classSel.value;
  const { subjects } = await api(`/api/hod/_subjects?classId=${classId}`);
  subSel.innerHTML = (subjects||[]).map(s=>`<option value="${s._id}">${s.code} • ${s.name}</option>`).join("");
}

classSel.addEventListener("change", loadSubjects);

document.querySelector("#run").addEventListener("click", async ()=>{
  const classId = classSel.value;
  const subjectId = subSel.value;
  const dateFrom = document.querySelector("#from").value.trim();
  const dateTo = document.querySelector("#to").value.trim();
  const qs = new URLSearchParams({ classId, subjectId });
  if(dateFrom) qs.set("dateFrom", dateFrom);
  if(dateTo) qs.set("dateTo", dateTo);

  const res = await api(`/api/hod/reports?${qs.toString()}`);
  const overall = res.overall || {};
  lastRows = (res.rows||[]).map(r=>({
    name: r.student?.name || "—",
    email: r.student?.email || "—",
    present: r.present,
    total: r.total,
    pct: r.pct
  }));

  out.innerHTML = `Total Sessions: <b>${overall.totalClasses||0}</b> • Students: <b>${overall.totalStudents||0}</b> • Avg %: <b>${overall.avgPct||0}</b>`;
  table.innerHTML = `<table class="table">
    <thead><tr><th>Name</th><th>Email</th><th>Present</th><th>Total</th><th>%</th></tr></thead>
    <tbody>${lastRows.map(r=>`<tr><td>${r.name}</td><td>${r.email}</td><td>${r.present}</td><td>${r.total}</td><td><span class="badge ${r.pct>=75?"ok":"warn"}">${r.pct}%</span></td></tr>`).join("")}</tbody>
  </table>`;
});

document.querySelector("#csv").addEventListener("click", ()=>{
  if(!lastRows.length) return ui.toast("CSV", "Run report first");
  ui.csvDownload("hod_report.csv", lastRows);
});

await loadClasses();
