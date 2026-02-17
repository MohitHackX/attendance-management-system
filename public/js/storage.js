export const storage = {
  setToken(token){ localStorage.setItem("ams_token", token); },
  getToken(){ return localStorage.getItem("ams_token") || ""; },
  clearToken(){ localStorage.removeItem("ams_token"); },

  setDept(deptCode){ localStorage.setItem("ams_dept", deptCode); },
  getDept(){ return localStorage.getItem("ams_dept") || ""; },

  setRole(role){ localStorage.setItem("ams_role", role); },
  getRole(){ return localStorage.getItem("ams_role") || ""; },

  setUser(user){ localStorage.setItem("ams_user", JSON.stringify(user||{})); },
  getUser(){ try{ return JSON.parse(localStorage.getItem("ams_user")||"{}"); }catch{ return {}; } },
  clearAll(){
    ["ams_token","ams_dept","ams_role","ams_user"].forEach(k=>localStorage.removeItem(k));
  }
};
