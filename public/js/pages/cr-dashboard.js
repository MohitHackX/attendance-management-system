import { requireAuth, bindLogout } from "../guards.js";
import { api } from "../api.js";
import { ui } from "../ui.js";

bindLogout();
const user = await requireAuth(["cr"]);
ui.setTopbar({ title:"CR Dashboard", subtitle:`Dept ${user.deptCode}`, chip:"CR" });

const sum = document.querySelector("#sum");
const anns = document.querySelector("#anns");

const s = await api("/api/cr/class-summary");
sum.innerHTML = `
  <div class="tile">
    <h3>${s.class?.name || "Class"}</h3>
    <p>Total Sessions: ${s.totalSessions || 0}</p>
    <p>Subjects: ${(s.subjects||[]).length}</p>
  </div>
`;

const a = await api("/api/cr/announcements");
anns.innerHTML = (a.announcements||[]).slice(0,6).map(x=>`
  <div class="tile">
    <h3>${x.title}</h3>
    <p>${x.message}</p>
    <p class="sub" style="margin-top:8px;">${new Date(x.createdAt).toLocaleString()}</p>
  </div>
`).join("") || "No announcements.";
