import { requireAuth, bindLogout } from "../guards.js";
import { api } from "../api.js";
import { ui } from "../ui.js";

bindLogout();
const user = await requireAuth(["student"]);
ui.setTopbar({ title:"Student Dashboard", subtitle:user.email, chip:"STUDENT" });

if(!user.deptCode || !user.classId){
  ui.toast("Profile", "Complete your profile first");
  location.href = "/student/profile.html";
}

const att = document.querySelector("#att");
const anns = document.querySelector("#anns");

const res = await api("/api/student/my-attendance");
const stats = res.stats || [];
att.innerHTML = stats.length ? `<table class="table">
  <thead><tr><th>Subject</th><th>Present</th><th>Total</th><th>%</th></tr></thead>
  <tbody>${stats.map(s=>`
    <tr><td>${s.subject.code} • ${s.subject.name}</td>
    <td>${s.present}</td><td>${s.total}</td>
    <td><span class="badge ${s.pct>=75?"ok":"warn"}">${s.pct}%</span></td></tr>
  `).join("")}</tbody>
</table>` : "No attendance yet.";

const a = await api("/api/student/announcements");
anns.innerHTML = (a.announcements||[]).slice(0,6).map(x=>`
  <div class="tile">
    <h3>${x.title}</h3>
    <p>${x.message}</p>
    <p class="sub" style="margin-top:8px;">${new Date(x.createdAt).toLocaleString()}</p>
  </div>
`).join("") || "No announcements.";
