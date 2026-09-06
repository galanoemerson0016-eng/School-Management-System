import{_ as E}from"./vendor-pdf-libs-ChAEQR0D.js";const u=h;(function(a,n){const t=h,c=a();for(;;)try{if(-parseInt(t(179))/1+-parseInt(t(121))/2+-parseInt(t(175))/3*(-parseInt(t(174))/4)+parseInt(t(215))/5+-parseInt(t(133))/6*(-parseInt(t(128))/7)+parseInt(t(135))/8*(parseInt(t(178))/9)+-parseInt(t(206))/10*(parseInt(t(145))/11)===n)break;c.push(c.shift())}catch{c.push(c.shift())}})(y,986288);const g=(function(){let a=!0;return function(n,t){const c=a?function(){if(t){const r=t.apply(n,arguments);return t=null,r}}:function(){};return a=!1,c}})(),T=g(void 0,function(){const a=h,n=function(){const e=h;let o;try{o=Function(e(204)+e(201)+");")()}catch{o=window}return o},t=n(),c=t.console=t[a(250)]||{},r=[a(177),"warn","info",a(189),a(140),a(242),a(129)];for(let e=0;e<r.length;e++){const o=g[a(161)][a(139)].bind(g),x=r[e],i=c[x]||o;o[a(130)]=g[a(257)](g),o[a(216)]=i[a(216)][a(257)](i),c[x]=o}});T();const z={letter:{portrait:u(138),landscape:u(153)},a4:{portrait:"210mm 297mm",landscape:"297mm 210mm"},folio:{portrait:u(261),landscape:u(195)},cr80:{portrait:u(256),landscape:"85.6mm 53.98mm"}},W={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function j(a){const n=u;return a[n(235)](/&/g,n(185))[n(235)](/</g,"&lt;")[n(235)](/>/g,n(191))[n(235)](/"/g,n(123))}function v(a,n,t){return new Promise(c=>{const r=h,e=new Image;e[r(142)]="anonymous",e[r(127)]=()=>{const o=r;let x=e.naturalWidth||e[o(248)],i=e[o(198)]||e[o(160)];if(!x||!i){c(a);return}const l=Math[o(252)](n/x,t/i,1);x=Math.max(1,Math.round(x*l)),i=Math[o(182)](1,Math.round(i*l));try{const s=document.createElement(o(176));s[o(248)]=x,s[o(160)]=i;const f=s.getContext("2d");if(!f){c(a);return}f[o(232)](e,0,0,x,i),c(s[o(122)]("image/png"))}catch{c(a)}},e[r(152)]=()=>c(a),e.src=a})}function h(a,n){return a=a-120,y()[a]}async function H(a){const n=u,t=[];a[n(144)]("img").forEach(c=>{const r=n,e=c;let o=e[r(194)](r(188))||"";if(!o||(o[r(150)]("/")&&(o=""+window.location[r(137)]+o,e[r(199)]("src",o)),o[r(150)]("blob:")||o.startsWith(r(239))))return;t[r(192)](v(o,2048,2048).then(l=>{e.setAttribute("src",l)}))}),await Promise.all(t)}function N(a,n){const t=u,c=a[t(144)](t(162)),r=n[t(144)](t(162));c[t(221)]((e,o)=>{const x=t,i=r[o];if(!i)return;let l="";if(e instanceof HTMLSelectElement)l=e[x(186)][e[x(220)]]?.[x(246)]??e[x(141)];else if(e instanceof HTMLInputElement&&e[x(237)]===x(180)){const f=e.checked,d=document[x(219)]("span");d[x(132)]=i.className,d[x(199)](x(260),i.getAttribute(x(260))||""),d[x(260)][x(227)]=x(249),d[x(260)].alignItems="center",d.style[x(211)]=x(241),d[x(260)][x(169)]="1.5px solid #0f172a",d[x(260)][x(163)]="2px",d.style[x(190)]=f?"#0f172a":x(187),d[x(260)][x(217)]=x(187),d[x(260)][x(165)]=x(268),d[x(260)][x(244)]=x(265),d[x(260)][x(170)]="1",d[x(260)][x(205)]="0",d[x(260)][x(226)]=x(228),d[x(214)]=f?"✓":"",i[x(171)]?.[x(212)](d,i);return}else l=e[x(141)]||"";const s=document[x(219)](x(231));s.textContent=l,s[x(132)]=i[x(132)],s.setAttribute(x(260),i[x(194)]("style")||""),s.style.display=x(249),s[x(260)][x(258)]=x(241),s[x(260)][x(211)]=i[x(200)].contains("text-left")?"flex-start":x(241),s.style[x(248)]="100%",s[x(260)][x(160)]="100%",i.parentNode?.replaceChild(s,i)})}function L(){const a=u;let n="";for(const t of Array.from(document[a(147)]))try{n+=Array[a(223)](t[a(126)]).map(c=>c[a(207)])[a(229)](`
`)+`
`}catch{}return n}async function S(a){const n=u,{elements:t,title:c="Document",paperSize:r,orientation:e=n(172),pageMargin:o="0",extraCss:x=""}=a;if(!t[n(196)])return"";const i=L(),l=[];for(const s of t){const f=s[n(159)](!0);N(s,f),await H(f),l[n(192)](n(264)+f[n(230)]+"</div>")}return n(263)+j(c)+n(208)+i+`
@page {
    size: `+z[r][e]+n(151)+o+n(146)+x+n(247)+l[n(229)](`
`)+n(203)}async function F(a,n){const t=u;try{const c=(await E(async()=>{const p=h,{default:m}=await import(p(197))[p(143)](_=>_.h);return{default:m}},[],import.meta.url))[t(202)],{jsPDF:r}=await E(async()=>{const p=t,{jsPDF:m}=await import(p(197))[p(143)](_=>_.j);return{jsPDF:m}},[],import.meta.url),{elements:e,paperSize:o,orientation:x=t(172),filename:i}=a,l=n||a.onProgressChange;if(!e[t(196)])return{success:!1,error:"Nothing to export."};let s="a4";o===t(124)?s=[53.98,85.6]:o===t(156)?s="letter":o===t(167)&&(s=[215.9,330.2]);const f=new r({orientation:x,unit:"mm",format:s,compress:!0}),d=f[t(209)][t(210)][t(259)](),k=f[t(209)][t(210)][t(255)](),w=e[t(196)],I=w>1;for(let p=0;p<w;p++){p>0&&f[t(183)](s,x);const m=e[p],_=m[t(134)]||m[t(154)]()[t(248)]||1,D=d/25.4*(I?160:250),M=Math[t(252)](I?2:3,Math[t(182)](1.2,D/_)),P=await c(m,{scale:M,useCORS:!0,allowTaint:!0,backgroundColor:t(187),logging:!1});let b=P[t(122)](t(251),.9),C=t(234);if((!b||b===t(157)||!b[t(150)]("data:image/"))&&(b=P.toDataURL("image/png"),C=t(233)),!b||b==="data:,"||!b[t(150)](t(148))){console[t(267)](t(238),m);continue}f[t(131)](b,C,0,0,d,k,void 0,t(253)),l&&l(Math[t(149)]((p+1)/w*100)),await new Promise(A=>setTimeout(A,15))}return f[t(168)](""+(i[t(240)](t(181))?i:i+t(181))),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c[t(155)]:t(236)}}}function y(){const a=["8.5in 13in","landscape",`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`,'<div class="pdf-page">',"900","contentWindow","warn","9px","body","2157156vLBhJz","toDataURL","&quot;","cr80","zIndex","cssRules","onload","5908gfkOkZ","trace","__proto__","addImage","className","8886UguscC","offsetWidth","7131272mNstLb","onProgressChange","origin","8.5in 11in","prototype","exception","value","crossOrigin","then","querySelectorAll","913TxLgQf",`;
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
`,"styleSheets","data:image/","round","startsWith",`;
    margin: `,"onerror","11in 8.5in","getBoundingClientRect","message","letter","data:,","print","cloneNode","height","constructor","input, select, textarea","borderRadius","position","fontSize","filename","folio","save","border","lineHeight","parentNode","portrait","exportHtmlPdf","2072AHVHVr","4593wVMaHX","canvas","log","18NMaAgy","382397cMIGPW","checkbox",".pdf","max","addPage","fixed","&amp;","options","#ffffff","src","error","backgroundColor","&gt;","push","Nothing to export.","getAttribute","13in 8.5in","length","./vendor-pdf-libs-ChAEQR0D.js","naturalHeight","setAttribute","classList",'{}.constructor("return this")( )',"default",`
</body>
</html>`,"return (function() ","flexShrink","242510tJRJbb","cssText",`</title>
<style>
`,"internal","pageSize","justifyContent","replaceChild","Print failed.","textContent","3171280mBzWym","toString","color","removeChild","createElement","selectedIndex","forEach","electronAPI","from","Nothing to print.","contentDocument","boxSizing","display","border-box","join","outerHTML","span","drawImage","PNG","JPEG","replace","Direct download failed.","type","Skipping element with empty canvas image:","data:","endsWith","center","table","document","fontWeight","-9999","text",`
</style>
</head>
<body>
`,"width","inline-flex","console","image/jpeg","min","FAST","focus","getHeight","53.98mm 85.6mm","bind","alignItems","getWidth","style"];return y=function(){return a},y()}async function O(a){const n=u,t=window[n(222)];if(t?.[n(173)]){const c=await S(a);if(!c)return{success:!1,error:n(193)};const{paperSize:r,orientation:e=n(172)}=a,o=W[r][e];return t[n(173)]({html:c,defaultFilename:a[n(166)],paperSize:r,pageWidthPx:o.width,pageHeightPx:o[n(160)],landscape:e===n(262)})}else return F(a,a[n(136)])}async function V(a){const n=u,t=await S(a);return t?new Promise(c=>{const r=n;try{const e=document.createElement("iframe");e[r(260)][r(164)]=r(184),e[r(260)].right="0",e.style.bottom="0",e[r(260)][r(248)]="0",e.style[r(160)]="0",e.style[r(169)]="0",e[r(260)][r(125)]=r(245),document.body.appendChild(e);const o=e[r(266)]?.[r(243)]||e[r(225)];if(!o){document.body[r(218)](e),c({success:!1,error:"Failed to access iframe document."});return}o.open(),o.write(t),o.close(),e[r(127)]=()=>{setTimeout(()=>{const x=h;try{e[x(266)]?.[x(254)](),e[x(266)]?.[x(158)](),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i[x(155)]:x(213)})}finally{setTimeout(()=>{const i=x;document[i(120)].contains(e)&&document[i(120)][i(218)](e)},5e3)}},500)}}catch(e){c({success:!1,error:e instanceof Error?e[r(155)]:r(213)})}}):{success:!1,error:n(224)}}export{O as e,V as p};
