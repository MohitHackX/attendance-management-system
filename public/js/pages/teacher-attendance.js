import { requireAuth, bindLogout } from "../guards.js";
import { api } from "../api.js";
import { ui } from "../ui.js";

bindLogout();
const user = await requireAuth(["teacher"]);
ui.setTopbar({ title:"Mark Attendance", subtitle:user.email, chip:"TEACHER" });

const classSel = document.querySelector("#classId");
const subSel = document.querySelector("#subjectId");
const dateEl = document.querySelector("#date");
const listEl = document.querySelector("#list");
const lockEl = document.querySelector("#lock");
const searchEl = document.querySelector("#search");

const today = new Date();
const pad = (n)=> String(n).padStart(2,"0");
dateEl.value = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;

let students = [];
let presentSet = new Set();
let currentSheet = [];

function qsHash(){
  const h = location.hash || "";
  const m = /class=([a-f0-9]{24})/i.exec(h);
  return m ? m[1] : "";
}

function render(){
  const q = searchEl.value.trim().toLowerCase();
  const filtered = students.filter(s =>
    (s.name||"").toLowerCase().includes(q) || (s.email||"").toLowerCase().includes(q)
  );

  listEl.innerHTML = `<table class="table">
    <thead><tr><th>Present</th><th>Name</th><th>Email</th></tr></thead>
    <tbody>
    ${filtered.map(s=>{
      const checked = presentSet.has(s._id) ? "checked" : "";
      return `<tr>
        <td><input type="checkbox" data-id="${s._id}" ${checked}/></td>
        <td>${s.name || "—"}</td>
        <td>${s.email}</td>
      </tr>`;
    }).join("")}
    </tbody>
  </table>`;

  listEl.querySelectorAll("input[type=checkbox]").forEach(cb=>{
    cb.addEventListener("change", ()=>{
      const id = cb.dataset.id;
      if(cb.checked) presentSet.add(id);
      else presentSet.delete(id);
    });
  });
}

async function loadClasses(){
  const { classes } = await api("/api/teacher/classes");
  classSel.innerHTML = (classes||[]).map(c=>`<option value="${c._id}">${c.name}</option>`).join("");
  const pre = qsHash();
  if(pre && (classes||[]).some(c=>c._id===pre)) classSel.value = pre;
  await loadSubjects();
  await loadStudents();
  await checkLocked();
}

async function loadSubjects(){
  const classId = classSel.value;
  const { subjects } = await api(`/api/teacher/subjects?classId=${classId}`);
  subSel.innerHTML = (subjects||[]).map(s=>`<option value="${s._id}">${s.code} • ${s.name}</option>`).join("");
}

async function loadStudents(){
  const classId = classSel.value;
  const { students: st } = await api(`/api/teacher/students?classId=${classId}`);
  students = st || [];
  presentSet = new Set(students.map(s=>s._id)); // default present
  render();
}

async function checkLocked(){
  lockEl.textContent = "";
  const classId = classSel.value;
  const subjectId = subSel.value;
  const { records } = await api(`/api/teacher/attendance/sheet?classId=${classId}&subjectId=${subjectId}`);
  currentSheet = records || [];
  const d = dateEl.value;
  const already = currentSheet.find(r=>r.date===d);
  const submit = document.querySelector("#submit");
  if(already){
    lockEl.innerHTML = `<span class="badge warn">Locked</span> Attendance already marked for ${d}.`;
    submit.disabled = true;
    submit.classList.add("ghost");
  }else{
    lockEl.innerHTML = `<span class="badge ok">Open</span> Not marked for ${d}.`;
    submit.disabled = false;
    submit.classList.remove("ghost");
  }
}

classSel.addEventListener("change", async ()=>{
  await loadSubjects();
  await loadStudents();
  await checkLocked();
});
subSel.addEventListener("change", checkLocked);
dateEl.addEventListener("change", checkLocked);
searchEl.addEventListener("input", render);

document.querySelector("#allP").addEventListener("click", ()=>{
  presentSet = new Set(students.map(s=>s._id));
  render();
});
document.querySelector("#allA").addEventListener("click", ()=>{
  presentSet = new Set();
  render();
});

document.querySelector("#submit").addEventListener("click", async ()=>{
  try{
    await api("/api/teacher/attendance/mark", { method:"POST", body:{
      classId: classSel.value,
      subjectId: subSel.value,
      date: dateEl.value,
      presentStudentIds: Array.from(presentSet)
    }});
    ui.toast("Saved", "Attendance marked");
    await checkLocked();
  }catch(e){
    ui.toast("Error", e.message);
    await checkLocked();
  }
});

await loadClasses();
