import{r as E,j as a,ch as s0,bB as c0,c3 as l0,cr as i0,cx as d0}from"./vendor-B2q0b3_D.js";import{b as o0,s as t0,n as q}from"./index-PWYLcF-5.js";import"./vendor-pdf-libs-DlVAQvBX.js";import"./vendor-firebase-DsFqUerD.js";import"./vendor-framer-motion-C4L_ULsZ.js";(function(e,N){const b=D,u=e();for(;;)try{if(-parseInt(b(223))/1+-parseInt(b(301))/2*(parseInt(b(315))/3)+parseInt(b(422))/4+parseInt(b(202))/5*(parseInt(b(312))/6)+-parseInt(b(296))/7*(-parseInt(b(318))/8)+-parseInt(b(285))/9+parseInt(b(387))/10===N)break;u.push(u.shift())}catch{u.push(u.shift())}})(e0,943577);function e0(){const e=["297mm","find","font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none","subject_id","grade-table","w-3.5 h-3.5","table","flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5","flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ","jsx","w-min mx-auto","section_name","middle_name","flex-1 border-b border-black font-bold leading-none text-center pb-0.5","jsxs","7490428RYcnuP","remarks-col","final-col font-bold","Passed","Page ","absolute -top-6 right-0 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden","gender","some","h-8 w-px bg-slate-200 mx-2","term","info","text-center font-bold leading-none","last_name","ceil","return (function() ","5iYxJla","filter","print","physical","text-xs font-bold text-slate-900 w-12 text-center tabular-nums"," of ","toLowerCase","parent_ec_mk","Name:","1px solid black","final_grade","console",`;
                    padding: 0;
                    margin: 20px auto;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    grid-template-rows: repeat(2, 1fr);
                    gap: 0;
                    background: white;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    border-radius: 4px;
                    position: relative;
                }

                /* Crossline cut guides */
                .print-page::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    border-top: 1px dashed #999;
                    z-index: 5;
                }
                .print-page::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 0;
                    bottom: 0;
                    border-left: 1px dashed #999;
                    z-index: 5;
                }
                /* Small cross marks at intersection */
                .cut-cross {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 6;
                    width: 12px;
                    height: 12px;
                }
                .cut-cross::before, .cut-cross::after {
                    content: '';
                    position: absolute;
                    background: #999;
                }
                .cut-cross::before {
                    width: 12px;
                    height: 1px;
                    top: 50%;
                    left: 0;
                    transform: translateY(-50%);
                }
                .cut-cross::after {
                    width: 1px;
                    height: 12px;
                    left: 50%;
                    top: 0;
                    transform: translateX(-50%);
                }

                .grade-slip-card {
                    box-sizing: border-box;
                    padding: 4mm;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    height: 100%;
                    font-family: "Bookman Old Style", "Bookman", "Georgia", serif;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    background: white;
                }

                /* Standard table styles to match the layout precisely */
                .grade-table {
                    width: 100%;
                    height: 100%;
                    border-collapse: collapse;
                    font-size: 8.5px;
                    table-layout: fixed;
                }
                .grade-table th, .grade-table td {
                    border: 1px solid #000;
                    padding: 2px 3px;
                }
                .grade-table th {
                    font-weight: bold;
                    text-align: center;
                }
                .grade-table .subject-col {
                    width: 48%;
                    text-align: left;
                }
                .grade-table .q-col {
                    width: 9%;
                    text-align: center;
                }
                .grade-table .final-col {
                    width: 11%;
                    text-align: center;
                    font-weight: bold;
                }
                .grade-table .remarks-col {
                    width: 14%;
                    text-align: center;
                }

                @media print {
                    @page {
                        size: `,"black","text-[8px] mb-1 w-full text-center","school-logo.png","img","No Advisory Class Set","flex mb-0.5 items-baseline","subject_name","flex-1 flex flex-col items-center justify-center text-center max-w-md","856681tYVxvw","Electives","genT2","age","genRemarks","grade_level","constructor","Prepared by:","school_year","left","subject","print:w-full flex flex-col items-center gap-8 print:gap-0","lrn","name","replace","toFixed","error","text-[9px]","bind","Track:","pag-aaral ng kasaysayan at lipunang pilipino","student_lrn","logo_url","8px","remarks-col text-[6.5px] tracking-tighter uppercase","isComponent","uppercase","flex flex-1","length","__proto__","cut-cross","section_id","Grade Slip","section_grade_level","w-45 mx-auto text-center mt-2.5","Male","cssSize","print-preview-container print:w-full flex flex-col items-center transition-all duration-300 ease-out origin-top print:scale-100","A4 Size (210 x 297mm)",`
                .print-page {
                    width: `,"h-8 w-px bg-slate-200",`;
                        margin: 0;
                    }
                    html, body {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        overflow: visible !important;
                    }
                    .print-page {
                        width: 100vw !important;
                        height: 100vh !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        page-break-after: always;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .print-page:last-child {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }
                    .grade-slip-card {
                        box-shadow: none !important;
                        height: 100% !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-preview-container {
                        transform: none !important;
                        width: 100% !important;
                    }
                }
            `,"w-15 shrink-0","final-col leading-tight","button","LRN:","parent","from","10px","#E5E7EB","Please set up your advisory grade level and section details in your Profile to generate temporary grade slips.","text-[8.2px] leading-tight","pl-3 font-normal","effective communication","flex-1 border-b border-black font-bold leading-none pb-0.5 uppercase text-center","subject-col","italic pl-3","w-8","h-11 px-6 rounded-xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2","8.5in 13in portrait","School","w-10","14576463ZcjiKe","SCHOOL YEAR: ","_________________________","q-col font-bold",'{}.constructor("return this")( )',"warn","apply","Core Subjects","REMARKS","localeCompare","w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm","2510914IoVENe","genAvg","text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none","trim","flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200","3734KdvvGB","font-bold","w-15","w-4 h-4","text-[7.5px] leading-tight","mabisangkomunikasyon","A4 portrait","w-10 text-[9px]","Zoom Out","Grade Level:","type","5008782fAHiff","kasaysayan at lipunang pilipino","final-col","1719fwBlFs","flex items-center gap-3","div","8eKeGSQ","flex gap-4 mb-0.5","genT1","map","option","round","2px","h-full bg-slate-50 flex flex-col overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible","1.1","w-11.25","width","push","flex w-20","Folio / Long (8.5 x 13in)","header","q-col","scale(","subjectGrades","height","text-xl font-black text-slate-800 mb-2","general mathematics","subject-col ","Student Resource Tool","w-10 h-10 text-slate-400","mabisang komunikasyon","TERM","FINAL GRADE","w-10 h-10 object-contain","Temporary Grade Slip","useState","text-[10px] font-black text-orange-600 uppercase tracking-widest","remarks-col text-[6.5px] tracking-tighter uppercase font-bold","letter","music","flex-1 min-h-0 mb-1.5 px-1","target","w-5 h-5","flex-1 border-b border-black font-bold pb-0.5 leading-none","General Average","trace","style","subject-col font-bold text-[10px] text-center pb-1 pt-1","includes","Failed","mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center","uppercase text-[9px]","Print Slips","all","h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-100 shadow-sm print:hidden","Adviser","folio","flex flex-[1.2]","final","215.9mm","none","general science","effectivecommunication","deped_logo_left.png","flex gap-4","first_name","useMemo","text-sm text-slate-500 font-medium leading-relaxed","Age:","min","tbody","exception","flex-1 border-b border-black font-bold pb-0.5 leading-none text-center","DepEd","sort","14235500qskzhW","span","header-","toString","is_advisory_class","Section:","quarter","forEach","210mm","max","arts","remarks","LEARNING AREAS","279.4mm","genT3","w-10 shrink-0","mb-1.5 px-1 shrink-0 text-[9px]","text-[8px] italic mt-0.5","life and career skills","slice"];return e0=function(){return e},e0()}const $=(function(){let e=!0;return function(N,b){const u=e?function(){const k=D;if(b){const y=b[k(291)](N,arguments);return b=null,y}}:function(){};return e=!1,u}})(),r0=$(void 0,function(){const e=D;let N;try{N=Function(e(201)+e(289)+");")()}catch{N=window}const b=N[e(213)]=N[e(213)]||{},u=["log",e(290),e(432),e(239),e(383),e(413),e(357)];for(let k=0;k<u.length;k++){const y=$[e(229)].prototype[e(241)]($),x=u[k],Y=b[x]||y;y[e(252)]=$[e(241)]($),y[e(390)]=Y[e(390)][e(241)](Y),b[x]=y}});r0();function D(e,N){return e=e-199,e0()[e]}function _0(){const e=D,{students:N,sections:b,subjects:u,schoolProfile:k,setCurrentView:y,gradingSheetRecords:x,activeSchoolYear:Y}=o0(),[z,X]=E[e(347)](""),[v,R]=E[e(347)](e(350)),[W,Z]=E[e(347)](1),m=E[e(378)](()=>{const n=e;return[...b[n(203)](i=>i.is_advisory||i[n(391)])][n(386)]((i,r)=>{const d=n,s=(i[d(256)]||"").localeCompare(r[d(256)]||"",void 0,{numeric:!0});return s!==0?s:(i.section_name||"").localeCompare(r[d(418)]||"")})},[b]);E.useEffect(()=>{if(!z&&m[e(251)]>0){const o=setTimeout(()=>{X(m[0].section_name)},0);return()=>clearTimeout(o)}},[m,z]);const t=E[e(378)](()=>{const n=e;return z?N[n(203)](o=>o.student_section===z)[n(386)]((o,i)=>{const r=n;return o[r(428)]!==i[r(428)]?o.gender===r(258)?-1:1:o[r(199)][r(294)](i[r(199)])}):[]},[N,z]),h=E[e(378)](()=>{const n=e;return b[n(408)](o=>o[n(418)]===z||o.id===z)},[b,z]),l=E[e(378)](()=>{const n=e;if(!h)return[];const o=parseInt(h[n(256)][n(237)](/\D/g,""))||0;let i=u.filter(r=>r[n(254)]===h.id&&r[n(431)]!==n(372));return i[n(251)]===0&&(i=u.filter(r=>{const d=n,s=parseInt(r[d(228)]?.[d(390)]()[d(237)](/\D/g,"")||"0");return!r[d(254)]&&s===o&&r.term!==d(372)})),t0(i,r=>r.subject_name)},[u,h]),_=()=>{window[e(204)]()},p={a4:{height:e(407),width:e(395),cssSize:e(307)},letter:{height:e(400),width:e(371),cssSize:"letter portrait"},folio:{height:"330.2mm",width:e(371),cssSize:e(282)}};return a[e(421)](e(317),{className:e(325),children:[a[e(416)](e(358),{children:e(262)+p[v][e(328)]+`;
                    height: `+p[v][e(336)]+e(214)+p[v][e(259)]+e(264)}),a.jsxs(e(317),{className:e(366),children:[a[e(421)](e(317),{className:"flex items-center gap-6",children:[a[e(416)](e(267),{onClick:()=>y("school-forms"),className:"p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600",children:a[e(416)](s0,{className:e(354)})}),a[e(421)]("div",{children:[a[e(416)]("h2",{className:"text-sm font-black text-slate-900 uppercase tracking-tight",children:e(346)}),a[e(416)]("p",{className:e(348),children:h?h[e(256)]+" - "+h[e(418)]:e(340)})]}),a[e(416)](e(317),{className:e(430)}),a[e(416)](e(317),{className:e(316),children:a[e(421)]("select",{className:"bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer",value:v,onChange:n=>R(n[e(353)].value),children:[a[e(416)]("option",{value:e(350),children:"Letter (8.5 x 11in)"}),a[e(416)](e(322),{value:"a4",children:e(261)}),a[e(416)](e(322),{value:e(368),children:e(331)})]})})]}),a.jsxs(e(317),{className:"flex items-center gap-4",children:[a[e(421)]("div",{className:e(300),children:[a[e(416)](e(267),{onClick:()=>Z(n=>Math.max(.4,n-.1)),className:e(295),title:e(309),children:a[e(416)](c0,{className:e(412)})}),a[e(421)]("span",{className:e(206),children:[Math[e(323)](W*100),"%"]}),a[e(416)](e(267),{onClick:()=>Z(n=>Math.min(1.5,n+.1)),className:e(295),title:"Zoom In",children:a[e(416)](l0,{className:e(412)})})]}),a.jsx("div",{className:e(263)}),a[e(421)]("button",{onClick:_,disabled:t.length===0,className:e(281),children:[a[e(416)](i0,{className:e(304)}),e(364)]})]})]}),a[e(416)](e(317),{className:"flex-1 overflow-auto p-8 flex flex-col items-center bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible custom-scrollbar",children:t.length>0?a.jsx(e(317),{className:e(260),style:{transform:e(334)+W+")"},children:a[e(416)](e(317),{className:e(234),children:Array[e(270)]({length:Math[e(200)](t[e(251)]/4)}).map((n,o)=>a[e(421)](e(317),{className:"print-page relative",children:[a[e(421)](e(317),{className:e(427),children:[e(426),o+1,e(207),Math[e(200)](t[e(251)]/4)]}),a[e(416)](e(317),{className:e(253)}),t[e(406)](o*4,(o+1)*4)[e(321)](i=>{const r=e,d=parseInt(h?.[r(256)]?.[r(237)](/\D/g,"")||"0");return d===11||d===12?a[r(416)](m0,{student:i,schoolProfile:k,section:h,subjects:l,records:x,activeSchoolYear:Y},i[r(235)]):a[r(416)](f0,{student:i,schoolProfile:k,section:h,subjects:l,records:x,activeSchoolYear:Y},i[r(235)])})]},o))})}):a.jsxs(e(317),{className:e(222),children:[a[e(416)](e(317),{className:"w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mb-6",children:a[e(416)](d0,{className:e(341)})}),a[e(416)]("h3",{className:e(337),children:e(219)}),a[e(416)]("p",{className:e(379),children:e(273)})]})})]})}function f0({student:e,schoolProfile:N,section:b,subjects:u,records:k,activeSchoolYear:y}){const x=D,Y="./",z=N[x(245)]||x(217),X=Y+x(375),v=E[x(378)](()=>{const m=x,t={};let h=0,l=0;const _={t1:0,t2:0,t3:0},p={t1:0,t2:0,t3:0};u[m(394)](s=>{const g=m;let P="",B="",J="",K=0,O=0;for(let G=1;G<=3;G++){const Q=k.find(M=>M[g(244)]===e[g(235)]&&M[g(410)]===s.id&&Number(M.quarter)===G&&M[g(231)]===y);if(Q&&Q[g(212)]&&Number(Q[g(212)])>0){const M=Number(Q[g(212)]);G===1&&(P=M[g(390)](),_.t1+=M,p.t1++),G===2&&(B=M[g(390)](),_.t2+=M,p.t2++),G===3&&(J=M[g(390)](),_.t3+=M,p.t3++),K+=M,O++}}let H="",x0="";if(O>0){const G=Math[g(323)](K/O);H=G[g(390)](),h+=G,l++,x0=G>=75?g(425):g(361)}t[s.id]={q1:P,q2:B,q3:J,final:H,remarks:x0}});const n=l>0?Math[m(323)](h/l)[m(390)]():"",o=n?Number(n)>=75?m(425):m(361):"",i=p.t1>0?Math[m(323)](_.t1/p.t1)[m(390)]():"",r=p.t2>0?Math[m(323)](_.t2/p.t2)[m(390)]():"",d=p.t3>0?Math.round(_.t3/p.t3)[m(390)]():"";return{subjectGrades:t,genAvg:n,genRemarks:o,genT1:i,genT2:r,genT3:d}},[u,k,e.lrn,y]),R=(e.last_name+", "+e[x(377)]+" "+(e[x(419)]?e[x(419)][0]+".":""))[x(299)](),W=E[x(378)](()=>{const m=x;return R[m(251)]>35?m(305):R.length>25?m(274):"text-[9px]"},[R]),Z=m=>{const t=x,h=m.length;if(h===0)return{fontSize:"10px"};const l=q(m)[t(360)](t(351))||q(m).includes(t(397))||q(m)[t(360)](t(205))||q(m)[t(360)]("health"),_=l?158:170,p=.54,n=_/(h*p),o=Math[t(396)](7.5,Math[t(381)](10,n));return{fontSize:o[t(238)](2)+"px",lineHeight:o<8.5?"1":t(326)}};return a[x(421)]("div",{className:"grade-slip-card font-serif text-[9px] relative text-black leading-tight",children:[a[x(421)](x(317),{className:"flex items-center justify-between mb-1.5 px-1 shrink-0",children:[a[x(416)](x(218),{src:X,className:x(345),alt:x(385)}),a[x(421)](x(317),{className:x(433),children:[a[x(416)]("p",{className:x(363),children:N[x(236)]}),a[x(421)]("p",{className:"uppercase text-[9px] font-normal tracking-wide mt-0.5",children:[x(286),y]}),a[x(416)]("h3",{className:x(298),children:"Grade Slip"})]}),a.jsx(x(218),{src:z,className:x(345),alt:x(283)})]}),a[x(421)](x(317),{className:x(403),children:[a.jsxs(x(317),{className:x(220),children:[a[x(416)](x(388),{className:"w-10 text-[9px]",children:x(210)}),a[x(416)]("span",{className:x(415)+W,children:R})]}),a[x(421)](x(317),{className:x(319),children:[a[x(421)](x(317),{className:"flex flex-1",children:[a[x(416)](x(388),{className:x(284),children:x(268)}),a[x(416)](x(388),{className:x(355),children:e[x(235)]})]}),a[x(421)](x(317),{className:"flex w-20",children:[a[x(416)](x(388),{className:x(280),children:x(380)}),a[x(416)](x(388),{className:x(384),children:e[x(226)]||""})]})]}),a.jsxs(x(317),{className:x(376),children:[a[x(421)]("div",{className:"flex flex-1",children:[a[x(416)](x(388),{className:x(303),children:x(310)}),a.jsx(x(388),{className:x(420),children:b?.[x(256)]?.[x(237)](/Grade/i,"")[x(299)]()||""})]}),a[x(421)]("div",{className:"flex flex-1",children:[a.jsx(x(388),{className:x(327),children:x(392)}),a[x(416)](x(388),{className:x(414),children:b?.section_name||""})]})]})]}),a.jsx(x(317),{className:"flex-1 min-h-0 mb-1.5 px-1",children:a[x(421)]("table",{className:x(411),children:[a[x(421)]("thead",{children:[a.jsxs("tr",{children:[a[x(416)]("th",{rowSpan:2,className:x(278),children:x(399)}),a[x(416)]("th",{colSpan:3,children:x(343)}),a[x(416)]("th",{rowSpan:2,className:x(266),children:a[x(416)](x(317),{className:x(417),children:x(344)})}),a[x(416)]("th",{rowSpan:2,className:x(423),children:x(293)})]}),a.jsxs("tr",{children:[a[x(416)]("th",{className:"q-col",children:"1"}),a[x(416)]("th",{className:x(333),children:"2"}),a.jsx("th",{className:"q-col",children:"3"})]})]}),a.jsxs(x(382),{children:[u[x(321)](m=>{const t=x,h=v[t(335)][m.id],l=q(m[t(221)]).includes("music")||q(m[t(221)])[t(360)](t(397))||q(m.subject_name)[t(360)]("physical")||q(m.subject_name)[t(360)]("health");return a[t(421)]("tr",{children:[a[t(416)]("td",{className:t(339)+(l?t(279):""),style:Z(m[t(221)]),children:m[t(221)]}),a[t(416)]("td",{className:t(333),children:h.q1||" "}),a[t(416)]("td",{className:"q-col",children:h.q2||" "}),a.jsx("td",{className:t(333),children:h.q3||" "}),a.jsx("td",{className:t(314),children:h[t(370)]||" "}),a.jsx("td",{className:t(247),children:h[t(398)]||" "})]},m.id)}),a[x(416)]("tr",{style:{height:x(324)},children:a[x(416)]("td",{colSpan:6,style:{backgroundColor:x(215),height:x(324),padding:0,borderLeft:x(211),borderRight:x(211),borderTop:x(211),borderBottom:x(211)}})}),a[x(421)]("tr",{children:[a[x(416)]("td",{className:x(359),children:x(356)}),a[x(416)]("td",{className:"q-col font-bold",children:v.genT1||" "}),a[x(416)]("td",{className:x(288),children:v[x(225)]||" "}),a[x(416)]("td",{className:"q-col font-bold",children:v[x(401)]||" "}),a[x(416)]("td",{className:x(424),children:v[x(297)]||" "}),a[x(416)]("td",{className:x(349),children:v[x(227)]||" "})]})]})]})}),a.jsxs(x(317),{className:x(362),children:[a.jsx("p",{className:"text-[8px] mb-1 w-full text-center",children:x(230)}),a.jsxs(x(317),{className:x(257),children:[a[x(416)](x(317),{className:x(409),children:N.adviser_name||x(287)}),a[x(416)]("p",{className:"text-[8px] italic mt-0.5",children:x(367)})]})]})]})}function V(e,N){const b=D;if(e===void 0||e===b(365)||e===b(372)||e===null)return!1;const u=Number(e);return isNaN(u)?!1:u!==N}function m0({student:e,schoolProfile:N,section:b,subjects:u,records:k,activeSchoolYear:y}){const x=D,Y="./",z=N.logo_url||"school-logo.png",X=Y+x(375),v=E.useMemo(()=>{const t=x,h={};u.forEach(w=>{const c=D;let f=0,T=0,C=0;for(let j=1;j<=3;j++){const S=k[c(408)](A=>A.student_lrn===e[c(235)]&&A[c(410)]===w.id&&Number(A[c(393)])===j&&A[c(231)]===y);if(S&&S[c(212)]&&Number(S[c(212)])>0){const A=Number(S[c(212)]);j===1&&(f=A),j===2&&(T=A),j===3&&(C=A)}}const I=w[c(431)];let L=0;if(I===1||Number(I)===1)L=f;else if(I===2||Number(I)===2)L=T;else if(I===3||Number(I)===3)L=C;else{let j=0,S=0;f>0&&(j+=f,S++),T>0&&(j+=T,S++),C>0&&(j+=C,S++),L=S>0?Math[c(323)](j/S):0}h[w.id]={q1:f,q2:T,q3:C,final:L,term:I}});const l=u[t(203)](w=>{const c=t,f=w[c(221)].trim()[c(208)]();return[c(276),c(342),c(338),c(373),"life and career skills",c(243),"kasaysayan at lipunang pilipino"][c(429)](C=>f[c(360)](C))}),_=l[t(203)](w=>{const c=t,f=q(w[c(221)]);return f===c(374)||f==="mabisangkomunikasyon"});let p=0,n=0,o=0,i=0,r;if(_[t(251)]>0){const w=_[t(408)](F=>q(F[t(221)])===t(374)),c=_[t(408)](F=>q(F[t(221)])===t(306));w&&w.term?r=w[t(431)]:c&&c[t(431)]&&(r=c[t(431)]);const f=w?h[w.id]:null,T=c?h[c.id]:null,C=f?.q1||0,I=T?.q1||0;C>0&&I>0?p=Math[t(323)]((C+I)/2):C>0?p=C:I>0&&(p=I);const L=f?.q2||0,j=T?.q2||0;L>0&&j>0?n=Math[t(323)]((L+j)/2):L>0?n=L:j>0&&(n=j);const S=f?.q3||0,A=T?.q3||0;if(S>0&&A>0?o=Math[t(323)]((S+A)/2):S>0?o=S:A>0&&(o=A),r===1||Number(r)===1)i=p;else if(r===2||Number(r)===2)i=n;else if(r===3||Number(r)===3)i=o;else{let F=0,U=0;p>0&&(F+=p,U++),n>0&&(F+=n,U++),o>0&&(F+=o,U++),i=U>0?Math[t(323)](F/U):0}}const d={};d[t(209)]={q1:p>0?p[t(390)]():"",q2:n>0?n[t(390)]():"",q3:o>0?o[t(390)]():"",final:i>0?i.toString():"",remarks:i>0?i>=75?t(425):t(361):"",term:r},u.forEach(w=>{const c=t,f=h[w.id];d[w.id]={q1:f.q1>0?f.q1[c(390)]():"",q2:f.q2>0?f.q2.toString():"",q3:f.q3>0?f.q3[c(390)]():"",final:f[c(370)]>0?f[c(370)][c(390)]():"",remarks:f.final>0?f[c(370)]>=75?"Passed":c(361):"",term:f[c(431)]}});let s=0,g=0,P=0,B=0,J=0,K=0,O=0,H=0;const x0=w=>{const c=t,f=u.find(C=>C.id===w);if(!f)return!1;const T=q(f[c(221)]);return T===c(374)||T==="mabisangkomunikasyon"};u[t(394)](w=>{const c=t;if(x0(w.id))return;const f=h[w.id];f.q1>0&&!V(f[c(431)],1)&&(s+=f.q1,g++),f.q2>0&&!V(f[c(431)],2)&&(P+=f.q2,B++),f.q3>0&&!V(f[c(431)],3)&&(J+=f.q3,K++),f[c(370)]>0&&(O+=f[c(370)],H++)}),_[t(251)]>0&&(p>0&&!V(r,1)&&(s+=p,g++),n>0&&!V(r,2)&&(P+=n,B++),o>0&&!V(r,3)&&(J+=o,K++),i>0&&(O+=i,H++));const G=g>0?Math[t(323)](s/g)[t(390)]():"",Q=B>0?Math[t(323)](P/B)[t(390)]():"",M=K>0?Math[t(323)](J/K).toString():"",a0=H>0?Math.round(O/H)[t(390)]():"",n0=a0?Number(a0)>=75?t(425):t(361):"";return{subjectGrades:d,genAvg:a0,genRemarks:n0,genT1:G,genT2:Q,genT3:M}},[u,k,e[x(235)],y]),R=(e.last_name+", "+e.first_name+" "+(e[x(419)]?e[x(419)][0]+".":""))[x(299)](),W=E[x(378)](()=>{const t=x;return R[t(251)]>35?"text-[7.5px] leading-tight":R[t(251)]>25?t(274):t(240)},[R]),Z=(t,h)=>{const l=x,_=t.length;if(_===0)return{fontSize:l(271)};const p=h?158:170,n=.54,o=p/(_*n),i=Math[l(396)](7.5,Math.min(10,o));return{fontSize:i.toFixed(2)+"px",lineHeight:i<8.5?"1":l(326)}},m=E.useMemo(()=>{const t=x,h=[],l=[];u[t(394)](d=>{const s=t,g=d[s(221)][s(299)]()[s(208)]();["effective communication",s(342),s(338),s(373),s(405),s(243),s(313)][s(429)](B=>g[s(360)](B))?h[s(329)](d):l.push(d)});const _=h[t(203)](d=>{const s=t,g=q(d[s(221)]);return g==="effectivecommunication"||g===s(306)}),p=h[t(203)](d=>{const s=t,g=q(d.subject_name);return g!==s(374)&&g!==s(306)}),n=t0(p,d=>d[t(221)]),o=t0(l,d=>d.subject_name),i=[],r=[];if(_[t(251)]>0){const d=_[t(408)](P=>q(P[t(221)])==="effectivecommunication"),s=_.find(P=>q(P[t(221)])===t(306)),g=d?.term||s?.[t(431)];r[t(329)]({type:t(269),name:"Effective Communication & Mabisang Komunikasyon",id:t(209),term:g}),d&&r[t(329)]({type:t(233),name:d.subject_name,id:d.id,isComponent:!0,term:d.term}),s&&r[t(329)]({type:t(233),name:s[t(221)],id:s.id,isComponent:!0,term:s[t(431)]})}return n[t(394)](d=>{const s=t;r[s(329)]({type:s(233),name:d[s(221)],id:d.id,term:d.term})}),r[t(251)]>0&&(i[t(329)]({type:t(332),name:t(292)}),i[t(329)](...r)),o.length>0&&(i[t(329)]({type:"header",name:t(224)}),o[t(394)](d=>{const s=t;i[s(329)]({type:s(233),name:d[s(221)],id:d.id,term:d[s(431)]})})),i},[u]);return a[x(421)](x(317),{className:"grade-slip-card font-serif text-[9px] relative text-black leading-tight",children:[a.jsxs(x(317),{className:"flex items-center justify-between mb-1.5 px-1 shrink-0",children:[a[x(416)](x(218),{src:X,className:x(345),alt:x(385)}),a[x(421)](x(317),{className:x(433),children:[a[x(416)]("p",{className:x(363),children:N[x(236)]}),a[x(421)]("p",{className:"uppercase text-[9px] font-normal tracking-wide mt-0.5",children:[x(286),y]}),a[x(416)]("h3",{className:x(298),children:x(255)})]}),a[x(416)](x(218),{src:z,className:x(345),alt:x(283)})]}),a[x(421)](x(317),{className:"mb-1.5 px-1 shrink-0 text-[9px]",children:[a[x(421)]("div",{className:x(220),children:[a[x(416)](x(388),{className:x(308),children:x(210)}),a[x(416)](x(388),{className:x(415)+W,children:R})]}),a[x(421)](x(317),{className:x(319),children:[a[x(421)]("div",{className:x(250),children:[a.jsx(x(388),{className:x(284),children:x(268)}),a[x(416)](x(388),{className:x(355),children:e.lrn})]}),a[x(421)](x(317),{className:x(330),children:[a[x(416)]("span",{className:x(280),children:x(380)}),a[x(416)]("span",{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none text-center",children:e[x(226)]||""})]})]}),a[x(421)](x(317),{className:x(376),children:[a.jsxs(x(317),{className:"flex flex-1",children:[a.jsx(x(388),{className:x(265),children:x(310)}),a[x(416)]("span",{className:"flex-1 border-b border-black font-bold leading-none text-center pb-0.5",children:b?.[x(256)]?.[x(237)](/Grade/i,"")[x(299)]()||""})]}),a[x(421)](x(317),{className:x(250),children:[a.jsx("span",{className:x(402),children:x(392)}),a[x(416)](x(388),{className:x(414),children:b?.section_name||""})]}),a[x(421)](x(317),{className:x(369),children:[a[x(416)]("span",{className:"w-10 shrink-0",children:x(242)}),a.jsx(x(388),{className:x(277),children:e.track||""})]})]})]}),a[x(416)](x(317),{className:x(352),children:a[x(421)](x(413),{className:"grade-table",children:[a[x(421)]("thead",{children:[a[x(421)]("tr",{children:[a.jsx("th",{rowSpan:2,className:x(278),children:x(399)}),a[x(416)]("th",{colSpan:3,children:x(343)}),a.jsx("th",{rowSpan:2,className:x(266),children:a[x(416)](x(317),{className:"w-min mx-auto",children:x(344)})}),a[x(416)]("th",{rowSpan:2,className:x(423),children:x(293)})]}),a[x(421)]("tr",{children:[a[x(416)]("th",{className:"q-col",children:"1"}),a[x(416)]("th",{className:x(333),children:"2"}),a[x(416)]("th",{className:x(333),children:"3"})]})]}),a[x(421)]("tbody",{children:[m[x(321)]((t,h)=>{const l=x;if(t[l(311)]===l(332))return a[l(416)]("tr",{children:a[l(416)]("td",{colSpan:6,style:{backgroundColor:"#E5E7EB",fontWeight:"bold",textAlign:l(232),padding:"2px 4px",fontSize:l(246),textTransform:l(249)},children:t[l(236)]})},l(389)+h);const _=t[l(311)]===l(269),p=_?l(209):t.id,n=v[l(335)][p]||{q1:"",q2:"",q3:"",final:"",remarks:""},o=!_&&t[l(248)];return a[l(421)]("tr",{children:[a.jsx("td",{className:l(339)+l(o?275:302),style:{...Z(t[l(236)],o),fontWeight:o?"normal":"bold"},children:t[l(236)]}),[1,2,3][l(321)](i=>{const r=l;if(V(t[r(431)],i))return a[r(416)]("td",{className:r(333),style:{backgroundColor:r(272)},children:" "},i);const s=i===1?n.q1:i===2?n.q2:n.q3;return a[r(416)]("td",{className:"q-col",children:s||" "},i)}),a[l(416)]("td",{className:l(314),children:n[l(370)]||" "}),a[l(416)]("td",{className:"remarks-col text-[6.5px] tracking-tighter uppercase",children:n.remarks||" "})]},p)}),a[x(416)]("tr",{style:{height:x(324)},children:a[x(416)]("td",{colSpan:6,style:{backgroundColor:x(215),height:"2px",padding:0,borderLeft:x(211),borderRight:x(211),borderTop:"1px solid black",borderBottom:x(211)}})}),a[x(421)]("tr",{children:[a[x(416)]("td",{className:x(359),children:x(356)}),a[x(416)]("td",{className:"q-col font-bold",children:v[x(320)]||" "}),a[x(416)]("td",{className:x(288),children:v[x(225)]||" "}),a[x(416)]("td",{className:x(288),children:v[x(401)]||" "}),a[x(416)]("td",{className:x(424),children:v[x(297)]||" "}),a[x(416)]("td",{className:x(349),children:v[x(227)]||" "})]})]})]})}),a[x(421)](x(317),{className:x(362),children:[a.jsx("p",{className:x(216),children:x(230)}),a[x(421)]("div",{className:x(257),children:[a[x(416)](x(317),{className:x(409),children:N.adviser_name||x(287)}),a.jsx("p",{className:x(404),children:"Adviser"})]})]})]})}export{_0 as TemporaryGradeSlipPage};
