const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./vendor-pdf-libs-CgzHn2lQ.js","./vendor-BM-1UYFO.js"])))=>i.map(i=>d[i]);
import{_ as E}from"./vendor-pdf-libs-CgzHn2lQ.js";const u=_;(function(n,o){const t=_,c=n();for(;;)try{if(-parseInt(t(556))/1+-parseInt(t(426))/2*(-parseInt(t(562))/3)+-parseInt(t(551))/4+-parseInt(t(514))/5*(parseInt(t(444))/6)+-parseInt(t(495))/7+-parseInt(t(560))/8+parseInt(t(500))/9===o)break;c.push(c.shift())}catch{c.push(c.shift())}})(w,466448);function _(n,o){return n=n-422,w()[n]}const g=(function(){let n=!0;return function(o,t){const c=n?function(){const e=_;if(t){const a=t[e(483)](o,arguments);return t=null,a}}:function(){};return n=!1,c}})(),j=g(void 0,function(){const n=_,o=function(){const a=_;let r;try{r=Function("return (function() "+a(516)+");")()}catch{r=window}return r},t=o(),c=t.console=t.console||{},e=[n(506),n(468),"info",n(439),n(536),n(544),n(537)];for(let a=0;a<e[n(462)];a++){const r=g[n(550)][n(540)][n(474)](g),x=e[a],i=c[x]||r;r[n(435)]=g[n(474)](g),r[n(572)]=i[n(572)][n(474)](i),c[x]=r}});j();const v={letter:{portrait:"8.5in 11in",landscape:u(564)},a4:{portrait:"210mm 297mm",landscape:"297mm 210mm"},folio:{portrait:u(532),landscape:u(498)},cr80:{portrait:u(442),landscape:u(531)}},z={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function A(n){const o=u;return n[o(502)](/&/g,"&amp;").replace(/</g,o(513))[o(502)](/>/g,o(445))[o(502)](/"/g,o(463))}function M(n,o,t){return new Promise(c=>{const e=_,a=new Image;a[e(448)]=e(518),a[e(526)]=()=>{const r=e;let x=a.naturalWidth||a[r(464)],i=a[r(458)]||a[r(521)];if(!x||!i){c(n);return}const l=Math[r(508)](o/x,t/i,1);x=Math.max(1,Math.round(x*l)),i=Math[r(430)](1,Math[r(440)](i*l));try{const s=document.createElement(r(450));s.width=x,s[r(521)]=i;const f=s[r(434)]("2d");if(!f){c(n);return}f[r(489)](a,0,0,x,i),c(s[r(505)](r(472)))}catch{c(n)}},a.onerror=()=>c(n),a.src=n})}async function F(n){const o=u,t=[];n[o(499)](o(457)).forEach(c=>{const e=o,a=c;let r=a[e(515)](e(424))||"";if(!r||(r[e(496)]("/")&&(r=""+window[e(567)][e(511)]+r,a.setAttribute("src",r)),r.startsWith(e(522))||r.startsWith(e(524))))return;t[e(527)](M(r,2048,2048)[e(477)](l=>{const s=e;a[s(570)](s(424),l)}))}),await Promise[o(546)](t)}function H(n,o){const t=u,c=n[t(499)](t(425)),e=o.querySelectorAll(t(425));c[t(436)]((a,r)=>{const x=t,i=e[r];if(!i)return;let l="";if(a instanceof HTMLSelectElement)l=a[x(543)][a[x(569)]]?.text??a.value;else if(a instanceof HTMLInputElement&&a[x(552)]===x(423)){const f=a.checked,d=document[x(507)](x(459));d.className=i[x(558)],d[x(570)](x(541),i.getAttribute("style")||""),d[x(541)][x(517)]=x(480),d[x(541)][x(568)]=x(438),d[x(541)].justifyContent=x(438),d[x(541)][x(519)]=x(554),d[x(541)].borderRadius=x(470),d[x(541)][x(528)]=f?"#0f172a":x(433),d.style[x(471)]="#ffffff",d[x(541)].fontSize=x(475),d[x(541)][x(476)]=x(469),d[x(541)][x(473)]="1",d[x(541)][x(460)]="0",d[x(541)][x(574)]=x(493),d.textContent=f?"✓":"",i[x(512)]?.[x(549)](d,i);return}else l=a[x(427)]||"";const s=document[x(507)](x(459));s.textContent=l,s[x(558)]=i[x(558)],s[x(570)](x(541),i[x(515)](x(541))||""),s[x(541)][x(517)]=x(480),s.style[x(568)]=x(438),s[x(541)][x(453)]=i[x(490)][x(486)](x(481))?x(533):x(438),s[x(541)].width=x(478),s[x(541)][x(521)]=x(478),i[x(512)]?.[x(549)](s,i)})}function N(){const n=u;let o="";for(const t of Array.from(document[n(525)]))try{o+=Array[n(429)](t.cssRules).map(c=>c[n(488)])[n(452)](`
`)+`
`}catch{}return o}async function S(n){const o=u,{elements:t,title:c=o(535),paperSize:e,orientation:a=o(575),pageMargin:r="0",extraCss:x=""}=n;if(!t[o(462)])return"";const i=N(),l=[];for(const s of t){const f=s[o(422)](!0);H(s,f),await F(f),l[o(527)]('<div class="pdf-page">'+f[o(466)]+o(446))}return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`+A(c)+o(561)+i+o(545)+v[e][a]+o(449)+r+o(454)+x+o(529)+l[o(452)](`
`)+o(573)}async function L(n,o){const t=u;try{const c=(await E(async()=>{const p=_,{default:m}=await import(p(557))[p(477)](h=>h.h);return{default:m}},[],import.meta.url))[t(538)],{jsPDF:e}=await E(async()=>{const p=t,{jsPDF:m}=await import("./vendor-pdf-libs-CgzHn2lQ.js")[p(477)](h=>h.j);return{jsPDF:m}},__vite__mapDeps([0,1]),import.meta.url),{elements:a,paperSize:r,orientation:x=t(575),filename:i}=n,l=o||n.onProgressChange;if(!a[t(462)])return{success:!1,error:t(559)};let s="a4";r===t(553)?s=[53.98,85.6]:r===t(465)?s=t(465):r===t(565)&&(s=[215.9,330.2]);const f=new e({orientation:x,unit:"mm",format:s,compress:!0}),d=f[t(431)][t(432)].getWidth(),k=f[t(431)][t(432)].getHeight(),y=a.length,P=y>1;for(let p=0;p<y;p++){p>0&&f.addPage(s,x);const m=a[p],h=m.offsetWidth||m.getBoundingClientRect()[t(464)]||1,D=d/25.4*(P?160:250),T=Math[t(508)](P?2:3,Math[t(430)](1.2,D/h)),I=await c(m,{scale:T,useCORS:!0,allowTaint:!0,backgroundColor:t(433),logging:!1});let b=I[t(505)](t(447),.9),C="JPEG";if((!b||b===t(504)||!b[t(496)](t(479)))&&(b=I[t(505)](t(472)),C=t(509)),!b||b===t(504)||!b[t(496)](t(479))){console.warn(t(534),m);continue}f.addImage(b,C,0,0,d,k,void 0,t(455)),l&&l(Math[t(440)]((p+1)/y*100)),await new Promise(W=>setTimeout(W,15))}return f[t(555)](""+(i[t(503)](t(547))?i:i+t(547))),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c[t(441)]:t(510)}}}async function R(n){const o=u,t=window[o(443)];if(t?.exportHtmlPdf){const c=await S(n);if(!c)return{success:!1,error:"Nothing to export."};const{paperSize:e,orientation:a=o(575)}=n,r=z[e][a];return t[o(542)]({html:c,defaultFilename:n[o(492)],paperSize:e,pageWidthPx:r[o(464)],pageHeightPx:r[o(521)],landscape:a===o(428)})}else return L(n,n[o(491)])}async function G(n){const o=u,t=await S(n);return t?new Promise(c=>{const e=o;try{const a=document[e(507)](e(566));a[e(541)][e(451)]=e(501),a[e(541)][e(456)]="0",a[e(541)][e(523)]="0",a[e(541)][e(464)]="0",a[e(541)][e(521)]="0",a[e(541)].border="0",a[e(541)][e(548)]=e(497),document[e(530)][e(467)](a);const r=a.contentWindow?.[e(437)]||a[e(539)];if(!r){document[e(530)][e(563)](a),c({success:!1,error:e(494)});return}r[e(484)](),r[e(485)](t),r.close(),a[e(526)]=()=>{setTimeout(()=>{const x=_;try{a[x(487)]?.[x(482)](),a.contentWindow?.[x(571)](),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i[x(441)]:x(461)})}finally{setTimeout(()=>{const i=x;document[i(530)][i(486)](a)&&document[i(530)][i(563)](a)},5e3)}},500)}}catch(a){c({success:!1,error:a instanceof Error?a[e(441)]:e(461)})}}):{success:!1,error:o(520)}}function w(){const n=["focus","apply","open","write","contains","contentWindow","cssText","drawImage","classList","onProgressChange","filename","border-box","Failed to access iframe document.","5934446BgXTbF","startsWith","-9999","13in 8.5in","querySelectorAll","24961077eGwPuP","fixed","replace","endsWith","data:,","toDataURL","log","createElement","min","PNG","Direct download failed.","origin","parentNode","&lt;","15KifXca","getAttribute",'{}.constructor("return this")( )',"display","anonymous","border","Nothing to print.","height","blob:","bottom","data:","styleSheets","onload","push","backgroundColor",`
</style>
</head>
<body>
`,"body","85.6mm 53.98mm","8.5in 13in","flex-start","Skipping element with empty canvas image:","Document","exception","trace","default","contentDocument","prototype","style","exportHtmlPdf","options","table",`
@page {
    size: `,"all",".pdf","zIndex","replaceChild","constructor","3044580TwkiPr","type","cr80","1.5px solid #0f172a","save","240693NIJnQD","./vendor-pdf-libs-CgzHn2lQ.js","className","Nothing to export.","4924016gLlzzm",`</title>
<style>
`,"78kDKJiJ","removeChild","11in 8.5in","folio","iframe","location","alignItems","selectedIndex","setAttribute","print","toString",`
</body>
</html>`,"boxSizing","portrait","cloneNode","checkbox","src","input, select, textarea","60130mvwlQa","value","landscape","from","max","internal","pageSize","#ffffff","getContext","__proto__","forEach","document","center","error","round","message","53.98mm 85.6mm","electronAPI","1247154fdZOCT","&gt;","</div>","image/jpeg","crossOrigin",`;
    margin: `,"canvas","position","join","justifyContent",`;
}
html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}
.pdf-page {
    break-after: page;
    page-break-after: always;
    /* Strip the on-screen sheet chrome so only the form prints. */
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    margin: 0 auto !important;
}
.pdf-page:last-child {
    break-after: auto;
    page-break-after: auto;
}
/* Keep all text selectable in the produced PDF and force background colors/images to print. */
*, body * {
    user-select: text !important;
    -webkit-user-select: text !important;
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
}
`,"FAST","right","img","naturalHeight","span","flexShrink","Print failed.","length","&quot;","width","letter","outerHTML","appendChild","warn","900","2px","color","image/png","lineHeight","bind","9px","fontWeight","then","100%","data:image/","inline-flex","text-left"];return w=function(){return n},w()}export{R as e,G as p};
