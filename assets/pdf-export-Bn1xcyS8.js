import{_ as S}from"./vendor-pdf-libs-DtwQk6kF.js";const l=m;(function(n,o){const t=m,i=n();for(;;)try{if(-parseInt(t(607))/1+-parseInt(t(558))/2+-parseInt(t(592))/3+-parseInt(t(611))/4*(-parseInt(t(649))/5)+-parseInt(t(529))/6*(-parseInt(t(512))/7)+-parseInt(t(535))/8*(-parseInt(t(638))/9)+-parseInt(t(562))/10*(-parseInt(t(608))/11)===o)break;i.push(i.shift())}catch{i.push(i.shift())}})(w,273697);const b=(function(){let n=!0;return function(o,t){const i=n?function(){const e=m;if(t){const a=t[e(560)](o,arguments);return t=null,a}}:function(){};return n=!1,i}})(),T=b(void 0,function(){const n=m,o=function(){const a=m;let r;try{r=Function(a(605)+a(531)+");")()}catch{r=window}return r},t=o(),i=t.console=t.console||{},e=[n(590),n(589),n(567),n(603),"exception",n(533),n(514)];for(let a=0;a<e.length;a++){const r=b[n(501)][n(646)][n(504)](b),x=e[a],c=i[x]||r;r.__proto__=b[n(504)](b),r[n(498)]=c.toString.bind(c),i[x]=r}});T();const M={letter:{portrait:l(551),landscape:l(610)},a4:{portrait:l(544),landscape:l(645)},folio:{portrait:l(647),landscape:l(515)},cr80:{portrait:"53.98mm 85.6mm",landscape:l(580)}},W={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function v(n){const o=l;return n[o(510)](/&/g,o(581))[o(510)](/</g,"&lt;")[o(510)](/>/g,o(624))[o(510)](/"/g,"&quot;")}function N(n,o,t){return new Promise(i=>{const e=m,a=new Image;a[e(556)]=e(539),a[e(629)]=()=>{const r=e;let x=a.naturalWidth||a.width,c=a.naturalHeight||a.height;if(!x||!c){i(n);return}const u=Math[r(622)](o/x,t/c,1);x=Math.max(1,Math[r(538)](x*u)),c=Math[r(546)](1,Math[r(538)](c*u));try{const s=document[r(595)](r(534));s.width=x,s.height=c;const d=s[r(576)]("2d");if(!d){i(n);return}d[r(509)](a,0,0,x,c),i(s[r(588)](r(614)))}catch{i(n)}},a[e(564)]=()=>i(n),a.src=n})}async function z(n){const o=l,t=[];n.querySelectorAll("img").forEach(i=>{const e=m,a=i;let r=a[e(650)](e(584))||"";if(!r||(r[e(574)]("/")&&(r=""+window[e(583)][e(505)]+r,a[e(547)](e(584),r)),r[e(574)]("blob:")||r[e(574)](e(582))))return;t[e(549)](N(r,2048,2048)[e(541)](u=>{const s=e;a.setAttribute(s(584),u)}))}),await Promise[o(631)](t)}function F(n,o){const t=l,i=n.querySelectorAll(t(542)),e=o[t(545)](t(542));i[t(536)]((a,r)=>{const x=t,c=e[r];if(!c)return;let u="";if(a instanceof HTMLSelectElement)u=a[x(552)][a[x(502)]]?.[x(636)]??a[x(612)];else if(a instanceof HTMLInputElement&&a[x(604)]===x(644)){const d=a[x(511)],f=document[x(595)](x(594));f[x(620)]=c[x(620)],f[x(547)](x(537),c[x(650)](x(537))||""),f[x(537)][x(527)]="inline-flex",f[x(537)][x(643)]=x(530),f[x(537)].justifyContent=x(530),f[x(537)].border=x(632),f[x(537)][x(540)]=x(548),f[x(537)][x(499)]=d?"#0f172a":x(561),f[x(537)][x(572)]="#ffffff",f.style.fontSize=x(578),f[x(537)].fontWeight=x(619),f[x(537)][x(550)]="1",f[x(537)][x(597)]="0",f[x(537)][x(513)]=x(494),f[x(635)]=d?"✓":"",c[x(507)]?.[x(557)](f,c);return}else u=a.value||"";const s=document[x(595)]("span");s[x(635)]=u,s[x(620)]=c[x(620)],s[x(547)](x(537),c[x(650)]("style")||""),s[x(537)][x(527)]=x(613),s.style[x(643)]=x(530),s[x(537)][x(503)]=c[x(609)][x(598)]("text-left")?x(497):x(530),s[x(537)].width=x(591),s[x(537)][x(563)]=x(591),c.parentNode?.[x(557)](s,c)})}function m(n,o){return n=n-494,w()[n]}function H(){const n=l;let o="";for(const t of Array.from(document[n(602)]))try{o+=Array[n(640)](t[n(586)])[n(568)](i=>i[n(516)])[n(522)](`
`)+`
`}catch{}return o}async function C(n){const o=l,{elements:t,title:i="Document",paperSize:e,orientation:a=o(596),pageMargin:r="0",extraCss:x=""}=n;if(!t.length)return"";const c=H(),u=[];for(const s of t){const d=s.cloneNode(!0);F(s,d),await z(d),u[o(549)](o(599)+d[o(616)]+o(521))}return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`+v(i)+o(601)+c+o(642)+M[e][a]+`;
    margin: `+r+o(573)+x+o(600)+u[o(522)](`
`)+o(623)}async function R(n,o){const t=l;try{const i=(await S(async()=>{const p=m,{default:h}=await import(p(496)).then(g=>g.h);return{default:h}},[],import.meta.url))[t(508)],{jsPDF:e}=await S(async()=>{const p=t,{jsPDF:h}=await import(p(496))[p(541)](g=>g.j);return{jsPDF:h}},[],import.meta.url),{elements:a,paperSize:r,orientation:x=t(596),filename:c}=n,u=o||n[t(630)];if(!a[t(517)])return{success:!1,error:t(617)};let s="a4";r===t(495)?s=[53.98,85.6]:r==="letter"?s=t(565):r===t(571)&&(s=[215.9,330.2]);const d=new e({orientation:x,unit:"mm",format:s,compress:!0}),f=d.internal[t(639)][t(577)](),k=d.internal[t(639)][t(626)](),y=a[t(517)],P=y>1;for(let p=0;p<y;p++){p>0&&d[t(500)](s,x);const h=a[p],g=h[t(618)]||h[t(641)]().width||1,D=f/25.4*(P?160:250),j=Math[t(622)](P?2:3,Math[t(546)](1.2,D/g)),I=await i(h,{scale:j,useCORS:!0,allowTaint:!0,backgroundColor:t(561),logging:!1});let _=I[t(588)](t(554),.9),E=t(570);if((!_||_===t(528)||!_[t(574)](t(634)))&&(_=I.toDataURL(t(614)),E="PNG"),!_||_===t(528)||!_[t(574)](t(634))){console[t(589)](t(606),h);continue}d[t(575)](_,E,0,0,f,k,void 0,"FAST"),u&&u(Math[t(538)]((p+1)/y*100)),await new Promise(A=>setTimeout(A,15))}return d[t(526)](""+(c[t(579)](t(523))?c:c+t(523))),{success:!0}}catch(i){return{success:!1,error:i instanceof Error?i[t(525)]:t(559)}}}function w(){const n=["2px","push","lineHeight","8.5in 11in","options","contentWindow","image/jpeg","exportHtmlPdf","crossOrigin","replaceChild","612034xRHmTy","Direct download failed.","apply","#ffffff","1750qpjfNd","height","onerror","letter","bottom","info","map","focus","JPEG","folio","color",`;
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
`,"startsWith","addImage","getContext","getWidth","9px","endsWith","85.6mm 53.98mm","&amp;","data:","location","src","body","cssRules","landscape","toDataURL","warn","log","100%","412098EXlMAy","contentDocument","span","createElement","portrait","flexShrink","contains",'<div class="pdf-page">',`
</style>
</head>
<body>
`,`</title>
<style>
`,"styleSheets","error","type","return (function() ","Skipping element with empty canvas image:","175593eAXPXN","1122lEGcEX","classList","11in 8.5in","2106604tzPcfF","value","inline-flex","image/png","width","outerHTML","Nothing to export.","offsetWidth","900","className","removeChild","min",`
</body>
</html>`,"&gt;","Nothing to print.","getHeight","appendChild","zIndex","onload","onProgressChange","all","1.5px solid #0f172a","write","data:image/","textContent","text","electronAPI","209241GNyNgm","pageSize","from","getBoundingClientRect",`
@page {
    size: `,"alignItems","checkbox","297mm 210mm","prototype","8.5in 13in","-9999","5EQWWjN","getAttribute","border-box","cr80","./vendor-pdf-libs-DtwQk6kF.js","flex-start","toString","backgroundColor","addPage","constructor","selectedIndex","justifyContent","bind","origin","Failed to access iframe document.","parentNode","default","drawImage","replace","checked","2877iWkyhB","boxSizing","trace","13in 8.5in","cssText","length","right","Print failed.","document","</div>","join",".pdf","border","message","save","display","data:,","4404PhXwDY","center",'{}.constructor("return this")( )',"position","table","canvas","16kXQlJu","forEach","style","round","anonymous","borderRadius","then","input, select, textarea","open","210mm 297mm","querySelectorAll","max","setAttribute"];return w=function(){return n},w()}async function X(n){const o=l,t=window[o(637)];if(t?.[o(555)]){const i=await C(n);if(!i)return{success:!1,error:o(617)};const{paperSize:e,orientation:a=o(596)}=n,r=W[e][a];return t[o(555)]({html:i,defaultFilename:n.filename,paperSize:e,pageWidthPx:r.width,pageHeightPx:r[o(563)],landscape:a===o(587)})}else return R(n,n[o(630)])}async function O(n){const o=l,t=await C(n);return t?new Promise(i=>{const e=o;try{const a=document[e(595)]("iframe");a[e(537)][e(532)]="fixed",a[e(537)][e(518)]="0",a[e(537)][e(566)]="0",a[e(537)][e(615)]="0",a.style[e(563)]="0",a.style[e(524)]="0",a[e(537)][e(628)]=e(648),document.body[e(627)](a);const r=a[e(553)]?.[e(520)]||a[e(593)];if(!r){document[e(585)][e(621)](a),i({success:!1,error:e(506)});return}r[e(543)](),r[e(633)](t),r.close(),a[e(629)]=()=>{setTimeout(()=>{const x=m;try{a.contentWindow?.[x(569)](),a[x(553)]?.print(),i({success:!0})}catch(c){i({success:!1,error:c instanceof Error?c[x(525)]:x(519)})}finally{setTimeout(()=>{const c=x;document[c(585)][c(598)](a)&&document[c(585)].removeChild(a)},5e3)}},500)}}catch(a){i({success:!1,error:a instanceof Error?a.message:e(519)})}}):{success:!1,error:o(625)}}export{X as e,O as p};
