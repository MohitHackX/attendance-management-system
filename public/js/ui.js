export const ui = {
  toast(title, message){
    let wrap = document.querySelector(".toast-wrap");
    if(!wrap){
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<div class="t">${title}</div><div class="m">${message}</div>`;
    wrap.appendChild(el);
    setTimeout(()=>{ el.style.opacity="0"; el.style.transform="translateY(6px)"; }, 2600);
    setTimeout(()=>{ el.remove(); }, 3100);
  },

  setTopbar({title="Attendance System", subtitle="", chip=""}){
    const tb = document.querySelector("[data-topbar]");
    if(!tb) return;
    const t = tb.querySelector("[data-title]");
    const s = tb.querySelector("[data-sub]");
    const c = tb.querySelector("[data-chip]");
    if(t) t.textContent = title;
    if(s) s.textContent = subtitle;
    if(c) c.textContent = chip;
  },

  modalOpen(html){
    let back = document.querySelector(".modal-back");
    if(!back){
      back = document.createElement("div");
      back.className="modal-back";
      back.innerHTML = `<div class="card modal"><div class="modal-head">
        <div style="font-weight:800">Modal</div>
        <button class="btn small ghost" data-close>✕</button>
      </div><div class="hr"></div><div class="modal-body"></div></div>`;
      document.body.appendChild(back);
      back.addEventListener("click",(e)=>{
        if(e.target === back || e.target?.dataset?.close !== undefined){ ui.modalClose(); }
      });
      back.querySelector("[data-close]").addEventListener("click", ui.modalClose);
    }
    back.style.display="flex";
    back.querySelector(".modal-body").innerHTML = html;
  },

  modalClose(){
    const back = document.querySelector(".modal-back");
    if(back) back.style.display="none";
  },

  csvDownload(filename, rows){
    const cols = Object.keys(rows[0] || {});
    const escape = (v)=> `"${String(v ?? "").replaceAll('"','""')}"`;
    const csv = [
      cols.map(escape).join(","),
      ...rows.map(r => cols.map(c=>escape(r[c])).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
};
