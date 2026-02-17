import { requireAuth, bindLogout } from "../guards.js";
import { api } from "../api.js";
import { ui } from "../ui.js";

bindLogout();
const user = await requireAuth(["teacher"]);
ui.setTopbar({ title:"Teacher Dashboard", subtitle:user.email, chip:"TEACHER" });

const el = document.querySelector("#classes");
const { classes } = await api("/api/teacher/classes");
if(!(classes||[]).length) el.innerHTML = "No classes assigned yet.";
else{
  el.innerHTML = `<div class="cards">${classes.map(c=>`
    <div class="tile">
      <h3>${c.name}</h3>
      <p>Semester ${c.semester} • Section ${c.section}</p>
      <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap">
        <a class="btn small primary" href="/teacher/attendance.html#class=${c._id}">Mark</a>
        <a class="btn small" href="/teacher/sheet.html#class=${c._id}">Sheet</a>
      </div>
    </div>
  `).join("")}</div>`;
}
