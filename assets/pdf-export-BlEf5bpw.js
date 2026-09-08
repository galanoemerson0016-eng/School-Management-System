import{_ as S}from"./vendor-pdf-libs-ik2UJVeL.js";const u=h;(function(n,r){const e=h,c=n();for(;;)try{if(-parseInt(e(131))/1+-parseInt(e(226))/2+parseInt(e(157))/3*(parseInt(e(169))/4)+-parseInt(e(231))/5*(parseInt(e(120))/6)+-parseInt(e(234))/7+parseInt(e(117))/8+parseInt(e(238))/9===r)break;c.push(c.shift())}catch{c.push(c.shift())}})(w,941745);const g=(function(){let n=!0;return function(r,e){const c=n?function(){const t=h;if(e){const a=e[t(212)](r,arguments);return e=null,a}}:function(){};return n=!1,c}})(),z=g(void 0,function(){const n=h;let r;try{r=Function(n(186)+n(137)+");")()}catch{r=window}const e=r[n(211)]=r[n(211)]||{},c=[n(168),n(139),"info",n(214),"exception",n(130),n(134)];for(let t=0;t<c[n(208)];t++){const a=g.constructor[n(126)][n(176)](g),o=c[t],x=e[o]||a;a[n(223)]=g[n(176)](g),a[n(203)]=x[n(203)].bind(x),e[o]=a}});function h(n,r){return n=n-109,w()[n]}z();const M={letter:{portrait:"8.5in 11in",landscape:u(154)},a4:{portrait:"210mm 297mm",landscape:u(141)},folio:{portrait:u(175),landscape:u(198)},cr80:{portrait:u(158),landscape:u(177)}},T={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function v(n){const r=u;return n[r(180)](/&/g,r(200))[r(180)](/</g,r(172))[r(180)](/>/g,r(183)).replace(/"/g,r(228))}function F(n,r,e){return new Promise(c=>{const t=h,a=new Image;a[t(153)]=t(161),a.onload=()=>{const o=t;let x=a[o(216)]||a.width,i=a[o(210)]||a[o(144)];if(!x||!i){c(n);return}const f=Math[o(110)](r/x,e/i,1);x=Math[o(204)](1,Math[o(225)](x*f)),i=Math.max(1,Math[o(225)](i*f));try{const s=document.createElement(o(235));s[o(160)]=x,s[o(144)]=i;const l=s.getContext("2d");if(!l){c(n);return}l[o(246)](a,0,0,x,i),c(s[o(112)](o(159)))}catch{c(n)}},a[t(181)]=()=>c(n),a[t(222)]=n})}async function N(n){const r=u,e=[];n[r(155)](r(229)).forEach(c=>{const t=r,a=c;let o=a.getAttribute(t(222))||"";if(!o||(o[t(124)]("/")&&(o=""+window[t(151)][t(195)]+o,a[t(114)]("src",o)),o[t(124)](t(174))||o[t(124)](t(206))))return;e.push(F(o,2048,2048).then(f=>{const s=t;a[s(114)](s(222),f)}))}),await Promise[r(109)](e)}function W(n,r){const e=u,c=n.querySelectorAll(e(241)),t=r[e(155)](e(241));c[e(219)]((a,o)=>{const x=e,i=t[o];if(!i)return;let f="";if(a instanceof HTMLSelectElement)f=a[x(136)][a.selectedIndex]?.text??a[x(138)];else if(a instanceof HTMLInputElement&&a[x(187)]===x(189)){const l=a[x(188)],d=document[x(164)]("span");d[x(166)]=i[x(166)],d.setAttribute(x(221),i[x(150)](x(221))||""),d[x(221)][x(245)]=x(242),d[x(221)][x(171)]=x(249),d.style.justifyContent=x(249),d[x(221)][x(196)]="1.5px solid #0f172a",d.style[x(182)]=x(162),d[x(221)].backgroundColor=x(l?199:240),d.style.color=x(240),d[x(221)][x(156)]="9px",d.style[x(194)]=x(132),d[x(221)][x(145)]="1",d[x(221)][x(121)]="0",d[x(221)].boxSizing=x(146),d[x(184)]=l?"✓":"",i.parentNode?.replaceChild(d,i);return}else f=a[x(138)]||"";const s=document.createElement(x(250));s[x(184)]=f,s.className=i[x(166)],s[x(114)](x(221),i[x(150)](x(221))||""),s.style[x(245)]=x(242),s[x(221)][x(171)]=x(249),s.style.justifyContent=i[x(127)][x(152)](x(224))?x(205):x(249),s[x(221)][x(160)]="100%",s.style[x(144)]=x(193),i[x(252)]?.[x(133)](s,i)})}function H(){const n=u;let r="";for(const e of Array.from(document.styleSheets))try{r+=Array[n(227)](e.cssRules)[n(201)](c=>c[n(163)])[n(129)](`
`)+`
`}catch{}return r}async function C(n){const r=u,{elements:e,title:c=r(197),paperSize:t,orientation:a="portrait",pageMargin:o="0",extraCss:x=""}=n;if(!e[r(208)])return"";const i=H(),f=[];for(const s of e){const l=s[r(236)](!0);W(s,l),await N(l),f.push(r(220)+l[r(173)]+r(178))}return r(247)+v(c)+r(142)+i+r(122)+M[t][a]+r(148)+o+`;
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
`+x+r(149)+f[r(129)](`
`)+r(248)}async function O(n,r){const e=u;try{const c=(await S(async()=>{const p=h,{default:m}=await import(p(215)).then(_=>_.h);return{default:m}},[],import.meta.url)).default,{jsPDF:t}=await S(async()=>{const p=h,{jsPDF:m}=await import(p(215)).then(_=>_.j);return{jsPDF:m}},[],import.meta.url),{elements:a,paperSize:o,orientation:x=e(179),filename:i}=n,f=r||n[e(125)];if(!a.length)return{success:!1,error:"Nothing to export."};let s="a4";o===e(232)?s=[53.98,85.6]:o==="letter"?s=e(207):o===e(113)&&(s=[215.9,330.2]);const l=new t({orientation:x,unit:"mm",format:s,compress:!0}),d=l[e(135)].pageSize.getWidth(),k=l[e(135)][e(111)].getHeight(),y=a[e(208)],P=y>1;for(let p=0;p<y;p++){p>0&&l.addPage(s,x);const m=a[p],_=m[e(165)]||m.getBoundingClientRect().width||1,D=d/25.4*(P?160:250),A=Math.min(P?2:3,Math[e(204)](1.2,D/_)),E=await c(m,{scale:A,useCORS:!0,allowTaint:!0,backgroundColor:e(240),logging:!1});let b=E[e(112)](e(147),.9),I=e(185);if((!b||b===e(190)||!b.startsWith(e(218)))&&(b=E.toDataURL("image/png"),I="PNG"),!b||b===e(190)||!b[e(124)](e(218))){console.warn(e(230),m);continue}l[e(116)](b,I,0,0,d,k,void 0,"FAST"),f&&f(Math[e(225)]((p+1)/y*100)),await new Promise(j=>setTimeout(j,15))}return l[e(143)](""+(i.endsWith(".pdf")?i:i+".pdf")),{success:!0}}catch(c){return{success:!1,error:c instanceof Error?c[e(170)]:e(191)}}}async function L(n){const r=u,e=window.electronAPI;if(e?.[r(233)]){const c=await C(n);if(!c)return{success:!1,error:r(213)};const{paperSize:t,orientation:a=r(179)}=n,o=T[t][a];return e[r(233)]({html:c,defaultFilename:n[r(167)],paperSize:t,pageWidthPx:o[r(160)],pageHeightPx:o[r(144)],landscape:a==="landscape"})}else return O(n,n.onProgressChange)}async function q(n){const r=u,e=await C(n);return e?new Promise(c=>{const t=r;try{const a=document[t(164)](t(119));a[t(221)][t(237)]=t(128),a[t(221)][t(243)]="0",a[t(221)][t(202)]="0",a[t(221)].width="0",a[t(221)][t(144)]="0",a[t(221)][t(196)]="0",a[t(221)][t(244)]="-9999",document[t(115)].appendChild(a);const o=a[t(253)]?.document||a[t(209)];if(!o){document[t(115)][t(192)](a),c({success:!1,error:"Failed to access iframe document."});return}o[t(251)](),o.write(e),o[t(217)](),a.onload=()=>{setTimeout(()=>{const x=h;try{a[x(253)]?.[x(239)](),a[x(253)]?.[x(118)](),c({success:!0})}catch(i){c({success:!1,error:i instanceof Error?i[x(170)]:x(123)})}finally{setTimeout(()=>{const i=x;document[i(115)][i(152)](a)&&document[i(115)].removeChild(a)},5e3)}},500)}}catch(a){c({success:!1,error:a instanceof Error?a[t(170)]:"Print failed."})}}):{success:!1,error:r(140)}}function w(){const n=["text-left","round","828022yaMgJx","from","&quot;","img","Skipping element with empty canvas image:","1510zvkkiP","cr80","exportHtmlPdf","11377415ieucAE","canvas","cloneNode","position","23691744gfQrlm","focus","#ffffff","input, select, textarea","inline-flex","right","zIndex","display","drawImage",`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`,`
</body>
</html>`,"center","span","open","parentNode","contentWindow","all","min","pageSize","toDataURL","folio","setAttribute","body","addImage","6523928aEuklF","print","iframe","26592yAuYNO","flexShrink",`
@page {
    size: `,"Print failed.","startsWith","onProgressChange","prototype","classList","fixed","join","table","255932rdzVAN","900","replaceChild","trace","internal","options",'{}.constructor("return this")( )',"value","warn","Nothing to print.","297mm 210mm",`</title>
<style>
`,"save","height","lineHeight","border-box","image/jpeg",`;
    margin: `,`
</style>
</head>
<body>
`,"getAttribute","location","contains","crossOrigin","11in 8.5in","querySelectorAll","fontSize","3FERjOr","53.98mm 85.6mm","image/png","width","anonymous","2px","cssText","createElement","offsetWidth","className","filename","log","4510360hcuOSa","message","alignItems","&lt;","outerHTML","blob:","8.5in 13in","bind","85.6mm 53.98mm","</div>","portrait","replace","onerror","borderRadius","&gt;","textContent","JPEG","return (function() ","type","checked","checkbox","data:,","Direct download failed.","removeChild","100%","fontWeight","origin","border","Document","13in 8.5in","#0f172a","&amp;","map","bottom","toString","max","flex-start","data:","letter","length","contentDocument","naturalHeight","console","apply","Nothing to export.","error","./vendor-pdf-libs-ik2UJVeL.js","naturalWidth","close","data:image/","forEach",'<div class="pdf-page">',"style","src","__proto__"];return w=function(){return n},w()}export{L as e,q as p};
