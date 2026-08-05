import{j as a,r as m,cq as Y0,bH as o0,cA as J0,c9 as q0,be as v0,bO as _0,cc as d0,cz as V0,bs as W0,dn as X0,cB as p0,cC as j0,bE as Z0}from"./vendor-D807hmOL.js";import{b as Q0,u as K0,h as $0,n as xx}from"./index-Doq4RIvl.js";import{e as ex,p as ax}from"./pdf-export-BTVlB5Nl.js";import"./vendor-pdf-libs-BVl_U1Kq.js";import"./vendor-firebase-CEUkPUSI.js";import"./vendor-framer-motion-ByrjgV2f.js";const s0=V;function V(x,y){return x=x-487,c0()[x]}(function(x,y){const f=V,k=x();for(;;)try{if(-parseInt(f(851))/1+parseInt(f(606))/2*(parseInt(f(667))/3)+-parseInt(f(844))/4+-parseInt(f(521))/5*(parseInt(f(509))/6)+parseInt(f(833))/7*(-parseInt(f(911))/8)+parseInt(f(503))/9*(parseInt(f(602))/10)+-parseInt(f(750))/11*(-parseInt(f(560))/12)===y)break;k.push(k.shift())}catch{k.push(k.shift())}})(c0,788284);const l0=(function(){let x=!0;return function(y,f){const k=x?function(){if(f){const I=f.apply(y,arguments);return f=null,I}}:function(){};return x=!1,k}})(),U0=l0(void 0,function(){const x=V,y=function(){const A=V;let d;try{d=Function(A(538)+A(623)+");")()}catch{d=window}return d},f=y(),k=f.console=f[x(593)]||{},I=[x(889),x(858),x(584),"error",x(745),"table",x(788)];for(let A=0;A<I[x(673)];A++){const d=l0.constructor[x(838)][x(539)](l0),o=I[A],v=k[o]||d;d[x(702)]=l0[x(539)](l0),d[x(811)]=v[x(811)][x(539)](v),k[o]=d}});U0();const S0=({pageNumber:x,student:y,profile:f,schoolYear:k,subject:I,teacher:A,fillColor:d=s0(846),outlineColor:o=s0(499),gradeData:v,paperSize:M=s0(892),attendanceData:n0={}})=>{const e=s0,W="./",N=25,i0=s=>Array[V(492)]({length:N},(h,j)=>s[j]??""),S=(s,p)=>{const h=V,j=Number(p);if(!j)return!1;const C=s[h(697)]();return C===h(610)&&j===12||C==="AUGUST"&&(j===21||j===31)||C===h(637)&&(j===2||j===30)||C==="DECEMBER"&&j===8||C===h(897)&&j===1};let P=e(598),u=e(893),l=1.12,Y=1.2,J=.8,B=.75,T=5,L=.8,X=40,_=240,Z=100,Q=50,U=e(855);M==="a4"?(u="210mm",P=e(626),l=1.02,Y=.85,J=.55,B=.5,T=2,L=.65,X=26,_=140,Z=80,Q=40):M===e(915)?(u="8.5in",P=e(776),l=.98,Y=.85,J=.55,B=.5,T=3,L=.7,X=28,_=160,Z=65,Q=32,U=e(497)):M===e(892)&&(u=e(893),P=e(598),l=.98,Y=.85,J=.55,B=.5,T=3,L=.7,X=28,_=160,Z=65,Q=32,U=e(497));const z=(s,p)=>{const h=e,j=(s||"").trim();return j[h(673)]>32?p*.65:j[h(673)]>24?p*.78:j[h(673)]>16?p*.88:p},F=z(I,L*l),q=z(A,L*l);return a.jsx(e(664),{className:e(668),children:a[e(933)](e(664),{className:e(792),style:{width:u,height:P},children:[a[e(651)](e(505),{children:`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `+u+" "+P+e(842)+o+e(526)+8*l+e(563)+5*l+`px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: `+d+e(801)+o+e(558)+3*l+e(883)+.85*l+e(549)+d+e(510)+o+e(870)+.6*l+e(627)+o+`;
                        padding: `+2*l+e(675)+.8*l+e(891)+.6*l+e(489)+o+`;
                        padding: `+1.5*l+e(576)+24*l+e(721)+d+`44;
                        font-weight: 800;
                        font-size: `+.6*l+e(919)+d+e(574)+.6*l+e(561)+70*l+`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `+d+`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `+o+e(557)+X*l+e(746)+_*l+e(536)+d+e(783)+.9*l+e(754)+4*l+`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `+o+e(823)+o+e(621)+o+`; 
                        text-align: center; 
                        font-size: `+.5*l+e(535)+21*l+e(498)+1*l+e(805)+d+e(652)+.5*l+`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `+o+e(635)+d+e(753)+.9*l+e(494)+d+`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `+.45*l+e(701)+.5*l+e(689)+o+e(502)+d+`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `+3*l+e(871)+.85*l+e(812)+o+e(794)+o+e(532)+.45*l+e(763)+18*l+e(672)+95*l+e(778)+o+e(780)+1.5*l+e(688)+4*l+e(916)+1.5*l+e(688)+4*l+e(787)+.42*l+`rem; 
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
                `}),a[e(933)]("div",{className:e(700),children:[a[e(933)]("div",{className:e(646),children:[a[e(933)](e(664),{className:e(862),children:[a.jsxs(e(664),{className:"flex items-center gap-4 shrink-0",children:[a[e(651)](e(664),{className:e(600),style:{width:64*l,height:64*l},children:a[e(651)](e(556),{src:f[e(582)]||W+e(905),alt:"School Logo",className:e(622),onError:s=>{const p=e;s.target[p(843)]=W+p(905)}})}),a.jsxs(e(664),{children:[a[e(651)]("h1",{className:e(928),style:{fontSize:Y*l+e(912)},children:f.name||e(790)}),a.jsx("p",{className:e(813),style:{fontSize:J*l+e(912),color:o},children:e(835)}),a[e(933)]("p",{className:e(570),style:{fontSize:B*l+e(912)},children:[e(657),a.jsx(e(810),{className:e(834),children:k})]})]})]}),a[e(651)](e(664),{className:"shrink-0 ml-auto",children:a[e(651)]("table",{className:e(727),style:{borderColor:o},children:a[e(651)](e(566),{children:a[e(933)]("tr",{children:[a[e(651)]("td",{className:e(887),style:{fontSize:L*l+e(912),padding:T*l+e(688)+T*2*l+"px",borderColor:o},children:e(649)}),a[e(651)]("td",{className:e(758),style:{fontSize:F+e(912),padding:T*l+e(688)+T*2.5*l+"px",borderColor:o},children:I}),a[e(651)]("td",{className:e(887),style:{fontSize:L*l+"rem",padding:T*l+e(688)+T*2*l+"px",borderColor:o},children:e(873)}),a[e(651)]("td",{className:"data-field font-extrabold border-2 whitespace-nowrap",style:{fontSize:q+"rem",padding:T*l+e(688)+T*2.5*l+"px",borderColor:o},children:A})]})})})})]}),a.jsxs("div",{className:"flex gap-4 items-start w-full mt-2",children:[a.jsx("div",{className:"border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden",style:{width:1*l+"in",height:1*l+"in",borderColor:o},children:y.photo_url?a[e(651)]("img",{src:y[e(747)],alt:e(666),className:e(765)}):a[e(933)](e(810),{className:e(884),style:{fontSize:.7*l+e(912)},children:[e(645),a.jsx("br",{}),e(716)]})}),a[e(651)]("div",{className:"grow flex flex-col gap-1 overflow-hidden",children:a[e(651)](e(909),{className:e(699),style:{borderColor:o,height:1*l+"in"},children:a[e(933)](e(566),{children:[a[e(933)]("tr",{style:{height:.5*l+"in"},children:[a.jsx("td",{className:e(784),style:{borderColor:o,height:.5*l+"in"},children:y.last_name}),a[e(651)]("td",{className:e(784),style:{borderColor:o,height:.5*l+"in"},children:y[e(808)]}),a[e(651)]("td",{className:e(898),style:{width:e(679),borderColor:o,height:.5*l+"in"},children:y[e(761)]?.charAt(0)||""}),a[e(651)]("td",{className:e(784),style:{borderColor:o,height:.5*l+"in"},children:y[e(545)]}),a[e(651)]("td",{className:e(784),style:{borderColor:o,height:.5*l+"in"},children:y[e(568)]})]}),a[e(933)]("tr",{style:{height:.5*l+"in"},children:[a[e(651)]("td",{className:"label-green py-1 border-2",style:{borderColor:o,height:.5*l+"in"},children:e(730)}),a[e(651)]("td",{className:"label-green py-1 border-2",style:{borderColor:o,height:.5*l+"in"},children:e(880)}),a[e(651)]("td",{className:e(867),style:{width:"40px",borderColor:o,height:.5*l+"in"},children:e(550)}),a[e(651)]("td",{className:"label-green py-1 border-2",style:{borderColor:o,height:.5*l+"in"},children:e(816)}),a[e(651)]("td",{className:e(806),style:{borderColor:o,height:.5*l+"in"},children:e(859)})]})]})})})]}),a[e(933)]("div",{className:e(665),children:[a[e(933)]("div",{children:[a.jsx(e(664),{className:e(656),style:{fontSize:.75*l+"rem"},children:e(795)}),a[e(651)](e(909),{style:{tableLayout:e(869)},children:a[e(933)](e(566),{children:[a[e(933)]("tr",{className:e(595),children:[a[e(651)]("td",{className:"term-label",style:{width:e(537)},children:"TERM"}),[1,2,3,4,5][e(902)](s=>a.jsx("td",{style:{width:"13%"},children:s},s)),a[e(651)]("td",{className:"font-bold",style:{width:e(571)},children:e(803)})]}),[1,2,3][e(902)](s=>a.jsxs("tr",{children:[a[e(651)]("td",{className:e(899),children:e(s===1?619:s===2?601:712)}),[...Array(5)][e(902)]((p,h)=>a[e(651)]("td",{children:v?.[s]?.scores.ww[h]??""},h)),a[e(651)]("td",{className:e(570),children:v?.[s]?.[e(542)].ww[e(579)](0,5).reduce((p,h)=>p+(Number(h)||0),0)||""})]},s))]})})]}),a[e(933)](e(664),{children:[a.jsx(e(664),{className:e(656),style:{fontSize:.75*l+e(912)},children:e(849)}),a[e(651)](e(909),{style:{tableLayout:e(869)},children:a[e(933)](e(566),{children:[a[e(933)]("tr",{className:e(595),children:[a.jsx("td",{className:e(544),style:{width:e(571)},children:e(528)}),[1,2,3][e(902)](s=>a[e(651)]("td",{style:{width:e(571)},children:s},s)),a[e(651)]("td",{className:"font-bold",style:{width:"20%"},children:"TOTAL"})]}),[1,2,3][e(902)](s=>a.jsxs("tr",{children:[a[e(651)]("td",{className:"row-label",children:e(s===1?619:s===2?601:712)}),[...Array(3)][e(902)]((p,h)=>a[e(651)]("td",{children:v?.[s]?.[e(542)].pt[h]??""},h)),a.jsx("td",{className:"font-bold",children:v?.[s]?.[e(542)].pt[e(579)](0,3)[e(815)]((p,h)=>p+(Number(h)||0),0)||""})]},s))]})})]})]}),a[e(933)](e(664),{className:e(839),children:[a[e(933)](e(664),{className:e(854),children:[a[e(651)](e(664),{className:e(656),style:{fontSize:.7*l+e(912)},children:e(659)}),a.jsx(e(909),{style:{tableLayout:e(869)},children:a[e(933)]("tbody",{children:[a[e(933)]("tr",{className:e(595),children:[a.jsx("td",{className:e(544),style:{width:e(822)},children:e(528)}),[1,2][e(902)](s=>a[e(651)]("td",{children:s},s))]}),[1,2,3][e(902)](s=>a[e(933)]("tr",{children:[a[e(651)]("td",{className:e(899),children:s===1?e(619):s===2?"SECOND":e(712)}),[...Array(2)][e(902)]((p,h)=>a[e(651)]("td",{children:v?.[s]?.[e(542)].st[h]??""},h))]},s))]})})]}),a[e(651)](e(664),{className:e(854),children:a[e(933)]("table",{style:{tableLayout:e(869)},children:[a[e(651)](e(698),{children:a.jsx("tr",{className:e(595),children:a[e(651)]("td",{colSpan:2,className:"font-bold py-1",style:{fontSize:.7*l+"rem"},children:"TERM EXAM"})})}),a.jsx("tbody",{children:[1,2,3][e(902)](s=>a[e(933)]("tr",{children:[a[e(933)]("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:o},children:[e(s===1?709:s===2?669:618),e(929)]}),a[e(651)]("td",{className:e(570),children:v?.[s]?.scores.te||""})]},s))})]})}),a[e(651)]("div",{className:"col-span-1",children:a[e(933)](e(909),{style:{tableLayout:e(869)},children:[a[e(651)]("thead",{children:a[e(651)]("tr",{className:e(595),children:a.jsx("td",{colSpan:2,className:e(490),style:{fontSize:.7*l+"rem"},children:e(832)})})}),a.jsx(e(566),{children:[1,2,3][e(902)](s=>a[e(933)]("tr",{children:[a.jsxs("td",{className:e(868),style:{borderColor:o},children:[e(s===1?709:s===2?669:618),e(929)]}),a[e(651)]("td",{className:e(570),children:v?.[s]?.[e(840)]||""})]},s))}),a.jsx(e(496),{children:a[e(651)]("tr",{style:{height:1.5*l+"px"},children:a.jsx("td",{colSpan:2,style:{border:e(820)}})})})]})}),a[e(933)](e(664),{className:e(748),style:{marginTop:U},children:[a[e(651)](e(664),{className:"mb-2",children:a.jsx("img",{src:W+e(890),alt:e(733),className:e(895),style:{width:Z*l,height:Q*l}})}),a[e(651)](e(664),{className:e(894)}),a[e(651)]("p",{className:e(755),style:{fontSize:.6*l+e(912),marginTop:14*l+"px"},children:e(604)})]})]})]}),a.jsxs(e(664),{className:e(624),style:{borderColor:o},children:[a.jsx(e(664),{className:"lir-title-bar-custom mb-3 uppercase tracking-widest",children:e(565)}),a[e(933)](e(909),{className:e(531),children:[a[e(933)](e(555),{children:[a[e(651)]("col",{style:{width:e(932)}}),Array.from({length:N}).map((s,p)=>a[e(651)](e(525),{style:{width:"3.32%"}},p)),a[e(651)]("col",{style:{width:"7%"}})]}),a.jsx(e(698),{children:a[e(933)]("tr",{children:[a[e(651)]("th",{className:e(817),children:"Months"}),a[e(651)]("th",{colSpan:N,className:e(923),children:"Dates"}),a[e(651)]("th",{className:e(845),children:"Total Abs."})]})}),a[e(651)]("tbody",{children:[{name:e(610),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:e(920),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:"AUGUST",dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:"SEPTEMBER",dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:e(608),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:e(637),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:e(715),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:e(897),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:e(543),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:e(682),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:e(488),dates:[1,2,5,6,7,8]}][e(902)](s=>a.jsxs("tr",{children:[a[e(651)]("td",{className:e(585),children:s[e(648)]}),i0(s[e(687)])[e(902)]((p,h)=>a[e(651)]("td",{className:e(800),style:{color:S(s[e(648)],p)?"red":e(708)},children:p},h)),a[e(651)]("td",{className:"font-bold",children:n0[s[e(648)]]||""})]},s[e(648)]))})]}),a[e(933)](e(664),{className:e(866),style:{borderColor:o},children:[a[e(933)]("div",{className:e(739),children:[a[e(651)](e(664),{className:e(856),children:e(710)}),[[e(872),e(632)],["July 6, 2026","Term 1: Summative Test #1"],[e(836),"Term 1: Summative Test #2"],[e(818),"Term 1 Examination"],[e(768),e(653)],[e(731),e(650)],[e(703),e(907)]][e(902)](([s,p])=>a.jsxs(e(664),{className:"date-row",children:[a[e(651)](e(664),{className:e(519),children:s}),a[e(651)](e(664),{className:e(734),children:p})]},s))]}),a[e(933)](e(664),{className:e(739),children:[a[e(651)](e(664),{className:e(856),children:"Important Dates"}),[[e(785),e(522)],["Oct 29, 2026",e(773)],[e(541),e(707)],[e(658),e(650)],[e(935),e(718)],[e(882),e(630)],[e(500),e(931)]][e(902)](([s,p])=>a[e(933)]("div",{className:e(853),children:[a[e(651)]("div",{className:"date-val uppercase",children:s}),a[e(651)]("div",{className:e(734),children:p})]},s))]}),a[e(933)](e(664),{className:e(739),children:[a[e(651)](e(664),{className:e(856),children:"Important Dates"}),[["Feb 16, 2027",e(677)],[e(749),"Term 3 Exam (Graduating)"],[e(885),e(924)],["Mar 24-31, 2027",e(650)],["Apr 1-8, 2027","End-of-Term Block"],[e(517),e(607)],["Apr 8, 2027",e(567)]][e(902)](([s,p])=>a.jsxs(e(664),{className:e(853),children:[a.jsx(e(664),{className:e(519),children:s}),a.jsx(e(664),{className:e(734),children:p})]},s))]})]})]})]})]})})};function dx(){const x=s0,{students:y,sections:f,subjects:k,teachers:I,schoolProfile:A,activeSchoolYear:d,setCurrentView:o,classRecords:v,gradingSheetRecords:M,hpsRecords:n0,sf2Sheets:e}=Q0(),{user:W}=K0(),[N,i0]=m[x(876)](""),[S,P]=m[x(876)](null),[u,l]=m[x(876)](""),[Y,J]=m[x(876)](1),[B,T]=m[x(876)](x(846)),[L,X]=m.useState(x(499)),[_,Z]=m[x(876)]("folio"),[Q,U]=m[x(876)](!1),[z,F]=m[x(876)](new Set),[q,s]=m[x(876)](""),[p,h]=m.useState(!1),[j,C]=m[x(876)](0),[T0,K]=m.useState(""),D=m[x(737)](()=>{const t=x;return f[t(554)](r=>r[t(590)]===N||r.id===N)},[f,N]),O=m[x(737)](()=>{const t=x;return k[t(554)](r=>r.id===u||r[t(612)]===u)},[k,u]),E0=m[x(737)](()=>{const t=x;if(!D)return[];const r=$0(W,D,k),n=new Set;return r[t(799)](i=>{const c=t,g=xx(i[c(612)]);return n[c(690)](g)?!1:(n[c(736)](g),!0)})},[D,k,W]),u0=m[x(737)](()=>{const t=x;if(O?.teacher_id){const r=I[t(554)](n=>n[t(797)]===O.teacher_id||n.id===O.teacher_id);if(r)return r[t(922)]||r[t(648)]}return D?.adviser_name||""},[O,I,D]),a0=m[x(737)](()=>{const t=x;return[...f][t(764)]((r,n)=>{const i=t,c=(r[i(676)]||"")[i(634)](n.section_grade_level||"",void 0,{numeric:!0});return c!==0?c:(r[i(590)]||"")[i(634)](n[i(590)]||"")})},[f]),R0=m[x(737)](()=>{const t=x,r={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return a0[t(807)](n=>{const i=t,c=(n[i(676)]||"")[i(495)](),g=parseInt(c[i(591)](/\D/g,""))||0;c[i(552)]("kinder")||g>=1&&g<=6?r[i(633)][i(588)](n):g>=7&&g<=10?r[i(546)][i(588)](n):g>=11&&g<=12&&r["SENIOR HIGH SCHOOL"][i(588)](n)}),r},[a0]);m[x(540)](()=>{if(!N&&a0[x(673)]===1){const r=setTimeout(()=>{i0(a0[0].section_name)},0);return()=>clearTimeout(r)}},[a0,N]),m[x(540)](()=>{const t=setTimeout(()=>{l(""),P(null),F(new Set)},0);return()=>clearTimeout(t)},[N]);const E=m[x(737)](()=>{const t=x;if(!N)return[];const r=f[t(554)](n=>n.section_name===N||n.id===N)?.id;return y.filter(n=>n.student_section===N||r&&n[t(545)]===r)},[y,N,f]),$=m[x(737)](()=>E[x(799)](t=>(t[x(529)]||"")[x(495)]()===x(581)).sort((t,r)=>(t.last_name+", "+t[x(808)])[x(634)](r[x(752)]+", "+r[x(808)])),[E]),x0=m[x(737)](()=>E[x(799)](t=>(t[x(529)]||"")[x(495)]()!==x(581))[x(764)]((t,r)=>(t[x(752)]+", "+t.first_name).localeCompare(r[x(752)]+", "+r.first_name)),[E]),I0=()=>{const t=x;z.size===0&&E[t(673)]>0&&F(new Set(E[t(902)](r=>r[t(568)]))),U(!0)},h0=m[x(643)](t=>{const r=x;if(!t)return{};const n={};return e[r(799)](c=>c[r(875)]===d&&(c[r(641)]===D?.id||c[r(641)]===N)).forEach(c=>{const g=r,b=c[g(777)]?.[t[g(568)]];if(b){const R=Object[g(609)](b)[g(799)](H=>H?.[g(495)]()===g(603))[g(673)];R>0&&(n[c.month[g(697)]()]=R)}}),n},[e,d,D,N]),b0=m[x(643)]((t,r,n)=>{const i=x;if(!t||!r)return;const c={};return[1,2,3][i(807)](g=>{const b=i,R=v.find(w=>w[b(594)]===t[b(568)]&&w[b(875)]===d&&Number(w[b(762)])===g&&(w[b(775)]===n?.id||w[b(775)]===r))||M[b(554)](w=>w.student_lrn===t[b(568)]&&w[b(875)]===d&&Number(w[b(762)])===g&&(w[b(775)]===n?.id||w[b(775)]===r)),H=n0.find(w=>(w.subject_id===n?.id||w[b(775)]===r)&&w[b(875)]===d&&Number(w.quarter)===g),e0=(w,F0)=>{const k0=b,H0=Array[k0(518)](w)?w:[];return Array[k0(492)]({length:F0},(tx,G0)=>H0[G0]??"")},P0=R,B0=H,G=w=>w===""||w===null||w===void 0?"":w;c[g]={scores:{ww:e0(R?.[b(850)],10)[b(902)](G),pt:e0(R?.[b(879)],10)[b(902)](G),st:e0(P0?.[b(636)],5)[b(902)](G),te:G(R?.quarterly_exam??"")},hps:{ww:e0(H?.[b(850)],10).map(G),pt:e0(H?.[b(879)],10).map(G),st:e0(B0?.[b(636)],5)[b(902)](G),te:G(H?.[b(515)]??"")},finalGrade:G(R?.[b(896)]??"")}}),c},[v,M,n0,d]),A0=m.useMemo(()=>h0(S),[S,h0]),L0=m[x(737)](()=>b0(S,u,O),[S,u,O,b0]),g0=m[x(737)](()=>[...$,...x0],[$,x0]),t0=m[x(737)](()=>{const t=x;return g0[t(799)](r=>z.has(r[t(568)]))},[g0,z]),r0=m[x(737)](()=>{const t=x;if(!q[t(819)]())return E;const r=q.toLowerCase();return E[t(799)](n=>n[t(752)].toLowerCase()[t(552)](r)||n[t(808)][t(495)]()[t(552)](r)||n[t(568)][t(552)](r))},[E,q]),m0=m[x(737)](()=>r0.filter(t=>(t.gender||"")[x(495)]()===x(581)),[r0]),f0=m[x(737)](()=>r0[x(799)](t=>(t[x(529)]||"")[x(495)]()===x(782)),[r0]),z0=()=>{const t=x;if(!S)return;const r=document.title,n=(S[t(752)]+"_"+S[t(808)])[t(591)](/[^a-z0-9]/gi,"_");document[t(575)]="LIR_"+n+"_"+d,window[t(751)](),setTimeout(()=>{const i=t;document[i(575)]=r},1e3)},w0=async()=>{const t=x;if(t0.length!==0){h(!0),C(10),K("Preparing LIR sheets for bulk printing...");try{await new Promise(i=>setTimeout(i,400));const r=document[t(573)](t(580)),n=r?Array[t(492)](r.querySelectorAll(t(786))):[];if(n.length===0){alert(t(769)),h(!1);return}C(50),K(t(586)+n[t(673)]+" learners..."),await ax({elements:n,paperSize:_,orientation:t(616),title:"Bulk_LIR_"+(D?.[t(590)]||t(685))+"_"+(O?.[t(612)]||t(714))}),C(100),K(t(706)),setTimeout(()=>{h(!1),U(!1)},600)}catch(r){console[t(827)]("Bulk print error:",r),alert(t(930)),h(!1)}}},N0=async()=>{const t=x;if(t0.length!==0){h(!0),C(5),K(t(681));try{await new Promise(R=>setTimeout(R,400));const r=document.getElementById(t(580)),n=r?Array[t(492)](r[t(680)](t(786))):[];if(n[t(673)]===0){alert("No sheets ready for PDF export."),h(!1);return}const i=(D?.section_name||N||t(685)).replace(/[^a-z0-9]/gi,"_"),c=(O?.[t(612)]||t(714))[t(591)](/[^a-z0-9]/gi,"_"),g=t(711)+i+"_"+c+"_"+d,b=await ex({elements:n,filename:g,paperSize:_,orientation:t(616),title:g,onProgressChange:R=>{const H=t;C(R),K(H(904)+R+H(828))}});b[t(861)]?(C(100),K(t(760)),setTimeout(()=>{h(!1),U(!1)},800)):(b[t(779)]||alert("Export failed: "+(b.error||"Unknown error")),h(!1))}catch(r){console[t(827)]("Bulk PDF download error:",r),alert(t(692)),h(!1)}}},y0=t=>{F(r=>{const n=V,i=new Set(r);return i.has(t)?i.delete(t):i[n(736)](t),i})},C0=()=>{const t=x;F(new Set(E[t(902)](r=>r[t(568)])))},O0=()=>{const t=x;F(new Set($[t(902)](r=>r[t(568)])))},D0=()=>{const t=x;F(new Set(x0[t(902)](r=>r[t(568)])))},M0=()=>{F(new Set)};return a[x(933)](x(664),{className:"lir-print-root flex flex-col h-full bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white",children:[a[x(933)](x(664),{className:x(674),children:[a.jsx(x(664),{className:x(562)}),a[x(933)](x(664),{className:x(663),children:[a[x(933)]("div",{className:x(913),children:[a[x(651)](x(577),{onClick:()=>o("school-forms"),className:x(640),title:x(744),children:a[x(651)](Y0,{className:x(625)})}),a[x(933)](x(664),{className:x(723),children:[a[x(651)]("h2",{className:x(900),children:x(683)}),a.jsx("p",{className:x(589),children:x(771)})]})]}),a[x(651)]("div",{className:x(520)}),a[x(933)](x(664),{className:x(533),children:[a[x(933)](x(660),{className:x(830),value:N,onChange:t=>{i0(t[x(877)].value),P(null),l("")},children:[a[x(651)](x(639),{value:"",children:x(720)}),Object[x(523)](R0)[x(902)](([t,r])=>r[x(673)]>0&&a[x(651)](x(501),{label:t,children:r[x(902)](n=>a[x(933)](x(639),{value:n[x(590)],children:[n[x(676)]," - ",n[x(590)]]},n.id))},t))]}),a.jsx(o0,{className:x(611)})]}),a[x(933)](x(664),{className:x(533),children:[a[x(933)](x(660),{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate",value:u,onChange:t=>{const r=x;l(t[r(877)][r(514)]),P(null)},disabled:!N,children:[a[x(651)](x(639),{value:"",children:x(874)}),E0[x(902)](t=>a[x(651)]("option",{value:t.id,children:t[x(612)]},t.id))]}),a[x(651)](o0,{className:x(611)})]}),a[x(933)](x(664),{className:x(533),children:[a.jsxs(x(660),{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200",value:S?.[x(568)]||"",onChange:t=>{const r=x,n=y[r(554)](i=>i[r(568)]===t.target[r(514)])||null;P(n)},disabled:!u,children:[a[x(651)](x(639),{value:"",children:x(804)}),$[x(673)]>0&&a[x(651)](x(501),{label:"MALE",children:$.map(t=>{const r=x,n=u&&(v.some(i=>i[r(594)]===t[r(568)]&&i.subject_id===u&&i.school_year===d)||M[r(724)](i=>i[r(594)]===t[r(568)]&&i.subject_id===u&&i.school_year===d));return a.jsxs("option",{value:t[r(568)],children:[t[r(752)],", ",t[r(808)]," ",n?"✓":""]},t.lrn)})}),x0[x(673)]>0&&a[x(651)]("optgroup",{label:x(857),children:x0[x(902)](t=>{const r=x,n=u&&(v[r(724)](i=>i[r(594)]===t[r(568)]&&i.subject_id===u&&i[r(875)]===d)||M[r(724)](i=>i[r(594)]===t[r(568)]&&i.subject_id===u&&i.school_year===d));return a[r(933)]("option",{value:t[r(568)],children:[t[r(752)],", ",t[r(808)]," ",n?"✓":""]},t[r(568)])})})]}),a.jsx(o0,{className:x(611)})]}),a[x(651)](x(664),{className:x(520)}),a[x(933)](x(664),{className:"relative group shrink-0",children:[a[x(933)]("select",{value:_,onChange:t=>Z(t[x(877)].value),className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200",title:x(534),children:[a.jsx(x(639),{value:"a4",children:"A4"}),a.jsx(x(639),{value:x(915),children:x(917)}),a[x(651)](x(639),{value:"folio",children:x(740)})]}),a[x(651)](o0,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),a[x(933)](x(664),{className:x(809),children:[a[x(933)]("div",{className:x(512),title:"Choose Fill Color",children:[a.jsx(x(664),{className:x(814),style:{backgroundColor:B,width:18,height:18}}),a[x(651)]("input",{type:x(848),value:B,onChange:t=>T(t[x(877)][x(514)]),className:x(583)})]}),a[x(933)](x(664),{className:x(512),title:"Choose Outline Color",children:[a[x(651)](x(664),{className:x(814),style:{backgroundColor:L,width:18,height:18}}),a[x(651)](x(798),{type:"color",value:L,onChange:t=>X(t.target[x(514)]),className:x(583)})]})]}),a[x(933)](x(664),{className:"flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0",children:[a[x(651)](x(577),{onClick:()=>J(t=>Math[x(910)](.4,t-.1)),className:x(614),title:x(671),children:a[x(651)](J0,{className:x(572)})}),a[x(933)](x(810),{className:"text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums",children:[Math[x(506)](Y*100),"%"]}),a[x(651)](x(577),{onClick:()=>J(t=>Math[x(908)](1.5,t+.1)),className:x(614),title:"Zoom In",children:a[x(651)](q0,{className:x(572)})})]}),a.jsxs(x(577),{onClick:I0,disabled:!N||!u||E[x(673)]===0,className:"ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(678),children:[a[x(651)](v0,{className:"w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform"}),x(738),z[x(726)],")"]}),a[x(933)](x(577),{onClick:N0,disabled:!N||!u||t0[x(673)]===0,className:x(684),title:x(852),children:[a.jsx(_0,{className:x(793)}),x(661)]}),a.jsxs("button",{onClick:w0,disabled:!N||!u||t0.length===0,className:x(655),title:"Bulk Print for selected learners",children:[a[x(651)](d0,{className:x(774)}),x(796)]}),a[x(933)](x(577),{onClick:z0,disabled:!S,className:x(513),title:x(696),children:[a[x(651)](d0,{className:x(578)}),x(644)]})]})]}),a[x(651)](x(664),{className:x(888),children:a[x(651)]("div",{className:x(605),children:S?a[x(651)](x(664),{className:"transition-all duration-700 ease-out origin-top print:scale-100",style:{transform:"scale("+Y+x(767),willChange:x(742),backfaceVisibility:x(826),WebkitBackfaceVisibility:x(826)},children:a[x(933)](x(664),{className:x(865),children:[a.jsx(x(664),{className:"absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000"}),a[x(651)](x(664),{className:x(638),children:a[x(651)](S0,{pageNumber:1,student:S,profile:A,schoolYear:d,subject:O?.subject_name||"",teacher:u0,fillColor:B,outlineColor:L,gradeData:L0,attendanceData:A0,paperSize:_})})]})}):a[x(933)](x(664),{className:x(564),children:[a.jsxs(x(664),{className:"relative group",children:[a[x(651)](x(664),{className:x(722)}),a[x(933)](x(664),{className:x(825),children:[a.jsx(V0,{className:"w-28 h-28 text-slate-100 dark:text-slate-600"}),a[x(933)](x(664),{className:x(757),children:[a.jsx("span",{className:x(620),children:x(524)}),a[x(651)](x(664),{className:"w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4"})]}),a[x(651)](x(664),{className:x(547),children:a[x(651)](d0,{className:x(766)})})]})]}),a[x(933)](x(664),{className:x(691),children:[a[x(651)]("h2",{className:x(781),children:x(597)}),a[x(651)]("p",{className:x(508),children:x(728)})]})]})})}),a.jsx(x(664),{id:x(580),className:x(864),style:{left:x(631)},children:t0[x(902)](t=>{const r=x,n=b0(t,u,O),i=h0(t);return a[r(651)](r(664),{className:r(881),children:a[r(651)](S0,{pageNumber:1,student:t,profile:A,schoolYear:d,subject:O?.subject_name||"",teacher:u0,fillColor:B,outlineColor:L,gradeData:n,attendanceData:i,paperSize:_})},t[r(568)])})}),Q&&a[x(651)](x(664),{className:x(741),children:a[x(933)]("div",{className:x(934),children:[a[x(933)](x(664),{className:x(791),children:[a[x(933)]("div",{className:x(599),children:[a[x(651)](x(664),{className:x(662),children:a[x(651)](v0,{className:x(504)})}),a[x(933)](x(664),{children:[a.jsx("h3",{className:x(694),children:x(903)}),a[x(933)]("p",{className:"text-[10px] text-slate-400 font-semibold uppercase tracking-widest",children:[D?.[x(676)],x(735),D?.[x(590)],x(670),O?.subject_name]})]})]}),a[x(651)](x(577),{onClick:()=>U(!1),className:x(569),children:a[x(651)](W0,{className:x(841)})})]}),a[x(933)](x(664),{className:x(705),children:[a.jsxs(x(664),{className:x(821),children:[a.jsx(X0,{className:x(527)}),a[x(651)](x(798),{type:x(926),placeholder:x(615),value:q,onChange:t=>s(t.target.value),className:x(824)})]}),a[x(933)](x(664),{className:x(860),children:[a.jsxs("button",{onClick:C0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[a[x(651)](p0,{className:"w-3 h-3 text-indigo-600"}),"All (",E[x(673)],")"]}),a[x(933)]("button",{onClick:O0,className:x(493),children:[x(906),$[x(673)],")"]}),a[x(933)](x(577),{onClick:D0,className:x(493),children:[x(743),x0[x(673)],")"]}),a[x(651)]("button",{onClick:M0,className:x(491),children:x(717)})]})]}),a[x(933)]("div",{className:x(553),children:[m0[x(673)]>0&&a[x(933)](x(664),{className:x(654),children:[a.jsx(x(664),{className:x(647),children:a[x(933)](x(810),{className:x(759),children:["Male Learners (",m0[x(673)],")"]})}),a[x(651)](x(664),{className:x(878),children:m0[x(902)](t=>{const r=x,n=z[r(690)](t.lrn),i=u&&(v.some(c=>c.student_lrn===t.lrn&&c.subject_id===u&&c[r(875)]===d)||M[r(724)](c=>c[r(594)]===t[r(568)]&&c[r(775)]===u&&c[r(875)]===d));return a[r(933)](r(664),{onClick:()=>y0(t[r(568)]),className:r(587)+r(n?628:925),children:[a[r(933)](r(664),{className:"flex items-center gap-2.5 min-w-0",children:[n?a.jsx(p0,{className:r(719)}):a[r(651)](j0,{className:"w-4 h-4 text-slate-300 shrink-0"}),a[r(933)](r(664),{className:r(629),children:[a[r(933)]("p",{className:"text-xs font-bold text-slate-800 truncate",children:[t[r(752)],", ",t[r(808)]," ",t[r(761)]?t[r(761)][0]+".":""]}),a[r(933)]("p",{className:r(914),children:["LRN: ",t[r(568)]]})]})]}),i&&a.jsx("span",{className:"px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0",children:r(511)})]},t.lrn)})})]}),f0[x(673)]>0&&a.jsxs("div",{className:x(654),children:[a.jsx(x(664),{className:x(647),children:a[x(933)]("span",{className:x(759),children:[x(559),f0[x(673)],")"]})}),a[x(651)](x(664),{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:f0[x(902)](t=>{const r=x,n=z[r(690)](t[r(568)]),i=u&&(v[r(724)](c=>c[r(594)]===t[r(568)]&&c.subject_id===u&&c.school_year===d)||M.some(c=>c[r(594)]===t.lrn&&c.subject_id===u&&c[r(875)]===d));return a[r(933)]("div",{onClick:()=>y0(t[r(568)]),className:r(587)+(n?"bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm":r(925)),children:[a[r(933)](r(664),{className:r(829),children:[n?a[r(651)](p0,{className:r(719)}):a[r(651)](j0,{className:r(837)}),a[r(933)](r(664),{className:r(629),children:[a[r(933)]("p",{className:r(548),children:[t.last_name,", ",t[r(808)]," ",t[r(761)]?t[r(761)][0]+".":""]}),a[r(933)]("p",{className:r(914),children:[r(770),t[r(568)]]})]})]}),i&&a[r(651)](r(810),{className:r(772),children:r(511)})]},t[r(568)])})})]}),r0.length===0&&a[x(933)](x(664),{className:x(901),children:['No learners found matching "',q,'".']})]}),a[x(933)](x(664),{className:x(613),children:[a[x(933)](x(664),{className:x(863),children:[a[x(651)](x(810),{className:x(487),children:z[x(726)]}),x(756),E[x(673)],x(921)]}),a[x(933)](x(664),{className:"flex items-center gap-2",children:[a[x(933)](x(577),{onClick:N0,disabled:z[x(726)]===0,className:x(918),children:[a[x(651)](_0,{className:x(789)}),"Download PDF"]}),a[x(933)](x(577),{onClick:w0,disabled:z.size===0,className:x(642),children:[a[x(651)](d0,{className:x(789)}),x(796)]})]})]})]})}),p&&a[x(651)](x(664),{className:x(693),children:a.jsxs("div",{className:x(886),children:[a[x(933)](x(664),{className:x(725),children:[a[x(651)](x(664),{className:"absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping"}),a[x(651)](x(664),{className:x(704),children:a[x(651)](Z0,{className:x(551)})})]}),a.jsxs(x(664),{className:x(654),children:[a.jsx("h3",{className:x(802),children:x(847)}),a[x(651)]("p",{className:x(507),children:T0})]}),a.jsxs(x(664),{className:"space-y-1.5",children:[a[x(651)](x(664),{className:x(530),children:a.jsx(x(664),{className:x(927),style:{width:Math.max(5,j)+"%"}})}),a[x(933)](x(664),{className:x(695),children:[a[x(651)](x(810),{children:x(732)}),a[x(933)](x(810),{children:[j,"%"]})]})]})]})}),a[x(651)]("style",{children:`
                @media print {
                    @page {
                        size: `+(_==="a4"?x(831):_===x(915)?x(686):x(713))+x(592)+(_==="a4"?x(596):"8.5in")+x(617)+x(_==="a4"?596:893)+x(516)+x(_==="a4"?596:893)+x(729)+(_==="a4"?x(626):_===x(915)?x(776):x(598))+` !important;
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
             `})]})}function c0(){const x=["FIRST","text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,"max-w-full max-h-full object-contain",'{}.constructor("return this")( )',"half-page-section border-t-4","w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform","297mm",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm","truncate","Start of Term 3","-9999px","Opening Block: Term 1","ELEMENTARY","localeCompare",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,"summative_tests","NOVEMBER","lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none","option","w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200","section_id","h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","useCallback","Print Single","1 X 1","half-page-section","flex items-center justify-between px-1","name","SUBJECT","End-of-Term Block","jsx",`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,"Term 1 Examination","space-y-2","h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","header-green py-1","School Year: ","Dec 7-18, 2026","SUMMATIVE TEST","select","Bulk PDF","w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400","flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden","div","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden","1x1 Learner Photo","3FVfdej","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","2ND"," | ","Zoom Out",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"length","z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full",`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `,"section_grade_level","Term 3: Summative Test #2","Filter / Select Learners","40px","querySelectorAll","Initializing vector PDF export pipeline...","MARCH","Learner Record","h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","Section","8.5in 11in","dates","px ",`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `,"has","space-y-4","Failed to generate PDF download.","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200","text-sm font-black uppercase tracking-wide text-white","flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider","Print single active learner","toUpperCase","thead","student-info-table border-2","card-container-combined print:m-0 print:shadow-none",`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,"__proto__","Sept 16, 2026","relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30","p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0","Bulk print stream launched successfully.","Term 2 Examination","inherit","1ST","Important Dates","LIR_","THIRD","8.5in 13in","Subject","DECEMBER","PHOTO","Clear","End of Term 2","w-4 h-4 text-indigo-600 shrink-0","Choose Section",`px;
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
                        background-color: `,"absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full","flex flex-col shrink-0","some","relative w-16 h-16 mx-auto flex items-center justify-center","size","header-subject-table border-collapse border-2","Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections.",` !important;
                        height: `,"LAST NAME","Sept 2-15, 2026","Export Pipeline","DepEd Logo","date-label uppercase"," - ","add","useMemo","Select (","important-dates-box","Folio","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200","transform","Females (","Back to Hub","exception",`px;
                        width: `,"photo_url","col-span-1 flex flex-col items-center justify-center pt-1","Mar 15-16, 2027","11dQEYRV","print","last_name",`; 
                        color: black !important; 
                        font-size: `,`rem; 
                        padding: `,"font-bold uppercase leading-none text-center"," of ","absolute inset-0 flex flex-col items-center justify-center","data-field font-extrabold border-2 whitespace-nowrap","text-[10px] font-black text-slate-500 uppercase tracking-widest","PDF download complete!","middle_name","quarter",`rem; 
                        min-height: `,"sort","w-full h-full object-cover","w-10 h-10 text-white",") translateZ(0)","Sept 1, 2026","No sheets ready for printing. Please try again.","LRN: ","Individual LIR","px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0","Term 2: Summative Test #2","w-3 h-3 group-hover:scale-110 transition-transform","subject_id","11in","attendance",`px; 
                        border-right: 1px solid `,"cancelled",`; 
                        padding: `,"text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase","female",`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,"data-field uppercase font-bold border-2 whitespace-nowrap","Oct 7, 2026",".lir-bulk-sheet",`px; 
                        font-weight: 700; 
                        font-size: `,"trace","w-3.5 h-3.5","BAGONG BARRIO NATIONAL HIGH SCHOOL","px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0","page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none","w-3 h-3 group-hover:-translate-y-0.5 transition-transform",`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `,"WRITTEN /ORAL WORKS (WWs)","Bulk Print","uid","input","filter","attendance-date-cell",`;
                        border: 1px solid `,"text-lg font-black text-slate-900 tracking-tight uppercase","TOTAL","Select Learner",`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `,"label-green py-1 border-2","forEach","first_name","flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5","span","toString",`rem; 
                        border-bottom: 2px solid `,"font-black uppercase italic","w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0","reduce","GRADE & SECTION","month-col uppercase","Aug 28, 2026","trim","none","relative flex-1 min-w-48","40%",`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `,"w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500","relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl","hidden","error","% complete...","flex items-center gap-2.5 min-w-0","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate","210mm 297mm","FINAL GRADE","56GTgDjs","font-normal ml-2","Learner's Individual Record Card","July 28, 2026","w-4 h-4 text-slate-300 shrink-0","prototype","grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","finalGrade","w-4 h-4",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid `,"src","4810304rcucjX","absences-header uppercase","#86efac","Processing LIR Records","color","PRODUCT/PERFORMANCE TASK (PPTs)","written_works","63737SHrpDq","Bulk Download PDF for selected learners","date-row","col-span-1","0px","important-dates-header uppercase italic","FEMALE","warn","LRN","flex items-center gap-1.5 flex-wrap","success","flex justify-between items-center w-full overflow-hidden","text-xs font-bold text-slate-600","fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block","relative group","flex items-stretch border-2 w-full overflow-hidden","label-green py-1 border-2 px-1","row-label py-1 px-1 border-2","fixed",`;
                        color: #000000 !important;
                        font-size: `,`px; 
                        font-size: `,"June 8-11, 2026","TEACHER","Select Subject","school_year","useState","target","grid grid-cols-1 sm:grid-cols-2 gap-2","performance_tasks","FIRST NAME","lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always","Jan 4, 2027",`px;
                        font-size: `,"font-bold leading-tight","Mar 22-23, 2027","bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6","label-green border-2 whitespace-nowrap","flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar","log","deped_logo_right.png",`rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,"folio","8.5in","signature-box bg-white","object-contain","final_grade","JANUARY","data-field uppercase font-bold border-2 whitespace-nowrap px-1","row-label","text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5","p-8 text-center text-slate-400 text-xs font-medium","map","Bulk LIR Operations","Processing LIR PDF pages: ","school-logo.png","Males (","Start of Term 2","min","table","max","1061960NCeQsv","rem","flex items-center gap-1.5 lg:gap-2 shrink-0","text-[9px] font-medium text-slate-400","letter",`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,"Letter","h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer",`rem;
                    }

                    .row-label {
                        background-color: `,"JULY"," learners selected","displayName","dates-header-bar uppercase","Term 3 Exam (Non-Grad)","bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50","text","h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300","font-extrabold uppercase whitespace-nowrap"," TERM","Failed to launch bulk print.","Term 3: Summative Test #1","10%","jsxs","bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]","Dec 18, 2026","text-indigo-600 font-black","APRIL",`rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `,"font-bold py-1","h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1","from","h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"toLowerCase","tfoot","-11px",`px; 
                        padding: `,"#22c55e","Jan 25, 2027","optgroup",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"666XYqOoC","w-5 h-5","style","round","text-xs font-semibold text-slate-500","text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60","12dDxbXt",`dd;
                        border: 1px solid `,"✓ Grades","relative flex items-center justify-center cursor-pointer shrink-0","h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","value","quarterly_exam",` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"Apr 6-7, 2027","isArray","date-val uppercase","h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0","2985005WRweOi","Term 2: Summative Test #1","entries","LIR","col",`;
                        padding: `,"w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400","TERM","gender","h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200","attendance-table mb-3",`; 
                        font-size: `,"relative group min-w-0 flex-1","Paper Size",`rem; 
                        font-weight: 700; 
                        height: `,`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"15%","return (function() ","bind","useEffect","Dec 3-4, 2026","scores","FEBRUARY","term-label","student_section","JUNIOR HIGH SCHOOL","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500","text-xs font-bold text-slate-800 truncate",`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `,"M.I","w-8 h-8 animate-spin","includes","flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4","find","colgroup","img",`;
                        border-radius: 8px;
                        height: `,`;
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"Female Learners (","32927256yStZQe",`rem;
                        width: `,"absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30",`px;
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
                        padding: `,"flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10","Daily Attendance","tbody","End of Term 3","lrn","w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors","font-bold","20%","w-3 h-3","getElementById",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"title",`px;
                        text-align: center;
                        height: `,"button","w-3 h-3 group-hover:translate-y-0.5 transition-transform","slice","lir-bulk-render-container","male","logo_url","w-full h-full opacity-0 absolute inset-0 cursor-pointer","info","month-col","Opening print stream for ","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ","push","text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none","section_name","replace",`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `,"console","student_lrn","header-row-fill","210mm","Individual Record","13in","flex items-center gap-3","flex items-center justify-center bg-white overflow-hidden","SECOND","173620vhNGqs","absent","Teacher's Signature","w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0","563666hCJFOw","EOSY Rites","OCTOBER","values","JUNE","w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors","subject_name","p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0","w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200","Filter learners by name or LRN...","portrait",` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `,"3RD"];return c0=function(){return x},c0()}export{dx as LIRPage};
