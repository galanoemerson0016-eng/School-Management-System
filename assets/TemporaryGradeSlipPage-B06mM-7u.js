import{r as A,j as a,ch as s0,bB as c0,c3 as l0,cr as i0,cx as o0}from"./vendor-B2q0b3_D.js";import{b as d0,s as t0,n as y}from"./index-DhvBMqPP.js";import"./vendor-pdf-libs-DlVAQvBX.js";import"./vendor-firebase-DsFqUerD.js";import"./vendor-framer-motion-C4L_ULsZ.js";function G(e,w){return e=e-457,e0()[e]}(function(e,w){const b=G,u=e();for(;;)try{if(-parseInt(b(465))/1*(parseInt(b(603))/2)+-parseInt(b(526))/3+-parseInt(b(539))/4*(parseInt(b(644))/5)+parseInt(b(685))/6*(parseInt(b(531))/7)+parseInt(b(491))/8+parseInt(b(585))/9*(parseInt(b(566))/10)+parseInt(b(619))/11*(parseInt(b(601))/12)===w)break;u.push(u.shift())}catch{u.push(u.shift())}})(e0,360228);const $=(function(){let e=!0;return function(w,b){const u=e?function(){if(b){const j=b.apply(w,arguments);return b=null,j}}:function(){};return e=!1,u}})(),r0=$(void 0,function(){const e=G,w=function(){const S=G;let x;try{x=Function("return (function() "+S(606)+");")()}catch{x=window}return x},b=w(),u=b.console=b[e(597)]||{},j=[e(470),"warn",e(584),e(607),e(673),e(544),e(680)];for(let S=0;S<j[e(595)];S++){const x=$[e(543)][e(578)][e(559)]($),F=j[S],q=u[F]||x;x[e(608)]=$[e(559)]($),x[e(495)]=q[e(495)].bind(q),u[F]=x}});r0();function _0(){const e=G,{students:w,sections:b,subjects:u,schoolProfile:j,setCurrentView:S,gradingSheetRecords:x,activeSchoolYear:F}=d0(),[q,X]=A[e(618)](""),[k,R]=A[e(618)](e(629)),[U,Z]=A.useState(1),m=A[e(581)](()=>{const n=e;return[...b[n(528)](o=>o[n(473)]||o[n(555)])][n(519)]((o,c)=>{const s=n,l=(o[s(582)]||"")[s(494)](c[s(582)]||"",void 0,{numeric:!0});return l!==0?l:(o[s(475)]||"")[s(494)](c.section_name||"")})},[b]);A[e(563)](()=>{if(!q&&m.length>0){const n=setTimeout(()=>{const d=G;X(m[0][d(475)])},0);return()=>clearTimeout(n)}},[m,q]);const t=A[e(581)](()=>{const n=e;return q?w[n(528)](d=>d.student_section===q)[n(519)]((d,o)=>{const c=n;return d.gender!==o[c(488)]?d.gender===c(678)?-1:1:d[c(674)][c(494)](o[c(674)])}):[]},[w,q]),h=A[e(581)](()=>{const n=e;return b[n(599)](d=>d[n(475)]===q||d.id===q)},[b,q]),r=A[e(581)](()=>{const n=e;if(!h)return[];const d=parseInt(h[n(582)].replace(/\D/g,""))||0;let o=u[n(528)](c=>c[n(529)]===h.id&&c[n(640)]!=="none");return o.length===0&&(o=u[n(528)](c=>{const s=n,l=parseInt(c.grade_level?.[s(495)]()[s(642)](/\D/g,"")||"0");return!c[s(529)]&&l===d&&c[s(640)]!==s(681)})),t0(o,c=>c[n(634)])},[u,h]),_=()=>{window[e(567)]()},p={a4:{height:"297mm",width:"210mm",cssSize:"A4 portrait"},letter:{height:"279.4mm",width:e(639),cssSize:"letter portrait"},folio:{height:"330.2mm",width:e(639),cssSize:e(625)}};return a[e(497)](e(580),{className:"h-full bg-slate-50 flex flex-col overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible",children:[a[e(617)](e(664),{children:e(615)+p[k][e(611)]+`;
                    height: `+p[k][e(461)]+e(472)+p[k][e(670)]+e(614)}),a.jsxs("div",{className:"h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-100 shadow-sm print:hidden",children:[a[e(497)]("div",{className:e(486),children:[a[e(617)](e(537),{onClick:()=>S("school-forms"),className:e(600),children:a[e(617)](s0,{className:"w-5 h-5"})}),a.jsxs(e(580),{children:[a[e(617)]("h2",{className:e(507),children:e(659)}),a.jsx("p",{className:e(635),children:h?h[e(582)]+" - "+h[e(475)]:e(636)})]}),a[e(617)](e(580),{className:e(503)}),a[e(617)](e(580),{className:e(672),children:a.jsxs("select",{className:e(682),value:k,onChange:n=>R(n[e(669)][e(513)]),children:[a[e(617)](e(624),{value:e(629),children:e(457)}),a[e(617)](e(624),{value:"a4",children:"A4 Size (210 x 297mm)"}),a[e(617)](e(624),{value:e(545),children:e(485)})]})})]}),a[e(497)](e(580),{className:e(516),children:[a[e(497)]("div",{className:"flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200",children:[a[e(617)](e(537),{onClick:()=>Z(n=>Math[e(637)](.4,n-.1)),className:e(467),title:e(499),children:a[e(617)](c0,{className:e(651)})}),a[e(497)]("span",{className:e(550),children:[Math.round(U*100),"%"]}),a[e(617)](e(537),{onClick:()=>Z(n=>Math[e(524)](1.5,n+.1)),className:e(467),title:e(468),children:a[e(617)](l0,{className:e(651)})})]}),a[e(617)](e(580),{className:"h-8 w-px bg-slate-200"}),a[e(497)](e(537),{onClick:_,disabled:t[e(595)]===0,className:e(525),children:[a[e(617)](i0,{className:e(616)}),e(602)]})]})]}),a[e(617)](e(580),{className:e(518),children:t.length>0?a[e(617)]("div",{className:"print-preview-container print:w-full flex flex-col items-center transition-all duration-300 ease-out origin-top print:scale-100",style:{transform:"scale("+U+")"},children:a[e(617)](e(580),{className:e(666),children:Array[e(464)]({length:Math[e(676)](t[e(595)]/4)})[e(463)]((n,d)=>a[e(497)](e(580),{className:"print-page relative",children:[a[e(497)](e(580),{className:"absolute -top-6 right-0 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden",children:[e(536),d+1,e(631),Math.ceil(t[e(595)]/4)]}),a[e(617)](e(580),{className:e(683)}),t.slice(d*4,(d+1)*4).map(o=>{const c=e,s=parseInt(h?.section_grade_level?.replace(/\D/g,"")||"0");return s===11||s===12?a[c(617)](m0,{student:o,schoolProfile:j,section:h,subjects:r,records:x,activeSchoolYear:F},o[c(462)]):a.jsx(f0,{student:o,schoolProfile:j,section:h,subjects:r,records:x,activeSchoolYear:F},o[c(462)])})]},d))})}):a.jsxs(e(580),{className:e(547),children:[a[e(617)](e(580),{className:"w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mb-6",children:a[e(617)](o0,{className:"w-10 h-10 text-slate-400"})}),a[e(617)]("h3",{className:e(469),children:e(458)}),a[e(617)]("p",{className:e(500),children:e(533)})]})})]})}function e0(){const e=["music","Letter (8.5 x 11in)","No Advisory Class Set","health","black","height","lrn","map","from","2UhzsfE","school-logo.png","w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm","Zoom In","text-xl font-black text-slate-800 mb-2","log","_________________________",`;
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
                        size: `,"is_advisory","DepEd","section_name","remarks-col text-[6.5px] tracking-tighter uppercase","mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center","pl-3 font-normal","round","quarter","flex flex-[1.2]","Grade Slip","track","Name:","Folio / Long (8.5 x 13in)","flex items-center gap-6","final","gender","FINAL GRADE","Failed","260720zqTGWg","1px solid black","toLowerCase","localeCompare","toString","Section:","jsxs","subject-col ","Zoom Out","text-sm text-slate-500 font-medium leading-relaxed","kasaysayan at lipunang pilipino","italic pl-3","h-8 w-px bg-slate-200 mx-2","flex-1 border-b border-black font-bold pb-0.5 leading-none text-center","normal","flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5","text-sm font-black text-slate-900 uppercase tracking-tight","subject","toFixed","w-45 mx-auto text-center mt-2.5","effectivecommunication","text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none","value","w-10 text-[9px]","general mathematics","flex items-center gap-4","2px","flex-1 overflow-auto p-8 flex flex-col items-center bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible custom-scrollbar","sort","text-[8.2px] leading-tight","Prepared by:","push","deped_logo_left.png","min","h-11 px-6 rounded-xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2","924567eORYpb","remarks-col text-[6.5px] tracking-tighter uppercase font-bold","filter","section_id","type","7UTIowN","final_grade","Please set up your advisory grade level and section details in your Profile to generate temporary grade slips.","arts","pag-aaral ng kasaysayan at lipunang pilipino","Page ","button","adviser_name","48PJgkCe","flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ","Age:","img","constructor","table","folio","bold","flex-1 flex flex-col items-center justify-center text-center max-w-md","name","flex mb-0.5 items-baseline","text-xs font-bold text-slate-900 w-12 text-center tabular-nums","some","text-[8px] italic mt-0.5","genT3","subjectGrades","is_advisory_class","w-min mx-auto","trim","final-col","bind","remarks","q-col","w-11.25","useEffect","General Average","genT1","4943980HUdjKI","print","text-[8px] mb-1 w-full text-center","flex flex-1","uppercase text-[9px] font-normal tracking-wide mt-0.5","School","isComponent","middle_name","flex-1 border-b border-black font-bold leading-none pb-0.5 uppercase text-center","Grade Level:","#E5E7EB","flex-1 min-h-0 mb-1.5 px-1","prototype","header-","div","useMemo","section_grade_level","tbody","info","9PxMcZd","final-col leading-tight","subject-col","Core Subjects","Adviser","mabisang komunikasyon","school_year","uppercase text-[9px]","parent_ec_mk","w-10","length","parent","console","physical","find","p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600","10278228fmHPSP","Print Slips","124724fWEjCl","grade-table","w-10 shrink-0",'{}.constructor("return this")( )',"error","__proto__","SCHOOL YEAR: ","w-10 h-10 object-contain","width","REMARKS","flex items-center justify-between mb-1.5 px-1 shrink-0",`;
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
            `,`
                .print-page {
                    width: `,"w-4 h-4","jsx","useState","11rLKxyy","w-8","flex-1 border-b border-black font-bold leading-none text-center pb-0.5","font-bold","logo_url","option","8.5in 13in portrait","text-center font-bold leading-none","subject-col font-bold text-[10px] text-center pb-1 pt-1","span","letter","1.1"," of ","LEARNING AREAS","life and career skills","subject_name","text-[10px] font-black text-orange-600 uppercase tracking-widest","Student Resource Tool","max","includes","215.9mm","term","flex-1 border-b border-black font-bold pb-0.5 leading-none","replace","mabisangkomunikasyon","293055ftmSAf","q-col font-bold","TERM","w-15 shrink-0","remarks-col","age","10px","w-3.5 h-3.5","thead","subject_id","left","first_name","grade-slip-card font-serif text-[9px] relative text-black leading-tight","student_lrn","final-col font-bold","Temporary Grade Slip","general science","genAvg","text-[9px]","Passed","style","genRemarks","print:w-full flex flex-col items-center gap-8 print:gap-0","font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none","effective communication","target","cssSize","flex w-20","flex items-center gap-3","exception","last_name","uppercase","ceil","genT2","Male","2px 4px","trace","none","bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer","cut-cross","forEach","677796iPCrao"];return e0=function(){return e},e0()}function f0({student:e,schoolProfile:w,section:b,subjects:u,records:j,activeSchoolYear:S}){const x=G,F="./",q=w[x(623)]||"school-logo.png",X=F+"deped_logo_left.png",k=A[x(581)](()=>{const m=x,t={};let h=0,r=0;const _={t1:0,t2:0,t3:0},p={t1:0,t2:0,t3:0};u[m(684)](l=>{const g=m;let L="",B="",J="",O=0,H=0;for(let I=1;I<=3;I++){const V=j.find(C=>C[g(657)]===e[g(462)]&&C[g(653)]===l.id&&Number(C[g(480)])===I&&C[g(591)]===S);if(V&&V.final_grade&&Number(V[g(532)])>0){const C=Number(V[g(532)]);I===1&&(L=C[g(495)](),_.t1+=C,p.t1++),I===2&&(B=C[g(495)](),_.t2+=C,p.t2++),I===3&&(J=C[g(495)](),_.t3+=C,p.t3++),O+=C,H++}}let K="",x0="";if(H>0){const I=Math.round(O/H);K=I.toString(),h+=I,r++,x0=I>=75?"Passed":g(490)}t[l.id]={q1:L,q2:B,q3:J,final:K,remarks:x0}});const n=r>0?Math[m(479)](h/r).toString():"",d=n?Number(n)>=75?m(663):m(490):"",o=p.t1>0?Math[m(479)](_.t1/p.t1)[m(495)]():"",c=p.t2>0?Math[m(479)](_.t2/p.t2)[m(495)]():"",s=p.t3>0?Math[m(479)](_.t3/p.t3)[m(495)]():"";return{subjectGrades:t,genAvg:n,genRemarks:d,genT1:o,genT2:c,genT3:s}},[u,j,e.lrn,S]),R=(e[x(674)]+", "+e[x(655)]+" "+(e[x(573)]?e[x(573)][0]+".":"")).trim(),U=A[x(581)](()=>{const m=x;return R[m(595)]>35?"text-[7.5px] leading-tight":R.length>25?m(520):m(662)},[R]),Z=m=>{const t=x,h=m[t(595)];if(h===0)return{fontSize:"10px"};const r=y(m)[t(638)](t(686))||y(m)[t(638)](t(534))||y(m)[t(638)]("physical")||y(m)[t(638)](t(459)),_=r?158:170,p=.54,n=_/(h*p),d=Math[t(637)](7.5,Math[t(524)](10,n));return{fontSize:d.toFixed(2)+"px",lineHeight:d<8.5?"1":t(630)}};return a[x(497)](x(580),{className:x(656),children:[a[x(497)]("div",{className:x(613),children:[a[x(617)](x(542),{src:X,className:x(610),alt:"DepEd"}),a.jsxs("div",{className:x(626),children:[a.jsx("p",{className:x(592),children:w.name}),a[x(497)]("p",{className:"uppercase text-[9px] font-normal tracking-wide mt-0.5",children:[x(609),S]}),a[x(617)]("h3",{className:"text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none",children:x(482)})]}),a[x(617)](x(542),{src:q,className:x(610),alt:x(571)})]}),a.jsxs(x(580),{className:"mb-1.5 px-1 shrink-0 text-[9px]",children:[a[x(497)](x(580),{className:x(549),children:[a[x(617)](x(628),{className:"w-10 text-[9px]",children:x(484)}),a[x(617)](x(628),{className:x(540)+U,children:R})]}),a[x(497)]("div",{className:"flex gap-4 mb-0.5",children:[a[x(497)](x(580),{className:"flex flex-1",children:[a[x(617)]("span",{className:"w-10",children:"LRN:"}),a[x(617)]("span",{className:x(641),children:e.lrn})]}),a[x(497)](x(580),{className:x(671),children:[a[x(617)](x(628),{className:x(620),children:x(541)}),a[x(617)](x(628),{className:x(504),children:e[x(649)]||""})]})]}),a[x(497)](x(580),{className:"flex gap-4",children:[a[x(497)](x(580),{className:x(569),children:[a[x(617)](x(628),{className:"w-15",children:x(575)}),a[x(617)](x(628),{className:"flex-1 border-b border-black font-bold leading-none text-center pb-0.5",children:b?.[x(582)]?.[x(642)](/Grade/i,"")[x(557)]()||""})]}),a[x(497)](x(580),{className:x(569),children:[a[x(617)]("span",{className:x(562),children:"Section:"}),a[x(617)](x(628),{className:x(506),children:b?.section_name||""})]})]})]}),a[x(617)]("div",{className:x(577),children:a[x(497)](x(544),{className:x(604),children:[a[x(497)]("thead",{children:[a[x(497)]("tr",{children:[a[x(617)]("th",{rowSpan:2,className:x(587),children:x(632)}),a[x(617)]("th",{colSpan:3,children:x(646)}),a[x(617)]("th",{rowSpan:2,className:x(586),children:a[x(617)](x(580),{className:"w-min mx-auto",children:"FINAL GRADE"})}),a[x(617)]("th",{rowSpan:2,className:x(648),children:x(612)})]}),a.jsxs("tr",{children:[a.jsx("th",{className:x(561),children:"1"}),a[x(617)]("th",{className:x(561),children:"2"}),a[x(617)]("th",{className:"q-col",children:"3"})]})]}),a[x(497)]("tbody",{children:[u.map(m=>{const t=x,h=k[t(554)][m.id],r=y(m.subject_name)[t(638)](t(686))||y(m[t(634)])[t(638)](t(534))||y(m[t(634)])[t(638)](t(598))||y(m[t(634)]).includes("health");return a[t(497)]("tr",{children:[a.jsx("td",{className:t(498)+(r?t(502):""),style:Z(m.subject_name),children:m.subject_name}),a[t(617)]("td",{className:"q-col",children:h.q1||" "}),a[t(617)]("td",{className:t(561),children:h.q2||" "}),a[t(617)]("td",{className:t(561),children:h.q3||" "}),a[t(617)]("td",{className:t(558),children:h[t(487)]||" "}),a[t(617)]("td",{className:"remarks-col text-[6.5px] tracking-tighter uppercase",children:h[t(560)]||" "})]},m.id)}),a[x(617)]("tr",{style:{height:x(517)},children:a[x(617)]("td",{colSpan:6,style:{backgroundColor:x(460),height:"2px",padding:0,borderLeft:"1px solid black",borderRight:"1px solid black",borderTop:"1px solid black",borderBottom:x(492)}})}),a.jsxs("tr",{children:[a[x(617)]("td",{className:x(627),children:x(564)}),a[x(617)]("td",{className:x(645),children:k.genT1||" "}),a[x(617)]("td",{className:x(645),children:k[x(677)]||" "}),a[x(617)]("td",{className:"q-col font-bold",children:k[x(553)]||" "}),a[x(617)]("td",{className:x(658),children:k[x(661)]||" "}),a[x(617)]("td",{className:x(527),children:k[x(665)]||" "})]})]})]})}),a[x(497)](x(580),{className:x(477),children:[a[x(617)]("p",{className:x(568),children:"Prepared by:"}),a.jsxs(x(580),{className:x(510),children:[a[x(617)](x(580),{className:x(667),children:w[x(538)]||x(471)}),a.jsx("p",{className:x(552),children:x(589)})]})]})]})}function W(e,w){if(e===void 0||e==="all"||e===G(681)||e===null)return!1;const u=Number(e);return isNaN(u)?!1:u!==w}function m0({student:e,schoolProfile:w,section:b,subjects:u,records:j,activeSchoolYear:S}){const x=G,F="./",q=w[x(623)]||x(466),X=F+x(523),k=A[x(581)](()=>{const t=x,h={};u.forEach(N=>{const i=G;let f=0,E=0,T=0;for(let v=1;v<=3;v++){const M=j[i(599)](P=>P[i(657)]===e[i(462)]&&P[i(653)]===N.id&&Number(P[i(480)])===v&&P[i(591)]===S);if(M&&M.final_grade&&Number(M.final_grade)>0){const P=Number(M[i(532)]);v===1&&(f=P),v===2&&(E=P),v===3&&(T=P)}}const z=N[i(640)];let Y=0;if(z===1||Number(z)===1)Y=f;else if(z===2||Number(z)===2)Y=E;else if(z===3||Number(z)===3)Y=T;else{let v=0,M=0;f>0&&(v+=f,M++),E>0&&(v+=E,M++),T>0&&(v+=T,M++),Y=M>0?Math[i(479)](v/M):0}h[N.id]={q1:f,q2:E,q3:T,final:Y,term:z}});const r=u[t(528)](N=>{const i=t,f=N[i(634)].trim()[i(493)]();return[i(668),i(590),"general mathematics",i(660),i(633),"pag-aaral ng kasaysayan at lipunang pilipino","kasaysayan at lipunang pilipino"][i(551)](T=>f[i(638)](T))}),_=r[t(528)](N=>{const i=t,f=y(N[i(634)]);return f===i(511)||f===i(643)});let p=0,n=0,d=0,o=0,c;if(_[t(595)]>0){const N=_[t(599)](D=>y(D.subject_name)===t(511)),i=_[t(599)](D=>y(D[t(634)])==="mabisangkomunikasyon");N&&N[t(640)]?c=N.term:i&&i.term&&(c=i.term);const f=N?h[N.id]:null,E=i?h[i.id]:null,T=f?.q1||0,z=E?.q1||0;T>0&&z>0?p=Math[t(479)]((T+z)/2):T>0?p=T:z>0&&(p=z);const Y=f?.q2||0,v=E?.q2||0;Y>0&&v>0?n=Math.round((Y+v)/2):Y>0?n=Y:v>0&&(n=v);const M=f?.q3||0,P=E?.q3||0;if(M>0&&P>0?d=Math[t(479)]((M+P)/2):M>0?d=M:P>0&&(d=P),c===1||Number(c)===1)o=p;else if(c===2||Number(c)===2)o=n;else if(c===3||Number(c)===3)o=d;else{let D=0,Q=0;p>0&&(D+=p,Q++),n>0&&(D+=n,Q++),d>0&&(D+=d,Q++),o=Q>0?Math[t(479)](D/Q):0}}const s={};s[t(593)]={q1:p>0?p[t(495)]():"",q2:n>0?n[t(495)]():"",q3:d>0?d[t(495)]():"",final:o>0?o.toString():"",remarks:o>0?o>=75?"Passed":"Failed":"",term:c},u[t(684)](N=>{const i=t,f=h[N.id];s[N.id]={q1:f.q1>0?f.q1[i(495)]():"",q2:f.q2>0?f.q2[i(495)]():"",q3:f.q3>0?f.q3[i(495)]():"",final:f[i(487)]>0?f[i(487)].toString():"",remarks:f[i(487)]>0?f[i(487)]>=75?"Passed":i(490):"",term:f[i(640)]}});let l=0,g=0,L=0,B=0,J=0,O=0,H=0,K=0;const x0=N=>{const i=t,f=u[i(599)](T=>T.id===N);if(!f)return!1;const E=y(f[i(634)]);return E==="effectivecommunication"||E===i(643)};u[t(684)](N=>{const i=t;if(x0(N.id))return;const f=h[N.id];f.q1>0&&!W(f[i(640)],1)&&(l+=f.q1,g++),f.q2>0&&!W(f[i(640)],2)&&(L+=f.q2,B++),f.q3>0&&!W(f[i(640)],3)&&(J+=f.q3,O++),f.final>0&&(H+=f.final,K++)}),_.length>0&&(p>0&&!W(c,1)&&(l+=p,g++),n>0&&!W(c,2)&&(L+=n,B++),d>0&&!W(c,3)&&(J+=d,O++),o>0&&(H+=o,K++));const I=g>0?Math[t(479)](l/g)[t(495)]():"",V=B>0?Math[t(479)](L/B).toString():"",C=O>0?Math[t(479)](J/O)[t(495)]():"",a0=K>0?Math[t(479)](H/K)[t(495)]():"",n0=a0?Number(a0)>=75?"Passed":t(490):"";return{subjectGrades:s,genAvg:a0,genRemarks:n0,genT1:I,genT2:V,genT3:C}},[u,j,e[x(462)],S]),R=(e[x(674)]+", "+e.first_name+" "+(e[x(573)]?e.middle_name[0]+".":"")).trim(),U=A[x(581)](()=>{const t=x;return R[t(595)]>35?"text-[7.5px] leading-tight":R[t(595)]>25?t(520):t(662)},[R]),Z=(t,h)=>{const r=x,_=t.length;if(_===0)return{fontSize:r(650)};const p=h?158:170,n=.54,d=p/(_*n),o=Math.max(7.5,Math[r(524)](10,d));return{fontSize:o[r(509)](2)+"px",lineHeight:o<8.5?"1":"1.1"}},m=A[x(581)](()=>{const t=x,h=[],r=[];u.forEach(s=>{const l=G,g=s[l(634)].trim().toLowerCase();[l(668),l(590),l(515),l(660),"life and career skills",l(535),l(501)][l(551)](B=>g[l(638)](B))?h.push(s):r[l(522)](s)});const _=h.filter(s=>{const l=G,g=y(s[l(634)]);return g===l(511)||g==="mabisangkomunikasyon"}),p=h.filter(s=>{const l=G,g=y(s[l(634)]);return g!=="effectivecommunication"&&g!==l(643)}),n=t0(p,s=>s[t(634)]),d=t0(r,s=>s[t(634)]),o=[],c=[];if(_[t(595)]>0){const s=_[t(599)](L=>y(L[t(634)])===t(511)),l=_[t(599)](L=>y(L.subject_name)===t(643)),g=s?.[t(640)]||l?.[t(640)];c[t(522)]({type:t(596),name:"Effective Communication & Mabisang Komunikasyon",id:"parent_ec_mk",term:g}),s&&c[t(522)]({type:"subject",name:s.subject_name,id:s.id,isComponent:!0,term:s[t(640)]}),l&&c[t(522)]({type:t(508),name:l[t(634)],id:l.id,isComponent:!0,term:l[t(640)]})}return n[t(684)](s=>{const l=t;c[l(522)]({type:l(508),name:s[l(634)],id:s.id,term:s[l(640)]})}),c.length>0&&(o[t(522)]({type:"header",name:t(588)}),o[t(522)](...c)),d[t(595)]>0&&(o[t(522)]({type:"header",name:"Electives"}),d[t(684)](s=>{const l=t;o[l(522)]({type:l(508),name:s[l(634)],id:s.id,term:s.term})})),o},[u]);return a[x(497)](x(580),{className:x(656),children:[a.jsxs("div",{className:"flex items-center justify-between mb-1.5 px-1 shrink-0",children:[a[x(617)](x(542),{src:X,className:x(610),alt:x(474)}),a[x(497)](x(580),{className:x(626),children:[a[x(617)]("p",{className:x(592),children:w[x(548)]}),a[x(497)]("p",{className:x(570),children:[x(609),S]}),a[x(617)]("h3",{className:x(512),children:"Grade Slip"})]}),a.jsx(x(542),{src:q,className:x(610),alt:"School"})]}),a[x(497)](x(580),{className:"mb-1.5 px-1 shrink-0 text-[9px]",children:[a[x(497)]("div",{className:x(549),children:[a[x(617)](x(628),{className:x(514),children:x(484)}),a[x(617)]("span",{className:x(540)+U,children:R})]}),a.jsxs(x(580),{className:"flex gap-4 mb-0.5",children:[a[x(497)]("div",{className:x(569),children:[a.jsx(x(628),{className:x(594),children:"LRN:"}),a[x(617)](x(628),{className:x(641),children:e[x(462)]})]}),a.jsxs("div",{className:x(671),children:[a[x(617)](x(628),{className:x(620),children:x(541)}),a[x(617)](x(628),{className:x(504),children:e[x(649)]||""})]})]}),a.jsxs(x(580),{className:"flex gap-4",children:[a.jsxs(x(580),{className:"flex flex-1",children:[a[x(617)]("span",{className:x(647),children:x(575)}),a.jsx(x(628),{className:x(621),children:b?.[x(582)]?.[x(642)](/Grade/i,"")[x(557)]()||""})]}),a[x(497)]("div",{className:"flex flex-1",children:[a[x(617)](x(628),{className:x(605),children:x(496)}),a[x(617)](x(628),{className:x(506),children:b?.section_name||""})]}),a.jsxs(x(580),{className:x(481),children:[a[x(617)](x(628),{className:"w-10 shrink-0",children:"Track:"}),a[x(617)]("span",{className:x(574),children:e[x(483)]||""})]})]})]}),a[x(617)]("div",{className:"flex-1 min-h-0 mb-1.5 px-1",children:a[x(497)](x(544),{className:"grade-table",children:[a[x(497)](x(652),{children:[a[x(497)]("tr",{children:[a[x(617)]("th",{rowSpan:2,className:"subject-col",children:x(632)}),a[x(617)]("th",{colSpan:3,children:x(646)}),a[x(617)]("th",{rowSpan:2,className:"final-col leading-tight",children:a[x(617)]("div",{className:x(556),children:x(489)})}),a[x(617)]("th",{rowSpan:2,className:"remarks-col",children:x(612)})]}),a[x(497)]("tr",{children:[a[x(617)]("th",{className:x(561),children:"1"}),a[x(617)]("th",{className:"q-col",children:"2"}),a[x(617)]("th",{className:x(561),children:"3"})]})]}),a.jsxs(x(583),{children:[m[x(463)]((t,h)=>{const r=x;if(t[r(530)]==="header")return a[r(617)]("tr",{children:a[r(617)]("td",{colSpan:6,style:{backgroundColor:r(576),fontWeight:"bold",textAlign:r(654),padding:r(679),fontSize:"8px",textTransform:r(675)},children:t[r(548)]})},r(579)+h);const _=t[r(530)]==="parent",p=_?"parent_ec_mk":t.id,n=k.subjectGrades[p]||{q1:"",q2:"",q3:"",final:"",remarks:""},d=!_&&t[r(572)];return a[r(497)]("tr",{children:[a[r(617)]("td",{className:r(498)+r(d?478:622),style:{...Z(t[r(548)],d),fontWeight:r(d?505:546)},children:t[r(548)]}),[1,2,3][r(463)](o=>{const c=r;if(W(t[c(640)],o))return a.jsx("td",{className:c(561),style:{backgroundColor:"#E5E7EB"},children:" "},o);const l=o===1?n.q1:o===2?n.q2:n.q3;return a.jsx("td",{className:"q-col",children:l||" "},o)}),a[r(617)]("td",{className:r(558),children:n[r(487)]||" "}),a[r(617)]("td",{className:r(476),children:n[r(560)]||" "})]},p)}),a[x(617)]("tr",{style:{height:x(517)},children:a[x(617)]("td",{colSpan:6,style:{backgroundColor:x(460),height:x(517),padding:0,borderLeft:x(492),borderRight:x(492),borderTop:x(492),borderBottom:x(492)}})}),a[x(497)]("tr",{children:[a[x(617)]("td",{className:x(627),children:x(564)}),a[x(617)]("td",{className:x(645),children:k[x(565)]||" "}),a[x(617)]("td",{className:x(645),children:k.genT2||" "}),a[x(617)]("td",{className:x(645),children:k[x(553)]||" "}),a[x(617)]("td",{className:x(658),children:k[x(661)]||" "}),a[x(617)]("td",{className:x(527),children:k[x(665)]||" "})]})]})]})}),a[x(497)](x(580),{className:x(477),children:[a.jsx("p",{className:"text-[8px] mb-1 w-full text-center",children:x(521)}),a[x(497)]("div",{className:x(510),children:[a.jsx(x(580),{className:x(667),children:w[x(538)]||x(471)}),a[x(617)]("p",{className:x(552),children:x(589)})]})]})]})}export{_0 as TemporaryGradeSlipPage};
