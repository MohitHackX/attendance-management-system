import { requireAuth, bindLogout } from "../guards.js";
import { api } from "../api.js";
import { ui } from "../ui.js";

bindLogout();
const user = await requireAuth(["teacher"]);
ui.setTopbar({ title:"Attendance Sheet", subtitle:user.email, chip:"TEACHER" });

const classSel = document.querySelector("#classId");
const subSel = document.querySelector("#subjectId");
const table = document.querySelector("#table");

let csvRows = [];

function qsHash(){
  const h = location.hash || "";
  const m = /class=([a-f0-9]{24})/i.exec(h);
  return m ? m[1] : "";
}

async function loadClasses(){
  const { classes } = await api("/api/teacher/classes");
  classSel.innerHTML = (classes||[]).map(c=>`<option value="${c._id}">${c.name}</option>`).join("");
  const pre = qsHash();
  if(pre && (classes||[]).some(c=>c._id===pre)) classSel.value = pre;
  await loadSubjects();
}
async function loadSubjects(){
  const classId = classSel.value;
  const { subjects } = await api(`/api/teacher/subjects?classId=${classId}`);
  subSel.innerHTML = (subjects||[]).map(s=>`<option value="${s._id}">${s.code} • ${s.name}</option>`).join("");
}

classSel.addEventListener("change", loadSubjects);

document.querySelector("#load").addEventListener("click", async ()=>{
  const classId = classSel.value;
  const subjectId = subSel.value;
  const { records } = await api(`/api/teacher/attendance/sheet?classId=${classId}&subjectId=${subjectId}`);

  const recs = records || [];
  csvRows = recs.map(r=>({
    date: r.date,
    presentCount: (r.presentStudentIds||[]).length,
    absentCount: (r.absentStudentIds||[]).length
  }));

  table.innerHTML = `<table class="table">
    <thead><tr><th>Date</th><th>Present</th><th>Absent</th></tr></thead>
    <tbody>${recs.map(r=>`
      <tr><td>${r.date}</td>
      <td><span class="badge ok">${(r.presentStudentIds||[]).length}</span></td>
      <td><span class="badge warn">${(r.absentStudentIds||[]).length}</span></td></tr>
    `).join("")}</tbody>
  </table>`;
});

document.querySelector("#csv").addEventListener("click", ()=>{
  if(!csvRows.length) return ui.toast("CSV", "Load sheet first");
  ui.csvDownload("attendance_sheet.csv", csvRows);
});

await loadClasses();
