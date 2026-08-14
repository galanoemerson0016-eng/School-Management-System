const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./vendor-pdf-libs-B8w_XDH1.js","./vendor-DHjWRsZY.js"])))=>i.map(i=>d[i]);
import{_ as C}from"./vendor-pdf-libs-B8w_XDH1.js";const u=_;(function(n,o){const t=_,c=n();for(;;)try{if(parseInt(t(457))/1+parseInt(t(450))/2*(-parseInt(t(449))/3)+-parseInt(t(416))/4+parseInt(t(400))/5+parseInt(t(453))/6+parseInt(t(494))/7*(-parseInt(t(384))/8)+parseInt(t(470))/9===o)break;c.push(c.shift())}catch{c.push(c.shift())}})(w,645584);const g=(function(){let n=!0;return function(o,t){const c=n?function(){const a=_;if(t){const e=t[a(454)](o,arguments);return t=null,e}}:function(){};return n=!1,c}})(),T=g(void 0,function(){const n=_,o=function(){const e=_;let r;try{r=Function(e(477)+e(413)+");")()}catch{r=window}return r},t=o(),c=t[n(517)]=t[n(517)]||{},a=[n(436),"warn",n(466),n(472),n(515),n(523),n(516)];for(let e=0;e<a[n(525)];e++){const r=g.constructor.prototype[n(500)](g),x=a[e],i=c[x]||r;r[n(529)]=g[n(500)](g),r.toString=i[n(423)][n(500)](i),c[x]=r}});function _(n,o){return n=n-384,w()[n]}T();const A={letter:{portrait:"8.5in 11in",landscape:u(469)},a4:{portrait:u(412),landscape:u(445)},folio:{portrait:u(407),landscape:"13in 8.5in"},cr80:{portrait:"53.98mm 85.6mm",landscape:u(521)}},W={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function z(n){const o=u;return n[o(501)](/&/g,o(446))[o(501)](/</g,o(415))[o(501)](/>/g,o(471))[o(501)](/"/g,o(396))}function v(n,o,t){return new Promise(c=>{const a=_,e=new Image;e[a(404)]=a(426),e[a(451)]=()=>{const r=a;let x=e[r(388)]||e[r(387)],i=e[r(398)]||e[r(495)];if(!x||!i){c(n);return}const l=Math[r(488)](o/x,t/i,1);x=Math[r(452)](1,Math.round(x*l)),i=Math[r(452)](1,Math.round(i*l));try{const s=document[r(386)](r(435));s[r(387)]=x,s[r(495)]=i;const f=s[r(430)]("2d");if(!f){c(n);return}f[r(496)](e,0,0,x,i),c(s.toDataURL(r(410)))}catch{c(n)}},e[a(417)]=()=>c(n),e[a(460)]=n})}async function F(n){const o=u,t=[];n[o(480)]("img")[o(414)](c=>{const a=o,e=c;let r=e[a(519)](a(460))||"";if(!r||(r[a(474)]("/")&&(r=""+window.location[a(503)]+r,e[a(508)](a(460),r)),r[a(474)]("blob:")||r[a(474)](a(461))))return;t.push(v(r,2048,2048)[a(385)](l=>{const s=a;e[s(508)](s(460),l)}))}),await Promise.all(t)}function H(n,o){const t=u,c=n[t(480)]("input, select, textarea"),a=o[t(480)](t(427));c[t(414)]((e,r)=>{const x=t,i=a[r];if(!i)return;let l="";if(e instanceof HTMLSelectElement)l=e.options[e.selectedIndex]?.[x(433)]??e[x(432)];else if(e instanceof HTMLInputElement&&e[x(441)]===x(475)){const f=e.checked,d=document[x(386)](x(505));d[x(502)]=i[x(502)],d[x(508)](x(392),i[x(519)]("style")||""),d[x(392)][x(409)]=x(389),d[x(392)].alignItems=x(512),d.style.justifyContent=x(512),d[x(392)][x(493)]=x(524),d[x(392)].borderRadius=x(424),d[x(392)][x(482)]=f?"#0f172a":x(411),d[x(392)][x(507)]=x(411),d[x(392)][x(468)]=x(499),d[x(392)][x(492)]=x(420),d[x(392)].lineHeight="1",d[x(392)][x(421)]="0",d[x(392)].boxSizing="border-box",d.textContent=f?"✓":"",i[x(467)]?.[x(459)](d,i);return}else l=e[x(432)]||"";const s=document.createElement(x(505));s.textContent=l,s[x(502)]=i[x(502)],s.setAttribute("style",i.getAttribute(x(392))||""),s.style.display="inline-flex",s[x(392)][x(405)]=x(512),s[x(392)][x(418)]=i[x(513)].contains("text-left")?x(397):x(512),s[x(392)][x(387)]=x(486),s[x(392)][x(495)]=x(486),i[x(467)]?.[x(459)](s,i)})}function R(){const n=u;let o="";for(const t of Array[n(476)](document.styleSheets))try{o+=Array[n(476)](t[n(419)]).map(c=>c[n(481)])[n(487)](`
`)+`
`}catch{}return o}async function E(n){const o=u,{elements:t,title:c=o(455),paperSize:a,orientation:e=o(429),pageMargin:r="0",extraCss:x=""}=n;if(!t[o(525)])return"";const i=R(),l=[];for(const s of t){const f=s.cloneNode(!0);H(s,f),await F(f),l[o(528)](o(403)+f[o(478)]+"</div>")}return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`+z(c)+o(465)+i+`
@page {
    size: `+A[a][e]+o(518)+r+o(399)+x+`
</style>
</head>
<body>
`+l.join(`
`)+o(425)}async function L(n,o){const t=u;try{const c=(await C(async()=>{const p=_,{default:m}=await import("./vendor-pdf-libs-B8w_XDH1.js")[p(385)](h=>h.h);return{default:m}},__vite__mapDeps([0,1]),import.meta.url))[t(497)],{jsPDF:a}=await C(async()=>{const p=t,{jsPDF:m}=await import(p(511))[p(385)](h=>h.j);return{jsPDF:m}},[],import.meta.url),{elements:e,paperSize:r,orientation:x=t(429),filename:i}=n,l=o||n.onProgressChange;if(!e[t(525)])return{success:!1,error:t(443)};let s="a4";r===t(510)?s=[53.98,85.6]:r==="letter"?s=t(489):r===t(506)&&(s=[215.9,330.2]);const f=new a({orientation:x,unit:"mm",format:s,compress:!0}),d=f[t(394)][t(428)][t(509)](),D=f[t(394)].pageSize.getHeight(),y=e[t(525)],P=y>1;for(let p=0;p<y;p++){p>0&&f[t(498)](s,x);const m=e[p],h=m.offsetWidth||m.getBoundingClientRect().width||1,M=d/25.4*(P?160:250),k=Math[t(488)](P?2:3,Math.max(1.2,M/h)),I=await c(m,{scale:k,useCORS:!0,allowTaint:!0,backgroundColor:"#ffffff",logging:!1});let b=I[t(444)](t(520),.9),S=t(462);if((!b||b===t(390)||!b[t(474)](t(393)))&&(b=I[t(444)](t(410)),S=t(491)),!b||b===t(390)||!b.startsWith(t(393))){console[t(431)]("Skipping element with empty canvas image:",m);continue}f.addImage(b,S,0,0,d,D,void 0,t(464)),l&&l(Math[t(422)]((p+1)/y*100)),await new Promise(j=>setTimeout(j,15))}return f[t(401)](""+(i[t(408)](".pdf")?i:i+".pdf")),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c[t(448)]:t(483)}}}async function O(n){const o=u,t=window[o(440)];if(t?.[o(391)]){const c=await E(n);if(!c)return{success:!1,error:o(443)};const{paperSize:a,orientation:e=o(429)}=n,r=W[a][e];return t.exportHtmlPdf({html:c,defaultFilename:n[o(484)],paperSize:a,pageWidthPx:r[o(387)],pageHeightPx:r.height,landscape:e===o(395)})}else return L(n,n[o(463)])}async function q(n){const o=u,t=await E(n);return t?new Promise(c=>{const a=o;try{const e=document.createElement(a(456));e.style[a(439)]="fixed",e.style[a(473)]="0",e.style[a(447)]="0",e[a(392)].width="0",e[a(392)][a(495)]="0",e.style[a(493)]="0",e[a(392)][a(514)]="-9999",document[a(437)][a(527)](e);const r=e[a(526)]?.[a(504)]||e[a(402)];if(!r){document[a(437)].removeChild(e),c({success:!1,error:a(485)});return}r.open(),r[a(434)](t),r[a(490)](),e[a(451)]=()=>{setTimeout(()=>{const x=_;try{e[x(526)]?.[x(438)](),e.contentWindow?.[x(522)](),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i[x(448)]:"Print failed."})}finally{setTimeout(()=>{const i=x;document[i(437)][i(458)](e)&&document[i(437)][i(406)](e)},5e3)}},500)}}catch(e){c({success:!1,error:e instanceof Error?e[a(448)]:a(479)})}}):{success:!1,error:o(442)}}function w(){const n=[`;
    margin: `,"getAttribute","image/jpeg","85.6mm 53.98mm","print","table","1.5px solid #0f172a","length","contentWindow","appendChild","push","__proto__","3862464bWoEGB","then","createElement","width","naturalWidth","inline-flex","data:,","exportHtmlPdf","style","data:image/","internal","landscape","&quot;","flex-start","naturalHeight",`;
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
`,"3585810pMMEql","save","contentDocument",'<div class="pdf-page">',"crossOrigin","alignItems","removeChild","8.5in 13in","endsWith","display","image/png","#ffffff","210mm 297mm",'{}.constructor("return this")( )',"forEach","&lt;","4842188AtUFqM","onerror","justifyContent","cssRules","900","flexShrink","round","toString","2px",`
</body>
</html>`,"anonymous","input, select, textarea","pageSize","portrait","getContext","warn","value","text","write","canvas","log","body","focus","position","electronAPI","type","Nothing to print.","Nothing to export.","toDataURL","297mm 210mm","&amp;","bottom","message","17736DWlHjt","358YxANaB","onload","max","4427646bTCJOq","apply","Document","iframe","916584oIoMUG","contains","replaceChild","src","data:","JPEG","onProgressChange","FAST",`</title>
<style>
`,"info","parentNode","fontSize","11in 8.5in","13574772MQRilB","&gt;","error","right","startsWith","checkbox","from","return (function() ","outerHTML","Print failed.","querySelectorAll","cssText","backgroundColor","Direct download failed.","filename","Failed to access iframe document.","100%","join","min","letter","close","PNG","fontWeight","border","14lQzSSU","height","drawImage","default","addPage","9px","bind","replace","className","origin","document","span","folio","color","setAttribute","getWidth","cr80","./vendor-pdf-libs-B8w_XDH1.js","center","classList","zIndex","exception","trace","console"];return w=function(){return n},w()}export{O as e,q as p};
