import * as THREE from '/intro-assets/three.module.min.js';
import {waterCameraAt,dropHeight,dropProfile,IMPACT_TIME} from './water-path.js';
const screenVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export const noiseGLSL=`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<5;i++){n+=a*noise(p);p=mat2(.8,.6,-.6,.8)*p*2.03+3.1;a*=.5;}return n;}`;
export function waterDetailAt(distance){
  const t=Math.max(0,Math.min(1,(3.1-distance)/(3.1-1.25)));
  return t*t*(3-2*t);
}
export function createWater(renderer,scene,camera,compact){
  const size=compact?256:384;
  let read=new THREE.WebGLRenderTarget(size,size,{depthBuffer:false}),write=read.clone();
  const uniforms={uPrevious:{value:read.texture},uPointer:{value:new THREE.Vector2(.5,.5)},uVelocity:{value:new THREE.Vector2()},uDt:{value:1/60},uTime:{value:0},uInject:{value:0},uAspect:{value:1},uReset:{value:1},uDrop:{value:0}};
  const bufferMat=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,vertexShader:screenVertex,fragmentShader:`
    varying vec2 vUv;uniform sampler2D uPrevious;uniform vec2 uPointer,uVelocity;uniform float uDt,uTime,uInject,uAspect,uReset,uDrop;
    void main(){if(uReset>.5){gl_FragColor=vec4(.5,.5,0.,1.);return;}
      vec2 velocity=(texture2D(uPrevious,vUv).rg-.5)*.16;
      vec2 curl=vec2(sin(vUv.y*17.+uTime*.25),cos(vUv.x*13.-uTime*.2))*.004;
      vec2 uv=clamp(vUv-(velocity+curl)*uDt,vec2(.002),vec2(.998));
      vec4 old=texture2D(uPrevious,uv);vec2 v=(old.rg-.5)*.16;
      vec2 offset=(vUv-uPointer)*vec2(uAspect,1.),vel=clamp(uVelocity,vec2(-.08),vec2(.08));
      float force=exp(-dot(offset,offset)/.0007)*uInject*(.3+min(2.,length(vel)*65.));
      v=v*exp(-uDt*1.4)+vel*force*.48;
      float density=old.b*exp(-uDt*.5)+force*.12;
      vec2 center=(vUv-vec2(.5,.326))*vec2(uAspect,1.);float drop=exp(-dot(center,center)/.0008)*uDrop;
      density+=drop*.65;v+=center*drop*.3;
      gl_FragColor=vec4(clamp(v/.16+.5,0.,1.),clamp(density,0.,1.),1.);
    }`});
  const quadGeo=new THREE.PlaneGeometry(2,2),buffer=new THREE.Mesh(quadGeo,bufferMat);buffer.layers.set(1);buffer.frustumCulled=false;scene.add(buffer);
  const u={uFlow:{value:read.texture},uBackdrop:{value:null},uFinale:{value:null},uReady:{value:0},uTime:{value:0},uProgress:{value:0},uAspect:{value:1},uOpening:{value:0},uNearDetail:{value:0},uOrigin:{value:new THREE.Vector3()},uForward:{value:new THREE.Vector3()}};
  let alive=true;
  const backdrop=new THREE.TextureLoader().load('/intro-assets/water-landscape-v2.png',()=>{if(alive)u.uReady.value=1;});u.uBackdrop.value=backdrop;
  const finale=new THREE.TextureLoader().load('/intro-assets/finale-landscape-v2.png');u.uFinale.value=finale;
  const displayMat=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthTest:false,depthWrite:false,vertexShader:screenVertex,fragmentShader:`
    varying vec2 vUv;uniform sampler2D uFlow,uBackdrop,uFinale;uniform float uReady,uTime,uProgress,uAspect,uOpening,uNearDetail;uniform vec3 uOrigin,uForward;
    ${noiseGLSL}
    vec2 projectReference(vec3 world){vec3 f=normalize(vec3(0.,-.771, -3.619));vec3 up=normalize(cross(vec3(1,0,0),f));vec3 d=world-vec3(0.,.771,3.619);float depth=max(.01,dot(d,f));return vec2(.5,.326)+vec2(d.x,dot(d,up))/(depth*.787)*vec2(1./uAspect,1.);}
    float surface(vec2 p){float elapsed=max(0.,uOpening-1.35),r=length(p);
      float ring=sin(r*38.-elapsed*5.)*exp(-pow((r-elapsed*.30)*4.,2.))*exp(-elapsed*.32)*smoothstep(0.,.09,elapsed);
      return (fbm(p*2.1+vec2(uTime*.021,-uTime*.016))-.5)*.012+ring*.018;}
    vec2 waveSlope(vec2 p,vec2 direction,float frequency,float speed,float amplitude){
      float phase=dot(p,direction)*frequency-uTime*speed;
      float resolved=1.-smoothstep(.65,2.4,fwidth(phase));
      return direction*cos(phase)*frequency*amplitude*resolved;
    }
    vec3 nearWater(vec2 p,vec3 ray,vec4 flow,vec3 paper){
      // World-space wavelengths survive the dive; pixel footprints suppress distant shimmer.
      vec2 current=vec2(sin(p.y*2.3+uTime*.17),cos(p.x*1.7-uTime*.13))*.025;
      vec2 advected=p+current+vec2(uTime*.006,-uTime*.004);
      vec2 slope=waveSlope(advected,vec2(.94,.342),39.,1.7,.0028)
        +waveSlope(advected,vec2(-.42,.908),91.,2.8,.0011)
        +waveSlope(advected,vec2(.63,.777),177.,4.1,.00038);
      float elapsed=max(0.,uOpening-1.35),r=max(.0001,length(p));
      float phase=r*90.-elapsed*8.;
      float ringEnvelope=exp(-pow((r-elapsed*.3)*4.,2.))*exp(-elapsed*.24)*smoothstep(0.,.09,elapsed);
      slope+=p/r*cos(phase)*.22*ringEnvelope*(1.-smoothstep(.65,2.4,fwidth(phase)));
      vec3 normal=normalize(vec3(-slope.x,1.,-slope.y));
      float fresnel=.035+.965*pow(1.-max(0.,dot(normal,-ray)),5.);
      float reflection=smoothstep(-.3,.7,reflect(ray,normal).y);
      vec3 color=mix(vec3(.77,.81,.79),paper,.48+reflection*.30);
      color=mix(color,paper,fresnel*.6);
      color+=vec3(.055)*dot(slope,vec2(.6,-.8));
      vec2 inkDomain=advected*2.4+vec2(fbm(advected*2.7),fbm(advected*2.7+4.7))*.6;
      float inkPhase=inkDomain.x*13.+sin(inkDomain.y*9.)*2.5;
      float inkWidth=max(.045,fwidth(inkPhase)*.7);
      float veins=1.-smoothstep(.10,.10+inkWidth,abs(sin(inkPhase)));
      float spread=.28+min(elapsed,10.)*.045;
      float impactInk=exp(-dot(p,p)/(spread*spread))*smoothstep(0.,.18,elapsed);
      float ink=veins*(.035+impactInk*.20)+impactInk*.045+flow.b*.42;
      return mix(color,vec3(.12,.16,.15),clamp(ink,0.,.6));
    }
    void main(){vec3 paper=vec3(.978,.977,.969);
      if(uProgress>.90){vec2 cover=vec2(min(1.,uAspect/1.777778),min(1.,1.777778/uAspect));vec3 landscape=texture2D(uFinale,.5+(vUv-.5)*cover).rgb;gl_FragColor=vec4(landscape,smoothstep(.91,.96,uProgress));return;}
      float dive=smoothstep(.025,.19,uProgress),cloud=smoothstep(.18,.29,uProgress);
      vec2 anchor=vec2(.5,mix(.326,.5,smoothstep(0.,.35,dive))),screen=(vUv-anchor)*vec2(uAspect,1.);
      vec3 up=normalize(cross(vec3(1,0,0),uForward)),ray=normalize(uForward+vec3(1,0,0)*screen.x*.787+up*screen.y*.787);
      float dist=uOrigin.y/max(.001,-ray.y);vec3 hit=uOrigin+ray*dist;
      vec2 reference=projectReference(hit);float waterMask=1.-smoothstep(-.035,.0,ray.y);
      vec2 base=vec2(.5,.326)+(vUv-anchor)/(1.+dive*5.);base=mix(base,reference,waterMask);
      vec2 cover=vec2(min(1.,uAspect/1.777778),min(1.,1.777778/uAspect));
      vec2 flowUV=clamp(reference,vec2(.001),vec2(.999));vec4 flow=texture2D(uFlow,flowUV);
      float h=surface(hit.xz);vec2 slope=vec2(surface(hit.xz+vec2(.008,0))-h,surface(hit.xz+vec2(0,.008))-h)/.008;
      vec2 warp=(slope*.005+(flow.rg-.5)*.035)*waterMask*(1.-cloud);
      base=clamp(vec2(.5,.326)+(base-vec2(.5,.326))*cover+warp,vec2(.001),vec2(.999));
      vec3 color=mix(paper,texture2D(uBackdrop,base).rgb,uReady);
      float crest=clamp(length(slope)*.08,0.,.14)*waterMask;
      color=mix(color,paper,crest);color=mix(color,vec3(.08,.077,.069),flow.b*.7*waterMask*(1.-cloud));
      color*=1.-clamp(-h*8.,0.,.18)*waterMask;
      float nearMix=uNearDetail*waterMask*(1.-smoothstep(2.4,4.8,dist));
      color=mix(color,nearWater(hit.xz,ray,flow,paper),nearMix);
      float breach=smoothstep(.155,.193,uProgress),n=fbm(screen*2.5+vec2(dive*2.,uTime*.015));
      vec3 submerged=mix(paper,vec3(.55,.59,.57),smoothstep(.45,.85,n)*.35);
      color=mix(color,submerged,breach);color=mix(color,paper,cloud*.7);
      gl_FragColor=vec4(color,1.-smoothstep(.24,.31,uProgress));
    }`});
  const water=new THREE.Mesh(quadGeo,displayMat);water.frustumCulled=false;water.renderOrder=-100;scene.add(water);
  const waterCamera=new THREE.PerspectiveCamera(43,1,.001,30),matrix=new THREE.Matrix4();
  const curve=new THREE.SplineCurve(dropProfile.map(p=>new THREE.Vector2(...p)));
  const dropGeo=new THREE.LatheGeometry(curve.getPoints(64).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y)),64);
  const dropMat=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{uVP:{value:matrix},uEye:{value:new THREE.Vector3()},uAlpha:{value:1}},vertexShader:`uniform mat4 uVP;varying vec3 vNormal,vWorld;void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vNormal=mat3(modelMatrix)*normal;gl_Position=uVP*world;}`,fragmentShader:`uniform vec3 uEye;uniform float uAlpha;varying vec3 vNormal,vWorld;void main(){vec3 n=normalize(vNormal),eye=normalize(uEye-vWorld);float rim=pow(1.-max(0.,dot(n,eye)),2.5);float light=max(0.,dot(n,normalize(vec3(-.6,1.,1.))));vec3 color=vec3(.055,.058,.053)+vec3(.12,.13,.12)*pow(light,3.)+vec3(.48,.43,.31)*rim*.48;gl_FragColor=vec4(color,uAlpha);}`});
  const drop=new THREE.Mesh(dropGeo,dropMat);drop.frustumCulled=false;drop.renderOrder=-90;scene.add(drop);
  let reset=true,opening=0,dropped=false;
  function update(dt,time,t,pointer,velocity,inject,aspect){
    if(u.uReady.value)opening+=dt;const impact=opening>=IMPACT_TIME&&!dropped;if(impact)dropped=true;
    if(t<.32){uniforms.uPrevious.value=read.texture;uniforms.uPointer.value.copy(pointer);uniforms.uVelocity.value.copy(velocity);uniforms.uInject.value=inject;uniforms.uDt.value=dt;uniforms.uTime.value=time;uniforms.uReset.value=reset?1:0;uniforms.uDrop.value=impact?1:0;uniforms.uAspect.value=aspect;
      camera.layers.set(1);renderer.setRenderTarget(write);renderer.render(scene,camera);renderer.setRenderTarget(null);camera.layers.set(0);[read,write]=[write,read];reset=false;}
    const path=waterCameraAt(t);u.uNearDetail.value=waterDetailAt(path.distance);u.uOrigin.value.fromArray(path.origin);u.uForward.value.fromArray(path.forward);
    waterCamera.aspect=aspect;waterCamera.position.copy(u.uOrigin.value);waterCamera.lookAt(u.uOrigin.value.clone().add(u.uForward.value));waterCamera.updateProjectionMatrix();
    const center=Math.min(1,path.dive/.35),centerEase=center*center*(3-2*center);
    waterCamera.projectionMatrix.elements[9]=.348*(1-centerEase);
    waterCamera.updateMatrixWorld();matrix.multiplyMatrices(waterCamera.projectionMatrix,waterCamera.matrixWorldInverse);dropMat.uniforms.uEye.value.copy(waterCamera.position);
    drop.position.set(0,dropHeight(opening)+.041,0);drop.visible=opening<IMPACT_TIME&&t<.16;
    u.uFlow.value=read.texture;u.uTime.value=time;u.uProgress.value=t;u.uAspect.value=aspect;u.uOpening.value=opening;water.visible=t<.31||t>.90;
  }
  return {update,replay(){reset=true;opening=0;dropped=false;},dispose(){alive=false;read.dispose();write.dispose();quadGeo.dispose();bufferMat.dispose();displayMat.dispose();dropGeo.dispose();dropMat.dispose();backdrop.dispose();finale.dispose();scene.remove(buffer,water,drop);}};
}
