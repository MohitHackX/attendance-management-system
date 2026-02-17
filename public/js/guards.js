import { storage } from "./storage.js";
import { api } from "./api.js";

export async function requireAuth(allowedRoles){
  const token = storage.getToken();
  if(!token){
    location.href = "/auth/choose-role.html";
    return;
  }
  let me;
  try{
    me = await api("/api/auth/me", { auth:true });
  }catch{
    location.href = "/auth/choose-role.html";
    return;
  }
  const user = me.user || {};
  storage.setUser(user);
  storage.setRole(user.role);

  if(allowedRoles && !allowedRoles.includes(user.role)){
    location.href = "/auth/choose-role.html";
    return;
  }
  return user;
}

export function bindLogout(){
  const btn = document.querySelector("[data-logout]");
  if(btn){
    btn.addEventListener("click", ()=>{
      storage.clearAll();
      location.href = "/auth/choose-role.html";
    });
  }
}
