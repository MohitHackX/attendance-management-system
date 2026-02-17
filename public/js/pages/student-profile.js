import { requireAuth, bindLogout } from "../guards.js";
import { api } from "../api.js";
import { ui } from "../ui.js";
import { storage } from "../storage.js";

bindLogout();
const user = await requireAuth(["student"]);
ui.setTopbar({ title:"Student Profile", subtitle:user.email, chip:"STUDENT" });

const nameEl = document.querySelector("#name");
const deptEl = document.querySelector("#dept");
const classEl = document.querySelector("#classId");

nameEl.value = user.name || "";
deptEl.value = user.deptCode || storage.getDept() || "";

document.querySelector("#save").addEventListener("click", async ()=>{
  try{
    const res = await api("/api/student/profile", { method:"POST", body:{
      name: nameEl.value,
      deptCode: deptEl.value,
      classId: classEl.value
    }});
    storage.setUser(res.user);
    storage.setDept(res.user.deptCode || "");
    ui.toast("Saved", "Profile updated");
    location.href = "/student/dashboard.html";
  }catch(e){
    ui.toast("Error", e.message);
  }
});
