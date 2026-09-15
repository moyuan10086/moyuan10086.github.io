import * as THREE from '/intro-assets/three.module.min.js';
import {processState,calculationNodes,calculationEdges} from './process-state.js';

// One continuous ink path survives the three acts: formation, evidence, decision.
export function createInkProcess(scene,compact) {
  const root=new THREE.Group();scene.add(root);
  const resources=[],ribbons=[];
  const v=(x,y,z)=>new THREE.Vector3(x,y,z);
  const route=lane=>new THREE.CatmullRomCurve3([
    v(-.87,.02,-.5),v(-.58,.08,-.4),v(-.24,.18,-.15),
    v(.12,.23+lane*.19,-.18+Math.abs(lane)*.18),
    v(.48,.2+lane*.13,-.28),v(.79,.23,-.5)
  ]);
  const paths=[route(-1),route(0),route(1)];
  function tube(curve,radius,color,opacity) {
    const geometry=new THREE.TubeGeometry(curve,100,radius,5,false);
    const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,depthWrite:false,fog:false});
    const mesh=new THREE.Mesh(geometry,material);root.add(mesh);resources.push(geometry,material);
    const item={mesh,curve,opacity};ribbons.push(item);return item;
  }
  const main=paths.map((curve,index)=>tube(curve,index===1?.006:.0025,index===1?0x292b27:0x9b8d73,index===1?.9:.32));
  const fibers=Array.from({length:22},(_,index)=>{
    const lane=index-10.5,curve=new THREE.CatmullRomCurve3([
      v(-.92+Math.sin(index)*.1,.08+lane*.018,-.52+Math.cos(index)*.10),
      v(-.51,.1+lane*.017,-.35+lane*.008),
      v(-.17,.18+lane*.005,-.16),v(.16,.23+lane*.001,-.19)
    ]);
    return tube(curve,index%5===0?.0022:.0011,index%7===0?0xa98a52:0x353a34,index%5===0?.64:.22);
  });
  const grainGeo=new THREE.IcosahedronGeometry(.013,1),gold=new THREE.MeshBasicMaterial({color:0xa98b53,transparent:true,depthWrite:false});
  const leader=new THREE.Mesh(grainGeo,gold);leader.scale.set(.8,1.6,.8);root.add(leader);resources.push(grainGeo,gold);
  const seedGeo=new THREE.IcosahedronGeometry(.006,0),seedMat=new THREE.MeshBasicMaterial({color:0x363b33,transparent:true,depthWrite:false});
  const seeds=Array.from({length:24},()=>{const mesh=new THREE.Mesh(seedGeo,seedMat);root.add(mesh);return mesh;});resources.push(seedGeo,seedMat);
  const gateGeo=new THREE.PlaneGeometry(.25,.7,12,40),pos=gateGeo.attributes.position;
  for(let i=0;i<pos.count;i++)pos.setZ(i,Math.sin(pos.getY(i)*8)*.035+Math.cos(pos.getX(i)*14)*.014);
  gateGeo.computeVertexNormals();
  const gateMat=new THREE.MeshBasicMaterial({color:0xb5a47c,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false});
  const gate=new THREE.Mesh(gateGeo,gateMat);gate.position.set(.26,.18,-.1);gate.rotation.y=.75;root.add(gate);resources.push(gateGeo,gateMat);
  const edgeGeo=new THREE.BufferGeometry().setFromPoints(Array.from({length:81},(_,i)=>v(.26+.014*Math.sin(i*.1),-.17+i*.00875,-.08+Math.sin(i*.1)*.035)));
  const edgeMat=new THREE.LineBasicMaterial({color:0xa38c60,transparent:true,opacity:0});
  root.add(new THREE.Line(edgeGeo,edgeMat));resources.push(edgeGeo,edgeMat);
  const decisions=[
    new THREE.CatmullRomCurve3([v(-.38,.2,-.1),v(.05,.34,-.03),v(.3,.36,-.08),v(.8,.38,-.27)]),
    new THREE.CatmullRomCurve3([v(-.38,.2,-.1),v(.01,.16,-.03),v(.23,.13,-.06),v(.22,.06,-.05)]),
    new THREE.CatmullRomCurve3([v(-.38,.2,-.1),v(.04,-.02,-.02),v(.25,-.07,-.08),v(.02,-.15,.03)])
  ];
  const decisionLines=decisions.map((curve,index)=>tube(curve,.0025,[0x6d7f69,0xab8b51,0x755652][index],.55));
  const drops=decisions.map((_,index)=>{const material=new THREE.MeshBasicMaterial({color:[0x56664e,0xa68b56,0x704642][index],transparent:true,depthWrite:false});const mesh=new THREE.Mesh(grainGeo,material);root.add(mesh);resources.push(material);return mesh;});
  const nodeGeo=new THREE.IcosahedronGeometry(.025,3);
  const mathNodes=calculationNodes.map((point,index)=>{
    const material=new THREE.MeshBasicMaterial({color:0x333930,transparent:true,opacity:0,fog:false,depthWrite:false});
    const mesh=new THREE.Mesh(nodeGeo,material);mesh.position.set(...point);mesh.scale.set(1,.72,.45);root.add(mesh);resources.push(material);
    return mesh;
  });resources.push(nodeGeo);
  const mathEdges=calculationEdges.map(([a,b],index)=>{
    const start=v(...calculationNodes[a]),end=v(...calculationNodes[b]);
    const bend=start.clone().lerp(end,.5);bend.z+=.055;bend.y+=index>10?-.05:.02;
    return {a,b,...tube(new THREE.QuadraticBezierCurve3(start,bend,end),index>10?.0028:.0017,index>10?0xa38b58:0x7f897c,index>10?.7:.25)};
  });
  return {
    update(t,time) {
      const s=processState(t);root.visible=t>.44&&t<.825;
      root.position.set(compact?0:.15,compact?.22:.03,0);root.scale.setScalar(compact?.72:1);
      main.forEach((item,index)=>{item.mesh.material.opacity=s.structure*item.opacity*(1-s.calculation*.9)*(index===1?1:1-s.travel*.55);item.mesh.geometry.setDrawRange(0,Math.floor((.22+s.unfold*.78)*3000));});
      fibers.forEach((item,index)=>{item.mesh.material.opacity=s.structure*item.opacity*(1-s.unfold*.78);item.mesh.rotation.x=Math.sin(time*.16+index)*.015;});
      const anchor=v(-.38,.2,-.1);
      leader.position.copy(paths[1].getPoint(s.travel));if(t>=.65)leader.position.lerp(anchor,Math.min(1,(t-.65)/.022));
      gold.opacity=Math.max(s.structure,s.evidence,s.boundary)*.95;leader.visible=gold.opacity>.01;
      seeds.forEach((mesh,index)=>{const p=(index/24+s.travel*.6)%1,spread=(1-s.unfold)*.17;mesh.position.copy(paths[1].getPoint(p));mesh.position.y+=Math.sin(index*2.4)*spread;mesh.position.z+=Math.cos(index*1.7)*spread;});seedMat.opacity=s.structure*(1-s.unfold*.55)*.65;
      gateMat.opacity=s.boundary*.12;edgeMat.opacity=s.boundary*.8;
      decisionLines.forEach((item,index)=>{const arrival=Math.min(1,Math.max(0,s.decision*1.35-index*.16));item.mesh.material.opacity=s.boundary*item.opacity;item.mesh.geometry.setDrawRange(0,Math.floor(arrival*3000));drops[index].position.copy(decisions[index].getPoint(arrival));drops[index].material.opacity=s.boundary;});
      mathNodes.forEach((mesh,index)=>{
        const layer=index<3?0:index<6?1:index<8?2:index===8?3:2.4;
        const active=Math.max(0,1-Math.abs(s.activation*3.8-layer)*1.4);
        mesh.material.color.set(active>.2?0xa0844c:0x333930);
        const retained=[0,4,6,8].includes(index),selection=Math.min(1,Math.max(0,(t-.66)/.045));
        mesh.material.opacity=s.calculation*(.72+.28*active)+s.evidence*(retained?.9:(1-selection)*.28);
        if(s.evidence>.2&&retained)mesh.material.color.set(0xa0844c);
        mesh.scale.setScalar(1+active*.38);mesh.scale.z=.45;
      });
      mathEdges.forEach((item,index)=>{
        const layer=index<5?0:index<9?1:2;
        const active=Math.max(0,1-Math.abs(s.activation*3.8-layer-.5));
        const retained=[1,6,9].includes(index),selection=Math.min(1,Math.max(0,(t-.66)/.045));
        item.mesh.material.opacity=s.calculation*(item.opacity+active*.43)*(index>10?Math.min(1,s.activation*2):1)+s.evidence*(retained?.75:(1-selection)*.15);
        item.mesh.material.color.set(active>.2?0xa0844c:0x859080);
        if(s.evidence>.2&&retained)item.mesh.material.color.set(0xa0844c);
      });
      return s;
    },
    dispose(){root.removeFromParent();resources.forEach(resource=>resource.dispose());}
  };
}
