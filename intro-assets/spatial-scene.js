import * as THREE from '/intro-assets/three.module.min.js';
import {ease,pulse,clamp,cameraAt,topology,relations} from './story-state.js';
import {createWater,noiseGLSL} from './ink-water.js';
import {createInkProcess} from './ink-process.js';

export async function mount(host,getProgress){
  const debugPixels=new URLSearchParams(location.search).has('debugPixels');
  const compact=matchMedia('(max-width:700px)').matches,count=compact?6000:12000;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.025,30);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:!compact});
  renderer.setPixelRatio(Math.min(devicePixelRatio,compact?1.25:1.6));
  renderer.setClearColor(0xf4f3ef,1);host.append(renderer.domElement);
  const pointer=new THREE.Vector2(.5,.5),previous=pointer.clone(),velocity=new THREE.Vector2(),aim=new THREE.Vector2();
  let pointerAt=-100,firstPointer=true,disposed=false,raf,lastTime=performance.now(),time=0;
  const stage=host.closest('.my-stage'),resources=[];
  const water=createWater(renderer,scene,camera,compact);
  const inkProcess=createInkProcess(scene,compact);
  resources.push(inkProcess);
  function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
  function move(e){if(e.target.closest('button,a'))return;const r=host.getBoundingClientRect();pointer.set(clamp((e.clientX-r.left)/r.width),1-clamp((e.clientY-r.top)/r.height));if(firstPointer){previous.copy(pointer);firstPointer=false;}pointerAt=performance.now();}
  function leave(){firstPointer=true;aim.set(0,0);}
  stage.addEventListener('pointermove',move,{passive:true});stage.addEventListener('pointerleave',leave);window.addEventListener('resize',resize);resize();
  function reset(){water.replay();}
  window.addEventListener('moyuan:replay',reset);
  // Start the interactive water immediately, without waiting for artwork.
  let drawWorld=()=>{};
  renderer.debug.onShaderError=(gl,program,vs,fs)=>{host.dataset.shaderError='true';console.error(gl.getShaderInfoLog(vs),gl.getShaderInfoLog(fs));};
  function render(now){if(disposed)return;raf=requestAnimationFrame(render);const dt=Math.min(.033,Math.max(.001,(now-lastTime)/1000));lastTime=now;if(document.hidden||host.getBoundingClientRect().bottom<0||host.getBoundingClientRect().top>innerHeight)return;
    time+=dt;const t=getProgress(),c=cameraAt(t,camera.aspect);velocity.copy(pointer).sub(previous).clampScalar(-.08,.08);previous.copy(pointer);
    const recent=now-pointerAt<100;aim.lerp(firstPointer?new THREE.Vector2():pointer.clone().subScalar(.5),1-Math.exp(-dt*5));
    camera.position.set(c.x+aim.x*.075,c.y+aim.y*.045,c.z);camera.lookAt(c.x*.48,c.y*.5,c.targetZ);
    water.update(dt,time,t,pointer,velocity,recent?1:0,camera.aspect);drawWorld(t,time,aim);inkProcess.update(t,time);renderer.render(scene,camera);
    host.dataset.progress=t.toFixed(4);host.dataset.cameraZ=camera.position.z.toFixed(3);host.dataset.rendered='true';
    // Small pixel probe is page-owned QA; no browser credential/state access.
    if(debugPixels && Math.floor(time*2)!==Number(host.dataset.probeFrame)){
      const gl=renderer.getContext(),px=new Uint8Array(4);let visible=0,signature=0;
      for(let y=1;y<11;y++)for(let x=1;x<17;x++){gl.readPixels(Math.floor(gl.drawingBufferWidth*x/17),Math.floor(gl.drawingBufferHeight*y/11),1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);if(px[0]<225||px[1]<225||px[2]<220)visible++;signature=(signature*31+px[0]+px[1]*3+px[2]*7)>>>0;}
      host.dataset.visiblePixels=String(visible);host.dataset.pixelSignature=String(signature);host.dataset.probeFrame=String(Math.floor(time*2));
    }
  }
  raf=requestAnimationFrame(render);
  function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerleave',leave);window.removeEventListener('resize',resize);window.removeEventListener('moyuan:replay',reset);water.dispose();resources.forEach(r=>r.dispose());renderer.dispose();}
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();host.dataset.contextLost='true';document.querySelector('#fallback').classList.add('visible');dispose();});
  window.addEventListener('pagehide',e=>{if(!e.persisted)dispose();});
  try{
    const getJSON=async url=>{const r=await fetch(url);if(!r.ok)throw Error(url);return r.json();};
    const [data,logo]=await Promise.all([getJSON('/intro-assets/evolution-samples.json'),getJSON('/intro-assets/brand-logo-samples.json')]);
    const loader=new THREE.TextureLoader(),textures=await Promise.all([0,1,2].map(i=>loader.loadAsync('/intro-assets/evolution-'+i+'.webp')));
    const [birdTexture,featherTexture]=await Promise.all([loader.loadAsync('/images/home-ink-phoenix.png'),loader.loadAsync('/intro-assets/feather-isolated-v2.png')]);
    resources.push(...textures,birdTexture,featherTexture);textures[0]=birdTexture;
    [birdTexture,featherTexture].forEach(texture=>{texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());});
    if(disposed){textures.forEach(t=>t.dispose());return;}
    let state=127;const rand=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
    const secure=topology.map(n=>new THREE.Vector3(...n.p));
    const nodes=secure.map((n,i)=>n.clone().add(new THREE.Vector3((i%3-1)*.12,.1,-.22)));
    const seed=new Float32Array(count),cloud=new Float32Array(count*3),bird=new Float32Array(count*3),disperse=new Float32Array(count*3),stream=new Float32Array(count*3),network=new Float32Array(count*3),security=new Float32Array(count*3),mark=new Float32Array(count*3);
    for(let i=0;i<count;i++){seed[i]=rand();const s=i*3,x=data.stages[0][s]*1.778,y=data.stages[0][s+1];
      bird.set([x,y,Math.sin(x*4)*.13+Math.cos(y*7)*.04+(rand()-.5)*.055],s);
      cloud.set([(rand()-.5)*3.2,(rand()-.5)*2.1,-1.5+rand()*2.3],s);
      disperse.set([data.stages[2][s]*2.4,data.stages[2][s+1]*1.4,(rand()-.5)*1.7],s);
      const lane=i%3,u=(i/count-.5)*2.5,spread=Math.sin(clamp((u+.1)/.9)*Math.PI);stream.set([u,Math.sin(u*1.8)*.16+(lane-1)*.23*spread,-.65+lane*.18],s);
      const n=nodes[i%nodes.length],v=secure[i%nodes.length],a=rand()*Math.PI*2,r=rand()*.06;network.set([n.x+Math.cos(a)*r,n.y+Math.sin(a)*r,n.z+(rand()-.5)*.1],s);security.set([v.x+Math.cos(a)*r,v.y+Math.sin(a)*r,v.z+(rand()-.5)*.1],s);
      mark.set([logo.points[s]*.35,logo.points[s+1]*.35,0],s);
    }
    const threeDots=new Float32Array(count*3);for(let j=0;j<count;j++)threeDots.set([(j%3-1)*.18+(rand()-.5)*.018,(rand()-.5)*.018,0],j*3);
    const arrays=[cloud,cloud,bird,bird,disperse,stream,network,security,security,threeDots,mark,mark];
    const stops=[0,.22,.32,.41,.51,.60,.70,.78,.86,.89,.94,1];
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(cloud,3));geo.setAttribute('aTarget',new THREE.BufferAttribute(cloud,3));geo.setAttribute('aSeed',new THREE.BufferAttribute(seed,1));
    const uniforms={uMix:{value:0},uOpacity:{value:0},uDpr:{value:renderer.getPixelRatio()}};
    const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms,vertexShader:`attribute vec3 aTarget;attribute float aSeed;uniform float uMix,uDpr;varying float vSeed,vDepth;void main(){vec3 p=mix(position,aTarget,uMix);p.z+=sin(uMix*3.14159)*sin(aSeed*83.)*.16;vec4 mv=modelViewMatrix*vec4(p,1.);vDepth=-mv.z;gl_Position=projectionMatrix*mv;gl_PointSize=clamp((1.+pow(aSeed,8.)*3.)*uDpr/max(.24,-mv.z),1.,20.);vSeed=aSeed;}`,
      fragmentShader:`uniform float uOpacity;varying float vSeed,vDepth;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;float fog=1.-smoothstep(1.2,4.,vDepth);vec3 color=mix(vec3(.067),vec3(.62,.46,.25),step(.982,vSeed));float alpha=(1.-smoothstep(.10,.5,r))*(.25+.72*fog)*uOpacity;gl_FragColor=vec4(color,alpha);}`});
    const points=new THREE.Points(geo,mat);points.frustumCulled=false;scene.add(points);resources.push(geo,mat);
    // Continuous image surface: no rectangular depth slices or cropped wings.
    const art=[];
    for(let i=0;i<1;i++){
      const g=new THREE.PlaneGeometry(1.778,1,128,64),pos=g.attributes.position;
      for(let j=0;j<pos.count;j++)pos.setZ(j,Math.sin(pos.getX(j)*4)*.13+Math.cos(pos.getY(j)*7)*.04);
      const u={uMap:{value:textures[0]},uOpacity:{value:0},uBand:{value:i}};
      const m=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`uniform sampler2D uMap;uniform float uOpacity;varying vec2 vUv;void main(){vec3 c=texture2D(uMap,vUv).rgb;float ink=1.-min(c.r,min(c.g,c.b));float edge=smoothstep(0.,.045,min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y)));float a=smoothstep(.14,.68,ink)*uOpacity*edge;gl_FragColor=vec4(c*.85,a);}`});
      const mesh=new THREE.Mesh(g,m);scene.add(mesh);art.push({mesh,u});resources.push(g,m);
    }
    const feathers=[];
    for(let i=0;i<3;i++){
      const g=new THREE.PlaneGeometry(.48,.72,48,72),pos=g.attributes.position;
      for(let j=0;j<pos.count;j++)pos.setZ(j,Math.sin(pos.getY(j)*5)*.06);
      const u={uMap:{value:featherTexture},uOpacity:{value:0},uBlur:{value:0}};
      const m=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`uniform sampler2D uMap;uniform float uOpacity;varying vec2 vUv;void main(){vec3 c=texture2D(uMap,vUv).rgb;float ink=1.-dot(c,vec3(.3333));float alpha=smoothstep(.04,.4,ink);if(alpha<.01)discard;gl_FragColor=vec4(c,alpha*uOpacity);}`});
      const mesh=new THREE.Mesh(g,m);scene.add(mesh);feathers.push({mesh,u});resources.push(g,m);
    }
    const cloudGeo=new THREE.PlaneGeometry(2.8,1.5),cloudMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uOpacity:{value:0},uTime:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 vUv;uniform float uOpacity,uTime;${noiseGLSL}void main(){float n=fbm(vUv*5.+vec2(uTime*.012,0.));float edge=smoothstep(0.,.3,vUv.x)*smoothstep(0.,.3,1.-vUv.x)*smoothstep(0.,.3,vUv.y)*smoothstep(0.,.3,1.-vUv.y);gl_FragColor=vec4(mix(vec3(.72,.74,.72),vec3(.957,.953,.937),n),smoothstep(.20,.7,n)*edge*uOpacity);}`});
    const clouds=Array.from({length:7},(_,i)=>{const mesh=new THREE.Mesh(cloudGeo,cloudMat);mesh.position.set(Math.sin(i*3)*1.1,Math.cos(i*2)*.7,-1.5+i*.35);mesh.rotation.z=i*.31;scene.add(mesh);return mesh;});resources.push(cloudGeo,cloudMat);
    const sphereGeo=new THREE.SphereGeometry(1,32,24);
    const surface=sphereGeo.attributes.position;
    for(let j=0;j<surface.count;j++){const x=surface.getX(j),y=surface.getY(j),z=surface.getZ(j),d=1+.07*Math.sin(x*9+y*5)*Math.cos(z*8)+.03*Math.sin(y*19);surface.setXYZ(j,x*d,y*d*1.18,z*d*.81);}sphereGeo.computeVertexNormals();
    const stones=topology.map((n,j)=>{const material=new THREE.MeshStandardMaterial({color:j===1?0x9e8050:j===2?0x452c2b:0x211f1a,roughness:.82,metalness:.06,transparent:true,opacity:0});const mesh=new THREE.Mesh(sphereGeo,material);scene.add(mesh);resources.push(material);return mesh;});resources.push(sphereGeo);
    scene.fog=new THREE.Fog(0xf4f3ef,1.9,3.6);
    scene.add(new THREE.HemisphereLight(0xf4f3ef,0x7d786e,2));const light=new THREE.DirectionalLight(0xffead1,1.4);light.position.set(-2,3,1);scene.add(light);
    const curves=relations.map(([a,b,strength])=>{const g=new THREE.BufferGeometry().setFromPoints(Array.from({length:49},()=>new THREE.Vector3()));const material=new THREE.LineBasicMaterial({color:strength===1?0x957d55:0x8c877c,transparent:true,opacity:0});const mesh=new THREE.Line(g,material);mesh.frustumCulled=false;scene.add(mesh);resources.push(g,material);return{a,b,strength,mesh,curve:new THREE.QuadraticBezierCurve3()};});
    const pulseGeo=new THREE.SphereGeometry(.009,10,8),pulseMat=new THREE.MeshBasicMaterial({color:0xb39764,transparent:true});const tracer=new THREE.Mesh(pulseGeo,pulseMat);scene.add(tracer);resources.push(pulseGeo,pulseMat);
    const boundaryGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(.69,-.14,-.05),new THREE.Vector3(.69,.53,-.05)]),boundaryMat=new THREE.LineBasicMaterial({color:0x96846a,transparent:true,opacity:0}),boundary=new THREE.Line(boundaryGeo,boundaryMat);scene.add(boundary);resources.push(boundaryGeo,boundaryMat);
    const positions=nodes.map(n=>n.clone()),projected=new THREE.Vector3();let oldSegment=-1;
    const fragments=Array.from({length:5},(_,j)=>{const g=new THREE.PlaneGeometry(.22,.29),u={opacity:{value:0},gold:{value:j===2?1:0}};const m=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float opacity,gold;void main(){float rows=step(.72,fract(vUv.y*12.))*step(.12,vUv.x)*step(vUv.x,.87);float edge=1.-smoothstep(0.,.04,min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y)));vec3 ink=mix(vec3(.37),vec3(.57,.46,.29),gold);gl_FragColor=vec4(mix(vec3(.94,.936,.92),ink,max(rows*.5,edge*.35)),opacity);}`});const mesh=new THREE.Mesh(g,m);mesh.position.set(.06+j*.20,.15+Math.sin(j*2)*.12,-.2-j*.08);mesh.rotation.y=-.25+j*.12;scene.add(mesh);resources.push(g,m);return {mesh,u};});
    const labelEls=[...document.querySelectorAll('.my-node-labels button')];
    drawWorld=(t,elapsed,mouse)=>{
      let i=0;while(i<stops.length-2&&t>stops[i+1])i++;const m=ease(stops[i],stops[i+1],t);
      if(i!==oldSegment){geo.setAttribute('position',new THREE.BufferAttribute(arrays[i],3));geo.setAttribute('aTarget',new THREE.BufferAttribute(arrays[i+1],3));oldSegment=i;}
      uniforms.uMix.value=m;uniforms.uOpacity.value=ease(.13,.26,t)*(1-ease(.95,.985,t))*(1-.94*pulse(.62,.70,.87,.90,t));
      art.forEach(({mesh,u})=>{const end=ease(.935,.975,t);u.uOpacity.value=pulse(.26,.31,.415,.48,t)*.94+end*.78;mesh.position.set(end*(compact?.34:.57),end*(compact?.19:.015),0);mesh.scale.setScalar(1-end*.43);mesh.rotation.y=Math.sin(t*18)*.025*(1-end);});
      feathers.forEach(({mesh,u},j)=>{const f=clamp((t-.25-j*.022)/.28);mesh.position.set(-.48+f*.78+(j-1)*.30,.2-Math.sin(f*Math.PI)*.18+j*.07,Math.min(camera.position.z-.65,-.5+f*.55-j*.25));mesh.rotation.set(f*.3,j*.15,f*1.1-.8);mesh.scale.setScalar(j===0?1.25:.7);u.uOpacity.value=pulse(.29+j*.02,.36+j*.02,.49+j*.014,.55+j*.014,t)*.9;});
      cloudMat.uniforms.uOpacity.value=pulse(.10,.21,.29,.38,t)*.65+pulse(.46,.52,.76,.81,t)*.12;cloudMat.uniforms.uTime.value=elapsed;
      clouds.forEach((mesh,j)=>{mesh.position.z=-1.5+j*.35+ease(.12,.32,t)*.8;mesh.position.x=Math.sin(j*3)*1.1+mouse.x*(j+1)*.015;});
      const graph=0,securityMix=ease(.70,.78,t),focus=ease(.79,.82,t);
      positions.forEach((p,j)=>{p.copy(nodes[j]).lerp(secure[j],securityMix);if(compact)p.x-=.38;
        const mesh=stones[j];mesh.position.copy(p);mesh.scale.setScalar(topology[j].r*(j===1?1+focus*3:1));mesh.rotation.set(.12*j,.3+j*.7,.13*j);mesh.material.opacity=graph*(j>3?.38:1);mesh.visible=graph>.001;});
      curves.forEach(({a,b,strength,mesh,curve})=>{curve.v0.copy(positions[a]);curve.v2.copy(positions[b]);curve.v1.copy(positions[a]).lerp(positions[b],.5).add(new THREE.Vector3(0,.09,.07));const attr=mesh.geometry.attributes.position;for(let k=0;k<49;k++){const p=curve.getPoint(k/48);attr.setXYZ(k,p.x,p.y,p.z);}attr.needsUpdate=true;mesh.material.opacity=graph*strength;mesh.visible=graph>.001;});
      tracer.visible=false;const path=clamp((t-.74)/.06)*2,chosen=curves[Math.min(1,Math.floor(path))];tracer.position.copy(chosen.curve.getPoint(path>=2?1:path%1));pulseMat.opacity=graph;
      boundary.position.x=compact?-.38:0;boundaryMat.opacity=0;
      fragments.forEach(({mesh,u})=>{u.opacity.value=0;mesh.visible=false;});
      labelEls.forEach((el,j)=>{const v=t<.70?new THREE.Vector3((j-1.5)*.24,.21,-.3):positions[[0,3,1,2,4][j]];projected.copy(v).project(camera);const x=clamp((projected.x+1)/2)*host.clientWidth,y=clamp((1-projected.y)/2)*host.clientHeight;el.style.left=Math.max(90,Math.min(host.clientWidth-90,x))+'px';el.style.top=Math.max(140,Math.min(host.clientHeight*.52,y+40))+'px';});
      host.dataset.particles=String(count);host.dataset.nodes=String(t>.49&&t<.73?10:0);host.dataset.edges=String(t>.49&&t<.73?13:0);host.dataset.segment=String(i);host.dataset.depthRange='-1.8..1.2';
    };
    return {renderer,scene,dispose};
  }catch(error){document.querySelector('#fallback').classList.add('visible');host.dataset.assetError='true';console.error(error);return {renderer,scene,dispose};}
}
