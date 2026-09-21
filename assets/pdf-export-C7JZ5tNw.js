const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./vendor-pdf-libs-Pk85F4pG.js","./vendor-CYWHR5QP.js"])))=>i.map(i=>d[i]);
import{_ as x}from"./vendor-pdf-libs-Pk85F4pG.js";const k={letter:{portrait:"8.5in 11in",landscape:"11in 8.5in"},a4:{portrait:"210mm 297mm",landscape:"297mm 210mm"},folio:{portrait:"8.5in 13in",landscape:"13in 8.5in"},cr80:{portrait:"53.98mm 85.6mm",landscape:"85.6mm 53.98mm"}},D={letter:{portrait:{width:816,height:1056},landscape:{width:1056,height:816}},a4:{portrait:{width:794,height:1123},landscape:{width:1123,height:794}},folio:{portrait:{width:816,height:1248},landscape:{width:1248,height:816}},cr80:{portrait:{width:204,height:324},landscape:{width:324,height:204}}};function A(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function E(n,c,o){return new Promise(e=>{const t=new Image;t.crossOrigin="anonymous",t.onload=()=>{let s=t.naturalWidth||t.width,r=t.naturalHeight||t.height;if(!s||!r){e(n);return}const l=Math.min(c/s,o/r,1);s=Math.max(1,Math.round(s*l)),r=Math.max(1,Math.round(r*l));try{const i=document.createElement("canvas");i.width=s,i.height=r;const d=i.getContext("2d");if(!d){e(n);return}d.drawImage(t,0,0,s,r),e(i.toDataURL("image/png"))}catch{e(n)}},t.onerror=()=>e(n),t.src=n})}async function I(n){const c=[];n.querySelectorAll("img").forEach(o=>{const e=o;let t=e.getAttribute("src")||"";if(!t||(t.startsWith("/")&&(t=`${window.location.origin}${t}`,e.setAttribute("src",t)),t.startsWith("blob:")||t.startsWith("data:")))return;c.push(E(t,2048,2048).then(l=>{e.setAttribute("src",l)}))}),await Promise.all(c)}function T(n,c){const o=n.querySelectorAll("input, select, textarea"),e=c.querySelectorAll("input, select, textarea");o.forEach((t,s)=>{const r=e[s];if(!r)return;let l="";if(t instanceof HTMLSelectElement)l=t.options[t.selectedIndex]?.text??t.value;else if(t instanceof HTMLInputElement&&t.type==="checkbox"){const d=t.checked,a=document.createElement("span");a.className=r.className,a.setAttribute("style",r.getAttribute("style")||""),a.style.display="inline-flex",a.style.alignItems="center",a.style.justifyContent="center",a.style.border="1.5px solid #0f172a",a.style.borderRadius="2px",a.style.backgroundColor=d?"#0f172a":"#ffffff",a.style.color="#ffffff",a.style.fontSize="9px",a.style.fontWeight="900",a.style.lineHeight="1",a.style.flexShrink="0",a.style.boxSizing="border-box",a.textContent=d?"✓":"",r.parentNode?.replaceChild(a,r);return}else l=t.value||"";const i=document.createElement("span");i.textContent=l,i.className=r.className,i.setAttribute("style",r.getAttribute("style")||""),i.style.display="inline-flex",i.style.alignItems="center",i.style.justifyContent=r.classList.contains("text-left")?"flex-start":"center",i.style.width="100%",i.style.height="100%",r.parentNode?.replaceChild(i,r)})}function H(){let n="";for(const c of Array.from(document.styleSheets))try{n+=Array.from(c.cssRules).map(o=>o.cssText).join(`
`)+`
`}catch{}return n}async function b(n){const{elements:c,title:o="Document",paperSize:e,orientation:t="portrait",pageMargin:s="0",extraCss:r=""}=n;if(!c.length)return"";const l=H(),i=[];for(const d of c){const a=d.cloneNode(!0);T(d,a),await I(a),i.push(`<div class="pdf-page">${a.outerHTML}</div>`)}return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${A(o)}</title>
<style>
${l}
@page {
    size: ${k[e][t]};
    margin: ${s};
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
${r}
</style>
</head>
<body>
${i.join(`
`)}
</body>
</html>`}async function j(n,c){try{const o=(await x(async()=>{const{default:m}=await import("./vendor-pdf-libs-Pk85F4pG.js").then(u=>u.h);return{default:m}},__vite__mapDeps([0,1]),import.meta.url)).default,{jsPDF:e}=await x(async()=>{const{jsPDF:m}=await import("./vendor-pdf-libs-Pk85F4pG.js").then(u=>u.j);return{jsPDF:m}},__vite__mapDeps([0,1]),import.meta.url),{elements:t,paperSize:s,orientation:r="portrait",filename:l}=n,i=c||n.onProgressChange;if(!t.length)return{success:!1,error:"Nothing to export."};let d="a4";s==="cr80"?d=[53.98,85.6]:s==="letter"?d="letter":s==="folio"&&(d=[215.9,330.2]);const a=new e({orientation:r,unit:"mm",format:d,compress:!0}),h=a.internal.pageSize.getWidth(),P=a.internal.pageSize.getHeight(),p=t.length,g=p>1;for(let m=0;m<p;m++){m>0&&a.addPage(d,r);const u=t[m],C=u.offsetWidth||u.getBoundingClientRect().width||1,_=h/25.4*(g?160:250),S=Math.min(g?2:3,Math.max(1.2,_/C)),y=await o(u,{scale:S,useCORS:!0,allowTaint:!0,backgroundColor:"#ffffff",logging:!1});let f=y.toDataURL("image/jpeg",.9),w="JPEG";if((!f||f==="data:,"||!f.startsWith("data:image/"))&&(f=y.toDataURL("image/png"),w="PNG"),!f||f==="data:,"||!f.startsWith("data:image/")){console.warn("Skipping element with empty canvas image:",u);continue}a.addImage(f,w,0,0,h,P,void 0,"FAST"),i&&i(Math.round((m+1)/p*100)),await new Promise(W=>setTimeout(W,15))}return a.save(`${l.endsWith(".pdf")?l:`${l}.pdf`}`),{success:!0}}catch(o){return{success:!1,error:o instanceof Error?o.message:"Direct download failed."}}}async function N(n){const c=window.electronAPI;if(c?.exportHtmlPdf){const o=await b(n);if(!o)return{success:!1,error:"Nothing to export."};const{paperSize:e,orientation:t="portrait"}=n,s=D[e][t];return c.exportHtmlPdf({html:o,defaultFilename:n.filename,paperSize:e,pageWidthPx:s.width,pageHeightPx:s.height,landscape:t==="landscape"})}else return j(n,n.onProgressChange)}async function v(n){const c=await b(n);return c?new Promise(o=>{try{const e=document.createElement("iframe");e.style.position="fixed",e.style.right="0",e.style.bottom="0",e.style.width="0",e.style.height="0",e.style.border="0",e.style.zIndex="-9999",document.body.appendChild(e);const t=e.contentWindow?.document||e.contentDocument;if(!t){document.body.removeChild(e),o({success:!1,error:"Failed to access iframe document."});return}t.open(),t.write(c),t.close(),e.onload=()=>{setTimeout(()=>{try{e.contentWindow?.focus(),e.contentWindow?.print(),o({success:!0})}catch(s){o({success:!1,error:s instanceof Error?s.message:"Print failed."})}finally{setTimeout(()=>{document.body.contains(e)&&document.body.removeChild(e)},5e3)}},500)}}catch(e){o({success:!1,error:e instanceof Error?e.message:"Print failed."})}}):{success:!1,error:"Nothing to print."}}export{N as e,v as p};
