import type Phaser from 'phaser';
import {OBSTACLES,REEFS, type EntityKind} from '../config';
import {randomGenerator} from '../rules';
import {paintEntity} from '../art';
import rowboat from './assets/rowboat.png';
import fishing from './assets/fishing.png';
import tug from './assets/tug.png';
import cargo from './assets/cargo.png';
export const boatURLs={rowboat,fishing,tug,cargo};
type Ctx=CanvasRenderingContext2D;
const disk=(c:Ctx,x:number,y:number,r:number,color:string)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
export function dock(c:Ctx,x:number,y:number,w:number,h:number){
 c.save();c.translate(x,y);const gradient=c.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#e4b56e');gradient.addColorStop(1,'#a56534');
 c.fillStyle='#052536';c.fillRect(3,6,w,h);c.fillStyle=gradient;c.fillRect(0,0,w,h);c.strokeStyle='#744729';c.lineWidth=2;c.strokeRect(0,0,w,h);
 const horizontal=w>h;for(let p=12;p<(horizontal?w:h);p+=18){c.beginPath();if(horizontal){c.moveTo(p,2);c.lineTo(p,h-2);}else{c.moveTo(2,p);c.lineTo(w-2,p);}c.stroke();}
 for(let p=12;p<(horizontal?w:h);p+=62){const px=horizontal?p:w/2,py=horizontal?h/2:p;disk(c,px,py+3,8,'#6f462e');disk(c,px,py,8,'#f6ca7b');disk(c,px,py,4,'#d19349');}
 c.restore();
}
export function water(c:Ctx,w:number,h:number){
 const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#159ba5');g.addColorStop(.45,'#088d9b');g.addColorStop(1,'#086578');c.fillStyle=g;c.fillRect(0,0,w,h);
 const rand=randomGenerator(18);c.lineCap='round';
 for(let i=0;i<15;i++){c.strokeStyle=i%2?'#2cb4b31a':'#044b6710';c.lineWidth=25+rand()*45;c.beginPath();c.moveTo(-80,i*h/12);c.bezierCurveTo(w*.3,i*h/13-100,w*.6,i*h/13+90,w+80,i*h/12);c.stroke();}
 for(let i=0;i<w*h/4200;i++){const x=rand()*w,y=rand()*h;c.strokeStyle='#a1efdf24';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+6,y+3,x+12,y);c.stroke();}
}
export function whirlpool(c:Ctx,foam=false){
 c.save();c.translate(192,192);
 if(!foam){const g=c.createRadialGradient(0,0,4,0,0,149);g.addColorStop(0,'#021423');g.addColorStop(.33,'#04243d');g.addColorStop(.7,'#064f68');g.addColorStop(.95,'#107b89');g.addColorStop(1,'#38b9bb00');c.fillStyle=g;c.beginPath();c.arc(0,0,150,0,Math.PI*2);c.fill();
  for(let arm=0;arm<6;arm++){c.beginPath();for(let n=0;n<70;n++){const t=n/69,a=arm*Math.PI/3+t*4,r=13+t*128;const x=Math.cos(a)*r,y=Math.sin(a)*r;n?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle=arm%2?'#37bcc4b0':'#1988a3';c.lineWidth=3;c.stroke();}
  disk(c,0,0,42,'#011526');
  // Rim at world radius: 147.7 texture pixels × (2.6 radius / 384).
  c.strokeStyle='#a4f5e9';c.lineWidth=7;c.beginPath();c.arc(0,0,147.7,0,Math.PI*2);c.stroke();
  c.strokeStyle='#032637';c.lineWidth=4;c.beginPath();c.arc(0,0,139,0,Math.PI*2);c.stroke();
 }else{c.strokeStyle='#c1f6e6cc';c.lineCap='round';c.lineWidth=3;for(let i=0;i<4;i++){c.beginPath();c.arc(0,0,145,i*1.57+.2,i*1.57+.75);c.stroke();}}
 c.restore();
}
const canvas=(w:number,h:number,paint:(c:Ctx)=>void)=>{const el=document.createElement('canvas');el.width=w;el.height=h;paint(el.getContext('2d')!);return el;};
function stampBoat(c:Ctx,image:CanvasImageSource,kind:keyof typeof boatURLs,x:number,y:number,scale=1){
 const widths={rowboat:66,fishing:96,tug:120,cargo:182},heights={rowboat:29,fishing:42,tug:58,cargo:65};
 // Alpha-bounded image is fitted to the original silhouette dimensions. Never changes collision radii.
 const img=image as HTMLImageElement;const source=canvas(img.width,img.height,ctx=>ctx.drawImage(img,0,0));const data=source.getContext('2d')!.getImageData(0,0,source.width,source.height).data;
 let left=source.width,top=source.height,right=0,bottom=0;
 for(let py=0;py<source.height;py++)for(let px=0;px<source.width;px++)if(data[(py*source.width+px)*4+3]>8){left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);}
 c.drawImage(img,left,top,right-left+1,bottom-top+1,x-widths[kind]*scale/2,y-heights[kind]*scale/2,widths[kind]*scale,heights[kind]*scale);
}
export function createArt(scene:Phaser.Scene){
 const add=(key:string,w:number,h:number,paint:(c:Ctx)=>void)=>scene.textures.addCanvas(key,canvas(w,h,paint));
 add('harbor',1600,1100,c=>{
  water(c,1600,1100);
  for(const r of REEFS){c.fillStyle='#7bc6a640';c.beginPath();c.ellipse(r.x,r.y,r.radius,r.radius*.72,0,0,Math.PI*2);c.fill();c.strokeStyle='#c4d5a580';c.setLineDash([5,8]);c.stroke();c.setLineDash([]);for(let i=0;i<7;i++){c.fillStyle='#bad4a85c';c.beginPath();c.ellipse(r.x+Math.cos(i*2.4)*r.radius*.58,r.y+Math.sin(i*2.4)*r.radius*.4,13,8,0,0,Math.PI*2);c.fill();}c.fillStyle='#ecedc4';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText('SHALLOWS',r.x,r.y+r.radius*.72+16);}
  for(const o of OBSTACLES)if(o.kind==='rect')dock(c,o.x,o.y,o.width,o.height);else{
   disk(c,o.x,o.y,o.radius+5,'#91ccaa66');disk(c,o.x,o.y,o.radius,'#efcf88');disk(c,o.x-5,o.y-5,o.radius-14,'#518c60');
   for(let i=0;i<9;i++){const a=i*2.4,x=o.x+Math.cos(a)*o.radius*.6,y=o.y+Math.sin(a)*o.radius*.6;disk(c,x,y,18,i%2?'#79a960':'#306e55');disk(c,x-3,y-4,11,'#92b96e');}
  }
  c.fillStyle='#173f4b';c.fillRect(0,0,1600,27);c.fillRect(0,1072,1600,28);c.fillRect(0,0,28,1100);c.fillRect(1572,0,28,1100);
  c.strokeStyle='#4bb4b37d';c.lineWidth=2;c.strokeRect(28,27,1544,1045);
 });
 for(const kind of ['bottle','driftwood','crate','buoy','rowboat','fishing','tug','cargo'] as EntityKind[])add(kind,440,200,c=>{
  if(kind in boatURLs)stampBoat(c,scene.textures.get(`ocean-${kind}`).getSourceImage() as HTMLImageElement,kind as keyof typeof boatURLs,220,100,2);
  else{c.scale(2,2);c.translate(110,50);c.shadowColor='#062b3b';c.shadowBlur=2;c.shadowOffsetY=2;paintEntity(c,kind);c.shadowBlur=0;c.shadowOffsetY=0;}
 });
 add('vortex',384,384,c=>whirlpool(c));add('foam',384,384,c=>whirlpool(c,true));add('particle',12,12,c=>disk(c,6,6,3,'#b9f2da'));
}
/** Decorative Home composition only; does not alter the live world's camera or geometry. */
export function paintHome(target:HTMLCanvasElement,scene:Phaser.Scene){
 // Home uses the original PNGs, never the small, padded gameplay textures.
 // Cache their transparent bounds once; resizing must not repeatedly scan pixels.
 const boats=new Map<string,{source:HTMLImageElement;left:number;top:number;width:number;height:number}>();
 const boatSizes={rowboat:[66,29],fishing:[96,42],tug:[120,58],cargo:[182,65]} as const;
 for(const kind of Object.keys(boatSizes)){
  const source=scene.textures.get(`ocean-${kind}`).getSourceImage() as HTMLImageElement;
  const buffer=canvas(source.width,source.height,c=>c.drawImage(source,0,0));
  const data=buffer.getContext('2d')!.getImageData(0,0,buffer.width,buffer.height).data;
  let left=buffer.width,top=buffer.height,right=0,bottom=0;
  for(let y=0;y<buffer.height;y++)for(let x=0;x<buffer.width;x++)if(data[(y*buffer.width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  boats.set(kind,{source,left,top,width:right-left+1,height:bottom-top+1});
 }
 const draw=()=>{
  const w=target.clientWidth,h=target.clientHeight;if(!w||!h)return;
  const ratio=Math.min(2,devicePixelRatio||1);target.width=Math.round(w*ratio);target.height=Math.round(h*ratio);
  const c=target.getContext('2d')!;c.scale(ratio,ratio);c.imageSmoothingQuality='high';water(c,w,h);
  const image=(key:string,x:number,y:number,width:number,height:number,rotation=0)=>{
   c.save();c.translate(x,y);c.rotate(rotation);
   const boat=boats.get(key);
   if(boat){
    const [sw,sh]=boatSizes[key as keyof typeof boatSizes];
    // Match the existing composition's silhouette, then cap at source pixels on HiDPI.
    const dw=width*sw/220,dh=height*sh/100;
    const fit=Math.min(1,boat.width/(dw*ratio),boat.height/(dh*ratio));
    c.drawImage(boat.source,boat.left,boat.top,boat.width,boat.height,-dw*fit/2,-dh*fit/2,dw*fit,dh*fit);
   }else if(key==='vortex'||key==='foam'){
    c.scale(width/384,height/384);c.translate(-192,-192);whirlpool(c,key==='foam');
   }else{
    // Code-drawn props stay sharp at the canvas's actual display resolution too.
    c.scale(width/220,height/100);c.shadowColor='#062b3b';c.shadowBlur=2;c.shadowOffsetY=2;paintEntity(c,key as EntityKind);
   }
   c.restore();
  };
  if(w>=700){
   // Leave the left card readable; compose recognizable boats in the open water beside it.
   const x=w*.7,y=h*.51,k=Math.min(1.4,w/1150,h/560),r=300*k;
   dock(c,0,0,Math.min(300,w*.18),38);dock(c,w-55,0,55,Math.min(h*.32,230));dock(c,w-220,h-40,250,40);
   image('vortex',x,y,r,r);image('foam',x,y,r,r);image('rowboat',x+r*.09,y+r*.12,520*k,236*k,.65);
   image('fishing',w*.54,h*.2,620*k,280*k,-.5);image('cargo',w*.88,h*.32,640*k,290*k,.28);image('tug',w*.53,h*.8,550*k,250*k,-.3);
   for(const [px,py,key]of [[.9,.77,'buoy'],[.71,.88,'crate'],[.36,.12,'crate'],[.54,.49,'buoy'],[.8,.82,'driftwood']] as [number,number,string][])image(key,w*px,h*py,430*k,195*k,-.2);
  }else{
   const k=Math.min(w/780,h/650),x=w/2,y=h*.49;
   dock(c,0,0,w*.29,32);dock(c,w-30,0,30,Math.min(h*.28,130));dock(c,0,h-30,w*.2,30);
   image('vortex',x,y,350*k,350*k);image('foam',x,y,350*k,350*k);
   image('rowboat',x+30*k,y+34*k,640*k,290*k,.65);image('fishing',w*.22,h*.23,600*k,272*k,-.55);image('cargo',w*.83,h*.29,600*k,272*k,.25);image('tug',w*.24,h*.84,530*k,240*k,-.25);
   for(const [px,py,key]of [[.8,.76,'buoy'],[.13,.52,'buoy'],[.35,.7,'crate'],[.54,.13,'crate'],[.84,.91,'bottle']] as [number,number,string][])image(key,w*px,h*py,480*k,218*k,-.15);
  }
 };
 draw();const observer=new ResizeObserver(draw);observer.observe(target);scene.game.events.once('destroy',()=>observer.disconnect());
}
