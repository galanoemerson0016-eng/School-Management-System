import{j as a,r as m,cq as Y0,bH as d0,cA as V0,c9 as q0,be as _0,bO as j0,cc as c0,cz as W0,bs as Z0,dn as K0,cB as f0,cC as S0,bE as X0}from"./vendor-D807hmOL.js";import{b as Q0,u as $0,h as xx,n as ex}from"./index-CJLQQ9SB.js";import{r as ax}from"./grading-helpers-Lu4KWKax.js";import{e as tx,p as rx}from"./pdf-export-BtpoCRVi.js";import"./vendor-pdf-libs-BVl_U1Kq.js";import"./vendor-firebase-CEUkPUSI.js";import"./vendor-framer-motion-ByrjgV2f.js";import"./terms-DVWiQ5_A.js";import"./grading-AVKdJXm1.js";const n0=U;(function(x,k){const u=U,v=x();for(;;)try{if(-parseInt(u(393))/1+parseInt(u(380))/2*(parseInt(u(212))/3)+parseInt(u(130))/4*(-parseInt(u(177))/5)+-parseInt(u(151))/6+parseInt(u(193))/7*(-parseInt(u(361))/8)+-parseInt(u(388))/9*(parseInt(u(391))/10)+parseInt(u(298))/11===k)break;v.push(v.shift())}catch{v.push(v.shift())}})(o0,319824);const l0=(function(){let x=!0;return function(k,u){const v=x?function(){const A=U;if(u){const T=u[A(277)](k,arguments);return u=null,T}}:function(){};return x=!1,v}})(),J0=l0(void 0,function(){const x=U,k=function(){const T=U;let c;try{c=Function(T(169)+T(449)+");")()}catch{c=window}return c},u=k(),v=u[x(377)]=u[x(377)]||{},A=[x(323),x(410),x(108),x(301),"exception",x(447),x(259)];for(let T=0;T<A[x(379)];T++){const c=l0[x(423)].prototype[x(117)](l0),d=A[T],y=v[d]||c;c[x(522)]=l0[x(117)](l0),c[x(454)]=y[x(454)][x(117)](y),v[d]=c}});J0();function U(x,k){return x=x-100,o0()[x]}const T0=({pageNumber:x,student:k,profile:u,schoolYear:v,subject:A,teacher:T,fillColor:c=n0(497),outlineColor:d=n0(438),gradeData:y,paperSize:M=n0(271),attendanceData:a0={}})=>{const e=n0,W="./",N=25,i0=n=>Array[U(283)]({length:N},(o,j)=>n[j]??""),E=(n,f)=>{const o=U,j=Number(f);if(!j)return!1;const O=n[o(406)]();return O===o(520)&&j===12||O===o(509)&&(j===21||j===31)||O===o(408)&&(j===2||j===30)||O==="DECEMBER"&&j===8||O==="JANUARY"&&j===1};let P=e(265),p=e(279),s=1.12,Y=1.2,V=.8,B=.75,R=5,L=.8,Z=40,_=240,K=100,X=50,J=e(286);M==="a4"?(p="210mm",P=e(183),s=1.02,Y=.85,V=.55,B=.5,R=2,L=.65,Z=26,_=140,K=80,X=40):M===e(194)?(p=e(279),P=e(225),s=.98,Y=.85,V=.55,B=.5,R=3,L=.7,Z=28,_=160,K=65,X=32,J="-11px"):M===e(271)&&(p=e(279),P=e(265),s=.98,Y=.85,V=.55,B=.5,R=3,L=.7,Z=28,_=160,K=65,X=32,J=e(333));const C=(n,f)=>{const o=e,j=(n||"").trim();return j[o(379)]>32?f*.65:j[o(379)]>24?f*.78:j[o(379)]>16?f*.88:f},F=C(A,L*s),q=C(T,L*s);return a.jsx(e(278),{className:e(148),children:a[e(369)](e(278),{className:e(186),style:{width:p,height:P},children:[a[e(100)](e(385),{children:`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `+p+" "+P+`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid `+d+e(330)+8*s+e(233)+5*s+e(513)+c+`;
                        border: 1px solid `+d+e(387)+3*s+e(328)+.85*s+e(355)+c+e(281)+d+e(365)+.6*s+e(171)+d+e(330)+2*s+e(411)+.8*s+e(511)+.6*s+`rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `+d+e(330)+1.5*s+e(167)+24*s+e(103)+c+`44;
                        font-weight: 800;
                        font-size: `+.6*s+e(156)+c+e(203)+.6*s+e(189)+70*s+e(306)+c+e(506)+d+e(484)+Z*s+e(398)+_*s+e(370)+c+e(378)+.9*s+e(237)+4*s+e(224)+d+e(160)+d+e(324)+d+e(111)+.5*s+e(441)+21*s+e(517)+1*s+`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `+c+e(115)+.5*s+e(439)+d+` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `+c+e(300)+.9*s+e(390)+c+e(112)+.45*s+e(280)+.5*s+`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `+d+e(437)+c+`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `+3*s+`px; 
                        font-size: `+.85*s+e(152)+d+`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `+d+e(478)+.45*s+e(292)+18*s+e(336)+95*s+e(236)+d+e(412)+1.5*s+e(518)+4*s+e(331)+1.5*s+e(518)+4*s+`px; 
                        font-weight: 700; 
                        font-size: `+.42*s+e(317)}),a[e(369)](e(278),{className:e(340),children:[a[e(369)](e(278),{className:e(282),children:[a.jsxs(e(278),{className:e(498),children:[a[e(369)](e(278),{className:e(139),children:[a[e(100)]("div",{className:e(161),style:{width:64*s,height:64*s},children:a[e(100)](e(339),{src:u.logo_url||W+e(483),alt:e(165),className:e(140),onError:n=>{const f=e;n[f(492)].src=W+f(483)}})}),a[e(369)]("div",{children:[a[e(100)]("h1",{className:"font-extrabold uppercase whitespace-nowrap",style:{fontSize:Y*s+"rem"},children:u[e(320)]||e(419)}),a[e(100)]("p",{className:e(445),style:{fontSize:V*s+e(453),color:d},children:e(477)}),a.jsxs("p",{className:e(223),style:{fontSize:B*s+e(453)},children:[e(334),a[e(100)](e(314),{className:e(507),children:v})]})]})]}),a[e(100)](e(278),{className:"shrink-0 ml-auto",children:a[e(100)]("table",{className:e(500),style:{borderColor:d},children:a[e(100)]("tbody",{children:a.jsxs("tr",{children:[a[e(100)]("td",{className:e(319),style:{fontSize:L*s+"rem",padding:R*s+e(518)+R*2*s+"px",borderColor:d},children:e(395)}),a[e(100)]("td",{className:e(166),style:{fontSize:F+e(453),padding:R*s+e(518)+R*2.5*s+"px",borderColor:d},children:A}),a[e(100)]("td",{className:e(319),style:{fontSize:L*s+e(453),padding:R*s+"px "+R*2*s+"px",borderColor:d},children:e(198)}),a[e(100)]("td",{className:e(166),style:{fontSize:q+e(453),padding:R*s+e(518)+R*2.5*s+"px",borderColor:d},children:T})]})})})})]}),a[e(369)](e(278),{className:e(294),children:[a[e(100)](e(278),{className:"border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden",style:{width:1*s+"in",height:1*s+"in",borderColor:d},children:k[e(400)]?a[e(100)](e(339),{src:k[e(400)],alt:"1x1 Learner Photo",className:e(109)}):a[e(369)](e(314),{className:e(399),style:{fontSize:.7*s+e(453)},children:[e(526),a.jsx("br",{}),"PHOTO"]})}),a[e(100)](e(278),{className:e(128),children:a[e(100)](e(447),{className:e(490),style:{borderColor:d,height:1*s+"in"},children:a[e(369)]("tbody",{children:[a.jsxs("tr",{style:{height:.5*s+"in"},children:[a.jsx("td",{className:e(415),style:{borderColor:d,height:.5*s+"in"},children:k[e(349)]}),a[e(100)]("td",{className:e(415),style:{borderColor:d,height:.5*s+"in"},children:k[e(316)]}),a.jsx("td",{className:e(413),style:{width:e(226),borderColor:d,height:.5*s+"in"},children:k[e(448)]?.[e(422)](0)||""}),a[e(100)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:d,height:.5*s+"in"},children:k[e(460)]}),a.jsx("td",{className:e(415),style:{borderColor:d,height:.5*s+"in"},children:k[e(299)]})]}),a[e(369)]("tr",{style:{height:.5*s+"in"},children:[a.jsx("td",{className:e(176),style:{borderColor:d,height:.5*s+"in"},children:e(459)}),a[e(100)]("td",{className:e(176),style:{borderColor:d,height:.5*s+"in"},children:e(253)}),a[e(100)]("td",{className:e(159),style:{width:e(226),borderColor:d,height:.5*s+"in"},children:e(495)}),a.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:d,height:.5*s+"in"},children:e(120)}),a[e(100)]("td",{className:e(176),style:{borderColor:d,height:.5*s+"in"},children:"LRN"})]})]})})})]}),a[e(369)](e(278),{className:e(510),children:[a[e(369)](e(278),{children:[a[e(100)](e(278),{className:e(302),style:{fontSize:.75*s+e(453)},children:"WRITTEN /ORAL WORKS (WWs)"}),a[e(100)]("table",{style:{tableLayout:e(450)},children:a.jsxs("tbody",{children:[a[e(369)]("tr",{className:e(475),children:[a.jsx("td",{className:e(435),style:{width:"15%"},children:e(384)}),[1,2,3,4,5][e(486)](n=>a.jsx("td",{style:{width:e(451)},children:n},n)),a[e(100)]("td",{className:e(223),style:{width:e(250)},children:e(202)})]}),[1,2,3][e(486)](n=>a[e(369)]("tr",{children:[a[e(100)]("td",{className:e(469),children:e(n===1?285:n===2?428:232)}),[...Array(5)][e(486)]((f,o)=>a[e(100)]("td",{children:y?.[n]?.[e(397)].ww[o]??""},o)),a.jsx("td",{className:e(223),children:y?.[n]?.[e(397)].ww.slice(0,5).reduce((f,o)=>f+(Number(o)||0),0)||""})]},n))]})})]}),a.jsxs("div",{children:[a.jsx("div",{className:e(302),style:{fontSize:.75*s+"rem"},children:e(519)}),a[e(100)](e(447),{style:{tableLayout:e(450)},children:a[e(369)](e(208),{children:[a[e(369)]("tr",{className:"header-row-fill",children:[a[e(100)]("td",{className:e(435),style:{width:e(250)},children:e(384)}),[1,2,3][e(486)](n=>a[e(100)]("td",{style:{width:e(250)},children:n},n)),a.jsx("td",{className:"font-bold",style:{width:"20%"},children:e(202)})]}),[1,2,3][e(486)](n=>a.jsxs("tr",{children:[a[e(100)]("td",{className:e(469),children:n===1?"FIRST":n===2?"SECOND":e(232)}),[...Array(3)][e(486)]((f,o)=>a[e(100)]("td",{children:y?.[n]?.[e(397)].pt[o]??""},o)),a.jsx("td",{className:e(223),children:y?.[n]?.[e(397)].pt[e(325)](0,3)[e(147)]((f,o)=>f+(Number(o)||0),0)||""})]},n))]})})]})]}),a[e(369)](e(278),{className:e(196),children:[a[e(369)](e(278),{className:e(456),children:[a[e(100)](e(278),{className:e(302),style:{fontSize:.7*s+e(453)},children:"SUMMATIVE TEST"}),a[e(100)]("table",{style:{tableLayout:e(450)},children:a.jsxs("tbody",{children:[a.jsxs("tr",{className:e(475),children:[a[e(100)]("td",{className:e(435),style:{width:e(123)},children:e(384)}),[1,2][e(486)](n=>a[e(100)]("td",{children:n},n))]}),[1,2,3][e(486)](n=>a[e(369)]("tr",{children:[a.jsx("td",{className:"row-label",children:e(n===1?285:n===2?428:232)}),[...Array(2)].map((f,o)=>a[e(100)]("td",{children:y?.[n]?.[e(397)].st[o]??""},o))]},n))]})})]}),a[e(100)](e(278),{className:"col-span-1",children:a[e(369)]("table",{style:{tableLayout:e(450)},children:[a.jsx("thead",{children:a.jsx("tr",{className:e(475),children:a[e(100)]("td",{colSpan:2,className:e(344),style:{fontSize:.7*s+e(453)},children:e(499)})})}),a[e(100)]("tbody",{children:[1,2,3][e(486)](n=>a[e(369)]("tr",{children:[a[e(369)]("td",{className:e(389),style:{borderColor:d},children:[n===1?"1ST":n===2?e(373):"3RD",e(254)]}),a.jsx("td",{className:e(223),children:y?.[n]?.[e(397)].te||""})]},n))})]})}),a[e(100)](e(278),{className:e(456),children:a[e(369)](e(447),{style:{tableLayout:"fixed"},children:[a.jsx(e(258),{children:a[e(100)]("tr",{className:e(475),children:a[e(100)]("td",{colSpan:2,className:e(344),style:{fontSize:.7*s+e(453)},children:"FINAL GRADE"})})}),a[e(100)](e(208),{children:[1,2,3][e(486)](n=>a[e(369)]("tr",{children:[a[e(369)]("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:d},children:[n===1?"1ST":n===2?"2ND":e(209)," TERM"]}),a[e(100)]("td",{className:e(223),children:y?.[n]?.[e(134)]||""})]},n))}),a[e(100)](e(332),{children:a[e(100)]("tr",{style:{height:1.5*s+"px"},children:a.jsx("td",{colSpan:2,style:{border:e(270)}})})})]})}),a[e(369)](e(278),{className:e(311),style:{marginTop:J},children:[a[e(100)]("div",{className:e(142),children:a.jsx(e(339),{src:W+e(157),alt:e(178),className:e(524),style:{width:K*s,height:X*s}})}),a[e(100)](e(278),{className:e(295)}),a[e(100)]("p",{className:e(262),style:{fontSize:.6*s+"rem",marginTop:14*s+"px"},children:"Teacher's Signature"})]})]})]}),a[e(369)](e(278),{className:e(206),style:{borderColor:d},children:[a[e(100)](e(278),{className:e(126),children:"Daily Attendance"}),a[e(369)](e(447),{className:e(220),children:[a[e(369)](e(467),{children:[a[e(100)](e(313),{style:{width:"10%"}}),Array[e(283)]({length:N})[e(486)]((n,f)=>a[e(100)](e(313),{style:{width:e(204)}},f)),a[e(100)](e(313),{style:{width:"7%"}})]}),a.jsx("thead",{children:a[e(369)]("tr",{children:[a[e(100)]("th",{className:"month-col uppercase",children:e(353)}),a[e(100)]("th",{colSpan:N,className:e(489),children:e(173)}),a.jsx("th",{className:"absences-header uppercase",children:e(315)})]})}),a.jsx(e(208),{children:[{name:e(520),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:"JULY",dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:"AUGUST",dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:e(482),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:"OCTOBER",dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:e(408),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:e(431),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:e(364),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:"FEBRUARY",dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:e(113),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:e(172),dates:[1,2,5,6,7,8]}].map(n=>a[e(369)]("tr",{children:[a[e(100)]("td",{className:"month-col",children:n[e(320)]}),i0(n.dates).map((f,o)=>a[e(100)]("td",{className:"attendance-date-cell",style:{color:E(n[e(320)],f)?e(404):e(347)},children:f},o)),a[e(100)]("td",{className:e(223),children:a0[n.name]||""})]},n[e(320)]))})]}),a.jsxs("div",{className:e(479),style:{borderColor:d},children:[a[e(369)](e(278),{className:"important-dates-box",children:[a.jsx(e(278),{className:e(184),children:"Important Dates"}),[[e(296),e(371)],["July 6, 2026",e(242)],[e(105),"Term 1: Summative Test #2"],["Aug 28, 2026","Term 1 Examination"],["Sept 1, 2026","Term 1 Examination"],[e(143),e(235)],[e(488),e(252)]][e(486)](([n,f])=>a.jsxs("div",{className:e(215),children:[a[e(100)]("div",{className:e(426),children:n}),a[e(100)](e(278),{className:e(396),children:f})]},n))]}),a[e(369)](e(278),{className:e(327),children:[a[e(100)]("div",{className:e(184),children:"Important Dates"}),[["Oct 7, 2026","Term 2: Summative Test #1"],[e(144),e(474)],[e(182),"Term 2 Examination"],["Dec 7-18, 2026",e(235)],[e(102),e(290)],["Jan 4, 2027","Start of Term 3"],[e(360),"Term 3: Summative Test #1"]][e(486)](([n,f])=>a[e(369)](e(278),{className:e(215),children:[a[e(100)]("div",{className:e(426),children:n}),a[e(100)](e(278),{className:e(396),children:f})]},n))]}),a[e(369)](e(278),{className:e(327),children:[a.jsx(e(278),{className:"important-dates-header uppercase italic",children:e(273)}),[[e(341),e(433)],[e(116),e(136)],["Mar 22-23, 2027",e(245)],[e(496),e(235)],[e(430),"End-of-Term Block"],[e(106),e(243)],[e(338),"End of Term 3"]][e(486)](([n,f])=>a[e(369)](e(278),{className:e(215),children:[a[e(100)](e(278),{className:e(426),children:n}),a[e(100)]("div",{className:e(396),children:f})]},n))]})]})]})]})]})})};function o0(){const x=[`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"80szMNNJ","w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200","245223GtbnfN","Filter learners by name or LRN...","SUBJECT","date-label uppercase","scores",`px;
                        width: `,"font-bold leading-tight","photo_url","student_lrn","values","Males (","red","Paper Size","toUpperCase","w-3 h-3 group-hover:-translate-y-0.5 transition-transform","NOVEMBER","flex items-center gap-1.5 lg:gap-2 shrink-0","warn",`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `,`; 
                        padding: `,"data-field uppercase font-bold border-2 whitespace-nowrap px-1","Learner Record","data-field uppercase font-bold border-2 whitespace-nowrap","transform","210mm 297mm","Processing LIR Records","BAGONG BARRIO NATIONAL HIGH SCHOOL","✓ Grades","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200","charAt","constructor","portrait","text","date-val uppercase","flex items-center gap-3","SECOND","section_grade_level","Apr 1-8, 2027","DECEMBER","localeCompare","Term 3: Summative Test #2","select","term-label","px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"#22c55e",`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `,"section_name",`rem; 
                        font-weight: 700; 
                        height: `,"space-y-2","track","subject_id","font-black uppercase italic","lir-bulk-render-container","table","middle_name",'{}.constructor("return this")( )',"fixed","13%","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200","rem","toString","attendance","col-span-1","210mm","gender","LAST NAME","student_section","school_year","Female Learners (","w-4 h-4 text-indigo-600 shrink-0","Bulk_LIR_","relative group","LIR_","colgroup","h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1","row-label","JUNIOR HIGH SCHOOL","Unknown error","w-3 h-3 group-hover:translate-y-0.5 transition-transform","relative group min-w-0 flex-1","Term 2: Summative Test #2","header-row-fill","subject_name","Learner's Individual Record Card",`; 
                        font-size: `,"flex items-stretch border-2 w-full overflow-hidden","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate","flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar","SEPTEMBER","school-logo.png",`;
                        border-radius: 8px;
                        height: `,"replace","map","PDF download complete!","Sept 16, 2026","dates-header-bar uppercase","student-info-table border-2","absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30","target","w-full h-full opacity-0 absolute inset-0 cursor-pointer","w-4 h-4","M.I","Mar 24-31, 2027","#86efac","flex justify-between items-center w-full overflow-hidden","TERM EXAM","header-subject-table border-collapse border-2","text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5","size","Bulk PDF download error:",'No learners found matching "',"Bulk print stream launched successfully.",`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,"font-normal ml-2","bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm","AUGUST","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden",`rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,"Bulk Print for selected learners",`px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: `,"final_grade","bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6","FEMALE",`px; 
                        padding: `,"px ","PRODUCT/PERFORMANCE TASK (PPTs)","JUNE","-9999px","__proto__","MALE","object-contain","Export Pipeline","1 X 1","h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","jsx","% complete...","Dec 18, 2026",`px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        color: #000000 !important;
                    }

                    .header-subject-table td {
                        overflow: visible !important;
                        text-overflow: clip !important;
                        white-space: nowrap !important;
                        width: auto !important;
                        height: auto !important;
                    }

                    .term-label {
                        color: #ef4444;
                        background-color: `," learners selected","July 28, 2026","Apr 6-7, 2027","w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform","info","w-full h-full object-cover","flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden",`; 
                        text-align: center; 
                        font-size: `,`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `,"MARCH","quarter",`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,"Mar 15-16, 2027","bind","Failed to launch bulk print.","Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections.","GRADE & SECTION","title","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10","40%","space-y-4","filter","lir-title-bar-custom mb-3 uppercase tracking-widest","relative flex items-center justify-center cursor-pointer shrink-0","grow flex flex-col gap-1 overflow-hidden","cancelled","4VIaeMJ","useState","ELEMENTARY","SENIOR HIGH SCHOOL","finalGrade","absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping","Term 3 Exam (Graduating)","Opening print stream for ","w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200","flex items-center gap-4 shrink-0","max-w-full max-h-full object-contain","max","mb-2","Sept 2-15, 2026","Oct 29, 2026","forEach","print","reduce","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]","round","1352730doyzfx",`rem; 
                        border-bottom: 2px solid `,"toLowerCase",`
                @media print {
                    @page {
                        size: `,"Subject",`rem;
                    }

                    .row-label {
                        background-color: `,"deped_logo_right.png","fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block","label-green py-1 border-2 px-1",`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `,"flex items-center justify-center bg-white overflow-hidden","school-forms","absent","text-[9px] font-medium text-slate-400","School Logo","data-field font-extrabold border-2 whitespace-nowrap",`px;
                        text-align: center;
                        height: `,"Zoom Out","return (function() ","some",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"APRIL","Dates","Male Learners (","button","label-green py-1 border-2","2948405CsAVtl","DepEd Logo","flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4","flex items-center gap-2.5 min-w-0","sort","Dec 3-4, 2026","297mm","important-dates-header uppercase italic","lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none","page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none","px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0","lir-print-root flex flex-col h-full bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white",`rem;
                        width: `,"quarterly_exam",` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0","561169yGVhxk","letter","Section","grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","relative flex-1 min-w-48","TEACHER","useCallback","relative group shrink-0","w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400","TOTAL",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"3.32%","useEffect","half-page-section border-t-4","h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","tbody","3RD","querySelectorAll","absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full","27ZSfjQP","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200",` !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        break-after: page !important;
                        page-break-after: always !important;
                    }
                    .lir-print-sheet:last-child {
                        break-after: auto !important;
                        page-break-after: auto !important;
                    }
                }
             `,"date-row","w-3 h-3","8.5in 11in","Failed to generate PDF download.","flex items-center justify-between px-1","attendance-table mb-3","w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors","summative_tests","font-bold",`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `,"11in","40px","transition-all duration-700 ease-out origin-top print:scale-100","w-28 h-28 text-slate-100 dark:text-slate-600","has","Folio","flex items-center gap-2","THIRD",`px;
                        box-sizing: border-box;
                        margin: 0 auto;
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        overflow: hidden;
                    }

                    .half-page-section {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-evenly;
                        overflow: hidden;
                        padding: `,"Bulk Print","End-of-Term Block",`px; 
                        border-right: 1px solid `,`rem; 
                        padding: `,"success",") translateZ(0)","Print single active learner","Bulk LIR Operations","Term 1: Summative Test #1","EOSY Rites","text-indigo-600 font-black","Term 3 Exam (Non-Grad)","Filter / Select Learners","male","z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full","ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","20%","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500","Start of Term 2","FIRST NAME"," TERM","uid","text-xs font-bold text-slate-800 truncate","w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors","thead","trace","h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300","entries","font-bold uppercase leading-none text-center","LRN: ","teacher_id","13in","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ","No sheets ready for PDF export.","written_works","trim","none","folio","Export failed: ","Important Dates","grid grid-cols-1 sm:grid-cols-2 gap-2","hidden","find","apply","div","8.5in",`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,`dd;
                        border: 1px solid `,"half-page-section","from","Processing LIR PDF pages: ","FIRST","0px","w-5 h-5","isArray","w-8 h-8 animate-spin","End of Term 2",".lir-bulk-sheet",`rem; 
                        min-height: `,"Print Single","flex gap-4 items-start w-full mt-2","signature-box bg-white","June 8-11, 2026","useMemo","16411186yqpRzU","lrn",`; 
                        color: black !important; 
                        font-size: `,"error","header-green py-1","All (","w-3 h-3 text-indigo-600","Download PDF",`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,"text-xs font-bold text-slate-600","space-y-1.5","Bulk Download PDF for selected learners","scale(","col-span-1 flex flex-col items-center justify-center pt-1","bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50","col","span","Total Abs.","first_name",`rem; 
                        flex: 1; 
                        line-height: 1;
                        display: block;
                        overflow: hidden;
                        text-overflow: ellipsis; 
                        white-space: nowrap;
                        color: black;
                    }

                    .student-info-table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: auto;
                    }
                `,"text-[10px] font-black text-slate-500 uppercase tracking-widest","label-green border-2 whitespace-nowrap","name","Preparing LIR sheets for bulk printing...","absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000","log",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,"slice","Bulk PDF","important-dates-box",`px;
                        font-size: `,"w-3.5 h-3.5",`;
                        padding: `,`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,"tfoot","-11px","School Year: ","push",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"color","Apr 8, 2027","img","card-container-combined print:m-0 print:shadow-none","Feb 16, 2027","text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums","lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always","font-bold py-1","value","relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30","inherit","includes","last_name","truncate","text-xs font-semibold text-slate-500"," - ","Months","text-sm font-black uppercase tracking-wide text-white",`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `,"w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0","p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0","text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none","w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0","Jan 25, 2027","24UpoZGj","relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl","flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider","JANUARY",`;
                        color: #000000 !important;
                        font-size: `,"Initializing vector PDF export pipeline...","Back to Hub","optgroup","jsxs",`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"Opening Block: Term 1","h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","2ND","w-4 h-4 text-slate-300 shrink-0",` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `,"getElementById","console",`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,"length","89132CbYlaG","text-[10px] text-slate-400 font-semibold uppercase tracking-widest","add","option","TERM","style","text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic",`;
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"306378VuXlzK","row-label py-1 px-1 border-2"];return o0=function(){return x},o0()}function px(){const x=n0,{students:k,sections:u,subjects:v,teachers:A,schoolProfile:T,activeSchoolYear:c,setCurrentView:d,classRecords:y,gradingSheetRecords:M,hpsRecords:a0,sf2Sheets:e}=Q0(),{user:W}=$0(),[N,i0]=m.useState(""),[E,P]=m[x(131)](null),[p,s]=m[x(131)](""),[Y,V]=m[x(131)](1),[B,R]=m[x(131)](x(497)),[L,Z]=m[x(131)]("#22c55e"),[_,K]=m.useState(x(271)),[X,J]=m[x(131)](!1),[C,F]=m.useState(new Set),[q,n]=m[x(131)](""),[f,o]=m.useState(!1),[j,O]=m[x(131)](0),[E0,Q]=m[x(131)](""),S=m.useMemo(()=>{const t=x;return u.find(r=>r[t(440)]===N||r.id===N)},[u,N]),D=m.useMemo(()=>{const t=x;return v.find(r=>r.id===p||r[t(476)]===p)},[v,p]),R0=m[x(297)](()=>{const t=x;if(!S)return[];const r=xx(W,S,v),l=new Set;return r[t(125)](i=>{const b=t,g=ex(i[b(476)]);return l[b(229)](g)?!1:(l[b(382)](g),!0)})},[S,v,W]),u0=m.useMemo(()=>{const t=x;if(D?.[t(264)]){const r=A[t(276)](l=>l[t(255)]===D.teacher_id||l.id===D[t(264)]);if(r)return r.displayName||r[t(320)]}return S?.adviser_name||""},[D,A,S]),t0=m[x(297)](()=>[...u].sort((t,r)=>{const l=U,i=(t.section_grade_level||"")[l(432)](r[l(429)]||"",void 0,{numeric:!0});return i!==0?i:(t.section_name||"")[l(432)](r[l(440)]||"")}),[u]),I0=m[x(297)](()=>{const t=x,r={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return t0[t(145)](l=>{const i=t,b=(l[i(429)]||"")[i(153)](),g=parseInt(b[i(485)](/\D/g,""))||0;b[i(348)]("kinder")||g>=1&&g<=6?r[i(132)][i(335)](l):g>=7&&g<=10?r[i(470)][i(335)](l):g>=11&&g<=12&&r[i(133)].push(l)}),r},[t0]);m[x(205)](()=>{if(!N&&t0.length===1){const t=setTimeout(()=>{i0(t0[0].section_name)},0);return()=>clearTimeout(t)}},[t0,N]),m[x(205)](()=>{const t=setTimeout(()=>{s(""),P(null),F(new Set)},0);return()=>clearTimeout(t)},[N]);const I=m[x(297)](()=>{const t=x;if(!N)return[];const r=u[t(276)](l=>l[t(440)]===N||l.id===N)?.id;return k[t(125)](l=>l.student_section===N||r&&l[t(460)]===r)},[k,N,u]),$=m[x(297)](()=>I[x(125)](t=>(t[x(458)]||"")[x(153)]()===x(247))[x(181)]((t,r)=>(t[x(349)]+", "+t.first_name)[x(432)](r[x(349)]+", "+r[x(316)])),[I]),x0=m.useMemo(()=>I[x(125)](t=>(t[x(458)]||"").toLowerCase()!==x(247))[x(181)]((t,r)=>(t[x(349)]+", "+t[x(316)]).localeCompare(r.last_name+", "+r[x(316)])),[I]),z0=()=>{const t=x;C[t(502)]===0&&I[t(379)]>0&&F(new Set(I[t(486)](r=>r[t(299)]))),J(!0)},h0=m[x(199)](t=>{const r=x;if(!t)return{};const l={};return e[r(125)](b=>b[r(461)]===c&&(b.section_id===S?.id||b.section_id===N))[r(145)](b=>{const g=r,h=b[g(455)]?.[t[g(299)]];if(h){const z=Object[g(402)](h)[g(125)](H=>H?.toLowerCase()===g(163)).length;z>0&&(l[b.month[g(406)]()]=z)}}),l},[e,c,S,N]),b0=m[x(199)]((t,r,l)=>{const i=x;if(!t||!r)return;const b={};return[1,2,3][i(145)](g=>{const h=i,z=y[h(276)](w=>w[h(401)]===t[h(299)]&&w.school_year===c&&Number(w[h(114)])===g&&(w.subject_id===l?.id||w[h(444)]===r))||M[h(276)](w=>w[h(401)]===t[h(299)]&&w[h(461)]===c&&Number(w.quarter)===g&&(w[h(444)]===l?.id||w[h(444)]===r)),H=a0.find(w=>(w.subject_id===l?.id||w[h(444)]===r)&&w[h(461)]===c&&Number(w[h(114)])===g),e0=(w,H0)=>{const v0=h,G0=Array[v0(288)](w)?w:[];return Array[v0(283)]({length:H0},(sx,U0)=>G0[U0]??"")},B0=z,F0=H,G=w=>w===""||w===null||w===void 0?"":w,y0=ax(t[h(299)],l?.id||p,g,c,y,M,a0,S?.[h(429)],S?.[h(443)]);b[g]={scores:{ww:e0(z?.[h(268)],10).map(G),pt:e0(z?.performance_tasks,10)[h(486)](G),st:e0(B0?.summative_tests,5)[h(486)](G),te:G(z?.[h(190)]??"")},hps:{ww:e0(H?.[h(268)],10).map(G),pt:e0(H?.performance_tasks,10)[h(486)](G),st:e0(F0?.[h(222)],5)[h(486)](G),te:G(H?.[h(190)]??"")},finalGrade:y0>0?y0:G(z?.[h(514)]??"")}}),b},[y,M,a0,c,S?.section_grade_level,S?.[x(443)],p]),A0=m[x(297)](()=>h0(E),[E,h0]),L0=m[x(297)](()=>b0(E,p,D),[E,p,D,b0]),g0=m[x(297)](()=>[...$,...x0],[$,x0]),r0=m[x(297)](()=>{const t=x;return g0[t(125)](r=>C[t(229)](r.lrn))},[g0,C]),s0=m[x(297)](()=>{const t=x;if(!q[t(269)]())return I;const r=q[t(153)]();return I[t(125)](l=>l.last_name[t(153)]().includes(r)||l.first_name[t(153)]()[t(348)](r)||l.lrn[t(348)](r))},[I,q]),m0=m[x(297)](()=>s0[x(125)](t=>(t.gender||"")[x(153)]()===x(247)),[s0]),p0=m[x(297)](()=>s0[x(125)](t=>(t[x(458)]||"").toLowerCase()==="female"),[s0]),C0=()=>{const t=x;if(!E)return;const r=document[t(121)],l=(E[t(349)]+"_"+E[t(316)]).replace(/[^a-z0-9]/gi,"_");document[t(121)]=t(466)+l+"_"+c,window[t(146)](),setTimeout(()=>{document.title=r},1e3)},w0=async()=>{const t=x;if(r0[t(379)]!==0){o(!0),O(10),Q(t(321));try{await new Promise(i=>setTimeout(i,400));const r=document[t(376)]("lir-bulk-render-container"),l=r?Array[t(283)](r[t(210)](t(291))):[];if(l[t(379)]===0){alert("No sheets ready for printing. Please try again."),o(!1);return}O(50),Q(t(137)+l[t(379)]+" learners..."),await rx({elements:l,paperSize:_,orientation:t(424),title:t(464)+(S?.[t(440)]||t(195))+"_"+(D?.[t(476)]||"Subject")}),O(100),Q(t(505)),setTimeout(()=>{o(!1),J(!1)},600)}catch(r){console.error("Bulk print error:",r),alert(t(118)),o(!1)}}},N0=async()=>{const t=x;if(r0[t(379)]!==0){o(!0),O(5),Q(t(366));try{await new Promise(z=>setTimeout(z,400));const r=document.getElementById("lir-bulk-render-container"),l=r?Array[t(283)](r[t(210)](t(291))):[];if(l[t(379)]===0){alert(t(267)),o(!1);return}const i=(S?.section_name||N||t(195))[t(485)](/[^a-z0-9]/gi,"_"),b=(D?.[t(476)]||t(155))[t(485)](/[^a-z0-9]/gi,"_"),g=t(466)+i+"_"+b+"_"+c,h=await tx({elements:l,filename:g,paperSize:_,orientation:t(424),title:g,onProgressChange:z=>{const H=t;O(z),Q(H(284)+z+H(101))}});h[t(238)]?(O(100),Q(t(487)),setTimeout(()=>{o(!1),J(!1)},800)):(h[t(129)]||alert(t(272)+(h[t(301)]||t(471))),o(!1))}catch(r){console[t(301)](t(503),r),alert(t(218)),o(!1)}}},k0=t=>{F(r=>{const l=U,i=new Set(r);return i[l(229)](t)?i.delete(t):i[l(382)](t),i})},O0=()=>{const t=x;F(new Set(I[t(486)](r=>r[t(299)])))},D0=()=>{const t=x;F(new Set($[t(486)](r=>r[t(299)])))},M0=()=>{const t=x;F(new Set(x0[t(486)](r=>r.lrn)))},P0=()=>{F(new Set)};return a[x(369)](x(278),{className:x(188),children:[a.jsxs(x(278),{className:x(248),children:[a.jsx(x(278),{className:x(491)}),a[x(369)]("div",{className:x(110),children:[a[x(369)]("div",{className:x(409),children:[a[x(100)](x(175),{onClick:()=>d(x(162)),className:x(392),title:x(367),children:a.jsx(Y0,{className:"w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"})}),a[x(369)](x(278),{className:"flex flex-col shrink-0",children:[a[x(100)]("h2",{className:x(501),children:x(414)}),a.jsx("p",{className:x(358),children:"Individual LIR"})]})]}),a[x(100)]("div",{className:x(192)}),a[x(369)](x(278),{className:"relative group min-w-0 flex-1",children:[a[x(369)](x(434),{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate",value:N,onChange:t=>{i0(t[x(492)].value),P(null),s("")},children:[a[x(100)](x(383),{value:"",children:"Choose Section"}),Object[x(261)](I0)[x(486)](([t,r])=>r[x(379)]>0&&a[x(100)](x(368),{label:t,children:r[x(486)](l=>a[x(369)]("option",{value:l[x(440)],children:[l[x(429)],x(352),l[x(440)]]},l.id))},t))]}),a[x(100)](d0,{className:x(257)})]}),a[x(369)](x(278),{className:x(473),children:[a[x(369)](x(434),{className:x(480),value:p,onChange:t=>{s(t[x(492)].value),P(null)},disabled:!N,children:[a[x(100)](x(383),{value:"",children:"Select Subject"}),R0.map(t=>a[x(100)](x(383),{value:t.id,children:t[x(476)]},t.id))]}),a[x(100)](d0,{className:x(257)})]}),a.jsxs("div",{className:"relative group min-w-0 flex-1",children:[a.jsxs(x(434),{className:x(421),value:E?.[x(299)]||"",onChange:t=>{const r=x,l=k[r(276)](i=>i.lrn===t.target[r(345)])||null;P(l)},disabled:!p,children:[a[x(100)](x(383),{value:"",children:"Select Learner"}),$[x(379)]>0&&a[x(100)](x(368),{label:x(523),children:$[x(486)](t=>{const r=x,l=p&&(y[r(170)](i=>i[r(401)]===t.lrn&&i.subject_id===p&&i[r(461)]===c)||M.some(i=>i.student_lrn===t[r(299)]&&i[r(444)]===p&&i[r(461)]===c));return a[r(369)]("option",{value:t[r(299)],children:[t[r(349)],", ",t[r(316)]," ",l?"✓":""]},t[r(299)])})}),x0[x(379)]>0&&a[x(100)](x(368),{label:x(516),children:x0[x(486)](t=>{const r=x,l=p&&(y[r(170)](i=>i[r(401)]===t[r(299)]&&i[r(444)]===p&&i[r(461)]===c)||M[r(170)](i=>i.student_lrn===t[r(299)]&&i.subject_id===p&&i[r(461)]===c));return a.jsxs(r(383),{value:t[r(299)],children:[t.last_name,", ",t[r(316)]," ",l?"✓":""]},t.lrn)})})]}),a[x(100)](d0,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),a[x(100)](x(278),{className:x(192)}),a[x(369)](x(278),{className:x(200),children:[a[x(369)](x(434),{value:_,onChange:t=>K(t[x(492)][x(345)]),className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200",title:x(405),children:[a[x(100)](x(383),{value:"a4",children:"A4"}),a[x(100)](x(383),{value:"letter",children:"Letter"}),a[x(100)](x(383),{value:"folio",children:x(230)})]}),a.jsx(d0,{className:x(257)})]}),a.jsxs(x(278),{className:"flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5",children:[a.jsxs(x(278),{className:x(127),title:"Choose Fill Color",children:[a[x(100)](x(278),{className:x(356),style:{backgroundColor:B,width:18,height:18}}),a[x(100)]("input",{type:"color",value:B,onChange:t=>R(t[x(492)][x(345)]),className:x(493)})]}),a.jsxs(x(278),{className:x(127),title:"Choose Outline Color",children:[a.jsx(x(278),{className:x(356),style:{backgroundColor:L,width:18,height:18}}),a[x(100)]("input",{type:x(337),value:L,onChange:t=>Z(t[x(492)].value),className:x(493)})]})]}),a[x(369)](x(278),{className:"flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0",children:[a[x(100)](x(175),{onClick:()=>V(t=>Math[x(141)](.4,t-.1)),className:"w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200",title:x(168),children:a.jsx(V0,{className:x(216)})}),a[x(369)]("span",{className:x(342),children:[Math[x(150)](Y*100),"%"]}),a[x(100)](x(175),{onClick:()=>V(t=>Math.min(1.5,t+.1)),className:x(138),title:"Zoom In",children:a[x(100)](q0,{className:x(216)})})]}),a.jsxs(x(175),{onClick:z0,disabled:!N||!p||I[x(379)]===0,className:x(249),title:x(246),children:[a[x(100)](_0,{className:x(107)}),"Select (",C[x(502)],")"]}),a[x(369)](x(175),{onClick:N0,disabled:!N||!p||r0[x(379)]===0,className:x(527),title:x(309),children:[a[x(100)](j0,{className:x(407)}),x(326)]}),a[x(369)](x(175),{onClick:w0,disabled:!N||!p||r0[x(379)]===0,className:x(207),title:x(512),children:[a[x(100)](c0,{className:"w-3 h-3 group-hover:scale-110 transition-transform"}),x(234)]}),a.jsxs(x(175),{onClick:C0,disabled:!E,className:"h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(240),children:[a[x(100)](c0,{className:x(472)}),x(293)]})]})]}),a[x(100)](x(278),{className:x(481),children:a.jsx("div",{className:x(359),children:E?a[x(100)]("div",{className:x(227),style:{transform:x(310)+Y+x(239),willChange:x(416),backfaceVisibility:x(275),WebkitBackfaceVisibility:x(275)},children:a.jsxs(x(278),{className:x(465),children:[a.jsx(x(278),{className:x(322)}),a.jsx("div",{className:x(185),children:a.jsx(T0,{pageNumber:1,student:E,profile:T,schoolYear:c,subject:D?.[x(476)]||"",teacher:u0,fillColor:B,outlineColor:L,gradeData:L0,attendanceData:A0,paperSize:_})})]})}):a.jsxs(x(278),{className:x(122),children:[a[x(369)](x(278),{className:"relative group",children:[a[x(100)](x(278),{className:x(211)}),a[x(369)](x(278),{className:x(362),children:[a[x(100)](W0,{className:x(228)}),a.jsxs(x(278),{className:"absolute inset-0 flex flex-col items-center justify-center",children:[a.jsx(x(314),{className:x(386),children:"LIR"}),a[x(100)](x(278),{className:"w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4"})]}),a[x(100)](x(278),{className:x(251),children:a.jsx(c0,{className:"w-10 h-10 text-white"})})]})]}),a[x(369)]("div",{className:x(124),children:[a[x(100)]("h2",{className:"text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase",children:"Individual Record"}),a[x(100)]("p",{className:"text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60",children:x(119)})]})]})})}),a[x(100)](x(278),{id:x(446),className:x(158),style:{left:x(521)},children:r0[x(486)](t=>{const r=x,l=b0(t,p,D),i=h0(t);return a[r(100)](r(278),{className:r(343),children:a[r(100)](T0,{pageNumber:1,student:t,profile:T,schoolYear:c,subject:D?.[r(476)]||"",teacher:u0,fillColor:B,outlineColor:L,gradeData:l,attendanceData:i,paperSize:_})},t.lrn)})}),X&&a[x(100)](x(278),{className:x(452),children:a.jsxs(x(278),{className:x(149),children:[a.jsxs("div",{className:x(187),children:[a[x(369)]("div",{className:x(427),children:[a[x(100)](x(278),{className:x(201),children:a[x(100)](_0,{className:x(287)})}),a[x(369)](x(278),{children:[a.jsx("h3",{className:x(354),children:x(241)}),a.jsxs("p",{className:x(381),children:[S?.[x(429)]," - ",S?.section_name," | ",D?.[x(476)]]})]})]}),a[x(100)]("button",{onClick:()=>J(!1),className:x(221),children:a.jsx(Z0,{className:x(494)})})]}),a.jsxs("div",{className:x(357),children:[a.jsxs(x(278),{className:x(197),children:[a[x(100)](K0,{className:"w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"}),a[x(100)]("input",{type:x(425),placeholder:x(394),value:q,onChange:t=>n(t[x(492)].value),className:"w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"})]}),a.jsxs(x(278),{className:"flex items-center gap-1.5 flex-wrap",children:[a[x(369)](x(175),{onClick:O0,className:x(468),children:[a.jsx(f0,{className:x(304)}),x(303),I[x(379)],")"]}),a.jsxs(x(175),{onClick:D0,className:x(468),children:[x(403),$[x(379)],")"]}),a.jsxs("button",{onClick:M0,className:x(468),children:["Females (",x0[x(379)],")"]}),a[x(100)](x(175),{onClick:P0,className:"h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1",children:"Clear"})]})]}),a[x(369)]("div",{className:x(179),children:[m0.length>0&&a[x(369)](x(278),{className:x(442),children:[a.jsx(x(278),{className:x(219),children:a[x(369)]("span",{className:x(318),children:[x(174),m0[x(379)],")"]})}),a[x(100)](x(278),{className:x(274),children:m0[x(486)](t=>{const r=x,l=C.has(t[r(299)]),i=p&&(y[r(170)](b=>b[r(401)]===t[r(299)]&&b.subject_id===p&&b.school_year===c)||M.some(b=>b[r(401)]===t.lrn&&b[r(444)]===p&&b[r(461)]===c));return a[r(369)]("div",{onClick:()=>k0(t[r(299)]),className:r(266)+r(l?508:312),children:[a[r(369)]("div",{className:"flex items-center gap-2.5 min-w-0",children:[l?a.jsx(f0,{className:r(463)}):a[r(100)](S0,{className:"w-4 h-4 text-slate-300 shrink-0"}),a[r(369)](r(278),{className:r(350),children:[a.jsxs("p",{className:"text-xs font-bold text-slate-800 truncate",children:[t.last_name,", ",t.first_name," ",t[r(448)]?t.middle_name[0]+".":""]}),a[r(369)]("p",{className:r(164),children:[r(263),t[r(299)]]})]})]}),i&&a[r(100)](r(314),{className:r(436),children:r(420)})]},t[r(299)])})})]}),p0[x(379)]>0&&a.jsxs(x(278),{className:x(442),children:[a[x(100)](x(278),{className:x(219),children:a.jsxs("span",{className:x(318),children:[x(462),p0[x(379)],")"]})}),a[x(100)](x(278),{className:x(274),children:p0[x(486)](t=>{const r=x,l=C[r(229)](t.lrn),i=p&&(y.some(b=>b.student_lrn===t[r(299)]&&b[r(444)]===p&&b[r(461)]===c)||M[r(170)](b=>b[r(401)]===t.lrn&&b[r(444)]===p&&b[r(461)]===c));return a[r(369)](r(278),{onClick:()=>k0(t.lrn),className:r(266)+(l?"bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm":r(312)),children:[a[r(369)](r(278),{className:r(180),children:[l?a[r(100)](f0,{className:r(463)}):a[r(100)](S0,{className:r(374)}),a[r(369)]("div",{className:"truncate",children:[a[r(369)]("p",{className:r(256),children:[t[r(349)],", ",t[r(316)]," ",t[r(448)]?t[r(448)][0]+".":""]}),a[r(369)]("p",{className:r(164),children:[r(263),t[r(299)]]})]})]}),i&&a.jsx(r(314),{className:"px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0",children:r(420)})]},t[r(299)])})})]}),s0[x(379)]===0&&a[x(369)]("div",{className:"p-8 text-center text-slate-400 text-xs font-medium",children:[x(504),q,'".']})]}),a[x(369)](x(278),{className:"p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0",children:[a[x(369)]("div",{className:x(307),children:[a[x(100)](x(314),{className:x(244),children:C.size})," of ",I.length,x(104)]}),a[x(369)](x(278),{className:x(231),children:[a[x(369)](x(175),{onClick:N0,disabled:C[x(502)]===0,className:x(372),children:[a[x(100)](j0,{className:"w-3.5 h-3.5"}),x(305)]}),a[x(369)](x(175),{onClick:w0,disabled:C[x(502)]===0,className:"h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer",children:[a[x(100)](c0,{className:x(329)}),x(234)]})]})]})]})}),f&&a.jsx(x(278),{className:x(213),children:a.jsxs(x(278),{className:x(515),children:[a[x(369)](x(278),{className:"relative w-16 h-16 mx-auto flex items-center justify-center",children:[a[x(100)](x(278),{className:x(135)}),a[x(100)](x(278),{className:x(346),children:a[x(100)](X0,{className:x(289)})})]}),a[x(369)]("div",{className:x(442),children:[a.jsx("h3",{className:"text-lg font-black text-slate-900 tracking-tight uppercase",children:x(418)}),a.jsx("p",{className:x(351),children:E0})]}),a.jsxs(x(278),{className:x(308),children:[a[x(100)](x(278),{className:"h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200",children:a[x(100)]("div",{className:x(260),style:{width:Math.max(5,j)+"%"}})}),a.jsxs(x(278),{className:x(363),children:[a.jsx("span",{children:x(525)}),a[x(369)]("span",{children:[j,"%"]})]})]})]})}),a[x(100)](x(385),{children:x(154)+(_==="a4"?x(417):_===x(194)?x(217):"8.5in 13in")+`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `+x(_==="a4"?457:279)+x(375)+(_==="a4"?"210mm":x(279))+x(191)+(_==="a4"?x(457):"8.5in")+` !important;
                        height: `+x(_==="a4"?183:_==="letter"?225:265)+x(214)})]})}export{px as LIRPage};
