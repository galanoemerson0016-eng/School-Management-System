const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./vendor-pdf-libs-bW6sTN74.js","./vendor-7cLp5d9B.js"])))=>i.map(i=>d[i]);
import{_ as E}from"./vendor-pdf-libs-bW6sTN74.js";const u=_;(function(n,r){const t=_,c=n();for(;;)try{if(parseInt(t(332))/1+-parseInt(t(416))/2+-parseInt(t(400))/3+parseInt(t(427))/4*(parseInt(t(318))/5)+-parseInt(t(363))/6+parseInt(t(329))/7+parseInt(t(425))/8*(-parseInt(t(404))/9)===r)break;c.push(c.shift())}catch{c.push(c.shift())}})(y,432181);const b=(function(){let n=!0;return function(r,t){const c=n?function(){const e=_;if(t){const a=t[e(285)](r,arguments);return t=null,a}}:function(){};return n=!1,c}})(),M=b(void 0,function(){const n=_;let r;try{r=Function(n(344)+n(399)+");")()}catch{r=window}const t=r.console=r.console||{},c=[n(295),n(418),n(309),n(357),n(422),n(359),n(283)];for(let e=0;e<c.length;e++){const a=b[n(279)].prototype[n(314)](b),o=c[e],x=t[o]||a;a[n(294)]=b[n(314)](b),a.toString=x[n(352)][n(314)](x),t[o]=a}});M();const v={letter:{portrait:u(331),landscape:"11in 8.5in"},a4:{portrait:u(312),landscape:u(424)},folio:{portrait:"8.5in 13in",landscape:u(408)},cr80:{portrait:u(367),landscape:u(361)}},z={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function A(n){const r=u;return n[r(289)](/&/g,r(411)).replace(/</g,"&lt;").replace(/>/g,r(338))[r(289)](/"/g,r(356))}function F(n,r,t){return new Promise(c=>{const e=_,a=new Image;a[e(322)]=e(391),a[e(320)]=()=>{const o=e;let x=a.naturalWidth||a[o(378)],i=a[o(307)]||a.height;if(!x||!i){c(n);return}const f=Math[o(396)](r/x,t/i,1);x=Math.max(1,Math[o(390)](x*f)),i=Math.max(1,Math.round(i*f));try{const s=document[o(349)]("canvas");s[o(378)]=x,s.height=i;const d=s[o(327)]("2d");if(!d){c(n);return}d[o(347)](a,0,0,x,i),c(s[o(366)](o(291)))}catch{c(n)}},a.onerror=()=>c(n),a[e(326)]=n})}async function W(n){const r=u,t=[];n.querySelectorAll(r(381))[r(406)](c=>{const e=r,a=c;let o=a[e(371)](e(326))||"";if(!o||(o[e(324)]("/")&&(o=""+window[e(430)][e(301)]+o,a.setAttribute("src",o)),o[e(324)](e(337))||o[e(324)](e(393))))return;t[e(341)](F(o,2048,2048)[e(386)](f=>{a[e(369)]("src",f)}))}),await Promise[r(304)](t)}function N(n,r){const t=u,c=n[t(284)](t(281)),e=r[t(284)]("input, select, textarea");c.forEach((a,o)=>{const x=t,i=e[o];if(!i)return;let f="";if(a instanceof HTMLSelectElement)f=a[x(333)][a[x(334)]]?.text??a.value;else if(a instanceof HTMLInputElement&&a[x(290)]===x(340)){const d=a[x(421)],l=document[x(349)](x(419));l.className=i.className,l[x(369)](x(345),i[x(371)](x(345))||""),l.style[x(336)]=x(415),l.style.alignItems=x(323),l[x(345)].justifyContent=x(323),l[x(345)].border=x(370),l[x(345)][x(382)]=x(330),l[x(345)].backgroundColor=d?x(300):"#ffffff",l.style[x(420)]=x(379),l.style[x(313)]=x(426),l[x(345)].fontWeight=x(431),l[x(345)][x(348)]="1",l[x(345)][x(292)]="0",l.style[x(282)]=x(328),l[x(316)]=d?"✓":"",i[x(394)]?.replaceChild(l,i);return}else f=a[x(362)]||"";const s=document[x(349)]("span");s[x(316)]=f,s[x(346)]=i[x(346)],s[x(369)](x(345),i[x(371)](x(345))||""),s[x(345)][x(336)]=x(415),s[x(345)].alignItems="center",s[x(345)][x(414)]=i.classList[x(401)](x(412))?"flex-start":x(323),s[x(345)].width=x(392),s[x(345)].height=x(392),i[x(394)]?.[x(317)](s,i)})}function H(){const n=u;let r="";for(const t of Array[n(380)](document[n(350)]))try{r+=Array[n(380)](t[n(298)])[n(343)](c=>c.cssText).join(`
`)+`
`}catch{}return r}async function S(n){const r=u,{elements:t,title:c=r(407),paperSize:e,orientation:a=r(417),pageMargin:o="0",extraCss:x=""}=n;if(!t[r(395)])return"";const i=H(),f=[];for(const s of t){const d=s[r(402)](!0);N(s,d),await W(d),f[r(341)](r(319)+d.outerHTML+r(305))}return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`+A(c)+r(384)+i+r(354)+v[e][a]+r(397)+o+`;
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
`+x+r(355)+f[r(413)](`
`)+r(360)}async function L(n,r){const t=u;try{const c=(await E(async()=>{const p=_,{default:m}=await import(p(297)).then(g=>g.h);return{default:m}},[],import.meta.url))[t(373)],{jsPDF:e}=await E(async()=>{const p=t,{jsPDF:m}=await import("./vendor-pdf-libs-bW6sTN74.js")[p(386)](g=>g.j);return{jsPDF:m}},__vite__mapDeps([0,1]),import.meta.url),{elements:a,paperSize:o,orientation:x="portrait",filename:i}=n,f=r||n.onProgressChange;if(!a.length)return{success:!1,error:t(387)};let s="a4";o==="cr80"?s=[53.98,85.6]:o===t(310)?s=t(310):o===t(388)&&(s=[215.9,330.2]);const d=new e({orientation:x,unit:"mm",format:s,compress:!0}),l=d[t(383)][t(368)][t(405)](),T=d[t(383)][t(368)][t(342)](),w=a[t(395)],P=w>1;for(let p=0;p<w;p++){p>0&&d[t(335)](s,x);const m=a[p],g=m[t(293)]||m[t(311)]()[t(378)]||1,j=l/25.4*(P?160:250),k=Math.min(P?2:3,Math[t(385)](1.2,j/g)),I=await c(m,{scale:k,useCORS:!0,allowTaint:!0,backgroundColor:t(379),logging:!1});let h=I[t(366)](t(409),.9),C=t(351);if((!h||h===t(428)||!h[t(324)](t(278)))&&(h=I[t(366)](t(291)),C=t(306)),!h||h===t(428)||!h[t(324)]("data:image/")){console[t(418)](t(410),m);continue}d[t(315)](h,C,0,0,l,T,void 0,t(403)),f&&f(Math[t(390)]((p+1)/w*100)),await new Promise(D=>setTimeout(D,15))}return d[t(423)](""+(i[t(339)](t(299))?i:i+t(299))),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c[t(280)]:"Direct download failed."}}}function _(n,r){return n=n-277,y()[n]}async function G(n){const r=u,t=window[r(353)];if(t?.[r(358)]){const c=await S(n);if(!c)return{success:!1,error:r(387)};const{paperSize:e,orientation:a=r(417)}=n,o=z[e][a];return t[r(358)]({html:c,defaultFilename:n[r(377)],paperSize:e,pageWidthPx:o[r(378)],pageHeightPx:o[r(374)],landscape:a===r(303)})}else return L(n,n[r(364)])}async function O(n){const r=u,t=await S(n);return t?new Promise(c=>{const e=r;try{const a=document[e(349)](e(286));a[e(345)][e(296)]=e(308),a.style[e(376)]="0",a.style.bottom="0",a.style[e(378)]="0",a[e(345)][e(374)]="0",a[e(345)][e(287)]="0",a[e(345)].zIndex=e(398),document[e(277)].appendChild(a);const o=a[e(365)]?.[e(325)]||a[e(429)];if(!o){document.body[e(375)](a),c({success:!1,error:e(302)});return}o.open(),o[e(288)](t),o[e(389)](),a.onload=()=>{setTimeout(()=>{const x=_;try{a[x(365)]?.focus(),a[x(365)]?.print(),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i.message:x(372)})}finally{setTimeout(()=>{const i=x;document.body[i(401)](a)&&document[i(277)][i(375)](a)},5e3)}},500)}}catch(a){c({success:!1,error:a instanceof Error?a[e(280)]:e(372)})}}):{success:!1,error:r(321)}}function y(){const n=["min",`;
    margin: `,"-9999",'{}.constructor("return this")( )',"692370eGEvUi","contains","cloneNode","FAST","7622793IMWibr","getWidth","forEach","Document","13in 8.5in","image/jpeg","Skipping element with empty canvas image:","&amp;","text-left","join","justifyContent","inline-flex","1010442rBRixq","portrait","warn","span","color","checked","exception","save","297mm 210mm","8rnZGaM","9px","536TpTpjZ","data:,","contentDocument","location","900","body","data:image/","constructor","message","input, select, textarea","boxSizing","trace","querySelectorAll","apply","iframe","border","write","replace","type","image/png","flexShrink","offsetWidth","__proto__","log","position","./vendor-pdf-libs-bW6sTN74.js","cssRules",".pdf","#0f172a","origin","Failed to access iframe document.","landscape","all","</div>","PNG","naturalHeight","fixed","info","letter","getBoundingClientRect","210mm 297mm","fontSize","bind","addImage","textContent","replaceChild","28010XfGzLT",'<div class="pdf-page">',"onload","Nothing to print.","crossOrigin","center","startsWith","document","src","getContext","border-box","5515552NiEXFV","2px","8.5in 11in","670192Ctxxzx","options","selectedIndex","addPage","display","blob:","&gt;","endsWith","checkbox","push","getHeight","map","return (function() ","style","className","drawImage","lineHeight","createElement","styleSheets","JPEG","toString","electronAPI",`
@page {
    size: `,`
</style>
</head>
<body>
`,"&quot;","error","exportHtmlPdf","table",`
</body>
</html>`,"85.6mm 53.98mm","value","1161762zbmjvm","onProgressChange","contentWindow","toDataURL","53.98mm 85.6mm","pageSize","setAttribute","1.5px solid #0f172a","getAttribute","Print failed.","default","height","removeChild","right","filename","width","#ffffff","from","img","borderRadius","internal",`</title>
<style>
`,"max","then","Nothing to export.","folio","close","round","anonymous","100%","data:","parentNode","length"];return y=function(){return n},y()}export{G as e,O as p};
