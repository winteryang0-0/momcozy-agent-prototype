/* Stable per-layer motion; colors are resolved independently from geometry. */
(()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const seeds=[{phase:.73,speed:1.16,amp:1},{phase:3.41,speed:.83,amp:.86}];
  function layerMotion(seconds,seed,active){
    const t=seconds*seed.speed*(active?1.35:.7)+seed.phase;
    const a=seed.amp*(active?1:.7);
    return {transform:`translate(${Math.sin(t)*9*a}px,${Math.sin(t*.79+1)*7*a}px) rotate(${Math.sin(t*.61)*13*a}deg) scale(${1+Math.sin(t*.87)*.045*a})`,radius:`${48+Math.sin(t)*12}% ${52-Math.sin(t)*12}% ${50+Math.sin(t*.81)*11}% ${50-Math.sin(t*.81)*11}% / ${50+Math.sin(t*.71+1)*13}% ${50-Math.sin(t*.71+1)*13}% ${49+Math.sin(t*.93)*10}% ${51-Math.sin(t*.93)*10}%`};
  }
  function layerColors(theme,intent,context){
    const themes={blue:['151,199,244','165,224,213'],sage:['148,202,180','206,224,175'],rose:['236,174,193','245,208,175'],lavender:['193,178,235','177,212,237']};
    const intents={sleep:['192,180,235','177,206,238'],feeding:['239,218,165','173,222,202'],feelings:['235,187,208','204,193,237'],care:['163,222,204','179,217,240']};
    const c=context==='welcome'?(intents[intent]||themes[theme]||themes.blue):(themes[theme]||themes.blue);
    return c.map((rgb,i)=>`rgba(${rgb},${context==='welcome'?(intent.length ? .26 : .12):(i ? .24 : .32)})`);
  }
  window.CozieMotion={layerMotion,layerColors};
  function recordingColors(el,theme,intent){
    if(!el._openingColors)el._openingColors=layerColors(theme,intent,'welcome');
    const progress=Math.min(1,Math.max(0,Number(document.querySelector('#record-progress')?.value||0)/10));
    const green=[[105,193,161,.26],[139,211,177,.24]];
    return el._openingColors.map((color,i)=>{
      const from=color.match(/[\d.]+/g).map(Number);
      return `rgba(${from.map((v,j)=>v+(green[i][j]-v)*progress).join(',')})`;
    });
  }
  let last=0;
  function frame(ms){
    if(ms-last>32){last=ms;const theme=document.documentElement.dataset.cozieTheme||'blue';const intent=document.querySelector('#app')?.dataset.intent||'';
      const app=document.querySelector('#app');const quiet=reduce.matches||document.body.classList.contains('reduced-motion');
   if(app?.classList.contains('is-voice-active')){const colors=layerColors(theme,intent,'voice');app.style.setProperty('--edge-a',colors[0]);app.style.setProperty('--edge-b',colors[1]);app.style.setProperty('--edge-width',(quiet?8:10+Math.sin(ms/1000*2.2+.73)*4)+'px');app.style.setProperty('--edge-angle',(quiet?25:25+Math.sin(ms/1000*1.3+3.41)*70)+'deg');}
   document.querySelectorAll('#welcome,#ob-voice-live,#audio-capture,.cozie-voice-orbit').forEach(el=>{
        if(el.hidden||!el.getClientRects().length)return;
        const context=el.id==='welcome'?'welcome':'voice';const colors=el.id==='audio-capture'?recordingColors(el,theme,intent):layerColors(theme,intent,context);
        seeds.forEach((seed,i)=>{const m=layerMotion(quiet?0:ms/1000,seed,context==='voice');el.style.setProperty(`--wave-${i}-transform`,el.id==='audio-capture'?(quiet?'':m.transform)+' scale('+(0.65+Math.min(1,Number(document.querySelector('#record-progress')?.value||0)/30)*0.35)+')':quiet?'none':m.transform);el.style.setProperty(`--wave-${i}-radius`,m.radius);el.style.setProperty(`--wave-${i}-color`,colors[i]);});
      });
    }requestAnimationFrame(frame);
  }requestAnimationFrame(frame);
})();
