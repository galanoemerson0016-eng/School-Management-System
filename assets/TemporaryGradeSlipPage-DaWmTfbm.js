import{r as G,j as a,cn as s0,bE as c0,c6 as l0,c9 as i0,cC as o0}from"./vendor-BhdFOiKe.js";import{b as d0,s as t0,n as S}from"./index-CopNxpzT.js";import"./vendor-pdf-libs-DsGp3SWi.js";import"./vendor-firebase-Disz2AMb.js";import"./vendor-framer-motion-CC-6_ZZ2.js";function e0(){const e=["bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer","trace","final-col font-bold","pag-aaral ng kasaysayan at lipunang pilipino","section_name","min","genT1","img","REMARKS","section_id","button","2410848GCcirt","text-[8px] mb-1 w-full text-center","215.9mm","span","tbody","flex flex-1","student_lrn","text-[7.5px] leading-tight","type","kasaysayan at lipunang pilipino","is_advisory","8px","warn","uppercase text-[9px]","isComponent","2672089gsLzXC","2rhFLIx","bind","subject_id","genT2","prototype","flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ","h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-100 shadow-sm print:hidden","w-10 text-[9px]","music","Zoom In","_________________________","Age:","letter","A4 Size (210 x 297mm)","flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5","pl-3 font-normal","jsxs","health","Folio / Long (8.5 x 13in)","flex-1 flex flex-col items-center justify-center text-center max-w-md","age","flex gap-4","2px","cut-cross","subject-col ","w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mb-6","Name:","none","gender","flex items-center justify-between mb-1.5 px-1 shrink-0","length","flex items-center gap-3","flex flex-[1.2]","effective communication","Adviser","trim","section_grade_level","folio","some","w-10 h-10 object-contain","life and career skills","final-col leading-tight","subject_name","General Average","slice","absolute -top-6 right-0 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden","parent","remarks-col text-[6.5px] tracking-tighter uppercase font-bold","w-10","toFixed","table","text-xs font-bold text-slate-900 w-12 text-center tabular-nums","p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600","info","school-forms","grade_level","1675128xufUdY","subjectGrades","w-45 mx-auto text-center mt-2.5 relative","bold","style","scale(","SCHOOL YEAR: ","19156ZLPfyH","push","genAvg","general science","remarks-col","No Advisory Class Set","Prepared by:","w-5 h-5","q-col font-bold","school_year","physical","flex items-center gap-6","97260nyTjdO","mabisangkomunikasyon","term","Letter (8.5 x 11in)","1467NCmGPu","print:w-full flex flex-col items-center gap-8 print:gap-0","value","Please set up your advisory grade level and section details in your Profile to generate temporary grade slips.","flex mb-0.5 items-baseline","effectivecommunication","mabisang komunikasyon","grade-slip-card font-serif text-[9px] relative text-black leading-tight","uppercase text-[9px] font-normal tracking-wide mt-0.5","Effective Communication & Mabisang Komunikasyon","general mathematics","round","text-[8px] italic mt-0.5","flex gap-4 mb-0.5","text-xl font-black text-slate-800 mb-2","h-full bg-slate-50 flex flex-col overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible","map","option","Passed","remarks","Student Resource Tool","flex-1 min-h-0 mb-1.5 px-1","filter","arts","print-preview-container print:w-full flex flex-col items-center transition-all duration-300 ease-out origin-top print:scale-100","mb-1.5 px-1 shrink-0 text-[9px]","exception","flex-1 border-b border-black font-bold leading-none text-center pb-0.5","210mm","track","find","final_grade","jsx","subject-col font-bold text-[10px] text-center pb-1 pt-1","div","h-8 w-px bg-slate-200 mx-2","Section:","Temporary Grade Slip",`;
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
                        size: `,"letter portrait","toLowerCase","font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none","sort","q-col","uppercase","w-10 shrink-0","DepEd","text-[10px] font-black text-orange-600 uppercase tracking-widest","lrn","normal","genRemarks","middle_name","cssSize","from","adviser_name","useState","Adviser Signature","330.2mm","text-[8.2px] leading-tight","left","flex-1 overflow-auto p-8 flex flex-col items-center bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible custom-scrollbar","LRN:","final","apply","name","logo_url","target","LEARNING AREAS",`;
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
            `,"96760OKnzSb","useEffect","subject-col","replace","subject","flex-1 border-b border-black font-bold pb-0.5 leading-none","return (function() ","useMemo","Electives","localeCompare","1.1","grade-table","603RLcIqf","genT3","text-center font-bold leading-none","print-page relative","w-3.5 h-3.5","parent_ec_mk","297mm","flex w-20","FINAL GRADE","Failed","quarter","constructor","print","w-min mx-auto","#E5E7EB","max-h-full max-w-full object-contain","error","Track:","Core Subjects","forEach","final-col","includes","h-11 px-6 rounded-xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2","TERM","width","8.5in 13in portrait","toString","School","text-[9px]","Grade Level:","black","flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200","w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm","school-logo.png","1075589BodRIG","console","ceil","all","Page ","Grade Slip","w-8","italic pl-3","absolute left-1/2 -translate-x-1/2 bottom-[14px] w-20 h-10 flex items-center justify-center pointer-events-none z-10","adviser_signature_url","10px","w-10 h-10 text-slate-400","last_name","remarks-col text-[6.5px] tracking-tighter uppercase","flex-1 border-b border-black font-bold leading-none pb-0.5 uppercase text-center","1px solid black","h-8 w-px bg-slate-200","header","mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center","font-bold","deped_logo_left.png","text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none","first_name","thead","Print Slips"];return e0=function(){return e},e0()}(function(e,_){const p=O,u=e();for(;;)try{if(-parseInt(p(365))/1*(parseInt(p(417))/2)+parseInt(p(331))/3*(-parseInt(p(480))/4)+parseInt(p(492))/5+parseInt(p(401))/6+parseInt(p(416))/7+parseInt(p(473))/8+-parseInt(p(496))/9*(-parseInt(p(319))/10)===_)break;u.push(u.shift())}catch{u.push(u.shift())}})(e0,551388);const $=(function(){let e=!0;return function(_,p){const u=e?function(){const j=O;if(p){const v=p[j(313)](_,arguments);return p=null,v}}:function(){};return e=!1,u}})(),n0=$(void 0,function(){const e=O;let _;try{_=Function(e(325)+'{}.constructor("return this")( ));')()}catch{_=window}const p=_[e(366)]=_[e(366)]||{},u=["log",e(413),e(470),e(347),e(276),e(467),e(391)];for(let j=0;j<u.length;j++){const v=$[e(342)][e(421)][e(418)]($),x=u[j],Y=p[x]||v;v.__proto__=$[e(418)]($),v[e(357)]=Y[e(357)][e(418)](Y),p[x]=v}});n0();function _0(){const e=O,{students:_,sections:p,subjects:u,schoolProfile:j,setCurrentView:v,gradingSheetRecords:x,activeSchoolYear:Y}=d0(),[T,J]=G[e(305)](""),[k,z]=G[e(305)](e(429)),[W,X]=G[e(305)](1),f=G[e(326)](()=>{const r=e;return[...p[r(272)](o=>o[r(411)]||o.is_advisory_class)][r(292)]((o,n)=>{const l=r,s=(o[l(453)]||"")[l(328)](n.section_grade_level||"",void 0,{numeric:!0});return s!==0?s:(o[l(394)]||"")[l(328)](n[l(394)]||"")})},[p]);G[e(320)](()=>{if(!T&&f.length>0){const r=setTimeout(()=>{const d=O;J(f[0][d(394)])},0);return()=>clearTimeout(r)}},[f,T]);const t=G[e(326)](()=>{const r=e;return T?_[r(272)](d=>d.student_section===T).sort((d,o)=>{const n=r;return d.gender!==o.gender?d[n(445)]==="Male"?-1:1:d[n(377)][n(328)](o[n(377)])}):[]},[_,T]),m=G[e(326)](()=>p[e(280)](d=>d.section_name===T||d.id===T),[p,T]),i=G[e(326)](()=>{const r=e;if(!m)return[];const d=parseInt(m[r(453)].replace(/\D/g,""))||0;let o=u.filter(n=>n[r(399)]===m.id&&n.term!=="none");return o[r(447)]===0&&(o=u[r(272)](n=>{const l=r,s=parseInt(n[l(472)]?.[l(357)]()[l(322)](/\D/g,"")||"0");return!n.section_id&&s===d&&n[l(494)]!==l(444)})),t0(o,n=>n[r(459)])},[u,m]),N=()=>{window[e(343)]()},h={a4:{height:e(337),width:e(278),cssSize:"A4 portrait"},letter:{height:"279.4mm",width:e(403),cssSize:e(289)},folio:{height:e(307),width:e(403),cssSize:e(356)}};return a[e(433)](e(284),{className:e(265),children:[a[e(282)](e(477),{children:`
                .print-page {
                    width: `+h[k][e(355)]+`;
                    height: `+h[k].height+e(288)+h[k][e(302)]+e(318)}),a[e(433)]("div",{className:e(423),children:[a.jsxs(e(284),{className:e(491),children:[a.jsx(e(400),{onClick:()=>v(e(471)),className:e(469),children:a[e(282)](s0,{className:e(487)})}),a[e(433)](e(284),{children:[a[e(282)]("h2",{className:"text-sm font-black text-slate-900 uppercase tracking-tight",children:e(287)}),a.jsx("p",{className:e(297),children:m?m[e(453)]+" - "+m[e(394)]:e(270)})]}),a[e(282)](e(284),{className:e(285)}),a[e(282)](e(284),{className:e(448),children:a[e(433)]("select",{className:e(390),value:k,onChange:r=>z(r[e(316)][e(498)]),children:[a.jsx("option",{value:e(429),children:e(495)}),a[e(282)](e(267),{value:"a4",children:e(430)}),a[e(282)](e(267),{value:e(454),children:e(435)})]})})]}),a[e(433)]("div",{className:"flex items-center gap-4",children:[a[e(433)](e(284),{className:e(362),children:[a[e(282)](e(400),{onClick:()=>X(r=>Math.max(.4,r-.1)),className:e(363),title:"Zoom Out",children:a[e(282)](c0,{className:e(335)})}),a[e(433)](e(404),{className:e(468),children:[Math[e(261)](W*100),"%"]}),a[e(282)](e(400),{onClick:()=>X(r=>Math[e(395)](1.5,r+.1)),className:e(363),title:e(426),children:a[e(282)](l0,{className:e(335)})})]}),a[e(282)]("div",{className:e(381)}),a.jsxs(e(400),{onClick:N,disabled:t[e(447)]===0,className:e(353),children:[a[e(282)](i0,{className:"w-4 h-4"}),e(389)]})]})]}),a[e(282)](e(284),{className:e(310),children:t[e(447)]>0?a.jsx(e(284),{className:e(274),style:{transform:e(478)+W+")"},children:a[e(282)](e(284),{className:e(497),children:Array[e(303)]({length:Math[e(367)](t[e(447)]/4)}).map((r,d)=>a.jsxs("div",{className:e(334),children:[a[e(433)](e(284),{className:e(462),children:[e(369),d+1," of ",Math[e(367)](t[e(447)]/4)]}),a.jsx(e(284),{className:e(440)}),t[e(461)](d*4,(d+1)*4).map(o=>{const n=e,l=parseInt(m?.section_grade_level?.[n(322)](/\D/g,"")||"0");return l===11||l===12?a[n(282)](f0,{student:o,schoolProfile:j,section:m,subjects:i,records:x,activeSchoolYear:Y},o[n(298)]):a[n(282)](b0,{student:o,schoolProfile:j,section:m,subjects:i,records:x,activeSchoolYear:Y},o[n(298)])})]},d))})}):a[e(433)](e(284),{className:e(436),children:[a.jsx(e(284),{className:e(442),children:a[e(282)](o0,{className:e(376)})}),a[e(282)]("h3",{className:e(264),children:e(485)}),a[e(282)]("p",{className:"text-sm text-slate-500 font-medium leading-relaxed",children:e(499)})]})})]})}function b0({student:e,schoolProfile:_,section:p,subjects:u,records:j,activeSchoolYear:v}){const x=O,Y="./",T=_.logo_url||"school-logo.png",J=Y+x(385),k=G[x(326)](()=>{const f=x,t={};let m=0,i=0;const N={t1:0,t2:0,t3:0},h={t1:0,t2:0,t3:0};u[f(350)](s=>{const g=f;let L="",D="",U="",B=0,H=0;for(let E=1;E<=3;E++){const V=j[g(280)](M=>M[g(407)]===e.lrn&&M[g(419)]===s.id&&Number(M.quarter)===E&&M[g(489)]===v);if(V&&V[g(281)]&&Number(V[g(281)])>0){const M=Number(V[g(281)]);E===1&&(L=M[g(357)](),N.t1+=M,h.t1++),E===2&&(D=M[g(357)](),N.t2+=M,h.t2++),E===3&&(U=M[g(357)](),N.t3+=M,h.t3++),B+=M,H++}}let K="",x0="";if(H>0){const E=Math[g(261)](B/H);K=E[g(357)](),m+=E,i++,x0=E>=75?g(268):g(340)}t[s.id]={q1:L,q2:D,q3:U,final:K,remarks:x0}});const r=i>0?Math[f(261)](m/i)[f(357)]():"",d=r?Number(r)>=75?f(268):f(340):"",o=h.t1>0?Math[f(261)](N.t1/h.t1)[f(357)]():"",n=h.t2>0?Math[f(261)](N.t2/h.t2)[f(357)]():"",l=h.t3>0?Math[f(261)](N.t3/h.t3)[f(357)]():"";return{subjectGrades:t,genAvg:r,genRemarks:d,genT1:o,genT2:n,genT3:l}},[u,j,e[x(298)],v]),z=(e[x(377)]+", "+e.first_name+" "+(e[x(301)]?e[x(301)][0]+".":""))[x(452)](),W=G[x(326)](()=>{const f=x;return z[f(447)]>35?f(408):z[f(447)]>25?f(308):f(359)},[z]),X=f=>{const t=x,m=f.length;if(m===0)return{fontSize:t(375)};const i=S(f)[t(352)](t(425))||S(f).includes(t(273))||S(f)[t(352)]("physical")||S(f).includes(t(434)),N=i?158:170,h=.54,r=N/(m*h),d=Math.max(7.5,Math[t(395)](10,r));return{fontSize:d[t(466)](2)+"px",lineHeight:d<8.5?"1":t(329)}};return a[x(433)](x(284),{className:"grade-slip-card font-serif text-[9px] relative text-black leading-tight",children:[a.jsxs(x(284),{className:x(446),children:[a[x(282)](x(397),{src:J,className:"w-10 h-10 object-contain",alt:"DepEd"}),a[x(433)](x(284),{className:x(333),children:[a[x(282)]("p",{className:x(414),children:_.name}),a[x(433)]("p",{className:x(504),children:[x(479),v]}),a.jsx("h3",{className:x(386),children:"Grade Slip"})]}),a[x(282)]("img",{src:T,className:x(456),alt:x(358)})]}),a.jsxs("div",{className:x(275),children:[a[x(433)](x(284),{className:x(500),children:[a.jsx("span",{className:x(424),children:x(443)}),a.jsx(x(404),{className:x(422)+W,children:z})]}),a[x(433)](x(284),{className:x(263),children:[a.jsxs(x(284),{className:x(406),children:[a[x(282)]("span",{className:x(465),children:"LRN:"}),a[x(282)]("span",{className:x(324),children:e.lrn})]}),a[x(433)]("div",{className:x(338),children:[a[x(282)]("span",{className:x(371),children:x(428)}),a[x(282)](x(404),{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none text-center",children:e[x(437)]||""})]})]}),a[x(433)]("div",{className:x(438),children:[a[x(433)](x(284),{className:x(406),children:[a[x(282)](x(404),{className:"w-15",children:"Grade Level:"}),a[x(282)](x(404),{className:"flex-1 border-b border-black font-bold leading-none text-center pb-0.5",children:p?.[x(453)]?.replace(/Grade/i,"")[x(452)]()||""})]}),a.jsxs(x(284),{className:x(406),children:[a[x(282)]("span",{className:"w-11.25",children:x(286)}),a[x(282)](x(404),{className:x(431),children:p?.[x(394)]||""})]})]})]}),a[x(282)](x(284),{className:x(271),children:a[x(433)](x(467),{className:x(330),children:[a[x(433)]("thead",{children:[a.jsxs("tr",{children:[a[x(282)]("th",{rowSpan:2,className:"subject-col",children:x(317)}),a.jsx("th",{colSpan:3,children:x(354)}),a[x(282)]("th",{rowSpan:2,className:x(458),children:a.jsx("div",{className:x(344),children:"FINAL GRADE"})}),a[x(282)]("th",{rowSpan:2,className:x(484),children:"REMARKS"})]}),a.jsxs("tr",{children:[a[x(282)]("th",{className:x(293),children:"1"}),a[x(282)]("th",{className:x(293),children:"2"}),a.jsx("th",{className:"q-col",children:"3"})]})]}),a[x(433)](x(405),{children:[u[x(266)](f=>{const t=x,m=k[t(474)][f.id],i=S(f.subject_name).includes(t(425))||S(f[t(459)]).includes("arts")||S(f[t(459)])[t(352)](t(490))||S(f[t(459)])[t(352)](t(434));return a[t(433)]("tr",{children:[a[t(282)]("td",{className:t(441)+(i?t(372):""),style:X(f[t(459)]),children:f[t(459)]}),a[t(282)]("td",{className:t(293),children:m.q1||" "}),a[t(282)]("td",{className:"q-col",children:m.q2||" "}),a[t(282)]("td",{className:t(293),children:m.q3||" "}),a[t(282)]("td",{className:t(351),children:m[t(312)]||" "}),a[t(282)]("td",{className:"remarks-col text-[6.5px] tracking-tighter uppercase",children:m[t(269)]||" "})]},f.id)}),a.jsx("tr",{style:{height:x(439)},children:a[x(282)]("td",{colSpan:6,style:{backgroundColor:x(361),height:x(439),padding:0,borderLeft:x(380),borderRight:x(380),borderTop:"1px solid black",borderBottom:x(380)}})}),a[x(433)]("tr",{children:[a[x(282)]("td",{className:x(283),children:x(460)}),a[x(282)]("td",{className:x(488),children:k.genT1||" "}),a.jsx("td",{className:x(488),children:k[x(420)]||" "}),a.jsx("td",{className:x(488),children:k[x(332)]||" "}),a.jsx("td",{className:x(392),children:k.genAvg||" "}),a[x(282)]("td",{className:x(464),children:k.genRemarks||" "})]})]})]})}),a[x(433)](x(284),{className:"mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center",children:[a[x(282)]("p",{className:x(402),children:x(486)}),a.jsxs("div",{className:x(475),children:[_[x(374)]&&a[x(282)](x(284),{className:x(373),children:a[x(282)]("img",{src:_.adviser_signature_url,alt:x(306),className:"max-h-full max-w-full object-contain"})}),a[x(282)](x(284),{className:x(291),children:_[x(304)]||x(427)}),a[x(282)]("p",{className:x(262),children:x(451)})]})]})]})}function O(e,_){return e=e-261,e0()[e]}function Z(e,_){const p=O;if(e===void 0||e===p(368)||e===p(444)||e===null)return!1;const u=Number(e);return isNaN(u)?!1:u!==_}function f0({student:e,schoolProfile:_,section:p,subjects:u,records:j,activeSchoolYear:v}){const x=O,Y="./",T=_[x(315)]||x(364),J=Y+"deped_logo_left.png",k=G[x(326)](()=>{const t=x,m={};u[t(350)](w=>{const c=t;let b=0,C=0,A=0;for(let y=1;y<=3;y++){const q=j[c(280)](R=>R[c(407)]===e.lrn&&R[c(419)]===w.id&&Number(R[c(341)])===y&&R[c(489)]===v);if(q&&q[c(281)]&&Number(q.final_grade)>0){const R=Number(q[c(281)]);y===1&&(b=R),y===2&&(C=R),y===3&&(A=R)}}const I=w[c(494)];let P=0;if(I===1||Number(I)===1)P=b;else if(I===2||Number(I)===2)P=C;else if(I===3||Number(I)===3)P=A;else{let y=0,q=0;b>0&&(y+=b,q++),C>0&&(y+=C,q++),A>0&&(y+=A,q++),P=q>0?Math[c(261)](y/q):0}m[w.id]={q1:b,q2:C,q3:A,final:P,term:I}});const i=u[t(272)](w=>{const c=t,b=w[c(459)].trim()[c(290)]();return[c(450),c(502),"general mathematics",c(483),c(457),c(393),c(410)][c(455)](A=>b.includes(A))}),N=i[t(272)](w=>{const c=t,b=S(w[c(459)]);return b===c(501)||b===c(493)});let h=0,r=0,d=0,o=0,n;if(N[t(447)]>0){const w=N[t(280)](F=>S(F[t(459)])===t(501)),c=N[t(280)](F=>S(F[t(459)])===t(493));w&&w.term?n=w[t(494)]:c&&c[t(494)]&&(n=c[t(494)]);const b=w?m[w.id]:null,C=c?m[c.id]:null,A=b?.q1||0,I=C?.q1||0;A>0&&I>0?h=Math[t(261)]((A+I)/2):A>0?h=A:I>0&&(h=I);const P=b?.q2||0,y=C?.q2||0;P>0&&y>0?r=Math[t(261)]((P+y)/2):P>0?r=P:y>0&&(r=y);const q=b?.q3||0,R=C?.q3||0;if(q>0&&R>0?d=Math[t(261)]((q+R)/2):q>0?d=q:R>0&&(d=R),n===1||Number(n)===1)o=h;else if(n===2||Number(n)===2)o=r;else if(n===3||Number(n)===3)o=d;else{let F=0,Q=0;h>0&&(F+=h,Q++),r>0&&(F+=r,Q++),d>0&&(F+=d,Q++),o=Q>0?Math[t(261)](F/Q):0}}const l={};l[t(336)]={q1:h>0?h[t(357)]():"",q2:r>0?r.toString():"",q3:d>0?d[t(357)]():"",final:o>0?o[t(357)]():"",remarks:o>0?o>=75?t(268):t(340):"",term:n},u[t(350)](w=>{const c=t,b=m[w.id];l[w.id]={q1:b.q1>0?b.q1[c(357)]():"",q2:b.q2>0?b.q2[c(357)]():"",q3:b.q3>0?b.q3[c(357)]():"",final:b[c(312)]>0?b[c(312)][c(357)]():"",remarks:b[c(312)]>0?b[c(312)]>=75?"Passed":c(340):"",term:b[c(494)]}});let s=0,g=0,L=0,D=0,U=0,B=0,H=0,K=0;const x0=w=>{const c=t,b=u[c(280)](A=>A.id===w);if(!b)return!1;const C=S(b.subject_name);return C==="effectivecommunication"||C===c(493)};u[t(350)](w=>{const c=t;if(x0(w.id))return;const b=m[w.id];b.q1>0&&!Z(b[c(494)],1)&&(s+=b.q1,g++),b.q2>0&&!Z(b[c(494)],2)&&(L+=b.q2,D++),b.q3>0&&!Z(b[c(494)],3)&&(U+=b.q3,B++),b.final>0&&(H+=b[c(312)],K++)}),N[t(447)]>0&&(h>0&&!Z(n,1)&&(s+=h,g++),r>0&&!Z(n,2)&&(L+=r,D++),d>0&&!Z(n,3)&&(U+=d,B++),o>0&&(H+=o,K++));const E=g>0?Math[t(261)](s/g)[t(357)]():"",V=D>0?Math[t(261)](L/D).toString():"",M=B>0?Math[t(261)](U/B)[t(357)]():"",a0=K>0?Math[t(261)](H/K)[t(357)]():"",r0=a0?Number(a0)>=75?t(268):t(340):"";return{subjectGrades:l,genAvg:a0,genRemarks:r0,genT1:E,genT2:V,genT3:M}},[u,j,e[x(298)],v]),z=(e[x(377)]+", "+e[x(387)]+" "+(e.middle_name?e[x(301)][0]+".":""))[x(452)](),W=G[x(326)](()=>{const t=x;return z[t(447)]>35?t(408):z.length>25?"text-[8.2px] leading-tight":t(359)},[z]),X=(t,m)=>{const i=x,N=t[i(447)];if(N===0)return{fontSize:i(375)};const h=m?158:170,r=.54,d=h/(N*r),o=Math.max(7.5,Math[i(395)](10,d));return{fontSize:o[i(466)](2)+"px",lineHeight:o<8.5?"1":i(329)}},f=G[x(326)](()=>{const t=x,m=[],i=[];u[t(350)](l=>{const s=t,g=l[s(459)][s(452)]()[s(290)]();[s(450),s(502),s(506),s(483),s(457),"pag-aaral ng kasaysayan at lipunang pilipino",s(410)][s(455)](D=>g[s(352)](D))?m[s(481)](l):i.push(l)});const N=m.filter(l=>{const s=t,g=S(l[s(459)]);return g===s(501)||g===s(493)}),h=m[t(272)](l=>{const s=t,g=S(l.subject_name);return g!==s(501)&&g!==s(493)}),r=t0(h,l=>l[t(459)]),d=t0(i,l=>l[t(459)]),o=[],n=[];if(N[t(447)]>0){const l=N[t(280)](L=>S(L[t(459)])===t(501)),s=N.find(L=>S(L[t(459)])===t(493)),g=l?.[t(494)]||s?.[t(494)];n[t(481)]({type:t(463),name:t(505),id:t(336),term:g}),l&&n[t(481)]({type:t(323),name:l[t(459)],id:l.id,isComponent:!0,term:l[t(494)]}),s&&n[t(481)]({type:t(323),name:s.subject_name,id:s.id,isComponent:!0,term:s[t(494)]})}return r[t(350)](l=>{const s=t;n[s(481)]({type:s(323),name:l[s(459)],id:l.id,term:l[s(494)]})}),n[t(447)]>0&&(o[t(481)]({type:t(382),name:t(349)}),o[t(481)](...n)),d[t(447)]>0&&(o[t(481)]({type:"header",name:t(327)}),d.forEach(l=>{const s=t;o[s(481)]({type:"subject",name:l.subject_name,id:l.id,term:l[s(494)]})})),o},[u]);return a.jsxs("div",{className:x(503),children:[a[x(433)](x(284),{className:x(446),children:[a[x(282)](x(397),{src:J,className:x(456),alt:x(296)}),a[x(433)]("div",{className:x(333),children:[a[x(282)]("p",{className:x(414),children:_[x(314)]}),a[x(433)]("p",{className:x(504),children:[x(479),v]}),a[x(282)]("h3",{className:x(386),children:x(370)})]}),a[x(282)](x(397),{src:T,className:x(456),alt:"School"})]}),a[x(433)]("div",{className:"mb-1.5 px-1 shrink-0 text-[9px]",children:[a[x(433)]("div",{className:x(500),children:[a.jsx("span",{className:"w-10 text-[9px]",children:"Name:"}),a[x(282)](x(404),{className:x(422)+W,children:z})]}),a[x(433)](x(284),{className:"flex gap-4 mb-0.5",children:[a[x(433)](x(284),{className:x(406),children:[a[x(282)](x(404),{className:"w-10",children:x(311)}),a[x(282)](x(404),{className:x(324),children:e.lrn})]}),a.jsxs(x(284),{className:x(338),children:[a[x(282)](x(404),{className:x(371),children:x(428)}),a[x(282)]("span",{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none text-center",children:e[x(437)]||""})]})]}),a[x(433)](x(284),{className:"flex gap-4",children:[a[x(433)](x(284),{className:"flex flex-1",children:[a[x(282)](x(404),{className:"w-15 shrink-0",children:x(360)}),a[x(282)](x(404),{className:x(277),children:p?.section_grade_level?.[x(322)](/Grade/i,"")[x(452)]()||""})]}),a.jsxs(x(284),{className:x(406),children:[a[x(282)](x(404),{className:x(295),children:x(286)}),a[x(282)](x(404),{className:x(431),children:p?.[x(394)]||""})]}),a[x(433)](x(284),{className:x(449),children:[a.jsx(x(404),{className:x(295),children:x(348)}),a[x(282)]("span",{className:x(379),children:e[x(279)]||""})]})]})]}),a.jsx(x(284),{className:x(271),children:a[x(433)](x(467),{className:x(330),children:[a[x(433)](x(388),{children:[a[x(433)]("tr",{children:[a[x(282)]("th",{rowSpan:2,className:x(321),children:"LEARNING AREAS"}),a[x(282)]("th",{colSpan:3,children:x(354)}),a[x(282)]("th",{rowSpan:2,className:"final-col leading-tight",children:a.jsx("div",{className:x(344),children:x(339)})}),a[x(282)]("th",{rowSpan:2,className:x(484),children:x(398)})]}),a[x(433)]("tr",{children:[a.jsx("th",{className:x(293),children:"1"}),a.jsx("th",{className:"q-col",children:"2"}),a[x(282)]("th",{className:x(293),children:"3"})]})]}),a[x(433)](x(405),{children:[f[x(266)]((t,m)=>{const i=x;if(t.type===i(382))return a[i(282)]("tr",{children:a.jsx("td",{colSpan:6,style:{backgroundColor:i(345),fontWeight:i(476),textAlign:i(309),padding:"2px 4px",fontSize:i(412),textTransform:i(294)},children:t[i(314)]})},"header-"+m);const N=t[i(409)]===i(463),h=N?i(336):t.id,r=k.subjectGrades[h]||{q1:"",q2:"",q3:"",final:"",remarks:""},d=!N&&t[i(415)];return a[i(433)]("tr",{children:[a.jsx("td",{className:i(441)+i(d?432:384),style:{...X(t[i(314)],d),fontWeight:i(d?299:476)},children:t.name}),[1,2,3][i(266)](o=>{const n=i;if(Z(t[n(494)],o))return a[n(282)]("td",{className:n(293),style:{backgroundColor:n(345)},children:" "},o);const s=o===1?r.q1:o===2?r.q2:r.q3;return a.jsx("td",{className:n(293),children:s||" "},o)}),a.jsx("td",{className:"final-col",children:r.final||" "}),a.jsx("td",{className:i(378),children:r[i(269)]||" "})]},h)}),a[x(282)]("tr",{style:{height:x(439)},children:a.jsx("td",{colSpan:6,style:{backgroundColor:"black",height:x(439),padding:0,borderLeft:x(380),borderRight:"1px solid black",borderTop:x(380),borderBottom:x(380)}})}),a[x(433)]("tr",{children:[a[x(282)]("td",{className:x(283),children:x(460)}),a[x(282)]("td",{className:x(488),children:k[x(396)]||" "}),a.jsx("td",{className:x(488),children:k[x(420)]||" "}),a.jsx("td",{className:x(488),children:k[x(332)]||" "}),a[x(282)]("td",{className:x(392),children:k[x(482)]||" "}),a[x(282)]("td",{className:x(464),children:k[x(300)]||" "})]})]})]})}),a[x(433)](x(284),{className:x(383),children:[a[x(282)]("p",{className:x(402),children:"Prepared by:"}),a[x(433)](x(284),{className:"w-45 mx-auto text-center mt-2.5 relative",children:[_[x(374)]&&a[x(282)](x(284),{className:x(373),children:a[x(282)](x(397),{src:_[x(374)],alt:"Adviser Signature",className:x(346)})}),a[x(282)](x(284),{className:x(291),children:_[x(304)]||x(427)}),a.jsx("p",{className:"text-[8px] italic mt-0.5",children:x(451)})]})]})]})}export{_0 as TemporaryGradeSlipPage};
