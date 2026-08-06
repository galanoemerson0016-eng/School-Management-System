const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./vendor-pdf-libs-BVl_U1Kq.js","./vendor-D807hmOL.js"])))=>i.map(i=>d[i]);
import{_ as S}from"./vendor-pdf-libs-BVl_U1Kq.js";const d=b;(function(n,r){const t=b,c=n();for(;;)try{if(parseInt(t(470))/1+-parseInt(t(513))/2+-parseInt(t(479))/3+-parseInt(t(447))/4*(parseInt(t(537))/5)+parseInt(t(430))/6*(parseInt(t(471))/7)+parseInt(t(459))/8*(-parseInt(t(544))/9)+parseInt(t(441))/10===r)break;c.push(c.shift())}catch{c.push(c.shift())}})(y,276230);const g=(function(){let n=!0;return function(r,t){const c=n?function(){if(t){const e=t.apply(r,arguments);return t=null,e}}:function(){};return n=!1,c}})(),T=g(void 0,function(){const n=b,r=function(){const a=b;let o;try{o=Function(a(444)+a(472)+");")()}catch{o=window}return o},t=r(),c=t[n(540)]=t[n(540)]||{},e=[n(508),n(492),n(448),"error",n(565),n(505),"trace"];for(let a=0;a<e.length;a++){const o=g[n(542)].prototype.bind(g),x=e[a],i=c[x]||o;o[n(517)]=g.bind(g),o[n(437)]=i[n(437)][n(439)](i),c[x]=o}});T();const W={letter:{portrait:d(572),landscape:d(442)},a4:{portrait:d(499),landscape:d(466)},folio:{portrait:d(488),landscape:d(445)},cr80:{portrait:d(511),landscape:d(435)}},M={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function z(n){const r=d;return n[r(550)](/&/g,"&amp;")[r(550)](/</g,r(556))[r(550)](/>/g,r(578))[r(550)](/"/g,r(567))}function F(n,r,t){return new Promise(c=>{const e=b,a=new Image;a.crossOrigin=e(526),a[e(509)]=()=>{const o=e;let x=a.naturalWidth||a[o(480)],i=a[o(477)]||a[o(486)];if(!x||!i){c(n);return}const u=Math[o(532)](r/x,t/i,1);x=Math[o(501)](1,Math[o(557)](x*u)),i=Math.max(1,Math[o(557)](i*u));try{const s=document.createElement("canvas");s[o(480)]=x,s[o(486)]=i;const l=s[o(528)]("2d");if(!l){c(n);return}l[o(566)](a,0,0,x,i),c(s[o(468)](o(502)))}catch{c(n)}},a[e(457)]=()=>c(n),a[e(569)]=n})}async function R(n){const r=d,t=[];n[r(463)]("img")[r(455)](c=>{const e=r,a=c;let o=a[e(440)](e(569))||"";if(!o||(o[e(434)]("/")&&(o=""+window.location[e(543)]+o,a[e(529)]("src",o)),o.startsWith(e(521))||o[e(434)](e(559))))return;t[e(520)](F(o,2048,2048).then(u=>{const s=e;a[s(529)](s(569),u)}))}),await Promise[r(453)](t)}function v(n,r){const t=d,c=n[t(463)]("input, select, textarea"),e=r.querySelectorAll(t(573));c.forEach((a,o)=>{const x=t,i=e[o];if(!i)return;let u="";if(a instanceof HTMLSelectElement)u=a[x(549)][a[x(438)]]?.text??a[x(484)];else if(a instanceof HTMLInputElement&&a[x(489)]===x(493)){const l=a.checked,f=document[x(546)](x(494));f[x(516)]=i[x(516)],f.setAttribute(x(533),i.getAttribute(x(533))||""),f[x(533)].display=x(554),f[x(533)][x(536)]=x(452),f[x(533)][x(580)]="center",f[x(533)][x(496)]=x(527),f[x(533)][x(553)]=x(524),f[x(533)][x(560)]=l?x(497):"#ffffff",f[x(533)][x(507)]=x(523),f[x(533)][x(473)]=x(485),f[x(533)][x(462)]=x(510),f.style.lineHeight="1",f.style[x(561)]="0",f[x(533)][x(429)]=x(458),f[x(460)]=l?"✓":"",i[x(512)]?.[x(506)](f,i);return}else u=a[x(484)]||"";const s=document.createElement(x(494));s[x(460)]=u,s[x(516)]=i.className,s[x(529)](x(533),i[x(440)](x(533))||""),s[x(533)][x(525)]="inline-flex",s.style[x(536)]=x(452),s[x(533)].justifyContent=i[x(456)][x(426)](x(469))?x(570):x(452),s[x(533)][x(480)]=x(564),s.style[x(486)]=x(564),i[x(512)]?.[x(506)](s,i)})}function b(n,r){return n=n-425,y()[n]}function L(){const n=d;let r="";for(const t of Array[n(547)](document.styleSheets))try{r+=Array.from(t[n(491)])[n(539)](c=>c[n(498)])[n(545)](`
`)+`
`}catch{}return r}async function C(n){const r=d,{elements:t,title:c=r(428),paperSize:e,orientation:a=r(454),pageMargin:o="0",extraCss:x=""}=n;if(!t.length)return"";const i=L(),u=[];for(const s of t){const l=s[r(500)](!0);v(s,l),await R(l),u.push('<div class="pdf-page">'+l[r(476)]+r(495))}return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`+z(c)+r(464)+i+r(467)+W[e][a]+r(551)+o+r(555)+x+r(449)+u[r(545)](`
`)+r(487)}async function H(n,r){const t=d;try{const c=(await S(async()=>{const p=b,{default:m}=await import("./vendor-pdf-libs-BVl_U1Kq.js")[p(515)](_=>_.h);return{default:m}},__vite__mapDeps([0,1]),import.meta.url)).default,{jsPDF:e}=await S(async()=>{const p=b,{jsPDF:m}=await import(p(574))[p(515)](_=>_.j);return{jsPDF:m}},[],import.meta.url),{elements:a,paperSize:o,orientation:x="portrait",filename:i}=n,u=r||n[t(558)];if(!a[t(450)])return{success:!1,error:t(451)};let s="a4";o===t(482)?s=[53.98,85.6]:o===t(475)?s=t(475):o===t(579)&&(s=[215.9,330.2]);const l=new e({orientation:x,unit:"mm",format:s,compress:!0}),f=l.internal.pageSize[t(534)](),k=l.internal[t(563)][t(446)](),w=a[t(450)],P=w>1;for(let p=0;p<w;p++){p>0&&l[t(432)](s,x);const m=a[p],_=m[t(483)]||m.getBoundingClientRect().width||1,D=f/25.4*(P?160:250),A=Math[t(532)](P?2:3,Math[t(501)](1.2,D/_)),I=await c(m,{scale:A,useCORS:!0,allowTaint:!0,backgroundColor:t(523),logging:!1});let h=I.toDataURL(t(519),.9),E=t(568);if((!h||h===t(571)||!h[t(434)](t(562)))&&(h=I.toDataURL(t(502)),E="PNG"),!h||h===t(571)||!h.startsWith("data:image/")){console[t(492)](t(425),m);continue}l.addImage(h,E,0,0,f,k,void 0,t(535)),u&&u(Math[t(557)]((p+1)/w*100)),await new Promise(j=>setTimeout(j,15))}return l[t(577)](""+(i[t(552)](t(490))?i:i+".pdf")),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c[t(431)]:t(531)}}}async function B(n){const r=d,t=window[r(503)];if(t?.[r(436)]){const c=await C(n);if(!c)return{success:!1,error:r(451)};const{paperSize:e,orientation:a=r(454)}=n,o=M[e][a];return t[r(436)]({html:c,defaultFilename:n.filename,paperSize:e,pageWidthPx:o[r(480)],pageHeightPx:o.height,landscape:a===r(538)})}else return H(n,n.onProgressChange)}async function O(n){const r=d,t=await C(n);return t?new Promise(c=>{const e=r;try{const a=document[e(546)](e(504));a.style[e(518)]=e(481),a[e(533)][e(474)]="0",a[e(533)].bottom="0",a[e(533)][e(480)]="0",a[e(533)][e(486)]="0",a[e(533)][e(496)]="0",a.style[e(514)]=e(427),document[e(461)][e(522)](a);const o=a[e(478)]?.[e(548)]||a.contentDocument;if(!o){document[e(461)][e(541)](a),c({success:!1,error:e(465)});return}o[e(433)](),o[e(575)](t),o[e(443)](),a[e(509)]=()=>{setTimeout(()=>{const x=b;try{a[x(478)]?.focus(),a[x(478)]?.print(),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i[x(431)]:x(576)})}finally{setTimeout(()=>{const i=x;document[i(461)][i(426)](a)&&document.body[i(541)](a)},5e3)}},500)}}catch(a){c({success:!1,error:a instanceof Error?a[e(431)]:e(576)})}}):{success:!1,error:r(530)}}function y(){const n=["77622oIqAXB","189sliQif",'{}.constructor("return this")( )',"fontSize","right","letter","outerHTML","naturalHeight","contentWindow","1354791ocjBnx","width","fixed","cr80","offsetWidth","value","9px","height",`
</body>
</html>`,"8.5in 13in","type",".pdf","cssRules","warn","checkbox","span","</div>","border","#0f172a","cssText","210mm 297mm","cloneNode","max","image/png","electronAPI","iframe","table","replaceChild","color","log","onload","900","53.98mm 85.6mm","parentNode","980350VUgksW","zIndex","then","className","__proto__","position","image/jpeg","push","blob:","appendChild","#ffffff","2px","display","anonymous","1.5px solid #0f172a","getContext","setAttribute","Nothing to print.","Direct download failed.","min","style","getWidth","FAST","alignItems","33710RyguKy","landscape","map","console","removeChild","constructor","origin","114579AWTpeF","join","createElement","from","document","options","replace",`;
    margin: `,"endsWith","borderRadius","inline-flex",`;
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
`,"&lt;","round","onProgressChange","data:","backgroundColor","flexShrink","data:image/","pageSize","100%","exception","drawImage","&quot;","JPEG","src","flex-start","data:,","8.5in 11in","input, select, textarea","./vendor-pdf-libs-BVl_U1Kq.js","write","Print failed.","save","&gt;","folio","justifyContent","Skipping element with empty canvas image:","contains","-9999","Document","boxSizing","25302AmRfuf","message","addPage","open","startsWith","85.6mm 53.98mm","exportHtmlPdf","toString","selectedIndex","bind","getAttribute","17156060jXVBRE","11in 8.5in","close","return (function() ","13in 8.5in","getHeight","220rFmmZe","info",`
</style>
</head>
<body>
`,"length","Nothing to export.","center","all","portrait","forEach","classList","onerror","border-box","200kQPIBL","textContent","body","fontWeight","querySelectorAll",`</title>
<style>
`,"Failed to access iframe document.","297mm 210mm",`
@page {
    size: `,"toDataURL","text-left"];return y=function(){return n},y()}export{B as e,O as p};
