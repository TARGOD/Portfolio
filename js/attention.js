/* =====================================================================
   attention.js: the detail view. Every document is a sequence of
   tokens; the hovered word is the query, every other token is a key.
   Four "heads" score keys differently; weights are a real softmax.
   ===================================================================== */
const Att = (() => {
  const sec = $("#detail"), cv = $("#attcv"), ctx = cv.getContext("2d"), story = $("#story"), mxc = $("#mx"), mctx = mxc.getContext("2d");

  /* ---------- vocabulary ---------- */
  const KEY = {};
  VOCAB.forEach(([al, sem, grp, ch, detail]) => {
    const aliases = al.split("|");
    const e = {key:aliases[0].toLowerCase(), label:aliases[0], sem:sem.split(" "), grp:grp ? grp.split(" ") : [],
               chain:ch ? ch.split(":")[0] : null, ord:ch ? +ch.split(":")[1] : 0, detail};
    aliases.forEach(a => KEY[a.toLowerCase()] = e);
  });
  const lookup = l => KEY[l.toLowerCase()] || {key:l.toLowerCase(), label:l, sem:[], grp:[], chain:null, ord:0, detail:""};

  const HEADS = [
    {id:"sem",  name:"semantic", color:"#7af5ff", tau:.13, note:"keys that mean similar things"},
    {id:"proj", name:"project",  color:"#ffb454", tau:.13, note:"keys used in the same project or role"},
    {id:"pipe", name:"pipeline", color:"#b48cff", tau:.28, note:"previous / next step in the same workflow"},
    {id:"pos",  name:"position", color:"#5fe3a1", tau:.9,  note:"nearby tokens (local attention)"},
    {id:"mean", name:"mean",     color:"#f2efe8", tau:1,   note:"average of all four heads"}
  ];
  const hooks = {};
  let docId = null, TOK = [], head = "sem", q = null, userHead = false, idle = 99, autoIdx = 0, autoT = 0;
  let rects = [], active = false, visible = false, MAT = {}, W = 0, H = 0, DPR = 1, storyTop = 0, T = 0;
  const parts = [];

  /* ---------- UI ---------- */
  $("#doctabs").innerHTML = DOCS.map(d => `<button data-doc="${d.id}">${d.name}</button>`).join("");
  $$("#doctabs button").forEach(b => b.addEventListener("click", () => open(b.dataset.doc)));
  $("#heads").innerHTML = HEADS.map((h,k) => `<button class="hb" data-h="${h.id}" style="--c:${h.color}"><i></i>H${k<4?k+1:"μ"} · ${h.name}</button>`).join("");
  $$("#heads .hb").forEach(b => b.addEventListener("click", () => { userHead = true; setHead(b.dataset.h); }));
  addEventListener("keydown", e => { if (!active || e.target.tagName === "INPUT") return; const k = +e.key; if (k >= 1 && k <= 5){ userHead = true; setHead(HEADS[k-1].id); } });

  /* ---------- build a document ---------- */
  function build(id){
    const doc = DOCS.find(d => d.id === id) || DOCS[0];
    docId = doc.id; TOK = []; MAT = {}; q = null; autoIdx = 0; parts.length = 0;
    story.innerHTML = ""; story.classList.remove("swap"); void story.offsetWidth; story.classList.add("swap");
    let delay = 0;
    doc.text.split(/(\{[^}]+\})/).forEach(part => {
      if (!part) return;
      if (part.startsWith("{")){
        const label = part.slice(1,-1), m = lookup(label);
        const el = document.createElement("span"); el.className = "tk"; el.textContent = label; el.style.animationDelay = (delay += .014)+"s";
        el.dataset.i = TOK.length; story.appendChild(el);
        TOK.push({label, el, ...m, w:0, tw:0});
      } else part.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)){ story.appendChild(document.createTextNode(w)); return; }
        const el = document.createElement("span"); el.className = "pw"; el.textContent = w; el.style.animationDelay = (delay += .014)+"s"; story.appendChild(el); });
    });
    $$("#doctabs button").forEach(b => b.classList.toggle("on", b.dataset.doc === docId));
    $("#docName").textContent = doc.name; $("#docKind").textContent = doc.kind; $("#docCount").textContent = `${TOK.length} tokens · ${TOK.length*TOK.length} attention weights`;
    hooks.onDoc && hooks.onDoc(doc);
    $("#qw").textContent = "…"; $("#qd").textContent = "Hover any highlighted word."; $("#bars").innerHTML = ""; $("#seen").innerHTML = "";
    measure(); drawMatrix();
  }

  /* ---------- attention math ---------- */
  const jac = (a,b) => { if (!a.length || !b.length) return 0; const A = new Set(a); let i = 0; b.forEach(x => { if (A.has(x)) i++; }); return i/(A.size+b.length-i); };
  function score(h,i,j){
    const a = TOK[i], b = TOK[j];
    if (h === "sem")  return jac(a.sem, b.sem);
    if (h === "proj") return jac(a.grp, b.grp);
    if (h === "pipe"){ if (a.chain && a.chain === b.chain){ const d = Math.abs(a.ord-b.ord); return d === 0 ? .55 : 1/d; } return (!a.chain && j === 0) ? .6 : 0; }
    return -Math.abs(i-j);
  }
  function row(hid, i){
    const n = TOK.length;
    if (hid === "mean"){ const r = new Array(n).fill(0); ["sem","proj","pipe","pos"].forEach(h => row(h,i).forEach((v,j) => r[j] += v/4)); return r; }
    const tau = HEADS.find(h => h.id === hid).tau, s = []; let mx = -1e9;
    for (let j = 0; j < n; j++){ s[j] = j === i ? -1e9 : score(hid,i,j)/tau; if (s[j] > mx) mx = s[j]; }
    let sum = 0; const e = s.map(v => { const x = Math.exp(v-mx); sum += x; return x; });
    return e.map(x => x/sum);
  }
  const matrix = hid => MAT[hid] || (MAT[hid] = TOK.map((_,i) => row(hid,i)));

  function setHead(h){
    head = h; const H_ = HEADS.find(x => x.id === h), k = HEADS.indexOf(H_);
    $$("#heads .hb").forEach(b => b.classList.toggle("on", b.dataset.h === h));
    sec.style.setProperty("--hc", H_.color);
    $("#headName").innerHTML = `<b>head ${k<4?k+1:"μ"}</b> · ${H_.name}`; $("#mxName").textContent = k<4 ? `H${k+1} · ${H_.name}` : "mean";
    drawMatrix(); if (q !== null) setQuery(q, true);
    if (userHead && hooks.onHead) hooks.onHead(H_, k);
  }
  function setQuery(i, force){
    if (i === q && !force) return;
    if (q !== null && TOK[q]) TOK[q].el.classList.remove("q"); TOK.forEach(t => { t._c = t._s = null; });
    q = i; if (q === null || !TOK[q]) return;
    const t = TOK[q]; t.el.classList.add("q");
    const r = row(head, q), H_ = HEADS.find(x => x.id === head);
    TOK.forEach((tk,j) => tk.tw = r[j]);
    $("#qw").textContent = `“${t.label}”`;
    $("#qd").innerHTML = t.key === "next hard problem"
      ? `Open to new roles: agentic systems, RAG, enterprise AI. <a href="mailto:${LINKS.email}" class="say">Say hi →</a>`
      : esc(t.detail || "Part of the stack.");
    $("#seen").innerHTML = t.grp.length ? `<span>seen in</span>${t.grp.map(g => `<button data-doc="${GROUP_DOC[g]}">${GROUPS[g]}</button>`).join("")}` : "";
    $$("#seen button").forEach(b => b.addEventListener("click", () => open(b.dataset.doc)));
    const top = r.map((w,j) => ({w,j})).sort((a,b) => b.w-a.w).slice(0,5), mx = top[0].w;
    $("#bars").innerHTML = top.map(o => `<div class="bar"><span class="n">${esc(TOK[o.j].label)}</span><span class="t"><b style="width:${o.w/mx*100}%"></b></span><span class="v">${o.w.toFixed(3)}</span></div>`).join("");
    $("#note").textContent = head === "pipe" && !t.chain ? `no pipeline for this token → attention sink on “${TOK[0].label}”` : `top-k keys · ${H_.note}`;
    drawMatrix();
  }
  function drawMatrix(){
    const n = TOK.length; if (!n) return;
    const M = matrix(head), c = hexRGB(HEADS.find(h => h.id === head).color), cs = mxc.width/n;
    mctx.fillStyle = "#0a0a0c"; mctx.fillRect(0,0,mxc.width,mxc.height);
    for (let i = 0; i < n; i++){ const mr = Math.max(...M[i]);
      for (let j = 0; j < n; j++){ const v = Math.pow(M[i][j]/mr,.6); mctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${v*(q===null||i===q?1:.55)})`; mctx.fillRect(j*cs,i*cs,Math.ceil(cs),Math.ceil(cs)); } }
    if (q !== null){ mctx.strokeStyle = "#fff"; mctx.lineWidth = 1; mctx.strokeRect(.5, q*cs+.5, mxc.width-1, cs); }
  }

  /* ---------- geometry ---------- */
  let absTop = 0, secLeft = 0;
  function measure(){
    DPR = Math.min(innerWidth < 900 ? 1.25 : 1.5, devicePixelRatio||1); W = sec.clientWidth; H = sec.clientHeight;
    cv.width = W*DPR; cv.height = H*DPR; cv.style.width = W+"px"; cv.style.height = H+"px";
    const sr = sec.getBoundingClientRect(); storyTop = story.getBoundingClientRect().top - sr.top; absTop = sr.top + scrollY; secLeft = sr.left;
    rects = TOK.map(t => { const r = t.el.getClientRects()[0] || t.el.getBoundingClientRect();
      return {x:r.left-sr.left+r.width/2, y:r.top-sr.top+r.height*.18, cy:r.top-sr.top+r.height/2, w:r.width, h:r.height}; });
  }

  /* ---------- input ---------- */
  sec.addEventListener("pointermove", e => {
    const sr = sec.getBoundingClientRect(), x = e.clientX-sr.left, y = e.clientY-sr.top, st = story.getBoundingClientRect();
    if (e.clientY < st.top-50 || e.clientY > st.bottom+40) return;
    let best = null, bd = 1e9;
    rects.forEach((r,i) => { const dx = Math.max(0, Math.abs(x-r.x)-r.w/2), dy = Math.abs(y-r.cy), d = Math.hypot(dx, dy*1.4); if (d < bd){ bd = d; best = i; } });
    if (best !== null && bd < 70){ idle = 0; setQuery(best); }
  });
  story.addEventListener("click", e => { const t = e.target.closest(".tk"); if (t){ idle = -3; setQuery(+t.dataset.i); } });

  /* ---------- loop ---------- */
  function update(dt){
    visible = scrollY + innerHeight > absTop && scrollY < absTop + H;
    if (!visible) return;
    T += dt; idle += dt;
    if (active && idle > 3.5 && TOK.length){
      autoT -= dt;
      if (autoT <= 0){ autoT = 2.6;
        const cand = TOK.map((t,i) => ({t,i})).filter(o => o.t.chain || o.t.grp.length > 1);
        const pick = cand.length ? cand[autoIdx++ % cand.length].i : (autoIdx++ % TOK.length);
        setQuery(pick);
        if (!userHead && autoIdx % 2 === 0) setHead(["sem","proj","pipe","pos"][(autoIdx/2) % 4]); }
    }
    const c = hexRGB(HEADS.find(h => h.id === head).color);
    TOK.forEach((t,j) => { t.w += ((q===null?0:t.tw)-t.w)*Math.min(1,dt*9);
      if (j === q) return; const a = Math.round(Math.min(1, t.w*3.2)*40)/40;
      const col = a > .02 ? `rgba(${Math.round(236+(c[0]-236)*a)},${Math.round(232+(c[1]-232)*a)},${Math.round(223+(c[2]-223)*a)},${(.5+.5*a).toFixed(2)})` : "";
      const sh = a > .05 ? `0 0 ${Math.round(a*22)}px rgba(${c[0]},${c[1]},${c[2]},${(.5*a).toFixed(2)})` : "";
      if (col !== t._c){ t._c = col; t.el.style.color = col; } if (sh !== t._s){ t._s = sh; t.el.style.textShadow = sh; } });
  }
  const bez = (x0,y0,cx,cy,x1,y1,t) => { const u = 1-t; return [u*u*x0+2*u*t*cx+t*t*x1, u*u*y0+2*u*t*cy+t*t*y1]; };
  const ctrl = (a,b) => { const d = Math.hypot(a.x-b.x, a.y-b.y); return [(a.x+b.x)/2, Math.max(storyTop-40, Math.min(a.y,b.y)-26-d*.28)]; };
  function render(){
    if (!visible) return;
    ctx.setTransform(DPR,0,0,DPR,0,0); ctx.clearRect(0,0,W,H);
    if (q === null || !rects[q]) return;
    const hc = HEADS.find(h => h.id === head).color, c = hexRGB(hc), col = a => `rgba(${c[0]},${c[1]},${c[2]},${a})`, Q = rects[q];
    const keys = TOK.map((t,j) => ({j, w:t.w})).filter(o => o.j !== q && o.w > .025).sort((a,b) => b.w-a.w).slice(0,9);
    keys.forEach(({j,w}) => {
      const K = rects[j]; if (!K) return; const [cx,cy] = ctrl(K,Q), a = Math.min(1, w*3);
      ctx.strokeStyle = col(.12+.7*a); ctx.lineWidth = .8+w*9;
      ctx.beginPath(); ctx.moveTo(K.x,K.y); ctx.quadraticCurveTo(cx,cy,Q.x,Q.y); ctx.stroke();
      if (w > .06){ const [lx,ly] = bez(K.x,K.y,cx,cy,Q.x,Q.y,.5); ctx.font = '10.5px "JetBrains Mono", monospace'; ctx.textAlign = "center"; ctx.fillStyle = col(.5+.5*a); ctx.fillText(w.toFixed(2), lx, ly-6); }
      if (Math.random() < w*.9) parts.push({K:j, t:0, sp:.55+Math.random()*.5, s:1.2+w*4});
      ctx.fillStyle = col(.8*a+.2); ctx.beginPath(); ctx.arc(K.x,K.y,2+w*4,0,6.283); ctx.fill();
    });
    const pr = 6+Math.sin(T*4)*2; ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(Q.x,Q.y,pr,0,6.283); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(Q.x,Q.y,2.5,0,6.283); ctx.fill();
    for (let i = parts.length-1; i >= 0; i--){ const p = parts[i]; p.t += .016*p.sp; if (p.t >= 1 || p.K === q || !rects[p.K]){ parts.splice(i,1); continue; }
      const K = rects[p.K], [cx,cy] = ctrl(K,Q), [x,y] = bez(K.x,K.y,cx,cy,Q.x,Q.y,p.t);
      ctx.fillStyle = col(1-p.t*.6); ctx.shadowColor = hc; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(x,y,p.s,0,6.283); ctx.fill(); ctx.shadowBlur = 0; }
  }

  /* ---------- public ---------- */
  function open(id, label){
    build(id);
    if (label){ const k = lookup(label).key, i = TOK.findIndex(t => t.key === k); if (i >= 0){ idle = -5; setQuery(i, true); TOK.forEach(t => t.w = t.tw); } }
  }
  function findFor(node){
    if (NODE_DOC[node.id]) return {doc:NODE_DOC[node.id]};
    const k = lookup(node.label); if (!KEY[node.label.toLowerCase()]) return null;
    for (const d of ["about","paper","coll","agentsP","erp","lora","intern"]){
      const doc = DOCS.find(x => x.id === d); const labels = [...doc.text.matchAll(/\{([^}]+)\}/g)].map(m => lookup(m[1]).key);
      if (labels.includes(k.key)) return {doc:d, tok:node.label};
    }
    return null;
  }
  function queryPoint(){ if (q === null || !rects[q]) return null; return {x:secLeft+rects[q].x, y:absTop-scrollY+rects[q].cy}; }
  const color = () => HEADS.find(h => h.id === head).color;
  function setActive(on){ active = on; if (on) idle = Math.min(idle, 1.5); }

  build("about"); setHead("sem");
  function headN(k){ userHead = true; setHead(HEADS[clamp(k,1,5)-1].id); }
  return { open, update, render, measure, findFor, queryPoint, color, setActive, hooks, head:headN, get doc(){ return docId; } };
})();
