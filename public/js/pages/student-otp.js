import { api } from "../api.js";
import { storage } from "../storage.js";
import { ui } from "../ui.js";

const dept = storage.getDept() || "";
document.querySelector("#dept").value = dept || "—";

const emailEl = document.querySelector("#email");
const otpEl = document.querySelector("#otp");

document.querySelector("#send").addEventListener("click", async ()=>{
  const email = emailEl.value.trim();
  try{
    const res = await api("/api/auth/student/send-otp", { method:"POST", auth:false, body:{ email } });
    ui.toast("OTP", res.message || "OTP sent");
    if(res.devOtp){
      ui.toast("Dev OTP", `OTP: ${res.devOtp}`);
    }
  }catch(e){
    ui.toast("Error", e.message);
  }
});

document.querySelector("#verify").addEventListener("click", async ()=>{
  const email = emailEl.value.trim();
  const otp = otpEl.value.trim();
  try{
    const res = await api("/api/auth/student/verify-otp", { method:"POST", auth:false, body:{ email, otp } });
    storage.setToken(res.token);
    storage.setRole("student");
    ui.toast("Success", "Logged in as Student");
    location.href = "/student/dashboard.html";
  }catch(e){
    ui.toast("Verify Failed", e.message);
  }
});
