import { requireAuth, bindLogout } from "../guards.js";
import { api } from "../api.js";
import { ui } from "../ui.js";

const d_code = document.querySelector("#d_code");
const d_name = document.querySelector("#d_name");
const d_create = document.querySelector("#d_create");
const depsEl = document.querySelector("#deps");

const h_name = document.querySelector("#h_name");
const h_dept = document.querySelector("#h_dept");
const h_email = document.querySelector("#h_email");
const h_pass = document.querySelector("#h_pass");
const h_create = document.querySelector("#h_create");
const hodsEl = document.querySelector("#hods");

bindLogout();

async function refresh(){
  const deps = await api("/api/admin/departments");
  depsEl.innerHTML = `<table class="table">
    <thead><tr><th>Code</th><th>Name</th></tr></thead>
    <tbody>${(deps.departments||[]).map(d=>`<tr><td>${d.code}</td><td>${d.name}</td></tr>`).join("")}</tbody>
  </table>`;

  const hods = await api("/api/admin/users?role=hod");
  hodsEl.innerHTML = `<table class="table">
    <thead><tr><th>Name</th><th>Email</th><th>Dept</th></tr></thead>
    <tbody>${(hods.users||[]).map(u=>`<tr><td>${u.name||"—"}</td><td>${u.email}</td><td>${u.deptCode||"—"}</td></tr>`).join("")}</tbody>
  </table>`;
}

d_create.addEventListener("click", async ()=>{
  try{
    await api("/api/admin/departments", { method:"POST", body:{ code:d_code.value, name:d_name.value } });
    ui.toast("Created", "Department created");
    d_code.value=""; d_name.value="";
    refresh();
  }catch(e){ ui.toast("Error", e.message); }
});

h_create.addEventListener("click", async ()=>{
  try{
    await api("/api/admin/hod", { method:"POST", body:{
      name: h_name.value, deptCode: h_dept.value, email: h_email.value, password: h_pass.value
    }});
    ui.toast("Created", "HOD created");
    h_name.value=""; h_dept.value=""; h_email.value=""; h_pass.value="";
    refresh();
  }catch(e){ ui.toast("Error", e.message); }
});

const user = await requireAuth(["admin"]);
ui.setTopbar({ title:`Admin Dashboard`, subtitle:user.email, chip:"ADMIN" });
refresh();
