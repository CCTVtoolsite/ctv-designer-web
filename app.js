(()=>{"use strict";
const CAT=window.CCTV_CATALOG||{cameras:[],switches:[],nvrs:[]},S={objects:[],cables:[],selected:null,history:[],plan:null,scale:null};const $=s=>document.querySelector(s),stage=$("#stage"),plan=$("#plan"),empty=$("#empty"),status=$("#status"),overlay=$("#overlay");const snap=()=>JSON.stringify({objects:S.objects,cables:S.cables,selected:S.selected,scale:S.scale});function push(){S.history.push(snap());if(S.history.length>60)S.history.shift()}function next(t){let p=t==="camera"?"K":t==="switch"?"SW":"NVR",n=1;while(S.objects.some(o=>o.name===p+n))n++;return p+n}function models(t){return t==="camera"?CAT.cameras:t==="switch"?CAT.switches:CAT.nvrs}function defaultModel(t){return models(t)[0]?.model||""}function add(type,x=.5,y=.5){push();S.objects.push({id:crypto.randomUUID(),type,name:next(type),x,y,rot:0,range:.22,model:""});S.selected=S.objects.at(-1).id;render()}function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function camSpec(o){return CAT.cameras.find(c=>c.model===o.model)||{hfov:90}}function pt(cx,cy,r,a){let q=a*Math.PI/180;return [cx+Math.cos(q)*r,cy+Math.sin(q)*r]}function wedge(cx,cy,r,rot,hfov){if(hfov>=180)return "";let a=pt(cx,cy,r,rot-hfov/2),b=pt(cx,cy,r,rot+hfov/2);return cx+","+cy+" "+a[0]+","+a[1]+" "+b[0]+","+b[1]}function fovs(){let r=stage.getBoundingClientRect(),w=r.width,h=r.height,html="";for(const o of S.objects.filter(x=>x.type==="camera")){let c=camSpec(o),cx=o.x*w,cy=o.y*h,rr=o.range*Math.min(w,h);if(c.panoramic||c.hfov>=180){html+='<circle class="fov" cx="'+cx+'" cy="'+cy+'" r="'+rr+'"/><circle class="dori-red" cx="'+cx+'" cy="'+cy+'" r="'+rr*.78+'"/><circle class="dori-yellow" cx="'+cx+'" cy="'+cy+'" r="'+rr*.52+'"/><circle class="dori-green" cx="'+cx+'" cy="'+cy+'" r="'+rr*.28+'"/>'}else{html+='<polygon class="fov" points="'+wedge(cx,cy,rr,o.rot,c.hfov)+'"/><polygon class="dori-red" points="'+wedge(cx,cy,rr*.78,o.rot,c.hfov)+'"/><polygon class="dori-yellow" points="'+wedge(cx,cy,rr*.52,o.rot,c.hfov)+'"/><polygon class="dori-green" points="'+wedge(cx,cy,rr*.28,o.rot,c.hfov)+'"/>'}}overlay.innerHTML=html+renderCables()}
function renderCables(){let r=stage.getBoundingClientRect(),w=r.width,h=r.height,parts=[];for(const c of S.cables){let a=S.objects.find(o=>o.id===c.from),b=S.objects.find(o=>o.id===c.to);if(!a||!b)continue;let x1=a.x*w,y1=a.y*h,x2=b.x*w,y2=b.y*h,mx=x1;parts.push('<polyline class="netCable" points="'+x1+','+y1+' '+mx+','+y2+' '+x2+','+y2+'"/>');parts.push('<text class="netCableLabel" x="'+((mx+x2)/2+5)+'" y="'+(y2-6)+'">'+c.label+'</text>')}return parts.join("")}
function render(){stage.querySelectorAll(".obj,.objLabel").forEach(e=>e.remove());for(const o of S.objects){let d=document.createElement("div");d.className="obj "+o.type+(o.id===S.selected?" selected":"");d.textContent=o.name;d.style.left=o.x*100+"%";d.style.top=o.y*100+"%";d.dataset.id=o.id;stage.append(d);let l=document.createElement("div");l.className="objLabel";l.textContent=o.name+(o.model?" · "+o.model:"");l.style.left=o.x*100+"%";l.style.top=o.y*100+"%";stage.append(l)}empty.style.display=(S.plan||S.objects.length)?"none":"grid";fovs();inspector();list();$("#undoBtn").disabled=!S.history.length}
function groupedOptions(arr,sel){return '<option value="">-- Välj modell --</option>'+["Axis","Hikvision","Dahua","Ajax"].map(b=>{let q=arr.filter(x=>x.brand===b);return q.length?'<optgroup label="'+b+'">'+q.map(x=>'<option value="'+esc(x.model)+'" '+(x.model===sel?"selected":"")+'>'+esc(x.model)+'</option>').join("")+"</optgroup>":""}).join("")}
function inspector(){let o=S.objects.find(x=>x.id===S.selected),el=$("#inspector");if(!o){el.innerHTML="Välj ett objekt på ritningen.";return}let arr=models(o.type);el.innerHTML='<b>'+o.name+'</b><div class="brand">'+esc(o.type.toUpperCase())+'</div><label>Modell<select id="modelSelect">'+groupedOptions(arr,o.model)+'</select></label>'+(o.type==="camera"?'<label>Rotation <b id="rotVal">'+o.rot+'°</b><input id="rotInput" type="range" min="0" max="359" value="'+o.rot+'"></label><label>Synfältslängd<input id="rangeInput" type="range" min="8" max="60" value="'+Math.round(o.range*100)+'"></label><div class="rotateBtns"><button data-r="-45">↶ 45°</button><button data-r="45">45° ↷</button></div>':"");$("#modelSelect").onchange=e=>{push();o.model=e.target.value;render()};if(o.type==="camera"){$("#rotInput").oninput=e=>{o.rot=+e.target.value;render()};$("#rangeInput").oninput=e=>{o.range=+e.target.value/100;fovs()};el.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{push();o.rot=(o.rot+ +b.dataset.r+360)%360;render()})}}
function list(){$("#camList").innerHTML=S.objects.map(o=>'<div class="row" data-sel="'+o.id+'"><b>'+o.name+'</b><br><small>'+esc(o.model)+'</small></div>').join("")}
let drag=null;stage.addEventListener("pointerdown",e=>{let d=e.target.closest(".obj");if(!d)return;e.preventDefault();let o=S.objects.find(x=>x.id===d.dataset.id),r=stage.getBoundingClientRect();push();S.selected=o.id;drag={id:o.id,node:d,p:e.pointerId,dx:e.clientX-(r.left+o.x*r.width),dy:e.clientY-(r.top+o.y*r.height)};try{stage.setPointerCapture(e.pointerId)}catch{}inspector();list()});stage.addEventListener("pointermove",e=>{if(!drag)return;e.preventDefault();let r=stage.getBoundingClientRect(),o=S.objects.find(x=>x.id===drag.id);o.x=Math.max(.015,Math.min(.985,(e.clientX-r.left-drag.dx)/r.width));o.y=Math.max(.02,Math.min(.98,(e.clientY-r.top-drag.dy)/r.height));drag.node.style.left=o.x*100+"%";drag.node.style.top=o.y*100+"%";let labels=[...stage.querySelectorAll(".objLabel")],idx=S.objects.indexOf(o);if(labels[idx]){labels[idx].style.left=o.x*100+"%";labels[idx].style.top=o.y*100+"%"}fovs()});stage.addEventListener("pointerup",()=>{if(drag){drag=null;render()}});stage.onclick=e=>{let d=e.target.closest(".obj");if(d){S.selected=d.dataset.id;render()}};$("#camList").onclick=e=>{let r=e.target.closest("[data-sel]");if(r){S.selected=r.dataset.sel;render()}};
document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>add(b.dataset.add));$("#planBtn").onclick=()=>$("#planFile").click();$("#planFile").onchange=e=>{let f=e.target.files[0];if(!f)return;let rd=new FileReader();rd.onload=()=>{S.plan=rd.result;plan.src=S.plan;try{localStorage.setItem("cctvPlan",S.plan)}catch{}status.textContent="Ritning laddad.";render()};rd.readAsDataURL(f)};
function data(){return {version:12,name:$("#projectName").value,objects:S.objects,cables:S.cables,scale:S.scale,plan:S.plan}}function load(q){S.objects=q.objects||[];S.cables=q.cables||[];S.scale=q.scale||null;S.plan=q.plan||null;S.selected=null;$("#projectName").value=q.name||"Projekt";if(S.plan)plan.src=S.plan;else plan.removeAttribute("src");render()}
$("#saveBtn").onclick=()=>{localStorage.setItem("cctvProject",JSON.stringify(data()));status.textContent="Projekt sparat lokalt."};$("#loadBtn").onclick=()=>{let x=localStorage.getItem("cctvProject");if(!x)return status.textContent="Inget sparat projekt hittades.";try{load(JSON.parse(x));status.textContent="Sparat projekt laddat."}catch{status.textContent="Kunde inte läsa projektet."}};
$("#exportBtn").onclick=()=>{let b=new Blob([JSON.stringify(data(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=($("#projectName").value||"cctv-project").replace(/[^a-z0-9_-]/gi,"_")+".json";a.click();URL.revokeObjectURL(a.href)};$("#importBtn").onclick=()=>$("#importFile").click();$("#importFile").onchange=e=>{let f=e.target.files[0];if(!f)return;let rd=new FileReader();rd.onload=()=>{try{load(JSON.parse(rd.result));status.textContent="Projekt importerat."}catch{status.textContent="Ogiltig projektfil."}};rd.readAsText(f)};
$("#undoBtn").onclick=()=>{if(!S.history.length)return;let q=JSON.parse(S.history.pop());S.objects=q.objects;S.cables=q.cables||[];S.selected=q.selected;S.scale=q.scale;render()};$("#newBtn").onclick=()=>{if(!confirm("Skapa nytt tomt projekt?"))return;S.objects=[];S.cables=[];S.selected=null;S.plan=null;plan.removeAttribute("src");render()};$("#scaleBtn").onclick=()=>status.textContent="Tvåpunktskalibrering är nästa steg.";
function expandKRefs(text){
 const ids=new Set(),t=String(text||"").toLowerCase();
 for(const m of t.matchAll(/\bk(\d+)\s*[-–]\s*k?(\d+)\b/g)){let a=+m[1],b=+m[2];if(a>b)[a,b]=[b,a];if(b-a>63)continue;for(let n=a;n<=b;n++)ids.add("K"+n)}
 for(const m of t.matchAll(/\bk(\d+)\b/g))ids.add("K"+(+m[1]));
 return [...ids];
}
function clauseCameraSpec(clause){
 const c=String(clause||"").toLowerCase();
 const brand=(c.match(/\b(axis|hikvision|dahua|ajax)\b/)||[])[1]||null;
 const mp=(c.match(/\b(\d{1,2})\s*mp\b/)||[])[1];
 let model=null;
 const modelPatterns=[/\b(p\d{4}[a-z0-9-]*)\b/i,/\b(m\d{4}[a-z0-9-]*)\b/i,/\b(q\d{4}[a-z0-9-]*)\b/i,/\b(ds-[a-z0-9-]+)\b/i,/\b(ipc-[a-z0-9-]+)\b/i];
 for(const rx of modelPatterns){const mm=c.match(rx);if(mm){model=mm[1];break}}
 return{brand,mp:mp?+mp:null,model,panoramic:/\b360\b|fisheye|panorama/.test(c)};
}
function cameraMP(p){let r=String(p.resolution||"").match(/(\d+(?:\.\d+)?)\s*MP/i);if(r)return +r[1];if(/4K/i.test(String(p.resolution||"")))return 8;return 0}
function is360Product(p){return !!(p.panoramic||p.coverage360||/fisheye|360|panoramic/i.test(String(p.type||"")+" "+String(p.fov||"")+" "+String(p.model||"")))}
function splitLockedKClauses(raw){
 let t=String(raw||"").replace(/\s+/g," ").trim();
 t=t.replace(/\b(k\d+)\s*,\s*(?=k\d+\b)/gi,"$1 ");
 t=t.replace(/([,;.]\s*)(?=k\d+\b)/gi,"§");
 t=t.replace(/\s+\b(?:och|samt)\s+(?=k\d+\b)/gi,"§");
 return t.split(/§|[;\n]+/).map(x=>x.trim()).filter(Boolean);
}
function buildLockedKPlan(raw,kObjects){
 const existing=new Map(kObjects.map(o=>[String(o.name||"").toUpperCase(),o])),assignments=new Map(),errors=[];
 for(const clause of splitLockedKClauses(raw)){
   const refs=expandKRefs(clause);if(!refs.length)continue;
   const spec=clauseCameraSpec(clause),meaningful=!!(spec.brand||spec.model||spec.mp||spec.panoramic);
   if(!meaningful)continue;
   for(const id of refs){if(!existing.has(id)){errors.push(id+" finns inte i projektet");continue}assignments.set(id,spec)}
 }
 return{assignments,errors};
}
function pickExactCameraForK(spec){
 let pool=CAT.cameras.filter(p=>!spec.brand||String(p.brand||"").toLowerCase()===spec.brand.toLowerCase());
 if(spec.model){const key=spec.model.toLowerCase().replace(/[^a-z0-9]/g,"");const exact=pool.filter(p=>String(p.model||"").toLowerCase().replace(/[^a-z0-9]/g,"").includes(key));if(exact.length)return exact[0];return null}
 pool=pool.filter(p=>spec.panoramic?is360Product(p):!is360Product(p));
 if(spec.mp){const exact=pool.filter(p=>Math.abs(cameraMP(p)-spec.mp)<.25);if(!exact.length)return null;pool=exact}
 return pool[0]||null;
}
function ensureNetworkObjects(){
 const cams=S.objects.filter(o=>o.type==="camera");let nvr=S.objects.find(o=>o.type==="nvr"),sw=S.objects.find(o=>o.type==="switch"),created=[];
 if(!nvr&&cams.length){nvr={id:crypto.randomUUID(),type:"nvr",name:next("nvr"),x:.5,y:.5,rot:0,range:.22,model:""};S.objects.push(nvr);created.push(nvr.name)}
 if(!sw&&cams.length){let ax=nvr?nvr.x:.5,ay=nvr?nvr.y:.5,cx=cams.reduce((q,o)=>q+o.x,0)/cams.length,cy=cams.reduce((q,o)=>q+o.y,0)/cams.length;sw={id:crypto.randomUUID(),type:"switch",name:next("switch"),x:(ax+cx)/2,y:(ay+cy)/2,rot:0,range:.22,model:""};S.objects.push(sw);created.push(sw.name)}
 return created;
}
function buildV18Topology(){
 const created=ensureNetworkObjects(),nvrs=S.objects.filter(o=>o.type==="nvr"),sws=S.objects.filter(o=>o.type==="switch"),cams=S.objects.filter(o=>o.type==="camera");
 if(!nvrs.length)return{error:"NVR saknas."};if(!sws.length)return{error:"Switch kunde inte skapas."};if(!cams.length)return{error:"Kameror saknas."};
 const links=[],remaining=[...sws];let prev=nvrs[0],n=1;
 while(remaining.length){remaining.sort((a,b)=>Math.hypot(a.x-prev.x,a.y-prev.y)-Math.hypot(b.x-prev.x,b.y-prev.y));let sw=remaining.shift();links.push({id:"c"+Date.now()+"_"+n++,from:prev.id,to:sw.id,label:(prev.name||"NVR")+" → "+sw.name,kind:"uplink"});prev=sw}
 for(const cam of cams){let sw=[...sws].sort((a,b)=>Math.hypot(a.x-cam.x,a.y-cam.y)-Math.hypot(b.x-cam.x,b.y-cam.y))[0];links.push({id:"c"+Date.now()+"_"+n++,from:sw.id,to:cam.id,label:sw.name+" → "+cam.name,kind:"camera"})}
 S.cables=links;return{links,created};
}
function compact(v){return String(v||"").toLowerCase().replace(/[^a-z0-9]/g,"")}
function findEquipmentModel(type,text){
 const arr=models(type),t=compact(text),brand=(String(text).match(/\b(axis|hikvision|dahua|ajax)\b/i)||[])[1];
 let pool=brand?arr.filter(p=>String(p.brand||"").toLowerCase()===brand.toLowerCase()):arr;
 let best=null,score=0;
 for(const p of pool){let pm=compact(p.model),tokens=String(p.model).toLowerCase().match(/[a-z]*\d+[a-z0-9-]*/g)||[];for(const token of tokens){let k=compact(token);if(k.length>=4&&t.includes(k)&&k.length>score){best=p;score=k.length}}}
 return best;
}
function assignEquipmentFromText(type,text){
 const objs=S.objects.filter(o=>o.type===type);if(!objs.length)return{changed:0,error:(type==="nvr"?"NVR":"switch")+" saknas i projektet."};
 const p=findEquipmentModel(type,text);if(!p)return{changed:0,error:"Ingen säker "+type+"-modell hittades i katalogen."};
 let target=objs[0],m=String(text).match(new RegExp("\\b"+(type==="nvr"?"NVR":"SW")+"(\\d+)\\b","i"));if(m){let q=objs.find(o=>o.name.toUpperCase()===(type==="nvr"?"NVR":"SW")+m[1]);if(q)target=q}
 target.model=p.model;return{changed:1,target,product:p};
}
function isEquipmentInstruction(t,type){return type==="nvr"?/\bnvr\b|inspelare|recorder/i.test(t):/\bsw(?:itch)?\b|switch/i.test(t)}
function isNetworkInstruction(t){return /(?:nätverkskabel|cat6|kabel|koppla|anslut)/i.test(t)&&/(?:nvr|switch)/i.test(t)}
function runAI(){
 const txt=$("#aiPrompt").value.trim();if(!txt){status.textContent="Beskriv vad AI ska göra.";return}
 if(isNetworkInstruction(txt)){push();let msgs=[];if(isEquipmentInstruction(txt,"nvr")){let a=assignEquipmentFromText("nvr",txt);if(a.changed)msgs.push(a.target.name+" → "+a.product.model)}if(isEquipmentInstruction(txt,"switch")){let a=assignEquipmentFromText("switch",txt);if(a.changed)msgs.push(a.target.name+" → "+a.product.model)}const topo=buildV18Topology();if(topo.error){status.textContent="AI stoppad: "+topo.error;return}status.textContent=(msgs.length?msgs.join(" · ")+" · ":"")+(topo.created&&topo.created.length?"AI skapade "+topo.created.join(", ")+" eftersom den saknades. ":"")+"Nätverk skapat: NVR → switch → kameror. "+topo.links.length+" länkar.";render();return}
 if(isEquipmentInstruction(txt,"nvr")){push();let a=assignEquipmentFromText("nvr",txt);status.textContent=a.error||a.target.name+" → "+a.product.model;render();return}
 if(isEquipmentInstruction(txt,"switch")){push();let a=assignEquipmentFromText("switch",txt);status.textContent=a.error||a.target.name+" → "+a.product.model;render();return}
 const registry=S.objects.filter(x=>x.type==="camera"),plan=buildLockedKPlan(txt,registry);
 if(plan.errors.length){status.textContent="AI stoppad: "+plan.errors.join(" · ");return}
 if(!plan.assignments.size){status.textContent="Ingen K-tilldelning hittades. Ex: K1,K2,K3 Axis 360. K4,K5 Axis P3278.";return}
 const planned=[];
 for(const [kid,spec] of plan.assignments){const o=registry.find(x=>String(x.name).toUpperCase()===kid),p=pickExactCameraForK(spec);if(!p){status.textContent="AI stoppad: ingen exakt katalogmatch för "+kid+(spec.model?" modell "+spec.model:"")+(spec.brand?" "+spec.brand:"")+(spec.panoramic?" 360°":"")+". Inget ändrades.";return}planned.push({o,p,spec})}
 push();
 for(const x of planned){x.o.model=x.p.model;if(x.spec.panoramic)x.o.rot=0}
 status.textContent="K-tilldelning verifierad: "+planned.map(x=>x.o.name+" → "+x.o.model).join(" · ")+". Positionerna ändrades inte.";
 render();
}
$("#aiBtn").onclick=runAI;
let saved=localStorage.getItem("cctvProject");if(saved)try{load(JSON.parse(saved))}catch{}else{let p=localStorage.getItem("cctvPlan");if(p){S.plan=p;plan.src=p}render()}
})();