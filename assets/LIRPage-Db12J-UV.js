import{N as a,L as p,cA as V0,bN as o0,cN as W0,ck as Q0,bj as T0,bV as E0,cm as h0,cM as K0,bx as X0,cJ as Z0,cP as w0,cQ as R0,bK as $0}from"./vendor-BM-1UYFO.js";import{b as xx,u as ex,X as ax,D as N0,ah as tx}from"./index-BHznoGK9.js";import{e as rx,p as lx}from"./pdf-export-HxVrnxxK.js";import"./vendor-pdf-libs-CgzHn2lQ.js";import"./vendor-firebase-D54sZql7.js";import"./vendor-framer-motion-CpxCSa2T.js";function U(x,k){return x=x-463,b0()[x]}const m0=U;(function(x,k){const g=U,y=x();for(;;)try{if(-parseInt(g(644))/1*(parseInt(g(617))/2)+-parseInt(g(463))/3+-parseInt(g(536))/4*(parseInt(g(737))/5)+parseInt(g(597))/6+-parseInt(g(473))/7*(parseInt(g(808))/8)+-parseInt(g(832))/9+parseInt(g(708))/10===k)break;y.push(y.shift())}catch{y.push(y.shift())}})(b0,526194);const n0=(function(){let x=!0;return function(k,g){const y=x?function(){if(g){const I=g.apply(k,arguments);return g=null,I}}:function(){};return x=!1,y}})(),q0=n0(void 0,function(){const x=U,k=function(){const D=U;let o;try{o=Function(D(511)+'{}.constructor("return this")( ));')()}catch{o=window}return o},g=k(),y=g[x(483)]=g.console||{},I=[x(655),x(647),x(805),x(539),x(626),x(636),"trace"];for(let D=0;D<I[x(862)];D++){const o=n0.constructor[x(593)][x(835)](n0),c=I[D],v=y[c]||o;o[x(580)]=n0.bind(n0),o[x(637)]=v[x(637)][x(835)](v),y[c]=o}});q0();const I0=({pageNumber:x,student:k,profile:g,schoolYear:y,subject:I,teacher:D,fillColor:o=m0(541),outlineColor:c="#22c55e",gradeData:v,paperSize:M=m0(616),attendanceData:W={}})=>{const e=m0,Q="./",w=25,i0=n=>Array[U(619)]({length:w},(h,j)=>n[j]??""),T=(n,u)=>{const h=U,j=Number(u);if(!j)return!1;const z=n[h(784)]();return z===h(726)&&j===12||z===h(582)&&(j===21||j===31)||z===h(853)&&(j===2||j===30)||z==="DECEMBER"&&j===8||z===h(638)&&j===1};let P="13in",f=e(793),l=1.12,Y=1.2,q=.8,F=.75,E=5,A=.8,K=40,_=240,X=100,Z=50,J=e(822);M==="a4"?(f="210mm",P="297mm",l=1.02,Y=.85,q=.55,F=.5,E=2,A=.65,K=26,_=140,X=80,Z=40):M===e(825)?(f=e(793),P=e(631),l=.98,Y=.85,q=.55,F=.5,E=3,A=.7,K=28,_=160,X=65,Z=32,J="-11px"):M==="folio"&&(f=e(793),P=e(561),l=.98,Y=.85,q=.55,F=.5,E=3,A=.7,K=28,_=160,X=65,Z=32,J=e(484));const L=(n,u)=>{const h=e,j=(n||"")[h(471)]();return j[h(862)]>32?u*.65:j[h(862)]>24?u*.78:j.length>16?u*.88:u},H=L(I,A*l),V=L(D,A*l);return a.jsx(e(850),{className:"lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0",children:a.jsxs("div",{className:"page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none",style:{width:f,height:P},children:[a[e(611)](e(728),{children:e(525)+f+" "+P+e(475)+c+e(696)+8*l+`px;
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
                        padding: `+5*l+e(643)+o+e(577)+c+e(629)+3*l+e(507)+.85*l+e(806)+o+`dd;
                        border: 1px solid `+c+`;
                        color: #000000 !important;
                        font-size: `+.6*l+e(590)+c+e(696)+2*l+`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `+.8*l+`rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `+.6*l+`rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `+c+e(696)+1.5*l+e(554)+24*l+e(658)+o+`44;
                        font-weight: 800;
                        font-size: `+.6*l+e(627)+o+e(689)+.6*l+e(864)+70*l+e(856)+o+e(865)+c+e(558)+K*l+`px;
                        width: `+_*l+e(516)+o+e(792)+.9*l+e(518)+4*l+e(869)+c+e(722)+c+`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `+c+`; 
                        text-align: center; 
                        font-size: `+.5*l+e(549)+21*l+e(844)+1*l+e(857)+o+`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `+.5*l+`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `+c+e(779)+o+e(672)+.9*l+e(834)+o+`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `+.45*l+e(480)+.5*l+`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `+c+e(861)+o+e(485)+3*l+e(466)+.85*l+e(555)+c+e(873)+c+e(567)+.45*l+`rem; 
                        min-height: `+18*l+e(656)+95*l+e(895)+c+`; 
                        padding: `+1.5*l+e(732)+4*l+e(654)+1.5*l+e(732)+4*l+e(602)+.42*l+`rem; 
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
                `}),a[e(872)](e(850),{className:e(741),children:[a[e(872)]("div",{className:"half-page-section",children:[a[e(872)]("div",{className:e(653),children:[a[e(872)]("div",{className:e(594),children:[a[e(611)]("div",{className:"flex items-center justify-center bg-white overflow-hidden",style:{width:64*l,height:64*l},children:a.jsx(e(817),{src:g[e(858)]||Q+e(506),alt:e(745),className:"max-w-full max-h-full object-contain",onError:n=>{const u=e;n[u(735)][u(550)]=Q+"school-logo.png"}})}),a[e(872)]("div",{children:[a[e(611)]("h1",{className:e(528),style:{fontSize:Y*l+"rem"},children:g[e(521)]||e(495)}),a[e(611)]("p",{className:e(497),style:{fontSize:q*l+e(618),color:c},children:e(759)}),a[e(872)]("p",{className:e(685),style:{fontSize:F*l+e(618)},children:[e(510),a[e(611)](e(713),{className:"font-normal ml-2",children:y})]})]})]}),a[e(611)](e(850),{className:e(729),children:a[e(611)](e(636),{className:e(819),style:{borderColor:c},children:a[e(611)](e(830),{children:a[e(872)]("tr",{children:[a[e(611)]("td",{className:e(815),style:{fontSize:A*l+e(618),padding:E*l+e(732)+E*2*l+"px",borderColor:c},children:"SUBJECT"}),a[e(611)]("td",{className:"data-field font-extrabold border-2 whitespace-nowrap",style:{fontSize:H+e(618),padding:E*l+e(732)+E*2.5*l+"px",borderColor:c},children:I}),a[e(611)]("td",{className:e(815),style:{fontSize:A*l+e(618),padding:E*l+e(732)+E*2*l+"px",borderColor:c},children:"TEACHER"}),a[e(611)]("td",{className:"data-field font-extrabold border-2 whitespace-nowrap",style:{fontSize:V+e(618),padding:E*l+"px "+E*2.5*l+"px",borderColor:c},children:D})]})})})})]}),a[e(872)](e(850),{className:"flex gap-4 items-start w-full mt-2",children:[a.jsx(e(850),{className:e(703),style:{width:1*l+"in",height:1*l+"in",borderColor:c},children:k[e(756)]?a[e(611)](e(817),{src:k[e(756)],alt:"1x1 Learner Photo",className:e(889)}):a[e(872)](e(713),{className:e(514),style:{fontSize:.7*l+e(618)},children:[e(490),a.jsx("br",{}),"PHOTO"]})}),a[e(611)](e(850),{className:e(592),children:a[e(611)](e(636),{className:e(782),style:{borderColor:c,height:1*l+"in"},children:a[e(872)]("tbody",{children:[a[e(872)]("tr",{style:{height:.5*l+"in"},children:[a[e(611)]("td",{className:e(680),style:{borderColor:c,height:.5*l+"in"},children:k[e(633)]}),a[e(611)]("td",{className:e(680),style:{borderColor:c,height:.5*l+"in"},children:k[e(681)]}),a[e(611)]("td",{className:e(774),style:{width:e(751),borderColor:c,height:.5*l+"in"},children:k[e(791)]?.[e(622)](0)||""}),a[e(611)]("td",{className:e(680),style:{borderColor:c,height:.5*l+"in"},children:k[e(481)]}),a[e(611)]("td",{className:e(680),style:{borderColor:c,height:.5*l+"in"},children:k.lrn})]}),a.jsxs("tr",{style:{height:.5*l+"in"},children:[a[e(611)]("td",{className:e(690),style:{borderColor:c,height:.5*l+"in"},children:e(645)}),a[e(611)]("td",{className:e(690),style:{borderColor:c,height:.5*l+"in"},children:e(743)}),a[e(611)]("td",{className:e(498),style:{width:e(751),borderColor:c,height:.5*l+"in"},children:e(587)}),a.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:c,height:.5*l+"in"},children:"GRADE & SECTION"}),a[e(611)]("td",{className:e(690),style:{borderColor:c,height:.5*l+"in"},children:"LRN"})]})]})})})]}),a.jsxs(e(850),{className:e(843),children:[a[e(872)]("div",{children:[a[e(611)](e(850),{className:e(769),style:{fontSize:.75*l+e(618)},children:e(818)}),a.jsx("table",{style:{tableLayout:e(476)},children:a.jsxs("tbody",{children:[a.jsxs("tr",{className:"header-row-fill",children:[a.jsx("td",{className:e(860),style:{width:e(814)},children:e(553)}),[1,2,3,4,5][e(583)](n=>a[e(611)]("td",{style:{width:e(787)},children:n},n)),a[e(611)]("td",{className:e(685),style:{width:"20%"},children:e(520)})]}),[1,2,3].map(n=>a[e(872)]("tr",{children:[a[e(611)]("td",{className:"row-label",children:n===1?e(651):n===2?e(880):"THIRD"}),[...Array(5)][e(583)]((u,h)=>a.jsx("td",{children:v?.[n]?.[e(750)].ww[h]??""},h)),a[e(611)]("td",{className:e(685),children:v?.[n]?.[e(750)].ww[e(757)](0,5)[e(493)]((u,h)=>u+(Number(h)||0),0)||""})]},n))]})})]}),a.jsxs(e(850),{children:[a[e(611)](e(850),{className:e(769),style:{fontSize:.75*l+e(618)},children:e(468)}),a[e(611)](e(636),{style:{tableLayout:e(476)},children:a[e(872)](e(830),{children:[a[e(872)]("tr",{className:"header-row-fill",children:[a.jsx("td",{className:e(860),style:{width:e(794)},children:e(553)}),[1,2,3][e(583)](n=>a.jsx("td",{style:{width:"20%"},children:n},n)),a.jsx("td",{className:"font-bold",style:{width:"20%"},children:"TOTAL"})]}),[1,2,3][e(583)](n=>a[e(872)]("tr",{children:[a[e(611)]("td",{className:e(503),children:e(n===1?651:n===2?880:684)}),[...Array(3)][e(583)]((u,h)=>a[e(611)]("td",{children:v?.[n]?.[e(750)].pt[h]??""},h)),a[e(611)]("td",{className:"font-bold",children:v?.[n]?.scores.pt[e(757)](0,3)[e(493)]((u,h)=>u+(Number(h)||0),0)||""})]},n))]})})]})]}),a.jsxs(e(850),{className:e(766),children:[a[e(872)]("div",{className:e(720),children:[a[e(611)](e(850),{className:e(769),style:{fontSize:.7*l+e(618)},children:"SUMMATIVE TEST"}),a[e(611)]("table",{style:{tableLayout:e(476)},children:a[e(872)](e(830),{children:[a[e(872)]("tr",{className:e(522),children:[a[e(611)]("td",{className:e(860),style:{width:e(795)},children:e(553)}),[1,2][e(583)](n=>a.jsx("td",{children:n},n))]}),[1,2,3][e(583)](n=>a[e(872)]("tr",{children:[a[e(611)]("td",{className:e(503),children:e(n===1?651:n===2?880:684)}),[...Array(2)][e(583)]((u,h)=>a[e(611)]("td",{children:v?.[n]?.[e(750)].st[h]??""},h))]},n))]})})]}),a[e(611)](e(850),{className:e(720),children:a[e(872)](e(636),{style:{tableLayout:e(476)},children:[a[e(611)](e(591),{children:a.jsx("tr",{className:e(522),children:a[e(611)]("td",{colSpan:2,className:e(632),style:{fontSize:.7*l+e(618)},children:e(496)})})}),a.jsx(e(830),{children:[1,2,3].map(n=>a[e(872)]("tr",{children:[a[e(872)]("td",{className:e(742),style:{borderColor:c},children:[e(n===1?679:n===2?754:701),e(688)]}),a[e(611)]("td",{className:e(685),children:v?.[n]?.[e(750)].te||""})]},n))})]})}),a[e(611)]("div",{className:e(720),children:a[e(872)](e(636),{style:{tableLayout:e(476)},children:[a[e(611)]("thead",{children:a.jsx("tr",{className:e(522),children:a.jsx("td",{colSpan:2,className:e(632),style:{fontSize:.7*l+e(618)},children:"FINAL GRADE"})})}),a.jsx(e(830),{children:[1,2,3][e(583)](n=>a[e(872)]("tr",{children:[a[e(872)]("td",{className:e(742),style:{borderColor:c},children:[e(n===1?679:n===2?754:701)," TERM"]}),a[e(611)]("td",{className:e(685),children:v?.[n]?.[e(570)]||""})]},n))}),a[e(611)](e(763),{children:a.jsx("tr",{style:{height:1.5*l+"px"},children:a[e(611)]("td",{colSpan:2,style:{border:e(664)}})})})]})}),a[e(872)](e(850),{className:e(796),style:{marginTop:J},children:[a[e(611)]("div",{className:e(551),children:a[e(611)](e(817),{src:Q+e(755),alt:e(812),className:e(778),style:{width:X*l,height:Z*l}})}),a[e(611)](e(850),{className:e(563)}),a[e(611)]("p",{className:e(780),style:{fontSize:.6*l+"rem",marginTop:14*l+"px"},children:"Teacher's Signature"})]})]})]}),a[e(872)](e(850),{className:e(608),style:{borderColor:c},children:[a[e(611)](e(850),{className:e(758),children:e(678)}),a[e(872)]("table",{className:e(467),children:[a[e(872)](e(867),{children:[a[e(611)](e(604),{style:{width:e(544)}}),Array[e(619)]({length:w}).map((n,u)=>a[e(611)](e(604),{style:{width:e(699)}},u)),a[e(611)](e(604),{style:{width:"7%"}})]}),a.jsx("thead",{children:a.jsxs("tr",{children:[a[e(611)]("th",{className:e(661),children:"Months"}),a.jsx("th",{colSpan:w,className:e(893),children:"Dates"}),a[e(611)]("th",{className:e(836),children:e(823)})]})}),a[e(611)](e(830),{children:[{name:e(726),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:e(833),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:e(582),dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:e(667),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:e(885),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:e(853),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:"DECEMBER",dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:e(638),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:e(693),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:e(739),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:e(487),dates:[1,2,5,6,7,8]}].map(n=>a.jsxs("tr",{children:[a[e(611)]("td",{className:e(803),children:n[e(521)]}),i0(n.dates).map((u,h)=>a[e(611)]("td",{className:"attendance-date-cell",style:{color:T(n[e(521)],u)?e(762):e(837)},children:u},h)),a[e(611)]("td",{className:"font-bold",children:W[n[e(521)]]||""})]},n[e(521)]))})]}),a[e(872)]("div",{className:"flex items-stretch border-2 w-full overflow-hidden",style:{borderColor:c},children:[a[e(872)]("div",{className:e(725),children:[a[e(611)](e(850),{className:"important-dates-header uppercase italic",children:"Important Dates"}),[[e(623),"Opening Block: Term 1"],["July 6, 2026",e(892)],["July 28, 2026",e(848)],["Aug 28, 2026","Term 1 Examination"],["Sept 1, 2026",e(866)],[e(891),e(710)],[e(868),e(464)]][e(583)](([n,u])=>a.jsxs(e(850),{className:e(800),children:[a[e(611)](e(850),{className:"date-val uppercase",children:n}),a[e(611)](e(850),{className:e(534),children:u})]},n))]}),a[e(872)](e(850),{className:"important-dates-box",children:[a[e(611)]("div",{className:e(887),children:e(589)}),[[e(669),e(486)],[e(650),e(569)],[e(695),e(605)],[e(573),e(710)],[e(588),"End of Term 2"],[e(738),e(509)],["Jan 25, 2027",e(574)]][e(583)](([n,u])=>a.jsxs(e(850),{className:"date-row",children:[a[e(611)](e(850),{className:e(809),children:n}),a[e(611)]("div",{className:e(534),children:u})]},n))]}),a[e(872)](e(850),{className:e(725),children:[a.jsx(e(850),{className:"important-dates-header uppercase italic",children:e(589)}),[[e(785),"Term 3: Summative Test #2"],[e(652),e(829)],[e(855),"Term 3 Exam (Non-Grad)"],[e(640),e(710)],["Apr 1-8, 2027",e(710)],[e(820),"EOSY Rites"],[e(877),e(584)]][e(583)](([n,u])=>a[e(872)](e(850),{className:e(800),children:[a.jsx("div",{className:"date-val uppercase",children:n}),a[e(611)](e(850),{className:e(534),children:u})]},n))]})]})]})]})]})})};function mx(){const x=m0,{students:k,sections:g,subjects:y,teachers:I,schoolProfile:D,activeSchoolYear:o,setCurrentView:c,classRecords:v,gradingSheetRecords:M,hpsRecords:W,sf2Sheets:e}=xx(),{user:Q}=ex(),[w,i0]=p[x(538)](""),[T,P]=p[x(538)](null),[f,l]=p[x(538)](""),[Y,q]=p[x(538)](1),[F,E]=p[x(538)]("#86efac"),[A,K]=p.useState("#22c55e"),[_,X]=p[x(538)](x(616)),[Z,J]=p[x(538)](!1),[L,H]=p[x(538)](new Set),[V,n]=p[x(538)](""),[u,h]=p[x(538)](!1),[j,z]=p[x(538)](0),[A0,$]=p[x(538)](""),S=p[x(552)](()=>{const t=x;return g[t(883)](r=>r[t(556)]===w||r.id===w)},[g,w]),O=p.useMemo(()=>y[x(883)](r=>r.id===f||r.subject_name===f),[y,f]),L0=p[x(552)](()=>{if(!S)return[];const t=ax(Q,S,y),r=new Set;return t.filter(s=>{const i=U,m=N0(s.subject_name);return r.has(m)?!1:(r[i(847)](m),!0)})},[S,y,Q]),k0=p[x(552)](()=>{const t=x;if(O?.[t(686)]){const r=I[t(883)](s=>s[t(492)]===O.teacher_id||s.id===O.teacher_id);if(r)return r[t(579)]||r[t(521)]}return S?.[t(881)]||""},[O,I,S]),t0=p.useMemo(()=>{const t=x;return[...g][t(767)]((r,s)=>{const i=t,m=(r.section_grade_level||"")[i(668)](s[i(586)]||"",void 0,{numeric:!0});return m!==0?m:(r[i(556)]||"")[i(668)](s.section_name||"")})},[g]),z0=p[x(552)](()=>{const t=x,r={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return t0[t(533)](s=>{const i=t,m=(s[i(586)]||"")[i(502)](),N=parseInt(m[i(675)](/\D/g,""))||0;m[i(687)](i(575))||N>=1&&N<=6?r[i(773)][i(752)](s):N>=7&&N<=10?r[i(802)][i(752)](s):N>=11&&N<=12&&r[i(886)][i(752)](s)}),r},[t0]);p.useEffect(()=>{const t=x;if(!w&&t0[t(862)]===1){const r=setTimeout(()=>{const s=t;i0(t0[0][s(556)])},0);return()=>clearTimeout(r)}},[t0,w]),p.useEffect(()=>{const t=setTimeout(()=>{l(""),P(null),H(new Set)},0);return()=>clearTimeout(t)},[w]);const R=p[x(552)](()=>{const t=x;if(!w)return[];const r=g[t(883)](s=>s[t(556)]===w||s.id===w)?.id;return k[t(620)](s=>s[t(481)]===w||r&&s.student_section===r)},[k,w,g]),x0=p.useMemo(()=>R[x(620)](t=>(t.gender||"")[x(502)]()===x(470))[x(767)]((t,r)=>(t[x(633)]+", "+t[x(681)])[x(668)](r[x(633)]+", "+r[x(681)])),[R]),e0=p[x(552)](()=>R[x(620)](t=>(t[x(657)]||"")[x(502)]()!=="male")[x(767)]((t,r)=>(t[x(633)]+", "+t[x(681)]).localeCompare(r[x(633)]+", "+r[x(681)])),[R]),O0=()=>{const t=x;L[t(888)]===0&&R[t(862)]>0&&H(new Set(R.map(r=>r.lrn))),J(!0)},p0=p.useCallback(t=>{const r=x;if(!t)return{};const s={};return e[r(620)](m=>m.school_year===o&&(m[r(894)]===S?.id||m[r(894)]===w)).forEach(m=>{const N=r,d=m.attendance?.[t.lrn];if(d){const C=Object.values(d)[N(620)](B=>B?.[N(502)]()===N(797))[N(862)];C>0&&(s[m[N(662)][N(784)]()]=C)}}),s},[e,o,S,w]),f0=p[x(827)]((t,r,s)=>{const i=x;if(!t||!r)return;const m={};return[1,2,3][i(533)](N=>{const d=i,C=(b,d0)=>{const s0=U;return!!(b===s?.id||b===r||d0&&s?.[s0(671)]&&N0(d0)===N0(s[s0(671)]))},B=v[d(883)](b=>b.student_lrn===t[d(719)]&&b[d(736)]===o&&Number(b[d(601)])===N&&C(b[d(543)],b[d(671)]))||M[d(883)](b=>b[d(845)]===t[d(719)]&&b[d(736)]===o&&Number(b[d(601)])===N&&C(b.subject_id,b[d(671)])),c0=W[d(883)](b=>C(b.subject_id,b[d(671)])&&b.school_year===o&&Number(b[d(601)])===N&&(b[d(894)]===t[d(481)]||S?.id&&b[d(894)]===S.id))||W[d(883)](b=>C(b[d(543)],b[d(671)])&&b[d(736)]===o&&Number(b.quarter)===N),a0=(b,d0)=>{const s0=d,J0=Array[s0(634)](b)?b:[];return Array[s0(619)]({length:d0},(sx,Y0)=>J0[Y0]??"")},G0=B,U0=c0,G=b=>b===""||b===null||b===void 0?"":b,S0=tx(t[d(719)],s?.id||f,N,o,v,M,W,S?.section_grade_level,S?.track);m[N]={scores:{ww:a0(B?.written_works,10).map(G),pt:a0(B?.[d(531)],10)[d(583)](G),st:a0(G0?.summative_tests,5)[d(583)](G),te:G(B?.[d(478)]??"")},hps:{ww:a0(c0?.[d(562)],10)[d(583)](G),pt:a0(c0?.[d(531)],10).map(G),st:a0(U0?.[d(581)],5)[d(583)](G),te:G(c0?.[d(478)]??"")},finalGrade:S0>0?S0:G(B?.[d(878)]??"")}}),m},[v,M,W,o,S,f]),C0=p.useMemo(()=>p0(T),[T,p0]),D0=p[x(552)](()=>f0(T,f,O),[T,f,O,f0]),v0=p[x(552)](()=>[...x0,...e0],[x0,e0]),r0=p.useMemo(()=>{const t=x;return v0[t(620)](r=>L[t(723)](r[t(719)]))},[v0,L]),l0=p[x(552)](()=>{const t=x;if(!V.trim())return R;const r=V[t(502)]();return R[t(620)](s=>s[t(633)][t(502)]()[t(687)](r)||s[t(681)][t(502)]()[t(687)](r)||s[t(719)][t(687)](r))},[R,V]),u0=p[x(552)](()=>l0[x(620)](t=>(t.gender||"")[x(502)]()===x(470)),[l0]),g0=p[x(552)](()=>l0.filter(t=>(t[x(657)]||"")[x(502)]()===x(730)),[l0]),M0=()=>{const t=x;if(!T)return;const r=document[t(765)],s=(T[t(633)]+"_"+T.first_name)[t(675)](/[^a-z0-9]/gi,"_");document[t(765)]=t(824)+s+"_"+o,window[t(870)](),setTimeout(()=>{document.title=r},1e3)},y0=async()=>{const t=x;if(r0[t(862)]!==0){h(!0),z(10),$(t(603));try{await new Promise(i=>setTimeout(i,400));const r=document.getElementById(t(504)),s=r?Array[t(619)](r[t(789)](t(691))):[];if(s[t(862)]===0){alert("No sheets ready for printing. Please try again."),h(!1);return}z(50),$(t(545)+s[t(862)]+" learners..."),await lx({elements:s,paperSize:_,orientation:t(702),title:t(559)+(S?.section_name||t(816))+"_"+(O?.[t(671)]||"Subject")}),z(100),$("Bulk print stream launched successfully."),setTimeout(()=>{h(!1),J(!1)},600)}catch(r){console.error(t(670),r),alert(t(694)),h(!1)}}},_0=async()=>{const t=x;if(r0[t(862)]!==0){h(!0),z(5),$("Initializing vector PDF export pipeline...");try{await new Promise(C=>setTimeout(C,400));const r=document.getElementById(t(504)),s=r?Array[t(619)](r[t(789)](t(691))):[];if(s[t(862)]===0){alert(t(676)),h(!1);return}const i=(S?.[t(556)]||w||"Section")[t(675)](/[^a-z0-9]/gi,"_"),m=(O?.[t(671)]||"Subject").replace(/[^a-z0-9]/gi,"_"),N=t(824)+i+"_"+m+"_"+o,d=await rx({elements:s,filename:N,paperSize:_,orientation:"portrait",title:N,onProgressChange:C=>{const B=t;z(C),$(B(548)+C+B(501))}});d.success?(z(100),$("PDF download complete!"),setTimeout(()=>{h(!1),J(!1)},800)):(d[t(596)]||alert(t(772)+(d[t(539)]||"Unknown error")),h(!1))}catch(r){console[t(539)](t(469),r),alert("Failed to generate PDF download."),h(!1)}}},j0=t=>{H(r=>{const s=U,i=new Set(r);return i[s(723)](t)?i[s(659)](t):i[s(847)](t),i})},P0=()=>{const t=x;H(new Set(R.map(r=>r[t(719)])))},B0=()=>{const t=x;H(new Set(x0[t(583)](r=>r[t(719)])))},F0=()=>{const t=x;H(new Set(e0[t(583)](r=>r.lrn)))},H0=()=>{H(new Set)};return a[x(872)](x(850),{className:"lir-print-root flex flex-col h-full bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white",children:[a.jsxs(x(850),{className:x(665),children:[a.jsx("div",{className:x(712)}),a.jsxs("div",{className:"flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden",children:[a[x(872)](x(850),{className:x(508),children:[a[x(611)](x(786),{onClick:()=>c(x(585)),className:"w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200",title:"Back to Hub",children:a[x(611)](V0,{className:x(697)})}),a.jsxs("div",{className:x(477),children:[a[x(611)]("h2",{className:x(489),children:x(753)}),a[x(611)]("p",{className:x(746),children:x(479)})]})]}),a[x(611)](x(850),{className:x(734)}),a[x(872)]("div",{className:x(721),children:[a[x(872)]("select",{className:x(568),value:w,onChange:t=>{const r=x;i0(t.target[r(649)]),P(null),l("")},children:[a[x(611)](x(564),{value:"",children:x(491)}),Object[x(499)](z0)[x(583)](([t,r])=>r[x(862)]>0&&a[x(611)]("optgroup",{label:t,children:r.map(s=>a[x(872)]("option",{value:s[x(556)],children:[s.section_grade_level,x(625),s[x(556)]]},s.id))},t))]}),a[x(611)](o0,{className:x(718)})]}),a.jsxs(x(850),{className:"relative group min-w-0 flex-1",children:[a[x(872)](x(842),{className:x(512),value:f,onChange:t=>{const r=x;l(t.target[r(649)]),P(null)},disabled:!w,children:[a[x(611)](x(564),{value:"",children:x(799)}),L0[x(583)](t=>a[x(611)](x(564),{value:t.id,children:t[x(671)]},t.id))]}),a[x(611)](o0,{className:x(718)})]}),a[x(872)](x(850),{className:x(721),children:[a.jsxs(x(842),{className:x(840),value:T?.lrn||"",onChange:t=>{const r=x,s=k[r(883)](i=>i[r(719)]===t[r(735)].value)||null;P(s)},disabled:!f,children:[a.jsx("option",{value:"",children:x(771)}),x0[x(862)]>0&&a[x(611)](x(578),{label:x(841),children:x0.map(t=>{const r=x,s=f&&(v[r(612)](i=>i[r(845)]===t[r(719)]&&i[r(543)]===f&&i.school_year===o)||M.some(i=>i[r(845)]===t.lrn&&i.subject_id===f&&i[r(736)]===o));return a.jsxs("option",{value:t[r(719)],children:[t.last_name,", ",t[r(681)]," ",s?"✓":""]},t[r(719)])})}),e0[x(862)]>0&&a[x(611)](x(578),{label:x(527),children:e0.map(t=>{const r=x,s=f&&(v[r(612)](i=>i.student_lrn===t[r(719)]&&i[r(543)]===f&&i.school_year===o)||M.some(i=>i.student_lrn===t[r(719)]&&i[r(543)]===f&&i[r(736)]===o));return a[r(872)](r(564),{value:t[r(719)],children:[t[r(633)],", ",t[r(681)]," ",s?"✓":""]},t.lrn)})})]}),a.jsx(o0,{className:x(718)})]}),a[x(611)](x(850),{className:"h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0"}),a[x(872)]("div",{className:x(532),children:[a[x(872)](x(842),{value:_,onChange:t=>X(t[x(735)].value),className:x(826),title:x(777),children:[a.jsx(x(564),{value:"a4",children:"A4"}),a[x(611)](x(564),{value:x(825),children:x(673)}),a.jsx("option",{value:x(616),children:x(560)})]}),a[x(611)](o0,{className:x(718)})]}),a[x(872)](x(850),{className:x(727),children:[a[x(872)]("div",{className:x(639),title:x(813),children:[a[x(611)](x(850),{className:x(610),style:{backgroundColor:F,width:18,height:18}}),a[x(611)](x(607),{type:x(714),value:F,onChange:t=>E(t[x(735)].value),className:x(776)})]}),a[x(872)](x(850),{className:x(639),title:x(859),children:[a[x(611)](x(850),{className:x(610),style:{backgroundColor:A,width:18,height:18}}),a.jsx(x(607),{type:x(714),value:A,onChange:t=>K(t[x(735)][x(649)]),className:x(776)})]})]}),a[x(872)](x(850),{className:x(764),children:[a[x(611)](x(786),{onClick:()=>q(t=>Math[x(648)](.4,t-.1)),className:x(846),title:x(747),children:a[x(611)](W0,{className:x(849)})}),a[x(872)](x(713),{className:x(635),children:[Math[x(798)](Y*100),"%"]}),a[x(611)](x(786),{onClick:()=>q(t=>Math[x(571)](1.5,t+.1)),className:x(846),title:x(641),children:a[x(611)](Q0,{className:x(849)})})]}),a[x(872)](x(786),{onClick:O0,disabled:!w||!f||R[x(862)]===0,className:"ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(517),children:[a[x(611)](T0,{className:x(683)}),"Select (",L[x(888)],")"]}),a.jsxs(x(786),{onClick:_0,disabled:!w||!f||r0[x(862)]===0,className:"h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(614),children:[a[x(611)](E0,{className:x(788)}),x(740)]}),a.jsxs(x(786),{onClick:y0,disabled:!w||!f||r0[x(862)]===0,className:"h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(646),children:[a[x(611)](h0,{className:"w-3 h-3 group-hover:scale-110 transition-transform"}),x(609)]}),a[x(872)](x(786),{onClick:M0,disabled:!T,className:"h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(488),children:[a[x(611)](h0,{className:"w-3 h-3 group-hover:translate-y-0.5 transition-transform"}),x(716)]})]})]}),a[x(611)](x(850),{className:"flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar",children:a[x(611)](x(850),{className:x(682),children:T?a[x(611)](x(850),{className:x(807),style:{transform:x(523)+Y+x(879),willChange:x(768),backfaceVisibility:x(595),WebkitBackfaceVisibility:"hidden"},children:a[x(872)](x(850),{className:x(828),children:[a[x(611)](x(850),{className:"absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000"}),a[x(611)]("div",{className:x(642),children:a[x(611)](I0,{pageNumber:1,student:T,profile:D,schoolYear:o,subject:O?.[x(671)]||"",teacher:k0,fillColor:F,outlineColor:A,gradeData:D0,attendanceData:C0,paperSize:_})})]})}):a[x(872)](x(850),{className:x(513),children:[a.jsxs("div",{className:x(828),children:[a[x(611)](x(850),{className:x(494)}),a.jsxs(x(850),{className:x(783),children:[a[x(611)](K0,{className:"w-28 h-28 text-slate-100 dark:text-slate-600"}),a[x(872)](x(850),{className:x(731),children:[a.jsx(x(713),{className:"text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic",children:x(838)}),a[x(611)]("div",{className:x(526)})]}),a[x(611)]("div",{className:x(770),children:a[x(611)](h0,{className:x(717)})})]})]}),a[x(872)](x(850),{className:x(811),children:[a[x(611)]("h2",{className:x(724),children:x(613)}),a[x(611)]("p",{className:x(876),children:x(606)})]})]})})}),a[x(611)](x(850),{id:"lir-bulk-render-container",className:x(790),style:{left:x(749)},children:r0[x(583)](t=>{const r=x,s=f0(t,f,O),i=p0(t);return a.jsx(r(850),{className:"lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always",children:a.jsx(I0,{pageNumber:1,student:t,profile:D,schoolYear:o,subject:O?.[r(671)]||"",teacher:k0,fillColor:F,outlineColor:A,gradeData:s,attendanceData:i,paperSize:_})},t[r(719)])})}),Z&&a[x(611)](x(850),{className:x(821),children:a[x(872)]("div",{className:x(546),children:[a[x(872)]("div",{className:x(621),children:[a[x(872)]("div",{className:"flex items-center gap-3",children:[a[x(611)]("div",{className:x(744),children:a[x(611)](T0,{className:x(615)})}),a.jsxs(x(850),{children:[a[x(611)]("h3",{className:x(598),children:"Bulk LIR Operations"}),a.jsxs("p",{className:x(896),children:[S?.section_grade_level," - ",S?.[x(556)],x(530),O?.subject_name]})]})]}),a[x(611)](x(786),{onClick:()=>J(!1),className:x(810),children:a.jsx(X0,{className:x(537)})})]}),a[x(872)](x(850),{className:x(854),children:[a[x(872)](x(850),{className:x(875),children:[a[x(611)](Z0,{className:x(542)}),a[x(611)]("input",{type:x(733),placeholder:x(804),value:V,onChange:t=>n(t.target[x(649)]),className:"w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"})]}),a[x(872)]("div",{className:x(863),children:[a[x(872)](x(786),{onClick:P0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[a[x(611)](w0,{className:x(781)}),x(630),R[x(862)],")"]}),a[x(872)](x(786),{onClick:B0,className:x(871),children:["Males (",x0[x(862)],")"]}),a[x(872)]("button",{onClick:F0,className:x(871),children:[x(628),e0.length,")"]}),a[x(611)](x(786),{onClick:H0,className:x(775),children:x(547)})]})]}),a[x(872)](x(850),{className:x(761),children:[u0[x(862)]>0&&a[x(872)]("div",{className:x(540),children:[a.jsx(x(850),{className:x(707),children:a[x(872)](x(713),{className:x(831),children:[x(660),u0[x(862)],")"]})}),a[x(611)](x(850),{className:x(748),children:u0[x(583)](t=>{const r=x,s=L.has(t[r(719)]),i=f&&(v[r(612)](m=>m[r(845)]===t[r(719)]&&m[r(543)]===f&&m[r(736)]===o)||M[r(612)](m=>m[r(845)]===t[r(719)]&&m[r(543)]===f&&m[r(736)]===o));return a[r(872)](r(850),{onClick:()=>j0(t[r(719)]),className:r(715)+r(s?884:566),children:[a.jsxs(r(850),{className:r(500),children:[s?a.jsx(w0,{className:r(529)}):a[r(611)](R0,{className:r(535)}),a[r(872)](r(850),{className:r(705),children:[a[r(872)]("p",{className:r(666),children:[t[r(633)],", ",t[r(681)]," ",t.middle_name?t.middle_name[0]+".":""]}),a[r(872)]("p",{className:r(565),children:[r(505),t[r(719)]]})]})]}),i&&a[r(611)](r(713),{className:r(515),children:r(524)})]},t[r(719)])})})]}),g0[x(862)]>0&&a[x(872)]("div",{className:x(540),children:[a[x(611)](x(850),{className:x(707),children:a[x(872)](x(713),{className:"text-[10px] font-black text-slate-500 uppercase tracking-widest",children:[x(465),g0[x(862)],")"]})}),a[x(611)](x(850),{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:g0[x(583)](t=>{const r=x,s=L[r(723)](t[r(719)]),i=f&&(v[r(612)](m=>m[r(845)]===t[r(719)]&&m[r(543)]===f&&m[r(736)]===o)||M.some(m=>m[r(845)]===t[r(719)]&&m[r(543)]===f&&m[r(736)]===o));return a[r(872)](r(850),{onClick:()=>j0(t[r(719)]),className:r(715)+(s?"bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm":r(566)),children:[a[r(872)](r(850),{className:r(500),children:[s?a[r(611)](w0,{className:r(529)}):a[r(611)](R0,{className:r(535)}),a.jsxs(r(850),{className:r(705),children:[a[r(872)]("p",{className:r(666),children:[t[r(633)],", ",t[r(681)]," ",t[r(791)]?t[r(791)][0]+".":""]}),a[r(872)]("p",{className:r(565),children:[r(505),t[r(719)]]})]})]}),i&&a[r(611)](r(713),{className:r(515),children:r(524)})]},t[r(719)])})})]}),l0.length===0&&a[x(872)](x(850),{className:"p-8 text-center text-slate-400 text-xs font-medium",children:[x(472),V,'".']})]}),a[x(872)](x(850),{className:x(600),children:[a[x(872)](x(850),{className:x(760),children:[a.jsx("span",{className:"text-indigo-600 font-black",children:L[x(888)]}),x(572),R[x(862)],x(677)]}),a[x(872)](x(850),{className:x(482),children:[a[x(872)](x(786),{onClick:_0,disabled:L[x(888)]===0,className:x(599),children:[a[x(611)](E0,{className:x(801)}),x(474)]}),a.jsxs(x(786),{onClick:y0,disabled:L.size===0,className:"h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer",children:[a[x(611)](h0,{className:x(801)}),x(609)]})]})]})]})}),u&&a[x(611)](x(850),{className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200",children:a[x(872)](x(850),{className:x(698),children:[a[x(872)](x(850),{className:"relative w-16 h-16 mx-auto flex items-center justify-center",children:[a.jsx(x(850),{className:x(839)}),a[x(611)]("div",{className:x(890),children:a.jsx($0,{className:x(692)})})]}),a[x(872)](x(850),{className:x(540),children:[a.jsx("h3",{className:"text-lg font-black text-slate-900 tracking-tight uppercase",children:x(700)}),a.jsx("p",{className:x(663),children:A0})]}),a[x(872)](x(850),{className:x(557),children:[a[x(611)](x(850),{className:x(674),children:a[x(611)]("div",{className:x(519),style:{width:Math.max(5,j)+"%"}})}),a[x(872)](x(850),{className:x(874),children:[a[x(611)](x(713),{children:"Export Pipeline"}),a[x(872)](x(713),{children:[j,"%"]})]})]})]})}),a[x(611)](x(728),{children:x(624)+(_==="a4"?x(704):_===x(825)?x(851):x(882))+x(852)+x(_==="a4"?706:793)+x(711)+(_==="a4"?x(706):"8.5in")+x(709)+x(_==="a4"?706:793)+x(576)+(_==="a4"?"297mm":_===x(825)?x(631):x(561))+` !important;
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
             `})]})}function b0(){const x=["last_name","isArray","text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums","table","toString","JANUARY","relative flex items-center justify-center cursor-pointer shrink-0","Mar 24-31, 2027","Zoom In","lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none",`px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: `,"25745LewlxB","LAST NAME","Bulk Print for selected learners","warn","max","value","Oct 29, 2026","FIRST","Mar 15-16, 2027","flex justify-between items-center w-full overflow-hidden",`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,"log",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"gender",`px;
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
                        background-color: `,"delete","Male Learners (","month-col uppercase","month","text-xs font-semibold text-slate-500","none","z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full","text-xs font-bold text-slate-800 truncate","SEPTEMBER","localeCompare","Oct 7, 2026","Bulk print error:","subject_name",`; 
                        color: black !important; 
                        font-size: `,"Letter","h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200","replace","No sheets ready for PDF export."," learners selected","Daily Attendance","1ST","data-field uppercase font-bold border-2 whitespace-nowrap","first_name","w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0","w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform","THIRD","font-bold","teacher_id","includes"," TERM",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"label-green py-1 border-2",".lir-bulk-sheet","w-8 h-8 animate-spin","FEBRUARY","Failed to launch bulk print.","Dec 3-4, 2026",`;
                        padding: `,"w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform","bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6","3.32%","Processing LIR Records","3RD","portrait","border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden","210mm 297mm","truncate","210mm","flex items-center justify-between px-1","38614110FQfWkj",` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"End-of-Term Block",` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `,"absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30","span","color","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ","Print Single","w-10 h-10 text-white","w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors","lrn","col-span-1","relative group min-w-0 flex-1",`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `,"has","text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase","important-dates-box","JUNE","flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5","style","shrink-0 ml-auto","female","absolute inset-0 flex flex-col items-center justify-center","px ","text","h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0","target","school_year","5mNRqdw","Jan 4, 2027","MARCH","Bulk PDF","card-container-combined print:m-0 print:shadow-none","row-label py-1 px-1 border-2","FIRST NAME","w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400","School Logo","text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none","Zoom Out","grid grid-cols-1 sm:grid-cols-2 gap-2","-9999px","scores","40px","push","Learner Record","2ND","deped_logo_right.png","photo_url","slice","lir-title-bar-custom mb-3 uppercase tracking-widest","Learner's Individual Record Card","text-xs font-bold text-slate-600","flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4","red","tfoot","flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0","title","grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","sort","transform","header-green py-1","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500","Select Learner","Export failed: ","ELEMENTARY","data-field uppercase font-bold border-2 whitespace-nowrap px-1","h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1","w-full h-full opacity-0 absolute inset-0 cursor-pointer","Paper Size","object-contain",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,"font-bold uppercase leading-none text-center","w-3 h-3 text-indigo-600","student-info-table border-2","relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl","toUpperCase","Feb 16, 2027","button","13%","w-3 h-3 group-hover:-translate-y-0.5 transition-transform","querySelectorAll","fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block","middle_name",`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,"8.5in","20%","40%","col-span-1 flex flex-col items-center justify-center pt-1","absent","round","Select Subject","date-row","w-3.5 h-3.5","JUNIOR HIGH SCHOOL","month-col","Filter learners by name or LRN...","info",`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `,"transition-all duration-700 ease-out origin-top print:scale-100","2872zdAdaT","date-val uppercase","w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors","space-y-4","DepEd Logo","Choose Fill Color","15%","label-green border-2 whitespace-nowrap","Section","img","WRITTEN /ORAL WORKS (WWs)","header-subject-table border-collapse border-2","Apr 6-7, 2027","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200","0px","Total Abs.","LIR_","letter","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200","useCallback","relative group","Term 3 Exam (Graduating)","tbody","text-[10px] font-black text-slate-500 uppercase tracking-widest","7892469wvuUHm","JULY",`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"bind","absences-header uppercase","inherit","LIR","absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200","MALE","select","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden",`px; 
                        padding: `,"student_lrn","w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200","add","Term 1: Summative Test #2","w-3 h-3","div","8.5in 11in",`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `,"NOVEMBER","p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0","Mar 22-23, 2027",`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `,"logo_url","Choose Outline Color","term-label",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"length","flex items-center gap-1.5 flex-wrap",`rem;
                        width: `,`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,"Term 1 Examination","colgroup","Sept 16, 2026",`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `,"print","h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1","jsxs",`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `,"flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider","relative flex-1 min-w-48","text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60","Apr 8, 2027","final_grade",") translateZ(0)","SECOND","adviser_name","8.5in 13in","find","bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm","OCTOBER","SENIOR HIGH SCHOOL","important-dates-header uppercase italic","size","w-full h-full object-cover","relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30","Sept 2-15, 2026","Term 1: Summative Test #1","dates-header-bar uppercase","section_id",`px; 
                        border-right: 1px solid `,"text-[10px] text-slate-400 font-semibold uppercase tracking-widest","2666913QAwPLw","Start of Term 2","Female Learners (",`px; 
                        font-size: `,"attendance-table mb-3","PRODUCT/PERFORMANCE TASK (PPTs)","Bulk PDF download error:","male","trim",'No learners found matching "',"16660NlRFHb","Download PDF",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid `,"fixed","flex flex-col shrink-0","quarterly_exam","Individual LIR",`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,"student_section","flex items-center gap-2","console","-11px",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,"Term 2: Summative Test #1","APRIL","Print single active learner","text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5","1 X 1","Choose Section","uid","reduce","absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full","BAGONG BARRIO NATIONAL HIGH SCHOOL","TERM EXAM","font-black uppercase italic","label-green py-1 border-2 px-1","entries","flex items-center gap-2.5 min-w-0","% complete...","toLowerCase","row-label","lir-bulk-render-container","LRN: ","school-logo.png",`px;
                        font-size: `,"flex items-center gap-1.5 lg:gap-2 shrink-0","Start of Term 3","School Year: ","return (function() ","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10","font-bold leading-tight","px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0",`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"Filter / Select Learners",`rem; 
                        padding: `,"h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300","TOTAL","name","header-row-fill","scale(","✓ Grades",`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4","FEMALE","font-extrabold uppercase whitespace-nowrap","w-4 h-4 text-indigo-600 shrink-0"," | ","performance_tasks","relative group shrink-0","forEach","date-label uppercase","w-4 h-4 text-slate-300 shrink-0","1721812nGGOQS","w-4 h-4","useState","error","space-y-2","#86efac","w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400","subject_id","10%","Opening print stream for ","bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]","Clear","Processing LIR PDF pages: ",`rem; 
                        font-weight: 700; 
                        height: `,"src","mb-2","useMemo","TERM",`px;
                        text-align: center;
                        height: `,`rem; 
                        border-bottom: 2px solid `,"section_name","space-y-1.5",`;
                        border-radius: 8px;
                        height: `,"Bulk_LIR_","Folio","13in","written_works","signature-box bg-white","option","text-[9px] font-medium text-slate-400","bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50",`; 
                        font-size: `,"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate","Term 2: Summative Test #2","finalGrade","min"," of ","Dec 7-18, 2026","Term 3: Summative Test #1","kinder",` !important;
                        height: `,`;
                        border: 1px solid `,"optgroup","displayName","__proto__","summative_tests","AUGUST","map","End of Term 3","school-forms","section_grade_level","M.I","Dec 18, 2026","Important Dates",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"thead","grow flex flex-col gap-1 overflow-hidden","prototype","flex items-center gap-4 shrink-0","hidden","cancelled","2773038JoMSUD","text-sm font-black uppercase tracking-wide text-white","h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0","quarter",`px; 
                        font-weight: 700; 
                        font-size: `,"Preparing LIR sheets for bulk printing...","col","Term 2 Examination","Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections.","input","half-page-section border-t-4","Bulk Print","w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0","jsx","some","Individual Record","Bulk Download PDF for selected learners","w-5 h-5","folio","58rstnjq","rem","from","filter","px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0","charAt","June 8-11, 2026",`
                @media print {
                    @page {
                        size: `," - ","exception",`rem;
                    }

                    .row-label {
                        background-color: `,"Females (",`;
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"All (","11in","font-bold py-1"];return b0=function(){return x},b0()}export{mx as LIRPage};
