const paths:Record<string,string>={
 wave:'<path d="M2 8q3-4 7 0t7 0 6 0M2 16q3-4 7 0t7 0 6 0"/>',
 play:'<path d="m8 4 12 8-12 8z" fill="currentColor" stroke="none"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 sound:'<path d="m11 4-5 4H3v8h3l5 4zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
 mute:'<path d="m11 4-5 4H3v8h3l5 4zM16 9l6 6m0-6-6 6"/>',
 gear:'<path d="m10 3 4 0 1 3 3-1 2 3-2 3 2 2-2 4-3-1-1 3h-4l-1-3-3 1-2-4 2-2-2-3 2-3 3 1z"/><circle cx="12" cy="11" r="3"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 1 1 4 3c-1 1-1 2-1 2m0 3v.1"/>',
 trophy:'<path d="M7 3h10v7a5 5 0 0 1-10 0zM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v5m-5 1h10"/>',
 home:'<path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7"/>',
 replay:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
 clock:'<circle cx="12" cy="14" r="8"/><path d="M9 2h6M12 6V2m0 7v5l3 2"/>',
 crew:'<circle cx="12" cy="6" r="3"/><path d="M6 21v-4a6 6 0 0 1 12 0v4M3 10a3 3 0 0 0 0 6m18-6a3 3 0 0 1 0 6"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>'
};
export const icon=(name:string)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.wave}</svg>`;
