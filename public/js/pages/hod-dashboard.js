import { requireAuth, bindLogout } from "../guards.js";
import { api } from "../api.js";
import { ui } from "../ui.js";

bindLogout();
const user = await requireAuth(["hod"]);
ui.setTopbar({ title:"HOD Dashboard", subtitle:`${user.email} • Dept ${user.deptCode}`, chip:"HOD" });

const t_name = document.querySelector("#t_name");
const t_email = document.querySelector("#t_email");
const t_pass = document.querySelector("#t_pass");
document.querySelector("#t_create").addEventListener("click", async ()=>{
  try{
    await api("/api/hod/teachers", { method:"POST", body:{ name:t_name.value, email:t_email.value, password:t_pass.value }});
    ui.toast("Created", "Teacher created");
    t_name.value=""; t_email.value=""; t_pass.value="";
    await refreshAll();
  }catch(e){ ui.toast("Error", e.message); }
});

const c_name = document.querySelector("#c_name");
const c_sem = document.querySelector("#c_sem");
const c_sec = document.querySelector("#c_sec");
document.querySelector("#c_create").addEventListener("click", async ()=>{
  try{
    await api("/api/hod/classes", { method:"POST", body:{ name:c_name.value, semester:Number(c_sem.value), section:c_sec.value }});
    ui.toast("Created", "Class created");
    c_name.value=""; c_sec.value="";
    await refreshAll();
  }catch(e){ ui.toast("Error", e.message); }
});

document.querySelector("#assign_btn").addEventListener("click", async ()=>{
  const cls = document.querySelector("#assign_class").value;
  const teacherId = document.querySelector("#assign_teacher").value;
  try{
    await api(`/api/hod/classes/${cls}/assign`, { method:"PATCH", body:{ teacherId }});
    ui.toast("Assigned", "Teacher assigned to class");
    await refreshAll();
  }catch(e){ ui.toast("Error", e.message); }
});

document.querySelector("#s_create").addEventListener("click", async ()=>{
  const classId = document.querySelector("#s_class").value;
  const code = document.querySelector("#s_code").value;
  const name = document.querySelector("#s_name").value;
  try{
    await api("/api/hod/subjects", { method:"POST", body:{ classId, code, name }});
    ui.toast("Created", "Subject created");
    document.querySelector("#s_code").value="";
    document.querySelector("#s_name").value="";
  }catch(e){ ui.toast("Error", e.message); }
});

document.querySelector("#cr_create").addEventListener("click", async ()=>{
  const classId = document.querySelector("#cr_class").value;
  const name = document.querySelector("#cr_name").value;
  const email = document.querySelector("#cr_email").value;
  const password = document.querySelector("#cr_pass").value;
  try{
    await api("/api/hod/cr", { method:"POST", body:{ classId, name, email, password }});
    ui.toast("Created", "CR created");
    document.querySelector("#cr_name").value="";
    document.querySelector("#cr_email").value="";
    document.querySelector("#cr_pass").value="";
  }catch(e){ ui.toast("Error", e.message); }
});

async function refreshAll(){
  const { classes } = await api("/api/hod/classes");
  document.querySelector("#classes").innerHTML = `<table class="table">
    <thead><tr><th>Name</th><th>Sem</th><th>Sec</th><th>Teacher</th></tr></thead>
    <tbody>${(classes||[]).map(c=>`<tr><td>${c.name}</td><td>${c.semester}</td><td>${c.section}</td><td>${c.teacherId || "—"}</td></tr>`).join("")}</tbody>
  </table>`;

  const fill = (selId) => {
    const sel = document.querySelector(selId);
    sel.innerHTML = (classes||[]).map(c=>`<option value="${c._id}">${c.name} (Sem ${c.semester}-${c.section})</option>`).join("");
  };
  fill("#assign_class"); fill("#s_class"); fill("#cr_class");

  const teachersRes = await api("/api/hod/_teachers");
  const teachers = teachersRes.teachers || [];
  document.querySelector("#assign_teacher").innerHTML =
    teachers.map(t=>`<option value="${t._id}">${t.name || "Teacher"} • ${t.email}</option>`).join("");
}

await refreshAll();
