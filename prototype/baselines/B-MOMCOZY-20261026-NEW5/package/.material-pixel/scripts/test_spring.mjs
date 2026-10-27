import assert from 'node:assert/strict';
import {sampleSpring,createSpring,presets,clamp01} from '../assets/web/spring.mjs';
for(const preset of Object.values(presets)){
  const end=sampleSpring(0,0,1,5,preset);assert.ok(Math.abs(end.position-1)<1e-8);assert.ok(Math.abs(end.velocity)<1e-7);
}
assert.throws(()=>sampleSpring(0,0,1,1,{dampingRatio:2,stiffness:1}));
// Analytic solution is timestep-independent, including background elapsed time.
const a=sampleSpring(0,4,1,.2,presets.defaultSpatial);
const b=sampleSpring(a.position,a.velocity,1,.3,presets.defaultSpatial);
const c=sampleSpring(0,4,1,.5,presets.defaultSpatial);assert.ok(Math.abs(b.position-c.position)<1e-12);
let time=0,id=0,queue=new Map(),handler;
const media={matches:false,addEventListener(_,fn){handler=fn},removeEventListener(){handler=null}};
const spring=createSpring({onUpdate(){},now:()=>time,media,requestFrame:fn=>{queue.set(++id,fn);return id},cancelFrame:n=>queue.delete(n)});
spring.to(1);time=70;let entry=[...queue][0];queue.delete(entry[0]);entry[1](time);
const before=spring.state;spring.to(0);assert.equal(spring.state.position,before.position);assert.equal(spring.state.velocity,before.velocity);assert.equal(queue.size,1);
media.matches=true;handler();assert.equal(spring.state.position,0);assert.equal(queue.size,0);
spring.to(1);assert.equal(spring.state.position,1);assert.equal(queue.size,0);
spring.dispose();assert.equal(handler,null);assert.throws(()=>spring.to(2));assert.equal(clamp01(1.5),1);
console.log('PASS: spring settling, timestep independence, interruption continuity, reduced-motion changes, cleanup, bounds');
