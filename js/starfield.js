import * as THREE from './vendor/three/three.module.min.js';

// Original particle shader. A sampled spiral path is stored in a GPU texture;
// motion and scroll displacement are calculated per vertex, without CPU updates.
export function mountStarfield(host, hero, signal) {
  const compact = matchMedia('(max-width: 767px)').matches;
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,compact ? 1.25 : 1.5));
  renderer.setClearColor(0x000000,0);
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48,1,.1,50);
  camera.position.z = 9;
  const samples=256, data=new Float32Array(samples*4);
  for(let i=0;i<samples;i++) {
    const t=i/(samples-1)*Math.PI*2;
    data[i*4]=Math.cos(t)*3.6;
    data[i*4+1]=Math.sin(t)*1.6;
    data[i*4+2]=Math.sin(t*2)*.6;
    data[i*4+3]=1;
  }
  const texture = new THREE.DataTexture(data,samples,1,THREE.RGBAFormat,THREE.FloatType);
  texture.needsUpdate=true;
  const count=compact ? 4000 : 12000;
  const positions=new Float32Array(count*3), seeds=new Float32Array(count*4);
  // Deterministic arrangement, stable through reloads.
  let seed=1729;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<count;i++) for(let j=0;j<4;j++) seeds[i*4+j]=random();
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('seed',new THREE.BufferAttribute(seeds,4));
  const uniforms={uTime:{value:0},uScroll:{value:0},uPath:{value:texture},uPixel:{value:renderer.getPixelRatio()},uPulse:{value:0},uExplore:{value:0}};
  const material=new THREE.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute vec4 seed;
      uniform sampler2D uPath; uniform float uTime,uScroll,uPixel,uPulse,uExplore;
      varying float vAlpha; varying vec3 vColor;
      void main(){
        float phase=fract(seed.x+uTime*.025);
        vec3 p=texture2D(uPath,vec2(phase,.5)).xyz;
        float angle=seed.y*6.28318+uTime*.1;
        float spread=.12+pow(seed.z,3.)*.95;
        p+=vec3(cos(angle)*spread,sin(angle)*spread,(seed.w-.5)*1.8);
        p*=1.+uScroll*.75+uPulse*.12;
        p.y+=sin(seed.x*30.+uTime*.25)*.06;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=min(20.,(2.+seed.w*4.)*uPixel*10./max(1.,-mv.z));
        vAlpha=(.5+seed.z*.5)*(1.-uScroll*.65)*mix(.7,1.5,uExplore);
        vColor=mix(vec3(.42,.72,1.),vec3(1.,.77,.9),seed.y);
      }`,
    fragmentShader:`varying float vAlpha; varying vec3 vColor;
      void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;
      float halo=exp(-d*d*3.);float core=exp(-d*d*24.);
      gl_FragColor=vec4(vColor+core*.3,(halo*.55+core*.45)*vAlpha);}`
  });
  const points=new THREE.Points(geometry,material);
  points.frustumCulled=false;
  points.rotation.z=-.3;
  scene.add(points);
  let raf=0,visible=true,paused=false,lost=false,disposed=false,drag=null,yaw=0,pitch=0,last=0,elapsed=0;
  const on=(node,event,fn)=>node.addEventListener(event,fn,{signal});
  const resize=()=>{const r=host.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/Math.max(1,r.height);camera.position.z=camera.aspect<1 ? 15 : 9;camera.updateProjectionMatrix();};
  const ro=new ResizeObserver(resize);ro.observe(host);resize();
  const animate=now=>{
    raf=0;if(disposed||!visible||document.hidden||paused||lost)return;
    elapsed+=Math.min((now-last)/1000,.05);last=now;
    uniforms.uTime.value=elapsed;
    const exploring=hero.classList.contains('star-interacting');
    uniforms.uExplore.value+=((exploring?1:0)-uniforms.uExplore.value)*.08;
    uniforms.uScroll.value=Math.max(0,Math.min(1,-hero.getBoundingClientRect().top/hero.offsetHeight));
    uniforms.uPulse.value*=.95;
    points.rotation.y+=(yaw+Math.sin(elapsed*.16)*.18-points.rotation.y)*.05;
    points.rotation.x+=(pitch-points.rotation.x)*.05;
    renderer.render(scene,camera);raf=requestAnimationFrame(animate);
  };
  const resume=()=>{if(!disposed&&visible&&!document.hidden&&!paused&&!lost&&!raf){last=performance.now();raf=requestAnimationFrame(animate);}};
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(raf);raf=0;}resume();});io.observe(hero);
  on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else resume();});
  on(host,'pointerdown',e=>{drag={x:e.clientX,y:e.clientY};host.setPointerCapture(e.pointerId);});
  on(host,'pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.008;pitch+=(e.clientY-drag.y)*.008;drag={x:e.clientX,y:e.clientY};});
  on(host,'pointerup',()=>drag=null);on(host,'pointercancel',()=>drag=null);
  on(host,'keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();yaw+=(e.key==='ArrowLeft'?-.15:e.key==='ArrowRight'?.15:0);pitch+=(e.key==='ArrowUp'?-.15:e.key==='ArrowDown'?.15:0);});
  on(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;host.hidden=true;hero.dispatchEvent(new Event('starfield-unavailable'));});
  resume();
  return {pulse(){uniforms.uPulse.value=1;},pause(value){paused=value;if(paused){cancelAnimationFrame(raf);raf=0;}else resume();},dispose(){disposed=true;cancelAnimationFrame(raf);io.disconnect();ro.disconnect();geometry.dispose();material.dispose();texture.dispose();renderer.dispose();renderer.domElement.remove();}};
}
