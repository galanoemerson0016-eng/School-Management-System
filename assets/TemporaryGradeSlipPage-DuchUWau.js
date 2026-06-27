import{r as T,j as a,cn as s0,bE as c0,c6 as l0,c9 as i0,cC as d0}from"./vendor-BhdFOiKe.js";import{b as o0,s as t0,n as S}from"./index-DBaz-sYs.js";import"./vendor-pdf-libs-DsGp3SWi.js";import"./vendor-firebase-Disz2AMb.js";import"./vendor-framer-motion-CC-6_ZZ2.js";function e0(){const e=["uppercase text-[9px] font-normal tracking-wide mt-0.5","w-4 h-4","effectivecommunication",'{}.constructor("return this")( )',"print:w-full flex flex-col items-center gap-8 print:gap-0","left","letter portrait","div","trace","all","genT3"," of ","9AytNxZ","header-","flex-1 border-b border-black font-bold pb-0.5 leading-none","No Advisory Class Set","student_section","h-11 px-6 rounded-xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2","w-15 shrink-0","return (function() ","music","folio","letter","button","Section:","text-[10px] font-black text-orange-600 uppercase tracking-widest",`;
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
                        size: `,"flex mb-0.5 items-baseline","h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-100 shadow-sm print:hidden","info","flex-1 min-h-0 mb-1.5 px-1","name","map","from","text-[7.5px] leading-tight","General Average","flex flex-[1.2]","genAvg","Failed","is_advisory","arts","final-col font-bold","flex w-20","final","student_lrn","Student Resource Tool",`
                .print-page {
                    width: `,"section_id","cssSize","_________________________","final-col","trim","width","remarks-col text-[6.5px] tracking-tighter uppercase font-bold","Effective Communication & Mabisang Komunikasyon","text-sm font-black text-slate-900 uppercase tracking-tight","1312500JKhDwb","push","8.5in 13in portrait","w-5 h-5","jsx","Male","flex gap-4","Adviser","flex items-center justify-between mb-1.5 px-1 shrink-0","school-logo.png","middle_name","final-col leading-tight","w-45 mx-auto text-center mt-2.5","Temporary Grade Slip","table","FINAL GRADE","tbody","toFixed","term","section_grade_level","TERM","slice","span","mabisang komunikasyon","thead","Letter (8.5 x 11in)","q-col","life and career skills","210mm","jsxs","lrn","w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mb-6","toLowerCase","useMemo","genRemarks","section_name","gender","1607186pwXWDL","text-xl font-black text-slate-800 mb-2","remarks-col","flex-1 border-b border-black font-bold leading-none text-center pb-0.5","DepEd","p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600",`;
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
            `,"select","print","bold","flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5","4379094ZVIGVt","REMARKS","target","kasaysayan at lipunang pilipino","grade-table","School","flex items-center gap-6","length","warn","genT1","1px solid black","Please set up your advisory grade level and section details in your Profile to generate temporary grade slips.","text-[8px] mb-1 w-full text-center","w-10 h-10 text-slate-400","mb-1.5 px-1 shrink-0 text-[9px]","w-15","parent","age","flex gap-4 mb-0.5","find","forEach","text-[9px]","remarks","some","subjectGrades","italic pl-3","black","sort","text-xs font-bold text-slate-900 w-12 text-center tabular-nums","LRN:","subject","effective communication","img","cut-cross","includes","Zoom In","font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none","max","school_year","w-min mx-auto","value","is_advisory_class","Passed","bind","flex-1 border-b border-black font-bold pb-0.5 leading-none text-center","330.2mm","w-3.5 h-3.5","w-10 shrink-0","2px 4px","109955AQLnOD","899776ttIYvt","isComponent","w-10 text-[9px]","first_name","exception","flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ","toString","flex items-center gap-4","subject_id","h-full bg-slate-50 flex flex-col overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible","uppercase text-[9px]","LEARNING AREAS","Grade Slip","685944VGEmIQ","w-10","general mathematics","grade_level","type","flex items-center gap-3","flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200","localeCompare","w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm","none","replace","flex-1 overflow-auto p-8 flex flex-col items-center bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible custom-scrollbar","subject-col ","flex flex-1","1.1","print-page relative","final_grade","Name:",`;
                    height: `,"279.4mm","pl-3 font-normal","q-col font-bold","297mm","A4 Size (210 x 297mm)","Prepared by:","text-sm text-slate-500 font-medium leading-relaxed","A4 portrait","genT2","height","general science","388582eqRMih","h-8 w-px bg-slate-200","SCHOOL YEAR: ","8px","pag-aaral ng kasaysayan at lipunang pilipino","last_name","logo_url","console","apply","Grade Level:","physical","absolute -top-6 right-0 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden","2px","grade-slip-card font-serif text-[9px] relative text-black leading-tight","school-forms","font-bold","quarter","health","ceil","error","Age:","10px","parent_ec_mk","text-[8px] italic mt-0.5","text-center font-bold leading-none","round","Core Subjects","filter","useState","option","min","adviser_name","subject-col font-bold text-[10px] text-center pb-1 pt-1","12RhpMjS","text-[8.2px] leading-tight","subject_name"," - ","subject-col","header","mabisangkomunikasyon","w-10 h-10 object-contain","deped_logo_left.png","flex-1 flex flex-col items-center justify-center text-center max-w-md","Folio / Long (8.5 x 13in)","remarks-col text-[6.5px] tracking-tighter uppercase"];return e0=function(){return e},e0()}(function(e,N){const u=B,b=e();for(;;)try{if(parseInt(u(411))/1+-parseInt(u(213))/2*(parseInt(u(270))/3)+parseInt(u(425))/4+-parseInt(u(314))/5*(-parseInt(u(246))/6)+-parseInt(u(351))/7+-parseInt(u(412))/8+parseInt(u(362))/9===N)break;b.push(b.shift())}catch{b.push(b.shift())}})(e0,368064);const $=(function(){let e=!0;return function(N,u){const b=e?function(){const k=B;if(u){const j=u[k(221)](N,arguments);return u=null,j}}:function(){};return e=!1,b}})(),r0=$(void 0,function(){const e=B;let N;try{N=Function(e(277)+e(261)+");")()}catch{N=window}const u=N[e(220)]=N.console||{},b=["log",e(370),e(287),e(232),e(416),e(328),e(266)];for(let k=0;k<b[e(369)];k++){const j=$.constructor.prototype[e(405)]($),x=b[k],D=u[x]||j;j.__proto__=$[e(405)]($),j[e(418)]=D[e(418)][e(405)](D),u[x]=j}});r0();function B(e,N){return e=e-195,e0()[e]}function _0(){const e=B,{students:N,sections:u,subjects:b,schoolProfile:k,setCurrentView:j,gradingSheetRecords:x,activeSchoolYear:D}=o0(),[R,J]=T[e(241)](""),[v,z]=T.useState(e(280)),[K,W]=T[e(241)](1),f=T[e(347)](()=>{const n=e;return[...u[n(240)](c=>c[n(297)]||c[n(403)])].sort((c,r)=>{const d=n,s=(c[d(333)]||"").localeCompare(r[d(333)]||"",void 0,{numeric:!0});return s!==0?s:(c[d(349)]||"")[d(432)](r.section_name||"")})},[u]);T.useEffect(()=>{const n=e;if(!R&&f[n(369)]>0){const o=setTimeout(()=>{const c=n;J(f[0][c(349)])},0);return()=>clearTimeout(o)}},[f,R]);const t=T.useMemo(()=>{const n=e;return R?N[n(240)](o=>o[n(274)]===R)[n(389)]((o,c)=>{const r=n;return o[r(350)]!==c[r(350)]?o[r(350)]===r(319)?-1:1:o[r(218)].localeCompare(c.last_name)}):[]},[N,R]),h=T.useMemo(()=>{const n=e;return u.find(o=>o[n(349)]===R||o.id===R)},[u,R]),l=T[e(347)](()=>{const n=e;if(!h)return[];const o=parseInt(h[n(333)][n(435)](/\D/g,""))||0;let c=b[n(240)](r=>r.section_id===h.id&&r.term!==n(434));return c[n(369)]===0&&(c=b[n(240)](r=>{const d=n,s=parseInt(r[d(428)]?.[d(418)]()[d(435)](/\D/g,"")||"0");return!r[d(305)]&&s===o&&r.term!=="none"})),t0(c,r=>r[n(248)])},[b,h]),_=()=>{window[e(359)]()},p={a4:{height:e(205),width:e(342),cssSize:e(209)},letter:{height:e(202),width:"215.9mm",cssSize:e(264)},folio:{height:e(407),width:"215.9mm",cssSize:e(316)}};return a[e(343)](e(265),{className:e(421),children:[a[e(318)]("style",{children:e(304)+p[v][e(310)]+e(201)+p[v][e(211)]+e(284)+p[v][e(306)]+e(357)}),a[e(343)](e(265),{className:e(286),children:[a.jsxs(e(265),{className:e(368),children:[a[e(318)](e(281),{onClick:()=>j(e(227)),className:e(356),children:a[e(318)](s0,{className:e(317)})}),a[e(343)](e(265),{children:[a[e(318)]("h2",{className:e(313),children:e(327)}),a[e(318)]("p",{className:e(283),children:h?h[e(333)]+e(249)+h[e(349)]:e(303)})]}),a.jsx(e(265),{className:"h-8 w-px bg-slate-200 mx-2"}),a[e(318)](e(265),{className:e(430),children:a[e(343)](e(358),{className:"bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer",value:v,onChange:n=>z(n[e(364)][e(402)]),children:[a.jsx(e(242),{value:e(280),children:e(339)}),a[e(318)](e(242),{value:"a4",children:e(206)}),a[e(318)](e(242),{value:e(279),children:e(256)})]})})]}),a[e(343)]("div",{className:e(419),children:[a[e(343)]("div",{className:e(431),children:[a[e(318)](e(281),{onClick:()=>W(n=>Math.max(.4,n-.1)),className:"w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm",title:"Zoom Out",children:a[e(318)](c0,{className:e(408)})}),a[e(343)]("span",{className:e(390),children:[Math[e(238)](K*100),"%"]}),a[e(318)](e(281),{onClick:()=>W(n=>Math[e(243)](1.5,n+.1)),className:e(433),title:e(397),children:a.jsx(l0,{className:e(408)})})]}),a[e(318)]("div",{className:e(214)}),a[e(343)](e(281),{onClick:_,disabled:t[e(369)]===0,className:e(275),children:[a.jsx(i0,{className:e(259)}),"Print Slips"]})]})]}),a.jsx(e(265),{className:e(436),children:t.length>0?a[e(318)](e(265),{className:"print-preview-container print:w-full flex flex-col items-center transition-all duration-300 ease-out origin-top print:scale-100",style:{transform:"scale("+K+")"},children:a.jsx(e(265),{className:e(262),children:Array[e(291)]({length:Math[e(231)](t[e(369)]/4)}).map((n,o)=>a[e(343)](e(265),{className:e(198),children:[a[e(343)](e(265),{className:e(224),children:["Page ",o+1,e(269),Math[e(231)](t.length/4)]}),a.jsx(e(265),{className:e(395)}),t[e(335)](o*4,(o+1)*4)[e(290)](c=>{const r=e,d=parseInt(h?.[r(333)]?.[r(435)](/\D/g,"")||"0");return d===11||d===12?a[r(318)](h0,{student:c,schoolProfile:k,section:h,subjects:l,records:x,activeSchoolYear:D},c[r(344)]):a[r(318)](m0,{student:c,schoolProfile:k,section:h,subjects:l,records:x,activeSchoolYear:D},c[r(344)])})]},o))})}):a[e(343)](e(265),{className:e(255),children:[a[e(318)]("div",{className:e(345),children:a[e(318)](d0,{className:e(375)})}),a.jsx("h3",{className:e(352),children:e(273)}),a[e(318)]("p",{className:e(208),children:e(373)})]})})]})}function m0({student:e,schoolProfile:N,section:u,subjects:b,records:k,activeSchoolYear:j}){const x=B,D="./",R=N.logo_url||x(323),J=D+x(254),v=T[x(347)](()=>{const f=x,t={};let h=0,l=0;const _={t1:0,t2:0,t3:0},p={t1:0,t2:0,t3:0};b[f(382)](s=>{const g=f;let P="",F="",Q="",O=0,V=0;for(let G=1;G<=3;G++){const X=k[g(381)](M=>M[g(302)]===e[g(344)]&&M.subject_id===s.id&&Number(M[g(229)])===G&&M[g(400)]===j);if(X&&X[g(199)]&&Number(X[g(199)])>0){const M=Number(X[g(199)]);G===1&&(P=M[g(418)](),_.t1+=M,p.t1++),G===2&&(F=M[g(418)](),_.t2+=M,p.t2++),G===3&&(Q=M[g(418)](),_.t3+=M,p.t3++),O+=M,V++}}let Z="",x0="";if(V>0){const G=Math[g(238)](O/V);Z=G.toString(),h+=G,l++,x0=G>=75?g(404):g(296)}t[s.id]={q1:P,q2:F,q3:Q,final:Z,remarks:x0}});const n=l>0?Math[f(238)](h/l).toString():"",o=n?Number(n)>=75?"Passed":f(296):"",c=p.t1>0?Math[f(238)](_.t1/p.t1)[f(418)]():"",r=p.t2>0?Math[f(238)](_.t2/p.t2)[f(418)]():"",d=p.t3>0?Math.round(_.t3/p.t3)[f(418)]():"";return{subjectGrades:t,genAvg:n,genRemarks:o,genT1:c,genT2:r,genT3:d}},[b,k,e.lrn,j]),z=(e[x(218)]+", "+e[x(415)]+" "+(e[x(324)]?e[x(324)][0]+".":"")).trim(),K=T.useMemo(()=>{const f=x;return z.length>35?f(292):z[f(369)]>25?f(247):"text-[9px]"},[z]),W=f=>{const t=x,h=f[t(369)];if(h===0)return{fontSize:t(234)};const l=S(f)[t(396)](t(278))||S(f)[t(396)](t(298))||S(f).includes(t(223))||S(f)[t(396)]("health"),_=l?158:170,p=.54,n=_/(h*p),o=Math[t(399)](7.5,Math[t(243)](10,n));return{fontSize:o[t(331)](2)+"px",lineHeight:o<8.5?"1":"1.1"}};return a.jsxs("div",{className:x(226),children:[a[x(343)](x(265),{className:x(322),children:[a[x(318)](x(394),{src:J,className:x(253),alt:x(355)}),a[x(343)]("div",{className:x(237),children:[a[x(318)]("p",{className:x(422),children:N[x(289)]}),a[x(343)]("p",{className:x(258),children:[x(215),j]}),a.jsx("h3",{className:"text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none",children:x(424)})]}),a.jsx(x(394),{src:R,className:x(253),alt:"School"})]}),a[x(343)]("div",{className:x(376),children:[a[x(343)]("div",{className:x(285),children:[a[x(318)]("span",{className:x(414),children:x(200)}),a[x(318)](x(336),{className:x(417)+K,children:z})]}),a.jsxs(x(265),{className:x(380),children:[a[x(343)](x(265),{className:x(196),children:[a[x(318)](x(336),{className:x(426),children:x(391)}),a[x(318)](x(336),{className:x(272),children:e.lrn})]}),a[x(343)](x(265),{className:x(300),children:[a[x(318)](x(336),{className:"w-8",children:x(233)}),a[x(318)](x(336),{className:x(406),children:e[x(379)]||""})]})]}),a[x(343)](x(265),{className:x(320),children:[a.jsxs(x(265),{className:x(196),children:[a[x(318)](x(336),{className:x(377),children:x(222)}),a.jsx(x(336),{className:x(354),children:u?.section_grade_level?.[x(435)](/Grade/i,"").trim()||""})]}),a[x(343)](x(265),{className:x(196),children:[a[x(318)](x(336),{className:"w-11.25",children:x(282)}),a[x(318)](x(336),{className:x(361),children:u?.[x(349)]||""})]})]})]}),a[x(318)]("div",{className:x(288),children:a.jsxs(x(328),{className:x(366),children:[a[x(343)](x(338),{children:[a[x(343)]("tr",{children:[a[x(318)]("th",{rowSpan:2,className:x(250),children:x(423)}),a.jsx("th",{colSpan:3,children:"TERM"}),a[x(318)]("th",{rowSpan:2,className:x(325),children:a[x(318)]("div",{className:x(401),children:x(329)})}),a.jsx("th",{rowSpan:2,className:x(353),children:x(363)})]}),a[x(343)]("tr",{children:[a[x(318)]("th",{className:x(340),children:"1"}),a[x(318)]("th",{className:"q-col",children:"2"}),a.jsx("th",{className:x(340),children:"3"})]})]}),a.jsxs(x(330),{children:[b[x(290)](f=>{const t=x,h=v[t(386)][f.id],l=S(f.subject_name)[t(396)](t(278))||S(f[t(248)])[t(396)](t(298))||S(f[t(248)])[t(396)]("physical")||S(f[t(248)]).includes(t(230));return a[t(343)]("tr",{children:[a[t(318)]("td",{className:t(195)+(l?t(387):""),style:W(f[t(248)]),children:f[t(248)]}),a[t(318)]("td",{className:t(340),children:h.q1||" "}),a[t(318)]("td",{className:"q-col",children:h.q2||" "}),a[t(318)]("td",{className:t(340),children:h.q3||" "}),a[t(318)]("td",{className:t(308),children:h[t(301)]||" "}),a[t(318)]("td",{className:t(257),children:h[t(384)]||" "})]},f.id)}),a[x(318)]("tr",{style:{height:"2px"},children:a[x(318)]("td",{colSpan:6,style:{backgroundColor:x(388),height:x(225),padding:0,borderLeft:x(372),borderRight:x(372),borderTop:x(372),borderBottom:x(372)}})}),a[x(343)]("tr",{children:[a[x(318)]("td",{className:"subject-col font-bold text-[10px] text-center pb-1 pt-1",children:x(293)}),a[x(318)]("td",{className:x(204),children:v[x(371)]||" "}),a[x(318)]("td",{className:"q-col font-bold",children:v.genT2||" "}),a[x(318)]("td",{className:x(204),children:v[x(268)]||" "}),a[x(318)]("td",{className:x(299),children:v[x(295)]||" "}),a[x(318)]("td",{className:"remarks-col text-[6.5px] tracking-tighter uppercase font-bold",children:v[x(348)]||" "})]})]})]})}),a[x(343)]("div",{className:"mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center",children:[a[x(318)]("p",{className:x(374),children:x(207)}),a.jsxs(x(265),{className:x(326),children:[a[x(318)](x(265),{className:"font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none",children:N.adviser_name||x(307)}),a[x(318)]("p",{className:x(236),children:"Adviser"})]})]})]})}function H(e,N){if(e===void 0||e===B(267)||e==="none"||e===null)return!1;const b=Number(e);return isNaN(b)?!1:b!==N}function h0({student:e,schoolProfile:N,section:u,subjects:b,records:k,activeSchoolYear:j}){const x=B,D="./",R=N[x(219)]||x(323),J=D+x(254),v=T[x(347)](()=>{const t=x,h={};b[t(382)](w=>{const i=t;let m=0,A=0,C=0;for(let y=1;y<=3;y++){const q=k[i(381)](E=>E[i(302)]===e[i(344)]&&E[i(420)]===w.id&&Number(E[i(229)])===y&&E[i(400)]===j);if(q&&q[i(199)]&&Number(q.final_grade)>0){const E=Number(q[i(199)]);y===1&&(m=E),y===2&&(A=E),y===3&&(C=E)}}const I=w[i(332)];let L=0;if(I===1||Number(I)===1)L=m;else if(I===2||Number(I)===2)L=A;else if(I===3||Number(I)===3)L=C;else{let y=0,q=0;m>0&&(y+=m,q++),A>0&&(y+=A,q++),C>0&&(y+=C,q++),L=q>0?Math[i(238)](y/q):0}h[w.id]={q1:m,q2:A,q3:C,final:L,term:I}});const l=b.filter(w=>{const i=t,m=w[i(248)][i(309)]()[i(346)]();return["effective communication","mabisang komunikasyon","general mathematics",i(212),i(341),i(217),i(365)][i(385)](C=>m.includes(C))}),_=l[t(240)](w=>{const i=t,m=S(w[i(248)]);return m===i(260)||m===i(252)});let p=0,n=0,o=0,c=0,r;if(_.length>0){const w=_[t(381)](Y=>S(Y[t(248)])===t(260)),i=_[t(381)](Y=>S(Y[t(248)])===t(252));w&&w[t(332)]?r=w[t(332)]:i&&i[t(332)]&&(r=i[t(332)]);const m=w?h[w.id]:null,A=i?h[i.id]:null,C=m?.q1||0,I=A?.q1||0;C>0&&I>0?p=Math.round((C+I)/2):C>0?p=C:I>0&&(p=I);const L=m?.q2||0,y=A?.q2||0;L>0&&y>0?n=Math[t(238)]((L+y)/2):L>0?n=L:y>0&&(n=y);const q=m?.q3||0,E=A?.q3||0;if(q>0&&E>0?o=Math[t(238)]((q+E)/2):q>0?o=q:E>0&&(o=E),r===1||Number(r)===1)c=p;else if(r===2||Number(r)===2)c=n;else if(r===3||Number(r)===3)c=o;else{let Y=0,U=0;p>0&&(Y+=p,U++),n>0&&(Y+=n,U++),o>0&&(Y+=o,U++),c=U>0?Math[t(238)](Y/U):0}}const d={};d[t(235)]={q1:p>0?p.toString():"",q2:n>0?n[t(418)]():"",q3:o>0?o[t(418)]():"",final:c>0?c[t(418)]():"",remarks:c>0?c>=75?"Passed":"Failed":"",term:r},b[t(382)](w=>{const i=t,m=h[w.id];d[w.id]={q1:m.q1>0?m.q1[i(418)]():"",q2:m.q2>0?m.q2[i(418)]():"",q3:m.q3>0?m.q3.toString():"",final:m[i(301)]>0?m[i(301)].toString():"",remarks:m[i(301)]>0?m.final>=75?i(404):"Failed":"",term:m[i(332)]}});let s=0,g=0,P=0,F=0,Q=0,O=0,V=0,Z=0;const x0=w=>{const i=t,m=b[i(381)](C=>C.id===w);if(!m)return!1;const A=S(m.subject_name);return A===i(260)||A===i(252)};b[t(382)](w=>{const i=t;if(x0(w.id))return;const m=h[w.id];m.q1>0&&!H(m[i(332)],1)&&(s+=m.q1,g++),m.q2>0&&!H(m.term,2)&&(P+=m.q2,F++),m.q3>0&&!H(m[i(332)],3)&&(Q+=m.q3,O++),m[i(301)]>0&&(V+=m[i(301)],Z++)}),_.length>0&&(p>0&&!H(r,1)&&(s+=p,g++),n>0&&!H(r,2)&&(P+=n,F++),o>0&&!H(r,3)&&(Q+=o,O++),c>0&&(V+=c,Z++));const G=g>0?Math[t(238)](s/g)[t(418)]():"",X=F>0?Math[t(238)](P/F)[t(418)]():"",M=O>0?Math[t(238)](Q/O).toString():"",a0=Z>0?Math[t(238)](V/Z)[t(418)]():"",n0=a0?Number(a0)>=75?t(404):t(296):"";return{subjectGrades:d,genAvg:a0,genRemarks:n0,genT1:G,genT2:X,genT3:M}},[b,k,e[x(344)],j]),z=(e.last_name+", "+e[x(415)]+" "+(e[x(324)]?e[x(324)][0]+".":""))[x(309)](),K=T.useMemo(()=>{const t=x;return z[t(369)]>35?t(292):z[t(369)]>25?t(247):t(383)},[z]),W=(t,h)=>{const l=x,_=t[l(369)];if(_===0)return{fontSize:"10px"};const p=h?158:170,n=.54,o=p/(_*n),c=Math[l(399)](7.5,Math.min(10,o));return{fontSize:c.toFixed(2)+"px",lineHeight:c<8.5?"1":l(197)}},f=T[x(347)](()=>{const t=x,h=[],l=[];b.forEach(d=>{const s=B,g=d[s(248)][s(309)]()[s(346)]();[s(393),s(337),s(427),s(212),s(341),s(217),s(365)][s(385)](F=>g.includes(F))?h[s(315)](d):l[s(315)](d)});const _=h[t(240)](d=>{const s=t,g=S(d[s(248)]);return g===s(260)||g==="mabisangkomunikasyon"}),p=h.filter(d=>{const s=t,g=S(d[s(248)]);return g!==s(260)&&g!==s(252)}),n=t0(p,d=>d[t(248)]),o=t0(l,d=>d[t(248)]),c=[],r=[];if(_[t(369)]>0){const d=_[t(381)](P=>S(P.subject_name)===t(260)),s=_.find(P=>S(P[t(248)])==="mabisangkomunikasyon"),g=d?.[t(332)]||s?.[t(332)];r.push({type:t(378),name:t(312),id:t(235),term:g}),d&&r[t(315)]({type:t(392),name:d[t(248)],id:d.id,isComponent:!0,term:d[t(332)]}),s&&r[t(315)]({type:t(392),name:s[t(248)],id:s.id,isComponent:!0,term:s[t(332)]})}return n[t(382)](d=>{const s=t;r[s(315)]({type:"subject",name:d[s(248)],id:d.id,term:d[s(332)]})}),r[t(369)]>0&&(c.push({type:t(251),name:t(239)}),c[t(315)](...r)),o.length>0&&(c[t(315)]({type:t(251),name:"Electives"}),o[t(382)](d=>{const s=t;c[s(315)]({type:s(392),name:d.subject_name,id:d.id,term:d[s(332)]})})),c},[b]);return a[x(343)](x(265),{className:x(226),children:[a.jsxs(x(265),{className:x(322),children:[a.jsx("img",{src:J,className:x(253),alt:x(355)}),a[x(343)]("div",{className:x(237),children:[a[x(318)]("p",{className:"uppercase text-[9px]",children:N[x(289)]}),a[x(343)]("p",{className:x(258),children:[x(215),j]}),a[x(318)]("h3",{className:"text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none",children:x(424)})]}),a[x(318)](x(394),{src:R,className:"w-10 h-10 object-contain",alt:x(367)})]}),a[x(343)](x(265),{className:x(376),children:[a[x(343)](x(265),{className:"flex mb-0.5 items-baseline",children:[a[x(318)](x(336),{className:x(414),children:x(200)}),a[x(318)](x(336),{className:x(417)+K,children:z})]}),a[x(343)](x(265),{className:x(380),children:[a[x(343)]("div",{className:x(196),children:[a.jsx(x(336),{className:"w-10",children:x(391)}),a.jsx(x(336),{className:x(272),children:e[x(344)]})]}),a[x(343)]("div",{className:x(300),children:[a.jsx(x(336),{className:"w-8",children:x(233)}),a[x(318)]("span",{className:x(406),children:e[x(379)]||""})]})]}),a[x(343)](x(265),{className:"flex gap-4",children:[a[x(343)](x(265),{className:x(196),children:[a[x(318)](x(336),{className:x(276),children:x(222)}),a[x(318)](x(336),{className:x(354),children:u?.[x(333)]?.replace(/Grade/i,"")[x(309)]()||""})]}),a[x(343)](x(265),{className:x(196),children:[a[x(318)](x(336),{className:x(409),children:x(282)}),a[x(318)](x(336),{className:x(361),children:u?.[x(349)]||""})]}),a[x(343)](x(265),{className:x(294),children:[a[x(318)](x(336),{className:x(409),children:"Track:"}),a[x(318)]("span",{className:"flex-1 border-b border-black font-bold leading-none pb-0.5 uppercase text-center",children:e.track||""})]})]})]}),a[x(318)](x(265),{className:x(288),children:a[x(343)](x(328),{className:x(366),children:[a[x(343)](x(338),{children:[a[x(343)]("tr",{children:[a[x(318)]("th",{rowSpan:2,className:x(250),children:"LEARNING AREAS"}),a[x(318)]("th",{colSpan:3,children:x(334)}),a[x(318)]("th",{rowSpan:2,className:x(325),children:a.jsx("div",{className:"w-min mx-auto",children:x(329)})}),a[x(318)]("th",{rowSpan:2,className:x(353),children:x(363)})]}),a[x(343)]("tr",{children:[a[x(318)]("th",{className:x(340),children:"1"}),a[x(318)]("th",{className:x(340),children:"2"}),a[x(318)]("th",{className:x(340),children:"3"})]})]}),a[x(343)](x(330),{children:[f[x(290)]((t,h)=>{const l=x;if(t.type===l(251))return a[l(318)]("tr",{children:a[l(318)]("td",{colSpan:6,style:{backgroundColor:"#E5E7EB",fontWeight:l(360),textAlign:l(263),padding:l(410),fontSize:l(216),textTransform:"uppercase"},children:t.name})},l(271)+h);const _=t[l(429)]===l(378),p=_?l(235):t.id,n=v.subjectGrades[p]||{q1:"",q2:"",q3:"",final:"",remarks:""},o=!_&&t[l(413)];return a[l(343)]("tr",{children:[a[l(318)]("td",{className:l(195)+l(o?203:228),style:{...W(t[l(289)],o),fontWeight:o?"normal":"bold"},children:t[l(289)]}),[1,2,3][l(290)](c=>{const r=l;if(H(t[r(332)],c))return a.jsx("td",{className:r(340),style:{backgroundColor:"#E5E7EB"},children:" "},c);const s=c===1?n.q1:c===2?n.q2:n.q3;return a[r(318)]("td",{className:"q-col",children:s||" "},c)}),a.jsx("td",{className:l(308),children:n[l(301)]||" "}),a[l(318)]("td",{className:l(257),children:n[l(384)]||" "})]},p)}),a[x(318)]("tr",{style:{height:"2px"},children:a[x(318)]("td",{colSpan:6,style:{backgroundColor:x(388),height:"2px",padding:0,borderLeft:x(372),borderRight:x(372),borderTop:x(372),borderBottom:x(372)}})}),a[x(343)]("tr",{children:[a.jsx("td",{className:x(245),children:x(293)}),a.jsx("td",{className:x(204),children:v.genT1||" "}),a[x(318)]("td",{className:x(204),children:v[x(210)]||" "}),a.jsx("td",{className:x(204),children:v[x(268)]||" "}),a[x(318)]("td",{className:"final-col font-bold",children:v[x(295)]||" "}),a[x(318)]("td",{className:x(311),children:v[x(348)]||" "})]})]})]})}),a[x(343)](x(265),{className:"mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center",children:[a[x(318)]("p",{className:x(374),children:x(207)}),a.jsxs(x(265),{className:x(326),children:[a[x(318)]("div",{className:x(398),children:N[x(244)]||x(307)}),a.jsx("p",{className:x(236),children:x(321)})]})]})]})}export{_0 as TemporaryGradeSlipPage};
