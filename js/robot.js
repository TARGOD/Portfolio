/* =====================================================================
   robot.js: UNIT-VB, the guide. Lives on a fixed overlay canvas and is
   driven by whichever section is on screen (see main.js).
   ===================================================================== */
const Bot = (() => {
  const cv = $("#botcv"), ctx = cv.getContext("2d"), bubble = $("#bubble");
  let W = 0, H = 0, DPR = 1;
  const b = { x:-160, y:320, vx:0, vy:0, tx:200, ty:320, lx:0, ly:0, blink:1, blinkT:2,
              mood:"neutral", moodT:0, spin:0, spinV:0, working:false, carrying:false,
              look:null, beam:null, s:1, sayT:0 };

  function resize(){ DPR = Math.min(innerWidth < 900 ? 1 : 1.5, devicePixelRatio||1); W = innerWidth; H = innerHeight;
    cv.width = W*DPR; cv.height = H*DPR; b.s = W < 760 ? .7 : 1; }
  function target(x,y){ b.tx = clamp(x, 56*b.s, W-56*b.s); b.ty = clamp(y, 118, H-78*b.s); }
  const hooks = {}, conf = [];
  let bw = 0, bh = 0;
  function say(text, d=2.8){ bubble.textContent = text; bubble.classList.add("on"); b.sayT = d; bw = bubble.offsetWidth; bh = bubble.offsetHeight; hooks.onSay && hooks.onSay(text); }
  function confetti(){ const cols = ["#7af5ff","#b48cff","#ffb454","#5fe3a1","#ff6b8b","#f4efe4"];
    for (let i = 0; i < 180; i++) conf.push({x:Math.random()*W, y:-20-Math.random()*260, vx:(Math.random()-.5)*140, vy:120+Math.random()*220, r:Math.random()*6, s:2+Math.random()*3, c:cols[i%6], life:3}); }
  function mood(m, d=1.4){ b.mood = m; b.moodT = d; }
  const EGGS = ["I never hallucinate. Vijay grounds me with RAG.","Beep. Everything I do is traced, so be nice.",
    "100% vanilla JS. No frameworks were harmed.","Ask me about MCP. Actually, don't. I'll never stop.",
    "Context window: full of LangGraph.","I passed my evals. Mostly."];
  function poke(){ b.spinV = 14; mood("happy",1.6); say(EGGS[Math.floor(Math.random()*EGGS.length)], 3); }
  const hit = (x,y) => Math.hypot(x-b.x, y-b.y) < 46*b.s;

  function update(dt, T, mouse){
    const K = 30, D = 10.5;
    b.vx += ((b.tx-b.x)*K - b.vx*D)*dt; b.vy += ((b.ty-b.y)*K - b.vy*D)*dt;
    const sp = Math.hypot(b.vx,b.vy), MAX = 1050; if (sp > MAX){ b.vx *= MAX/sp; b.vy *= MAX/sp; }
    b.x += b.vx*dt; b.y += b.vy*dt;
    b.spin += b.spinV*dt; b.spinV *= Math.pow(.05,dt); if (Math.abs(b.spinV) < .3) b.spin *= Math.pow(.001,dt);
    const L = b.look || (mouse.in ? mouse : null);
    let lx = 0, ly = 0;
    if (L){ const dx = L.x-b.x, dy = L.y-b.y, d = Math.hypot(dx,dy)||1; lx = dx/d*Math.min(6,d/30); ly = dy/d*Math.min(4,d/30); }
    b.lx += (lx-b.lx)*Math.min(1,dt*10); b.ly += (ly-b.ly)*Math.min(1,dt*10);
    b.blinkT -= dt;
    if (b.blinkT < 0){ b.blink = Math.max(.1, b.blink-dt*16); if (b.blinkT < -.12) b.blinkT = 2+Math.random()*3; }
    else b.blink = Math.min(1, b.blink+dt*12);
    if (b.moodT > 0){ b.moodT -= dt; if (b.moodT <= 0) b.mood = "neutral"; }
    if (b.sayT > 0){ b.sayT -= dt; if (b.sayT <= 0) bubble.classList.remove("on"); }
    if (b.sayT <= 0) return;
    const hw = bw/2 + 8;
    const bx = clamp(b.x, hw, W-hw), by = Math.max(bh + 64, b.y - (b.carrying?94:74)*b.s);
    bubble.style.transform = `translate(${bx}px,${by}px) translate(-50%,-100%)`;
  }

  const rr = (x,y,w,h,r) => { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); };

  function drawBeam(T){
    const B = b.beam; if (!B) return;
    const sx = b.x, sy = b.y + 38*b.s, col = B.color || "#7af5ff";
    if (B.style === "line"){
      ctx.strokeStyle = hexA(col,.45); ctx.lineWidth = 1.2; ctx.setLineDash([2,5]); ctx.lineDashOffset = -T*40;
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(B.x,B.y); ctx.stroke(); ctx.setLineDash([]);
      return;
    }
    const w0 = 6*b.s, w1 = (B.r||14)*1.15;
    const g = ctx.createLinearGradient(sx,sy,B.x,B.y); g.addColorStop(0,hexA(col,.32)); g.addColorStop(1,hexA(col,.05));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx-w0,sy); ctx.lineTo(sx+w0,sy); ctx.lineTo(B.x+w1,B.y); ctx.lineTo(B.x-w1,B.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = hexA(col,.5); ctx.lineWidth = 1; ctx.setLineDash([2,6]); ctx.lineDashOffset = -T*40;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(B.x,B.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = hexA(col,.7); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(B.x,B.y,(B.r||14)+5+Math.sin(T*9)*2,0,6.283); ctx.stroke();
  }

  function drawBody(T){
    const s = b.s, rot = clamp(b.vx*.0007,-.38,.38) + b.spin, bob = Math.sin(T*3.2)*3;
    ctx.save(); ctx.translate(b.x, b.y+bob); ctx.rotate(rot); ctx.scale(s,s);
    // thruster
    const fl = 14 + Math.random()*9 + Math.max(0,-b.vy)*.018 + Math.min(20, Math.hypot(b.vx,b.vy)*.012);
    const g = ctx.createLinearGradient(0,38,0,38+fl*1.4);
    g.addColorStop(0,"rgba(255,220,140,.95)"); g.addColorStop(.4,"rgba(255,140,70,.7)"); g.addColorStop(1,"rgba(255,80,60,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-8,38); ctx.quadraticCurveTo(0,38+fl*1.8,8,38); ctx.closePath(); ctx.fill();
    // arms
    ctx.strokeStyle = "#c9c3b5"; ctx.lineWidth = 5; ctx.lineCap = "round";
    const arm = (sx,hx,hy) => { ctx.beginPath(); ctx.moveTo(sx,22); ctx.quadraticCurveTo(sx*1.6,30,hx,hy); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx,hy+4,5,Math.PI*1.15,Math.PI*1.85,true); ctx.stroke(); ctx.lineWidth = 5; };
    const sw = Math.sin(T*4)*5;
    if (b.mood === "wave"){ arm(-15,-30,36+sw); arm(15,40,-8+Math.sin(T*12)*9); }
    else if (b.carrying){ arm(-15,-14,44); arm(15,14,44); }
    else { arm(-15,-30,36+sw); arm(15,30,36-sw); }
    // torso
    rr(-17,14,34,24,8); ctx.fillStyle = "#d8d2c4"; ctx.fill();
    rr(-10,36,20,5,2); ctx.fillStyle = "#2a2f3a"; ctx.fill();
    ctx.fillStyle = b.working ? (Math.sin(T*10)>0 ? "#ffb454" : "#6b4a1d") : "#5fe3a1";
    ctx.beginPath(); ctx.arc(0,25,3,0,6.283); ctx.fill();
    // head
    ctx.fillStyle = "#c9c3b5"; rr(-42,-12,8,20,3); ctx.fill(); rr(34,-12,8,20,3); ctx.fill();
    rr(-36,-32,72,52,17); const hg = ctx.createLinearGradient(0,-32,0,20); hg.addColorStop(0,"#fbf8f1"); hg.addColorStop(1,"#d9d3c5"); ctx.fillStyle = hg; ctx.fill();
    rr(-29,-25,58,38,12); ctx.fillStyle = "#0a0e16"; ctx.fill();
    rr(-25,-22,26,6,3); ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fill();
    // face
    const lx = b.lx, ly = b.ly;
    ctx.shadowColor = b.mood === "error" ? "#ff6b8b" : "#7af5ff"; ctx.shadowBlur = 14;
    if (b.mood === "happy" || b.mood === "wave"){
      ctx.strokeStyle = "#7af5ff"; ctx.lineWidth = 3; ctx.lineCap = "round";
      [-11,11].forEach(ex => { ctx.beginPath(); ctx.arc(ex+lx*.5,-4+ly*.5,6,Math.PI*1.1,Math.PI*1.9); ctx.stroke(); });
      ctx.shadowBlur = 0; ctx.fillStyle = "rgba(255,143,177,.55)"; ctx.beginPath(); ctx.arc(-20,4,3.5,0,6.283); ctx.arc(20,4,3.5,0,6.283); ctx.fill();
    } else if (b.mood === "error"){
      ctx.strokeStyle = "#ff6b8b"; ctx.lineWidth = 3; ctx.lineCap = "round";
      [-11,11].forEach(ex => { ctx.beginPath(); ctx.moveTo(ex-5,-11); ctx.lineTo(ex+5,-1); ctx.moveTo(ex+5,-11); ctx.lineTo(ex-5,-1); ctx.stroke(); });
    } else {
      ctx.fillStyle = "#7af5ff"; const eh = 14*b.blink;
      [-11,11].forEach(ex => { rr(ex-4.5+lx,-6-eh/2+ly,9,Math.max(2,eh),4.5); ctx.fill(); });
    }
    ctx.shadowBlur = 0;
    // antenna
    ctx.strokeStyle = "#c9c3b5"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0,-32); ctx.lineTo(0,-44); ctx.stroke();
    const on = b.working ? Math.sin(T*12) > 0 : true;
    ctx.fillStyle = on ? "#ffb454" : "#6b4a1d"; if (on){ ctx.shadowColor = "#ffb454"; ctx.shadowBlur = 16; }
    ctx.beginPath(); ctx.arc(0,-48,5,0,6.283); ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();
    ctx.font = '500 9.5px "JetBrains Mono", monospace'; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.3)";
    ctx.fillText("UNIT-VB", b.x, b.y + bob + (b.carrying ? -62 : 72)*s);
  }

  function draw(T){
    ctx.setTransform(DPR,0,0,DPR,0,0); ctx.clearRect(0,0,W,H);
    bubble.style.visibility = (b.hidden || b.quiet) ? "hidden" : "";
    if (!b.hidden){ drawBeam(T); drawBody(T); }
    for (let i = conf.length-1; i >= 0; i--){ const p = conf[i]; p.vy += 40/60; p.x += p.vx/60; p.y += p.vy/60; p.r += .1; p.life -= 1/60;
      if (p.life <= 0 || p.y > H+20){ conf.splice(i,1); continue; } ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s,-p.s/2,p.s*2,p.s); ctx.restore(); }
  }

  return { b, resize, target, say, mood, poke, hit, update, draw, hooks, confetti };
})();
