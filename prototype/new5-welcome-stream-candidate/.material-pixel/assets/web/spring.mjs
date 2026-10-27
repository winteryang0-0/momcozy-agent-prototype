/** Original analytic spring adapter. Constants are the pinned S5 baseline; not an official SDK. */
export const presets = Object.freeze({
  fastSpatial: Object.freeze({dampingRatio:.6, stiffness:800}),
  defaultSpatial: Object.freeze({dampingRatio:.8, stiffness:380}),
  slowSpatial: Object.freeze({dampingRatio:.8, stiffness:200}),
  fastEffects: Object.freeze({dampingRatio:1, stiffness:3800}),
  defaultEffects: Object.freeze({dampingRatio:1, stiffness:1600}),
  slowEffects: Object.freeze({dampingRatio:1, stiffness:800})
});
export function sampleSpring(position, velocity, target, dt, {dampingRatio:z,stiffness:k}) {
  if (![position,velocity,target,dt,z,k].every(Number.isFinite) || dt<0 || z<=0 || z>1 || k<=0)
    throw new RangeError('Require finite state, dt>=0, 0<dampingRatio<=1, stiffness>0');
  const w=Math.sqrt(k), y=position-target;
  if(z===1){const b=velocity+w*y, e=Math.exp(-w*dt);return {position:target+(y+b*dt)*e,velocity:(velocity-w*b*dt)*e};}
  const a=z*w,d=w*Math.sqrt(1-z*z),b=(velocity+a*y)/d,e=Math.exp(-a*dt),c=Math.cos(d*dt),s=Math.sin(d*dt);
  return {position:target+e*(y*c+b*s),velocity:e*((-a*y+b*d)*c+(-a*b-y*d)*s)};
}
export function createSpring({initial=0,preset=presets.defaultSpatial,onUpdate,epsilon=.001,
  requestFrame=cb=>requestAnimationFrame(cb),cancelFrame=id=>cancelAnimationFrame(id),
  now=()=>performance.now(),media=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')}={}) {
  if(typeof onUpdate!=='function'||!Number.isFinite(epsilon)||epsilon<=0)throw new TypeError('onUpdate and positive epsilon required');
  sampleSpring(initial,0,initial,0,preset);
  let position=initial,velocity=0,target=initial,last=now(),frame=null,disposed=false;
  const notify=()=>onUpdate(position,velocity);
  function stop(){if(frame!==null)cancelFrame(frame);frame=null;}
  function advance(t){const dt=Math.max(0,(t-last)/1000);last=t;({position,velocity}=sampleSpring(position,velocity,target,dt,preset));}
  function finish(){stop();position=target;velocity=0;last=now();notify();}
  function tick(t){frame=null;if(disposed)return;advance(t);
    if(Math.abs(position-target)<=epsilon&&Math.abs(velocity)<=epsilon){finish();return;}
    notify();if(!disposed&&frame===null)frame=requestFrame(tick);
  }
  function preference(){if(media?.matches&&!disposed)finish();}
  media?.addEventListener?.('change',preference);
  return {
    to(value){if(disposed)throw new Error('Spring disposed');if(!Number.isFinite(value))throw new TypeError('Finite target required');
      const t=now();if(frame!==null)advance(t);else last=t;target=value;
      if(media?.matches){finish();return;}
      if(frame===null)frame=requestFrame(tick);
    },
    // For direct gesture tracking; pass release velocity in value-units / second.
    set(value,nextVelocity=0){if(disposed)throw new Error('Spring disposed');if(![value,nextVelocity].every(Number.isFinite))throw new TypeError('Finite state required');
      stop();position=target=value;velocity=nextVelocity;last=now();notify();},
    get state(){return {position,velocity,target};},
    dispose(){stop();disposed=true;media?.removeEventListener?.('change',preference);}
  };
}
// Use clamp01 for alpha and bounded effects; do not clamp geometry's intended overshoot.
export const clamp01 = value => Math.max(0,Math.min(1,value));
