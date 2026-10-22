/* Shared source artwork for hero, Dock and conversation avatars. */
const Companion=(()=>{
 const bounds=[[20,177,496,452],[19,177,496,451],[18,176,493,452],[20,106,496,381],[19,106,496,381],[17,106,493,381]],img=new Image(),players=new Map();
 let loaded=false,reduce=false;const media=matchMedia('(prefers-reduced-motion: reduce)');
 const visible=c=>c.isConnected&&!document.hidden&&!c.closest('[hidden]');
 img.onload=()=>{loaded=true;refresh();};img.src='assets/soft-expressions.png';
 function mount(c){
  let state=c.dataset.companion||'ready';if(!STATES[state])state='ready';
  const reduced=reduce||media.matches||c.dataset.static==='true',loop=c.dataset.loop==='true'&&state==='ready';
  const old=players.get(c);
  if(old&&old.state===state&&old.reduced===reduced&&old.loop===loop){if(!old.raf&&visible(c))old.draw(performance.now());return;}
  if(old)cancelAnimationFrame(old.raf);
  const p={state,elapsed:0,last:null,raf:0,reduced,loop};players.set(c,p);
  const ctx=c.getContext('2d');c.setAttribute('aria-label','Momcozy AI：'+STATES[state].name);c.dataset.motionState=state;
  function draw(stamp){
   p.raf=0;if(!c.isConnected){players.delete(c);return;}if(!loaded||!visible(c)){p.last=null;return;}
   if(p.last!==null&&!p.reduced)p.elapsed+=stamp-p.last;p.last=stamp;
   const pose=poseAt(state,p.elapsed,p.reduced);
   if(p.loop&&!p.reduced){const phase=p.elapsed%6000;pose.dy=-5*(1-Math.cos(phase/6000*Math.PI*2))/2;pose.sx=1+.008*Math.sin(phase/6000*Math.PI*2);pose.sy=1+.012*Math.sin(phase/6000*Math.PI*2);pose.frame=phase>=4600&&phase<4740?2:0;}
   const f=pose.frame,b=bounds[f],pad=8;
   ctx.clearRect(0,0,640,420);ctx.save();ctx.translate(320+pose.dx,300+pose.dy);ctx.rotate(pose.rotate*Math.PI/180);ctx.scale(pose.sx,pose.sy);ctx.translate(-320,-300);ctx.drawImage(img,(f%3)*512+b[0]-pad,Math.floor(f/3)*512+b[1]-pad,b[2]-b[0]+1+pad*2,b[3]-b[1]+1+pad*2,40,70,560,332);ctx.restore();c.dataset.frame=f;
   c.dataset.motionTime=String(Math.round(p.elapsed));c.dataset.motionLoop=String(p.loop&&!p.reduced);
   if(!p.reduced&&(p.loop||p.elapsed<STATES[state].duration||state==='speaking'))p.raf=requestAnimationFrame(draw);
  }
  p.draw=draw;draw(performance.now());
 }
 function refresh(){for(const[c,p]of players){if(!c.isConnected){cancelAnimationFrame(p.raf);players.delete(c);}else if(!visible(c)){cancelAnimationFrame(p.raf);p.raf=0;p.last=null;}}document.querySelectorAll('canvas[data-companion]').forEach(mount);}
 document.addEventListener('visibilitychange',()=>{for(const p of players.values()){cancelAnimationFrame(p.raf);p.raf=0;p.last=null;}if(!document.hidden)refresh();});
 media.addEventListener('change',refresh);return{refresh,setReduced(v){reduce=v;refresh();}};
})();
