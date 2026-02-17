import { api } from "../api.js";
import { storage } from "../storage.js";
import { ui } from "../ui.js";

const roleEl = document.querySelector("#role");
const deptEl = document.querySelector("#dept");
const emailEl = document.querySelector("#email");
const passEl = document.querySelector("#password");
const loginBtn = document.querySelector("#login");

deptEl.value = storage.getDept() || "—";

loginBtn.addEventListener("click", async ()=>{
  const role = roleEl.value;
  const email = emailEl.value.trim();
  const password = passEl.value;

  try{
    const res = await api("/api/auth/staff/login", {
      method:"POST", auth:false,
      body:{ email, password, role }
    });
    storage.setToken(res.token);
    storage.setRole(role);
    ui.toast("Success", `Logged in as ${role.toUpperCase()}`);

    if(role === "hod") location.href = "/hod/dashboard.html";
    else if(role === "teacher") location.href = "/teacher/dashboard.html";
    else location.href = "/cr/dashboard.html";
  }catch(e){
    ui.toast("Login Failed", e.message);
  }
});
