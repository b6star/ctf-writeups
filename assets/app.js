const copyIcon='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
const hitconCanvas=document.querySelector('canvas.hitcon-network');
if(hitconCanvas){
 const drawNetwork=()=>{
  const {width,height}=hitconCanvas.getBoundingClientRect();
  const scale=Math.min(window.devicePixelRatio||1,2);
  hitconCanvas.width=Math.round(width*scale);
  hitconCanvas.height=Math.round(height*scale);
  const ctx=hitconCanvas.getContext('2d');
  ctx.scale(scale,scale);
  const points=[];
  const count=Math.max(20,Math.round(width*height/18000));
  for(let attempt=0;points.length<count&&attempt<count*100;attempt++){
   const point={x:Math.random()*width,y:Math.random()*height};
   if(points.every(other=>Math.hypot(point.x-other.x,point.y-other.y)>62))points.push(point);
  }
  const edges=new Set();
  points.forEach((point,i)=>{
   const nearest=points.map((other,j)=>({j,d:Math.hypot(point.x-other.x,point.y-other.y)})).filter(item=>item.j!==i&&item.d<300).sort((a,b)=>a.d-b.d);
   nearest.slice(0,2+(Math.random()<.35?1:0)).forEach(({j,d})=>{
    const key=[i,j].sort((a,b)=>a-b).join('-');
    if(edges.has(key))return;
    edges.add(key);
    ctx.strokeStyle=`rgba(20,115,188,${Math.max(.28,.85-d/460)})`;
    ctx.lineWidth=.8;
    ctx.beginPath();ctx.moveTo(point.x,point.y);ctx.lineTo(points[j].x,points[j].y);ctx.stroke();
   });
  });
 };
 drawNetwork();
 let networkResize;
 window.addEventListener('resize',()=>{clearTimeout(networkResize);networkResize=setTimeout(drawNetwork,150)});
}
const archiveTerminal=document.querySelector('.site-home-hero .terminal');
if(archiveTerminal&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
 const lines=[...archiveTerminal.querySelectorAll('[data-boot-line]')];
 const originals=lines.map(line=>({html:line.innerHTML,text:line.textContent}));
 archiveTerminal.classList.add('terminal-animating');
 lines.forEach(line=>line.textContent='');
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 (async()=>{
  await pause(300);
  for(let i=0;i<lines.length;i++){
   const line=lines[i];
   line.classList.add('typing');
   for(const character of originals[i].text){line.textContent+=character;await pause(24);}
   line.innerHTML=originals[i].html;
   line.classList.remove('typing');
   await pause(230);
  }
  archiveTerminal.classList.remove('terminal-animating');
 })();
}
document.querySelectorAll('.prose pre').forEach(pre=>{
 const code=pre.querySelector('code');
 const language=[...code.classList].find(c=>c.startsWith('language-'))?.slice(9)||'text';
 const isFlag=['최종 Flag','Final Flag'].includes(pre.previousElementSibling?.textContent.trim());
 const names={bash:'Bash',sh:'Shell',shell:'Shell',python:'Python',sql:'SQL',json:'JSON',javascript:'JavaScript',yaml:'YAML',ini:'INI',powershell:'PowerShell',text:'Text',plain:'Text'};
 const panel=document.createElement('div');panel.className='code-panel'+(isFlag?' flag-panel':'');
 const toolbar=document.createElement('div');toolbar.className='code-toolbar';
 const label=document.createElement('span');label.className='code-label';label.textContent=isFlag?'Flag':(names[language]||language);
 const button=document.createElement('button');button.type='button';button.className='copy-code';button.innerHTML=copyIcon+'<span>Copy</span>';button.setAttribute('aria-label',isFlag?'Copy flag':'Copy code');
 button.onclick=async()=>{try{await navigator.clipboard.writeText(code.textContent);button.querySelector('span').textContent='Copied';}catch{button.querySelector('span').textContent='Failed';}setTimeout(()=>button.querySelector('span').textContent='Copy',1800);};
 pre.before(panel);toolbar.append(label,button);panel.append(toolbar,pre);
});

