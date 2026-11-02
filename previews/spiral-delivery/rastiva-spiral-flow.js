class RastivaSpiralFlow {
  constructor(canvas, config = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.config = { mode:'discovery', items:[], turns:3, speed:2, spacing:8, spread:3.2, sizeAttenuation:2, imageSize:192, fadeIn:18, fadeOut:8, cornerRadius:16, mobileItemLimit:6, visibleCardCap:12, centerOffsetX:0, centerOffsetY:0, selectionInterval:7000, selectionDuration:1400, sparkleCount:6, selectedScale:1.08, exitStart:.75, targetX:.5, targetY:.54, ...config };
    this.images=new Map(); this.progress=0; this.last=0; this.selected=-1; this.selectedAt=0; this.lastSelection=0; this.frames=0; this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.preload(); this.resize=this.resize.bind(this); this.frame=this.frame.bind(this); this.resize(); this.observer=new ResizeObserver(this.resize); this.observer.observe(canvas); this.buildArc(); this.draw(performance.now()); if(!this.reduced)requestAnimationFrame(this.frame);
  }
  preload(){this.config.items.forEach(item=>{if(!item.image)return;const img=new Image();img.onload=()=>this.images.set(item.image,img);img.onerror=()=>this.images.set(item.image,null);img.src=item.image;});}
  resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);this.dpr=d;this.canvas.width=Math.floor(this.w*d);this.canvas.height=Math.floor(this.h*d);this.ctx.setTransform(d,0,0,d,0,0);this.buildArc();}
  spiral(n,R){const a=n*this.config.turns*Math.PI*2,rad=R*(1-n);return{x:rad*Math.cos(a),y:-rad*Math.sin(a)};}
  buildArc(){const M=1200;this.cum=new Float32Array(M+1);let prev=this.spiral(0,1);for(let k=1;k<=M;k++){const p=this.spiral(k/M,1),dx=p.x-prev.x,dy=p.y-prev.y;this.cum[k]=this.cum[k-1]+Math.hypot(dx,dy);prev=p;}this.arcTotal=this.cum[M]||1;this.arcMap=new Float32Array(769);let j=0;for(let a=0;a<=768;a++){const target=a/768*this.arcTotal;while(j<M&&this.cum[j+1]<target)j++;const seg=this.cum[j+1]-this.cum[j];this.arcMap[a]=(j+(seg?(target-this.cum[j])/seg:0))/M;}}
  arcToN(s){const x=Math.max(0,Math.min(768,s*768)),i=Math.floor(x),a=this.arcMap[i],b=this.arcMap[Math.min(768,i+1)];return a+(b-a)*(x-i);}
  ease(t){return t*t*(3-2*t);}
  choose(now,count){this.selected=(this.selected+1)%count;this.selectedAt=now;this.lastSelection=now;this.deliveryLane=this.selected%4;}
  drawCard(item,card,selected,age){
    const c=this.ctx,{x,y,angle,w,h,opacity}=card;
    c.save();
    c.translate(x,y);
    c.rotate(angle);
    c.globalAlpha=opacity;
    c.scale(selected?this.config.selectedScale:1,selected?this.config.selectedScale:1);
    c.shadowColor='#00e676';
    c.shadowBlur=selected?22:0;
    c.fillStyle='rgba(12,20,17,.9)';
    c.strokeStyle=selected?'#00e676':'rgba(245,247,246,.23)';
    c.beginPath();
    c.roundRect(-w/2,-h/2,w,h,this.config.cornerRadius);
    c.fill();
    c.stroke();

    // Imagem interna do produto com clip
    c.save();
    c.beginPath();
    c.roundRect(-w*.44,-h*.42,w*.88,h*.68,this.config.cornerRadius*.65);
    c.clip();
    const img=this.images.get(item.image);
    if(img&&img.complete&&img.naturalWidth>0){
      c.drawImage(img,-w*.44,-h*.42,w*.88,h*.68);
    }else{
      const g=c.createRadialGradient(0,-h*.12,3,0,-h*.12,w*.6);
      g.addColorStop(0,'rgba(0,230,118,.36)');
      g.addColorStop(1,'rgba(0,194,168,.04)');
      c.fillStyle=g;
      c.fillRect(-w*.44,-h*.42,w*.88,h*.68);
    }
    c.restore();

    // Texto contido e clipado dentro dos limites do card
    const maxTextWidth = w * 0.84;
    const leftX = -w * 0.42;

    c.save();
    c.beginPath();
    c.rect(-w/2 + 6, h * 0.26, w - 12, h * 0.22);
    c.clip();

    c.fillStyle='#f5f7f6';
    c.font=`700 ${Math.max(9, Math.min(14, h*.095))}px Montserrat, sans-serif`;
    c.fillText(item.title||'', leftX, h*.37, maxTextWidth);

    c.fillStyle='#aeb9b5';
    c.font=`500 ${Math.max(7.5, Math.min(11, h*.07))}px Montserrat, sans-serif`;
    c.fillText(item.category||'', leftX, h*.46, maxTextWidth);
    c.restore();

    if(selected){
      const flash=Math.max(0,1-age/.24);
      if(flash){
        c.fillStyle=`rgba(245,247,246,${flash*.48})`;
        c.beginPath();
        c.roundRect(-w/2,-h/2,w,h,this.config.cornerRadius);
        c.fill();
      }
      c.fillStyle='#00e676';
      c.font=`700 ${Math.max(7, Math.min(11, h*.065))}px Montserrat, sans-serif`;
      c.fillText('SELECIONADO', leftX, -h*.47, maxTextWidth);
    }
    c.restore();
  }
  drawSparkles(card,age){if(age>.8)return;const c=this.ctx;for(let i=0;i<this.config.sparkleCount;i++){const a=i*Math.PI*2/this.config.sparkleCount+age*.8,d=18+age*58,x=card.x+Math.cos(a)*d,y=card.y+Math.sin(a)*d;c.save();c.globalAlpha=1-age/.8;c.strokeStyle=i%3===0?'#f5f7f6':i%2?'#00e676':'#00c2a8';c.lineWidth=1.5;c.beginPath();c.moveTo(x-3,y);c.lineTo(x+3,y);c.moveTo(x,y-3);c.lineTo(x,y+3);c.stroke();c.restore();}}
  draw(now){
    const c=this.ctx;
    c.clearRect(0,0,this.w,this.h);
    const items=this.w<600?this.config.items.slice(0,this.config.mobileItemLimit):this.config.items;
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.1) : 0;
    this.last = now;
    if (!this.reduced) this.progress = (this.progress + this.config.speed * dt) % 100;
    if (!this.reduced && now - this.lastSelection > this.config.selectionInterval) this.choose(now, items.length);
    const safeMargin = this.config.imageSize * .9;
    const R = typeof this.config.radius === 'function' ? this.config.radius(this.w, this.h) : (typeof this.config.radius === 'number' ? this.config.radius : Math.max(this.config.imageSize, Math.min(this.w * .5 - safeMargin, this.h * .5 - safeMargin) * (1 + (this.config.spread - 1) * .06)));
    const base = this.progress / 100, step = Math.max(.012, (this.config.spacing * .5) / 100), slots = Math.min(this.config.visibleCardCap, Math.ceil(1 / step) + 2), cards = [];
    const anchor = this.config.anchor?.(this.w, this.h);
    const centerOffsetX = anchor ? anchor.x - .5 : (typeof this.config.centerOffsetX === 'function' ? this.config.centerOffsetX(this.w, this.h) : this.config.centerOffsetX);
    const centerOffsetY = anchor ? anchor.y - .5 : (typeof this.config.centerOffsetY === 'function' ? this.config.centerOffsetY(this.w, this.h) : this.config.centerOffsetY);
    const targetX = anchor?.targetX ?? (typeof this.config.targetX === 'function' ? this.config.targetX(this.w, this.h) : this.config.targetX);
    const targetY = anchor?.targetY ?? (typeof this.config.targetY === 'function' ? this.config.targetY(this.w, this.h) : this.config.targetY);
    const sz = typeof this.config.safeZone === 'function' ? this.config.safeZone(this.w, this.h) : this.config.safeZone;
    const lane = this.deliveryLane || 0;

    for (let i = 0; i < slots; i++) {
      const path = (base + i * step) % 1, s = this.config.mode === 'discovery' ? 1 - path : path, n = this.arcToN(s), p = this.spiral(n, R), dist = Math.hypot(p.x, p.y);
      const scale = Math.pow(Math.min(dist / R, 1), this.config.sizeAttenuation * .5);
      const deltaN = 0.003;
      const pNext = this.spiral(Math.min(n + deltaN, 1), R);
      const pPrev = this.spiral(Math.max(n - deltaN, 0), R);
      const angle = Math.atan2(pNext.y - pPrev.y, pNext.x - pPrev.x);
      const img = i % items.length;
      let opacity = this.config.mode === 'discovery' ? (path < this.config.fadeIn / 100 ? path / (this.config.fadeIn / 100) : path > 1 - this.config.fadeOut / 100 ? (1 - path) / (this.config.fadeOut / 100) : 1) : (s < this.config.fadeIn / 100 ? s / (this.config.fadeIn / 100) : s > 1 - this.config.fadeOut / 100 ? (1 - s) / (this.config.fadeOut / 100) : 1);
      cards.push({ n, s, img, x: this.w * (.5 + centerOffsetX) + p.x, y: this.h * (.5 + centerOffsetY) + p.y, angle, w: this.config.imageSize * scale, h: this.config.imageSize * scale, opacity: Math.max(.03, opacity) });
    }
    cards.sort((a,b)=>a.n-b.n);
    let selectedCard=null;
    cards.forEach(card=>{
      const selected=card.img===this.selected&&card.s>.58&&card.s<.83,age=selected?(now-this.selectedAt)/1000:9;
      const delivering = (this.config.mode==='delivery'&&selected&&age>this.config.exitStart);

      // Cards vivem atrás da copy: só suaviza o contraste na região editorial.
      if(sz && !delivering){
        const cardLeft = card.x - card.w*.5;
        const cardTop = card.y - card.h*.5;
        if(sz.xMax > 0 && cardLeft < sz.xMax){
          const buffer = sz.buffer || 90;
          card.opacity *= .42 + .58 * Math.max(0, Math.min(1, (cardLeft - (sz.xMax - buffer)) / buffer));
        }
        if(sz.yMax > 0 && cardTop < sz.yMax){
          const bufferY = sz.bufferY || 80;
          card.opacity *= .5 + .5 * Math.max(0, Math.min(1, (cardTop - (sz.yMax - bufferY)) / bufferY));
        }
      }

      if(this.config.mode==='discovery'&&selected&&age>.32){
        const t=this.ease(Math.min(1,(age-.32)/.68)),dx=card.x-this.w/2,dy=card.y-this.h/2,len=Math.hypot(dx,dy)||1;
        card.x+=dx/len*Math.min(this.w,this.h)*.34*t;card.y+=dy/len*Math.min(this.w,this.h)*.34*t;card.w*=1+t*.20;card.h*=1+t*.20;card.opacity=1-t*.92;
      }
      if(delivering){
        const t=this.ease(Math.min(1,(age-this.config.exitStart)/(1.1-this.config.exitStart)));
        const route = [
          { x: -this.w * .18, y: -this.h * .035 }, // A: esquerda
          { x: this.w * .18, y: -this.h * .035 },  // B: direita
          { x: this.w * .035, y: this.h * .16 },   // C: inferior
          { x: -this.w * .12, y: -this.h * .15 }   // D: diagonal superior
        ][lane];
        const bend = Math.sin(t * Math.PI);
        card.x+=(this.w*targetX-card.x)*t + route.x * bend;
        card.y+=(this.h*targetY-card.y)*t + route.y * bend;
        card.angle*=1-t;
        card.w*=1-t*.72;
        card.h*=1-t*.72;
        card.opacity=1-t*.88;
        if(t>.94&&!this.delivered){
          this.delivered=true;
          this.config.onDelivered?.(card,items[card.img]);
        }
        if(t<.1)this.delivered=false;
      }
      this.drawCard(items[card.img],card,selected,age);
      if(selected){
        selectedCard=card;
        this.drawSparkles(card,age);
      }
    });
    window.RastivaSpiralFlowStatus={loaded:true,frames:this.frames,canvasWidth:this.w,canvasHeight:this.h,reducedMotion:this.reduced,running:!this.reduced};
  }
  frame(now){this.frames++;this.draw(now);requestAnimationFrame(this.frame);}
}
window.RastivaSpiralFlow=RastivaSpiralFlow;
