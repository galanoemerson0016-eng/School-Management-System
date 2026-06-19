import{r as T,j as a,cd as c0,bC as s0,b_ as l0,co as i0,cu as o0}from"./vendor-jb77UrGI.js";import{b as d0,s as t0,n as j}from"./index-Czmg6N98.js";import"./vendor-pdf-libs-DfncxlVz.js";import"./vendor-firebase-BnVoqbHU.js";import"./vendor-framer-motion-DCKYskn4.js";(function(e,w){const p=D,u=e();for(;;)try{if(-parseInt(p(420))/1*(-parseInt(p(498))/2)+-parseInt(p(388))/3*(-parseInt(p(428))/4)+parseInt(p(357))/5+parseInt(p(327))/6+parseInt(p(459))/7+-parseInt(p(405))/8+-parseInt(p(320))/9*(parseInt(p(411))/10)===w)break;u.push(u.shift())}catch{u.push(u.shift())}})(e0,401633);const $=(function(){let e=!0;return function(w,p){const u=e?function(){const S=D;if(p){const v=p[S(292)](w,arguments);return p=null,v}}:function(){};return e=!1,u}})(),r0=$(void 0,function(){const e=D,w=function(){const v=D;let x;try{x=Function(v(288)+'{}.constructor("return this")( ));')()}catch{x=window}return x},p=w(),u=p[e(503)]=p[e(503)]||{},S=["log",e(293),e(389),e(356),e(476),e(319),e(353)];for(let v=0;v<S.length;v++){const x=$[e(362)][e(489)][e(305)]($),P=S[v],q=u[P]||x;x.__proto__=$.bind($),x[e(456)]=q[e(456)][e(305)](q),u[P]=x}});r0();function _0(){const e=D,{students:w,sections:p,subjects:u,schoolProfile:S,setCurrentView:v,gradingSheetRecords:x,activeSchoolYear:P}=d0(),[q,X]=T.useState(""),[k,I]=T[e(378)](e(408)),[V,Z]=T.useState(1),b=T[e(463)](()=>{const n=e;return[...p.filter(i=>i[n(400)]||i[n(475)])][n(315)]((i,r)=>{const s=n,c=(i[s(366)]||"").localeCompare(r[s(366)]||"",void 0,{numeric:!0});return c!==0?c:(i[s(390)]||"").localeCompare(r[s(390)]||"")})},[p]);T[e(333)](()=>{if(!q&&b.length>0){const n=setTimeout(()=>{const d=D;X(b[0][d(390)])},0);return()=>clearTimeout(n)}},[b,q]);const t=T[e(463)](()=>{const n=e;return q?w.filter(d=>d.student_section===q)[n(315)]((d,i)=>{const r=n;return d[r(482)]!==i.gender?d[r(482)]===r(430)?-1:1:d[r(438)][r(423)](i[r(438)])}):[]},[w,q]),h=T[e(463)](()=>{const n=e;return p[n(444)](d=>d[n(390)]===q||d.id===q)},[p,q]),l=T[e(463)](()=>{const n=e;if(!h)return[];const d=parseInt(h[n(366)][n(383)](/\D/g,""))||0;let i=u[n(312)](r=>r.section_id===h.id&&r.term!==n(322));return i[n(414)]===0&&(i=u[n(312)](r=>{const s=n,c=parseInt(r[s(492)]?.[s(456)]()[s(383)](/\D/g,"")||"0");return!r.section_id&&c===d&&r[s(392)]!==s(322)})),t0(i,r=>r[n(427)])},[u,h]),_=()=>{window[e(409)]()},f={a4:{height:"297mm",width:e(398),cssSize:e(302)},letter:{height:e(284),width:e(385),cssSize:e(324)},folio:{height:"330.2mm",width:e(385),cssSize:e(340)}};return a[e(352)](e(279),{className:e(377),children:[a[e(494)](e(331),{children:`
                .print-page {
                    width: `+f[k].width+`;
                    height: `+f[k][e(439)]+`;
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
                        size: `+f[k].cssSize+e(375)}),a[e(352)](e(279),{className:e(282),children:[a[e(352)]("div",{className:e(461),children:[a[e(494)]("button",{onClick:()=>v(e(464)),className:e(395),children:a[e(494)](c0,{className:e(429)})}),a[e(352)](e(279),{children:[a[e(494)]("h2",{className:e(446),children:e(379)}),a[e(494)]("p",{className:e(328),children:h?h[e(366)]+e(363)+h[e(390)]:e(399)})]}),a[e(494)](e(279),{className:e(351)}),a[e(494)]("div",{className:e(454),children:a[e(352)](e(485),{className:"bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer",value:k,onChange:n=>I(n[e(384)][e(339)]),children:[a[e(494)](e(417),{value:e(408),children:"Letter (8.5 x 11in)"}),a.jsx("option",{value:"a4",children:e(335)}),a.jsx(e(417),{value:e(350),children:e(301)})]})})]}),a[e(352)]("div",{className:e(393),children:[a[e(352)]("div",{className:e(342),children:[a[e(494)](e(440),{onClick:()=>Z(n=>Math[e(272)](.4,n-.1)),className:e(426),title:e(303),children:a[e(494)](s0,{className:e(361)})}),a[e(352)](e(330),{className:e(467),children:[Math[e(457)](V*100),"%"]}),a[e(494)](e(440),{onClick:()=>Z(n=>Math[e(365)](1.5,n+.1)),className:"w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm",title:"Zoom In",children:a[e(494)](l0,{className:e(361)})})]}),a[e(494)](e(279),{className:e(443)}),a[e(352)]("button",{onClick:_,disabled:t[e(414)]===0,className:"h-11 px-6 rounded-xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2",children:[a[e(494)](i0,{className:e(310)}),e(434)]})]})]}),a[e(494)](e(279),{className:e(466),children:t[e(414)]>0?a.jsx("div",{className:e(493),style:{transform:"scale("+V+")"},children:a[e(494)](e(279),{className:e(275),children:Array[e(349)]({length:Math.ceil(t[e(414)]/4)}).map((n,d)=>a[e(352)](e(279),{className:e(294),children:[a[e(352)](e(279),{className:e(481),children:[e(368),d+1,e(299),Math[e(314)](t.length/4)]}),a[e(494)](e(279),{className:e(358)}),t.slice(d*4,(d+1)*4)[e(370)](i=>{const r=e,s=parseInt(h?.[r(366)]?.[r(383)](/\D/g,"")||"0");return s===11||s===12?a[r(494)](b0,{student:i,schoolProfile:S,section:h,subjects:l,records:x,activeSchoolYear:P},i.lrn):a[r(494)](m0,{student:i,schoolProfile:S,section:h,subjects:l,records:x,activeSchoolYear:P},i[r(418)])})]},d))})}):a[e(352)](e(279),{className:e(295),children:[a[e(494)](e(279),{className:e(437),children:a[e(494)](o0,{className:e(470)})}),a.jsx("h3",{className:e(396),children:"No Advisory Class Set"}),a[e(494)]("p",{className:"text-sm text-slate-500 font-medium leading-relaxed",children:e(278)})]})})]})}function D(e,w){return e=e-269,e0()[e]}function e0(){const e=["folio","h-8 w-px bg-slate-200 mx-2","jsxs","trace","Age:","forEach","error","208040NahWgr","cut-cross","age","text-[7.5px] leading-tight","w-3.5 h-3.5","constructor"," - ","flex flex-1","min","section_grade_level","mb-1.5 px-1 shrink-0 text-[9px]","Page ","subject-col font-bold text-[10px] text-center pb-1 pt-1","map","final-col","subject_id","flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ","general science",`;
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
            `,"remarks-col","h-full bg-slate-50 flex flex-col overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible","useState","Temporary Grade Slip","parent_ec_mk","2px","flex flex-[1.2]","replace","target","215.9mm","flex items-center justify-between mb-1.5 px-1 shrink-0","flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5","3zlDvew","info","section_name","uppercase","term","flex items-center gap-4","all","p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600","text-xl font-black text-slate-800 mb-2","header-","210mm","Student Resource Tool","is_advisory","q-col font-bold","w-45 mx-auto text-center mt-2.5","DepEd","2px 4px","2913824buWuaS","final","kasaysayan at lipunang pilipino","letter","print","genAvg","2330gGojbj","adviser_name","w-10 shrink-0","length","Passed","life and career skills","option","lrn","push","109Plpmzd","w-8","track","localeCompare","Grade Level:","TERM","w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm","subject_name","1525136lWiWLp","w-5 h-5","Male","includes","effective communication","flex gap-4 mb-0.5","Print Slips","deped_logo_left.png","w-10","w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mb-6","last_name","height","button","pl-3 font-normal","flex-1 border-b border-black font-bold pb-0.5 leading-none text-center","h-8 w-px bg-slate-200","find","w-10 text-[9px]","text-sm font-black text-slate-900 uppercase tracking-tight","flex w-20","genT2","Adviser","genRemarks","q-col","uppercase text-[9px] font-normal tracking-wide mt-0.5","parent","flex items-center gap-3","remarks-col text-[6.5px] tracking-tighter uppercase","toString","round","arts","2968014IGCzfM","mabisang komunikasyon","flex items-center gap-6","first_name","useMemo","school-forms","w-10 h-10 object-contain","flex-1 overflow-auto p-8 flex flex-col items-center bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible custom-scrollbar","text-xs font-bold text-slate-900 w-12 text-center tabular-nums","some","left","w-10 h-10 text-slate-400","genT1","flex-1 border-b border-black font-bold pb-0.5 leading-none","music","text-[8px] italic mt-0.5","is_advisory_class","exception","normal","Grade Slip","grade-slip-card font-serif text-[9px] relative text-black leading-tight","flex-1 border-b border-black font-bold leading-none text-center pb-0.5","absolute -top-6 right-0 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden","gender","Failed","text-[8.2px] leading-tight","select","font-bold","img","Section:","prototype","quarter","FINAL GRADE","grade_level","print-preview-container print:w-full flex flex-col items-center transition-all duration-300 ease-out origin-top print:scale-100","jsx","logo_url","#E5E7EB","text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none","3858WkpRzW","_________________________","type","flex-1 border-b border-black font-bold leading-none pb-0.5 uppercase text-center","school-logo.png","console","physical","genT3","font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none","max","flex-1 min-h-0 mb-1.5 px-1","subjectGrades","print:w-full flex flex-col items-center gap-8 print:gap-0","1px solid black","thead","Please set up your advisory grade level and section details in your Profile to generate temporary grade slips.","div","REMARKS","subject-col ","h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-100 shadow-sm print:hidden","header","279.4mm","flex mb-0.5 items-baseline","subject","name","return (function() ","student_lrn","toLowerCase","pag-aaral ng kasaysayan at lipunang pilipino","apply","warn","print-page relative","flex-1 flex flex-col items-center justify-center text-center max-w-md","Name:","middle_name","final-col leading-tight"," of ","Electives","Folio / Long (8.5 x 13in)","A4 portrait","Zoom Out","effectivecommunication","bind","general mathematics","10px","w-15","toFixed","w-4 h-4","flex gap-4","filter","Track:","ceil","sort","remarks-col text-[6.5px] tracking-tighter uppercase font-bold","Prepared by:","w-min mx-auto","table","18162yVsvFS","italic pl-3","none","text-[8px] mb-1 w-full text-center","letter portrait","trim","final_grade","1073400siJzyU","text-[10px] font-black text-orange-600 uppercase tracking-widest","text-[9px]","span","style","isComponent","useEffect","1.1","A4 Size (210 x 297mm)","LRN:","black","mabisangkomunikasyon","value","8.5in 13in portrait","LEARNING AREAS","flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200","tbody","bold","subject-col","health","SCHOOL YEAR: ","School","from"];return e0=function(){return e},e0()}function m0({student:e,schoolProfile:w,section:p,subjects:u,records:S,activeSchoolYear:v}){const x=D,P="./",q=w[x(495)]||"school-logo.png",X=P+x(435),k=T[x(463)](()=>{const b=x,t={};let h=0,l=0;const _={t1:0,t2:0,t3:0},f={t1:0,t2:0,t3:0};u[b(355)](c=>{const g=b;let L="",Y="",J="",O=0,B=0;for(let G=1;G<=3;G++){const U=S[g(444)](C=>C.student_lrn===e[g(418)]&&C[g(372)]===c.id&&Number(C[g(490)])===G&&C.school_year===v);if(U&&U[g(326)]&&Number(U[g(326)])>0){const C=Number(U.final_grade);G===1&&(L=C[g(456)](),_.t1+=C,f.t1++),G===2&&(Y=C[g(456)](),_.t2+=C,f.t2++),G===3&&(J=C[g(456)](),_.t3+=C,f.t3++),O+=C,B++}}let H="",x0="";if(B>0){const G=Math.round(O/B);H=G.toString(),h+=G,l++,x0=G>=75?g(415):g(483)}t[c.id]={q1:L,q2:Y,q3:J,final:H,remarks:x0}});const n=l>0?Math.round(h/l).toString():"",d=n?Number(n)>=75?b(415):b(483):"",i=f.t1>0?Math[b(457)](_.t1/f.t1)[b(456)]():"",r=f.t2>0?Math[b(457)](_.t2/f.t2)[b(456)]():"",s=f.t3>0?Math[b(457)](_.t3/f.t3)[b(456)]():"";return{subjectGrades:t,genAvg:n,genRemarks:d,genT1:i,genT2:r,genT3:s}},[u,S,e[x(418)],v]),I=(e[x(438)]+", "+e[x(462)]+" "+(e[x(297)]?e.middle_name[0]+".":""))[x(325)](),V=T[x(463)](()=>{const b=x;return I[b(414)]>35?b(360):I[b(414)]>25?b(484):b(329)},[I]),Z=b=>{const t=x,h=b.length;if(h===0)return{fontSize:"10px"};const l=j(b)[t(431)](t(473))||j(b)[t(431)](t(458))||j(b).includes("physical")||j(b)[t(431)](t(346)),_=l?158:170,f=.54,n=_/(h*f),d=Math[t(272)](7.5,Math[t(365)](10,n));return{fontSize:d[t(309)](2)+"px",lineHeight:d<8.5?"1":t(334)}};return a[x(352)](x(279),{className:x(479),children:[a[x(352)](x(279),{className:x(386),children:[a[x(494)](x(487),{src:X,className:x(465),alt:x(403)}),a[x(352)]("div",{className:"text-center font-bold leading-none",children:[a[x(494)]("p",{className:"uppercase text-[9px]",children:w[x(287)]}),a[x(352)]("p",{className:x(452),children:[x(347),v]}),a.jsx("h3",{className:x(497),children:x(478)})]}),a[x(494)](x(487),{src:q,className:"w-10 h-10 object-contain",alt:x(348)})]}),a[x(352)](x(279),{className:"mb-1.5 px-1 shrink-0 text-[9px]",children:[a[x(352)](x(279),{className:"flex mb-0.5 items-baseline",children:[a[x(494)](x(330),{className:"w-10 text-[9px]",children:x(296)}),a[x(494)](x(330),{className:x(373)+V,children:I})]}),a[x(352)]("div",{className:x(433),children:[a[x(352)]("div",{className:"flex flex-1",children:[a[x(494)](x(330),{className:x(436),children:"LRN:"}),a[x(494)](x(330),{className:x(472),children:e[x(418)]})]}),a[x(352)]("div",{className:x(447),children:[a[x(494)](x(330),{className:x(421),children:"Age:"}),a[x(494)](x(330),{className:x(442),children:e[x(359)]||""})]})]}),a.jsxs(x(279),{className:x(311),children:[a[x(352)](x(279),{className:x(364),children:[a.jsx(x(330),{className:x(308),children:x(424)}),a.jsx(x(330),{className:"flex-1 border-b border-black font-bold leading-none text-center pb-0.5",children:p?.[x(366)]?.[x(383)](/Grade/i,"")[x(325)]()||""})]}),a[x(352)](x(279),{className:x(364),children:[a[x(494)](x(330),{className:"w-11.25",children:x(488)}),a.jsx(x(330),{className:x(387),children:p?.section_name||""})]})]})]}),a[x(494)](x(279),{className:x(273),children:a[x(352)]("table",{className:"grade-table",children:[a[x(352)](x(277),{children:[a[x(352)]("tr",{children:[a[x(494)]("th",{rowSpan:2,className:x(345),children:x(341)}),a[x(494)]("th",{colSpan:3,children:x(425)}),a[x(494)]("th",{rowSpan:2,className:x(298),children:a[x(494)](x(279),{className:x(318),children:x(491)})}),a[x(494)]("th",{rowSpan:2,className:"remarks-col",children:x(280)})]}),a[x(352)]("tr",{children:[a[x(494)]("th",{className:x(451),children:"1"}),a[x(494)]("th",{className:"q-col",children:"2"}),a[x(494)]("th",{className:"q-col",children:"3"})]})]}),a[x(352)](x(343),{children:[u[x(370)](b=>{const t=x,h=k[t(274)][b.id],l=j(b[t(427)]).includes("music")||j(b.subject_name)[t(431)](t(458))||j(b[t(427)])[t(431)](t(269))||j(b[t(427)])[t(431)](t(346));return a[t(352)]("tr",{children:[a.jsx("td",{className:t(281)+(l?t(321):""),style:Z(b.subject_name),children:b.subject_name}),a[t(494)]("td",{className:t(451),children:h.q1||" "}),a[t(494)]("td",{className:t(451),children:h.q2||" "}),a[t(494)]("td",{className:t(451),children:h.q3||" "}),a[t(494)]("td",{className:t(371),children:h.final||" "}),a[t(494)]("td",{className:t(455),children:h.remarks||" "})]},b.id)}),a.jsx("tr",{style:{height:"2px"},children:a[x(494)]("td",{colSpan:6,style:{backgroundColor:x(337),height:x(381),padding:0,borderLeft:"1px solid black",borderRight:x(276),borderTop:x(276),borderBottom:"1px solid black"}})}),a[x(352)]("tr",{children:[a[x(494)]("td",{className:"subject-col font-bold text-[10px] text-center pb-1 pt-1",children:"General Average"}),a[x(494)]("td",{className:x(401),children:k[x(471)]||" "}),a[x(494)]("td",{className:x(401),children:k[x(448)]||" "}),a[x(494)]("td",{className:x(401),children:k[x(270)]||" "}),a[x(494)]("td",{className:"final-col font-bold",children:k[x(410)]||" "}),a[x(494)]("td",{className:x(316),children:k[x(450)]||" "})]})]})]})}),a[x(352)]("div",{className:"mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center",children:[a[x(494)]("p",{className:x(323),children:x(317)}),a[x(352)](x(279),{className:x(402),children:[a[x(494)](x(279),{className:x(271),children:w[x(412)]||"_________________________"}),a[x(494)]("p",{className:x(474),children:x(449)})]})]})]})}function K(e,w){if(e===void 0||e===D(394)||e==="none"||e===null)return!1;const u=Number(e);return isNaN(u)?!1:u!==w}function b0({student:e,schoolProfile:w,section:p,subjects:u,records:S,activeSchoolYear:v}){const x=D,P="./",q=w.logo_url||x(502),X=P+x(435),k=T.useMemo(()=>{const t=x,h={};u[t(355)](N=>{const o=t;let m=0,z=0,A=0;for(let y=1;y<=3;y++){const M=S.find(R=>R[o(289)]===e[o(418)]&&R[o(372)]===N.id&&Number(R[o(490)])===y&&R.school_year===v);if(M&&M[o(326)]&&Number(M.final_grade)>0){const R=Number(M[o(326)]);y===1&&(m=R),y===2&&(z=R),y===3&&(A=R)}}const E=N.term;let W=0;if(E===1||Number(E)===1)W=m;else if(E===2||Number(E)===2)W=z;else if(E===3||Number(E)===3)W=A;else{let y=0,M=0;m>0&&(y+=m,M++),z>0&&(y+=z,M++),A>0&&(y+=A,M++),W=M>0?Math.round(y/M):0}h[N.id]={q1:m,q2:z,q3:A,final:W,term:E}});const l=u[t(312)](N=>{const o=t,m=N[o(427)][o(325)]()[o(290)]();return[o(432),o(460),o(306),"general science","life and career skills","pag-aaral ng kasaysayan at lipunang pilipino","kasaysayan at lipunang pilipino"][o(468)](A=>m[o(431)](A))}),_=l[t(312)](N=>{const o=t,m=j(N.subject_name);return m===o(304)||m===o(338)});let f=0,n=0,d=0,i=0,r;if(_[t(414)]>0){const N=_[t(444)](F=>j(F[t(427)])===t(304)),o=_[t(444)](F=>j(F[t(427)])==="mabisangkomunikasyon");N&&N.term?r=N[t(392)]:o&&o[t(392)]&&(r=o.term);const m=N?h[N.id]:null,z=o?h[o.id]:null,A=m?.q1||0,E=z?.q1||0;A>0&&E>0?f=Math.round((A+E)/2):A>0?f=A:E>0&&(f=E);const W=m?.q2||0,y=z?.q2||0;W>0&&y>0?n=Math[t(457)]((W+y)/2):W>0?n=W:y>0&&(n=y);const M=m?.q3||0,R=z?.q3||0;if(M>0&&R>0?d=Math.round((M+R)/2):M>0?d=M:R>0&&(d=R),r===1||Number(r)===1)i=f;else if(r===2||Number(r)===2)i=n;else if(r===3||Number(r)===3)i=d;else{let F=0,Q=0;f>0&&(F+=f,Q++),n>0&&(F+=n,Q++),d>0&&(F+=d,Q++),i=Q>0?Math[t(457)](F/Q):0}}const s={};s[t(380)]={q1:f>0?f[t(456)]():"",q2:n>0?n[t(456)]():"",q3:d>0?d[t(456)]():"",final:i>0?i.toString():"",remarks:i>0?i>=75?t(415):"Failed":"",term:r},u[t(355)](N=>{const o=t,m=h[N.id];s[N.id]={q1:m.q1>0?m.q1.toString():"",q2:m.q2>0?m.q2[o(456)]():"",q3:m.q3>0?m.q3[o(456)]():"",final:m[o(406)]>0?m.final[o(456)]():"",remarks:m[o(406)]>0?m[o(406)]>=75?o(415):o(483):"",term:m[o(392)]}});let c=0,g=0,L=0,Y=0,J=0,O=0,B=0,H=0;const x0=N=>{const o=t,m=u[o(444)](A=>A.id===N);if(!m)return!1;const z=j(m[o(427)]);return z===o(304)||z===o(338)};u[t(355)](N=>{const o=t;if(x0(N.id))return;const m=h[N.id];m.q1>0&&!K(m[o(392)],1)&&(c+=m.q1,g++),m.q2>0&&!K(m.term,2)&&(L+=m.q2,Y++),m.q3>0&&!K(m[o(392)],3)&&(J+=m.q3,O++),m[o(406)]>0&&(B+=m[o(406)],H++)}),_[t(414)]>0&&(f>0&&!K(r,1)&&(c+=f,g++),n>0&&!K(r,2)&&(L+=n,Y++),d>0&&!K(r,3)&&(J+=d,O++),i>0&&(B+=i,H++));const G=g>0?Math.round(c/g)[t(456)]():"",U=Y>0?Math[t(457)](L/Y).toString():"",C=O>0?Math[t(457)](J/O)[t(456)]():"",a0=H>0?Math[t(457)](B/H)[t(456)]():"",n0=a0?Number(a0)>=75?t(415):t(483):"";return{subjectGrades:s,genAvg:a0,genRemarks:n0,genT1:G,genT2:U,genT3:C}},[u,S,e.lrn,v]),I=(e[x(438)]+", "+e[x(462)]+" "+(e[x(297)]?e[x(297)][0]+".":"")).trim(),V=T[x(463)](()=>{const t=x;return I[t(414)]>35?t(360):I.length>25?t(484):"text-[9px]"},[I]),Z=(t,h)=>{const l=x,_=t.length;if(_===0)return{fontSize:l(307)};const f=h?158:170,n=.54,d=f/(_*n),i=Math[l(272)](7.5,Math[l(365)](10,d));return{fontSize:i[l(309)](2)+"px",lineHeight:i<8.5?"1":l(334)}},b=T.useMemo(()=>{const t=x,h=[],l=[];u[t(355)](s=>{const c=t,g=s[c(427)][c(325)]()[c(290)]();[c(432),c(460),c(306),c(374),c(416),c(291),c(407)][c(468)](Y=>g[c(431)](Y))?h[c(419)](s):l[c(419)](s)});const _=h[t(312)](s=>{const c=t,g=j(s[c(427)]);return g===c(304)||g==="mabisangkomunikasyon"}),f=h[t(312)](s=>{const c=t,g=j(s[c(427)]);return g!=="effectivecommunication"&&g!=="mabisangkomunikasyon"}),n=t0(f,s=>s.subject_name),d=t0(l,s=>s[t(427)]),i=[],r=[];if(_[t(414)]>0){const s=_[t(444)](L=>j(L[t(427)])==="effectivecommunication"),c=_[t(444)](L=>j(L[t(427)])==="mabisangkomunikasyon"),g=s?.[t(392)]||c?.[t(392)];r[t(419)]({type:t(453),name:"Effective Communication & Mabisang Komunikasyon",id:t(380),term:g}),s&&r.push({type:"subject",name:s.subject_name,id:s.id,isComponent:!0,term:s.term}),c&&r[t(419)]({type:t(286),name:c[t(427)],id:c.id,isComponent:!0,term:c.term})}return n[t(355)](s=>{const c=t;r[c(419)]({type:c(286),name:s[c(427)],id:s.id,term:s[c(392)]})}),r[t(414)]>0&&(i[t(419)]({type:t(283),name:"Core Subjects"}),i[t(419)](...r)),d[t(414)]>0&&(i[t(419)]({type:"header",name:t(300)}),d[t(355)](s=>{const c=t;i[c(419)]({type:c(286),name:s[c(427)],id:s.id,term:s[c(392)]})})),i},[u]);return a[x(352)](x(279),{className:x(479),children:[a[x(352)](x(279),{className:x(386),children:[a[x(494)](x(487),{src:X,className:"w-10 h-10 object-contain",alt:"DepEd"}),a[x(352)]("div",{className:"text-center font-bold leading-none",children:[a[x(494)]("p",{className:"uppercase text-[9px]",children:w[x(287)]}),a[x(352)]("p",{className:x(452),children:["SCHOOL YEAR: ",v]}),a[x(494)]("h3",{className:x(497),children:x(478)})]}),a[x(494)]("img",{src:q,className:"w-10 h-10 object-contain",alt:"School"})]}),a[x(352)](x(279),{className:x(367),children:[a[x(352)](x(279),{className:x(285),children:[a.jsx(x(330),{className:x(445),children:x(296)}),a[x(494)](x(330),{className:"flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none "+V,children:I})]}),a.jsxs("div",{className:x(433),children:[a.jsxs(x(279),{className:x(364),children:[a[x(494)](x(330),{className:x(436),children:x(336)}),a[x(494)](x(330),{className:x(472),children:e[x(418)]})]}),a[x(352)](x(279),{className:x(447),children:[a[x(494)](x(330),{className:"w-8",children:x(354)}),a[x(494)](x(330),{className:x(442),children:e[x(359)]||""})]})]}),a.jsxs(x(279),{className:x(311),children:[a[x(352)]("div",{className:x(364),children:[a[x(494)](x(330),{className:"w-15 shrink-0",children:x(424)}),a[x(494)](x(330),{className:x(480),children:p?.[x(366)]?.[x(383)](/Grade/i,"")[x(325)]()||""})]}),a[x(352)](x(279),{className:x(364),children:[a[x(494)](x(330),{className:x(413),children:"Section:"}),a[x(494)](x(330),{className:x(387),children:p?.[x(390)]||""})]}),a.jsxs(x(279),{className:x(382),children:[a.jsx("span",{className:"w-10 shrink-0",children:x(313)}),a[x(494)](x(330),{className:x(501),children:e[x(422)]||""})]})]})]}),a.jsx(x(279),{className:"flex-1 min-h-0 mb-1.5 px-1",children:a[x(352)](x(319),{className:"grade-table",children:[a.jsxs(x(277),{children:[a[x(352)]("tr",{children:[a[x(494)]("th",{rowSpan:2,className:"subject-col",children:"LEARNING AREAS"}),a[x(494)]("th",{colSpan:3,children:"TERM"}),a[x(494)]("th",{rowSpan:2,className:x(298),children:a[x(494)](x(279),{className:"w-min mx-auto",children:x(491)})}),a[x(494)]("th",{rowSpan:2,className:x(376),children:x(280)})]}),a[x(352)]("tr",{children:[a.jsx("th",{className:x(451),children:"1"}),a[x(494)]("th",{className:x(451),children:"2"}),a[x(494)]("th",{className:x(451),children:"3"})]})]}),a[x(352)](x(343),{children:[b.map((t,h)=>{const l=x;if(t[l(500)]===l(283))return a[l(494)]("tr",{children:a.jsx("td",{colSpan:6,style:{backgroundColor:l(496),fontWeight:l(344),textAlign:l(469),padding:l(404),fontSize:"8px",textTransform:l(391)},children:t.name})},l(397)+h);const _=t[l(500)]==="parent",f=_?l(380):t.id,n=k.subjectGrades[f]||{q1:"",q2:"",q3:"",final:"",remarks:""},d=!_&&t[l(332)];return a[l(352)]("tr",{children:[a.jsx("td",{className:"subject-col "+l(d?441:486),style:{...Z(t[l(287)],d),fontWeight:l(d?477:344)},children:t[l(287)]}),[1,2,3].map(i=>{const r=l;if(K(t[r(392)],i))return a[r(494)]("td",{className:r(451),style:{backgroundColor:r(496)},children:" "},i);const c=i===1?n.q1:i===2?n.q2:n.q3;return a[r(494)]("td",{className:"q-col",children:c||" "},i)}),a.jsx("td",{className:l(371),children:n[l(406)]||" "}),a[l(494)]("td",{className:"remarks-col text-[6.5px] tracking-tighter uppercase",children:n.remarks||" "})]},f)}),a.jsx("tr",{style:{height:x(381)},children:a.jsx("td",{colSpan:6,style:{backgroundColor:x(337),height:"2px",padding:0,borderLeft:"1px solid black",borderRight:x(276),borderTop:x(276),borderBottom:x(276)}})}),a[x(352)]("tr",{children:[a[x(494)]("td",{className:x(369),children:"General Average"}),a[x(494)]("td",{className:x(401),children:k[x(471)]||" "}),a[x(494)]("td",{className:x(401),children:k[x(448)]||" "}),a[x(494)]("td",{className:x(401),children:k[x(270)]||" "}),a[x(494)]("td",{className:"final-col font-bold",children:k.genAvg||" "}),a[x(494)]("td",{className:x(316),children:k[x(450)]||" "})]})]})]})}),a[x(352)](x(279),{className:"mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center",children:[a.jsx("p",{className:x(323),children:x(317)}),a[x(352)](x(279),{className:x(402),children:[a.jsx(x(279),{className:"font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none",children:w[x(412)]||x(499)}),a[x(494)]("p",{className:x(474),children:"Adviser"})]})]})]})}export{_0 as TemporaryGradeSlipPage};
