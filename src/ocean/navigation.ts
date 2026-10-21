import type {HarborScene} from '../game';
/** Shared solo navigation; native lifecycle is attached only by Android. */
export function attachOceanNavigation(scene:HarborScene){
 const leave=document.createElement('dialog');leave.id='ocean-leave-round';leave.setAttribute('aria-labelledby','ocean-leave-title');
 leave.innerHTML='<h2 id="ocean-leave-title">Leave this round?</h2><p>Your unfinished round will be discarded. Your personal best stays saved.</p><button id="ocean-keep-playing" class="primary-button">Keep playing</button><button id="ocean-confirm-leave" class="help-button">Leave round</button>';
 document.querySelector('#app')!.append(leave);
 const requestHome=()=>{if(scene.mode==='finished'){scene.home();return;}if(scene.mode!=='paused'&&scene.mode!=='playing')return;scene.pauseRound();scene.setMenuOpen(true);if(!leave.open)leave.showModal();document.querySelector<HTMLElement>('#ocean-keep-playing')!.focus();};
 document.querySelector<HTMLButtonElement>('#pause-home')!.onclick=requestHome;
 document.querySelector<HTMLButtonElement>('#ocean-keep-playing')!.onclick=()=>{leave.close();scene.setMenuOpen(false);scene.resumeRound();};
 document.querySelector<HTMLButtonElement>('#ocean-confirm-leave')!.onclick=()=>{leave.close();scene.setMenuOpen(false);scene.home();};
 leave.addEventListener('close',()=>{scene.setMenuOpen(false);if(scene.mode==='paused')document.querySelector<HTMLElement>('#pause-home')!.focus({preventScroll:true});});
 // An always-visible close action saves scrolling to the bottom of long help/settings.
 for(const[id,label]of [['preferences','Close settings'],['how-to-play','Close how to play']]){
  const dialog=document.getElementById(id) as HTMLDialogElement,button=document.createElement('button');button.type='button';button.className='ocean-dialog-close';button.setAttribute('aria-label',label);button.textContent='Close';button.onclick=()=>dialog.close();dialog.prepend(button);
 }
 return{requestHome,findDialog:()=>[...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1)??null};
}
interface AppEvents {addListener(event:'pause'|'resume'|'backButton',callback:()=>void):Promise<unknown>;minimizeApp():Promise<unknown>}
interface SceneNavigation {mode:string;pauseRound():void;home():void;audio:{pause():void}}
export async function attachOceanLifecycle(app:AppEvents,scene:SceneNavigation,loop:{sleep():void;wake():void},navigation:{requestHome():void;findDialog():{close():void;dispatchEvent?:(e:Event)=>boolean;open?:boolean}|null},nearby?:{active():boolean;leave():void;back?:()=>void;background():void}){
 await app.addListener('pause',()=>{if(nearby?.active())nearby.background();scene.pauseRound();scene.audio.pause();loop.sleep();});
 await app.addListener('resume',()=>{if(!nearby?.active())loop.wake();});
 await app.addListener('backButton',()=>{
  const dialog=navigation.findDialog();if(dialog){if(!dialog.dispatchEvent||dialog.dispatchEvent(new Event('cancel',{cancelable:true})))dialog.close();return;}
  if(nearby?.active()){(nearby.back??nearby.leave)();return;}
  if(scene.mode==='playing')scene.pauseRound();
  else if(scene.mode==='paused')navigation.requestHome();
  else if(scene.mode==='finished')scene.home();
  else void app.minimizeApp();
 });
}

/** A named secondary view, never a height-based page split. Keeps native detail toggle hooks. */
export function attachDetailView(detail:HTMLDetailsElement){
 const name=detail.querySelector('summary')!.textContent||'Details';
 const button=document.createElement('button');button.className='help-button';button.textContent=name;button.setAttribute('aria-haspopup','dialog');
 const parent=detail.closest('#nearby')||document.body;detail.before(button);const view=document.createElement('dialog');view.className='detail-dialog';
 const heading=document.createElement('h2');heading.textContent=name;heading.tabIndex=-1;
 const close=document.createElement('button');close.className='ocean-dialog-close';close.textContent='Close';close.setAttribute('aria-label','Close '+name);close.onclick=()=>view.close();
 detail.querySelector('summary')!.hidden=true;view.append(close,heading,detail);detail.classList.add('detail-content');parent.append(view);
 button.onclick=()=>{detail.open=true;view.showModal();heading.focus({preventScroll:true});};view.addEventListener('close',()=>{detail.open=false;button.focus({preventScroll:true});});
 return {button,view};
}
