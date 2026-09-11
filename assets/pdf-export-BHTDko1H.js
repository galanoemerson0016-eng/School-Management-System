import{_ as E}from"./vendor-pdf-libs-pkSkukdV.js";const f=_;(function(t,o){const e=_,a=t();for(;;)try{if(parseInt(e(380))/1*(-parseInt(e(373))/2)+-parseInt(e(413))/3*(parseInt(e(449))/4)+parseInt(e(470))/5*(-parseInt(e(419))/6)+parseInt(e(461))/7+parseInt(e(407))/8*(parseInt(e(405))/9)+-parseInt(e(379))/10+parseInt(e(388))/11*(parseInt(e(466))/12)===o)break;a.push(a.shift())}catch{a.push(a.shift())}})(w,908108);const g=(function(){let t=!0;return function(o,e){const a=t?function(){const n=_;if(e){const c=e[n(432)](o,arguments);return e=null,c}}:function(){};return t=!1,a}})(),M=g(void 0,function(){const t=_,o=function(){let c;try{c=Function('return (function() {}.constructor("return this")( ));')()}catch{c=window}return c},e=o(),a=e.console=e[t(364)]||{},n=[t(498),t(375),"info",t(490),t(390),t(386),t(362)];for(let c=0;c<n[t(454)];c++){const r=g[t(408)][t(423)][t(381)](g),x=n[c],i=a[x]||r;r[t(376)]=g[t(381)](g),r[t(486)]=i[t(486)][t(381)](i),a[x]=r}});M();function _(t,o){return t=t-359,w()[t]}const j={letter:{portrait:f(397),landscape:f(425)},a4:{portrait:f(464),landscape:f(372)},folio:{portrait:f(429),landscape:f(430)},cr80:{portrait:f(501),landscape:f(451)}},A={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function z(t){const o=f;return t[o(404)](/&/g,o(395))[o(404)](/</g,o(494)).replace(/>/g,o(484))[o(404)](/"/g,o(406))}function W(t,o,e){return new Promise(a=>{const n=_,c=new Image;c[n(496)]=n(431),c.onload=()=>{const r=n;let x=c.naturalWidth||c[r(359)],i=c[r(448)]||c[r(418)];if(!x||!i){a(t);return}const u=Math.min(o/x,e/i,1);x=Math[r(393)](1,Math[r(400)](x*u)),i=Math[r(393)](1,Math[r(400)](i*u));try{const s=document[r(456)](r(410));s[r(359)]=x,s[r(418)]=i;const l=s[r(499)]("2d");if(!l){a(t);return}l.drawImage(c,0,0,x,i),a(s[r(455)](r(444)))}catch{a(t)}},c.onerror=()=>a(t),c[n(446)]=t})}async function F(t){const o=f,e=[];t.querySelectorAll(o(394))[o(436)](a=>{const n=o,c=a;let r=c[n(458)](n(446))||"";if(!r||(r.startsWith("/")&&(r=""+window.location[n(401)]+r,c[n(417)](n(446),r)),r[n(502)]("blob:")||r[n(502)]("data:")))return;e.push(W(r,2048,2048).then(u=>{const s=n;c[s(417)](s(446),u)}))}),await Promise.all(e)}function L(t,o){const e=f,a=t[e(453)]("input, select, textarea"),n=o[e(453)](e(460));a[e(436)]((c,r)=>{const x=e,i=n[r];if(!i)return;let u="";if(c instanceof HTMLSelectElement)u=c.options[c.selectedIndex]?.text??c.value;else if(c instanceof HTMLInputElement&&c.type===x(492)){const l=c[x(465)],d=document.createElement(x(420));d.className=i[x(370)],d[x(417)](x(409),i[x(458)](x(409))||""),d[x(409)].display=x(384),d[x(409)][x(482)]="center",d[x(409)][x(365)]=x(493),d[x(409)][x(414)]=x(402),d[x(409)].borderRadius=x(447),d[x(409)].backgroundColor=x(l?459:377),d[x(409)][x(412)]=x(377),d[x(409)][x(478)]="9px",d.style[x(452)]=x(503),d[x(409)][x(483)]="1",d[x(409)].flexShrink="0",d[x(409)].boxSizing=x(462),d[x(399)]=l?"✓":"",i[x(487)]?.[x(363)](d,i);return}else u=c.value||"";const s=document[x(456)](x(420));s[x(399)]=u,s[x(370)]=i[x(370)],s[x(417)]("style",i[x(458)](x(409))||""),s[x(409)][x(421)]="inline-flex",s.style[x(482)]=x(493),s[x(409)][x(365)]=i.classList[x(383)](x(374))?"flex-start":x(493),s[x(409)][x(359)]="100%",s[x(409)][x(418)]=x(415),i[x(487)]?.[x(363)](s,i)})}function N(){const t=f;let o="";for(const e of Array[t(469)](document.styleSheets))try{o+=Array[t(469)](e.cssRules)[t(495)](a=>a[t(369)])[t(488)](`
`)+`
`}catch{}return o}async function C(t){const o=f,{elements:e,title:a="Document",paperSize:n,orientation:c=o(440),pageMargin:r="0",extraCss:x=""}=t;if(!e[o(454)])return"";const i=N(),u=[];for(const s of e){const l=s.cloneNode(!0);L(s,l),await F(l),u[o(489)](o(467)+l.outerHTML+o(371))}return o(435)+z(a)+o(392)+i+`
@page {
    size: `+j[n][c]+`;
    margin: `+r+o(475)+x+`
</style>
</head>
<body>
`+u[o(488)](`
`)+o(416)}async function H(t,o){const e=f;try{const a=(await E(async()=>{const p=_,{default:m}=await import(p(474))[p(497)](b=>b.h);return{default:m}},[],import.meta.url))[e(441)],{jsPDF:n}=await E(async()=>{const p=e,{jsPDF:m}=await import(p(474))[p(497)](b=>b.j);return{jsPDF:m}},[],import.meta.url),{elements:c,paperSize:r,orientation:x=e(440),filename:i}=t,u=o||t.onProgressChange;if(!c[e(454)])return{success:!1,error:e(428)};let s="a4";r===e(443)?s=[53.98,85.6]:r==="letter"?s=e(479):r===e(368)&&(s=[215.9,330.2]);const l=new n({orientation:x,unit:"mm",format:s,compress:!0}),d=l[e(472)][e(411)][e(378)](),D=l.internal[e(411)][e(403)](),y=c.length,P=y>1;for(let p=0;p<y;p++){p>0&&l[e(396)](s,x);const m=c[p],b=m[e(491)]||m[e(398)]()[e(359)]||1,T=d/25.4*(P?160:250),k=Math.min(P?2:3,Math.max(1.2,T/b)),I=await a(m,{scale:k,useCORS:!0,allowTaint:!0,backgroundColor:e(377),logging:!1});let h=I[e(455)](e(480),.9),S=e(481);if((!h||h===e(450)||!h[e(502)]("data:image/"))&&(h=I[e(455)](e(444)),S=e(427)),!h||h===e(450)||!h[e(502)](e(445))){console[e(375)](e(485),m);continue}l[e(477)](h,S,0,0,d,D,void 0,e(442)),u&&u(Math.round((p+1)/y*100)),await new Promise(v=>setTimeout(v,15))}return l[e(439)](""+(i[e(463)](e(387))?i:i+e(387))),{success:!0}}catch(a){return{success:!1,error:a instanceof Error?a[e(360)]:e(391)}}}async function R(t){const o=f,e=window.electronAPI;if(e?.[o(366)]){const a=await C(t);if(!a)return{success:!1,error:"Nothing to export."};const{paperSize:n,orientation:c=o(440)}=t,r=A[n][c];return e[o(366)]({html:a,defaultFilename:t[o(385)],paperSize:n,pageWidthPx:r[o(359)],pageHeightPx:r.height,landscape:c==="landscape"})}else return H(t,t.onProgressChange)}function w(){const t=["85.6mm 53.98mm","fontWeight","querySelectorAll","length","toDataURL","createElement","focus","getAttribute","#0f172a","input, select, textarea","3200715LKaTde","border-box","endsWith","210mm 297mm","checked","43323156gBBmFY",'<div class="pdf-page">',"contentDocument","from","218715eOfPbI","iframe","internal","write","./vendor-pdf-libs-pkSkukdV.js",`;
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
`,"open","addImage","fontSize","letter","image/jpeg","JPEG","alignItems","lineHeight","&gt;","Skipping element with empty canvas image:","toString","parentNode","join","push","error","offsetWidth","checkbox","center","&lt;","map","crossOrigin","then","log","getContext","print","53.98mm 85.6mm","startsWith","900","width","message","zIndex","trace","replaceChild","console","justifyContent","exportHtmlPdf","close","folio","cssText","className","</div>","297mm 210mm","399428MDEhff","text-left","warn","__proto__","#ffffff","getWidth","2427710TiXpjw","8SUBBAA","bind","Print failed.","contains","inline-flex","filename","table",".pdf","11sBucln","position","exception","Direct download failed.",`</title>
<style>
`,"max","img","&amp;","addPage","8.5in 11in","getBoundingClientRect","textContent","round","origin","1.5px solid #0f172a","getHeight","replace","9kPfyir","&quot;","1814136YhvLOq","constructor","style","canvas","pageSize","color","180zoTlVc","border","100%",`
</body>
</html>`,"setAttribute","height","168pLbRtD","span","display","removeChild","prototype","body","11in 8.5in","onload","PNG","Nothing to export.","8.5in 13in","13in 8.5in","anonymous","apply","bottom","fixed",`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`,"forEach","contentWindow","appendChild","save","portrait","default","FAST","cr80","image/png","data:image/","src","2px","naturalHeight","21392NPsTDb","data:,"];return w=function(){return t},w()}async function B(t){const o=await C(t);return o?new Promise(e=>{const a=_;try{const n=document[a(456)](a(471));n.style[a(389)]=a(434),n[a(409)].right="0",n[a(409)][a(433)]="0",n[a(409)][a(359)]="0",n.style[a(418)]="0",n.style[a(414)]="0",n[a(409)][a(361)]="-9999",document[a(424)][a(438)](n);const c=n.contentWindow?.document||n[a(468)];if(!c){document[a(424)][a(422)](n),e({success:!1,error:"Failed to access iframe document."});return}c[a(476)](),c[a(473)](o),c[a(367)](),n[a(426)]=()=>{setTimeout(()=>{const r=_;try{n[r(437)]?.[r(457)](),n[r(437)]?.[r(500)](),e({success:!0})}catch(x){e({success:!1,error:x instanceof Error?x[r(360)]:r(382)})}finally{setTimeout(()=>{const x=r;document[x(424)][x(383)](n)&&document[x(424)].removeChild(n)},5e3)}},500)}}catch(n){e({success:!1,error:n instanceof Error?n.message:a(382)})}}):{success:!1,error:"Nothing to print."}}export{R as e,B as p};
