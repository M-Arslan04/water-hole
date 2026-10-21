import {CONFIG} from '../config';
import {drawMinimap} from '../minimap';
import type {HarborScene} from '../game';
import {icon} from './icons';
import {createScreenFocus} from './focus';
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
export function mountOcean(){
 document.body.classList.add("ocean");
 document.querySelector('#app')!.innerHTML=`<main class="shell ocean-shell" data-screen="welcome">
 <section id="welcome" class="ocean-home" aria-label="Water Hole home">
  <header class="ocean-header"><div class="ocean-brand brand"><span>${icon('wave')}</span><b>WATER HOLE</b></div><div class="ocean-header-actions"><button id="settings" class="icon-button" aria-label="Settings" aria-haspopup="dialog">${icon('gear')}</button><button id="sound" class="icon-button" aria-label="Mute sound" aria-pressed="false">${icon('sound')}</button></div></header>
  <div class="ocean-hero"><canvas id="ocean-home-art" aria-label="Illustrated Sunbreak Harbor, with boats circling a whirlpool" role="img"></canvas><span class="ocean-location">SUNBREAK HARBOR <i></i> 01</span></div>
  <div class="start-card"><h1>Small swirl.<br><em>Big appetite.</em></h1><button id="play" class="primary-button" disabled>${icon('play')}<span>Loading harbor…</span></button><button id="welcome-help" data-open-help class="help-button ocean-home-help" aria-haspopup="dialog">${icon('help')} How to play</button><div class="ocean-home-bottom"><div><span>PERSONAL BEST</span><strong id="welcome-best">—</strong></div></div></div>
 </section>
 <section id="game-frame" class="ocean-arena" aria-label="Solo round" inert aria-hidden="true">
  <div id="hud" class="ocean-hud"><div><span>SCORE</span><strong id="score">0</strong></div><div class="ocean-timer">${icon('clock')}<strong id="timer">1:30</strong></div><button id="pause" class="icon-button" aria-label="Pause game">${icon('pause')}</button></div>
  <div class="ocean-water-wrap"><div id="game" role="application" tabindex="0" aria-label="Harbor. Drag to steer."></div><div id="toast" role="presentation" aria-hidden="true"></div></div>
  <div id="game-status" class="ocean-status"><div class="ocean-growth"><div class="ocean-growth-heading"><strong id="stage-name">Little ripple</strong><span id="stage-number">1 / 6</span></div><div class="growth-track" role="progressbar" aria-label="Progress to next growth stage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="growth-fill"></i></div><span id="current-target">Collect driftwood</span><span id="next-target">Next: crates & buoys</span></div><canvas id="minimap" width="160" height="110" aria-label="Harbor map"></canvas><p id="hint-text">Drag to steer · lift to stop</p></div>
 </section>
 <section id="pause-overlay" class="ocean-pause" role="region" aria-label="Game paused" hidden><div class="ocean-panel" role="dialog" aria-modal="true" aria-labelledby="pause-title"><h2 id="pause-title">Paused</h2><div class="pause-actions"><button id="resume" class="primary-button">${icon('play')} Resume round</button><button id="pause-help" class="help-button" data-open-help aria-haspopup="dialog">${icon('help')} How to play</button><button id="pause-settings" class="help-button">${icon('gear')} Settings</button><button id="pause-home" class="help-button" aria-haspopup="dialog">${icon('home')} Return home</button></div></div></section>
 <section id="result" class="ocean-results" role="region" aria-label="Solo round results" hidden>
  <div class="ocean-result-top"><span class="ocean-preview-tag">SOLO · SUNBREAK HARBOR</span><h1 id="result-title" tabindex="-1">Round complete</h1><div class="ocean-trophy" aria-hidden="true">${icon('trophy')}<i>✦</i><i>✦</i><i>✧</i></div><span id="result-kicker" class="ocean-overline">A GOOD DAY AT THE HARBOR</span></div>
  <div class="ocean-final"><strong id="final-score">0</strong><span>POINTS SCOOPED UP</span></div>
  <div class="ocean-best">${icon('trophy')} Personal best <strong id="result-best">0</strong></div>
  <dl class="ocean-result-stats"><div><dt>Highest stage</dt><dd id="result-stage"></dd></div><div><dt>Biggest catch</dt><dd id="largest"></dd></div><div><dt>Objects captured</dt><dd id="captured"></dd></div></dl>
  <div class="ocean-result-actions"><button id="again" class="primary-button">${icon('replay')} Play again</button><button id="ocean-home" class="help-button">${icon('home')} Return home</button></div>
 </section>
 </main><p id="ocean-start-error" role="alert" hidden></p>`;
}
export function bindOcean(scene:HarborScene,startLoop:()=>void,stopLoop:()=>void,hooks:{playLabel?:'Play'|'Play solo';beforePlay?:()=>Promise<void>;beforeReplay?:()=>Promise<void>;canInteract?:()=>boolean}={}){
 const focusScreen=createScreenFocus();
 let bestAtStart=scene.best,previous='',stage=-1,toastTimer=0;
 const start=async(id:string,hook?:()=>Promise<void>)=>{const button=el<HTMLButtonElement>(id);button.disabled=true;try{await hook?.();if(hooks.canInteract?.()===false)return;bestAtStart=scene.best;startLoop();scene.startRound();}catch{el('ocean-start-error').hidden=false;el('ocean-start-error').textContent='Return to the game and try Play again.';}finally{button.disabled=false;}};
 el('play').onclick=()=>void start('play',hooks.beforePlay);el('again').onclick=()=>void start('again',hooks.beforeReplay);el('pause').onclick=()=>scene.pauseRound();el('resume').onclick=()=>scene.resumeRound();el('ocean-home').onclick=()=>scene.home();el('pause-settings').onclick=()=>el('settings').click();
 el('sound').onclick=()=>{scene.audio.setMuted(!scene.audio.muted);el('sound').innerHTML=icon(scene.audio.muted?'mute':'sound');el('sound').setAttribute('aria-label',scene.audio.muted?'Unmute sound':'Mute sound');el('sound').setAttribute('aria-pressed',String(scene.audio.muted));};
 scene.onToast=(text,type='')=>{el('toast').textContent=text;el('toast').className=`visible ${type}`;clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>el('toast').className='',2100);};
 scene.onReady=()=>{el<HTMLButtonElement>('play').disabled=false;el('play').innerHTML=`${icon('play')}<span>${hooks.playLabel ?? 'Play solo'}</span>`;};
 const mini=el<HTMLCanvasElement>('minimap'),ctx=mini.getContext('2d')!;
 scene.onSnapshot=s=>{
  const active=s.mode==='playing'||s.mode==='paused';const shell=document.querySelector<HTMLElement>('.ocean-shell')!;
  if(s.mode!==previous){
   shell.dataset.screen=s.mode;document.body.classList.toggle('ocean-playing',active);document.body.classList.toggle('in-round',active);el('game-frame').dataset.mode=s.mode;document.body.classList.toggle('ocean-finished',s.mode==='finished');
   el('welcome').hidden=s.mode!=='welcome';el('result').hidden=s.mode!=='finished';el('pause-overlay').hidden=s.mode!=='paused';el('game-frame').inert=s.mode!=='playing';el('game-frame').setAttribute('aria-hidden',String(!active));
   if(s.mode==='playing'){focusScreen(el('game'));if(previous!=='paused'){el('toast').className='';stage=-1;}}
   if(s.mode==='paused')requestAnimationFrame(()=>{if(!document.querySelector('dialog[open]'))focusScreen(el('resume'));});
   if(s.mode==='finished'){el('result').scrollTop=0;requestAnimationFrame(()=>focusScreen(el('result-title')));stopLoop();}
   if(s.mode==='welcome'){const returningHome=previous!=='';requestAnimationFrame(()=>{if(scene.mode!=='welcome')return;if(scene.game?.isBooted)stopLoop();if(returningHome)focusScreen(el('play'));});}
   previous=s.mode;
  }
  el('welcome-best').textContent=s.best?s.best.toLocaleString('en'):'Set your first';el('score').textContent=s.score.toLocaleString('en');el('timer').textContent=`${Math.floor(s.time/60)}:${String(s.time%60).padStart(2,'0')}`;el('timer').classList.toggle('urgent',s.time<=15);
  el('stage-name').textContent=CONFIG.stages[s.stage].name;el('stage-number').textContent=`${s.stage+1} / 6`;
  el('growth-fill').style.width=`${Math.max(2,s.progress*100)}%`;const progress=document.querySelector('.growth-track')!;progress.setAttribute('aria-valuenow',String(Math.round(s.progress*100)));progress.setAttribute('aria-valuetext',s.stage===5?'Maximum stage reached':`${Math.round(s.progress*100)} percent to ${CONFIG.stages[s.stage+1].name}`);
  el('current-target').textContent=`Collect ${CONFIG.stages[s.stage].target.toLowerCase()}`;el('next-target').textContent=s.stage===5?'Beat your personal best':`Next: ${CONFIG.stages[s.stage+1].target.toLowerCase()}`;
  el('hint-text').textContent=s.slowed?'Shallows slow you down · steer into blue':navigator.maxTouchPoints?'Drag to steer · lift to stop':'Hold to steer · WASD / arrows';
  if(stage!==s.stage&&s.mode==='playing'){if(stage>=0&&!scene.reducedMotion)el('stage-name').animate([{color:'#fff7e5'},{color:'#ffce65'},{color:'#fff7e5'}],{duration:650});stage=s.stage;}
  if(active)mini.setAttribute('aria-label',drawMinimap(ctx,scene,s));
  if(s.mode==='finished'){
   el('final-score').textContent=s.score.toLocaleString('en');el('result-best').textContent=s.best.toLocaleString('en');el('largest').textContent=s.largest;el('captured').textContent=String(s.captured);el('result-stage').textContent=`${s.stage+1} / 6 · ${CONFIG.stages[s.stage].name}`;el('result-kicker').textContent=s.score>bestAtStart?'NEW PERSONAL BEST':'A GOOD DAY AT THE HARBOR';
   el('result').classList.toggle('new-best',s.score>bestAtStart);
  }
 };
}
