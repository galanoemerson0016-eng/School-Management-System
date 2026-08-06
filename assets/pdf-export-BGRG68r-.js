import{_ as C}from"./vendor-pdf-libs-BVl_U1Kq.js";const u=m;(function(n,r){const t=m,c=n();for(;;)try{if(parseInt(t(483))/1+parseInt(t(435))/2*(-parseInt(t(438))/3)+-parseInt(t(469))/4*(-parseInt(t(491))/5)+parseInt(t(516))/6+-parseInt(t(533))/7*(parseInt(t(526))/8)+-parseInt(t(439))/9*(-parseInt(t(561))/10)+parseInt(t(504))/11===r)break;c.push(c.shift())}catch{c.push(c.shift())}})(y,217114);const g=(function(){let n=!0;return function(r,t){const c=n?function(){const e=m;if(t){const a=t[e(515)](r,arguments);return t=null,a}}:function(){};return n=!1,c}})(),M=g(void 0,function(){const n=m,r=function(){const a=m;let o;try{o=Function(a(503)+a(573)+");")()}catch{o=window}return o},t=r(),c=t[n(459)]=t[n(459)]||{},e=[n(445),n(429),n(550),n(472),"exception",n(530),n(567)];for(let a=0;a<e[n(525)];a++){const o=g[n(488)][n(576)].bind(g),x=e[a],i=c[x]||o;o.__proto__=g[n(440)](g),o.toString=i[n(520)][n(440)](i),c[x]=o}});function m(n,r){return n=n-428,y()[n]}M();const W={letter:{portrait:u(510),landscape:u(540)},a4:{portrait:"210mm 297mm",landscape:u(436)},folio:{portrait:u(554),landscape:"13in 8.5in"},cr80:{portrait:u(519),landscape:"85.6mm 53.98mm"}},v={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function z(n){const r=u;return n.replace(/&/g,"&amp;")[r(457)](/</g,r(543)).replace(/>/g,r(489)).replace(/"/g,r(517))}function A(n,r,t){return new Promise(c=>{const e=m,a=new Image;a[e(453)]=e(514),a[e(534)]=()=>{const o=e;let x=a.naturalWidth||a.width,i=a[o(431)]||a.height;if(!x||!i){c(n);return}const l=Math[o(578)](r/x,t/i,1);x=Math[o(562)](1,Math[o(575)](x*l)),i=Math[o(562)](1,Math.round(i*l));try{const s=document[o(465)](o(479));s[o(462)]=x,s[o(443)]=i;const f=s[o(448)]("2d");if(!f){c(n);return}f[o(523)](a,0,0,x,i),c(s[o(485)](o(501)))}catch{c(n)}},a[e(456)]=()=>c(n),a.src=n})}async function F(n){const r=u,t=[];n.querySelectorAll(r(549))[r(458)](c=>{const e=r,a=c;let o=a[e(535)](e(557))||"";if(!o||(o.startsWith("/")&&(o=""+window[e(548)][e(531)]+o,a[e(529)](e(557),o)),o[e(564)](e(541))||o[e(564)](e(450))))return;t.push(A(o,2048,2048)[e(477)](l=>{const s=e;a[s(529)](s(557),l)}))}),await Promise[r(509)](t)}function H(n,r){const t=u,c=n[t(547)](t(430)),e=r[t(547)](t(430));c[t(458)]((a,o)=>{const x=t,i=e[o];if(!i)return;let l="";if(a instanceof HTMLSelectElement)l=a[x(442)][a.selectedIndex]?.[x(486)]??a[x(454)];else if(a instanceof HTMLInputElement&&a[x(470)]===x(570)){const f=a.checked,d=document[x(465)]("span");d[x(555)]=i.className,d[x(529)](x(508),i[x(535)]("style")||""),d[x(508)].display=x(505),d[x(508)].alignItems=x(471),d.style[x(492)]=x(471),d.style[x(553)]="1.5px solid #0f172a",d.style.borderRadius="2px",d[x(508)].backgroundColor=f?"#0f172a":x(449),d[x(508)][x(480)]="#ffffff",d.style.fontSize="9px",d[x(508)][x(502)]="900",d[x(508)].lineHeight="1",d.style[x(460)]="0",d[x(508)][x(512)]="border-box",d[x(446)]=f?"✓":"",i[x(560)]?.[x(546)](d,i);return}else l=a[x(454)]||"";const s=document[x(465)](x(566));s[x(446)]=l,s[x(555)]=i[x(555)],s[x(529)]("style",i[x(535)]("style")||""),s[x(508)][x(428)]="inline-flex",s[x(508)][x(565)]=x(471),s[x(508)][x(492)]=i[x(537)][x(536)]("text-left")?x(527):x(471),s[x(508)][x(462)]="100%",s[x(508)][x(443)]=x(432),i.parentNode?.[x(546)](s,i)})}function N(){const n=u;let r="";for(const t of Array.from(document[n(474)]))try{r+=Array[n(539)](t[n(571)])[n(506)](c=>c[n(434)])[n(500)](`
`)+`
`}catch{}return r}async function E(n){const r=u,{elements:t,title:c=r(551),paperSize:e,orientation:a=r(482),pageMargin:o="0",extraCss:x=""}=n;if(!t[r(525)])return"";const i=N(),l=[];for(const s of t){const f=s[r(579)](!0);H(s,f),await F(f),l[r(569)](r(542)+f[r(532)]+"</div>")}return r(466)+z(c)+r(484)+i+r(499)+W[e][a]+r(493)+o+r(444)+x+`
</style>
</head>
<body>
`+l.join(`
`)+r(572)}async function L(n,r){const t=u;try{const c=(await C(async()=>{const p=m,{default:h}=await import(p(433))[p(477)](b=>b.h);return{default:h}},[],import.meta.url)).default,{jsPDF:e}=await C(async()=>{const p=m,{jsPDF:h}=await import(p(433))[p(477)](b=>b.j);return{jsPDF:h}},[],import.meta.url),{elements:a,paperSize:o,orientation:x="portrait",filename:i}=n,l=r||n.onProgressChange;if(!a[t(525)])return{success:!1,error:t(468)};let s="a4";o===t(559)?s=[53.98,85.6]:o===t(498)?s="letter":o===t(447)&&(s=[215.9,330.2]);const f=new e({orientation:x,unit:"mm",format:s,compress:!0}),d=f[t(476)][t(518)][t(496)](),T=f[t(476)][t(518)].getHeight(),w=a[t(525)],P=w>1;for(let p=0;p<w;p++){p>0&&f[t(478)](s,x);const h=a[p],b=h[t(475)]||h[t(552)]()[t(462)]||1,k=d/25.4*(P?160:250),D=Math[t(578)](P?2:3,Math[t(562)](1.2,k/b)),I=await c(h,{scale:D,useCORS:!0,allowTaint:!0,backgroundColor:t(449),logging:!1});let _=I[t(485)](t(467),.9),S=t(494);if((!_||_===t(452)||!_[t(564)](t(511)))&&(_=I[t(485)]("image/png"),S=t(544)),!_||_==="data:,"||!_.startsWith(t(511))){console[t(429)]("Skipping element with empty canvas image:",h);continue}f[t(507)](_,S,0,0,d,T,void 0,t(451)),l&&l(Math[t(575)]((p+1)/w*100)),await new Promise(j=>setTimeout(j,15))}return f.save(""+(i[t(464)](".pdf")?i:i+t(441))),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c[t(455)]:t(522)}}}async function q(n){const r=u,t=window.electronAPI;if(t?.[r(490)]){const c=await E(n);if(!c)return{success:!1,error:r(468)};const{paperSize:e,orientation:a=r(482)}=n,o=v[e][a];return t.exportHtmlPdf({html:c,defaultFilename:n[r(497)],paperSize:e,pageWidthPx:o[r(462)],pageHeightPx:o.height,landscape:a===r(461)})}else return L(n,n.onProgressChange)}async function R(n){const r=u,t=await E(n);return t?new Promise(c=>{const e=r;try{const a=document[e(465)](e(437));a[e(508)].position=e(473),a[e(508)][e(521)]="0",a[e(508)][e(556)]="0",a.style[e(462)]="0",a[e(508)].height="0",a[e(508)][e(553)]="0",a[e(508)].zIndex=e(528),document[e(538)][e(487)](a);const o=a.contentWindow?.[e(568)]||a[e(545)];if(!o){document[e(538)][e(524)](a),c({success:!1,error:e(574)});return}o[e(513)](),o[e(563)](t),o[e(558)](),a.onload=()=>{setTimeout(()=>{const x=m;try{a[x(463)]?.focus(),a[x(463)]?.[x(495)](),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i[x(455)]:x(481)})}finally{setTimeout(()=>{const i=x;document[i(538)][i(536)](a)&&document[i(538)][i(524)](a)},5e3)}},500)}}catch(a){c({success:!1,error:a instanceof Error?a[e(455)]:"Print failed."})}}):{success:!1,error:r(577)}}function y(){const n=["appendChild","constructor","&gt;","exportHtmlPdf","1315YmIBOq","justifyContent",`;
    margin: `,"JPEG","print","getWidth","filename","letter",`
@page {
    size: `,"join","image/png","fontWeight","return (function() ","48994PVWmaU","inline-flex","map","addImage","style","all","8.5in 11in","data:image/","boxSizing","open","anonymous","apply","117630FuzXAT","&quot;","pageSize","53.98mm 85.6mm","toString","right","Direct download failed.","drawImage","removeChild","length","1872632hSojYE","flex-start","-9999","setAttribute","table","origin","outerHTML","7TqkhUf","onload","getAttribute","contains","classList","body","from","11in 8.5in","blob:",'<div class="pdf-page">',"&lt;","PNG","contentDocument","replaceChild","querySelectorAll","location","img","info","Document","getBoundingClientRect","border","8.5in 13in","className","bottom","src","close","cr80","parentNode","10CQYZbT","max","write","startsWith","alignItems","span","trace","document","push","checkbox","cssRules",`
</body>
</html>`,'{}.constructor("return this")( )',"Failed to access iframe document.","round","prototype","Nothing to print.","min","cloneNode","display","warn","input, select, textarea","naturalHeight","100%","./vendor-pdf-libs-BVl_U1Kq.js","cssText","2946uqpPSj","297mm 210mm","iframe","105ToqnUl","2720106vVfQeF","bind",".pdf","options","height",`;
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
`,"log","textContent","folio","getContext","#ffffff","data:","FAST","data:,","crossOrigin","value","message","onerror","replace","forEach","console","flexShrink","landscape","width","contentWindow","endsWith","createElement",`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`,"image/jpeg","Nothing to export.","2284pLvObI","type","center","error","fixed","styleSheets","offsetWidth","internal","then","addPage","canvas","color","Print failed.","portrait","26282fUSfTM",`</title>
<style>
`,"toDataURL","text"];return y=function(){return n},y()}export{q as e,R as p};
