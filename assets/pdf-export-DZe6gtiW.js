import{_ as k}from"./vendor-pdf-libs-BVl_U1Kq.js";const l=h;function h(n,r){return n=n-123,w()[n]}(function(n,r){const t=h,c=n();for(;;)try{if(parseInt(t(172))/1+-parseInt(t(244))/2*(parseInt(t(161))/3)+-parseInt(t(253))/4*(-parseInt(t(133))/5)+-parseInt(t(218))/6+parseInt(t(182))/7*(parseInt(t(162))/8)+-parseInt(t(151))/9*(-parseInt(t(132))/10)+-parseInt(t(188))/11===r)break;c.push(c.shift())}catch{c.push(c.shift())}})(w,681052);const g=(function(){let n=!0;return function(r,t){const c=n?function(){const e=h;if(t){const a=t[e(241)](r,arguments);return t=null,a}}:function(){};return n=!1,c}})(),T=g(void 0,function(){const n=h;let r;try{r=Function(n(221)+'{}.constructor("return this")( ));')()}catch{r=window}const t=r[n(171)]=r[n(171)]||{},c=[n(245),n(263),n(205),"error",n(159),n(277),"trace"];for(let e=0;e<c[n(135)];e++){const a=g[n(186)][n(249)][n(206)](g),o=c[e],x=t[o]||a;a[n(258)]=g[n(206)](g),a[n(145)]=x.toString[n(206)](x),t[o]=a}});T();const A={letter:{portrait:l(163),landscape:l(195)},a4:{portrait:l(177),landscape:l(142)},folio:{portrait:l(225),landscape:l(179)},cr80:{portrait:l(248),landscape:l(204)}},N={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function v(n){const r=l;return n[r(224)](/&/g,r(236)).replace(/</g,r(127))[r(224)](/>/g,r(278)).replace(/"/g,"&quot;")}function F(n,r,t){return new Promise(c=>{const e=h,a=new Image;a[e(232)]=e(184),a.onload=()=>{const o=e;let x=a[o(264)]||a.width,i=a[o(123)]||a[o(208)];if(!x||!i){c(n);return}const u=Math[o(197)](r/x,t/i,1);x=Math[o(247)](1,Math[o(222)](x*u)),i=Math.max(1,Math[o(222)](i*u));try{const s=document[o(165)](o(136));s[o(213)]=x,s[o(208)]=i;const f=s[o(202)]("2d");if(!f){c(n);return}f.drawImage(a,0,0,x,i),c(s.toDataURL(o(251)))}catch{c(n)}},a[e(157)]=()=>c(n),a[e(219)]=n})}async function R(n){const r=l,t=[];n.querySelectorAll(r(282))[r(256)](c=>{const e=r,a=c;let o=a[e(234)](e(219))||"";if(!o||(o[e(143)]("/")&&(o=""+window[e(156)].origin+o,a[e(261)](e(219),o)),o[e(143)]("blob:")||o[e(143)](e(144))))return;t[e(243)](F(o,2048,2048)[e(149)](u=>{const s=e;a[s(261)](s(219),u)}))}),await Promise[r(255)](t)}function W(n,r){const t=l,c=n.querySelectorAll("input, select, textarea"),e=r.querySelectorAll(t(280));c[t(256)]((a,o)=>{const x=t,i=e[o];if(!i)return;let u="";if(a instanceof HTMLSelectElement)u=a[x(192)][a.selectedIndex]?.[x(148)]??a[x(267)];else if(a instanceof HTMLInputElement&&a[x(268)]===x(175)){const f=a[x(147)],d=document[x(165)](x(130));d[x(250)]=i.className,d.setAttribute("style",i[x(234)](x(193))||""),d[x(193)][x(168)]=x(211),d.style.alignItems="center",d[x(193)][x(198)]=x(170),d[x(193)][x(190)]="1.5px solid #0f172a",d[x(193)][x(139)]=x(180),d[x(193)][x(215)]=x(f?126:201),d[x(193)][x(269)]=x(201),d.style.fontSize=x(187),d[x(193)][x(181)]=x(274),d[x(193)][x(252)]="1",d[x(193)][x(131)]="0",d[x(193)][x(158)]=x(200),d[x(173)]=f?"✓":"",i.parentNode?.[x(275)](d,i);return}else u=a[x(267)]||"";const s=document[x(165)](x(130));s[x(173)]=u,s[x(250)]=i.className,s[x(261)]("style",i[x(234)](x(193))||""),s.style[x(168)]=x(211),s[x(193)][x(276)]="center",s[x(193)][x(198)]=i.classList[x(230)](x(212))?"flex-start":"center",s[x(193)].width=x(166),s.style.height=x(166),i[x(203)]?.[x(275)](s,i)})}function z(){const n=l;let r="";for(const t of Array[n(228)](document[n(155)]))try{r+=Array.from(t[n(242)]).map(c=>c.cssText)[n(216)](`
`)+`
`}catch{}return r}async function C(n){const r=l,{elements:t,title:c=r(146),paperSize:e,orientation:a="portrait",pageMargin:o="0",extraCss:x=""}=n;if(!t[r(135)])return"";const i=z(),u=[];for(const s of t){const f=s[r(273)](!0);W(s,f),await R(f),u[r(243)](r(210)+f[r(209)]+r(128))}return r(270)+v(c)+r(196)+i+r(164)+A[e][a]+r(141)+o+r(214)+x+r(185)+u[r(216)](`
`)+r(199)}function w(){const n=["./vendor-pdf-libs-BVl_U1Kq.js","393JnMuPX","37144FkbTji","8.5in 11in",`
@page {
    size: `,"createElement","100%","contentDocument","display","close","center","console","373342UPpwmo","textContent","getWidth","checkbox","Skipping element with empty canvas image:","210mm 297mm","Print failed.","13in 8.5in","2px","fontWeight","1547iCMRXQ","getHeight","anonymous",`
</style>
</head>
<body>
`,"constructor","9px","13061862OUPRyi","write","border","fixed","options","style",".pdf","11in 8.5in",`</title>
<style>
`,"min","justifyContent",`
</body>
</html>`,"border-box","#ffffff","getContext","parentNode","85.6mm 53.98mm","info","bind","appendChild","height","outerHTML",'<div class="pdf-page">',"inline-flex","text-left","width",`;
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
`,"backgroundColor","join","position","308706jgVPMg","src","JPEG","return (function() ","round","addPage","replace","8.5in 13in","right","endsWith","from","focus","contains","image/jpeg","crossOrigin","letter","getAttribute","open","&amp;","iframe","pageSize","PNG","toDataURL","apply","cssRules","push","8234DkAeKQ","log","exportHtmlPdf","max","53.98mm 85.6mm","prototype","className","image/png","lineHeight","277716nnNNUE","data:image/","all","forEach","body","__proto__","removeChild","internal","setAttribute","save","warn","naturalWidth","print","data:,","value","type","color",`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`,"Direct download failed.","folio","cloneNode","900","replaceChild","alignItems","table","&gt;","Failed to access iframe document.","input, select, textarea","message","img","naturalHeight","bottom","Nothing to print.","#0f172a","&lt;","</div>","portrait","span","flexShrink","50OjXXWn","65dcUevS","offsetWidth","length","canvas","default","document","borderRadius","onload",`;
    margin: `,"297mm 210mm","startsWith","data:","toString","Document","checked","text","then","Nothing to export.","283050kRFXhb","filename","contentWindow","zIndex","styleSheets","location","onerror","boxSizing","exception"];return w=function(){return n},w()}async function H(n,r){const t=l;try{const c=(await k(async()=>{const p=h,{default:m}=await import(p(160))[p(149)](_=>_.h);return{default:m}},[],import.meta.url))[t(137)],{jsPDF:e}=await k(async()=>{const p=t,{jsPDF:m}=await import(p(160))[p(149)](_=>_.j);return{jsPDF:m}},[],import.meta.url),{elements:a,paperSize:o,orientation:x="portrait",filename:i}=n,u=r||n.onProgressChange;if(!a[t(135)])return{success:!1,error:t(150)};let s="a4";o==="cr80"?s=[53.98,85.6]:o==="letter"?s=t(233):o===t(272)&&(s=[215.9,330.2]);const f=new e({orientation:x,unit:"mm",format:s,compress:!0}),d=f[t(260)][t(238)][t(174)](),D=f[t(260)][t(238)][t(183)](),y=a[t(135)],P=y>1;for(let p=0;p<y;p++){p>0&&f[t(223)](s,x);const m=a[p],_=m[t(134)]||m.getBoundingClientRect().width||1,E=d/25.4*(P?160:250),M=Math.min(P?2:3,Math[t(247)](1.2,E/_)),I=await c(m,{scale:M,useCORS:!0,allowTaint:!0,backgroundColor:"#ffffff",logging:!1});let b=I.toDataURL(t(231),.9),S=t(220);if((!b||b===t(266)||!b[t(143)](t(254)))&&(b=I[t(240)](t(251)),S=t(239)),!b||b===t(266)||!b.startsWith(t(254))){console.warn(t(176),m);continue}f.addImage(b,S,0,0,d,D,void 0,"FAST"),u&&u(Math.round((p+1)/y*100)),await new Promise(j=>setTimeout(j,15))}return f[t(262)](""+(i[t(227)](t(194))?i:i+t(194))),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c[t(281)]:t(271)}}}async function O(n){const r=l,t=window.electronAPI;if(t?.[r(246)]){const c=await C(n);if(!c)return{success:!1,error:"Nothing to export."};const{paperSize:e,orientation:a=r(129)}=n,o=N[e][a];return t.exportHtmlPdf({html:c,defaultFilename:n[r(152)],paperSize:e,pageWidthPx:o[r(213)],pageHeightPx:o[r(208)],landscape:a==="landscape"})}else return H(n,n.onProgressChange)}async function U(n){const r=l,t=await C(n);return t?new Promise(c=>{const e=r;try{const a=document[e(165)](e(237));a[e(193)][e(217)]=e(191),a.style[e(226)]="0",a.style[e(124)]="0",a[e(193)][e(213)]="0",a[e(193)][e(208)]="0",a[e(193)][e(190)]="0",a[e(193)][e(154)]="-9999",document[e(257)][e(207)](a);const o=a[e(153)]?.[e(138)]||a[e(167)];if(!o){document[e(257)][e(259)](a),c({success:!1,error:e(279)});return}o[e(235)](),o[e(189)](t),o[e(169)](),a[e(140)]=()=>{setTimeout(()=>{const x=h;try{a[x(153)]?.[x(229)](),a[x(153)]?.[x(265)](),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i[x(281)]:x(178)})}finally{setTimeout(()=>{const i=x;document.body[i(230)](a)&&document[i(257)][i(259)](a)},5e3)}},500)}}catch(a){c({success:!1,error:a instanceof Error?a[e(281)]:e(178)})}}):{success:!1,error:r(125)}}export{O as e,U as p};
