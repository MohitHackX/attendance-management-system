import { api } from "../api.js";
import { storage } from "../storage.js";
import { ui } from "../ui.js";

const cards = document.querySelector("#deptCards");
const q = document.querySelector("#q");
const go = document.querySelector("#go");

let departments = [];

function render(list){
  cards.innerHTML = "";
  list.forEach(d=>{
    const el = document.createElement("div");
    el.className = "tile";
    el.innerHTML = `<h3>${d.name}</h3><p>${d.code}</p>`;
    el.addEventListener("click", ()=>{
      storage.setDept(d.code);
      ui.toast("Selected", `${d.name} (${d.code})`);
      location.href = "/auth/choose-role.html";
    });
    cards.appendChild(el);
  });
}

async function load(){
  try{
    const res = await api("/api/auth/departments", { auth:false });
    departments = res.departments || [];
    render(departments);
  }catch(e){
    ui.toast("Error", e.message);
  }
}

q.addEventListener("input", ()=>{
  const v = q.value.trim().toLowerCase();
  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(v) || d.code.toLowerCase().includes(v)
  );
  render(filtered);
});

go.addEventListener("click", ()=> location.href = "/auth/choose-role.html");

ui.setTopbar({ title:"Galaxy Attendance", subtitle:"Select your Department", chip:"Landing" });
load();
