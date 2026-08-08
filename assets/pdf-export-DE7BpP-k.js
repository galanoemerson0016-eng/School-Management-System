const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./vendor-pdf-libs-CUB0ZFCL.js","./vendor-CPdzHyoa.js"])))=>i.map(i=>d[i]);
import{_ as D}from"./vendor-pdf-libs-CUB0ZFCL.js";function w(){const e=["zIndex","./vendor-pdf-libs-CUB0ZFCL.js","114386VpRBXM","all",'{}.constructor("return this")( )',"getAttribute","letter","backgroundColor","img","data:,","100%","bottom","1816032IAXbgz","table","appendChild","checked",'<div class="pdf-page">',`;
    margin: `,"endsWith","7DMUPUN","close","flexShrink","toString","height","startsWith","round","contentDocument","3978271mZBvcQ","Nothing to print.","border","electronAPI","21822OcRkFx","type","blob:","forEach","style","querySelectorAll","12IvWkNN","image/jpeg","write","info","</div>","parentNode","constructor","11in 8.5in",".pdf","JPEG","right","filename","pageSize","#ffffff","warn","min","print","focus","map","center","apply","exception",`
@page {
    size: `,"10XudZis","Failed to access iframe document.","anonymous","cssRules","getContext","message","width","&gt;","portrait","location","internal","position","default","contains","8.5in 13in",`;
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
`,"length","boxSizing","outerHTML","onload","src","1.5px solid #0f172a","Skipping element with empty canvas image:","inline-flex","9px","body","85.6mm 53.98mm","className","display","then","return (function() ","from","onProgressChange","image/png","fontSize","84484WBlJJg","options","classList","15ZLapHG","justifyContent","span","cr80","input, select, textarea","610kDlITx","offsetWidth","210mm 297mm","900","join","8.5in 11in","data:image/","naturalWidth","borderRadius","createElement","removeChild","3549644qcDkLv","selectedIndex","36981QHMVGn","getBoundingClientRect","error",`
</body>
</html>`,"text-left","canvas","border-box","bind","cssText","Nothing to export.","contentWindow","replaceChild","flex-start","FAST","Print failed.","replace","value","push","log","cloneNode","addPage","PNG","getWidth","setAttribute","alignItems","console","Document","exportHtmlPdf","max","styleSheets"];return w=function(){return e},w()}const u=_;(function(e,r){const t=_,c=e();for(;;)try{if(parseInt(t(497))/1*(-parseInt(t(626))/2)+-parseInt(t(576))/3*(-parseInt(t(573))/4)+-parseInt(t(538))/5*(-parseInt(t(509))/6)+parseInt(t(592))/7+parseInt(t(636))/8+-parseInt(t(594))/9*(-parseInt(t(581))/10)+-parseInt(t(505))/11*(parseInt(t(515))/12)===r)break;c.push(c.shift())}catch{c.push(c.shift())}})(w,335612);const b=(function(){let e=!0;return function(r,t){const c=e?function(){const n=_;if(t){const a=t[n(535)](r,arguments);return t=null,a}}:function(){};return e=!1,c}})(),T=b(void 0,function(){const e=_;let r;try{r=Function(e(568)+e(628)+");")()}catch{r=window}const t=r[e(619)]=r[e(619)]||{},c=[e(612),e(529),e(518),e(596),e(536),e(637),"trace"];for(let n=0;n<c[e(554)];n++){const a=b[e(521)].prototype.bind(b),o=c[n],x=t[o]||a;a.__proto__=b[e(601)](b),a[e(500)]=x[e(500)][e(601)](x),t[o]=a}});T();const A={letter:{portrait:u(586),landscape:u(522)},a4:{portrait:u(583),landscape:"297mm 210mm"},folio:{portrait:u(552),landscape:"13in 8.5in"},cr80:{portrait:"53.98mm 85.6mm",landscape:u(564)}},W={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function z(e){const r=u;return e[r(609)](/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,r(545))[r(609)](/"/g,"&quot;")}function j(e,r,t){return new Promise(c=>{const n=_,a=new Image;a.crossOrigin=n(540),a.onload=()=>{const o=n;let x=a[o(588)]||a[o(544)],i=a.naturalHeight||a[o(501)];if(!x||!i){c(e);return}const d=Math[o(530)](r/x,t/i,1);x=Math[o(622)](1,Math[o(503)](x*d)),i=Math[o(622)](1,Math[o(503)](i*d));try{const s=document[o(590)](o(599));s.width=x,s[o(501)]=i;const f=s[o(542)]("2d");if(!f){c(e);return}f.drawImage(a,0,0,x,i),c(s.toDataURL(o(571)))}catch{c(e)}},a.onerror=()=>c(e),a.src=e})}async function H(e){const r=u,t=[];e[r(514)](r(632))[r(512)](c=>{const n=r,a=c;let o=a[n(629)]("src")||"";if(!o||(o[n(502)]("/")&&(o=""+window[n(547)].origin+o,a[n(617)]("src",o)),o[n(502)](n(511))||o.startsWith("data:")))return;t[n(611)](j(o,2048,2048).then(d=>{const s=n;a[s(617)](s(558),d)}))}),await Promise[r(627)](t)}function _(e,r){return e=e-495,w()[e]}function F(e,r){const t=u,c=e.querySelectorAll(t(580)),n=r[t(514)](t(580));c.forEach((a,o)=>{const x=t,i=n[o];if(!i)return;let d="";if(a instanceof HTMLSelectElement)d=a[x(574)][a[x(593)]]?.text??a[x(610)];else if(a instanceof HTMLInputElement&&a[x(510)]==="checkbox"){const f=a[x(639)],l=document[x(590)]("span");l[x(565)]=i[x(565)],l[x(617)](x(513),i.getAttribute(x(513))||""),l[x(513)][x(566)]="inline-flex",l[x(513)][x(618)]="center",l[x(513)][x(577)]=x(534),l.style[x(507)]=x(559),l[x(513)][x(589)]="2px",l.style[x(631)]=f?"#0f172a":x(528),l.style.color=x(528),l[x(513)][x(572)]=x(562),l.style.fontWeight=x(584),l[x(513)].lineHeight="1",l[x(513)][x(499)]="0",l[x(513)][x(555)]=x(600),l.textContent=f?"✓":"",i[x(520)]?.replaceChild(l,i);return}else d=a[x(610)]||"";const s=document[x(590)](x(578));s.textContent=d,s.className=i[x(565)],s.setAttribute(x(513),i[x(629)](x(513))||""),s[x(513)][x(566)]=x(561),s[x(513)][x(618)]="center",s[x(513)][x(577)]=i[x(575)][x(551)](x(598))?x(606):x(534),s[x(513)][x(544)]=x(634),s[x(513)][x(501)]="100%",i[x(520)]?.[x(605)](s,i)})}function L(){const e=u;let r="";for(const t of Array.from(document[e(623)]))try{r+=Array[e(569)](t[e(541)])[e(533)](c=>c[e(602)])[e(585)](`
`)+`
`}catch{}return r}async function S(e){const r=u,{elements:t,title:c=r(620),paperSize:n,orientation:a=r(546),pageMargin:o="0",extraCss:x=""}=e;if(!t[r(554)])return"";const i=L(),d=[];for(const s of t){const f=s[r(613)](!0);F(s,f),await H(f),d[r(611)](r(640)+f[r(556)]+r(519))}return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`+z(c)+`</title>
<style>
`+i+r(537)+A[n][a]+r(495)+o+r(553)+x+`
</style>
</head>
<body>
`+d[r(585)](`
`)+r(597)}async function N(e,r){const t=u;try{const c=(await D(async()=>{const p=_,{default:m}=await import(p(625))[p(567)](g=>g.h);return{default:m}},[],import.meta.url))[t(550)],{jsPDF:n}=await D(async()=>{const p=t,{jsPDF:m}=await import("./vendor-pdf-libs-CUB0ZFCL.js")[p(567)](g=>g.j);return{jsPDF:m}},__vite__mapDeps([0,1]),import.meta.url),{elements:a,paperSize:o,orientation:x=t(546),filename:i}=e,d=r||e.onProgressChange;if(!a.length)return{success:!1,error:t(603)};let s="a4";o===t(579)?s=[53.98,85.6]:o===t(630)?s=t(630):o==="folio"&&(s=[215.9,330.2]);const f=new n({orientation:x,unit:"mm",format:s,compress:!0}),l=f[t(548)].pageSize[t(616)](),k=f.internal[t(527)].getHeight(),y=a[t(554)],I=y>1;for(let p=0;p<y;p++){p>0&&f[t(614)](s,x);const m=a[p],g=m[t(582)]||m[t(595)]()[t(544)]||1,E=l/25.4*(I?160:250),M=Math.min(I?2:3,Math.max(1.2,E/g)),P=await c(m,{scale:M,useCORS:!0,allowTaint:!0,backgroundColor:t(528),logging:!1});let h=P.toDataURL(t(516),.9),C=t(524);if((!h||h===t(633)||!h[t(502)](t(587)))&&(h=P.toDataURL(t(571)),C=t(615)),!h||h===t(633)||!h[t(502)](t(587))){console[t(529)](t(560),m);continue}f.addImage(h,C,0,0,l,k,void 0,t(607)),d&&d(Math[t(503)]((p+1)/y*100)),await new Promise(v=>setTimeout(v,15))}return f.save(""+(i[t(496)](".pdf")?i:i+t(523))),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c[t(543)]:"Direct download failed."}}}async function O(e){const r=u,t=window[r(508)];if(t?.exportHtmlPdf){const c=await S(e);if(!c)return{success:!1,error:r(603)};const{paperSize:n,orientation:a="portrait"}=e,o=W[n][a];return t[r(621)]({html:c,defaultFilename:e[r(526)],paperSize:n,pageWidthPx:o.width,pageHeightPx:o[r(501)],landscape:a==="landscape"})}else return N(e,e[r(570)])}async function B(e){const r=u,t=await S(e);return t?new Promise(c=>{const n=r;try{const a=document[n(590)]("iframe");a[n(513)][n(549)]="fixed",a[n(513)][n(525)]="0",a[n(513)][n(635)]="0",a[n(513)][n(544)]="0",a[n(513)].height="0",a.style[n(507)]="0",a[n(513)][n(624)]="-9999",document[n(563)][n(638)](a);const o=a.contentWindow?.document||a[n(504)];if(!o){document[n(563)][n(591)](a),c({success:!1,error:n(539)});return}o.open(),o[n(517)](t),o[n(498)](),a[n(557)]=()=>{setTimeout(()=>{const x=_;try{a[x(604)]?.[x(532)](),a[x(604)]?.[x(531)](),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i[x(543)]:x(608)})}finally{setTimeout(()=>{const i=x;document[i(563)].contains(a)&&document[i(563)].removeChild(a)},5e3)}},500)}}catch(a){c({success:!1,error:a instanceof Error?a[n(543)]:n(608)})}}):{success:!1,error:r(506)}}export{O as e,B as p};
