import{_ as E}from"./vendor-pdf-libs-F9NHdXr1.js";const u=_;(function(a,t){const e=_,c=a();for(;;)try{if(-parseInt(e(277))/1+-parseInt(e(338))/2+parseInt(e(314))/3+-parseInt(e(284))/4+parseInt(e(219))/5+parseInt(e(217))/6+parseInt(e(264))/7*(-parseInt(e(196))/8)===t)break;c.push(c.shift())}catch{c.push(c.shift())}})(y,412183);const g=(function(){let a=!0;return function(t,e){const c=a?function(){if(e){const n=e.apply(t,arguments);return e=null,n}}:function(){};return a=!1,c}})(),j=g(void 0,function(){const a=_;let t;try{t=Function(a(231)+a(214)+");")()}catch{t=window}const e=t[a(320)]=t.console||{},c=["log",a(309),a(253),a(204),a(302),a(317),a(191)];for(let n=0;n<c.length;n++){const o=g[a(335)][a(207)][a(332)](g),r=c[n],x=e[r]||o;o[a(262)]=g[a(332)](g),o.toString=x[a(275)].bind(x),e[r]=o}});j();const v={letter:{portrait:u(303),landscape:"11in 8.5in"},a4:{portrait:u(268),landscape:u(305)},folio:{portrait:u(323),landscape:"13in 8.5in"},cr80:{portrait:u(216),landscape:"85.6mm 53.98mm"}},W={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function _(a,t){return a=a-189,y()[a]}function z(a){const t=u;return a[t(215)](/&/g,t(339)).replace(/</g,t(313))[t(215)](/>/g,t(242))[t(215)](/"/g,t(299))}function A(a,t,e){return new Promise(c=>{const n=_,o=new Image;o[n(289)]=n(294),o.onload=()=>{const r=n;let x=o[r(292)]||o[r(283)],i=o[r(291)]||o.height;if(!x||!i){c(a);return}const f=Math[r(228)](t/x,e/i,1);x=Math[r(286)](1,Math[r(290)](x*f)),i=Math[r(286)](1,Math[r(290)](i*f));try{const s=document[r(279)]("canvas");s[r(283)]=x,s[r(307)]=i;const l=s[r(306)]("2d");if(!l){c(a);return}l[r(310)](o,0,0,x,i),c(s[r(308)]("image/png"))}catch{c(a)}},o[n(205)]=()=>c(a),o[n(254)]=a})}async function N(a){const t=u,e=[];a[t(282)](t(190))[t(248)](c=>{const n=t,o=c;let r=o[n(301)]("src")||"";if(!r||(r[n(337)]("/")&&(r=""+window[n(280)][n(189)]+r,o.setAttribute(n(254),r)),r[n(337)]("blob:")||r.startsWith("data:")))return;e[n(278)](A(r,2048,2048).then(f=>{const s=n;o[s(192)](s(254),f)}))}),await Promise[t(343)](e)}function F(a,t){const e=u,c=a[e(282)](e(261)),n=t[e(282)](e(261));c[e(248)]((o,r)=>{const x=e,i=n[r];if(!i)return;let f="";if(o instanceof HTMLSelectElement)f=o.options[o.selectedIndex]?.[x(245)]??o[x(252)];else if(o instanceof HTMLInputElement&&o[x(241)]==="checkbox"){const l=o[x(201)],d=document.createElement(x(256));d[x(202)]=i[x(202)],d[x(192)](x(227),i.getAttribute(x(227))||""),d.style[x(247)]=x(341),d[x(227)][x(234)]=x(235),d.style[x(329)]=x(235),d.style[x(203)]=x(265),d[x(227)][x(271)]=x(325),d[x(227)].backgroundColor=l?"#0f172a":x(238),d[x(227)][x(328)]=x(238),d[x(227)].fontSize=x(276),d.style[x(218)]=x(210),d[x(227)][x(229)]="1",d[x(227)][x(212)]="0",d[x(227)][x(222)]=x(232),d.textContent=l?"✓":"",i.parentNode?.replaceChild(d,i);return}else f=o[x(252)]||"";const s=document[x(279)](x(256));s[x(237)]=f,s[x(202)]=i.className,s[x(192)](x(227),i[x(301)](x(227))||""),s[x(227)][x(247)]=x(341),s[x(227)][x(234)]=x(235),s[x(227)][x(329)]=i.classList[x(211)](x(293))?x(213):x(235),s.style[x(283)]=x(263),s[x(227)][x(307)]="100%",i[x(298)]?.[x(199)](s,i)})}function H(){const a=u;let t="";for(const e of Array.from(document[a(200)]))try{t+=Array[a(344)](e[a(322)])[a(226)](c=>c.cssText)[a(269)](`
`)+`
`}catch{}return t}async function S(a){const t=u,{elements:e,title:c="Document",paperSize:n,orientation:o=t(221),pageMargin:r="0",extraCss:x=""}=a;if(!e[t(304)])return"";const i=H(),f=[];for(const s of e){const l=s[t(319)](!0);F(s,l),await N(l),f[t(278)](t(249)+l[t(297)]+t(244))}return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`+z(c)+t(223)+i+t(195)+v[n][o]+t(318)+r+t(266)+x+t(321)+f[t(269)](`
`)+t(274)}function y(){const a=["filename","replaceChild","styleSheets","checked","className","border","error","onerror","close","prototype","Skipping element with empty canvas image:","getBoundingClientRect","900","contains","flexShrink","flex-start",'{}.constructor("return this")( )',"replace","53.98mm 85.6mm","3127026pEIbNo","fontWeight","3640230ufpGkj","print","portrait","boxSizing",`</title>
<style>
`,"then","Nothing to print.","map","style","min","lineHeight","./vendor-pdf-libs-F9NHdXr1.js","return (function() ","border-box","contentDocument","alignItems","center","Print failed.","textContent","#ffffff",".pdf","exportHtmlPdf","type","&gt;","fixed","</div>","text","document","display","forEach",'<div class="pdf-page">',"open","body","value","info","src","offsetWidth","span","letter","addPage","iframe","internal","input, select, textarea","__proto__","100%","456967PozGRN","1.5px solid #0f172a",`;
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
`,"-9999","210mm 297mm","join","save","borderRadius","addImage","getWidth",`
</body>
</html>`,"toString","9px","150424KQmTJM","push","createElement","location","write","querySelectorAll","width","191408evLfPs","contentWindow","max","onProgressChange","Direct download failed.","crossOrigin","round","naturalHeight","naturalWidth","text-left","anonymous","bottom","PNG","outerHTML","parentNode","&quot;","right","getAttribute","exception","8.5in 11in","length","297mm 210mm","getContext","height","toDataURL","warn","drawImage","zIndex","JPEG","&lt;","214788TITgJB","message","appendChild","table",`;
    margin: `,"cloneNode","console",`
</style>
</head>
<body>
`,"cssRules","8.5in 13in","endsWith","2px","electronAPI","data:,","color","justifyContent","onload","cr80","bind","position","pageSize","constructor","focus","startsWith","1159584YUlpCV","&amp;","folio","inline-flex","default","all","from","origin","img","trace","setAttribute","data:image/","getHeight",`
@page {
    size: `,"16RMbWMO","Nothing to export."];return y=function(){return a},y()}async function R(a,t){const e=u;try{const c=(await E(async()=>{const p=_,{default:m}=await import(p(230))[p(224)](b=>b.h);return{default:m}},[],import.meta.url))[e(342)],{jsPDF:n}=await E(async()=>{const p=e,{jsPDF:m}=await import(p(230)).then(b=>b.j);return{jsPDF:m}},[],import.meta.url),{elements:o,paperSize:r,orientation:x=e(221),filename:i}=a,f=t||a.onProgressChange;if(!o.length)return{success:!1,error:e(197)};let s="a4";r===e(331)?s=[53.98,85.6]:r===e(257)?s=e(257):r===e(340)&&(s=[215.9,330.2]);const l=new n({orientation:x,unit:"mm",format:s,compress:!0}),d=l[e(260)][e(334)][e(273)](),k=l[e(260)][e(334)][e(194)](),w=o.length,P=w>1;for(let p=0;p<w;p++){p>0&&l[e(258)](s,x);const m=o[p],b=m[e(255)]||m[e(209)]()[e(283)]||1,D=d/25.4*(P?160:250),T=Math[e(228)](P?2:3,Math[e(286)](1.2,D/b)),I=await c(m,{scale:T,useCORS:!0,allowTaint:!0,backgroundColor:e(238),logging:!1});let h=I[e(308)]("image/jpeg",.9),C=e(312);if((!h||h===e(327)||!h[e(337)](e(193)))&&(h=I.toDataURL("image/png"),C=e(296)),!h||h===e(327)||!h[e(337)](e(193))){console[e(309)](e(208),m);continue}l[e(272)](h,C,0,0,d,k,void 0,"FAST"),f&&f(Math[e(290)]((p+1)/w*100)),await new Promise(M=>setTimeout(M,15))}return l[e(270)](""+(i[e(324)](e(239))?i:i+e(239))),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c[e(315)]:e(288)}}}async function O(a){const t=u,e=window[t(326)];if(e?.exportHtmlPdf){const c=await S(a);if(!c)return{success:!1,error:t(197)};const{paperSize:n,orientation:o="portrait"}=a,r=W[n][o];return e[t(240)]({html:c,defaultFilename:a[t(198)],paperSize:n,pageWidthPx:r[t(283)],pageHeightPx:r[t(307)],landscape:o==="landscape"})}else return R(a,a[t(287)])}async function G(a){const t=u,e=await S(a);return e?new Promise(c=>{const n=t;try{const o=document[n(279)](n(259));o.style[n(333)]=n(243),o.style[n(300)]="0",o[n(227)][n(295)]="0",o.style[n(283)]="0",o[n(227)][n(307)]="0",o.style[n(203)]="0",o[n(227)][n(311)]=n(267),document[n(251)][n(316)](o);const r=o.contentWindow?.[n(246)]||o[n(233)];if(!r){document.body.removeChild(o),c({success:!1,error:"Failed to access iframe document."});return}r[n(250)](),r[n(281)](e),r[n(206)](),o[n(330)]=()=>{setTimeout(()=>{const x=_;try{o[x(285)]?.[x(336)](),o[x(285)]?.[x(220)](),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i[x(315)]:x(236)})}finally{setTimeout(()=>{const i=x;document[i(251)][i(211)](o)&&document[i(251)].removeChild(o)},5e3)}},500)}}catch(o){c({success:!1,error:o instanceof Error?o[n(315)]:"Print failed."})}}):{success:!1,error:t(225)}}export{O as e,G as p};
