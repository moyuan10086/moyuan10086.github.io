/* A quiet stop along the flock's journey. Uses the host's clock and wind; no RAF. */
(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
  class SakuraGarden {
    constructor({curve,onReady=()=>{},image,layer,random=Math.random}={}) {
      this.curve=curve;this.random=random;this.scene=null;this.petals=[];this.digits=[];this.composition=[];this.ready=false;
      this.image=image||document.createElement('img');
      this.layer=layer||document.createElement('canvas');this.layerCtx=this.layer.getContext('2d');
      this.image.onload=()=>{this.ready=true;this.dirty=true;onReady();};
      this.image.src='/images/sakura-branch-anime.png?v=20261012';
      this.rects=[];this.nextFall=0;this.nextGust=0;this.nextDigit=0;this.nextStop=0;this.dirty=true;
    }
    reset(){this.scene=null;this.petals=[];this.digits=[];this.nextFall=this.nextGust=this.nextDigit=this.nextStop=0;this.dirty=true;}
    setSpaces(width,height,bounds,rects,gap={},anchor={top:100,height:450}){
      this.W=width;this.H=height;this.bounds=bounds;this.rects=rects;this.dirty=true;
      const small=width<820,w=small?clamp(width*.32,160,230):clamp(width*.3,240,430);
      const span=clamp(anchor.height,320,560);
      // The three branches are attached to document sections, never to the cursor.
      this.composition=width<360?[]:[
        {side:'left',width:w,height:w*2/3,x:-w*.12,y:anchor.top+span*.06,rotation:-.06,alpha:.82},
        {side:'right',width:w*.92,height:w*.92*2/3,x:width-w*.92*.9,y:anchor.top+span*.43,rotation:.1,alpha:.77},
        {side:'left',width:w*.62,height:w*.62*2/3,x:0,y:anchor.top+span*.8,rotation:.17,alpha:.58}
      ];
      if(this.scene&&this.composition[this.scene.branchIndex])Object.assign(this.scene,this.composition[this.scene.branchIndex]);
    }
    visibleBranches(){return this.composition.filter(s=>s.y+s.height>70&&s.y<this.H-35);}
    scrollBy(delta){
      for(const s of this.composition)s.y-=delta;
      if(this.scene)this.scene.y-=delta;
      if(Number.isFinite(this.layerTop))this.layerTop-=delta;
    }
    point(x,y,s){
      const dx=((s.side==='left'?1-x:x)-.5)*s.width,dy=(y-.5)*s.height;
      const c=Math.cos(s.rotation||0),sn=Math.sin(s.rotation||0);
      return {x:s.x+s.width*.5+dx*c-dy*sn,y:s.y+s.height*.5+dx*sn+dy*c};
    }
    start(clock,side){
      const visible=this.visibleBranches();
      if(!this.ready||!visible.length||clock<this.nextStop)return false;
      const branch=visible.find(s=>s.side===side)||visible[0];
      this.scene={...branch,start:clock,end:clock+42,branchIndex:this.composition.indexOf(branch)};
      this.nextStop=clock+130;this.dirty=true;
      return true;
    }
    branchPoint(t,s=this.scene){
      const x=.13+.7*t,y=.79-.52*t+Math.sin(t*7)*.04;
      return this.point(x,y,s);
    }
    orbit(t,band=0,index=0){
      const s=this.scene;
      // An irregular path passes above and below the bough. Individual lanes breathe.
      const points=[{x:.06,y:.84},{x:.18,y:.49},{x:.51,y:.14},{x:.88,y:.1},
        {x:1.07,y:.39},{x:.78,y:.77},{x:.39,y:1.08},{x:.05,y:1.02}];
      const p=this.curve(points,t),n=this.curve(points,t+.001),dx=n.x-p.x,dy=n.y-p.y;
      const length=Math.hypot(dx,dy)||1;
      const lane=band*(.055+.012*Math.sin(t*Math.PI*2+index*.1));
      const x=p.x-dy/length*lane,y=p.y+dx/length*lane;
      return this.point(x,y,s);
    }
    opacity(clock){return this.scene?smooth((clock-this.scene.start)/3)*smooth((this.scene.end-clock)/6):0;}
    clearance(x,y,radius=15){
      let alpha=1;
      for(const r of this.rects){const dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom);alpha=Math.min(alpha,smooth(Math.hypot(dx,dy)/radius));}
      return alpha;
    }
    shed(clock,t,branch=this.scene||this.visibleBranches()[0]){
      if(!branch||!this.ready||this.petals.length>=28)return;
      const p=this.branchPoint(t,branch),r=this.random;
      if(p.y<65||p.y>this.H||p.x<-15||p.x>this.W+15)return;
      this.petals.push({x:p.x,y:p.y,vx:4+r()*8,vy:10+r()*6,born:clock,life:12+r()*7,
        size:2+r()*3,depth:r(),angle:r()*Math.PI*2,spin:(r()-.5)*.9,seed:r()*Math.PI*2});
    }
    // Curl of a time-varying stream function: continuous eddies, not per-frame jitter.
    curl(x,y,time){
      const a=x*.012+time*.21,b=y*.015-time*.17;
      return {x:Math.sin(a)*Math.cos(b)*15,y:-Math.cos(a)*Math.sin(b)*12};
    }
    update(dt,clock,wind,mouse){
      const s=this.scene,visible=this.visibleBranches();
      if(this.ready&&visible.length){
        if(clock>=this.nextFall){this.shed(clock,this.random(),visible[Math.floor(this.random()*visible.length)]);this.nextFall=clock+1.6+this.random()*2;}
        if(clock>=this.nextDigit&&this.digits.length<4){
          const r=this.random,p=this.branchPoint(.15+r()*.7,visible[Math.floor(r()*visible.length)]);
          this.digits.push({x:p.x,y:p.y,vx:2,vy:-2,born:clock,life:14,size:11+r()*3,
            depth:r(),angle:0,spin:0,seed:r()*Math.PI*2,glyph:r()<.5?'0':'1'});
          this.nextDigit=clock+6+r()*5;
        }
        if(mouse.active&&wind.energy>.25&&clock>=this.nextGust){
          let t=0,d=Infinity,branch=visible[0];
          for(const candidate of visible)for(let i=0;i<=12;i++){const p=this.branchPoint(i/12,candidate),dist=Math.hypot(mouse.x-p.x,mouse.y-p.y);if(dist<d){d=dist;t=i/12;branch=candidate;}}
          if(d<105){for(let i=0;i<3;i++)this.shed(clock,clamp(t+(this.random()-.5)*.13,0,1),branch);this.nextGust=clock+.65;}
        }
      }
      for(const p of [...this.petals,...this.digits]){
        const ambient=this.curl(p.x,p.y,clock);let wx=0,wy=0;
        for(const n of wind.samples){const age=clock-n.born;if(age<0||age>2.5)continue;
          const dx=p.x-n.x,dy=p.y-n.y,k=Math.exp(-(dx*dx+dy*dy)/11000)*Math.exp(-age/1.05)*n.power;
          wx+=(n.dx*48-n.curl*dy*.25)*k;wy+=(n.dy*30+n.curl*dx*.25)*k;
        }
        for(const n of wind.pulses){const age=clock-n.born,dx=p.x-n.x,dy=p.y-n.y,d=Math.hypot(dx,dy)||1;
          if(age>=0&&age<3.2&&d<110){const k=smooth(1-d/110)*Math.exp(-age/.85);wx+=dx/d*45*k;wy+=dy/d*25*k;}
        }
        const blend=1-Math.exp(-dt*2),near=.7+p.depth*.55;
        p.vx+=(ambient.x*.6+clamp(wx,-50,50)+5-p.vx)*blend;
        p.vy+=((p.glyph?-2:12+p.depth*6)+ambient.y*.22+clamp(wy,-22,30)-p.vy)*blend;
        p.x+=p.vx*dt*near;p.y+=p.vy*dt*near;p.angle+=p.spin*dt;
      }
      this.petals=this.petals.filter(p=>clock-p.born<p.life&&p.y<this.H+35&&p.x>-60&&p.x<this.W+60);
      this.digits=this.digits.filter(p=>clock-p.born<p.life&&p.y>-30&&p.y<this.H+35&&p.x>-60&&p.x<this.W+60);
      if(s&&clock>s.end)this.scene=null;
    }
    drawBackground(ctx,clock,dark){
      if(!this.composition.length||!this.ready)return;
      if(this.dirty){
        const layer=this.layer,c=this.layerCtx;
        this.layerTop=Math.floor(Math.min(...this.composition.map(s=>s.y))-40);
        const bottom=Math.max(...this.composition.map(s=>s.y+s.height))+40;
        layer.width=this.W;layer.height=Math.ceil(bottom-this.layerTop);
        c.clearRect(0,0,layer.width,layer.height);
        for(const s of this.composition){
          c.save();c.translate(s.x+s.width*.5,s.y+s.height*.5-this.layerTop);c.rotate(s.rotation);c.globalAlpha=s.alpha;
          if(s.side==='left')c.scale(-1,1);c.drawImage(this.image,-s.width*.5,-s.height*.5,s.width,s.height);c.restore();
        }
        // Transparent image and protected text are composited once after layout changes.
        for(const r of this.rects){
          if(r.soft){c.save();c.globalCompositeOperation='destination-out';c.globalAlpha=.7;
            c.fillRect(r.left-8,r.top-8-this.layerTop,r.right-r.left+16,r.bottom-r.top+16);c.restore();}
          else c.clearRect(r.left-8,r.top-8-this.layerTop,r.right-r.left+16,r.bottom-r.top+16);
        }
        this.dirty=false;
      }
      ctx.globalAlpha=dark?.75:1;ctx.drawImage(this.layer,0,this.layerTop);ctx.globalAlpha=1;
    }
    drawPetals(ctx,clock,dark){
      const ordered=this.petals.slice().sort((a,b)=>a.depth-b.depth);
      for(const p of ordered){
        const age=clock-p.born,alpha=smooth(age/.8)*smooth((p.life-age)/3)*this.clearance(p.x,p.y,18);
        if(alpha<.02)continue;
        const size=p.size*(.65+p.depth*.65),tilt=.5+.5*Math.abs(Math.sin(clock*.8+p.seed));
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(tilt,1);
        ctx.globalAlpha=alpha*(.27+p.depth*.2);ctx.fillStyle=dark?'rgb(252,206,225)':'rgb(248,202,219)';
        ctx.beginPath();ctx.moveTo(0,-size);ctx.quadraticCurveTo(size*1.2,-size*.15,size*.4,size*.9);
        ctx.quadraticCurveTo(-size*.8,size*.65,-size*.55,-size*.2);ctx.quadraticCurveTo(-size*.35,-size*.9,0,-size);ctx.fill();
        ctx.globalAlpha=alpha*.16;ctx.strokeStyle=dark?'rgb(255,227,237)':'rgb(235,169,192)';ctx.lineWidth=.45;
        ctx.beginPath();ctx.moveTo(0,-size*.6);ctx.quadraticCurveTo(-size*.15,0,size*.4,size*.8);ctx.stroke();ctx.restore();
      }
      for(const p of this.digits){
        const age=clock-p.born,alpha=smooth(age/2)*smooth((p.life-age)/4)*this.clearance(p.x,p.y,22);
        ctx.globalAlpha=alpha*.19;ctx.fillStyle=dark?'rgb(252,210,230)':'rgb(233,178,203)';
        ctx.font=p.size+'px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.glyph,p.x,p.y);
      }
      ctx.globalAlpha=1;
    }
  }
  if(typeof module==='object'&&module.exports)module.exports=SakuraGarden;
  else window.MoyuanSakuraGarden=SakuraGarden;
})();
