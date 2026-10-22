import React,{useEffect,useRef,useState} from 'react';
import {STATES,poseAt} from './motion-model.mjs';
// Source raster frames are aligned at runtime; no character geometry is drawn in code.
const BOUNDS=[[20,177,496,452],[19,177,496,451],[18,176,493,452],[20,106,496,381],[19,106,496,381],[17,106,493,381]];
export function Avatar({state,revision,reduced,paused,speed,size=420}){
 const canvas=useRef(null),time=useRef(0),lastRevision=useRef(-1),image=useRef(null);
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{let alive=true;const img=new Image();img.src=new URL('../assets/soft-expressions.png',import.meta.url).href;img.onload=()=>{if(alive){image.current=img;setReady(true);}};img.onerror=()=>{if(alive)setFailed(true);};return()=>{alive=false;};},[]);
 useEffect(()=>{if(!ready||!canvas.current)return;if(lastRevision.current!==revision){time.current=0;lastRevision.current=revision;}let handle,last=null;const ctx=canvas.current.getContext('2d');
  const render=stamp=>{if(last!==null&&!paused&&!reduced)time.current+=(stamp-last)*speed;last=stamp;const p=poseAt(state,time.current,reduced),f=p.frame,b=BOUNDS[f],pad=8;
   ctx.clearRect(0,0,640,420);ctx.save();ctx.translate(320+p.dx,300+p.dy);ctx.rotate(p.rotate*Math.PI/180);ctx.scale(p.sx,p.sy);ctx.translate(-320,-300);
   ctx.drawImage(image.current,(f%3)*512+b[0]-pad,Math.floor(f/3)*512+b[1]-pad,b[2]-b[0]+1+pad*2,b[3]-b[1]+1+pad*2,40,70,560,332);ctx.restore();canvas.current.dataset.frame=String(f);
   if(!paused&&!reduced&&(time.current<STATES[state].duration||state==='speaking'))handle=requestAnimationFrame(render);
  };render(performance.now());return()=>cancelAnimationFrame(handle);
 },[ready,state,revision,reduced,paused,speed]);
 return <div className="avatar-wrap" style={{width:size,maxWidth:'100%'}}><canvas ref={canvas} width="640" height="420" role="img" aria-label={`软石角色：${STATES[state].name}`} data-testid="avatar"/>{!ready&&!failed&&<span className="asset-message">正在加载软石形象…</span>}{failed&&<span className="asset-message" role="alert">形象资源未加载，请刷新页面。</span>}</div>;
}
