import{r as T,j as a,cd as c0,bC as s0,b_ as l0,co as i0,cu as d0}from"./vendor-jb77UrGI.js";import{b as o0,s as t0,n as S}from"./index-DqkD6-0J.js";import"./vendor-pdf-libs-DfncxlVz.js";import"./vendor-firebase-BnVoqbHU.js";import"./vendor-framer-motion-DCKYskn4.js";(function(e,N){const p=W,u=e();for(;;)try{if(parseInt(p(573))/1+-parseInt(p(625))/2*(-parseInt(p(487))/3)+-parseInt(p(559))/4*(-parseInt(p(461))/5)+parseInt(p(632))/6+-parseInt(p(494))/7+-parseInt(p(546))/8+parseInt(p(542))/9*(-parseInt(p(485))/10)===N)break;u.push(u.shift())}catch{u.push(u.shift())}})(e0,226915);const $=(function(){let e=!0;return function(N,p){const u=e?function(){const k=W;if(p){const j=p[k(567)](N,arguments);return p=null,j}}:function(){};return e=!1,u}})(),n0=$(void 0,function(){const e=W;let N;try{N=Function("return (function() "+e(544)+");")()}catch{N=window}const p=N[e(502)]=N.console||{},u=[e(438),e(593),e(609),e(595),"exception","table",e(471)];for(let k=0;k<u[e(576)];k++){const j=$[e(540)][e(423)][e(527)]($),x=u[k],O=p[x]||j;j[e(435)]=$[e(527)]($),j[e(631)]=O[e(631)][e(527)](O),p[x]=j}});function W(e,N){return e=e-397,e0()[e]}n0();function _0(){const e=W,{students:N,sections:p,subjects:u,schoolProfile:k,setCurrentView:j,gradingSheetRecords:x,activeSchoolYear:O}=o0(),[G,Q]=T[e(422)](""),[v,I]=T.useState(e(582)),[Z,J]=T[e(422)](1),h=T[e(558)](()=>{const r=e;return[...p.filter(d=>d.is_advisory||d[r(514)])].sort((d,n)=>{const s=r,l=(d[s(495)]||"")[s(448)](n[s(495)]||"",void 0,{numeric:!0});return l!==0?l:(d[s(520)]||"")[s(448)](n[s(520)]||"")})},[p]);T[e(498)](()=>{const r=e;if(!G&&h[r(576)]>0){const o=setTimeout(()=>{const d=r;Q(h[0][d(520)])},0);return()=>clearTimeout(o)}},[h,G]);const t=T[e(558)](()=>{const r=e;return G?N[r(404)](o=>o[r(415)]===G)[r(587)]((o,d)=>{const n=r;return o[n(491)]!==d.gender?o.gender===n(405)?-1:1:o[n(541)].localeCompare(d.last_name)}):[]},[N,G]),f=T.useMemo(()=>p[e(589)](o=>o.section_name===G||o.id===G),[p,G]),c=T.useMemo(()=>{const r=e;if(!f)return[];const o=parseInt(f.section_grade_level.replace(/\D/g,""))||0;let d=u.filter(n=>n[r(604)]===f.id&&n[r(583)]!=="none");return d[r(576)]===0&&(d=u[r(404)](n=>{const s=r,l=parseInt(n[s(481)]?.[s(631)]().replace(/\D/g,"")||"0");return!n[s(604)]&&l===o&&n[s(583)]!==s(420)})),t0(d,n=>n[r(616)])},[u,f]),_=()=>{window[e(419)]()},b={a4:{height:e(430),width:"210mm",cssSize:e(462)},letter:{height:"279.4mm",width:e(569),cssSize:e(529)},folio:{height:"330.2mm",width:e(569),cssSize:e(412)}};return a[e(403)](e(492),{className:"h-full bg-slate-50 flex flex-col overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible",children:[a.jsx(e(486),{children:e(627)+b[v].width+`;
                    height: `+b[v][e(521)]+e(554)+b[v][e(581)]+e(512)}),a.jsxs(e(492),{className:e(474),children:[a.jsxs(e(492),{className:"flex items-center gap-6",children:[a[e(468)](e(402),{onClick:()=>j(e(439)),className:e(524),children:a.jsx(c0,{className:"w-5 h-5"})}),a[e(403)](e(492),{children:[a[e(468)]("h2",{className:e(626),children:e(429)}),a[e(468)]("p",{className:"text-[10px] font-black text-orange-600 uppercase tracking-widest",children:f?f[e(495)]+" - "+f[e(520)]:e(478)})]}),a.jsx("div",{className:e(509)}),a[e(468)](e(492),{className:e(548),children:a[e(403)](e(531),{className:"bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer",value:v,onChange:r=>I(r[e(500)][e(600)]),children:[a[e(468)](e(603),{value:e(582),children:e(602)}),a[e(468)](e(603),{value:"a4",children:"A4 Size (210 x 297mm)"}),a[e(468)]("option",{value:e(518),children:e(528)})]})})]}),a.jsxs(e(492),{className:"flex items-center gap-4",children:[a[e(403)](e(492),{className:"flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200",children:[a[e(468)](e(402),{onClick:()=>J(r=>Math.max(.4,r-.1)),className:"w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm",title:e(561),children:a.jsx(s0,{className:e(441)})}),a[e(403)](e(606),{className:e(555),children:[Math.round(Z*100),"%"]}),a[e(468)](e(402),{onClick:()=>J(r=>Math.min(1.5,r+.1)),className:e(459),title:e(525),children:a[e(468)](l0,{className:e(441)})})]}),a[e(468)](e(492),{className:e(622)}),a[e(403)](e(402),{onClick:_,disabled:t[e(576)]===0,className:e(511),children:[a[e(468)](i0,{className:"w-4 h-4"}),e(519)]})]})]}),a[e(468)]("div",{className:e(489),children:t.length>0?a[e(468)](e(492),{className:e(552),style:{transform:e(588)+Z+")"},children:a.jsx(e(492),{className:"print:w-full flex flex-col items-center gap-8 print:gap-0",children:Array[e(577)]({length:Math[e(597)](t[e(576)]/4)})[e(417)]((r,o)=>a[e(403)](e(492),{className:e(447),children:[a[e(403)](e(492),{className:e(484),children:[e(464),o+1,e(628),Math[e(597)](t[e(576)]/4)]}),a[e(468)]("div",{className:e(475)}),t[e(453)](o*4,(o+1)*4).map(d=>{const n=e,s=parseInt(f?.[n(495)]?.[n(466)](/\D/g,"")||"0");return s===11||s===12?a[n(468)](h0,{student:d,schoolProfile:k,section:f,subjects:c,records:x,activeSchoolYear:O},d[n(594)]):a[n(468)](m0,{student:d,schoolProfile:k,section:f,subjects:c,records:x,activeSchoolYear:O},d[n(594)])})]},o))})}):a.jsxs(e(492),{className:e(493),children:[a[e(468)]("div",{className:"w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mb-6",children:a[e(468)](d0,{className:"w-10 h-10 text-slate-400"})}),a.jsx("h3",{className:e(572),children:e(614)}),a[e(468)]("p",{className:e(535),children:e(479)})]})})]})}function m0({student:e,schoolProfile:N,section:p,subjects:u,records:k,activeSchoolYear:j}){const x=W,O="./",G=N.logo_url||"school-logo.png",Q=O+x(437),v=T[x(558)](()=>{const h=x,t={};let f=0,c=0;const _={t1:0,t2:0,t3:0},b={t1:0,t2:0,t3:0};u[h(574)](l=>{const g=h;let P="",Y="",U="",F=0,D=0;for(let R=1;R<=3;R++){const V=k[g(589)](M=>M[g(434)]===e[g(594)]&&M.subject_id===l.id&&Number(M[g(538)])===R&&M.school_year===j);if(V&&V[g(425)]&&Number(V[g(425)])>0){const M=Number(V[g(425)]);R===1&&(P=M[g(631)](),_.t1+=M,b.t1++),R===2&&(Y=M.toString(),_.t2+=M,b.t2++),R===3&&(U=M[g(631)](),_.t3+=M,b.t3++),F+=M,D++}}let H="",x0="";if(D>0){const R=Math[g(522)](F/D);H=R[g(631)](),f+=R,c++,x0=R>=75?g(633):"Failed"}t[l.id]={q1:P,q2:Y,q3:U,final:H,remarks:x0}});const r=c>0?Math[h(522)](f/c)[h(631)]():"",o=r?Number(r)>=75?h(633):h(545):"",d=b.t1>0?Math[h(522)](_.t1/b.t1)[h(631)]():"",n=b.t2>0?Math.round(_.t2/b.t2)[h(631)]():"",s=b.t3>0?Math[h(522)](_.t3/b.t3)[h(631)]():"";return{subjectGrades:t,genAvg:r,genRemarks:o,genT1:d,genT2:n,genT3:s}},[u,k,e[x(594)],j]),I=(e[x(541)]+", "+e[x(406)]+" "+(e.middle_name?e[x(619)][0]+".":""))[x(562)](),Z=T[x(558)](()=>{const h=x;return I[h(576)]>35?h(565):I[h(576)]>25?h(400):h(473)},[I]),J=h=>{const t=x,f=h[t(576)];if(f===0)return{fontSize:t(445)};const c=S(h)[t(436)](t(585))||S(h)[t(436)](t(537))||S(h)[t(436)](t(488))||S(h)[t(436)](t(421)),_=c?158:170,b=.54,r=_/(f*b),o=Math.max(7.5,Math[t(418)](10,r));return{fontSize:o[t(460)](2)+"px",lineHeight:o<8.5?"1":t(592)}};return a.jsxs(x(492),{className:x(621),children:[a.jsxs(x(492),{className:x(598),children:[a[x(468)](x(550),{src:Q,className:x(590),alt:x(575)}),a.jsxs(x(492),{className:x(398),children:[a[x(468)]("p",{className:x(426),children:N.name}),a[x(403)]("p",{className:x(501),children:[x(608),j]}),a[x(468)]("h3",{className:x(457),children:x(454)})]}),a[x(468)](x(550),{src:G,className:x(590),alt:x(432)})]}),a.jsxs("div",{className:"mb-1.5 px-1 shrink-0 text-[9px]",children:[a[x(403)](x(492),{className:x(497),children:[a[x(468)](x(606),{className:"w-10 text-[9px]",children:x(480)}),a[x(468)](x(606),{className:x(442)+Z,children:I})]}),a.jsxs(x(492),{className:"flex gap-4 mb-0.5",children:[a[x(403)]("div",{className:"flex flex-1",children:[a.jsx(x(606),{className:"w-10",children:x(513)}),a[x(468)](x(606),{className:x(591),children:e[x(594)]})]}),a[x(403)](x(492),{className:"flex w-20",children:[a[x(468)](x(606),{className:x(526),children:x(397)}),a[x(468)](x(606),{className:x(472),children:e[x(490)]||""})]})]}),a[x(403)](x(492),{className:x(413),children:[a[x(403)](x(492),{className:"flex flex-1",children:[a.jsx(x(606),{className:x(410),children:"Grade Level:"}),a.jsx(x(606),{className:"flex-1 border-b border-black font-bold leading-none text-center pb-0.5",children:p?.[x(495)]?.replace(/Grade/i,"")[x(562)]()||""})]}),a[x(403)](x(492),{className:x(533),children:[a.jsx("span",{className:x(510),children:x(399)}),a[x(468)](x(606),{className:x(433),children:p?.section_name||""})]})]})]}),a[x(468)](x(492),{className:x(452),children:a[x(403)](x(532),{className:"grade-table",children:[a[x(403)]("thead",{children:[a[x(403)]("tr",{children:[a[x(468)]("th",{rowSpan:2,className:x(523),children:"LEARNING AREAS"}),a.jsx("th",{colSpan:3,children:"TERM"}),a[x(468)]("th",{rowSpan:2,className:"final-col leading-tight",children:a[x(468)]("div",{className:x(496),children:x(508)})}),a[x(468)]("th",{rowSpan:2,className:x(615),children:x(503)})]}),a[x(403)]("tr",{children:[a.jsx("th",{className:x(620),children:"1"}),a[x(468)]("th",{className:x(620),children:"2"}),a[x(468)]("th",{className:x(620),children:"3"})]})]}),a[x(403)](x(624),{children:[u.map(h=>{const t=x,f=v.subjectGrades[h.id],c=S(h.subject_name)[t(436)]("music")||S(h[t(616)])[t(436)](t(537))||S(h[t(616)])[t(436)](t(488))||S(h[t(616)]).includes("health");return a.jsxs("tr",{children:[a[t(468)]("td",{className:t(536)+(c?t(505):""),style:J(h[t(616)]),children:h[t(616)]}),a[t(468)]("td",{className:t(620),children:f.q1||" "}),a[t(468)]("td",{className:t(620),children:f.q2||" "}),a.jsx("td",{className:t(620),children:f.q3||" "}),a[t(468)]("td",{className:t(455),children:f[t(564)]||" "}),a[t(468)]("td",{className:"remarks-col text-[6.5px] tracking-tighter uppercase",children:f.remarks||" "})]},h.id)}),a[x(468)]("tr",{style:{height:x(601)},children:a[x(468)]("td",{colSpan:6,style:{backgroundColor:x(443),height:x(601),padding:0,borderLeft:x(551),borderRight:x(551),borderTop:x(551),borderBottom:x(551)}})}),a[x(403)]("tr",{children:[a[x(468)]("td",{className:x(467),children:x(579)}),a[x(468)]("td",{className:x(560),children:v[x(483)]||" "}),a[x(468)]("td",{className:"q-col font-bold",children:v[x(530)]||" "}),a[x(468)]("td",{className:x(560),children:v[x(408)]||" "}),a[x(468)]("td",{className:x(449),children:v[x(414)]||" "}),a[x(468)]("td",{className:x(584),children:v[x(566)]||" "})]})]})]})}),a[x(403)]("div",{className:x(613),children:[a.jsx("p",{className:x(549),children:x(611)}),a[x(403)](x(492),{className:x(469),children:[a[x(468)](x(492),{className:"font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none",children:N[x(570)]||x(431)}),a[x(468)]("p",{className:x(543),children:x(507)})]})]})]})}function K(e,N){const p=W;if(e===void 0||e===p(409)||e===p(420)||e===null)return!1;const u=Number(e);return isNaN(u)?!1:u!==N}function e0(){const e=["h-8 w-px bg-slate-200","grade-table","tbody","18494QAGswA","text-sm font-black text-slate-900 uppercase tracking-tight",`
                .print-page {
                    width: `," of ","flex gap-4 mb-0.5","flex-1 border-b border-black font-bold leading-none text-center pb-0.5","toString","843264AWmVEW","Passed","Age:","text-center font-bold leading-none","Section:","text-[8.2px] leading-tight","flex flex-[1.2]","button","jsxs","filter","Male","first_name","Electives","genT3","all","w-15","push","8.5in 13in portrait","flex gap-4","genAvg","student_section","w-15 shrink-0","map","min","print","none","health","useState","prototype","pl-3 font-normal","final_grade","uppercase text-[9px]","remarks-col text-[6.5px] tracking-tighter uppercase","w-10 shrink-0","Temporary Grade Slip","297mm","_________________________","School","flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5","student_lrn","__proto__","includes","deped_logo_left.png","log","school-forms","toLowerCase","w-3.5 h-3.5","flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ","black","name","10px","mabisang komunikasyon","print-page relative","localeCompare","final-col font-bold","effectivecommunication","header","flex-1 min-h-0 mb-1.5 px-1","slice","Grade Slip","final-col","general mathematics","text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none","Effective Communication & Mabisang Komunikasyon","w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm","toFixed","742105ukZlHP","A4 portrait","subject","Page ","normal","replace","subject-col font-bold text-[10px] text-center pb-1 pt-1","jsx","w-45 mx-auto text-center mt-2.5","life and career skills","trace","flex-1 border-b border-black font-bold pb-0.5 leading-none text-center","text-[9px]","h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-100 shadow-sm print:hidden","cut-cross","isComponent","remarks","Student Resource Tool","Please set up your advisory grade level and section details in your Profile to generate temporary grade slips.","Name:","grade_level","w-10 text-[9px]","genT1","absolute -top-6 right-0 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden","50HkeTKA","style","39PJdJqA","physical","flex-1 overflow-auto p-8 flex flex-col items-center bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible custom-scrollbar","age","gender","div","flex-1 flex flex-col items-center justify-center text-center max-w-md","430206wUBKxq","section_grade_level","w-min mx-auto","flex mb-0.5 items-baseline","useEffect","parent","target","uppercase text-[9px] font-normal tracking-wide mt-0.5","console","REMARKS","thead","italic pl-3","subject_id","Adviser","FINAL GRADE","h-8 w-px bg-slate-200 mx-2","w-11.25","h-11 px-6 rounded-xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2",`;
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
            `,"LRN:","is_advisory_class","parent_ec_mk","logo_url","type","folio","Print Slips","section_name","height","round","subject-col","p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600","Zoom In","w-8","bind","Folio / Long (8.5 x 13in)","letter portrait","genT2","select","table","flex flex-1","kasaysayan at lipunang pilipino","text-sm text-slate-500 font-medium leading-relaxed","subject-col ","arts","quarter","#E5E7EB","constructor","last_name","762687yxdUaL","text-[8px] italic mt-0.5",'{}.constructor("return this")( )',"Failed","923288fEvOei","font-bold","flex items-center gap-3","text-[8px] mb-1 w-full text-center","img","1px solid black","print-preview-container print:w-full flex flex-col items-center transition-all duration-300 ease-out origin-top print:scale-100","8px",`;
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
                        size: `,"text-xs font-bold text-slate-900 w-12 text-center tabular-nums","pag-aaral ng kasaysayan at lipunang pilipino","Grade Level:","useMemo","4hczwgZ","q-col font-bold","Zoom Out","trim","school-logo.png","final","text-[7.5px] leading-tight","genRemarks","apply","Track:","215.9mm","adviser_name","font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none","text-xl font-black text-slate-800 mb-2","418323ygGlgv","forEach","DepEd","length","from","some","General Average","school_year","cssSize","letter","term","remarks-col text-[6.5px] tracking-tighter uppercase font-bold","music","w-10","sort","scale(","find","w-10 h-10 object-contain","flex-1 border-b border-black font-bold pb-0.5 leading-none","1.1","warn","lrn","error","max","ceil","flex items-center justify-between mb-1.5 px-1 shrink-0","effective communication","value","2px","Letter (8.5 x 11in)","option","section_id","LEARNING AREAS","span","flex-1 border-b border-black font-bold leading-none pb-0.5 uppercase text-center","SCHOOL YEAR: ","info","mabisangkomunikasyon","Prepared by:","general science","mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center","No Advisory Class Set","remarks-col","subject_name","bold","header-","middle_name","q-col","grade-slip-card font-serif text-[9px] relative text-black leading-tight"];return e0=function(){return e},e0()}function h0({student:e,schoolProfile:N,section:p,subjects:u,records:k,activeSchoolYear:j}){const x=W,O="./",G=N[x(516)]||x(563),Q=O+x(437),v=T[x(558)](()=>{const t=x,f={};u[t(574)](w=>{const i=t;let m=0,C=0,A=0;for(let y=1;y<=3;y++){const q=k[i(589)](E=>E.student_lrn===e[i(594)]&&E[i(506)]===w.id&&Number(E[i(538)])===y&&E[i(580)]===j);if(q&&q[i(425)]&&Number(q.final_grade)>0){const E=Number(q[i(425)]);y===1&&(m=E),y===2&&(C=E),y===3&&(A=E)}}const z=w[i(583)];let L=0;if(z===1||Number(z)===1)L=m;else if(z===2||Number(z)===2)L=C;else if(z===3||Number(z)===3)L=A;else{let y=0,q=0;m>0&&(y+=m,q++),C>0&&(y+=C,q++),A>0&&(y+=A,q++),L=q>0?Math[i(522)](y/q):0}f[w.id]={q1:m,q2:C,q3:A,final:L,term:z}});const c=u[t(404)](w=>{const i=t,m=w[i(616)][i(562)]()[i(440)]();return[i(599),i(446),i(456),i(612),"life and career skills",i(556),i(534)].some(A=>m[i(436)](A))}),_=c[t(404)](w=>{const i=t,m=S(w[i(616)]);return m===i(450)||m===i(610)});let b=0,r=0,o=0,d=0,n;if(_[t(576)]>0){const w=_[t(589)](B=>S(B[t(616)])===t(450)),i=_[t(589)](B=>S(B.subject_name)==="mabisangkomunikasyon");w&&w[t(583)]?n=w[t(583)]:i&&i[t(583)]&&(n=i[t(583)]);const m=w?f[w.id]:null,C=i?f[i.id]:null,A=m?.q1||0,z=C?.q1||0;A>0&&z>0?b=Math[t(522)]((A+z)/2):A>0?b=A:z>0&&(b=z);const L=m?.q2||0,y=C?.q2||0;L>0&&y>0?r=Math[t(522)]((L+y)/2):L>0?r=L:y>0&&(r=y);const q=m?.q3||0,E=C?.q3||0;if(q>0&&E>0?o=Math[t(522)]((q+E)/2):q>0?o=q:E>0&&(o=E),n===1||Number(n)===1)d=b;else if(n===2||Number(n)===2)d=r;else if(n===3||Number(n)===3)d=o;else{let B=0,X=0;b>0&&(B+=b,X++),r>0&&(B+=r,X++),o>0&&(B+=o,X++),d=X>0?Math.round(B/X):0}}const s={};s.parent_ec_mk={q1:b>0?b[t(631)]():"",q2:r>0?r[t(631)]():"",q3:o>0?o[t(631)]():"",final:d>0?d[t(631)]():"",remarks:d>0?d>=75?"Passed":"Failed":"",term:n},u[t(574)](w=>{const i=t,m=f[w.id];s[w.id]={q1:m.q1>0?m.q1.toString():"",q2:m.q2>0?m.q2[i(631)]():"",q3:m.q3>0?m.q3[i(631)]():"",final:m[i(564)]>0?m[i(564)][i(631)]():"",remarks:m.final>0?m.final>=75?i(633):i(545):"",term:m.term}});let l=0,g=0,P=0,Y=0,U=0,F=0,D=0,H=0;const x0=w=>{const i=t,m=u[i(589)](A=>A.id===w);if(!m)return!1;const C=S(m[i(616)]);return C===i(450)||C===i(610)};u.forEach(w=>{const i=t;if(x0(w.id))return;const m=f[w.id];m.q1>0&&!K(m[i(583)],1)&&(l+=m.q1,g++),m.q2>0&&!K(m[i(583)],2)&&(P+=m.q2,Y++),m.q3>0&&!K(m[i(583)],3)&&(U+=m.q3,F++),m.final>0&&(D+=m[i(564)],H++)}),_[t(576)]>0&&(b>0&&!K(n,1)&&(l+=b,g++),r>0&&!K(n,2)&&(P+=r,Y++),o>0&&!K(n,3)&&(U+=o,F++),d>0&&(D+=d,H++));const R=g>0?Math[t(522)](l/g)[t(631)]():"",V=Y>0?Math[t(522)](P/Y)[t(631)]():"",M=F>0?Math[t(522)](U/F)[t(631)]():"",a0=H>0?Math[t(522)](D/H)[t(631)]():"",r0=a0?Number(a0)>=75?t(633):t(545):"";return{subjectGrades:s,genAvg:a0,genRemarks:r0,genT1:R,genT2:V,genT3:M}},[u,k,e[x(594)],j]),I=(e[x(541)]+", "+e[x(406)]+" "+(e[x(619)]?e[x(619)][0]+".":""))[x(562)](),Z=T[x(558)](()=>{const t=x;return I.length>35?t(565):I[t(576)]>25?t(400):"text-[9px]"},[I]),J=(t,f)=>{const c=x,_=t[c(576)];if(_===0)return{fontSize:c(445)};const b=f?158:170,r=.54,o=b/(_*r),d=Math[c(596)](7.5,Math.min(10,o));return{fontSize:d[c(460)](2)+"px",lineHeight:d<8.5?"1":c(592)}},h=T[x(558)](()=>{const t=x,f=[],c=[];u[t(574)](s=>{const l=t,g=s[l(616)].trim()[l(440)]();[l(599),l(446),"general mathematics",l(612),l(470),l(556),l(534)][l(578)](Y=>g.includes(Y))?f[l(411)](s):c[l(411)](s)});const _=f.filter(s=>{const l=t,g=S(s[l(616)]);return g===l(450)||g===l(610)}),b=f.filter(s=>{const l=t,g=S(s[l(616)]);return g!==l(450)&&g!==l(610)}),r=t0(b,s=>s[t(616)]),o=t0(c,s=>s[t(616)]),d=[],n=[];if(_.length>0){const s=_[t(589)](P=>S(P[t(616)])==="effectivecommunication"),l=_[t(589)](P=>S(P[t(616)])==="mabisangkomunikasyon"),g=s?.term||l?.[t(583)];n.push({type:t(499),name:t(458),id:t(515),term:g}),s&&n[t(411)]({type:"subject",name:s.subject_name,id:s.id,isComponent:!0,term:s[t(583)]}),l&&n.push({type:t(463),name:l[t(616)],id:l.id,isComponent:!0,term:l[t(583)]})}return r[t(574)](s=>{const l=t;n[l(411)]({type:"subject",name:s.subject_name,id:s.id,term:s[l(583)]})}),n.length>0&&(d[t(411)]({type:t(451),name:"Core Subjects"}),d[t(411)](...n)),o.length>0&&(d[t(411)]({type:t(451),name:t(407)}),o[t(574)](s=>{const l=t;d[l(411)]({type:l(463),name:s[l(616)],id:s.id,term:s[l(583)]})})),d},[u]);return a[x(403)]("div",{className:x(621),children:[a.jsxs("div",{className:x(598),children:[a.jsx(x(550),{src:Q,className:x(590),alt:"DepEd"}),a[x(403)]("div",{className:x(398),children:[a.jsx("p",{className:x(426),children:N.name}),a[x(403)]("p",{className:"uppercase text-[9px] font-normal tracking-wide mt-0.5",children:["SCHOOL YEAR: ",j]}),a.jsx("h3",{className:"text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none",children:"Grade Slip"})]}),a[x(468)](x(550),{src:G,className:x(590),alt:"School"})]}),a.jsxs("div",{className:"mb-1.5 px-1 shrink-0 text-[9px]",children:[a.jsxs(x(492),{className:x(497),children:[a.jsx(x(606),{className:x(482),children:x(480)}),a[x(468)](x(606),{className:x(442)+Z,children:I})]}),a[x(403)]("div",{className:x(629),children:[a.jsxs(x(492),{className:x(533),children:[a[x(468)](x(606),{className:x(586),children:x(513)}),a[x(468)](x(606),{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none",children:e.lrn})]}),a[x(403)](x(492),{className:"flex w-20",children:[a.jsx(x(606),{className:x(526),children:x(397)}),a[x(468)](x(606),{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none text-center",children:e[x(490)]||""})]})]}),a[x(403)](x(492),{className:x(413),children:[a[x(403)]("div",{className:"flex flex-1",children:[a[x(468)]("span",{className:x(416),children:x(557)}),a[x(468)]("span",{className:x(630),children:p?.[x(495)]?.replace(/Grade/i,"")[x(562)]()||""})]}),a[x(403)](x(492),{className:x(533),children:[a[x(468)]("span",{className:x(428),children:x(399)}),a.jsx(x(606),{className:x(433),children:p?.[x(520)]||""})]}),a[x(403)](x(492),{className:x(401),children:[a[x(468)](x(606),{className:x(428),children:x(568)}),a[x(468)](x(606),{className:x(607),children:e.track||""})]})]})]}),a[x(468)](x(492),{className:x(452),children:a[x(403)]("table",{className:x(623),children:[a.jsxs(x(504),{children:[a[x(403)]("tr",{children:[a[x(468)]("th",{rowSpan:2,className:x(523),children:x(605)}),a[x(468)]("th",{colSpan:3,children:"TERM"}),a[x(468)]("th",{rowSpan:2,className:"final-col leading-tight",children:a.jsx("div",{className:"w-min mx-auto",children:x(508)})}),a[x(468)]("th",{rowSpan:2,className:x(615),children:x(503)})]}),a[x(403)]("tr",{children:[a[x(468)]("th",{className:x(620),children:"1"}),a[x(468)]("th",{className:x(620),children:"2"}),a[x(468)]("th",{className:x(620),children:"3"})]})]}),a[x(403)](x(624),{children:[h[x(417)]((t,f)=>{const c=x;if(t[c(517)]===c(451))return a[c(468)]("tr",{children:a.jsx("td",{colSpan:6,style:{backgroundColor:c(539),fontWeight:c(617),textAlign:"left",padding:"2px 4px",fontSize:c(553),textTransform:"uppercase"},children:t[c(444)]})},c(618)+f);const _=t[c(517)]===c(499),b=_?c(515):t.id,r=v.subjectGrades[b]||{q1:"",q2:"",q3:"",final:"",remarks:""},o=!_&&t[c(476)];return a[c(403)]("tr",{children:[a[c(468)]("td",{className:"subject-col "+c(o?424:547),style:{...J(t[c(444)],o),fontWeight:c(o?465:617)},children:t.name}),[1,2,3][c(417)](d=>{const n=c;if(K(t[n(583)],d))return a[n(468)]("td",{className:n(620),style:{backgroundColor:"#E5E7EB"},children:" "},d);const l=d===1?r.q1:d===2?r.q2:r.q3;return a[n(468)]("td",{className:"q-col",children:l||" "},d)}),a[c(468)]("td",{className:c(455),children:r.final||" "}),a[c(468)]("td",{className:c(427),children:r[c(477)]||" "})]},b)}),a[x(468)]("tr",{style:{height:x(601)},children:a[x(468)]("td",{colSpan:6,style:{backgroundColor:"black",height:"2px",padding:0,borderLeft:x(551),borderRight:x(551),borderTop:x(551),borderBottom:x(551)}})}),a[x(403)]("tr",{children:[a[x(468)]("td",{className:x(467),children:x(579)}),a[x(468)]("td",{className:x(560),children:v.genT1||" "}),a[x(468)]("td",{className:x(560),children:v[x(530)]||" "}),a.jsx("td",{className:x(560),children:v.genT3||" "}),a[x(468)]("td",{className:x(449),children:v[x(414)]||" "}),a.jsx("td",{className:x(584),children:v[x(566)]||" "})]})]})]})}),a[x(403)](x(492),{className:x(613),children:[a.jsx("p",{className:x(549),children:x(611)}),a[x(403)]("div",{className:"w-45 mx-auto text-center mt-2.5",children:[a[x(468)](x(492),{className:x(571),children:N.adviser_name||"_________________________"}),a[x(468)]("p",{className:x(543),children:x(507)})]})]})]})}export{_0 as TemporaryGradeSlipPage};
