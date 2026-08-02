import{_ as S}from"./vendor-pdf-libs-F9NHdXr1.js";const u=_;(function(a,o){const e=_,c=a();for(;;)try{if(parseInt(e(544))/1+parseInt(e(521))/2*(-parseInt(e(534))/3)+parseInt(e(522))/4+-parseInt(e(515))/5+parseInt(e(499))/6+-parseInt(e(574))/7+parseInt(e(573))/8===o)break;c.push(c.shift())}catch{c.push(c.shift())}})(w,751661);const g=(function(){let a=!0;return function(o,e){const c=a?function(){const t=_;if(e){const n=e[t(546)](o,arguments);return e=null,n}}:function(){};return a=!1,c}})(),T=g(void 0,function(){const a=_;let o;try{o=Function(a(498)+a(468)+");")()}catch{o=window}const e=o[a(557)]=o[a(557)]||{},c=[a(453),a(543),"info",a(478),a(565),"table",a(487)];for(let t=0;t<c.length;t++){const n=g[a(553)][a(566)][a(579)](g),r=c[t],x=e[r]||n;n[a(464)]=g[a(579)](g),n[a(462)]=x.toString[a(579)](x),e[r]=n}});T();const A={letter:{portrait:"8.5in 11in",landscape:u(568)},a4:{portrait:"210mm 297mm",landscape:"297mm 210mm"},folio:{portrait:u(479),landscape:u(503)},cr80:{portrait:"53.98mm 85.6mm",landscape:u(504)}},W={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function v(a){const o=u;return a[o(472)](/&/g,"&amp;")[o(472)](/</g,o(455))[o(472)](/>/g,"&gt;")[o(472)](/"/g,o(523))}function _(a,o){return a=a-437,w()[a]}function z(a,o,e){return new Promise(c=>{const t=_,n=new Image;n[t(480)]="anonymous",n.onload=()=>{const r=t;let x=n[r(559)]||n[r(484)],i=n.naturalHeight||n.height;if(!x||!i){c(a);return}const l=Math[r(558)](o/x,e/i,1);x=Math[r(533)](1,Math[r(580)](x*l)),i=Math[r(533)](1,Math[r(580)](i*l));try{const s=document[r(510)](r(467));s.width=x,s.height=i;const f=s[r(554)]("2d");if(!f){c(a);return}f[r(514)](n,0,0,x,i),c(s[r(537)](r(438)))}catch{c(a)}},n[t(516)]=()=>c(a),n[t(454)]=a})}async function F(a){const o=u,e=[];a.querySelectorAll(o(576))[o(502)](c=>{const t=o,n=c;let r=n.getAttribute(t(454))||"";if(!r||(r[t(549)]("/")&&(r=""+window[t(577)].origin+r,n[t(460)](t(454),r)),r[t(549)](t(572))||r[t(549)](t(509))))return;e[t(530)](z(r,2048,2048)[t(483)](l=>{const s=t;n[s(460)](s(454),l)}))}),await Promise.all(e)}function H(a,o){const e=u,c=a.querySelectorAll("input, select, textarea"),t=o.querySelectorAll(e(501));c[e(502)]((n,r)=>{const x=e,i=t[r];if(!i)return;let l="";if(n instanceof HTMLSelectElement)l=n[x(447)][n.selectedIndex]?.[x(450)]??n[x(556)];else if(n instanceof HTMLInputElement&&n[x(536)]===x(461)){const f=n[x(506)],d=document[x(510)](x(529));d[x(517)]=i[x(517)],d[x(460)](x(486),i[x(535)](x(486))||""),d[x(486)].display="inline-flex",d[x(486)].alignItems=x(437),d.style[x(563)]=x(437),d.style.border=x(481),d[x(486)].borderRadius=x(492),d[x(486)].backgroundColor=x(f?494:540),d[x(486)][x(527)]="#ffffff",d[x(486)][x(442)]=x(570),d[x(486)][x(466)]=x(562),d[x(486)][x(456)]="1",d.style.flexShrink="0",d.style[x(507)]="border-box",d.textContent=f?"✓":"",i[x(488)]?.replaceChild(d,i);return}else l=n[x(556)]||"";const s=document.createElement(x(529));s[x(555)]=l,s[x(517)]=i[x(517)],s[x(460)](x(486),i[x(535)](x(486))||""),s[x(486)].display=x(520),s.style[x(451)]=x(437),s.style.justifyContent=i[x(569)][x(513)](x(477))?"flex-start":x(437),s[x(486)].width=x(469),s[x(486)].height=x(469),i[x(488)]?.[x(524)](s,i)})}function R(){const a=u;let o="";for(const e of Array[a(538)](document[a(542)]))try{o+=Array.from(e[a(567)])[a(440)](c=>c[a(532)])[a(471)](`
`)+`
`}catch{}return o}async function D(a){const o=u,{elements:e,title:c=o(485),paperSize:t,orientation:n="portrait",pageMargin:r="0",extraCss:x=""}=a;if(!e.length)return"";const i=R(),l=[];for(const s of e){const f=s[o(582)](!0);H(s,f),await F(f),l[o(530)](o(512)+f.outerHTML+o(581))}return o(539)+v(c)+o(560)+i+o(465)+A[t][n]+o(482)+r+o(548)+x+`
</style>
</head>
<body>
`+l.join(`
`)+`
</body>
</html>`}function w(){const a=["type","toDataURL","from",`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`,"#ffffff",".pdf","styleSheets","warn","838230toRBDP","Print failed.","apply","removeChild",`;
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
`,"startsWith","body","Direct download failed.","bottom","constructor","getContext","textContent","value","console","min","naturalWidth",`</title>
<style>
`,"data:image/","900","justifyContent","./vendor-pdf-libs-F9NHdXr1.js","exception","prototype","cssRules","11in 8.5in","classList","9px","write","blob:","4346288GrPuiX","442162wFPDMJ","pageSize","img","location","electronAPI","bind","round","</div>","cloneNode","center","image/png","Skipping element with empty canvas image:","map","contentDocument","fontSize","print","onProgressChange","zIndex","image/jpeg","options","document","-9999","text","alignItems","right","log","src","&lt;","lineHeight","open","fixed","folio","setAttribute","checkbox","toString","getWidth","__proto__",`
@page {
    size: `,"fontWeight","canvas",'{}.constructor("return this")( )',"100%","position","join","replace","close","addImage","cr80","portrait","text-left","error","8.5in 13in","crossOrigin","1.5px solid #0f172a",`;
    margin: `,"then","width","Document","style","trace","parentNode","data:,","exportHtmlPdf","JPEG","2px","message","#0f172a","height","Nothing to export.","internal","return (function() ","1396812jdisOM","contentWindow","input, select, textarea","forEach","13in 8.5in","85.6mm 53.98mm","getHeight","checked","boxSizing","offsetWidth","data:","createElement","letter",'<div class="pdf-page">',"contains","drawImage","5222415lIWPqs","onerror","className","landscape","Nothing to print.","inline-flex","5986RjpTWd","5996236qKhGVX","&quot;","replaceChild","getBoundingClientRect","length","color","save","span","push","Failed to access iframe document.","cssText","max","1257HIYemO","getAttribute"];return w=function(){return a},w()}async function L(a,o){const e=u;try{const c=(await S(async()=>{const p=_,{default:m}=await import(p(564))[p(483)](b=>b.h);return{default:m}},[],import.meta.url)).default,{jsPDF:t}=await S(async()=>{const p=_,{jsPDF:m}=await import(p(564))[p(483)](b=>b.j);return{jsPDF:m}},[],import.meta.url),{elements:n,paperSize:r,orientation:x=e(476),filename:i}=a,l=o||a[e(444)];if(!n[e(526)])return{success:!1,error:e(496)};let s="a4";r===e(475)?s=[53.98,85.6]:r===e(511)?s=e(511):r===e(459)&&(s=[215.9,330.2]);const f=new t({orientation:x,unit:"mm",format:s,compress:!0}),d=f[e(497)][e(575)][e(463)](),E=f[e(497)][e(575)][e(505)](),y=n.length,P=y>1;for(let p=0;p<y;p++){p>0&&f.addPage(s,x);const m=n[p],b=m[e(508)]||m[e(525)]().width||1,j=d/25.4*(P?160:250),k=Math[e(558)](P?2:3,Math[e(533)](1.2,j/b)),I=await c(m,{scale:k,useCORS:!0,allowTaint:!0,backgroundColor:e(540),logging:!1});let h=I[e(537)](e(446),.9),C=e(491);if((!h||h===e(489)||!h.startsWith(e(561)))&&(h=I.toDataURL(e(438)),C="PNG"),!h||h===e(489)||!h[e(549)](e(561))){console[e(543)](e(439),m);continue}f[e(474)](h,C,0,0,d,E,void 0,"FAST"),l&&l(Math[e(580)]((p+1)/y*100)),await new Promise(M=>setTimeout(M,15))}return f[e(528)](""+(i.endsWith(e(541))?i:i+e(541))),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c[e(493)]:e(551)}}}async function N(a){const o=u,e=window[o(578)];if(e?.[o(490)]){const c=await D(a);if(!c)return{success:!1,error:o(496)};const{paperSize:t,orientation:n=o(476)}=a,r=W[t][n];return e[o(490)]({html:c,defaultFilename:a.filename,paperSize:t,pageWidthPx:r[o(484)],pageHeightPx:r[o(495)],landscape:n===o(518)})}else return L(a,a.onProgressChange)}async function q(a){const o=u,e=await D(a);return e?new Promise(c=>{const t=o;try{const n=document[t(510)]("iframe");n[t(486)][t(470)]=t(458),n[t(486)][t(452)]="0",n[t(486)][t(552)]="0",n[t(486)][t(484)]="0",n[t(486)][t(495)]="0",n[t(486)].border="0",n[t(486)][t(445)]=t(449),document[t(550)].appendChild(n);const r=n[t(500)]?.[t(448)]||n[t(441)];if(!r){document.body.removeChild(n),c({success:!1,error:t(531)});return}r[t(457)](),r[t(571)](e),r[t(473)](),n.onload=()=>{setTimeout(()=>{const x=_;try{n[x(500)]?.focus(),n[x(500)]?.[x(443)](),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i[x(493)]:x(545)})}finally{setTimeout(()=>{const i=x;document[i(550)][i(513)](n)&&document[i(550)][i(547)](n)},5e3)}},500)}}catch(n){c({success:!1,error:n instanceof Error?n[t(493)]:"Print failed."})}}):{success:!1,error:o(519)}}export{N as e,q as p};
