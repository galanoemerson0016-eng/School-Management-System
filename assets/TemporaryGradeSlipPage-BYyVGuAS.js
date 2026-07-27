import{r as R,j as a,cq as r0,cA as c0,c9 as l0,cc as i0,cH as o0}from"./vendor-4CUCBNS3.js";import{b as d0,s as t0,n as S}from"./index-CPXN1GVM.js";import"./vendor-pdf-libs-B7pIjGAa.js";import"./vendor-firebase-DHW4GZTb.js";import"./vendor-framer-motion-kqy7ILiZ.js";(function(e,g){const u=O,p=e();for(;;)try{if(parseInt(u(566))/1*(parseInt(u(537))/2)+-parseInt(u(646))/3+parseInt(u(636))/4*(parseInt(u(666))/5)+-parseInt(u(575))/6+parseInt(u(597))/7+-parseInt(u(546))/8+-parseInt(u(630))/9===g)break;p.push(p.shift())}catch{p.push(p.shift())}})(e0,861584);const $=(function(){let e=!0;return function(g,u){const p=e?function(){const j=O;if(u){const v=u[j(439)](g,arguments);return u=null,v}}:function(){};return e=!1,p}})(),n0=$(void 0,function(){const e=O;let g;try{g=Function(e(488)+e(547)+");")()}catch{g=window}const u=g.console=g[e(618)]||{},p=["log",e(522),e(569),e(498),e(637),e(461),e(496)];for(let j=0;j<p[e(615)];j++){const v=$[e(661)].prototype[e(662)]($),x=p[j],F=u[x]||v;v[e(504)]=$[e(662)]($),v[e(576)]=F[e(576)].bind(F),u[x]=v}});n0();function e0(){const e=["section_name","apply","mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center","jsx","w-11.25","flex-1 min-h-0 mb-1.5 px-1","1.1","Name:","flex gap-4 mb-0.5","flex flex-1","w-15","Please set up your advisory grade level and section details in your Profile to generate temporary grade slips.","trim","h-full bg-slate-50 flex flex-col overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible","life and career skills","map","h-8 w-px bg-slate-200 mx-2","grade-slip-card font-serif text-[9px] relative text-black leading-tight","select","age","last_name","flex flex-[1.2]","Page ","table","lrn","school-logo.png","bold","isComponent","remarks","8px","filter","genT3","print","parent","font-bold","effective communication","slice","8.5in 13in portrait","toFixed",`
                .print-page {
                    width: `,"effectivecommunication","uppercase text-[9px]","Zoom Out","Print Slips","sort","music","jsxs","thead","scale(","SCHOOL YEAR: ","return (function() ","w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mb-6","flex gap-4","arts","w-10 shrink-0","find","is_advisory_class","flex mb-0.5 items-baseline","trace","height","error","text-center font-bold leading-none","type","kasaysayan at lipunang pilipino","span","w-10","__proto__","2px 4px","Passed","w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm","cut-cross","cssSize","useMemo","track","final-col font-bold","q-col font-bold","final_grade","some","Core Subjects","text-[9px]","h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-100 shadow-sm print:hidden","flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200","gender","absolute -top-6 right-0 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden","warn","middle_name","w-3.5 h-3.5","subjectGrades","1px solid black","final-col leading-tight",`;
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
                        size: `,"flex-1 border-b border-black font-bold leading-none text-center pb-0.5","REMARKS","General Average","includes","Grade Level:","flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ","school_year","_________________________","61414SCiseA","#E5E7EB","genT2","279.4mm","genT1","Adviser Signature","w-8","parent_ec_mk","header","4140176PLjdqc",'{}.constructor("return this")( )',"forEach","mabisang komunikasyon","Effective Communication & Mabisang Komunikasyon","from","Electives","remarks-col","10px","tbody","297mm","subject-col ","img","Failed","text-[8px] mb-1 w-full text-center","A4 Size (210 x 297mm)","option","section_id","Letter (8.5 x 11in)","flex items-center justify-between mb-1.5 px-1 shrink-0","38PkOyuH","text-xs font-bold text-slate-900 w-12 text-center tabular-nums","useState","info","round","localeCompare","subject_name","section_grade_level","flex items-center gap-3","838308reMsfL","toString","all","Section:","pl-3 font-normal","bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer","div","w-5 h-5","w-45 mx-auto text-center mt-2.5 relative","first_name","w-min mx-auto","text-sm font-black text-slate-900 uppercase tracking-tight","w-10 h-10 object-contain","adviser_signature_url","school-forms","normal","health","grade-table","Age:","left","deped_logo_left.png","subject-col","2570722XLemQd","text-[7.5px] leading-tight","push","mabisangkomunikasyon","h-8 w-px bg-slate-200","general mathematics",`;
                    height: `,"DepEd","uppercase text-[9px] font-normal tracking-wide mt-0.5","subject","header-","q-col","adviser_name","max-h-full max-w-full object-contain","value"," of ","replace","Grade Slip","length","button","target","console","flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5","student_section","mb-1.5 px-1 shrink-0 text-[9px]","LEARNING AREAS","subject_id","absolute left-1/2 -translate-x-1/2 bottom-3.5 w-20 h-10 flex items-center justify-center pointer-events-none z-10","330.2mm","name","flex-1 overflow-auto p-8 flex flex-col items-center bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible custom-scrollbar","flex items-center gap-6","uppercase","11065635pMaLWh","font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none","text-[8px] italic mt-0.5","logo_url","flex-1 flex flex-col items-center justify-center text-center max-w-md","remarks-col text-[6.5px] tracking-tighter uppercase font-bold","1076YgJpSX","exception","Temporary Grade Slip","A4 portrait","width","quarter","h-11 px-6 rounded-xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2","Prepared by:","min","subject-col font-bold text-[10px] text-center pb-1 pt-1","617472JFRXVj","term","letter","final-col","final","student_lrn","genAvg","black","max","TERM","School","general science","flex-1 border-b border-black font-bold leading-none pb-0.5 uppercase text-center","text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none","toLowerCase","constructor","bind","remarks-col text-[6.5px] tracking-tighter uppercase","w-10 text-[9px]","2px","26395zUVoiD","print-preview-container print:w-full flex flex-col items-center transition-all duration-300 ease-out origin-top print:scale-100","text-[8.2px] leading-tight","none","Adviser","flex-1 border-b border-black font-bold pb-0.5 leading-none text-center"];return e0=function(){return e},e0()}function O(e,g){return e=e-435,e0()[e]}function _0(){const e=O,{students:g,sections:u,subjects:p,schoolProfile:j,setCurrentView:v,gradingSheetRecords:x,activeSchoolYear:F}=d0(),[z,Q]=R[e(568)](""),[k,L]=R[e(568)]("letter"),[W,J]=R[e(568)](1),m=R[e(510)](()=>{const s=e;return[...u[s(468)](l=>l.is_advisory||l[s(494)])][s(482)]((l,r)=>{const d=s,c=(l.section_grade_level||"").localeCompare(r[d(573)]||"",void 0,{numeric:!0});return c!==0?c:(l.section_name||"")[d(571)](r.section_name||"")})},[u]);R.useEffect(()=>{if(!z&&m.length>0){const s=setTimeout(()=>{const o=O;Q(m[0][o(438)])},0);return()=>clearTimeout(s)}},[m,z]);const t=R[e(510)](()=>{const s=e;return z?g[s(468)](o=>o[s(620)]===z)[s(482)]((o,l)=>{const r=s;return o[r(520)]!==l[r(520)]?o[r(520)]==="Male"?-1:1:o.last_name.localeCompare(l[r(458)])}):[]},[g,z]),f=R.useMemo(()=>{const s=e;return u.find(o=>o[s(438)]===z||o.id===z)},[u,z]),n=R.useMemo(()=>{const s=e;if(!f)return[];const o=parseInt(f[s(573)][s(613)](/\D/g,""))||0;let l=p[s(468)](r=>r[s(563)]===f.id&&r[s(647)]!==s(435));return l[s(615)]===0&&(l=p[s(468)](r=>{const d=s,c=parseInt(r.grade_level?.[d(576)]().replace(/\D/g,"")||"0");return!r[d(563)]&&c===o&&r[d(647)]!==d(435)})),t0(l,r=>r.subject_name)},[p,f]),N=()=>{window[e(470)]()},h={a4:{height:e(556),width:"210mm",cssSize:e(639)},letter:{height:e(540),width:"215.9mm",cssSize:"letter portrait"},folio:{height:e(625),width:"215.9mm",cssSize:e(475)}};return a[e(484)](e(581),{className:e(451),children:[a.jsx("style",{children:e(477)+h[k][e(640)]+e(603)+h[k][e(497)]+e(528)+h[k][e(509)]+`;
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
            `}),a[e(484)](e(581),{className:e(518),children:[a[e(484)](e(581),{className:e(628),children:[a.jsx(e(616),{onClick:()=>v(e(589)),className:"p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600",children:a.jsx(r0,{className:e(582)})}),a.jsxs("div",{children:[a[e(441)]("h2",{className:e(586),children:e(638)}),a[e(441)]("p",{className:"text-[10px] font-black text-orange-600 uppercase tracking-widest",children:f?f[e(573)]+" - "+f[e(438)]:"Student Resource Tool"})]}),a[e(441)](e(581),{className:e(454)}),a.jsx(e(581),{className:e(574),children:a.jsxs(e(456),{className:e(580),value:k,onChange:s=>L(s[e(617)][e(611)]),children:[a[e(441)](e(562),{value:e(648),children:e(564)}),a[e(441)](e(562),{value:"a4",children:e(561)}),a[e(441)](e(562),{value:"folio",children:"Folio / Long (8.5 x 13in)"})]})})]}),a[e(484)]("div",{className:"flex items-center gap-4",children:[a[e(484)]("div",{className:e(519),children:[a[e(441)](e(616),{onClick:()=>J(s=>Math[e(654)](.4,s-.1)),className:e(507),title:e(480),children:a.jsx(c0,{className:e(524)})}),a.jsxs("span",{className:e(567),children:[Math[e(570)](W*100),"%"]}),a[e(441)](e(616),{onClick:()=>J(s=>Math[e(644)](1.5,s+.1)),className:e(507),title:"Zoom In",children:a[e(441)](l0,{className:"w-3.5 h-3.5"})})]}),a[e(441)](e(581),{className:e(601)}),a[e(484)](e(616),{onClick:N,disabled:t[e(615)]===0,className:e(642),children:[a[e(441)](i0,{className:"w-4 h-4"}),e(481)]})]})]}),a.jsx(e(581),{className:e(627),children:t[e(615)]>0?a[e(441)]("div",{className:e(667),style:{transform:e(486)+W+")"},children:a.jsx(e(581),{className:"print:w-full flex flex-col items-center gap-8 print:gap-0",children:Array[e(551)]({length:Math.ceil(t[e(615)]/4)})[e(453)]((s,o)=>a[e(484)](e(581),{className:"print-page relative",children:[a[e(484)](e(581),{className:e(521),children:[e(460),o+1,e(612),Math.ceil(t[e(615)]/4)]}),a[e(441)](e(581),{className:e(508)}),t[e(474)](o*4,(o+1)*4)[e(453)](l=>{const r=e,d=parseInt(f?.[r(573)]?.[r(613)](/\D/g,"")||"0");return d===11||d===12?a[r(441)](m0,{student:l,schoolProfile:j,section:f,subjects:n,records:x,activeSchoolYear:F},l[r(462)]):a[r(441)](b0,{student:l,schoolProfile:j,section:f,subjects:n,records:x,activeSchoolYear:F},l[r(462)])})]},o))})}):a[e(484)](e(581),{className:e(634),children:[a[e(441)](e(581),{className:e(489),children:a.jsx(o0,{className:"w-10 h-10 text-slate-400"})}),a[e(441)]("h3",{className:"text-xl font-black text-slate-800 mb-2",children:"No Advisory Class Set"}),a[e(441)]("p",{className:"text-sm text-slate-500 font-medium leading-relaxed",children:e(449)})]})})]})}function b0({student:e,schoolProfile:g,section:u,subjects:p,records:j,activeSchoolYear:v}){const x=O,F="./",z=g[x(633)]||x(463),Q=F+"deped_logo_left.png",k=R.useMemo(()=>{const m=x,t={};let f=0,n=0;const N={t1:0,t2:0,t3:0},h={t1:0,t2:0,t3:0};p[m(548)](c=>{const _=m;let P="",Y="",K="",B=0,H=0;for(let G=1;G<=3;G++){const Z=j[_(493)](M=>M[_(651)]===e[_(462)]&&M.subject_id===c.id&&Number(M[_(641)])===G&&M.school_year===v);if(Z&&Z[_(514)]&&Number(Z[_(514)])>0){const M=Number(Z[_(514)]);G===1&&(P=M[_(576)](),N.t1+=M,h.t1++),G===2&&(Y=M[_(576)](),N.t2+=M,h.t2++),G===3&&(K=M[_(576)](),N.t3+=M,h.t3++),B+=M,H++}}let X="",x0="";if(H>0){const G=Math[_(570)](B/H);X=G[_(576)](),f+=G,n++,x0=G>=75?_(506):_(559)}t[c.id]={q1:P,q2:Y,q3:K,final:X,remarks:x0}});const s=n>0?Math[m(570)](f/n)[m(576)]():"",o=s?Number(s)>=75?m(506):m(559):"",l=h.t1>0?Math[m(570)](N.t1/h.t1).toString():"",r=h.t2>0?Math.round(N.t2/h.t2)[m(576)]():"",d=h.t3>0?Math[m(570)](N.t3/h.t3)[m(576)]():"";return{subjectGrades:t,genAvg:s,genRemarks:o,genT1:l,genT2:r,genT3:d}},[p,j,e[x(462)],v]),L=(e[x(458)]+", "+e[x(584)]+" "+(e[x(523)]?e[x(523)][0]+".":""))[x(450)](),W=R[x(510)](()=>{const m=x;return L[m(615)]>35?m(598):L[m(615)]>25?m(668):m(517)},[L]),J=m=>{const t=x,f=m.length;if(f===0)return{fontSize:"10px"};const n=S(m)[t(532)]("music")||S(m).includes(t(491))||S(m)[t(532)]("physical")||S(m)[t(532)]("health"),N=n?158:170,h=.54,s=N/(f*h),o=Math[t(654)](7.5,Math.min(10,s));return{fontSize:o[t(476)](2)+"px",lineHeight:o<8.5?"1":"1.1"}};return a.jsxs(x(581),{className:"grade-slip-card font-serif text-[9px] relative text-black leading-tight",children:[a[x(484)](x(581),{className:x(565),children:[a[x(441)]("img",{src:Q,className:x(587),alt:x(604)}),a[x(484)](x(581),{className:x(499),children:[a.jsx("p",{className:"uppercase text-[9px]",children:g[x(626)]}),a.jsxs("p",{className:x(605),children:[x(487),v]}),a[x(441)]("h3",{className:x(659),children:"Grade Slip"})]}),a.jsx(x(558),{src:z,className:x(587),alt:"School"})]}),a[x(484)](x(581),{className:x(621),children:[a.jsxs(x(581),{className:x(495),children:[a[x(441)](x(502),{className:x(664),children:x(445)}),a[x(441)]("span",{className:x(534)+W,children:L})]}),a[x(484)](x(581),{className:x(446),children:[a[x(484)]("div",{className:x(447),children:[a[x(441)](x(502),{className:x(503),children:"LRN:"}),a.jsx(x(502),{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none",children:e[x(462)]})]}),a.jsxs("div",{className:"flex w-20",children:[a[x(441)](x(502),{className:x(543),children:"Age:"}),a[x(441)](x(502),{className:x(437),children:e[x(457)]||""})]})]}),a.jsxs(x(581),{className:x(490),children:[a[x(484)]("div",{className:x(447),children:[a.jsx(x(502),{className:x(448),children:x(533)}),a.jsx("span",{className:x(529),children:u?.[x(573)]?.replace(/Grade/i,"")[x(450)]()||""})]}),a.jsxs(x(581),{className:"flex flex-1",children:[a[x(441)](x(502),{className:x(442),children:x(578)}),a[x(441)](x(502),{className:x(619),children:u?.[x(438)]||""})]})]})]}),a[x(441)](x(581),{className:x(443),children:a[x(484)]("table",{className:x(592),children:[a[x(484)](x(485),{children:[a[x(484)]("tr",{children:[a[x(441)]("th",{rowSpan:2,className:x(596),children:x(622)}),a.jsx("th",{colSpan:3,children:x(655)}),a.jsx("th",{rowSpan:2,className:x(527),children:a[x(441)]("div",{className:"w-min mx-auto",children:"FINAL GRADE"})}),a[x(441)]("th",{rowSpan:2,className:"remarks-col",children:x(530)})]}),a.jsxs("tr",{children:[a[x(441)]("th",{className:x(608),children:"1"}),a[x(441)]("th",{className:x(608),children:"2"}),a[x(441)]("th",{className:x(608),children:"3"})]})]}),a.jsxs("tbody",{children:[p.map(m=>{const t=x,f=k.subjectGrades[m.id],n=S(m.subject_name)[t(532)](t(483))||S(m[t(572)])[t(532)]("arts")||S(m[t(572)]).includes("physical")||S(m.subject_name)[t(532)](t(591));return a[t(484)]("tr",{children:[a.jsx("td",{className:t(557)+(n?"italic pl-3":""),style:J(m.subject_name),children:m[t(572)]}),a[t(441)]("td",{className:t(608),children:f.q1||" "}),a[t(441)]("td",{className:t(608),children:f.q2||" "}),a[t(441)]("td",{className:t(608),children:f.q3||" "}),a[t(441)]("td",{className:t(649),children:f[t(650)]||" "}),a[t(441)]("td",{className:t(663),children:f[t(466)]||" "})]},m.id)}),a[x(441)]("tr",{style:{height:x(665)},children:a.jsx("td",{colSpan:6,style:{backgroundColor:x(653),height:x(665),padding:0,borderLeft:x(526),borderRight:"1px solid black",borderTop:x(526),borderBottom:x(526)}})}),a[x(484)]("tr",{children:[a.jsx("td",{className:x(645),children:x(531)}),a[x(441)]("td",{className:x(513),children:k.genT1||" "}),a.jsx("td",{className:x(513),children:k.genT2||" "}),a[x(441)]("td",{className:x(513),children:k[x(469)]||" "}),a[x(441)]("td",{className:x(512),children:k.genAvg||" "}),a.jsx("td",{className:x(635),children:k.genRemarks||" "})]})]})]})}),a[x(484)]("div",{className:x(440),children:[a[x(441)]("p",{className:x(560),children:x(643)}),a.jsxs(x(581),{className:x(583),children:[g.adviser_signature_url&&a.jsx("div",{className:x(624),children:a[x(441)](x(558),{src:g[x(588)],alt:x(542),className:x(610)})}),a.jsx("div",{className:x(631),children:g.adviser_name||x(536)}),a[x(441)]("p",{className:x(632),children:x(436)})]})]})]})}function V(e,g){if(e===void 0||e===O(577)||e==="none"||e===null)return!1;const p=Number(e);return isNaN(p)?!1:p!==g}function m0({student:e,schoolProfile:g,section:u,subjects:p,records:j,activeSchoolYear:v}){const x=O,F="./",z=g.logo_url||"school-logo.png",Q=F+x(595),k=R.useMemo(()=>{const t=x,f={};p[t(548)](w=>{const i=t;let b=0,A=0,C=0;for(let y=1;y<=3;y++){const q=j.find(T=>T.student_lrn===e[i(462)]&&T[i(623)]===w.id&&Number(T[i(641)])===y&&T[i(535)]===v);if(q&&q.final_grade&&Number(q.final_grade)>0){const T=Number(q[i(514)]);y===1&&(b=T),y===2&&(A=T),y===3&&(C=T)}}const E=w[i(647)];let I=0;if(E===1||Number(E)===1)I=b;else if(E===2||Number(E)===2)I=A;else if(E===3||Number(E)===3)I=C;else{let y=0,q=0;b>0&&(y+=b,q++),A>0&&(y+=A,q++),C>0&&(y+=C,q++),I=q>0?Math.round(y/q):0}f[w.id]={q1:b,q2:A,q3:C,final:I,term:E}});const n=p[t(468)](w=>{const i=t,b=w[i(572)][i(450)]().toLowerCase();return[i(473),i(549),"general mathematics","general science",i(452),"pag-aaral ng kasaysayan at lipunang pilipino",i(501)][i(515)](C=>b.includes(C))}),N=n[t(468)](w=>{const i=S(w.subject_name);return i==="effectivecommunication"||i==="mabisangkomunikasyon"});let h=0,s=0,o=0,l=0,r;if(N.length>0){const w=N.find(D=>S(D[t(572)])==="effectivecommunication"),i=N[t(493)](D=>S(D.subject_name)==="mabisangkomunikasyon");w&&w.term?r=w.term:i&&i[t(647)]&&(r=i[t(647)]);const b=w?f[w.id]:null,A=i?f[i.id]:null,C=b?.q1||0,E=A?.q1||0;C>0&&E>0?h=Math.round((C+E)/2):C>0?h=C:E>0&&(h=E);const I=b?.q2||0,y=A?.q2||0;I>0&&y>0?s=Math[t(570)]((I+y)/2):I>0?s=I:y>0&&(s=y);const q=b?.q3||0,T=A?.q3||0;if(q>0&&T>0?o=Math[t(570)]((q+T)/2):q>0?o=q:T>0&&(o=T),r===1||Number(r)===1)l=h;else if(r===2||Number(r)===2)l=s;else if(r===3||Number(r)===3)l=o;else{let D=0,U=0;h>0&&(D+=h,U++),s>0&&(D+=s,U++),o>0&&(D+=o,U++),l=U>0?Math[t(570)](D/U):0}}const d={};d[t(544)]={q1:h>0?h[t(576)]():"",q2:s>0?s[t(576)]():"",q3:o>0?o[t(576)]():"",final:l>0?l[t(576)]():"",remarks:l>0?l>=75?"Passed":t(559):"",term:r},p.forEach(w=>{const i=t,b=f[w.id];d[w.id]={q1:b.q1>0?b.q1[i(576)]():"",q2:b.q2>0?b.q2[i(576)]():"",q3:b.q3>0?b.q3[i(576)]():"",final:b[i(650)]>0?b[i(650)][i(576)]():"",remarks:b[i(650)]>0?b[i(650)]>=75?i(506):i(559):"",term:b.term}});let c=0,_=0,P=0,Y=0,K=0,B=0,H=0,X=0;const x0=w=>{const i=t,b=p[i(493)](C=>C.id===w);if(!b)return!1;const A=S(b[i(572)]);return A===i(478)||A===i(600)};p[t(548)](w=>{const i=t;if(x0(w.id))return;const b=f[w.id];b.q1>0&&!V(b[i(647)],1)&&(c+=b.q1,_++),b.q2>0&&!V(b[i(647)],2)&&(P+=b.q2,Y++),b.q3>0&&!V(b[i(647)],3)&&(K+=b.q3,B++),b[i(650)]>0&&(H+=b[i(650)],X++)}),N[t(615)]>0&&(h>0&&!V(r,1)&&(c+=h,_++),s>0&&!V(r,2)&&(P+=s,Y++),o>0&&!V(r,3)&&(K+=o,B++),l>0&&(H+=l,X++));const G=_>0?Math.round(c/_)[t(576)]():"",Z=Y>0?Math.round(P/Y)[t(576)]():"",M=B>0?Math[t(570)](K/B)[t(576)]():"",a0=X>0?Math[t(570)](H/X)[t(576)]():"",s0=a0?Number(a0)>=75?"Passed":"Failed":"";return{subjectGrades:d,genAvg:a0,genRemarks:s0,genT1:G,genT2:Z,genT3:M}},[p,j,e.lrn,v]),L=(e.last_name+", "+e[x(584)]+" "+(e[x(523)]?e[x(523)][0]+".":""))[x(450)](),W=R[x(510)](()=>{const t=x;return L.length>35?t(598):L[t(615)]>25?t(668):t(517)},[L]),J=(t,f)=>{const n=x,N=t[n(615)];if(N===0)return{fontSize:n(554)};const h=f?158:170,s=.54,o=h/(N*s),l=Math[n(654)](7.5,Math[n(644)](10,o));return{fontSize:l[n(476)](2)+"px",lineHeight:l<8.5?"1":n(444)}},m=R[x(510)](()=>{const t=x,f=[],n=[];p[t(548)](d=>{const c=t,_=d[c(572)][c(450)]()[c(660)]();[c(473),c(549),c(602),c(657),c(452),"pag-aaral ng kasaysayan at lipunang pilipino",c(501)].some(Y=>_[c(532)](Y))?f[c(599)](d):n[c(599)](d)});const N=f[t(468)](d=>{const c=t,_=S(d[c(572)]);return _==="effectivecommunication"||_===c(600)}),h=f[t(468)](d=>{const c=S(d.subject_name);return c!=="effectivecommunication"&&c!=="mabisangkomunikasyon"}),s=t0(h,d=>d.subject_name),o=t0(n,d=>d.subject_name),l=[],r=[];if(N[t(615)]>0){const d=N[t(493)](P=>S(P.subject_name)===t(478)),c=N[t(493)](P=>S(P[t(572)])==="mabisangkomunikasyon"),_=d?.[t(647)]||c?.[t(647)];r.push({type:t(471),name:t(550),id:"parent_ec_mk",term:_}),d&&r.push({type:"subject",name:d[t(572)],id:d.id,isComponent:!0,term:d[t(647)]}),c&&r[t(599)]({type:t(606),name:c[t(572)],id:c.id,isComponent:!0,term:c[t(647)]})}return s[t(548)](d=>{const c=t;r[c(599)]({type:"subject",name:d[c(572)],id:d.id,term:d.term})}),r[t(615)]>0&&(l.push({type:t(545),name:t(516)}),l[t(599)](...r)),o[t(615)]>0&&(l[t(599)]({type:t(545),name:t(552)}),o[t(548)](d=>{const c=t;l[c(599)]({type:c(606),name:d.subject_name,id:d.id,term:d[c(647)]})})),l},[p]);return a[x(484)](x(581),{className:x(455),children:[a.jsxs(x(581),{className:x(565),children:[a[x(441)]("img",{src:Q,className:x(587),alt:x(604)}),a[x(484)]("div",{className:x(499),children:[a[x(441)]("p",{className:x(479),children:g.name}),a[x(484)]("p",{className:"uppercase text-[9px] font-normal tracking-wide mt-0.5",children:[x(487),v]}),a[x(441)]("h3",{className:x(659),children:x(614)})]}),a.jsx("img",{src:z,className:x(587),alt:x(656)})]}),a[x(484)]("div",{className:"mb-1.5 px-1 shrink-0 text-[9px]",children:[a[x(484)](x(581),{className:x(495),children:[a[x(441)]("span",{className:x(664),children:"Name:"}),a[x(441)]("span",{className:x(534)+W,children:L})]}),a[x(484)](x(581),{className:x(446),children:[a[x(484)](x(581),{className:x(447),children:[a[x(441)](x(502),{className:x(503),children:"LRN:"}),a[x(441)](x(502),{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none",children:e[x(462)]})]}),a[x(484)]("div",{className:"flex w-20",children:[a[x(441)](x(502),{className:x(543),children:x(593)}),a[x(441)]("span",{className:x(437),children:e[x(457)]||""})]})]}),a[x(484)]("div",{className:x(490),children:[a[x(484)](x(581),{className:x(447),children:[a[x(441)](x(502),{className:"w-15 shrink-0",children:x(533)}),a[x(441)]("span",{className:x(529),children:u?.[x(573)]?.replace(/Grade/i,"")[x(450)]()||""})]}),a[x(484)](x(581),{className:x(447),children:[a.jsx(x(502),{className:"w-10 shrink-0",children:x(578)}),a[x(441)](x(502),{className:x(619),children:u?.[x(438)]||""})]}),a[x(484)](x(581),{className:x(459),children:[a[x(441)](x(502),{className:x(492),children:"Track:"}),a[x(441)](x(502),{className:x(658),children:e[x(511)]||""})]})]})]}),a.jsx(x(581),{className:x(443),children:a.jsxs("table",{className:x(592),children:[a[x(484)]("thead",{children:[a[x(484)]("tr",{children:[a[x(441)]("th",{rowSpan:2,className:x(596),children:x(622)}),a[x(441)]("th",{colSpan:3,children:"TERM"}),a[x(441)]("th",{rowSpan:2,className:x(527),children:a.jsx("div",{className:x(585),children:"FINAL GRADE"})}),a.jsx("th",{rowSpan:2,className:x(553),children:x(530)})]}),a[x(484)]("tr",{children:[a[x(441)]("th",{className:x(608),children:"1"}),a[x(441)]("th",{className:x(608),children:"2"}),a[x(441)]("th",{className:x(608),children:"3"})]})]}),a[x(484)](x(555),{children:[m[x(453)]((t,f)=>{const n=x;if(t[n(500)]==="header")return a[n(441)]("tr",{children:a[n(441)]("td",{colSpan:6,style:{backgroundColor:n(538),fontWeight:n(464),textAlign:n(594),padding:n(505),fontSize:n(467),textTransform:n(629)},children:t.name})},n(607)+f);const N=t[n(500)]===n(471),h=N?n(544):t.id,s=k[n(525)][h]||{q1:"",q2:"",q3:"",final:"",remarks:""},o=!N&&t[n(465)];return a.jsxs("tr",{children:[a[n(441)]("td",{className:"subject-col "+n(o?579:472),style:{...J(t[n(626)],o),fontWeight:o?n(590):"bold"},children:t[n(626)]}),[1,2,3].map(l=>{const r=n;if(V(t.term,l))return a.jsx("td",{className:"q-col",style:{backgroundColor:r(538)},children:" "},l);const c=l===1?s.q1:l===2?s.q2:s.q3;return a[r(441)]("td",{className:r(608),children:c||" "},l)}),a[n(441)]("td",{className:n(649),children:s[n(650)]||" "}),a[n(441)]("td",{className:n(663),children:s[n(466)]||" "})]},h)}),a[x(441)]("tr",{style:{height:"2px"},children:a[x(441)]("td",{colSpan:6,style:{backgroundColor:x(653),height:"2px",padding:0,borderLeft:x(526),borderRight:x(526),borderTop:"1px solid black",borderBottom:x(526)}})}),a[x(484)]("tr",{children:[a[x(441)]("td",{className:x(645),children:x(531)}),a.jsx("td",{className:"q-col font-bold",children:k[x(541)]||" "}),a[x(441)]("td",{className:"q-col font-bold",children:k[x(539)]||" "}),a[x(441)]("td",{className:"q-col font-bold",children:k.genT3||" "}),a[x(441)]("td",{className:x(512),children:k[x(652)]||" "}),a[x(441)]("td",{className:x(635),children:k.genRemarks||" "})]})]})]})}),a.jsxs(x(581),{className:x(440),children:[a.jsx("p",{className:x(560),children:"Prepared by:"}),a[x(484)](x(581),{className:x(583),children:[g[x(588)]&&a[x(441)](x(581),{className:x(624),children:a[x(441)](x(558),{src:g[x(588)],alt:x(542),className:x(610)})}),a[x(441)](x(581),{className:"font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none",children:g[x(609)]||x(536)}),a[x(441)]("p",{className:x(632),children:x(436)})]})]})]})}export{_0 as TemporaryGradeSlipPage};
