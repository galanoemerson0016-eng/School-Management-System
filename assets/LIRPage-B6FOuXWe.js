import{N as a,L as p,cA as q0,bN as o0,cN as K0,ck as W0,bj as T0,bV as E0,cm as h0,cM as X0,bx as Z0,cJ as Q0,cP as w0,cQ as R0,bK as $0}from"./vendor-BM-1UYFO.js";import{b as xx,u as ex,X as ax,D as N0,ah as tx}from"./index-Ci1MB4oq.js";import{e as rx,p as cx}from"./pdf-export-IgIBiYHn.js";import"./vendor-pdf-libs-CgzHn2lQ.js";import"./vendor-firebase-D54sZql7.js";import"./vendor-framer-motion-CpxCSa2T.js";function U(x,k){return x=x-445,m0()[x]}const b0=U;(function(x,k){const g=U,v=x();for(;;)try{if(-parseInt(g(785))/1*(-parseInt(g(736))/2)+-parseInt(g(749))/3+parseInt(g(878))/4+-parseInt(g(655))/5+-parseInt(g(848))/6*(parseInt(g(595))/7)+parseInt(g(493))/8*(-parseInt(g(743))/9)+-parseInt(g(729))/10*(-parseInt(g(691))/11)===k)break;v.push(v.shift())}catch{v.push(v.shift())}})(m0,470729);const s0=(function(){let x=!0;return function(k,g){const v=x?function(){const A=U;if(g){const T=g[A(840)](k,arguments);return g=null,T}}:function(){};return x=!1,v}})(),V0=s0(void 0,function(){const x=U,k=function(){const T=U;let d;try{d=Function(T(552)+'{}.constructor("return this")( ));')()}catch{d=window}return d},g=k(),v=g[x(469)]=g[x(469)]||{},A=[x(610),"warn",x(588),"error",x(570),x(450),x(721)];for(let T=0;T<A[x(579)];T++){const d=s0.constructor[x(764)][x(577)](s0),i=A[T],y=v[i]||d;d[x(741)]=s0[x(577)](s0),d[x(543)]=y[x(543)][x(577)](y),v[i]=d}});V0();const I0=({pageNumber:x,student:k,profile:g,schoolYear:v,subject:A,teacher:T,fillColor:d="#86efac",outlineColor:i=b0(724),gradeData:y,paperSize:M=b0(887),attendanceData:K={}})=>{const e=b0,W="./",N=25,n0=s=>Array[U(671)]({length:N},(b,j)=>s[j]??""),E=(s,u)=>{const b=U,j=Number(u);if(!j)return!1;const C=s.toUpperCase();return C==="JUNE"&&j===12||C===b(831)&&(j===21||j===31)||C===b(792)&&(j===2||j===30)||C===b(821)&&j===8||C===b(447)&&j===1};let P=e(727),f=e(540),c=1.12,J=1.2,Y=.8,B=.75,R=5,z=.8,X=40,_=240,Z=100,Q=50,G=e(497);M==="a4"?(f=e(448),P=e(602),c=1.02,J=.85,Y=.55,B=.5,R=2,z=.65,X=26,_=140,Z=80,Q=40):M===e(633)?(f=e(540),P=e(645),c=.98,J=.85,Y=.55,B=.5,R=3,z=.7,X=28,_=160,Z=65,Q=32,G=e(772)):M===e(887)&&(f=e(540),P=e(727),c=.98,J=.85,Y=.55,B=.5,R=3,z=.7,X=28,_=160,Z=65,Q=32,G="-11px");const L=(s,u)=>{const b=e,j=(s||"")[b(561)]();return j[b(579)]>32?u*.65:j[b(579)]>24?u*.78:j.length>16?u*.88:u},F=L(A,z*c),V=L(T,z*c);return a[e(492)](e(461),{className:e(684),children:a[e(697)](e(461),{className:e(768),style:{width:f,height:P},children:[a.jsx("style",{children:e(784)+f+" "+P+e(546)+i+e(673)+8*c+e(583)+5*c+`px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: `+d+e(806)+i+e(445)+3*c+e(606)+.85*c+e(693)+d+e(621)+i+e(678)+.6*c+e(810)+i+e(673)+2*c+e(807)+.8*c+e(538)+.6*c+e(804)+i+`;
                        padding: `+1.5*c+e(680)+24*c+e(844)+d+e(728)+.6*c+e(661)+d+e(730)+.6*c+e(639)+70*c+`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `+d+e(777)+i+`;
                        border-radius: 8px;
                        height: `+X*c+e(640)+_*c+e(516)+d+e(518)+.9*c+e(755)+4*c+`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `+i+e(761)+i+e(668)+i+e(654)+.5*c+e(535)+21*c+e(787)+1*c+e(501)+d+`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `+.5*c+e(786)+i+e(884)+d+e(829)+.9*c+e(555)+d+e(846)+.45*c+e(524)+.5*c+`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `+i+e(812)+d+e(705)+3*c+e(611)+.85*c+e(891)+i+e(482)+i+e(837)+.45*c+e(870)+18*c+`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `+95*c+`px; 
                        border-right: 1px solid `+i+e(814)+1.5*c+"px "+4*c+`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `+1.5*c+e(502)+4*c+e(751)+.42*c+e(504)}),a[e(697)](e(461),{className:"card-container-combined print:m-0 print:shadow-none",children:[a[e(697)](e(461),{className:"half-page-section",children:[a[e(697)](e(461),{className:e(566),children:[a[e(697)](e(461),{className:"flex items-center gap-4 shrink-0",children:[a[e(492)](e(461),{className:e(625),style:{width:64*c,height:64*c},children:a.jsx(e(750),{src:g[e(781)]||W+e(847),alt:e(510),className:"max-w-full max-h-full object-contain",onError:s=>{const u=e;s[u(799)][u(706)]=W+u(847)}})}),a[e(697)]("div",{children:[a[e(492)]("h1",{className:e(536),style:{fontSize:J*c+e(880)},children:g[e(575)]||e(551)}),a.jsx("p",{className:"font-black uppercase italic",style:{fontSize:Y*c+e(880),color:i},children:e(845)}),a[e(697)]("p",{className:e(701),style:{fontSize:B*c+e(880)},children:[e(676),a[e(492)]("span",{className:e(687),children:v})]})]})]}),a.jsx(e(461),{className:"shrink-0 ml-auto",children:a[e(492)](e(450),{className:e(449),style:{borderColor:i},children:a[e(492)](e(514),{children:a[e(697)]("tr",{children:[a[e(492)]("td",{className:e(773),style:{fontSize:z*c+"rem",padding:R*c+e(502)+R*2*c+"px",borderColor:i},children:e(526)}),a[e(492)]("td",{className:e(709),style:{fontSize:F+"rem",padding:R*c+e(502)+R*2.5*c+"px",borderColor:i},children:A}),a.jsx("td",{className:e(773),style:{fontSize:z*c+"rem",padding:R*c+e(502)+R*2*c+"px",borderColor:i},children:"TEACHER"}),a[e(492)]("td",{className:e(709),style:{fontSize:V+e(880),padding:R*c+e(502)+R*2.5*c+"px",borderColor:i},children:T})]})})})})]}),a[e(697)](e(461),{className:e(620),children:[a[e(492)]("div",{className:e(868),style:{width:1*c+"in",height:1*c+"in",borderColor:i},children:k[e(665)]?a[e(492)](e(750),{src:k.photo_url,alt:e(478),className:e(548)}):a[e(697)]("span",{className:e(658),style:{fontSize:.7*c+e(880)},children:[e(692),a.jsx("br",{}),e(646)]})}),a.jsx(e(461),{className:e(635),children:a[e(492)](e(450),{className:e(632),style:{borderColor:i,height:1*c+"in"},children:a[e(697)](e(514),{children:[a.jsxs("tr",{style:{height:.5*c+"in"},children:[a[e(492)]("td",{className:e(707),style:{borderColor:i,height:.5*c+"in"},children:k[e(666)]}),a[e(492)]("td",{className:e(707),style:{borderColor:i,height:.5*c+"in"},children:k[e(559)]}),a[e(492)]("td",{className:e(823),style:{width:e(488),borderColor:i,height:.5*c+"in"},children:k[e(528)]?.[e(474)](0)||""}),a[e(492)]("td",{className:e(707),style:{borderColor:i,height:.5*c+"in"},children:k.student_section}),a[e(492)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:i,height:.5*c+"in"},children:k[e(841)]})]}),a[e(697)]("tr",{style:{height:.5*c+"in"},children:[a[e(492)]("td",{className:"label-green py-1 border-2",style:{borderColor:i,height:.5*c+"in"},children:e(580)}),a[e(492)]("td",{className:e(527),style:{borderColor:i,height:.5*c+"in"},children:e(856)}),a[e(492)]("td",{className:"label-green py-1 border-2 px-1",style:{width:e(488),borderColor:i,height:.5*c+"in"},children:e(872)}),a[e(492)]("td",{className:"label-green py-1 border-2",style:{borderColor:i,height:.5*c+"in"},children:"GRADE & SECTION"}),a[e(492)]("td",{className:e(527),style:{borderColor:i,height:.5*c+"in"},children:e(864)})]})]})})})]}),a[e(697)](e(461),{className:e(683),children:[a[e(697)](e(461),{children:[a[e(492)](e(461),{className:e(828),style:{fontSize:.75*c+e(880)},children:e(485)}),a[e(492)]("table",{style:{tableLayout:e(468)},children:a.jsxs("tbody",{children:[a[e(697)]("tr",{className:"header-row-fill",children:[a[e(492)]("td",{className:e(778),style:{width:e(532)},children:e(725)}),[1,2,3,4,5][e(858)](s=>a[e(492)]("td",{style:{width:e(607)},children:s},s)),a.jsx("td",{className:e(701),style:{width:e(522)},children:e(703)})]}),[1,2,3][e(858)](s=>a[e(697)]("tr",{children:[a[e(492)]("td",{className:e(775),children:s===1?"FIRST":s===2?"SECOND":e(660)}),[...Array(5)].map((u,b)=>a[e(492)]("td",{children:y?.[s]?.scores.ww[b]??""},b)),a[e(492)]("td",{className:"font-bold",children:y?.[s]?.[e(564)].ww[e(637)](0,5)[e(770)]((u,b)=>u+(Number(b)||0),0)||""})]},s))]})})]}),a[e(697)](e(461),{children:[a.jsx(e(461),{className:e(828),style:{fontSize:.75*c+e(880)},children:e(494)}),a[e(492)](e(450),{style:{tableLayout:e(468)},children:a[e(697)]("tbody",{children:[a.jsxs("tr",{className:e(458),children:[a[e(492)]("td",{className:e(778),style:{width:e(522)},children:"TERM"}),[1,2,3][e(858)](s=>a.jsx("td",{style:{width:e(522)},children:s},s)),a[e(492)]("td",{className:e(701),style:{width:e(522)},children:e(703)})]}),[1,2,3][e(858)](s=>a[e(697)]("tr",{children:[a[e(492)]("td",{className:e(775),children:s===1?e(710):s===2?"SECOND":e(660)}),[...Array(3)][e(858)]((u,b)=>a[e(492)]("td",{children:y?.[s]?.[e(564)].pt[b]??""},b)),a[e(492)]("td",{className:e(701),children:y?.[s]?.scores.pt.slice(0,3).reduce((u,b)=>u+(Number(b)||0),0)||""})]},s))]})})]})]}),a[e(697)](e(461),{className:e(859),children:[a[e(697)](e(461),{className:e(507),children:[a[e(492)](e(461),{className:e(828),style:{fontSize:.7*c+e(880)},children:e(616)}),a[e(492)](e(450),{style:{tableLayout:"fixed"},children:a[e(697)]("tbody",{children:[a[e(697)]("tr",{className:"header-row-fill",children:[a[e(492)]("td",{className:e(778),style:{width:e(713)},children:"TERM"}),[1,2][e(858)](s=>a[e(492)]("td",{children:s},s))]}),[1,2,3][e(858)](s=>a.jsxs("tr",{children:[a[e(492)]("td",{className:"row-label",children:e(s===1?710:s===2?875:660)}),[...Array(2)][e(858)]((u,b)=>a[e(492)]("td",{children:y?.[s]?.[e(564)].st[b]??""},b))]},s))]})})]}),a.jsx(e(461),{className:e(507),children:a[e(697)](e(450),{style:{tableLayout:e(468)},children:[a[e(492)](e(832),{children:a.jsx("tr",{className:e(458),children:a[e(492)]("td",{colSpan:2,className:e(486),style:{fontSize:.7*c+e(880)},children:e(835)})})}),a[e(492)](e(514),{children:[1,2,3][e(858)](s=>a[e(697)]("tr",{children:[a.jsxs("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:i},children:[s===1?"1ST":e(s===2?682:798),e(597)]}),a[e(492)]("td",{className:e(701),children:y?.[s]?.[e(564)].te||""})]},s))})]})}),a[e(492)]("div",{className:"col-span-1",children:a[e(697)]("table",{style:{tableLayout:"fixed"},children:[a.jsx(e(832),{children:a[e(492)]("tr",{className:e(458),children:a[e(492)]("td",{colSpan:2,className:"font-bold py-1",style:{fontSize:.7*c+e(880)},children:"FINAL GRADE"})})}),a[e(492)](e(514),{children:[1,2,3].map(s=>a[e(697)]("tr",{children:[a[e(697)]("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:i},children:[e(s===1?716:s===2?682:798),e(597)]}),a.jsx("td",{className:e(701),children:y?.[s]?.finalGrade||""})]},s))}),a[e(492)]("tfoot",{children:a[e(492)]("tr",{style:{height:1.5*c+"px"},children:a[e(492)]("td",{colSpan:2,style:{border:e(853)}})})})]})}),a[e(697)](e(461),{className:e(487),style:{marginTop:G},children:[a[e(492)](e(461),{className:"mb-2",children:a.jsx(e(750),{src:W+e(717),alt:e(479),className:e(754),style:{width:Z*c,height:Q*c}})}),a[e(492)](e(461),{className:e(466)}),a[e(492)]("p",{className:e(674),style:{fontSize:.6*c+e(880),marginTop:14*c+"px"},children:e(549)})]})]})]}),a[e(697)]("div",{className:e(791),style:{borderColor:i},children:[a[e(492)](e(461),{className:e(842),children:e(679)}),a.jsxs(e(450),{className:e(512),children:[a[e(697)]("colgroup",{children:[a[e(492)](e(499),{style:{width:e(839)}}),Array[e(671)]({length:N})[e(858)]((s,u)=>a[e(492)](e(499),{style:{width:e(802)}},u)),a.jsx("col",{style:{width:"7%"}})]}),a.jsx(e(832),{children:a[e(697)]("tr",{children:[a[e(492)]("th",{className:e(865),children:e(594)}),a.jsx("th",{colSpan:N,className:e(582),children:e(589)}),a[e(492)]("th",{className:"absences-header uppercase",children:e(573)})]})}),a.jsx(e(514),{children:[{name:e(615),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:e(824),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:"AUGUST",dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:e(774),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:"OCTOBER",dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:e(792),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:e(821),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:e(447),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:e(475),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:e(756),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:e(861),dates:[1,2,5,6,7,8]}][e(858)](s=>a[e(697)]("tr",{children:[a[e(492)]("td",{className:e(472),children:s[e(575)]}),n0(s.dates).map((u,b)=>a.jsx("td",{className:e(533),style:{color:E(s[e(575)],u)?"red":e(464)},children:u},b)),a[e(492)]("td",{className:e(701),children:K[s.name]||""})]},s.name))})]}),a[e(697)]("div",{className:e(476),style:{borderColor:i},children:[a[e(697)]("div",{className:e(467),children:[a[e(492)](e(461),{className:e(603),children:e(886)}),[[e(852),e(843)],[e(719),e(455)],[e(571),e(465)],[e(879),e(647)],[e(780),"Term 1 Examination"],[e(609),e(642)],[e(669),"Start of Term 2"]].map(([s,u])=>a[e(697)](e(461),{className:e(742),children:[a[e(492)](e(461),{className:e(704),children:s}),a.jsx(e(461),{className:e(520),children:u})]},s))]}),a[e(697)]("div",{className:e(467),children:[a[e(492)](e(461),{className:"important-dates-header uppercase italic",children:e(886)}),[["Oct 7, 2026",e(695)],[e(623),e(542)],[e(614),e(576)],[e(462),e(642)],[e(503),e(631)],["Jan 4, 2027","Start of Term 3"],[e(867),e(652)]].map(([s,u])=>a[e(697)](e(461),{className:e(742),children:[a.jsx(e(461),{className:e(704),children:s}),a[e(492)](e(461),{className:e(520),children:u})]},s))]}),a[e(697)](e(461),{className:e(467),children:[a[e(492)](e(461),{className:e(603),children:e(886)}),[[e(586),"Term 3: Summative Test #2"],[e(758),e(871)],[e(515),e(813)],[e(714),e(642)],[e(876),"End-of-Term Block"],[e(698),e(722)],["Apr 8, 2027","End of Term 3"]][e(858)](([s,u])=>a[e(697)](e(461),{className:"date-row",children:[a.jsx(e(461),{className:e(704),children:s}),a.jsx(e(461),{className:e(520),children:u})]},s))]})]})]})]})]})})};function bx(){const x=b0,{students:k,sections:g,subjects:v,teachers:A,schoolProfile:T,activeSchoolYear:d,setCurrentView:i,classRecords:y,gradingSheetRecords:M,hpsRecords:K,sf2Sheets:e}=xx(),{user:W}=ex(),[N,n0]=p[x(500)](""),[E,P]=p[x(500)](null),[f,c]=p[x(500)](""),[J,Y]=p.useState(1),[B,R]=p[x(500)](x(723)),[z,X]=p[x(500)]("#22c55e"),[_,Z]=p[x(500)](x(887)),[Q,G]=p[x(500)](!1),[L,F]=p[x(500)](new Set),[V,s]=p[x(500)](""),[u,b]=p[x(500)](!1),[j,C]=p[x(500)](0),[A0,$]=p[x(500)](""),S=p.useMemo(()=>{const t=x;return g[t(593)](r=>r[t(641)]===N||r.id===N)},[g,N]),O=p[x(759)](()=>{const t=x;return v[t(593)](r=>r.id===f||r[t(463)]===f)},[v,f]),z0=p[x(759)](()=>{const t=x;if(!S)return[];const r=ax(W,S,v),l=new Set;return r[t(808)](n=>{const h=t,w=N0(n[h(463)]);return l[h(702)](w)?!1:(l.add(w),!0)})},[S,v,W]),k0=p[x(759)](()=>{const t=x;if(O?.teacher_id){const r=A[t(593)](l=>l.uid===O[t(731)]||l.id===O[t(731)]);if(r)return r[t(498)]||r[t(575)]}return S?.adviser_name||""},[O,A,S]),t0=p[x(759)](()=>{const t=x;return[...g][t(496)]((r,l)=>{const n=t,h=(r[n(737)]||"")[n(689)](l.section_grade_level||"",void 0,{numeric:!0});return h!==0?h:(r[n(641)]||"").localeCompare(l[n(641)]||"")})},[g]),L0=p[x(759)](()=>{const t=x,r={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return t0[t(873)](l=>{const n=t,h=(l[n(737)]||"")[n(628)](),w=parseInt(h[n(624)](/\D/g,""))||0;h[n(862)](n(885))||w>=1&&w<=6?r[n(809)][n(659)](l):w>=7&&w<=10?r[n(601)][n(659)](l):w>=11&&w<=12&&r[n(617)][n(659)](l)}),r},[t0]);p[x(648)](()=>{const t=x;if(!N&&t0[t(579)]===1){const r=setTimeout(()=>{const l=t;n0(t0[0][l(641)])},0);return()=>clearTimeout(r)}},[t0,N]),p[x(648)](()=>{const t=setTimeout(()=>{c(""),P(null),F(new Set)},0);return()=>clearTimeout(t)},[N]);const I=p[x(759)](()=>{const t=x;if(!N)return[];const r=g.find(l=>l[t(641)]===N||l.id===N)?.id;return k.filter(l=>l.student_section===N||r&&l[t(644)]===r)},[k,N,g]),x0=p[x(759)](()=>I.filter(t=>(t[x(699)]||"")[x(628)]()===x(732)).sort((t,r)=>(t.last_name+", "+t.first_name)[x(689)](r[x(666)]+", "+r.first_name)),[I]),e0=p[x(759)](()=>I.filter(t=>(t[x(699)]||"").toLowerCase()!==x(732)).sort((t,r)=>(t[x(666)]+", "+t[x(559)])[x(689)](r[x(666)]+", "+r.first_name)),[I]),C0=()=>{const t=x;L[t(735)]===0&&I[t(579)]>0&&F(new Set(I[t(858)](r=>r[t(841)]))),G(!0)},p0=p[x(664)](t=>{const r=x;if(!t)return{};const l={};return e[r(808)](h=>h.school_year===d&&(h.section_id===S?.id||h[r(643)]===N))[r(873)](h=>{const w=r,o=h[w(563)]?.[t[w(841)]];if(o){const D=Object.values(o).filter(q=>q?.[w(628)]()===w(890)).length;D>0&&(l[h.month[w(889)]()]=D)}}),l},[e,d,S,N]),f0=p[x(664)]((t,r,l)=>{const n=x;if(!t||!r)return;const h={};return[1,2,3][n(873)](w=>{const o=n,D=(m,d0)=>{const l0=U;return!!(m===l?.id||m===r||d0&&l?.[l0(463)]&&N0(d0)===N0(l[l0(463)]))},q=y[o(593)](m=>m[o(618)]===t[o(841)]&&m.school_year===d&&Number(m[o(550)])===w&&D(m[o(817)],m.subject_name))||M[o(593)](m=>m[o(618)]===t[o(841)]&&m[o(675)]===d&&Number(m[o(550)])===w&&D(m.subject_id,m[o(463)])),i0=K.find(m=>D(m[o(817)],m.subject_name)&&m[o(675)]===d&&Number(m[o(550)])===w&&(m[o(643)]===t[o(644)]||S?.id&&m[o(643)]===S.id))||K[o(593)](m=>D(m[o(817)],m.subject_name)&&m.school_year===d&&Number(m.quarter)===w),a0=(m,d0)=>{const l0=o,J0=Array[l0(541)](m)?m:[];return Array[l0(671)]({length:d0},(lx,Y0)=>J0[Y0]??"")},U0=q,G0=i0,H=m=>m===""||m===null||m===void 0?"":m,S0=tx(t[o(841)],l?.id||f,w,d,y,M,K,S?.[o(737)],S?.[o(677)]);h[w]={scores:{ww:a0(q?.[o(769)],10)[o(858)](H),pt:a0(q?.performance_tasks,10)[o(858)](H),st:a0(U0?.[o(662)],5).map(H),te:H(q?.[o(752)]??"")},hps:{ww:a0(i0?.[o(769)],10).map(H),pt:a0(i0?.[o(544)],10)[o(858)](H),st:a0(G0?.[o(662)],5).map(H),te:H(i0?.quarterly_exam??"")},finalGrade:S0>0?S0:H(q?.[o(569)]??"")}}),h},[y,M,K,d,S,f]),O0=p[x(759)](()=>p0(E),[E,p0]),D0=p[x(759)](()=>f0(E,f,O),[E,f,O,f0]),y0=p[x(759)](()=>[...x0,...e0],[x0,e0]),r0=p.useMemo(()=>y0[x(808)](r=>L.has(r.lrn)),[y0,L]),c0=p[x(759)](()=>{const t=x;if(!V[t(561)]())return I;const r=V[t(628)]();return I[t(808)](l=>l[t(666)][t(628)]()[t(862)](r)||l[t(559)][t(628)]()[t(862)](r)||l[t(841)][t(862)](r))},[I,V]),u0=p[x(759)](()=>c0.filter(t=>(t.gender||"")[x(628)]()===x(732)),[c0]),g0=p.useMemo(()=>c0[x(808)](t=>(t[x(699)]||"").toLowerCase()===x(471)),[c0]),M0=()=>{const t=x;if(!E)return;const r=document[t(866)],l=(E[t(666)]+"_"+E.first_name)[t(624)](/[^a-z0-9]/gi,"_");document[t(866)]=t(834)+l+"_"+d,window[t(650)](),setTimeout(()=>{const n=t;document[n(866)]=r},1e3)},v0=async()=>{const t=x;if(r0[t(579)]!==0){b(!0),C(10),$(t(657));try{await new Promise(n=>setTimeout(n,400));const r=document[t(822)]("lir-bulk-render-container"),l=r?Array[t(671)](r[t(771)](t(587))):[];if(l[t(579)]===0){alert(t(572)),b(!1);return}C(50),$("Opening print stream for "+l[t(579)]+t(855)),await cx({elements:l,paperSize:_,orientation:t(800),title:t(820)+(S?.[t(641)]||"Section")+"_"+(O?.[t(463)]||t(794))}),C(100),$(t(517)),setTimeout(()=>{b(!1),G(!1)},600)}catch(r){console[t(748)]("Bulk print error:",r),alert(t(585)),b(!1)}}},_0=async()=>{const t=x;if(r0[t(579)]!==0){b(!0),C(5),$("Initializing vector PDF export pipeline...");try{await new Promise(D=>setTimeout(D,400));const r=document[t(822)](t(789)),l=r?Array[t(671)](r[t(771)](t(587))):[];if(l[t(579)]===0){alert(t(489)),b(!1);return}const n=(S?.[t(641)]||N||t(765)).replace(/[^a-z0-9]/gi,"_"),h=(O?.[t(463)]||t(794)).replace(/[^a-z0-9]/gi,"_"),w=t(834)+n+"_"+h+"_"+d,o=await rx({elements:l,filename:w,paperSize:_,orientation:t(800),title:w,onProgressChange:D=>{C(D),$("Processing LIR PDF pages: "+D+"% complete...")}});o.success?(C(100),$(t(568)),setTimeout(()=>{b(!1),G(!1)},800)):(o.cancelled||alert(t(783)+(o.error||t(629))),b(!1))}catch(r){console.error("Bulk PDF download error:",r),alert("Failed to generate PDF download."),b(!1)}}},j0=t=>{F(r=>{const l=U,n=new Set(r);return n.has(t)?n[l(484)](t):n[l(491)](t),n})},P0=()=>{const t=x;F(new Set(I[t(858)](r=>r[t(841)])))},B0=()=>{const t=x;F(new Set(x0[t(858)](r=>r[t(841)])))},F0=()=>{const t=x;F(new Set(e0.map(r=>r[t(841)])))},H0=()=>{F(new Set)};return a[x(697)]("div",{className:"lir-print-root flex flex-col h-full bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white",children:[a[x(697)](x(461),{className:x(740),children:[a[x(492)](x(461),{className:x(700)}),a[x(697)](x(461),{className:"flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden",children:[a[x(697)](x(461),{className:x(612),children:[a[x(492)]("button",{onClick:()=>i(x(857)),className:"w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200",title:"Back to Hub",children:a[x(492)](q0,{className:"w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"})}),a.jsxs(x(461),{className:x(882),children:[a.jsx("h2",{className:x(795),children:x(495)}),a[x(492)]("p",{className:x(578),children:"Individual LIR"})]})]}),a[x(492)](x(461),{className:"h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0"}),a.jsxs(x(461),{className:x(690),children:[a[x(697)](x(456),{className:x(881),value:N,onChange:t=>{n0(t.target.value),P(null),c("")},children:[a[x(492)](x(525),{value:"",children:"Choose Section"}),Object[x(726)](L0).map(([t,r])=>r[x(579)]>0&&a[x(492)](x(513),{label:t,children:r[x(858)](l=>a[x(697)](x(525),{value:l[x(641)],children:[l[x(737)]," - ",l.section_name]},l.id))},t))]}),a[x(492)](o0,{className:x(776)})]}),a[x(697)](x(461),{className:x(690),children:[a[x(697)](x(456),{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate",value:f,onChange:t=>{const r=x;c(t[r(799)][r(452)]),P(null)},disabled:!N,children:[a.jsx(x(525),{value:"",children:x(530)}),z0.map(t=>a[x(492)](x(525),{value:t.id,children:t[x(463)]},t.id))]}),a[x(492)](o0,{className:x(776)})]}),a[x(697)](x(461),{className:"relative group min-w-0 flex-1",children:[a.jsxs(x(456),{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200",value:E?.lrn||"",onChange:t=>{const r=x,l=k[r(593)](n=>n.lrn===t[r(799)][r(452)])||null;P(l)},disabled:!f,children:[a[x(492)]("option",{value:"",children:x(803)}),x0[x(579)]>0&&a[x(492)](x(513),{label:x(738),children:x0[x(858)](t=>{const r=x,l=f&&(y.some(n=>n[r(618)]===t[r(841)]&&n[r(817)]===f&&n[r(675)]===d)||M.some(n=>n.student_lrn===t[r(841)]&&n[r(817)]===f&&n.school_year===d));return a.jsxs(r(525),{value:t[r(841)],children:[t.last_name,", ",t[r(559)]," ",l?"✓":""]},t[r(841)])})}),e0[x(579)]>0&&a[x(492)](x(513),{label:x(592),children:e0.map(t=>{const r=x,l=f&&(y[r(590)](n=>n[r(618)]===t[r(841)]&&n.subject_id===f&&n[r(675)]===d)||M[r(590)](n=>n[r(618)]===t.lrn&&n[r(817)]===f&&n[r(675)]===d));return a[r(697)](r(525),{value:t[r(841)],children:[t[r(666)],", ",t[r(559)]," ",l?"✓":""]},t[r(841)])})})]}),a[x(492)](o0,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),a[x(492)](x(461),{className:"h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0"}),a[x(697)](x(461),{className:x(599),children:[a[x(697)](x(456),{value:_,onChange:t=>Z(t[x(799)][x(452)]),className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200",title:"Paper Size",children:[a[x(492)](x(525),{value:"a4",children:"A4"}),a[x(492)](x(525),{value:x(633),children:x(793)}),a[x(492)](x(525),{value:x(887),children:"Folio"})]}),a[x(492)](o0,{className:x(776)})]}),a[x(697)](x(461),{className:x(757),children:[a[x(697)](x(461),{className:"relative flex items-center justify-center cursor-pointer shrink-0",title:"Choose Fill Color",children:[a.jsx(x(461),{className:"w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0",style:{backgroundColor:B,width:18,height:18}}),a[x(492)](x(604),{type:x(506),value:B,onChange:t=>R(t[x(799)][x(452)]),className:"w-full h-full opacity-0 absolute inset-0 cursor-pointer"})]}),a[x(697)](x(461),{className:x(694),title:x(811),children:[a[x(492)]("div",{className:x(537),style:{backgroundColor:z,width:18,height:18}}),a.jsx(x(604),{type:x(506),value:z,onChange:t=>X(t[x(799)].value),className:x(523)})]})]}),a[x(697)]("div",{className:x(531),children:[a.jsx(x(567),{onClick:()=>Y(t=>Math[x(746)](.4,t-.1)),className:x(636),title:"Zoom Out",children:a.jsx(K0,{className:x(688)})}),a.jsxs("span",{className:x(715),children:[Math[x(782)](J*100),"%"]}),a[x(492)](x(567),{onClick:()=>Y(t=>Math[x(762)](1.5,t+.1)),className:"w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200",title:x(745),children:a[x(492)](W0,{className:x(688)})})]}),a[x(697)](x(567),{onClick:C0,disabled:!N||!f||I[x(579)]===0,className:x(747),title:x(860),children:[a.jsx(T0,{className:x(815)}),"Select (",L[x(735)],")"]}),a[x(697)](x(567),{onClick:_0,disabled:!N||!f||r0[x(579)]===0,className:x(696),title:x(626),children:[a[x(492)](E0,{className:x(630)}),"Bulk PDF"]}),a[x(697)]("button",{onClick:v0,disabled:!N||!f||r0.length===0,className:x(473),title:x(663),children:[a.jsx(h0,{className:x(605)}),x(819)]}),a[x(697)]("button",{onClick:M0,disabled:!E,className:x(481),title:x(883),children:[a.jsx(h0,{className:x(477)}),x(830)]})]})]}),a[x(492)](x(461),{className:x(574),children:a[x(492)](x(461),{className:"w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0",children:E?a.jsx(x(461),{className:x(779),style:{transform:"scale("+J+x(686),willChange:x(521),backfaceVisibility:x(734),WebkitBackfaceVisibility:x(734)},children:a[x(697)](x(461),{className:x(627),children:[a[x(492)]("div",{className:"absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000"}),a[x(492)](x(461),{className:x(596),children:a[x(492)](I0,{pageNumber:1,student:E,profile:T,schoolYear:d,subject:O?.subject_name||"",teacher:k0,fillColor:B,outlineColor:z,gradeData:D0,attendanceData:O0,paperSize:_})})]})}):a[x(697)](x(461),{className:x(511),children:[a[x(697)](x(461),{className:x(627),children:[a[x(492)](x(461),{className:x(483)}),a[x(697)](x(461),{className:"relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl",children:[a[x(492)](X0,{className:x(708)}),a[x(697)](x(461),{className:x(826),children:[a[x(492)](x(509),{className:x(863),children:x(653)}),a[x(492)](x(461),{className:x(874)})]}),a[x(492)]("div",{className:x(763),children:a[x(492)](h0,{className:x(554)})})]})]}),a[x(697)](x(461),{className:x(562),children:[a[x(492)]("h2",{className:x(565),children:"Individual Record"}),a[x(492)]("p",{className:x(818),children:x(591)})]})]})})}),a[x(492)](x(461),{id:x(789),className:x(854),style:{left:x(656)},children:r0.map(t=>{const r=x,l=f0(t,f,O),n=p0(t);return a[r(492)](r(461),{className:r(766),children:a[r(492)](I0,{pageNumber:1,student:t,profile:T,schoolYear:d,subject:O?.[r(463)]||"",teacher:k0,fillColor:B,outlineColor:z,gradeData:l,attendanceData:n,paperSize:_})},t[r(841)])})}),Q&&a[x(492)](x(461),{className:x(460),children:a[x(697)](x(461),{className:x(649),children:[a.jsxs("div",{className:x(712),children:[a[x(697)](x(461),{className:x(508),children:[a.jsx(x(461),{className:x(825),children:a[x(492)](T0,{className:x(534)})}),a.jsxs(x(461),{children:[a[x(492)]("h3",{className:x(869),children:x(539)}),a.jsxs("p",{className:"text-[10px] text-slate-400 font-semibold uppercase tracking-widest",children:[S?.[x(737)],x(598),S?.[x(641)],x(739),O?.subject_name]})]})]}),a[x(492)](x(567),{onClick:()=>G(!1),className:x(453),children:a[x(492)](Z0,{className:x(718)})})]}),a[x(697)](x(461),{className:x(833),children:[a[x(697)](x(461),{className:x(667),children:[a[x(492)](Q0,{className:x(796)}),a[x(492)](x(604),{type:"text",placeholder:x(558),value:V,onChange:t=>s(t.target.value),className:x(613)})]}),a[x(697)](x(461),{className:x(584),children:[a[x(697)](x(567),{onClick:P0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[a.jsx(w0,{className:"w-3 h-3 text-indigo-600"}),x(760),I[x(579)],")"]}),a[x(697)](x(567),{onClick:B0,className:x(600),children:[x(547),x0[x(579)],")"]}),a.jsxs(x(567),{onClick:F0,className:x(600),children:[x(788),e0[x(579)],")"]}),a[x(492)](x(567),{onClick:H0,className:x(457),children:x(733)})]})]}),a.jsxs("div",{className:x(801),children:[u0[x(579)]>0&&a[x(697)](x(461),{className:x(744),children:[a[x(492)](x(461),{className:x(581),children:a[x(697)](x(509),{className:"text-[10px] font-black text-slate-500 uppercase tracking-widest",children:[x(827),u0[x(579)],")"]})}),a[x(492)]("div",{className:x(711),children:u0[x(858)](t=>{const r=x,l=L[r(702)](t.lrn),n=f&&(y[r(590)](h=>h.student_lrn===t.lrn&&h[r(817)]===f&&h[r(675)]===d)||M[r(590)](h=>h[r(618)]===t.lrn&&h.subject_id===f&&h[r(675)]===d));return a[r(697)](r(461),{onClick:()=>j0(t.lrn),className:r(454)+(l?r(608):"bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"),children:[a[r(697)](r(461),{className:r(638),children:[l?a.jsx(w0,{className:r(557)}):a.jsx(R0,{className:"w-4 h-4 text-slate-300 shrink-0"}),a[r(697)](r(461),{className:r(451),children:[a[r(697)]("p",{className:r(681),children:[t.last_name,", ",t[r(559)]," ",t[r(528)]?t[r(528)][0]+".":""]}),a.jsxs("p",{className:r(685),children:[r(619),t[r(841)]]})]})]}),n&&a[r(492)](r(509),{className:"px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0",children:"✓ Grades"})]},t.lrn)})})]}),g0[x(579)]>0&&a[x(697)]("div",{className:x(744),children:[a.jsx(x(461),{className:"flex items-center justify-between px-1",children:a[x(697)](x(509),{className:"text-[10px] font-black text-slate-500 uppercase tracking-widest",children:[x(545),g0[x(579)],")"]})}),a[x(492)](x(461),{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:g0[x(858)](t=>{const r=x,l=L[r(702)](t[r(841)]),n=f&&(y[r(590)](h=>h[r(618)]===t.lrn&&h[r(817)]===f&&h.school_year===d)||M.some(h=>h[r(618)]===t[r(841)]&&h[r(817)]===f&&h[r(675)]===d));return a[r(697)](r(461),{onClick:()=>j0(t[r(841)]),className:"p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 "+r(l?608:877),children:[a[r(697)]("div",{className:r(638),children:[l?a[r(492)](w0,{className:"w-4 h-4 text-indigo-600 shrink-0"}):a.jsx(R0,{className:"w-4 h-4 text-slate-300 shrink-0"}),a.jsxs(r(461),{className:r(451),children:[a[r(697)]("p",{className:r(681),children:[t[r(666)],", ",t[r(559)]," ",t[r(528)]?t[r(528)][0]+".":""]}),a[r(697)]("p",{className:"text-[9px] font-medium text-slate-400",children:[r(619),t[r(841)]]})]})]}),n&&a[r(492)](r(509),{className:"px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0",children:r(836)})]},t.lrn)})})]}),c0.length===0&&a[x(697)](x(461),{className:x(805),children:[x(622),V,'".']})]}),a[x(697)](x(461),{className:"p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0",children:[a.jsxs(x(461),{className:x(459),children:[a.jsx(x(509),{className:"text-indigo-600 font-black",children:L[x(735)]}),x(767),I[x(579)]," learners selected"]}),a.jsxs(x(461),{className:x(797),children:[a[x(697)]("button",{onClick:_0,disabled:L[x(735)]===0,className:x(849),children:[a[x(492)](E0,{className:x(753)}),x(560)]}),a[x(697)]("button",{onClick:v0,disabled:L[x(735)]===0,className:"h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer",children:[a.jsx(h0,{className:x(753)}),"Bulk Print"]})]})]})]})}),u&&a[x(492)](x(461),{className:x(888),children:a.jsxs("div",{className:x(553),children:[a.jsxs(x(461),{className:x(720),children:[a[x(492)](x(461),{className:x(670)}),a[x(492)](x(461),{className:"relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30",children:a[x(492)]($0,{className:x(790)})})]}),a[x(697)](x(461),{className:x(744),children:[a[x(492)]("h3",{className:"text-lg font-black text-slate-900 tracking-tight uppercase",children:"Processing LIR Records"}),a.jsx("p",{className:x(851),children:A0})]}),a[x(697)](x(461),{className:x(850),children:[a[x(492)](x(461),{className:x(672),children:a.jsx(x(461),{className:x(556),style:{width:Math[x(746)](5,j)+"%"}})}),a[x(697)]("div",{className:x(519),children:[a[x(492)](x(509),{children:x(470)}),a[x(697)]("span",{children:[j,"%"]})]})]})]})}),a[x(492)](x(529),{children:`
                @media print {
                    @page {
                        size: `+(_==="a4"?x(446):_===x(633)?x(480):x(816))+x(838)+x(_==="a4"?448:540)+x(634)+x(_==="a4"?448:540)+x(505)+x(_==="a4"?448:540)+x(490)+(_==="a4"?x(602):_===x(633)?x(645):x(727))+x(651)})]})}function m0(){const x=[`px; 
                        padding: `,"Females (","lir-bulk-render-container","w-8 h-8 animate-spin","half-page-section border-t-4","NOVEMBER","Letter","Subject","text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5","w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400","flex items-center gap-2","3RD","target","portrait","flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4","3.32%","Select Learner",`rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `,"p-8 text-center text-slate-400 text-xs font-medium",`;
                        border: 1px solid `,`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `,"filter","ELEMENTARY",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"Choose Outline Color",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"Term 3 Exam (Non-Grad)",`; 
                        padding: `,"w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform","8.5in 13in","subject_id","text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60","Bulk Print","Bulk_LIR_","DECEMBER","getElementById","data-field uppercase font-bold border-2 whitespace-nowrap px-1","JULY","w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400","absolute inset-0 flex flex-col items-center justify-center","Male Learners (","header-green py-1",`; 
                        color: black !important; 
                        font-size: `,"Print Single","AUGUST","thead","p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0","LIR_","TERM EXAM","✓ Grades",`; 
                        font-size: `,`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `,"10%","apply","lrn","lir-title-bar-custom mb-3 uppercase tracking-widest","Opening Block: Term 1",`px;
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
                        background-color: `,"Learner's Individual Record Card",`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `,"school-logo.png","21972jooHVA","h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","space-y-1.5","text-xs font-semibold text-slate-500","June 8-11, 2026","none","fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block"," learners...","FIRST NAME","school-forms","map","grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","Filter / Select Learners","APRIL","includes","text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic","LRN","month-col uppercase","title","Jan 25, 2027","border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden","text-sm font-black uppercase tracking-wide text-white",`rem; 
                        min-height: `,"Term 3 Exam (Graduating)","M.I","forEach","w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4","SECOND","Apr 1-8, 2027","bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50","2164324fAbMtM","Aug 28, 2026","rem","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate","flex flex-col shrink-0","Print single active learner",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,"kinder","Important Dates","folio","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200","toUpperCase","absent",`rem; 
                        border-bottom: 2px solid `,`;
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"210mm 297mm","JANUARY","210mm","header-subject-table border-collapse border-2","table","truncate","value","w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ","Term 1: Summative Test #1","select","h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1","header-row-fill","text-xs font-bold text-slate-600","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200","div","Dec 7-18, 2026","subject_name","inherit","Term 1: Summative Test #2","signature-box bg-white","important-dates-box","fixed","console","Export Pipeline","female","month-col","h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","charAt","FEBRUARY","flex items-stretch border-2 w-full overflow-hidden","w-3 h-3 group-hover:translate-y-0.5 transition-transform","1x1 Learner Photo","DepEd Logo","8.5in 11in","h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `,"absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full","delete","WRITTEN /ORAL WORKS (WWs)","font-bold py-1","col-span-1 flex flex-col items-center justify-center pt-1","40px","No sheets ready for PDF export.",` !important;
                        height: `,"add","jsx","63120JNRpKk","PRODUCT/PERFORMANCE TASK (PPTs)","Learner Record","sort","0px","displayName","col","useState",`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `,"px ","Dec 18, 2026",`rem; 
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
                `,` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"color","col-span-1","flex items-center gap-3","span","School Logo","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10","attendance-table mb-3","optgroup","tbody","Mar 22-23, 2027",`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"Bulk print stream launched successfully.",`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,"flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider","date-label uppercase","transform","20%","w-full h-full opacity-0 absolute inset-0 cursor-pointer",`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,"option","SUBJECT","label-green py-1 border-2","middle_name","style","Select Subject","flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0","15%","attendance-date-cell","w-5 h-5",`rem; 
                        font-weight: 700; 
                        height: `,"font-extrabold uppercase whitespace-nowrap","w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0",`rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,"Bulk LIR Operations","8.5in","isArray","Term 2: Summative Test #2","toString","performance_tasks","Female Learners (",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid `,"Males (","w-full h-full object-cover","Teacher's Signature","quarter","BAGONG BARRIO NATIONAL HIGH SCHOOL","return (function() ","bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6","w-10 h-10 text-white",`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300","w-4 h-4 text-indigo-600 shrink-0","Filter learners by name or LRN...","first_name","Download PDF","trim","space-y-4","attendance","scores","text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase","flex justify-between items-center w-full overflow-hidden","button","PDF download complete!","final_grade","exception","July 28, 2026","No sheets ready for printing. Please try again.","Total Abs.","flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar","name","Term 2 Examination","bind","text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none","length","LAST NAME","flex items-center justify-between px-1","dates-header-bar uppercase",`px;
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
                        padding: `,"flex items-center gap-1.5 flex-wrap","Failed to launch bulk print.","Feb 16, 2027",".lir-bulk-sheet","info","Dates","some","Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections.","FEMALE","find","Months","1064FAErze","lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none"," TERM"," - ","relative group shrink-0","h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1","JUNIOR HIGH SCHOOL","297mm","important-dates-header uppercase italic","input","w-3 h-3 group-hover:scale-110 transition-transform",`px;
                        font-size: `,"13%","bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm","Sept 2-15, 2026","log",`px; 
                        font-size: `,"flex items-center gap-1.5 lg:gap-2 shrink-0","w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500","Dec 3-4, 2026","JUNE","SUMMATIVE TEST","SENIOR HIGH SCHOOL","student_lrn","LRN: ","flex gap-4 items-start w-full mt-2",`dd;
                        border: 1px solid `,'No learners found matching "',"Oct 29, 2026","replace","flex items-center justify-center bg-white overflow-hidden","Bulk Download PDF for selected learners","relative group","toLowerCase","Unknown error","w-3 h-3 group-hover:-translate-y-0.5 transition-transform","End of Term 2","student-info-table border-2","letter",` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `,"grow flex flex-col gap-1 overflow-hidden","w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200","slice","flex items-center gap-2.5 min-w-0",`rem;
                        width: `,`px;
                        width: `,"section_name","End-of-Term Block","section_id","student_section","11in","PHOTO","Term 1 Examination","useEffect","bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]","print",` !important;
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
             `,"Term 3: Summative Test #1","LIR",`; 
                        text-align: center; 
                        font-size: `,"4276595qDVIOJ","-9999px","Preparing LIR sheets for bulk printing...","font-bold leading-tight","push","THIRD",`rem;
                    }

                    .row-label {
                        background-color: `,"summative_tests","Bulk Print for selected learners","useCallback","photo_url","last_name","relative flex-1 min-w-48",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,"Sept 16, 2026","absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping","from","h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200",`;
                        padding: `,"font-bold uppercase leading-none text-center","school_year","School Year: ","track",`;
                        color: #000000 !important;
                        font-size: `,"Daily Attendance",`px;
                        text-align: center;
                        height: `,"text-xs font-bold text-slate-800 truncate","2ND","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","text-[9px] font-medium text-slate-400",") translateZ(0)","font-normal ml-2","w-3 h-3","localeCompare","relative group min-w-0 flex-1","4810773PcBSeH","1 X 1",`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `,"relative flex items-center justify-center cursor-pointer shrink-0","Term 2: Summative Test #1","h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","jsxs","Apr 6-7, 2027","gender","absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30","font-bold","has","TOTAL","date-val uppercase",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,"src","data-field uppercase font-bold border-2 whitespace-nowrap","w-28 h-28 text-slate-100 dark:text-slate-600","data-field font-extrabold border-2 whitespace-nowrap","FIRST","grid grid-cols-1 sm:grid-cols-2 gap-2","px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0","40%","Mar 24-31, 2027","text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums","1ST","deped_logo_right.png","w-4 h-4","July 6, 2026","relative w-16 h-16 mx-auto flex items-center justify-center","trace","EOSY Rites","#86efac","#22c55e","TERM","entries","13in",`44;
                        font-weight: 800;
                        font-size: `,"50SPzZnk",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"teacher_id","male","Clear","hidden","size","6834gPUufj","section_grade_level","MALE"," | ","z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full","__proto__","date-row","45ihaiXx","space-y-2","Zoom In","max","ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","error","2447775NaqRkV","img",`px; 
                        font-weight: 700; 
                        font-size: `,"quarterly_exam","w-3.5 h-3.5","object-contain",`rem; 
                        padding: `,"MARCH","flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5","Mar 15-16, 2027","useMemo","All (",`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `,"min","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500","prototype","Section","lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always"," of ","page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none","written_works","reduce","querySelectorAll","-11px","label-green border-2 whitespace-nowrap","SEPTEMBER","row-label","w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors",`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,"term-label","transition-all duration-700 ease-out origin-top print:scale-100","Sept 1, 2026","logo_url","round","Export failed: ",`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"3hrtpYK",`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `];return m0=function(){return x},m0()}export{bx as LIRPage};
