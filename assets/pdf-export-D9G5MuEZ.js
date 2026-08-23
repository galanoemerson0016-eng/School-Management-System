import{_ as E}from"./vendor-pdf-libs-BM6gRrjI.js";function _(n,r){return n=n-382,w()[n]}const f=_;(function(n,r){const t=_,c=n();for(;;)try{if(-parseInt(t(440))/1*(parseInt(t(517))/2)+-parseInt(t(445))/3*(-parseInt(t(433))/4)+-parseInt(t(457))/5+parseInt(t(449))/6*(-parseInt(t(406))/7)+parseInt(t(446))/8*(-parseInt(t(399))/9)+-parseInt(t(383))/10+parseInt(t(414))/11*(parseInt(t(385))/12)===r)break;c.push(c.shift())}catch{c.push(c.shift())}})(w,476415);const g=(function(){let n=!0;return function(r,t){const c=n?function(){const a=_;if(t){const e=t[a(476)](r,arguments);return t=null,e}}:function(){};return n=!1,c}})(),z=g(void 0,function(){const n=_,r=function(){const e=_;let o;try{o=Function(e(510)+e(519)+");")()}catch{o=window}return o},t=r(),c=t.console=t[n(411)]||{},a=[n(516),n(420),n(447),"error",n(492),n(405),n(392)];for(let e=0;e<a[n(423)];e++){const o=g[n(460)][n(412)].bind(g),x=a[e],i=c[x]||o;o.__proto__=g.bind(g),o[n(496)]=i[n(496)][n(540)](i),c[x]=o}});z();const v={letter:{portrait:f(436),landscape:f(432)},a4:{portrait:f(495),landscape:f(472)},folio:{portrait:f(477),landscape:f(474)},cr80:{portrait:f(507),landscape:f(418)}},A={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function M(n){const r=f;return n[r(452)](/&/g,r(427)).replace(/</g,r(479)).replace(/>/g,r(403))[r(452)](/"/g,r(497))}function R(n,r,t){return new Promise(c=>{const a=_,e=new Image;e[a(515)]=a(430),e[a(402)]=()=>{const o=a;let x=e.naturalWidth||e[o(393)],i=e[o(541)]||e[o(413)];if(!x||!i){c(n);return}const u=Math.min(r/x,t/i,1);x=Math.max(1,Math[o(509)](x*u)),i=Math[o(461)](1,Math[o(509)](i*u));try{const s=document[o(503)]("canvas");s[o(393)]=x,s[o(413)]=i;const l=s[o(410)]("2d");if(!l){c(n);return}l.drawImage(e,0,0,x,i),c(s[o(508)]("image/png"))}catch{c(n)}},e.onerror=()=>c(n),e.src=n})}async function F(n){const r=f,t=[];n.querySelectorAll(r(481)).forEach(c=>{const a=r,e=c;let o=e.getAttribute("src")||"";if(!o||(o[a(387)]("/")&&(o=""+window[a(416)][a(421)]+o,e[a(483)](a(473),o)),o[a(387)](a(482))||o[a(387)](a(525))))return;t[a(398)](R(o,2048,2048).then(u=>{const s=a;e[s(483)](s(473),u)}))}),await Promise[r(465)](t)}function W(n,r){const t=f,c=n[t(512)](t(450)),a=r[t(512)](t(450));c[t(475)]((e,o)=>{const x=t,i=a[o];if(!i)return;let u="";if(e instanceof HTMLSelectElement)u=e[x(537)][e.selectedIndex]?.[x(505)]??e[x(455)];else if(e instanceof HTMLInputElement&&e[x(518)]==="checkbox"){const l=e[x(442)],d=document[x(503)](x(424));d[x(391)]=i[x(391)],d[x(483)](x(404),i[x(520)](x(404))||""),d[x(404)][x(386)]=x(438),d[x(404)][x(408)]=x(514),d[x(404)][x(480)]=x(514),d[x(404)][x(434)]="1.5px solid #0f172a",d[x(404)][x(396)]=x(538),d[x(404)].backgroundColor=x(l?486:535),d[x(404)][x(488)]=x(535),d[x(404)][x(471)]="9px",d[x(404)][x(435)]=x(511),d.style[x(499)]="1",d[x(404)][x(493)]="0",d[x(404)][x(382)]=x(448),d[x(401)]=l?"✓":"",i.parentNode?.[x(426)](d,i);return}else u=e.value||"";const s=document[x(503)]("span");s.textContent=u,s[x(391)]=i[x(391)],s[x(483)]("style",i.getAttribute(x(404))||""),s[x(404)][x(386)]=x(438),s[x(404)][x(408)]=x(514),s[x(404)][x(480)]=i[x(470)][x(428)]("text-left")?x(384):"center",s[x(404)][x(393)]=x(484),s.style[x(413)]=x(484),i[x(523)]?.[x(426)](s,i)})}function L(){const n=f;let r="";for(const t of Array[n(489)](document[n(531)]))try{r+=Array[n(489)](t[n(524)])[n(451)](c=>c[n(444)])[n(513)](`
`)+`
`}catch{}return r}async function S(n){const r=f,{elements:t,title:c=r(532),paperSize:a,orientation:e=r(459),pageMargin:o="0",extraCss:x=""}=n;if(!t[r(423)])return"";const i=L(),u=[];for(const s of t){const l=s[r(390)](!0);W(s,l),await F(l),u[r(398)]('<div class="pdf-page">'+l[r(521)]+r(456))}return r(409)+M(c)+r(506)+i+r(464)+v[a][e]+r(527)+o+r(487)+x+`
</style>
</head>
<body>
`+u[r(513)](`
`)+r(501)}async function H(n,r){const t=f;try{const c=(await E(async()=>{const p=_,{default:m}=await import(p(407))[p(534)](h=>h.h);return{default:m}},[],import.meta.url))[t(422)],{jsPDF:a}=await E(async()=>{const p=t,{jsPDF:m}=await import(p(407))[p(534)](h=>h.j);return{jsPDF:m}},[],import.meta.url),{elements:e,paperSize:o,orientation:x="portrait",filename:i}=n,u=r||n[t(498)];if(!e.length)return{success:!1,error:t(395)};let s="a4";o===t(441)?s=[53.98,85.6]:o===t(526)?s=t(526):o==="folio"&&(s=[215.9,330.2]);const l=new a({orientation:x,unit:"mm",format:s,compress:!0}),d=l[t(468)].pageSize[t(494)](),D=l.internal[t(539)][t(400)](),y=e.length,P=y>1;for(let p=0;p<y;p++){p>0&&l[t(529)](s,x);const m=e[p],h=m[t(429)]||m[t(528)]()[t(393)]||1,k=d/25.4*(P?160:250),T=Math[t(500)](P?2:3,Math[t(461)](1.2,k/h)),I=await c(m,{scale:T,useCORS:!0,allowTaint:!0,backgroundColor:"#ffffff",logging:!1});let b=I.toDataURL("image/jpeg",.9),C=t(425);if((!b||b===t(466)||!b[t(387)](t(536)))&&(b=I.toDataURL("image/png"),C=t(388)),!b||b===t(466)||!b.startsWith(t(536))){console[t(420)](t(397),m);continue}l[t(502)](b,C,0,0,d,D,void 0,t(417)),u&&u(Math[t(509)]((p+1)/y*100)),await new Promise(j=>setTimeout(j,15))}return l[t(533)](""+(i[t(485)](".pdf")?i:i+".pdf")),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c[t(490)]:t(394)}}}async function U(n){const r=f,t=window[r(530)];if(t?.[r(522)]){const c=await S(n);if(!c)return{success:!1,error:r(395)};const{paperSize:a,orientation:e=r(459)}=n,o=A[a][e];return t[r(522)]({html:c,defaultFilename:n.filename,paperSize:a,pageWidthPx:o.width,pageHeightPx:o[r(413)],landscape:e===r(431)})}else return H(n,n[r(498)])}async function O(n){const r=f,t=await S(n);return t?new Promise(c=>{const a=r;try{const e=document[a(503)](a(454));e[a(404)][a(463)]="fixed",e[a(404)][a(504)]="0",e[a(404)][a(491)]="0",e[a(404)].width="0",e[a(404)][a(413)]="0",e[a(404)][a(434)]="0",e[a(404)][a(467)]=a(458),document[a(437)][a(443)](e);const o=e[a(469)]?.document||e[a(419)];if(!o){document[a(437)][a(439)](e),c({success:!1,error:"Failed to access iframe document."});return}o[a(462)](),o[a(478)](t),o.close(),e[a(402)]=()=>{setTimeout(()=>{const x=_;try{e[x(469)]?.focus(),e[x(469)]?.[x(389)](),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i[x(490)]:x(415)})}finally{setTimeout(()=>{const i=x;document.body[i(428)](e)&&document.body[i(439)](e)},5e3)}},500)}}catch(e){c({success:!1,error:e instanceof Error?e.message:"Print failed."})}}):{success:!1,error:r(453)}}function w(){const n=["body","inline-flex","removeChild","1kPbrcY","cr80","checked","appendChild","cssText","12jflhTC","1392824EyBodU","info","border-box","6pXzjRw","input, select, textarea","map","replace","Nothing to print.","iframe","value","</div>","942935QEpUTL","-9999","portrait","constructor","max","open","position",`
@page {
    size: `,"all","data:,","zIndex","internal","contentWindow","classList","fontSize","297mm 210mm","src","13in 8.5in","forEach","apply","8.5in 13in","write","&lt;","justifyContent","img","blob:","setAttribute","100%","endsWith","#0f172a",`;
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
`,"color","from","message","bottom","exception","flexShrink","getWidth","210mm 297mm","toString","&quot;","onProgressChange","lineHeight","min",`
</body>
</html>`,"addImage","createElement","right","text",`</title>
<style>
`,"53.98mm 85.6mm","toDataURL","round","return (function() ","900","querySelectorAll","join","center","crossOrigin","log","1697198VsubhX","type",'{}.constructor("return this")( )',"getAttribute","outerHTML","exportHtmlPdf","parentNode","cssRules","data:","letter",`;
    margin: `,"getBoundingClientRect","addPage","electronAPI","styleSheets","Document","save","then","#ffffff","data:image/","options","2px","pageSize","bind","naturalHeight","boxSizing","7394700BTyynn","flex-start","156zmYUCG","display","startsWith","PNG","print","cloneNode","className","trace","width","Direct download failed.","Nothing to export.","borderRadius","Skipping element with empty canvas image:","push","45CcpxOJ","getHeight","textContent","onload","&gt;","style","table","207991RjzRYr","./vendor-pdf-libs-BM6gRrjI.js","alignItems",`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`,"getContext","console","prototype","height","2345893mZUGvw","Print failed.","location","FAST","85.6mm 53.98mm","contentDocument","warn","origin","default","length","span","JPEG","replaceChild","&amp;","contains","offsetWidth","anonymous","landscape","11in 8.5in","380880PUjFJy","border","fontWeight","8.5in 11in"];return w=function(){return n},w()}export{U as e,O as p};
