import{_ as C}from"./vendor-pdf-libs-BVl_U1Kq.js";function h(a,o){return a=a-104,w()[a]}const u=h;(function(a,o){const t=h,c=a();for(;;)try{if(parseInt(t(128))/1*(-parseInt(t(232))/2)+-parseInt(t(208))/3+-parseInt(t(187))/4+parseInt(t(150))/5+-parseInt(t(114))/6+-parseInt(t(167))/7+parseInt(t(197))/8===o)break;c.push(c.shift())}catch{c.push(c.shift())}})(w,600760);const g=(function(){let a=!0;return function(o,t){const c=a?function(){if(t){const e=t.apply(o,arguments);return t=null,e}}:function(){};return a=!1,c}})(),M=g(void 0,function(){const a=h;let o;try{o=Function(a(126)+a(213)+");")()}catch{o=window}const t=o[a(192)]=o[a(192)]||{},c=[a(177),a(165),"info",a(207),a(109),a(215),a(140)];for(let e=0;e<c[a(120)];e++){const n=g[a(149)][a(153)].bind(g),r=c[e],x=t[r]||n;n[a(181)]=g[a(188)](g),n[a(182)]=x[a(182)].bind(x),t[r]=n}});M();const W={letter:{portrait:u(161),landscape:u(242)},a4:{portrait:"210mm 297mm",landscape:"297mm 210mm"},folio:{portrait:u(199),landscape:u(142)},cr80:{portrait:"53.98mm 85.6mm",landscape:u(135)}},v={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function z(a){const o=u;return a[o(156)](/&/g,o(174))[o(156)](/</g,"&lt;")[o(156)](/>/g,"&gt;")[o(156)](/"/g,"&quot;")}function A(a,o,t){return new Promise(c=>{const e=h,n=new Image;n.crossOrigin=e(193),n[e(127)]=()=>{const r=e;let x=n.naturalWidth||n[r(106)],i=n[r(134)]||n[r(233)];if(!x||!i){c(a);return}const f=Math[r(218)](o/x,t/i,1);x=Math.max(1,Math[r(147)](x*f)),i=Math[r(206)](1,Math[r(147)](i*f));try{const s=document.createElement("canvas");s.width=x,s[r(233)]=i;const l=s[r(240)]("2d");if(!l){c(a);return}l[r(117)](n,0,0,x,i),c(s[r(136)]("image/png"))}catch{c(a)}},n[e(224)]=()=>c(a),n[e(166)]=a})}async function H(a){const o=u,t=[];a[o(113)]("img")[o(148)](c=>{const e=o,n=c;let r=n[e(201)](e(166))||"";if(!r||(r.startsWith("/")&&(r=""+window[e(243)][e(185)]+r,n[e(180)](e(166),r)),r[e(111)]("blob:")||r[e(111)]("data:")))return;t[e(173)](A(r,2048,2048)[e(124)](f=>{const s=e;n[s(180)](s(166),f)}))}),await Promise[o(211)](t)}function N(a,o){const t=u,c=a.querySelectorAll(t(183)),e=o[t(113)](t(183));c[t(148)]((n,r)=>{const x=t,i=e[r];if(!i)return;let f="";if(n instanceof HTMLSelectElement)f=n[x(239)][n.selectedIndex]?.[x(249)]??n[x(209)];else if(n instanceof HTMLInputElement&&n[x(203)]===x(141)){const l=n[x(130)],d=document[x(121)](x(237));d.className=i[x(178)],d[x(180)](x(217),i[x(201)]("style")||""),d[x(217)][x(245)]=x(184),d[x(217)].alignItems=x(226),d[x(217)].justifyContent=x(226),d[x(217)][x(222)]=x(110),d.style[x(219)]=x(241),d[x(217)][x(196)]=x(l?145:176),d[x(217)][x(227)]=x(176),d[x(217)].fontSize=x(137),d.style[x(205)]=x(198),d[x(217)][x(160)]="1",d[x(217)].flexShrink="0",d[x(217)].boxSizing=x(107),d[x(163)]=l?"✓":"",i[x(244)]?.[x(212)](d,i);return}else f=n[x(209)]||"";const s=document[x(121)](x(237));s.textContent=f,s.className=i[x(178)],s[x(180)](x(217),i.getAttribute(x(217))||""),s[x(217)][x(245)]=x(184),s[x(217)][x(220)]=x(226),s[x(217)].justifyContent=i.classList[x(246)](x(158))?x(125):x(226),s[x(217)].width=x(119),s[x(217)].height=x(119),i[x(244)]?.[x(212)](s,i)})}function F(){const a=u;let o="";for(const t of Array[a(108)](document[a(179)]))try{o+=Array[a(108)](t[a(112)]).map(c=>c.cssText)[a(122)](`
`)+`
`}catch{}return o}async function E(a){const o=u,{elements:t,title:c=o(105),paperSize:e,orientation:n=o(175),pageMargin:r="0",extraCss:x=""}=a;if(!t[o(120)])return"";const i=F(),f=[];for(const s of t){const l=s[o(157)](!0);N(s,l),await H(l),f[o(173)]('<div class="pdf-page">'+l[o(194)]+"</div>")}return o(129)+z(c)+o(248)+i+`
@page {
    size: `+W[e][n]+o(169)+r+o(230)+x+`
</style>
</head>
<body>
`+f[o(122)](`
`)+o(146)}async function O(a,o){const t=u;try{const c=(await C(async()=>{const p=h,{default:m}=await import(p(225))[p(124)](_=>_.h);return{default:m}},[],import.meta.url))[t(154)],{jsPDF:e}=await C(async()=>{const p=t,{jsPDF:m}=await import(p(225))[p(124)](_=>_.j);return{jsPDF:m}},[],import.meta.url),{elements:n,paperSize:r,orientation:x="portrait",filename:i}=a,f=o||a[t(139)];if(!n.length)return{success:!1,error:"Nothing to export."};let s="a4";r===t(133)?s=[53.98,85.6]:r==="letter"?s=t(155):r===t(191)&&(s=[215.9,330.2]);const l=new e({orientation:x,unit:"mm",format:s,compress:!0}),d=l[t(152)][t(138)][t(171)](),D=l[t(152)][t(138)][t(190)](),y=n[t(120)],P=y>1;for(let p=0;p<y;p++){p>0&&l[t(116)](s,x);const m=n[p],_=m[t(210)]||m[t(221)]().width||1,T=d/25.4*(P?160:250),k=Math[t(218)](P?2:3,Math[t(206)](1.2,T/_)),I=await c(m,{scale:k,useCORS:!0,allowTaint:!0,backgroundColor:t(176),logging:!1});let b=I[t(136)](t(151),.9),S="JPEG";if((!b||b===t(123)||!b[t(111)](t(159)))&&(b=I[t(136)](t(231)),S="PNG"),!b||b===t(123)||!b.startsWith(t(159))){console[t(165)]("Skipping element with empty canvas image:",m);continue}l[t(144)](b,S,0,0,d,D,void 0,t(247)),f&&f(Math[t(147)]((p+1)/y*100)),await new Promise(j=>setTimeout(j,15))}return l[t(132)](""+(i[t(162)](t(235))?i:i+".pdf")),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c.message:"Direct download failed."}}}function w(){const a=["location","parentNode","display","contains","FAST",`</title>
<style>
`,"text","focus","Document","width","border-box","from","exception","1.5px solid #0f172a","startsWith","cssRules","querySelectorAll","3438798HWDaIC","write","addPage","drawImage","right","100%","length","createElement","join","data:,","then","flex-start","return (function() ","onload","787541iYZUKE",`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`,"checked","Nothing to export.","save","cr80","naturalHeight","85.6mm 53.98mm","toDataURL","9px","pageSize","onProgressChange","trace","checkbox","13in 8.5in","bottom","addImage","#0f172a",`
</body>
</html>`,"round","forEach","constructor","3657020TBbhbT","image/jpeg","internal","prototype","default","letter","replace","cloneNode","text-left","data:image/","lineHeight","8.5in 11in","endsWith","textContent","Failed to access iframe document.","warn","src","205184SSbHal","Nothing to print.",`;
    margin: `,"fixed","getWidth","landscape","push","&amp;","portrait","#ffffff","log","className","styleSheets","setAttribute","__proto__","toString","input, select, textarea","inline-flex","origin","document","4384016StcunT","bind","zIndex","getHeight","folio","console","anonymous","outerHTML","iframe","backgroundColor","25431952bZjIwz","900","8.5in 13in","body","getAttribute","message","type","position","fontWeight","max","error","2470944GtOdON","value","offsetWidth","all","replaceChild",'{}.constructor("return this")( )',"filename","table","contentDocument","style","min","borderRadius","alignItems","getBoundingClientRect","border","exportHtmlPdf","onerror","./vendor-pdf-libs-BVl_U1Kq.js","center","color","print","appendChild",`;
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
`,"image/png","2IcOGyE","height","electronAPI",".pdf","removeChild","span","contentWindow","options","getContext","2px","11in 8.5in"];return w=function(){return a},w()}async function R(a){const o=u,t=window[o(234)];if(t?.exportHtmlPdf){const c=await E(a);if(!c)return{success:!1,error:o(131)};const{paperSize:e,orientation:n=o(175)}=a,r=v[e][n];return t[o(223)]({html:c,defaultFilename:a[o(214)],paperSize:e,pageWidthPx:r[o(106)],pageHeightPx:r[o(233)],landscape:n===o(172)})}else return O(a,a[o(139)])}async function G(a){const o=u,t=await E(a);return t?new Promise(c=>{const e=o;try{const n=document[e(121)](e(195));n[e(217)][e(204)]=e(170),n.style[e(118)]="0",n[e(217)][e(143)]="0",n[e(217)][e(106)]="0",n[e(217)][e(233)]="0",n[e(217)][e(222)]="0",n[e(217)][e(189)]="-9999",document.body[e(229)](n);const r=n[e(238)]?.[e(186)]||n[e(216)];if(!r){document[e(200)][e(236)](n),c({success:!1,error:e(164)});return}r.open(),r[e(115)](t),r.close(),n[e(127)]=()=>{setTimeout(()=>{const x=h;try{n[x(238)]?.[x(104)](),n[x(238)]?.[x(228)](),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i[x(202)]:"Print failed."})}finally{setTimeout(()=>{document.body.contains(n)&&document.body.removeChild(n)},5e3)}},500)}}catch(n){c({success:!1,error:n instanceof Error?n[e(202)]:"Print failed."})}}):{success:!1,error:o(168)}}export{R as e,G as p};