const search=document.querySelector('#search');
if(search){search.addEventListener('input',()=>{let found=0;document.querySelectorAll('.post-row').forEach(row=>{row.hidden=!row.dataset.title.includes(search.value.trim().toLowerCase());if(!row.hidden)found++;});document.querySelector('#empty').hidden=found!==0;});document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();search.focus();}});}
document.querySelectorAll('.prose img').forEach(img=>{img.tabIndex=0;img.setAttribute('aria-label',img.alt+' — enlarge');const open=()=>{const dialog=document.createElement('dialog');const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Close image');const image=img.cloneNode();image.removeAttribute('tabindex');dialog.append(close,image);document.body.append(dialog);close.onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close();};dialog.addEventListener('close',()=>{dialog.remove();img.focus();});dialog.showModal();};img.onclick=open;img.onkeydown=e=>{if(e.key==='Enter')open();};});

let attachmentIndexPromise;
document.querySelectorAll('.attachment-trigger').forEach(trigger=>{
 trigger.addEventListener('click',async()=>{
  try{
   attachmentIndexPromise ||= fetch(trigger.dataset.attachmentIndex).then(response=>{if(!response.ok)throw new Error('Attachment index');return response.json();});
   const index=await attachmentIndexPromise;
   const entries=index[trigger.dataset.attachmentSlug]?.[trigger.dataset.attachmentFile]||[];
   const root={children:new Map(),folder:true};
   for(const entry of entries){
    const parts=entry.path.split('/').filter(Boolean);
    let node=root;
    parts.forEach((part,i)=>{
     if(!node.children.has(part))node.children.set(part,{name:part,folder:i<parts.length-1||entry.folder,children:new Map()});
     node=node.children.get(part);
     if(i<parts.length-1||entry.folder)node.folder=true;
    });
   }
   const dialog=document.createElement('dialog');dialog.className='attachment-dialog';dialog.setAttribute('aria-label',trigger.dataset.attachmentFile+' file structure');
   const head=document.createElement('div');head.className='attachment-dialog-head';
   const title=document.createElement('div');title.innerHTML='<span class="field-label">FILE STRUCTURE</span><strong></strong>';title.querySelector('strong').textContent=trigger.dataset.attachmentFile;
   const close=document.createElement('button');close.type='button';close.className='attachment-close';close.textContent='×';close.setAttribute('aria-label','Close file structure');close.onclick=()=>dialog.close();head.append(title,close);
   const crumbs=document.createElement('nav');crumbs.className='attachment-crumbs';crumbs.setAttribute('aria-label','Folder path');
   const listing=document.createElement('div');listing.className='attachment-list';
   const location=[];
   function render(){
    crumbs.replaceChildren();listing.replaceChildren();
    crumbs.hidden=location.length===0;
    const levels=['Root',...location];
    levels.forEach((label,i)=>{
     if(i){const divider=document.createElement('span');divider.textContent='/';crumbs.append(divider);}
     const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=i===levels.length-1;button.onclick=()=>{location.length=i;render();};crumbs.append(button);
    });
    let current=root;for(const part of location)current=current.children.get(part);
    const children=[...current.children.values()].sort((a,b)=>Number(b.folder)-Number(a.folder)||a.name.localeCompare(b.name,undefined,{numeric:true}));
    for(const item of children){
     const row=document.createElement(item.folder?'button':'div');row.className='attachment-row'+(item.folder?' is-folder':' is-file');
     const icon=document.createElement('span');icon.className='attachment-icon';icon.textContent=item.folder?'▣':'▤';icon.setAttribute('aria-hidden','true');
     const label=document.createElement('span');label.textContent=item.name;row.append(icon,label);
     if(item.folder){row.type='button';row.setAttribute('aria-label','Open '+item.name);const arrow=document.createElement('span');arrow.className='attachment-arrow';arrow.textContent='→';row.append(arrow);row.onclick=()=>{location.push(item.name);render();};}
     listing.append(row);
    }
   }
   dialog.append(head,crumbs,listing);document.body.append(dialog);render();dialog.addEventListener('close',()=>{dialog.remove();trigger.focus();});dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});dialog.showModal();
  }catch(error){console.error('Unable to load attachment structure',error);}
 });
});

const languageToggle=document.querySelector('#writeup-language');
function readingAnchor(article){
 if(!article)return null;
 const referenceY=Math.min(160,window.innerHeight*.2);
 const articleRect=article.getBoundingClientRect();
 if(articleRect.top>referenceY||articleRect.bottom<referenceY)return null;
 const blocks=[...article.querySelectorAll('[data-sync-block]')];
 let block=blocks[0];
 for(const candidate of blocks){
  if(candidate.getBoundingClientRect().top<=referenceY)block=candidate;
  else break;
 }
 return block?{key:block.dataset.syncBlock,top:block.getBoundingClientRect().top}:null;
}
function setWriteupLanguage(language){
 const lang=language==='en'?'en':'ko';
 const current=document.querySelector('[data-writeup-language]:not([hidden])');
 const anchor=readingAnchor(current);
 const challengeAnchor=anchor?null:readingAnchor(document.querySelector('[data-challenge-language]:not([hidden])'));
 const previousOverflowAnchor=document.documentElement.style.overflowAnchor;
 document.documentElement.style.overflowAnchor='none';
 languageToggle.dataset.language=lang;
 languageToggle.querySelector('.language-current').textContent=lang==='en'?'ENG':'KOR';
 languageToggle.setAttribute('aria-pressed',String(lang==='ko'));
 document.documentElement.lang=lang;
 try{localStorage.setItem('writeup-language-v2',lang);}catch{}
 document.querySelectorAll('[data-writeup-language]').forEach(el=>{el.hidden=el.dataset.writeupLanguage!==lang;});
 document.querySelectorAll('[data-challenge-language]').forEach(el=>{el.hidden=el.dataset.challengeLanguage!==lang;});
 document.querySelectorAll('[data-toc-language]').forEach(el=>{el.hidden=el.dataset.tocLanguage!==lang;});
 if(anchor){
  const target=document.querySelector(`[data-writeup-language="${lang}"] [data-sync-block="${anchor.key}"]`);
  if(target)window.scrollBy(0,target.getBoundingClientRect().top-anchor.top);
 }else if(challengeAnchor){
  const target=document.querySelector(`[data-challenge-language="${lang}"] [data-sync-block="${challengeAnchor.key}"]`);
  if(target)window.scrollBy(0,target.getBoundingClientRect().top-challengeAnchor.top);
 }
 requestAnimationFrame(()=>{document.documentElement.style.overflowAnchor=previousOverflowAnchor;});
}
if(languageToggle){
 let initial='en';try{initial=localStorage.getItem('writeup-language-v2')||'en';}catch{}
 setWriteupLanguage(initial);
 languageToggle.addEventListener('click',()=>setWriteupLanguage(languageToggle.dataset.language==='en'?'ko':'en'));
}
