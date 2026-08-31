import{_ as C}from"./vendor-pdf-libs-CpIcC7yv.js";const u=_;(function(n,r){const e=_,c=n();for(;;)try{if(parseInt(e(498))/1+-parseInt(e(549))/2+-parseInt(e(485))/3*(-parseInt(e(517))/4)+-parseInt(e(443))/5+parseInt(e(497))/6+parseInt(e(430))/7*(-parseInt(e(546))/8)+parseInt(e(458))/9*(parseInt(e(533))/10)===r)break;c.push(c.shift())}catch{c.push(c.shift())}})(y,434068);const g=(function(){let n=!0;return function(r,e){const c=n?function(){const t=_;if(e){const a=e[t(451)](r,arguments);return e=null,a}}:function(){};return n=!1,c}})(),A=g(void 0,function(){const n=_,r=function(){const a=_;let o;try{o=Function(a(452)+a(464)+");")()}catch{o=window}return o},e=r(),c=e[n(504)]=e[n(504)]||{},t=[n(447),n(523),"info",n(440),n(477),n(484),n(494)];for(let a=0;a<t[n(472)];a++){const o=g[n(482)].prototype[n(547)](g),x=t[a],i=c[x]||o;o[n(465)]=g[n(547)](g),o[n(473)]=i[n(473)][n(547)](i),c[x]=o}});A();const M={letter:{portrait:u(509),landscape:"11in 8.5in"},a4:{portrait:u(553),landscape:u(475)},folio:{portrait:"8.5in 13in",landscape:"13in 8.5in"},cr80:{portrait:u(540),landscape:u(518)}},v={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function z(n){const r=u;return n.replace(/&/g,r(537))[r(419)](/</g,r(454)).replace(/>/g,"&gt;")[r(419)](/"/g,r(519))}function W(n,r,e){return new Promise(c=>{const t=_,a=new Image;a[t(539)]=t(418),a[t(535)]=()=>{const o=t;let x=a[o(542)]||a[o(427)],i=a[o(415)]||a.height;if(!x||!i){c(n);return}const l=Math.min(r/x,e/i,1);x=Math[o(455)](1,Math[o(467)](x*l)),i=Math.max(1,Math[o(467)](i*l));try{const s=document[o(424)]("canvas");s[o(427)]=x,s[o(487)]=i;const f=s.getContext("2d");if(!f){c(n);return}f[o(555)](a,0,0,x,i),c(s[o(495)](o(505)))}catch{c(n)}},a[t(528)]=()=>c(n),a[t(521)]=n})}async function L(n){const r=u,e=[];n[r(508)](r(507))[r(525)](c=>{const t=r,a=c;let o=a[t(444)](t(521))||"";if(!o||(o[t(422)]("/")&&(o=""+window[t(541)][t(413)]+o,a[t(502)](t(521),o)),o[t(422)](t(515))||o[t(422)](t(551))))return;e[t(499)](W(o,2048,2048)[t(434)](l=>{const s=t;a.setAttribute(s(521),l)}))}),await Promise[r(428)](e)}function F(n,r){const e=u,c=n[e(508)](e(500)),t=r[e(508)]("input, select, textarea");c[e(525)]((a,o)=>{const x=e,i=t[o];if(!i)return;let l="";if(a instanceof HTMLSelectElement)l=a[x(554)][a[x(461)]]?.[x(441)]??a[x(488)];else if(a instanceof HTMLInputElement&&a.type==="checkbox"){const f=a.checked,d=document[x(424)](x(514));d[x(437)]=i[x(437)],d[x(502)]("style",i[x(444)]("style")||""),d.style[x(476)]="inline-flex",d[x(550)][x(414)]=x(433),d.style[x(463)]=x(433),d.style[x(483)]=x(490),d[x(550)][x(543)]=x(417),d[x(550)].backgroundColor=x(f?544:459),d[x(550)].color="#ffffff",d[x(550)][x(453)]="9px",d[x(550)][x(412)]=x(491),d.style[x(420)]="1",d.style.flexShrink="0",d[x(550)][x(552)]="border-box",d[x(456)]=f?"✓":"",i[x(450)]?.[x(486)](d,i);return}else l=a[x(488)]||"";const s=document.createElement(x(514));s[x(456)]=l,s[x(437)]=i[x(437)],s[x(502)](x(550),i[x(444)]("style")||""),s[x(550)][x(476)]="inline-flex",s[x(550)][x(414)]=x(433),s[x(550)][x(463)]=i[x(448)][x(530)](x(481))?"flex-start":x(433),s.style[x(427)]=x(529),s[x(550)][x(487)]=x(529),i.parentNode?.[x(486)](s,i)})}function _(n,r){return n=n-412,y()[n]}function y(){const n=["then","FAST","electronAPI","className","contentWindow","close","error","text","zIndex","4000330gTDXrM","getAttribute","Nothing to print.","contentDocument","log","classList","getWidth","parentNode","apply","return (function() ","fontSize","&lt;","max","textContent","filename","2244339uZqIXA","#ffffff",".pdf","selectedIndex","data:image/","justifyContent",'{}.constructor("return this")( )',"__proto__","letter","round","message","internal","Failed to access iframe document.","appendChild","length","toString","Skipping element with empty canvas image:","297mm 210mm","display","exception",`;
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
`,"removeChild","getBoundingClientRect","text-left","constructor","border","table","40929szDWLc","replaceChild","height","value","exportHtmlPdf","1.5px solid #0f172a","900","join","body","trace","toDataURL","position","105150romrkg","851544BNvcXf","push","input, select, textarea","onProgressChange","setAttribute","cloneNode","console","image/png","data:,","img","querySelectorAll","8.5in 11in",`
</body>
</html>`,"outerHTML","print",`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`,"span","blob:","addPage","172cZWZPD","85.6mm 53.98mm","&quot;","cr80","src","bottom","warn","offsetWidth","forEach","JPEG","getHeight","onerror","100%","contains","Nothing to export.","focus","10Revabn","right","onload","./vendor-pdf-libs-CpIcC7yv.js","&amp;","default","crossOrigin","53.98mm 85.6mm","location","naturalWidth","borderRadius","#0f172a",`
@page {
    size: `,"8gAcLgV","bind","fixed","488936AVujjU","style","data:","boxSizing","210mm 297mm","options","drawImage","image/jpeg","fontWeight","origin","alignItems","naturalHeight","Direct download failed.","2px","anonymous","replace","lineHeight","</div>","startsWith","cssText","createElement","from","Print failed.","width","all","open","1585409ELrCCF",`;
    margin: `,"portrait","center"];return y=function(){return n},y()}function R(){const n=u;let r="";for(const e of Array.from(document.styleSheets))try{r+=Array[n(425)](e.cssRules).map(c=>c[n(423)])[n(492)](`
`)+`
`}catch{}return r}async function E(n){const r=u,{elements:e,title:c="Document",paperSize:t,orientation:a=r(432),pageMargin:o="0",extraCss:x=""}=n;if(!e[r(472)])return"";const i=R(),l=[];for(const s of e){const f=s[r(503)](!0);F(s,f),await L(f),l.push('<div class="pdf-page">'+f[r(511)]+r(421))}return r(513)+z(c)+`</title>
<style>
`+i+r(545)+M[t][a]+r(431)+o+r(478)+x+`
</style>
</head>
<body>
`+l[r(492)](`
`)+r(510)}async function H(n,r){const e=u;try{const c=(await C(async()=>{const p=_,{default:m}=await import(p(536))[p(434)](h=>h.h);return{default:m}},[],import.meta.url))[e(538)],{jsPDF:t}=await C(async()=>{const p=e,{jsPDF:m}=await import(p(536))[p(434)](h=>h.j);return{jsPDF:m}},[],import.meta.url),{elements:a,paperSize:o,orientation:x=e(432),filename:i}=n,l=r||n[e(501)];if(!a[e(472)])return{success:!1,error:e(531)};let s="a4";o===e(520)?s=[53.98,85.6]:o===e(466)?s=e(466):o==="folio"&&(s=[215.9,330.2]);const f=new t({orientation:x,unit:"mm",format:s,compress:!0}),d=f[e(469)].pageSize[e(449)](),S=f[e(469)].pageSize[e(527)](),w=a[e(472)],P=w>1;for(let p=0;p<w;p++){p>0&&f[e(516)](s,x);const m=a[p],h=m[e(524)]||m[e(480)]()[e(427)]||1,k=d/25.4*(P?160:250),T=Math.min(P?2:3,Math[e(455)](1.2,k/h)),I=await c(m,{scale:T,useCORS:!0,allowTaint:!0,backgroundColor:e(459),logging:!1});let b=I.toDataURL(e(556),.9),D=e(526);if((!b||b===e(506)||!b[e(422)](e(462)))&&(b=I.toDataURL(e(505)),D="PNG"),!b||b==="data:,"||!b.startsWith(e(462))){console[e(523)](e(474),m);continue}f.addImage(b,D,0,0,d,S,void 0,e(435)),l&&l(Math.round((p+1)/w*100)),await new Promise(j=>setTimeout(j,15))}return f.save(""+(i.endsWith(e(460))?i:i+".pdf")),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c[e(468)]:e(416)}}}async function O(n){const r=u,e=window[r(436)];if(e?.[r(489)]){const c=await E(n);if(!c)return{success:!1,error:r(531)};const{paperSize:t,orientation:a=r(432)}=n,o=v[t][a];return e[r(489)]({html:c,defaultFilename:n[r(457)],paperSize:t,pageWidthPx:o[r(427)],pageHeightPx:o[r(487)],landscape:a==="landscape"})}else return H(n,n.onProgressChange)}async function U(n){const r=u,e=await E(n);return e?new Promise(c=>{const t=r;try{const a=document[t(424)]("iframe");a[t(550)][t(496)]=t(548),a[t(550)][t(534)]="0",a[t(550)][t(522)]="0",a[t(550)][t(427)]="0",a[t(550)][t(487)]="0",a[t(550)][t(483)]="0",a[t(550)][t(442)]="-9999",document[t(493)][t(471)](a);const o=a[t(438)]?.document||a[t(446)];if(!o){document.body[t(479)](a),c({success:!1,error:t(470)});return}o[t(429)](),o.write(e),o[t(439)](),a.onload=()=>{setTimeout(()=>{const x=_;try{a[x(438)]?.[x(532)](),a[x(438)]?.[x(512)](),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i[x(468)]:x(426)})}finally{setTimeout(()=>{const i=x;document[i(493)][i(530)](a)&&document.body[i(479)](a)},5e3)}},500)}}catch(a){c({success:!1,error:a instanceof Error?a[t(468)]:t(426)})}}):{success:!1,error:r(445)}}export{O as e,U as p};
