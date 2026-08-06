import{_ as E}from"./vendor-pdf-libs-BVl_U1Kq.js";const u=_;(function(n,o){const t=_,r=n();for(;;)try{if(parseInt(t(340))/1*(-parseInt(t(234))/2)+parseInt(t(328))/3+-parseInt(t(213))/4*(-parseInt(t(345))/5)+-parseInt(t(289))/6+parseInt(t(202))/7+parseInt(t(309))/8*(parseInt(t(248))/9)+parseInt(t(337))/10===o)break;r.push(r.shift())}catch{r.push(r.shift())}})(w,243423);const b=(function(){let n=!0;return function(o,t){const r=n?function(){const e=_;if(t){const a=t[e(206)](o,arguments);return t=null,a}}:function(){};return n=!1,r}})(),M=b(void 0,function(){const n=_;let o;try{o=Function("return (function() "+n(230)+");")()}catch{o=window}const t=o[n(216)]=o[n(216)]||{},r=[n(351),n(249),"info",n(275),n(297),"table",n(282)];for(let e=0;e<r.length;e++){const a=b[n(260)].prototype[n(270)](b),i=r[e],x=t[i]||a;a.__proto__=b[n(270)](b),a[n(243)]=x.toString[n(270)](x),t[i]=a}});M();function _(n,o){return n=n-202,w()[n]}const v={letter:{portrait:u(265),landscape:u(304)},a4:{portrait:"210mm 297mm",landscape:u(221)},folio:{portrait:u(208),landscape:u(323)},cr80:{portrait:"53.98mm 85.6mm",landscape:u(350)}},z={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function A(n){const o=u;return n[o(334)](/&/g,"&amp;")[o(334)](/</g,"&lt;")[o(334)](/>/g,o(236)).replace(/"/g,"&quot;")}function F(n,o,t){return new Promise(r=>{const e=_,a=new Image;a.crossOrigin=e(302),a[e(215)]=()=>{const i=e;let x=a.naturalWidth||a[i(342)],c=a[i(227)]||a[i(219)];if(!x||!c){r(n);return}const l=Math.min(o/x,t/c,1);x=Math.max(1,Math[i(294)](x*l)),c=Math.max(1,Math[i(294)](c*l));try{const s=document.createElement(i(281));s.width=x,s[i(219)]=c;const d=s.getContext("2d");if(!d){r(n);return}d[i(277)](a,0,0,x,c),r(s.toDataURL("image/png"))}catch{r(n)}},a[e(246)]=()=>r(n),a[e(280)]=n})}async function H(n){const o=u,t=[];n[o(247)](o(259))[o(228)](r=>{const e=o,a=r;let i=a.getAttribute(e(280))||"";if(!i||(i[e(349)]("/")&&(i=""+window.location[e(293)]+i,a[e(253)](e(280),i)),i[e(349)](e(256))||i[e(349)](e(292))))return;t.push(F(i,2048,2048)[e(204)](l=>{const s=e;a[s(253)](s(280),l)}))}),await Promise[o(315)](t)}function N(n,o){const t=u,r=n[t(247)](t(318)),e=o[t(247)](t(318));r.forEach((a,i)=>{const x=t,c=e[i];if(!c)return;let l="";if(a instanceof HTMLSelectElement)l=a.options[a[x(229)]]?.text??a.value;else if(a instanceof HTMLInputElement&&a[x(224)]==="checkbox"){const d=a.checked,f=document[x(273)]("span");f.className=c[x(306)],f[x(253)]("style",c.getAttribute(x(261))||""),f[x(261)][x(331)]=x(218),f[x(261)].alignItems=x(222),f.style[x(346)]=x(222),f.style[x(276)]=x(207),f[x(261)][x(242)]=x(285),f.style[x(295)]=x(d?217:239),f[x(261)][x(314)]="#ffffff",f[x(261)][x(311)]=x(343),f[x(261)][x(322)]=x(286),f.style[x(262)]="1",f[x(261)][x(312)]="0",f[x(261)][x(301)]=x(241),f[x(283)]=d?"✓":"",c[x(226)]?.[x(238)](f,c);return}else l=a[x(329)]||"";const s=document[x(273)](x(300));s[x(283)]=l,s[x(306)]=c.className,s[x(253)](x(261),c[x(269)](x(261))||""),s[x(261)][x(331)]="inline-flex",s[x(261)][x(313)]=x(222),s[x(261)][x(346)]=c[x(211)][x(255)](x(210))?x(336):x(222),s[x(261)][x(342)]=x(317),s[x(261)].height=x(317),c[x(226)]?.[x(238)](s,c)})}function W(){const n=u;let o="";for(const t of Array[n(245)](document[n(251)]))try{o+=Array[n(245)](t[n(220)]).map(r=>r[n(316)])[n(244)](`
`)+`
`}catch{}return o}async function S(n){const o=u,{elements:t,title:r=o(266),paperSize:e,orientation:a=o(252),pageMargin:i="0",extraCss:x=""}=n;if(!t[o(288)])return"";const c=W(),l=[];for(const s of t){const d=s.cloneNode(!0);N(s,d),await H(d),l[o(205)](o(287)+d[o(325)]+o(225))}return o(271)+A(r)+o(327)+c+`
@page {
    size: `+v[e][a]+`;
    margin: `+i+o(267)+x+o(341)+l[o(244)](`
`)+o(274)}function w(){const n=["1755xroRuh","justifyContent","onProgressChange","./vendor-pdf-libs-BVl_U1Kq.js","startsWith","85.6mm 53.98mm","log","iframe","1281749BvUxaq","cr80","then","push","apply","1.5px solid #0f172a","8.5in 13in","getBoundingClientRect","text-left","classList","data:image/","1060CuZIHy","focus","onload","console","#0f172a","inline-flex","height","cssRules","297mm 210mm","center","save","type","</div>","parentNode","naturalHeight","forEach","selectedIndex",'{}.constructor("return this")( )',".pdf","message","contentDocument","802jzXjOq","exportHtmlPdf","&gt;","folio","replaceChild","#ffffff","offsetWidth","border-box","borderRadius","toString","join","from","onerror","querySelectorAll","9cOgTNO","warn","getWidth","styleSheets","portrait","setAttribute","appendChild","contains","blob:","endsWith","Nothing to export.","img","constructor","style","lineHeight","contentWindow","Direct download failed.","8.5in 11in","Document",`;
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
`,"PNG","getAttribute","bind",`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>`,"position","createElement",`
</body>
</html>`,"error","border","drawImage","max","Print failed.","src","canvas","trace","textContent","open","2px","900",'<div class="pdf-page">',"length","2696736nXPLYR","Failed to access iframe document.","removeChild","data:","origin","round","backgroundColor","Nothing to print.","exception","document","internal","span","boxSizing","anonymous","write","11in 8.5in","close","className","print","addImage","2778376IlphHf","-9999","fontSize","flexShrink","alignItems","color","all","cssText","100%","input, select, textarea","fixed","body","toDataURL","fontWeight","13in 8.5in","min","outerHTML","Skipping element with empty canvas image:",`</title>
<style>
`,"447954qgFuCe","value","letter","display","filename","bottom","replace","image/jpeg","flex-start","432490yQwPxi","landscape","pageSize","307wMpkNa",`
</style>
</head>
<body>
`,"width","9px","addPage"];return w=function(){return n},w()}async function R(n,o){const t=u;try{const r=(await E(async()=>{const p=_,{default:m}=await import(p(348))[p(204)](g=>g.h);return{default:m}},[],import.meta.url)).default,{jsPDF:e}=await E(async()=>{const p=_,{jsPDF:m}=await import(p(348))[p(204)](g=>g.j);return{jsPDF:m}},[],import.meta.url),{elements:a,paperSize:i,orientation:x=t(252),filename:c}=n,l=o||n.onProgressChange;if(!a[t(288)])return{success:!1,error:t(258)};let s="a4";i===t(203)?s=[53.98,85.6]:i===t(330)?s="letter":i===t(237)&&(s=[215.9,330.2]);const d=new e({orientation:x,unit:"mm",format:s,compress:!0}),f=d.internal[t(339)][t(250)](),k=d[t(299)][t(339)].getHeight(),y=a[t(288)],P=y>1;for(let p=0;p<y;p++){p>0&&d[t(344)](s,x);const m=a[p],g=m[t(240)]||m[t(209)]()[t(342)]||1,D=f/25.4*(P?160:250),T=Math[t(324)](P?2:3,Math[t(278)](1.2,D/g)),I=await r(m,{scale:T,useCORS:!0,allowTaint:!0,backgroundColor:"#ffffff",logging:!1});let h=I[t(321)](t(335),.9),C="JPEG";if((!h||h==="data:,"||!h[t(349)]("data:image/"))&&(h=I[t(321)]("image/png"),C=t(268)),!h||h==="data:,"||!h[t(349)](t(212))){console.warn(t(326),m);continue}d[t(308)](h,C,0,0,f,k,void 0,"FAST"),l&&l(Math[t(294)]((p+1)/y*100)),await new Promise(j=>setTimeout(j,15))}return d[t(223)](""+(c[t(257)](t(231))?c:c+t(231))),{success:!0}}catch(r){return{success:!1,error:r instanceof Error?r[t(232)]:t(264)}}}async function O(n){const o=u,t=window.electronAPI;if(t?.[o(235)]){const r=await S(n);if(!r)return{success:!1,error:o(258)};const{paperSize:e,orientation:a=o(252)}=n,i=z[e][a];return t[o(235)]({html:r,defaultFilename:n[o(332)],paperSize:e,pageWidthPx:i.width,pageHeightPx:i.height,landscape:a===o(338)})}else return R(n,n[o(347)])}async function q(n){const o=u,t=await S(n);return t?new Promise(r=>{const e=o;try{const a=document[e(273)](e(352));a[e(261)][e(272)]=e(319),a[e(261)].right="0",a[e(261)][e(333)]="0",a.style[e(342)]="0",a[e(261)][e(219)]="0",a[e(261)][e(276)]="0",a[e(261)].zIndex=e(310),document.body[e(254)](a);const i=a[e(263)]?.[e(298)]||a[e(233)];if(!i){document[e(320)][e(291)](a),r({success:!1,error:e(290)});return}i[e(284)](),i[e(303)](t),i[e(305)](),a[e(215)]=()=>{setTimeout(()=>{const x=_;try{a[x(263)]?.[x(214)](),a.contentWindow?.[x(307)](),r({success:!0})}catch(c){r({success:!1,error:c instanceof Error?c[x(232)]:x(279)})}finally{setTimeout(()=>{const c=x;document.body.contains(a)&&document[c(320)][c(291)](a)},5e3)}},500)}}catch(a){r({success:!1,error:a instanceof Error?a.message:"Print failed."})}}):{success:!1,error:o(296)}}export{O as e,q as p};
