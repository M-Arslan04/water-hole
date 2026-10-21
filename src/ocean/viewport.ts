/** Follow the usable viewport; composition belongs to each view's CSS. */
export function attachViewport(){
 const update=()=>{const v=visualViewport;document.documentElement.style.setProperty('--view-height',`${v?.height??innerHeight}px`);document.documentElement.style.setProperty('--view-top',`${v?.offsetTop??0}px`);};
 visualViewport?.addEventListener('resize',update);visualViewport?.addEventListener('scroll',update);window.addEventListener('resize',update);update();
}
