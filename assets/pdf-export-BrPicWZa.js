const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./vendor-pdf-libs-F9NHdXr1.js","./vendor-Baw8Mocq.js"])))=>i.map(i=>d[i]);
import{_ as E}from"./vendor-pdf-libs-F9NHdXr1.js";const u=m;(function(n,c){const t=m,o=n();for(;;)try{if(-parseInt(t(539))/1*(parseInt(t(470))/2)+parseInt(t(425))/3+-parseInt(t(409))/4+-parseInt(t(431))/5*(parseInt(t(461))/6)+-parseInt(t(495))/7*(parseInt(t(551))/8)+-parseInt(t(454))/9*(parseInt(t(549))/10)+-parseInt(t(516))/11*(-parseInt(t(483))/12)===c)break;o.push(o.shift())}catch{o.push(o.shift())}})(w,243939);const b=(function(){let n=!0;return function(c,t){const o=n?function(){const e=m;if(t){const a=t[e(412)](c,arguments);return t=null,a}}:function(){};return n=!1,o}})(),W=b(void 0,function(){const n=m,c=function(){const a=m;let r;try{r=Function(a(504)+a(429)+");")()}catch{r=window}return r},t=c(),o=t[n(545)]=t[n(545)]||{},e=[n(479),"warn",n(528),n(552),n(546),n(446),"trace"];for(let a=0;a<e[n(441)];a++){const r=b.constructor[n(491)][n(419)](b),x=e[a],i=o[x]||r;r[n(449)]=b[n(419)](b),r[n(462)]=i[n(462)][n(419)](i),o[x]=r}});W();const j={letter:{portrait:"8.5in 11in",landscape:"11in 8.5in"},a4:{portrait:"210mm 297mm",landscape:"297mm 210mm"},folio:{portrait:u(510),landscape:"13in 8.5in"},cr80:{portrait:u(515),landscape:u(490)}},A={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function M(n){const c=u;return n[c(553)](/&/g,c(527)).replace(/</g,c(464))[c(553)](/>/g,"&gt;")[c(553)](/"/g,c(513))}function z(n,c,t){return new Promise(o=>{const e=m,a=new Image;a[e(529)]=e(413),a[e(416)]=()=>{const r=e;let x=a[r(424)]||a[r(541)],i=a.naturalHeight||a[r(471)];if(!x||!i){o(n);return}const l=Math[r(532)](c/x,t/i,1);x=Math[r(430)](1,Math[r(422)](x*l)),i=Math[r(430)](1,Math.round(i*l));try{const s=document[r(488)]("canvas");s[r(541)]=x,s[r(471)]=i;const d=s[r(557)]("2d");if(!d){o(n);return}d[r(524)](a,0,0,x,i),o(s[r(530)](r(555)))}catch{o(n)}},a.onerror=()=>o(n),a[e(476)]=n})}function m(n,c){return n=n-409,w()[n]}async function F(n){const c=u,t=[];n[c(469)](c(440))[c(460)](o=>{const e=c,a=o;let r=a.getAttribute(e(476))||"";if(!r||(r[e(535)]("/")&&(r=""+window[e(494)][e(448)]+r,a[e(456)]("src",r)),r[e(535)](e(496))||r[e(535)](e(526))))return;t[e(438)](z(r,2048,2048)[e(547)](l=>{const s=e;a[s(456)](s(476),l)}))}),await Promise[c(475)](t)}function N(n,c){const t=u,o=n[t(469)]("input, select, textarea"),e=c[t(469)](t(443));o[t(460)]((a,r)=>{const x=t,i=e[r];if(!i)return;let l="";if(a instanceof HTMLSelectElement)l=a[x(465)][a[x(418)]]?.[x(537)]??a[x(533)];else if(a instanceof HTMLInputElement&&a.type==="checkbox"){const d=a[x(411)],f=document[x(488)]("span");f.className=i[x(548)],f.setAttribute(x(540),i[x(457)](x(540))||""),f.style.display=x(459),f[x(540)][x(507)]="center",f.style[x(518)]=x(481),f[x(540)][x(550)]=x(437),f.style[x(458)]=x(426),f[x(540)].backgroundColor=d?"#0f172a":x(520),f[x(540)].color=x(520),f[x(540)][x(482)]="9px",f[x(540)].fontWeight=x(453),f[x(540)][x(439)]="1",f[x(540)][x(474)]="0",f[x(540)].boxSizing="border-box",f[x(455)]=d?"✓":"",i[x(554)]?.[x(433)](f,i);return}else l=a.value||"";const s=document.createElement(x(517));s[x(455)]=l,s[x(548)]=i.className,s[x(456)](x(540),i.getAttribute(x(540))||""),s[x(540)][x(442)]="inline-flex",s[x(540)][x(507)]=x(481),s[x(540)][x(518)]=i[x(417)][x(499)]("text-left")?x(498):x(481),s[x(540)].width=x(489),s[x(540)].height=x(489),i[x(554)]?.[x(433)](s,i)})}function H(){const n=u;let c="";for(const t of Array.from(document[n(506)]))try{c+=Array[n(497)](t[n(410)])[n(556)](o=>o[n(542)])[n(511)](`
`)+`
`}catch{}return c}function w(){const n=["min","value",`;
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
`,"startsWith","zIndex","text","addPage","1pSkxFn","style","width","cssText","Failed to access iframe document.","onProgressChange","console","exception","then","className","580WpeVZN","border","143824fwigag","error","replace","parentNode","image/png","map","getContext","portrait","1656652VZHmPn","cssRules","checked","apply","anonymous","contentDocument","folio","onload","classList","selectedIndex","bind","message","Document","round","close","naturalWidth","1006332ipUzWP","2px","Direct download failed.","image/jpeg",'{}.constructor("return this")( )',"max","5010iPyrhY","contentWindow","replaceChild","print","Nothing to export.","Print failed.","1.5px solid #0f172a","push","lineHeight","img","length","display","input, select, textarea","appendChild","getBoundingClientRect","table",".pdf","origin","__proto__","document",`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`,"PNG","900","50562rOPxUi","textContent","setAttribute","getAttribute","borderRadius","inline-flex","forEach","2388GsyGWJ","toString","getHeight","&lt;","options",`
</style>
</head>
<body>
`,"internal","data:,","querySelectorAll","63614ttifip","height","landscape","endsWith","flexShrink","all","src","letter","focus","log","electronAPI","center","fontSize","372PXGSrv","./vendor-pdf-libs-F9NHdXr1.js","Nothing to print.","Skipping element with empty canvas image:",`;
    margin: `,"createElement","100%","85.6mm 53.98mm","prototype","position",`
</body>
</html>`,"location","91PjqEvo","blob:","from","flex-start","contains","FAST","pageSize","removeChild","exportHtmlPdf","return (function() ","JPEG","styleSheets","alignItems","cloneNode","fixed","8.5in 13in","join","iframe","&quot;","save","53.98mm 85.6mm","465839qIvmfT","span","justifyContent","outerHTML","#ffffff","addImage","body","cr80","drawImage","data:image/","data:","&amp;","info","crossOrigin","toDataURL","warn"];return w=function(){return n},w()}async function C(n){const c=u,{elements:t,title:o=c(421),paperSize:e,orientation:a=c(558),pageMargin:r="0",extraCss:x=""}=n;if(!t[c(441)])return"";const i=H(),l=[];for(const s of t){const d=s[c(508)](!0);N(s,d),await F(d),l.push('<div class="pdf-page">'+d[c(519)]+"</div>")}return c(451)+M(o)+`</title>
<style>
`+i+`
@page {
    size: `+j[e][a]+c(487)+r+c(534)+x+c(466)+l[c(511)](`
`)+c(493)}async function L(n,c){const t=u;try{const o=(await E(async()=>{const p=m,{default:h}=await import("./vendor-pdf-libs-F9NHdXr1.js")[p(547)](g=>g.h);return{default:h}},__vite__mapDeps([0,1]),import.meta.url)).default,{jsPDF:e}=await E(async()=>{const p=m,{jsPDF:h}=await import(p(484))[p(547)](g=>g.j);return{jsPDF:h}},[],import.meta.url),{elements:a,paperSize:r,orientation:x=t(558),filename:i}=n,l=c||n[t(544)];if(!a[t(441)])return{success:!1,error:t(435)};let s="a4";r===t(523)?s=[53.98,85.6]:r===t(477)?s=t(477):r===t(415)&&(s=[215.9,330.2]);const d=new e({orientation:x,unit:"mm",format:s,compress:!0}),f=d[t(467)][t(501)].getWidth(),k=d[t(467)][t(501)][t(463)](),y=a[t(441)],P=y>1;for(let p=0;p<y;p++){p>0&&d[t(538)](s,x);const h=a[p],g=h.offsetWidth||h[t(445)]().width||1,D=f/25.4*(P?160:250),v=Math[t(532)](P?2:3,Math[t(430)](1.2,D/g)),I=await o(h,{scale:v,useCORS:!0,allowTaint:!0,backgroundColor:"#ffffff",logging:!1});let _=I[t(530)](t(428),.9),S=t(505);if((!_||_==="data:,"||!_[t(535)](t(525)))&&(_=I.toDataURL("image/png"),S=t(452)),!_||_===t(468)||!_[t(535)](t(525))){console[t(531)](t(486),h);continue}d[t(521)](_,S,0,0,f,k,void 0,t(500)),l&&l(Math[t(422)]((p+1)/y*100)),await new Promise(T=>setTimeout(T,15))}return d[t(514)](""+(i[t(473)](t(447))?i:i+t(447))),{success:!0}}catch(o){return{success:!1,error:o instanceof Error?o.message:t(427)}}}async function O(n){const c=u,t=window[c(480)];if(t?.[c(503)]){const o=await C(n);if(!o)return{success:!1,error:"Nothing to export."};const{paperSize:e,orientation:a=c(558)}=n,r=A[e][a];return t[c(503)]({html:o,defaultFilename:n.filename,paperSize:e,pageWidthPx:r[c(541)],pageHeightPx:r.height,landscape:a===c(472)})}else return L(n,n[c(544)])}async function G(n){const c=u,t=await C(n);return t?new Promise(o=>{const e=c;try{const a=document[e(488)](e(512));a[e(540)][e(492)]=e(509),a[e(540)].right="0",a[e(540)].bottom="0",a[e(540)].width="0",a[e(540)][e(471)]="0",a[e(540)][e(550)]="0",a[e(540)][e(536)]="-9999",document[e(522)][e(444)](a);const r=a.contentWindow?.[e(450)]||a[e(414)];if(!r){document[e(522)][e(502)](a),o({success:!1,error:e(543)});return}r.open(),r.write(t),r[e(423)](),a[e(416)]=()=>{setTimeout(()=>{const x=m;try{a[x(432)]?.[x(478)](),a.contentWindow?.[x(434)](),o({success:!0})}catch(i){o({success:!1,error:i instanceof Error?i.message:x(436)})}finally{setTimeout(()=>{const i=x;document[i(522)][i(499)](a)&&document[i(522)].removeChild(a)},5e3)}},500)}}catch(a){o({success:!1,error:a instanceof Error?a[e(420)]:e(436)})}}):{success:!1,error:c(485)}}export{O as e,G as p};
