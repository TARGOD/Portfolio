/* =====================================================================
   journey.js: "Training run: me". A capability curve that RISES as you
   scroll (monotone cubic, so it never dips). Every career step is a
   checkpoint you can enter (Portal). Layout is cached, not read per frame.
   ===================================================================== */
const Journey = (() => {
  const sec = $("#journey"), stage = sec.querySelector(".jstage"), wrap = $("#jchart"), cv = $("#jcv"), ctx = cv.getContext("2d");
  const N = JOURNEY.length, U = JOURNEY.map((c,i) => .05 + i/(N-1)*.9), Y0 = JOURNEY.map(c => c.score);
  const hooks = {};
  let W = 0, H = 0, DPR = 1, drawU = U[0], idx = -1, visible = false, T = 0, hover = -1;
  let absTop = 0, secH = 0, chartOffTop = 0, chartLeft = 0, vh = innerHeight;
  const pad = {l:50, r:26, t:22, b:50};

  /* monotone cubic Hermite (Fritsch–Carlson): smooth and never goes down */
  const M = (() => { const d = [], m = [];
    for (let i = 0; i < N-1; i++) d[i] = (Y0[i+1]-Y0[i])/(U[i+1]-U[i]);
    m[0] = d[0]; m[N-1] = d[N-2]; for (let i = 1; i < N-1; i++) m[i] = (d[i-1]+d[i])/2;
    for (let i = 0; i < N-1; i++){ if (!d[i]){ m[i] = m[i+1] = 0; continue; } const a = m[i]/d[i], b = m[i+1]/d[i], s = a*a+b*b; if (s > 9){ const t = 3/Math.sqrt(s); m[i] = t*a*d[i]; m[i+1] = t*b*d[i]; } }
    return m; })();
  function score(u){
    if (u <= U[0]) return Math.max(.02, Y0[0] - (U[0]-u)*1.5);
    if (u >= U[N-1]) return Y0[N-1];
    let i = 0; while (u > U[i+1]) i++;
    const h = U[i+1]-U[i], t = (u-U[i])/h, t2 = t*t, t3 = t2*t;
    const v = (2*t3-3*t2+1)*Y0[i] + (t3-2*t2+t)*h*M[i] + (-2*t3+3*t2)*Y0[i+1] + (t3-t2)*h*M[i+1];
    return v + Math.sin(u*90)*.0025;   // a hint of training noise
  }
  const X = u => pad.l + u*(W-pad.l-pad.r);
  const Y = s => pad.t + (1 - s/1.05)*(H-pad.t-pad.b);

  function measure(){
    DPR = Math.min(innerWidth < 900 ? 1.25 : 1.5, devicePixelRatio||1); vh = innerHeight;
    const r = wrap.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    W = r.width; H = r.height; cv.width = Math.max(1, W*DPR); cv.height = Math.max(1, H*DPR);
    absTop = sec.getBoundingClientRect().top + scrollY; secH = sec.offsetHeight; chartOffTop = r.top - sr.top; chartLeft = r.left;
  }
  const stageTop = () => { const s = absTop - scrollY; return s > 0 ? s : Math.min(0, absTop + secH - vh - scrollY); };

  /* ---------- DOM ---------- */
  $("#jdots").innerHTML = JOURNEY.map((c,i) => `<button data-i="${i}" style="--c:${c.color}" title="${esc(c.title)}"><i></i><span>${c.tag}</span></button>`).join("");
  $$("#jdots button").forEach(b => b.addEventListener("click", () => goto(+b.dataset.i)));
  function setCard(i){
    const prev = idx; idx = i; const c = JOURNEY[i], card = $("#jcard");
    card.style.setProperty("--c", c.color);
    card.innerHTML = `<div class="jk"><span class="ck">${c.id}</span><span>${c.tag}</span><span class="jd">${c.date}</span></div>
      <h3>${c.title}</h3><div class="jorg">${esc(c.org)}</div><p>${esc(c.body)}</p>
      <div class="jtags">${c.tags.map(t => `<span>${esc(t)}</span>`).join("")}</div>
      <button class="enter" id="jEnter">${c.future ? "Open the pending checkpoint" : "Enter checkpoint"} <span>↗</span></button>`;
    card.animate([{opacity:0, transform:"translateY(12px)"},{opacity:1, transform:"none"}], {duration:REDUCED?0:380, easing:"cubic-bezier(.2,.8,.2,1)"});
    $("#jEnter").addEventListener("click", e => { const r = e.currentTarget.getBoundingClientRect(); Portal.open(idx, {x:r.left+r.width/2, y:r.top+r.height/2}); });
    $$("#jdots button").forEach((b,k) => { b.classList.toggle("on", k === i); b.classList.toggle("done", k < i); });
    $("#jlog").innerHTML = JOURNEY.map((c,k) => k <= i
      ? `<div class="ln"><span class="ok">✓</span> saved <b>${c.id}</b> <span class="f">${c.file}</span>${k===i?' <span class="cur">← current</span>':""}</div>`
      : `<div class="ln dim"><span>○</span> pending ${c.id}</div>`).slice(Math.max(0,i-3), i+2).join("");
    $("#jstep").textContent = c.id; $("#jloss").textContent = c.score.toFixed(2);
    if (innerWidth < 900) measure();
    if (prev !== -1 && hooks.onCheckpoint) hooks.onCheckpoint(c, i);
  }
  let play = {state:"idle", k:0, dwell:0}, manual = null;
  function goto(i){ manual = i; play.state = "done"; }
  function replay(){ manual = null; drawU = U[0]; idx = -1; play = {state:"run", k:1, dwell:0}; }
  $("#jReplay").addEventListener("click", replay);

  /* ---------- loop ---------- */
  function update(dt){
    const sy = scrollY; visible = sy + vh > absTop && sy < absTop + secH;
    if (!visible) return;
    T += dt;
    if (play.state === "idle" && absTop - sy < vh*.45) play = {state:"run", k:1, dwell:0};
    let target = drawU;
    if (manual !== null) target = U[manual];
    else if (play.state === "run"){ target = U[play.k];
      if (Math.abs(drawU - target) < .003){ play.dwell += dt; if (play.dwell > 1.15){ play.dwell = 0; if (play.k < N-1) play.k++; else play.state = "done"; } } }
    const sp = (manual !== null ? .9 : .32)*dt; drawU += clamp(target - drawU, -sp, sp);
    let i = 0; for (let k = 0; k < N; k++) if (U[k] <= drawU + .012) i = k;
    if (i !== idx) setCard(i);
  }
  function render(){
    if (!visible || !W) return;
    ctx.setTransform(DPR,0,0,DPR,0,0); ctx.clearRect(0,0,W,H);
    const small = W < 520;
    ctx.font = '10.5px "JetBrains Mono", monospace'; ctx.textBaseline = "middle"; ctx.textAlign = "right";
    for (let s = .2; s <= 1.001; s += .2){ const y = Y(s); ctx.strokeStyle = "rgba(255,255,255,.05)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W-pad.r, y); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.3)"; ctx.fillText(s.toFixed(1), pad.l-10, y); }
    ctx.save(); ctx.translate(14, (pad.t+H-pad.b)/2); ctx.rotate(-Math.PI/2); ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillText("capability", 0, 0); ctx.restore(); ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.fillText("↑", 14, pad.t + 2);
    ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillText("time →", W-pad.r, H-10);
    // ghost of the whole run
    const U0 = U[0]-.04, Ulast = U[N-2];
    ctx.setLineDash([3,6]); ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let k = 0; k <= 200; k++){ const u = U0 + (U[N-1]-U0)*k/200; k ? ctx.lineTo(X(u),Y(score(u))) : ctx.moveTo(X(u),Y(score(u))); } ctx.stroke(); ctx.setLineDash([]);
    // trained part: area + glow stroke + crisp stroke
    const pts = []; for (let k = 0; k <= 220; k++){ const u = U0 + (drawU-U0)*k/220; pts.push([X(u), Y(score(u)), u]); }
    const ag = ctx.createLinearGradient(0, pad.t, 0, H-pad.b); ag.addColorStop(0,"rgba(122,245,255,.2)"); ag.addColorStop(1,"rgba(122,245,255,0)");
    ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(pts[0][0], H-pad.b); pts.forEach(q => ctx.lineTo(q[0],q[1])); ctx.lineTo(pts[pts.length-1][0], H-pad.b); ctx.closePath(); ctx.fill();
    const lg = ctx.createLinearGradient(X(U0),0,X(U[N-1]),0); lg.addColorStop(0,"#cfd6e6"); lg.addColorStop(.35,"#b48cff"); lg.addColorStop(.6,"#59d0ff"); lg.addColorStop(.85,"#7af5ff"); lg.addColorStop(1,"#f4efe4");
    const path = (from, to) => { ctx.beginPath(); let st = false; pts.forEach(q => { if (q[2] < from || q[2] > to) return; st ? ctx.lineTo(q[0],q[1]) : (ctx.moveTo(q[0],q[1]), st = true); }); };
    ctx.strokeStyle = "rgba(122,245,255,.16)"; ctx.lineWidth = 9; path(-1, Ulast); ctx.stroke();
    ctx.strokeStyle = lg; ctx.lineWidth = 2.6; path(-1, Ulast); ctx.stroke();
    if (drawU > Ulast){ ctx.setLineDash([5,5]); path(Ulast, 9); ctx.stroke(); ctx.setLineDash([]); }
    // checkpoints
    ctx.textAlign = "center";
    JOURNEY.forEach((c,i) => {
      const x = X(U[i]), y = Y(score(U[i])), passed = U[i] <= drawU + .012, cur = i === idx, r = cur ? 7 : 5;
      ctx.strokeStyle = `rgba(255,255,255,${cur ? .18 : .06})`; ctx.lineWidth = 1; ctx.setLineDash([2,4]); ctx.beginPath(); ctx.moveTo(x, y+9); ctx.lineTo(x, H-pad.b); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x,y-r); ctx.lineTo(x+r,y); ctx.lineTo(x,y+r); ctx.lineTo(x-r,y); ctx.closePath();
      if (passed){ ctx.fillStyle = c.color; ctx.fill(); } else { ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1.2; ctx.stroke(); }
      if (cur || i === hover){ ctx.strokeStyle = hexA(c.color, .75); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, 13+Math.sin(T*4)*2, 0, 6.283); ctx.stroke(); }
      if (!small || cur){ ctx.font = `${cur?600:400} ${small?9.5:10.5}px "JetBrains Mono", monospace`; ctx.fillStyle = cur ? c.color : passed ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.25)"; ctx.fillText(c.tag, x, H-pad.b+18); }
      if (passed && !cur && !small){ ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillText(c.id, x, y+20); }
    });
    // head
    const hx = X(drawU), hy = Y(score(drawU));
    ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.arc(hx, hy, 12, 0, 6.283); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(hx, hy, 3.5, 0, 6.283); ctx.fill();
  }

  /* ---------- input ---------- */
  const near = (cx, cy, lim=22) => { const r = cv.getBoundingClientRect(), x = cx-r.left, y = cy-r.top; let best = -1, bd = lim;
    JOURNEY.forEach((c,i) => { const d = Math.hypot(X(U[i])-x, Y(score(U[i]))-y); if (d < bd){ bd = d; best = i; } }); return best; };
  cv.addEventListener("pointermove", e => { if (e.pointerType !== "mouse") return; hover = near(e.clientX, e.clientY); cv.style.cursor = hover >= 0 ? "pointer" : "default";
    const tip = $("#tip"); if (hover >= 0){ const c = JOURNEY[hover]; tip.innerHTML = `<span style="color:${c.color}">◆</span> ${c.id} · ${esc(c.title)} <span style="color:var(--dim)">· click to enter</span>`;
      tip.style.left = (e.clientX+14)+"px"; tip.style.top = (e.clientY+14)+"px"; tip.classList.add("on"); } else tip.classList.remove("on"); });
  cv.addEventListener("pointerleave", () => { hover = -1; $("#tip").classList.remove("on"); });
  cv.addEventListener("click", e => { const i = near(e.clientX, e.clientY, 34); if (i >= 0) Portal.open(i, {x:e.clientX, y:e.clientY}); });

  function point(){ if (!visible || !W) return null; return {x:chartLeft + X(drawU), y:stageTop() + chartOffTop + Y(score(drawU)), color:JOURNEY[Math.max(0,idx)].color}; }
  return { measure, resize:measure, update, render, point, goto, hooks, chartTop:() => stageTop() + chartOffTop, get idx(){ return idx; } };
})();
