import * as T from './vendor/three/three.module.min.js';
export function mount(root,signal){
  const host=root.querySelector('.pf-scene');
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);host.append(renderer.domElement);
  const scene=new T.Scene();scene.fog=new T.FogExp2('#07111d',.018);
  const camera=new T.PerspectiveCamera(48,1,.1,150);camera.position.set(0,1,12);
  scene.add(new T.AmbientLight('#b8d4ff',2));const key=new T.DirectionalLight('#a6daff',4);key.position.set(4,6,5);scene.add(key);const rim=new T.PointLight('#efacdd',45,24);rim.position.set(-3,2,-4);scene.add(rim);
  const objects=new T.Group();objects.position.x=2.9;scene.add(objects);
  const material=new T.MeshStandardMaterial({color:'#254763',metalness:.7,roughness:.3,transparent:true,opacity:.92});
  const cubes=[];
  for(let i=0;i<3;i++){const group=new T.Group();const geo=new T.BoxGeometry(1.55,1.55,1.55);const mesh=new T.Mesh(geo,material);group.add(mesh);group.add(new T.LineSegments(new T.EdgesGeometry(geo),new T.LineBasicMaterial({color:['#98ddff','#d8b5ff','#a0f0d7'][i],transparent:true,opacity:.85})));group.position.set((i-1)*1.7,(i%2)*1.5-.5,-i*.6);objects.add(group);cubes.push(group);}
  const rings=[];for(let i=0;i<3;i++){const ring=new T.Mesh(new T.TorusGeometry(3.8+i*.45,.012,6,140),new T.MeshBasicMaterial({color:['#709eca','#b494c6','#6bbaa9'][i],transparent:true,opacity:.45}));ring.rotation.set(.65+i*.38,.4+i*.25,i*.5);objects.add(ring);rings.push(ring);}
  const points=[];let seed=778;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<950;i++)points.push((rand()-.5)*65,(rand()-.5)*45,(rand()-.5)*65);
  const starsGeo=new T.BufferGeometry();starsGeo.setAttribute('position',new T.Float32BufferAttribute(points,3));const stars=new T.Points(starsGeo,new T.PointsMaterial({color:'#b1d3f2',size:.045,transparent:true,opacity:.7}));scene.add(stars);
  const floor=new T.GridHelper(50,40,'#467894','#233f52');floor.position.y=-4;scene.add(floor);
  let frame=0,last=0,time=0,paused=false,dead=false,mouse={x:0,y:0};
  const resize=()=>{const r=host.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(host);resize();
  const progress=()=>Math.max(0,Math.min(3,-root.getBoundingClientRect().top/innerHeight));
  const draw=now=>{frame=0;if(dead||document.hidden)return;const dt=Math.min((now-last)/1000,.05);last=now;if(!paused)time+=dt;const p=progress();
    const targetX=2.8-Math.sin(p*Math.PI*.65)*1.4;objects.position.x+=(targetX-objects.position.x)*.05;
    objects.rotation.y=p*.9+mouse.x*.12;objects.rotation.z=Math.sin(p)*.12;
    cubes.forEach((cube,i)=>{cube.rotation.set(time*.12+i*.3,p*.7+time*.16,i*.3);cube.position.y=Math.sin(time*.6+i*2)*.2+(i%2)*1.5-.5;});
    rings.forEach((ring,i)=>ring.rotation.z=time*.035*(i%2?-1:1)+p*.35+i*.5);
    camera.position.z=camera.aspect<.85?17:12-p*.65;camera.position.y=1+Math.sin(p)*1.2+mouse.y*.1;camera.lookAt(.5,0,0);renderer.render(scene,camera);
    if(!paused)frame=requestAnimationFrame(draw);
  };
  const request=()=>{if(!frame&&!dead&&!document.hidden){last=performance.now();frame=requestAnimationFrame(draw);}};
  window.addEventListener('scroll',request,{signal,passive:true});window.addEventListener('resize',request,{signal});
  host.parentElement.addEventListener('pointermove',e=>{mouse={x:e.clientX/innerWidth-.5,y:e.clientY/innerHeight-.5};request();},{signal,passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else request();},{signal});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);dead=true;renderer.domElement.hidden=true;root.querySelector('.pf-fallback').textContent='Static view · 3D unavailable';},{signal});
  request();return {pause(value){paused=value;request();},dispose(){dead=true;cancelAnimationFrame(frame);ro.disconnect();const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();}};
}
