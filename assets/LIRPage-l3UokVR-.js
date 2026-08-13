import{j as a,r as b,cq as q0,bH as n0,cA as J0,c9 as W0,be as _0,bO as j0,cc as i0,cz as V0,bs as Z0,dq as K0,cB as f0,cC as S0,bE as X0}from"./vendor-DR8po6UM.js";import{b as Q0,u as $0,h as xx,n as ex}from"./index-C_rtYl1W.js";import{r as ax}from"./grading-helpers-CZ11l5jo.js";import{e as tx,p as rx}from"./pdf-export-Br3Cu8kW.js";import"./vendor-pdf-libs-PILnL0Ps.js";import"./vendor-firebase-BcIJiCPp.js";import"./vendor-framer-motion-BZcuIB9v.js";import"./terms-D1nQs9Y2.js";import"./grading-Dn6ZtCRn.js";const d0=e0;(function(x,k){const g=e0,y=x();for(;;)try{if(parseInt(g(761))/1+parseInt(g(851))/2+-parseInt(g(641))/3*(-parseInt(g(681))/4)+parseInt(g(627))/5+parseInt(g(510))/6+-parseInt(g(475))/7+parseInt(g(767))/8*(-parseInt(g(517))/9)===k)break;y.push(y.shift())}catch{y.push(y.shift())}})(o0,175385);const c0=(function(){let x=!0;return function(k,g){const y=x?function(){if(g){const j=g.apply(k,arguments);return g=null,j}}:function(){};return x=!1,y}})(),Y0=c0(void 0,function(){const x=e0;let k;try{k=Function('return (function() {}.constructor("return this")( ));')()}catch{k=window}const g=k.console=k.console||{},y=[x(892),x(741),"info",x(577),"exception",x(585),x(467)];for(let j=0;j<y[x(805)];j++){const M=c0[x(827)][x(881)][x(902)](c0),h=y[j],i=g[h]||M;M[x(604)]=c0.bind(c0),M[x(857)]=i[x(857)][x(902)](i),g[h]=M}});Y0();function e0(x,k){return x=x-467,o0()[x]}const T0=({pageNumber:x,student:k,profile:g,schoolYear:y,subject:j,teacher:M,fillColor:h=d0(507),outlineColor:i="#22c55e",gradeData:S,paperSize:D=d0(559),attendanceData:a0={}})=>{const e=d0,W="./",N=25,l0=l=>Array[e0(638)]({length:N},(o,_)=>l[_]??""),E=(l,f)=>{const o=e0,_=Number(f);if(!_)return!1;const C=l.toUpperCase();return C===o(856)&&_===12||C===o(556)&&(_===21||_===31)||C===o(661)&&(_===2||_===30)||C===o(732)&&_===8||C===o(777)&&_===1};let P="13in",p=e(599),s=1.12,Y=1.2,q=.8,B=.75,R=5,L=.8,V=40,v=240,Z=100,K=50,U=e(809);D==="a4"?(p=e(755),P="297mm",s=1.02,Y=.85,q=.55,B=.5,R=2,L=.65,V=26,v=140,Z=80,K=40):D==="letter"?(p="8.5in",P=e(853),s=.98,Y=.85,q=.55,B=.5,R=3,L=.7,V=28,v=160,Z=65,K=32,U=e(756)):D===e(559)&&(p=e(599),P="13in",s=.98,Y=.85,q=.55,B=.5,R=3,L=.7,V=28,v=160,Z=65,K=32,U=e(756));const z=(l,f)=>{const o=e,_=(l||"").trim();return _[o(805)]>32?f*.65:_[o(805)]>24?f*.78:_[o(805)]>16?f*.88:f},F=z(j,L*s),J=z(M,L*s);return a.jsx(e(717),{className:e(746),children:a.jsxs(e(717),{className:e(499),style:{width:p,height:P},children:[a[e(709)](e(487),{children:e(838)+p+" "+P+e(594)+i+`;
                        padding: `+8*s+e(711)+5*s+e(564)+h+e(528)+i+e(553)+3*s+e(625)+.85*s+`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `+h+e(871)+i+e(897)+.6*s+e(497)+i+e(747)+2*s+`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `+.8*s+e(754)+.6*s+e(849)+i+e(747)+1.5*s+e(632)+24*s+e(701)+h+e(476)+.6*s+e(757)+h+e(769)+.6*s+e(644)+70*s+e(502)+h+e(542)+i+e(509)+V*s+`px;
                        width: `+v*s+e(694)+h+e(885)+.9*s+e(763)+4*s+e(876)+i+e(655)+i+e(541)+i+`; 
                        text-align: center; 
                        font-size: `+.5*s+`rem; 
                        font-weight: 700; 
                        height: `+21*s+e(848)+1*s+`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `+h+e(573)+.5*s+e(744)+i+` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `+h+e(804)+.9*s+`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `+h+`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `+.45*s+`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `+.5*s+e(634)+i+e(900)+h+e(869)+3*s+e(800)+.85*s+e(538)+i+e(531)+i+e(865)+.45*s+e(504)+18*s+e(806)+95*s+e(526)+i+e(626)+1.5*s+e(609)+4*s+`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `+1.5*s+"px "+4*s+e(812)+.42*s+e(783)}),a[e(712)](e(717),{className:e(829),children:[a[e(712)](e(717),{className:e(842),children:[a[e(712)](e(717),{className:e(645),children:[a.jsxs(e(717),{className:e(823),children:[a[e(709)](e(717),{className:e(589),style:{width:64*s,height:64*s},children:a[e(709)](e(587),{src:g[e(776)]||W+e(679),alt:e(563),className:e(901),onError:l=>{const f=e;l[f(470)].src=W+f(679)}})}),a.jsxs(e(717),{children:[a[e(709)]("h1",{className:e(890),style:{fontSize:Y*s+e(540)},children:g.name||e(837)}),a.jsx("p",{className:e(489),style:{fontSize:q*s+e(540),color:i},children:"Learner's Individual Record Card"}),a[e(712)]("p",{className:e(521),style:{fontSize:B*s+e(540)},children:[e(831),a[e(709)](e(791),{className:e(723),children:y})]})]})]}),a[e(709)]("div",{className:"shrink-0 ml-auto",children:a[e(709)](e(585),{className:e(592),style:{borderColor:i},children:a[e(709)]("tbody",{children:a[e(712)]("tr",{children:[a[e(709)]("td",{className:e(811),style:{fontSize:L*s+e(540),padding:R*s+e(609)+R*2*s+"px",borderColor:i},children:e(734)}),a[e(709)]("td",{className:e(695),style:{fontSize:F+e(540),padding:R*s+e(609)+R*2.5*s+"px",borderColor:i},children:j}),a[e(709)]("td",{className:e(811),style:{fontSize:L*s+e(540),padding:R*s+e(609)+R*2*s+"px",borderColor:i},children:e(875)}),a[e(709)]("td",{className:e(695),style:{fontSize:J+"rem",padding:R*s+e(609)+R*2.5*s+"px",borderColor:i},children:M})]})})})})]}),a[e(712)](e(717),{className:e(844),children:[a[e(709)](e(717),{className:"border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden",style:{width:1*s+"in",height:1*s+"in",borderColor:i},children:k.photo_url?a[e(709)](e(587),{src:k[e(500)],alt:e(677),className:e(708)}):a.jsxs(e(791),{className:e(775),style:{fontSize:.7*s+e(540)},children:[e(705),a[e(709)]("br",{}),e(678)]})}),a.jsx("div",{className:e(884),children:a[e(709)](e(585),{className:e(702),style:{borderColor:i,height:1*s+"in"},children:a[e(712)]("tbody",{children:[a[e(712)]("tr",{style:{height:.5*s+"in"},children:[a[e(709)]("td",{className:e(788),style:{borderColor:i,height:.5*s+"in"},children:k.last_name}),a[e(709)]("td",{className:e(788),style:{borderColor:i,height:.5*s+"in"},children:k[e(730)]}),a[e(709)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap px-1",style:{width:e(697),borderColor:i,height:.5*s+"in"},children:k[e(524)]?.[e(636)](0)||""}),a.jsx("td",{className:e(788),style:{borderColor:i,height:.5*s+"in"},children:k[e(785)]}),a[e(709)]("td",{className:e(788),style:{borderColor:i,height:.5*s+"in"},children:k[e(784)]})]}),a[e(712)]("tr",{style:{height:.5*s+"in"},children:[a[e(709)]("td",{className:e(549),style:{borderColor:i,height:.5*s+"in"},children:e(667)}),a.jsx("td",{className:e(549),style:{borderColor:i,height:.5*s+"in"},children:e(629)}),a[e(709)]("td",{className:e(818),style:{width:e(697),borderColor:i,height:.5*s+"in"},children:e(471)}),a.jsx("td",{className:e(549),style:{borderColor:i,height:.5*s+"in"},children:"GRADE & SECTION"}),a.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:i,height:.5*s+"in"},children:e(668)})]})]})})})]}),a[e(712)](e(717),{className:e(752),children:[a.jsxs("div",{children:[a.jsx("div",{className:e(647),style:{fontSize:.75*s+e(540)},children:e(826)}),a[e(709)](e(585),{style:{tableLayout:"fixed"},children:a[e(712)](e(508),{children:[a.jsxs("tr",{className:e(610),children:[a[e(709)]("td",{className:"term-label",style:{width:e(832)},children:e(866)}),[1,2,3,4,5][e(578)](l=>a.jsx("td",{style:{width:e(570)},children:l},l)),a.jsx("td",{className:"font-bold",style:{width:"20%"},children:"TOTAL"})]}),[1,2,3].map(l=>a[e(712)]("tr",{children:[a[e(709)]("td",{className:"row-label",children:l===1?e(665):l===2?e(574):"THIRD"}),[...Array(5)][e(578)]((f,o)=>a[e(709)]("td",{children:S?.[l]?.scores.ww[o]??""},o)),a.jsx("td",{className:e(521),children:S?.[l]?.[e(905)].ww[e(545)](0,5).reduce((f,o)=>f+(Number(o)||0),0)||""})]},l))]})})]}),a.jsxs(e(717),{children:[a[e(709)]("div",{className:e(647),style:{fontSize:.75*s+e(540)},children:e(690)}),a[e(709)](e(585),{style:{tableLayout:e(648)},children:a.jsxs(e(508),{children:[a[e(712)]("tr",{className:e(610),children:[a.jsx("td",{className:e(511),style:{width:e(652)},children:e(866)}),[1,2,3].map(l=>a[e(709)]("td",{style:{width:e(652)},children:l},l)),a[e(709)]("td",{className:e(521),style:{width:e(652)},children:e(813)})]}),[1,2,3][e(578)](l=>a[e(712)]("tr",{children:[a.jsx("td",{className:e(765),children:e(l===1?665:l===2?574:534)}),[...Array(3)][e(578)]((f,o)=>a[e(709)]("td",{children:S?.[l]?.[e(905)].pt[o]??""},o)),a[e(709)]("td",{className:"font-bold",children:S?.[l]?.[e(905)].pt[e(545)](0,3)[e(602)]((f,o)=>f+(Number(o)||0),0)||""})]},l))]})})]})]}),a[e(712)](e(717),{className:"grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden",children:[a[e(712)]("div",{className:e(716),children:[a[e(709)](e(717),{className:e(647),style:{fontSize:.7*s+e(540)},children:e(572)}),a[e(709)]("table",{style:{tableLayout:"fixed"},children:a[e(712)]("tbody",{children:[a[e(712)]("tr",{className:e(610),children:[a[e(709)]("td",{className:e(511),style:{width:"40%"},children:e(866)}),[1,2][e(578)](l=>a[e(709)]("td",{children:l},l))]}),[1,2,3][e(578)](l=>a[e(712)]("tr",{children:[a[e(709)]("td",{className:e(765),children:l===1?"FIRST":l===2?"SECOND":e(534)}),[...Array(2)][e(578)]((f,o)=>a.jsx("td",{children:S?.[l]?.[e(905)].st[o]??""},o))]},l))]})})]}),a[e(709)](e(717),{className:"col-span-1",children:a[e(712)](e(585),{style:{tableLayout:e(648)},children:[a.jsx(e(835),{children:a.jsx("tr",{className:e(610),children:a.jsx("td",{colSpan:2,className:"font-bold py-1",style:{fontSize:.7*s+e(540)},children:"TERM EXAM"})})}),a[e(709)](e(508),{children:[1,2,3][e(578)](l=>a.jsxs("tr",{children:[a.jsxs("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:i},children:[l===1?e(643):l===2?"2ND":e(764),e(579)]}),a[e(709)]("td",{className:e(521),children:S?.[l]?.[e(905)].te||""})]},l))})]})}),a.jsx(e(717),{className:e(716),children:a.jsxs(e(585),{style:{tableLayout:e(648)},children:[a.jsx("thead",{children:a.jsx("tr",{className:"header-row-fill",children:a[e(709)]("td",{colSpan:2,className:e(758),style:{fontSize:.7*s+e(540)},children:e(527)})})}),a.jsx(e(508),{children:[1,2,3].map(l=>a[e(712)]("tr",{children:[a[e(712)]("td",{className:e(710),style:{borderColor:i},children:[l===1?e(643):l===2?e(656):"3RD",e(579)]}),a[e(709)]("td",{className:e(521),children:S?.[l]?.[e(864)]||""})]},l))}),a.jsx(e(898),{children:a[e(709)]("tr",{style:{height:1.5*s+"px"},children:a.jsx("td",{colSpan:2,style:{border:e(833)}})})})]})}),a.jsxs(e(717),{className:"col-span-1 flex flex-col items-center justify-center pt-1",style:{marginTop:U},children:[a.jsx("div",{className:e(562),children:a[e(709)](e(587),{src:W+e(680),alt:e(793),className:e(529),style:{width:Z*s,height:K*s}})}),a[e(709)](e(717),{className:"signature-box bg-white"}),a.jsx("p",{className:"font-bold uppercase leading-none text-center",style:{fontSize:.6*s+e(540),marginTop:14*s+"px"},children:"Teacher's Signature"})]})]})]}),a[e(712)]("div",{className:"half-page-section border-t-4",style:{borderColor:i},children:[a[e(709)](e(717),{className:e(618),children:e(557)}),a.jsxs(e(585),{className:"attendance-table mb-3",children:[a.jsxs("colgroup",{children:[a[e(709)](e(891),{style:{width:e(778)}}),Array[e(638)]({length:N})[e(578)]((l,f)=>a[e(709)]("col",{style:{width:"3.32%"}},f)),a[e(709)](e(891),{style:{width:"7%"}})]}),a.jsx(e(835),{children:a[e(712)]("tr",{children:[a.jsx("th",{className:"month-col uppercase",children:e(567)}),a[e(709)]("th",{colSpan:N,className:e(630),children:e(728)}),a[e(709)]("th",{className:"absences-header uppercase",children:e(595)})]})}),a[e(709)]("tbody",{children:[{name:e(856),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:e(543),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:e(556),dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:e(663),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:e(718),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:e(661),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:e(732),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:e(777),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:"FEBRUARY",dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:e(483),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:"APRIL",dates:[1,2,5,6,7,8]}].map(l=>a[e(712)]("tr",{children:[a[e(709)]("td",{className:e(733),children:l[e(554)]}),l0(l[e(743)])[e(578)]((f,o)=>a[e(709)]("td",{className:"attendance-date-cell",style:{color:E(l[e(554)],f)?e(779):e(583)},children:f},o)),a[e(709)]("td",{className:e(521),children:a0[l[e(554)]]||""})]},l.name))})]}),a.jsxs(e(717),{className:e(628),style:{borderColor:i},children:[a.jsxs(e(717),{className:e(477),children:[a[e(709)](e(717),{className:e(660),children:e(886)}),[[e(624),"Opening Block: Term 1"],[e(700),e(597)],[e(606),e(808)],[e(704),e(834)],[e(617),"Term 1 Examination"],[e(903),e(596)],[e(880),e(684)]][e(578)](([l,f])=>a[e(712)](e(717),{className:e(889),children:[a[e(709)](e(717),{className:e(491),children:l}),a[e(709)](e(717),{className:e(537),children:f})]},l))]}),a.jsxs(e(717),{className:e(477),children:[a[e(709)](e(717),{className:e(660),children:"Important Dates"}),[["Oct 7, 2026",e(593)],["Oct 29, 2026",e(555)],[e(780),"Term 2 Examination"],[e(821),e(596)],["Dec 18, 2026",e(801)],[e(802),e(544)],[e(506),"Term 3: Summative Test #1"]][e(578)](([l,f])=>a[e(712)]("div",{className:e(889),children:[a[e(709)](e(717),{className:e(491),children:l}),a.jsx("div",{className:e(537),children:f})]},l))]}),a[e(712)](e(717),{className:"important-dates-box",children:[a[e(709)]("div",{className:e(660),children:"Important Dates"}),[[e(651),e(552)],[e(725),e(639)],[e(530),e(642)],["Mar 24-31, 2027",e(596)],[e(803),e(596)],[e(598),e(584)],[e(468),e(698)]].map(([l,f])=>a[e(712)](e(717),{className:e(889),children:[a[e(709)]("div",{className:e(491),children:l}),a.jsx(e(717),{className:"date-label uppercase",children:f})]},l))]})]})]})]})]})})};function px(){const x=d0,{students:k,sections:g,subjects:y,teachers:j,schoolProfile:M,activeSchoolYear:h,setCurrentView:i,classRecords:S,gradingSheetRecords:D,hpsRecords:a0,sf2Sheets:e}=Q0(),{user:W}=$0(),[N,l0]=b[x(493)](""),[E,P]=b[x(493)](null),[p,s]=b[x(493)](""),[Y,q]=b[x(493)](1),[B,R]=b[x(493)]("#86efac"),[L,V]=b.useState(x(868)),[v,Z]=b[x(493)]("folio"),[K,U]=b.useState(!1),[z,F]=b[x(493)](new Set),[J,l]=b.useState(""),[f,o]=b[x(493)](!1),[_,C]=b[x(493)](0),[E0,X]=b[x(493)](""),T=b[x(768)](()=>{const t=x;return g[t(707)](r=>r[t(861)]===N||r.id===N)},[g,N]),O=b[x(768)](()=>{const t=x;return y[t(707)](r=>r.id===p||r[t(899)]===p)},[y,p]),R0=b[x(768)](()=>{const t=x;if(!T)return[];const r=xx(W,T,y),c=new Set;return r[t(687)](n=>{const d=t,u=ex(n[d(899)]);return c[d(751)](u)?!1:(c[d(739)](u),!0)})},[T,y,W]),u0=b[x(768)](()=>{const t=x;if(O?.teacher_id){const r=j.find(c=>c[t(607)]===O[t(631)]||c.id===O[t(631)]);if(r)return r[t(666)]||r[t(554)]}return T?.[t(614)]||""},[O,j,T]),t0=b[x(768)](()=>{const t=x;return[...g][t(676)]((r,c)=>{const n=t,d=(r[n(846)]||"")[n(571)](c.section_grade_level||"",void 0,{numeric:!0});return d!==0?d:(r[n(861)]||"")[n(571)](c[n(861)]||"")})},[g]),I0=b.useMemo(()=>{const t=x,r={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return t0[t(795)](c=>{const n=t,d=(c[n(846)]||"").toLowerCase(),u=parseInt(d[n(613)](/\D/g,""))||0;d[n(539)]("kinder")||u>=1&&u<=6?r.ELEMENTARY.push(c):u>=7&&u<=10?r[n(505)][n(533)](c):u>=11&&u<=12&&r[n(566)][n(533)](c)}),r},[t0]);b[x(740)](()=>{const t=x;if(!N&&t0[t(805)]===1){const r=setTimeout(()=>{const c=t;l0(t0[0][c(861)])},0);return()=>clearTimeout(r)}},[t0,N]),b[x(740)](()=>{const t=setTimeout(()=>{s(""),P(null),F(new Set)},0);return()=>clearTimeout(t)},[N]);const I=b[x(768)](()=>{const t=x;if(!N)return[];const r=g[t(707)](c=>c[t(861)]===N||c.id===N)?.id;return k.filter(c=>c[t(785)]===N||r&&c[t(785)]===r)},[k,N,g]),Q=b[x(768)](()=>I[x(687)](t=>(t[x(581)]||"")[x(722)]()==="male")[x(676)]((t,r)=>(t[x(843)]+", "+t[x(730)])[x(571)](r.last_name+", "+r[x(730)])),[I]),$=b[x(768)](()=>I[x(687)](t=>(t[x(581)]||"")[x(722)]()!==x(482)).sort((t,r)=>(t[x(843)]+", "+t[x(730)])[x(571)](r.last_name+", "+r[x(730)])),[I]),A0=()=>{const t=x;z[t(699)]===0&&I[t(805)]>0&&F(new Set(I[t(578)](r=>r.lrn))),U(!0)},h0=b[x(649)](t=>{const r=x;if(!t)return{};const c={};return e[r(687)](d=>d[r(854)]===h&&(d[r(774)]===T?.id||d.section_id===N)).forEach(d=>{const u=r,m=d[u(729)]?.[t[u(784)]];if(m){const A=Object[u(657)](m)[u(687)](H=>H?.[u(722)]()===u(815))[u(805)];A>0&&(c[d[u(515)][u(685)]()]=A)}}),c},[e,h,T,N]),m0=b.useCallback((t,r,c)=>{const n=x;if(!t||!r)return;const d={};return[1,2,3][n(795)](u=>{const m=n,A=S.find(w=>w[m(633)]===t.lrn&&w[m(854)]===h&&Number(w.quarter)===u&&(w.subject_id===c?.id||w[m(820)]===r))||D.find(w=>w[m(633)]===t[m(784)]&&w[m(854)]===h&&Number(w.quarter)===u&&(w[m(820)]===c?.id||w[m(820)]===r)),H=a0[m(707)](w=>(w[m(820)]===c?.id||w[m(820)]===r)&&w[m(854)]===h&&Number(w[m(799)])===u),x0=(w,H0)=>{const v0=m,G0=Array[v0(569)](w)?w:[];return Array[v0(638)]({length:H0},(sx,U0)=>G0[U0]??"")},B0=A,F0=H,G=w=>w===""||w===null||w===void 0?"":w,y0=ax(t[m(784)],c?.id||p,u,h,S,D,a0,T?.[m(846)],T?.[m(689)]);d[u]={scores:{ww:x0(A?.[m(473)],10)[m(578)](G),pt:x0(A?.[m(736)],10).map(G),st:x0(B0?.[m(551)],5).map(G),te:G(A?.quarterly_exam??"")},hps:{ww:x0(H?.[m(473)],10)[m(578)](G),pt:x0(H?.[m(736)],10)[m(578)](G),st:x0(F0?.[m(551)],5).map(G),te:G(H?.quarterly_exam??"")},finalGrade:y0>0?y0:G(A?.final_grade??"")}}),d},[S,D,a0,h,T?.[x(846)],T?.track,p]),L0=b.useMemo(()=>h0(E),[E,h0]),z0=b.useMemo(()=>m0(E,p,O),[E,p,O,m0]),g0=b[x(768)](()=>[...Q,...$],[Q,$]),r0=b[x(768)](()=>{const t=x;return g0.filter(r=>z.has(r[t(784)]))},[g0,z]),s0=b[x(768)](()=>{const t=x;if(!J.trim())return I;const r=J[t(722)]();return I[t(687)](c=>c[t(843)][t(722)]()[t(539)](r)||c[t(730)][t(722)]()[t(539)](r)||c[t(784)][t(539)](r))},[I,J]),b0=b[x(768)](()=>s0[x(687)](t=>(t[x(581)]||"").toLowerCase()===x(482)),[s0]),p0=b[x(768)](()=>s0[x(687)](t=>(t.gender||"").toLowerCase()===x(796)),[s0]),C0=()=>{const t=x;if(!E)return;const r=document[t(674)],c=(E[t(843)]+"_"+E[t(730)]).replace(/[^a-z0-9]/gi,"_");document.title=t(863)+c+"_"+h,window.print(),setTimeout(()=>{const n=t;document[n(674)]=r},1e3)},w0=async()=>{const t=x;if(r0.length!==0){o(!0),C(10),X(t(501));try{await new Promise(n=>setTimeout(n,400));const r=document[t(794)](t(839)),c=r?Array.from(r.querySelectorAll(t(867))):[];if(c.length===0){alert(t(486)),o(!1);return}C(50),X(t(490)+c[t(805)]+" learners..."),await rx({elements:c,paperSize:v,orientation:t(822),title:t(887)+(T?.[t(861)]||t(807))+"_"+(O?.[t(899)]||t(485))}),C(100),X(t(576)),setTimeout(()=>{o(!1),U(!1)},600)}catch(r){console[t(577)](t(714),r),alert("Failed to launch bulk print."),o(!1)}}},N0=async()=>{const t=x;if(r0[t(805)]!==0){o(!0),C(5),X("Initializing vector PDF export pipeline...");try{await new Promise(A=>setTimeout(A,400));const r=document[t(794)](t(839)),c=r?Array[t(638)](r[t(789)](t(867))):[];if(c[t(805)]===0){alert(t(523)),o(!1);return}const n=(T?.[t(861)]||N||t(807)).replace(/[^a-z0-9]/gi,"_"),d=(O?.[t(899)]||t(485)).replace(/[^a-z0-9]/gi,"_"),u=t(863)+n+"_"+d+"_"+h,m=await tx({elements:c,filename:u,paperSize:v,orientation:t(822),title:u,onProgressChange:A=>{const H=t;C(A),X(H(735)+A+H(879))}});m[t(772)]?(C(100),X("PDF download complete!"),setTimeout(()=>{o(!1),U(!1)},800)):(m.cancelled||alert(t(762)+(m[t(577)]||t(654))),o(!1))}catch(r){console[t(577)](t(830),r),alert(t(496)),o(!1)}}},k0=t=>{F(r=>{const c=e0,n=new Set(r);return n[c(751)](t)?n[c(622)](t):n[c(739)](t),n})},O0=()=>{const t=x;F(new Set(I[t(578)](r=>r[t(784)])))},D0=()=>{const t=x;F(new Set(Q[t(578)](r=>r.lrn)))},M0=()=>{const t=x;F(new Set($[t(578)](r=>r.lrn)))},P0=()=>{F(new Set)};return a[x(712)](x(717),{className:"lir-print-root flex flex-col h-full bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white",children:[a[x(712)](x(717),{className:"z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full",children:[a.jsx(x(717),{className:x(882)}),a.jsxs(x(717),{className:x(686),children:[a[x(712)](x(717),{className:x(836),children:[a[x(709)](x(469),{onClick:()=>i("school-forms"),className:x(750),title:x(872),children:a[x(709)](q0,{className:"w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"})}),a.jsxs(x(717),{className:x(688),children:[a[x(709)]("h2",{className:x(682),children:x(852)}),a[x(709)]("p",{className:x(612),children:x(546)})]})]}),a.jsx(x(717),{className:x(724)}),a[x(712)](x(717),{className:"relative group min-w-0 flex-1",children:[a[x(712)](x(512),{className:x(855),value:N,onChange:t=>{const r=x;l0(t[r(470)][r(810)]),P(null),s("")},children:[a[x(709)](x(588),{value:"",children:"Choose Section"}),Object[x(601)](I0)[x(578)](([t,r])=>r[x(805)]>0&&a[x(709)](x(817),{label:t,children:r[x(578)](c=>a.jsxs(x(588),{value:c[x(861)],children:[c[x(846)]," - ",c[x(861)]]},c.id))},t))]}),a[x(709)](n0,{className:x(575)})]}),a[x(712)](x(717),{className:"relative group min-w-0 flex-1",children:[a[x(712)](x(512),{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate",value:p,onChange:t=>{const r=x;s(t.target[r(810)]),P(null)},disabled:!N,children:[a[x(709)](x(588),{value:"",children:x(516)}),R0[x(578)](t=>a[x(709)](x(588),{value:t.id,children:t[x(899)]},t.id))]}),a[x(709)](n0,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),a[x(712)]("div",{className:x(819),children:[a.jsxs(x(512),{className:x(860),value:E?.[x(784)]||"",onChange:t=>{const r=x,c=k[r(707)](n=>n[r(784)]===t.target[r(810)])||null;P(c)},disabled:!p,children:[a[x(709)]("option",{value:"",children:"Select Learner"}),Q[x(805)]>0&&a[x(709)](x(817),{label:x(790),children:Q.map(t=>{const r=x,c=p&&(S[r(877)](n=>n[r(633)]===t[r(784)]&&n.subject_id===p&&n[r(854)]===h)||D[r(877)](n=>n.student_lrn===t[r(784)]&&n[r(820)]===p&&n[r(854)]===h));return a.jsxs(r(588),{value:t.lrn,children:[t[r(843)],", ",t.first_name," ",c?"✓":""]},t.lrn)})}),$.length>0&&a.jsx("optgroup",{label:x(640),children:$.map(t=>{const r=x,c=p&&(S.some(n=>n[r(633)]===t[r(784)]&&n.subject_id===p&&n[r(854)]===h)||D[r(877)](n=>n.student_lrn===t[r(784)]&&n[r(820)]===p&&n[r(854)]===h));return a[r(712)]("option",{value:t[r(784)],children:[t.last_name,", ",t[r(730)]," ",c?"✓":""]},t[r(784)])})})]}),a[x(709)](n0,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),a[x(709)](x(717),{className:x(724)}),a[x(712)](x(717),{className:x(650),children:[a[x(712)]("select",{value:v,onChange:t=>Z(t.target[x(810)]),className:x(498),title:x(828),children:[a[x(709)](x(588),{value:"a4",children:"A4"}),a[x(709)](x(588),{value:"letter",children:x(888)}),a.jsx(x(588),{value:x(559),children:x(787)})]}),a[x(709)](n0,{className:x(575)})]}),a[x(712)]("div",{className:x(519),children:[a[x(712)](x(717),{className:x(662),title:x(550),children:[a.jsx(x(717),{className:x(522),style:{backgroundColor:B,width:18,height:18}}),a[x(709)](x(495),{type:x(474),value:B,onChange:t=>R(t[x(470)][x(810)]),className:x(586)})]}),a.jsxs(x(717),{className:x(662),title:x(616),children:[a.jsx(x(717),{className:x(522),style:{backgroundColor:L,width:18,height:18}}),a[x(709)](x(495),{type:"color",value:L,onChange:t=>V(t[x(470)][x(810)]),className:x(586)})]})]}),a[x(712)](x(717),{className:x(503),children:[a[x(709)](x(469),{onClick:()=>q(t=>Math.max(.4,t-.1)),className:x(798),title:x(658),children:a.jsx(J0,{className:x(893)})}),a[x(712)](x(791),{className:x(611),children:[Math.round(Y*100),"%"]}),a[x(709)](x(469),{onClick:()=>q(t=>Math[x(494)](1.5,t+.1)),className:"w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200",title:x(691),children:a[x(709)](W0,{className:x(893)})})]}),a.jsxs("button",{onClick:A0,disabled:!N||!p||I[x(805)]===0,className:"ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:"Filter / Select Learners",children:[a.jsx(_0,{className:"w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform"}),"Select (",z[x(699)],")"]}),a[x(712)](x(469),{onClick:N0,disabled:!N||!p||r0.length===0,className:x(824),title:x(560),children:[a[x(709)](j0,{className:x(619)}),x(591)]}),a[x(712)](x(469),{onClick:w0,disabled:!N||!p||r0.length===0,className:x(603),title:"Bulk Print for selected learners",children:[a[x(709)](i0,{className:x(561)}),x(480)]}),a.jsxs(x(469),{onClick:C0,disabled:!E,className:x(659),title:x(671),children:[a.jsx(i0,{className:x(759)}),x(637)]})]})]}),a[x(709)](x(717),{className:"flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar",children:a[x(709)](x(717),{className:"w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0",children:E?a.jsx(x(717),{className:x(683),style:{transform:x(479)+Y+") translateZ(0)",willChange:x(568),backfaceVisibility:x(621),WebkitBackfaceVisibility:x(621)},children:a[x(712)](x(717),{className:x(481),children:[a[x(709)](x(717),{className:x(646)}),a[x(709)](x(717),{className:"lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none",children:a.jsx(T0,{pageNumber:1,student:E,profile:M,schoolYear:h,subject:O?.[x(899)]||"",teacher:u0,fillColor:B,outlineColor:L,gradeData:z0,attendanceData:L0,paperSize:v})})]})}):a.jsxs(x(717),{className:x(664),children:[a.jsxs(x(717),{className:x(481),children:[a[x(709)](x(717),{className:x(472)}),a[x(712)](x(717),{className:x(670),children:[a[x(709)](V0,{className:x(715)}),a.jsxs(x(717),{className:x(841),children:[a[x(709)](x(791),{className:x(590),children:x(814)}),a.jsx(x(717),{className:x(635)})]}),a[x(709)](x(717),{className:x(669),children:a[x(709)](i0,{className:x(532)})})]})]}),a[x(712)](x(717),{className:x(673),children:[a[x(709)]("h2",{className:x(781),children:"Individual Record"}),a[x(709)]("p",{className:x(565),children:x(737)})]})]})})}),a[x(709)](x(717),{id:"lir-bulk-render-container",className:x(600),style:{left:x(792)},children:r0[x(578)](t=>{const r=x,c=m0(t,p,O),n=h0(t);return a[r(709)]("div",{className:r(859),children:a[r(709)](T0,{pageNumber:1,student:t,profile:M,schoolYear:h,subject:O?.[r(899)]||"",teacher:u0,fillColor:B,outlineColor:L,gradeData:c,attendanceData:n,paperSize:v})},t[r(784)])})}),K&&a.jsx(x(717),{className:x(605),children:a[x(712)](x(717),{className:x(488),children:[a[x(712)](x(717),{className:x(753),children:[a[x(712)](x(717),{className:"flex items-center gap-3",children:[a[x(709)]("div",{className:x(840),children:a.jsx(_0,{className:"w-5 h-5"})}),a[x(712)](x(717),{children:[a.jsx("h3",{className:"text-sm font-black uppercase tracking-wide text-white",children:x(520)}),a[x(712)]("p",{className:x(745),children:[T?.section_grade_level,x(883),T?.[x(861)],x(653),O?.[x(899)]]})]})]}),a[x(709)](x(469),{onClick:()=>U(!1),className:"w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors",children:a[x(709)](Z0,{className:x(825)})})]}),a[x(712)](x(717),{className:x(513),children:[a.jsxs(x(717),{className:x(904),children:[a[x(709)](K0,{className:x(620)}),a[x(709)](x(495),{type:x(582),placeholder:x(738),value:J,onChange:t=>l(t[x(470)][x(810)]),className:x(693)})]}),a[x(712)]("div",{className:x(536),children:[a[x(712)](x(469),{onClick:O0,className:x(770),children:[a[x(709)](f0,{className:x(675)}),"All (",I[x(805)],")"]}),a.jsxs(x(469),{onClick:D0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[x(615),Q[x(805)],")"]}),a[x(712)](x(469),{onClick:M0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[x(873),$.length,")"]}),a[x(709)]("button",{onClick:P0,className:x(797),children:x(558)})]})]}),a.jsxs("div",{className:x(706),children:[b0[x(805)]>0&&a[x(712)]("div",{className:x(742),children:[a[x(709)](x(717),{className:"flex items-center justify-between px-1",children:a[x(712)]("span",{className:x(703),children:["Male Learners (",b0[x(805)],")"]})}),a.jsx(x(717),{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:b0[x(578)](t=>{const r=x,c=z.has(t[r(784)]),n=p&&(S[r(877)](d=>d[r(633)]===t[r(784)]&&d[r(820)]===p&&d[r(854)]===h)||D[r(877)](d=>d[r(633)]===t[r(784)]&&d[r(820)]===p&&d[r(854)]===h));return a[r(712)](r(717),{onClick:()=>k0(t[r(784)]),className:r(720)+r(c?771:719),children:[a.jsxs(r(717),{className:r(878),children:[c?a[r(709)](f0,{className:r(858)}):a[r(709)](S0,{className:r(726)}),a[r(712)](r(717),{className:"truncate",children:[a[r(712)]("p",{className:r(608),children:[t[r(843)],", ",t.first_name," ",t[r(524)]?t.middle_name[0]+".":""]}),a[r(712)]("p",{className:r(874),children:[r(786),t[r(784)]]})]})]}),n&&a[r(709)](r(791),{className:r(696),children:r(850)})]},t.lrn)})})]}),p0.length>0&&a[x(712)]("div",{className:"space-y-2",children:[a[x(709)](x(717),{className:x(492),children:a[x(712)]("span",{className:x(703),children:["Female Learners (",p0[x(805)],")"]})}),a[x(709)](x(717),{className:x(484),children:p0.map(t=>{const r=x,c=z.has(t.lrn),n=p&&(S[r(877)](d=>d[r(633)]===t[r(784)]&&d.subject_id===p&&d[r(854)]===h)||D[r(877)](d=>d[r(633)]===t.lrn&&d[r(820)]===p&&d[r(854)]===h));return a[r(712)]("div",{onClick:()=>k0(t.lrn),className:"p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 "+(c?"bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm":r(719)),children:[a.jsxs(r(717),{className:r(878),children:[c?a[r(709)](f0,{className:r(858)}):a[r(709)](S0,{className:r(726)}),a[r(712)](r(717),{className:r(721),children:[a.jsxs("p",{className:r(608),children:[t[r(843)],", ",t[r(730)]," ",t[r(524)]?t[r(524)][0]+".":""]}),a.jsxs("p",{className:r(874),children:["LRN: ",t[r(784)]]})]})]}),n&&a.jsx(r(791),{className:"px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0",children:r(850)})]},t[r(784)])})})]}),s0.length===0&&a.jsxs(x(717),{className:x(862),children:[x(580),J,'".']})]}),a[x(712)](x(717),{className:x(896),children:[a[x(712)]("div",{className:"text-xs font-bold text-slate-600",children:[a[x(709)](x(791),{className:"text-indigo-600 font-black",children:z[x(699)]}),x(548),I[x(805)],x(748)]}),a.jsxs(x(717),{className:x(727),children:[a[x(712)](x(469),{onClick:N0,disabled:z[x(699)]===0,className:x(672),children:[a.jsx(j0,{className:"w-3.5 h-3.5"}),x(773)]}),a.jsxs(x(469),{onClick:w0,disabled:z[x(699)]===0,className:"h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer",children:[a[x(709)](i0,{className:x(478)}),"Bulk Print"]})]})]})]})}),f&&a[x(709)]("div",{className:x(547),children:a[x(712)](x(717),{className:"bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6",children:[a.jsxs(x(717),{className:x(525),children:[a[x(709)](x(717),{className:"absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping"}),a[x(709)](x(717),{className:x(894),children:a[x(709)](X0,{className:"w-8 h-8 animate-spin"})})]}),a[x(712)](x(717),{className:x(742),children:[a[x(709)]("h3",{className:x(514),children:"Processing LIR Records"}),a.jsx("p",{className:"text-xs font-semibold text-slate-500",children:E0})]}),a[x(712)](x(717),{className:x(760),children:[a.jsx(x(717),{className:x(713),children:a[x(709)](x(717),{className:"h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300",style:{width:Math.max(5,_)+"%"}})}),a[x(712)](x(717),{className:x(749),children:[a[x(709)](x(791),{children:x(731)}),a[x(712)](x(791),{children:[_,"%"]})]})]})]})}),a[x(709)](x(487),{children:x(692)+(v==="a4"?x(816):v===x(535)?x(870):x(895))+x(766)+(v==="a4"?x(755):"8.5in")+` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `+x(v==="a4"?755:599)+x(518)+x(v==="a4"?755:599)+x(782)+(v==="a4"?x(623):v===x(535)?x(853):x(847))+x(845)})]})}function o0(){const x=["Folio","data-field uppercase font-bold border-2 whitespace-nowrap","querySelectorAll","MALE","span","-9999px","DepEd Logo","getElementById","forEach","female","h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1","w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200","quarter",`px; 
                        font-size: `,"End of Term 2","Jan 4, 2027","Apr 1-8, 2027",`; 
                        color: black !important; 
                        font-size: `,"length",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"Section","Term 1: Summative Test #2","0px","value","label-green border-2 whitespace-nowrap",`px; 
                        font-weight: 700; 
                        font-size: `,"TOTAL","LIR","absent","210mm 297mm","optgroup","label-green py-1 border-2 px-1","relative group min-w-0 flex-1","subject_id","Dec 7-18, 2026","portrait","flex items-center gap-4 shrink-0","h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","w-4 h-4","WRITTEN /ORAL WORKS (WWs)","constructor","Paper Size","card-container-combined print:m-0 print:shadow-none","Bulk PDF download error:","School Year: ","15%","none","Term 1 Examination","thead","flex items-center gap-1.5 lg:gap-2 shrink-0","BAGONG BARRIO NATIONAL HIGH SCHOOL",`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"lir-bulk-render-container","w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400","absolute inset-0 flex flex-col items-center justify-center","half-page-section","last_name","flex gap-4 items-start w-full mt-2",` !important;
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
             `,"section_grade_level","13in",`px; 
                        padding: `,`rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `,"✓ Grades","62504rCCBTg","Learner Record","11in","school_year","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate","JUNE","toString","w-4 h-4 text-indigo-600 shrink-0","lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200","section_name","p-8 text-center text-slate-400 text-xs font-medium","LIR_","finalGrade",`; 
                        font-size: `,"TERM",".lir-bulk-sheet","#22c55e",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,"8.5in 11in",`dd;
                        border: 1px solid `,"Back to Hub","Females (","text-[9px] font-medium text-slate-400","TEACHER",`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `,"some","flex items-center gap-2.5 min-w-0","% complete...","Sept 16, 2026","prototype","absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30"," - ","grow flex flex-col gap-1 overflow-hidden",`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,"Important Dates","Bulk_LIR_","Letter","date-row","font-extrabold uppercase whitespace-nowrap","col","log","w-3 h-3","relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30","8.5in 13in","p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0",`;
                        color: #000000 !important;
                        font-size: `,"tfoot","subject_name",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"max-w-full max-h-full object-contain","bind","Sept 2-15, 2026","relative flex-1 min-w-48","scores","trace","Apr 8, 2027","button","target","M.I","absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full","written_works","color","809984FmcUlX",`44;
                        font-weight: 800;
                        font-size: `,"important-dates-box","w-3.5 h-3.5","scale(","Bulk Print","relative group","male","MARCH","grid grid-cols-1 sm:grid-cols-2 gap-2","Subject","No sheets ready for printing. Please try again.","style","bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]","font-black uppercase italic","Opening print stream for ","date-val uppercase","flex items-center justify-between px-1","useState","min","input","Failed to generate PDF download.",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200","page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none","photo_url","Preparing LIR sheets for bulk printing...",`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,"flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0",`rem; 
                        min-height: `,"JUNIOR HIGH SCHOOL","Jan 25, 2027","#86efac","tbody",`;
                        border-radius: 8px;
                        height: `,"796230MaBsby","term-label","select","p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0","text-lg font-black text-slate-900 tracking-tight uppercase","month","Select Subject","4000257stqNiY",` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5","Bulk LIR Operations","font-bold","w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0","No sheets ready for PDF export.","middle_name","relative w-16 h-16 mx-auto flex items-center justify-center",`px; 
                        border-right: 1px solid `,"FINAL GRADE",`;
                        border: 1px solid `,"object-contain","Mar 22-23, 2027",`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `,"w-10 h-10 text-white","push","THIRD","letter","flex items-center gap-1.5 flex-wrap","date-label uppercase",`rem; 
                        border-bottom: 2px solid `,"includes","rem",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,"JULY","Start of Term 3","slice","Individual LIR","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200"," of ","label-green py-1 border-2","Choose Fill Color","summative_tests","Term 3: Summative Test #2",`;
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"name","Term 2: Summative Test #2","AUGUST","Daily Attendance","Clear","folio","Bulk Download PDF for selected learners","w-3 h-3 group-hover:scale-110 transition-transform","mb-2","School Logo",`px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: `,"text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60","SENIOR HIGH SCHOOL","Months","transform","isArray","13%","localeCompare","SUMMATIVE TEST",`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,"SECOND","w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors","Bulk print stream launched successfully.","error","map"," TERM",'No learners found matching "',"gender","text","inherit","EOSY Rites","table","w-full h-full opacity-0 absolute inset-0 cursor-pointer","img","option","flex items-center justify-center bg-white overflow-hidden","text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic","Bulk PDF","header-subject-table border-collapse border-2","Term 2: Summative Test #1",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid `,"Total Abs.","End-of-Term Block","Term 1: Summative Test #1","Apr 6-7, 2027","8.5in","fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block","entries","reduce","h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","__proto__","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200","July 28, 2026","uid","text-xs font-bold text-slate-800 truncate","px ","header-row-fill","text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums","text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none","replace","adviser_name","Males (","Choose Outline Color","Sept 1, 2026","lir-title-bar-custom mb-3 uppercase tracking-widest","w-3 h-3 group-hover:-translate-y-0.5 transition-transform","w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400","hidden","delete","297mm","June 8-11, 2026",`px;
                        font-size: `,`; 
                        padding: `,"1120455lQmUKk","flex items-stretch border-2 w-full overflow-hidden","FIRST NAME","dates-header-bar uppercase","teacher_id",`px;
                        text-align: center;
                        height: `,"student_lrn",`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `,"w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4","charAt","Print Single","from","Term 3 Exam (Graduating)","FEMALE","3MrZEEi","Term 3 Exam (Non-Grad)","1ST",`rem;
                        width: `,"flex justify-between items-center w-full overflow-hidden","absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000","header-green py-1","fixed","useCallback","relative group shrink-0","Feb 16, 2027","20%"," | ","Unknown error",`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `,"2ND","values","Zoom Out","h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","important-dates-header uppercase italic","NOVEMBER","relative flex items-center justify-center cursor-pointer shrink-0","SEPTEMBER","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10","FIRST","displayName","LAST NAME","LRN","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500","relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl","Print single active learner","h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","space-y-4","title","w-3 h-3 text-indigo-600","sort","1x1 Learner Photo","PHOTO","school-logo.png","deped_logo_right.png","807628uOWWno","text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5","transition-all duration-700 ease-out origin-top print:scale-100","Start of Term 2","toUpperCase","flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden","filter","flex flex-col shrink-0","track","PRODUCT/PERFORMANCE TASK (PPTs)","Zoom In",`
                @media print {
                    @page {
                        size: `,"w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"data-field font-extrabold border-2 whitespace-nowrap","px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0","40px","End of Term 3","size","July 6, 2026",`px;
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
                        background-color: `,"student-info-table border-2","text-[10px] font-black text-slate-500 uppercase tracking-widest","Aug 28, 2026","1 X 1","flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4","find","w-full h-full object-cover","jsx","row-label py-1 px-1 border-2",`px;
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
                        padding: `,"jsxs","h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200","Bulk print error:","w-28 h-28 text-slate-100 dark:text-slate-600","col-span-1","div","OCTOBER","bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ","truncate","toLowerCase","font-normal ml-2","h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0","Mar 15-16, 2027","w-4 h-4 text-slate-300 shrink-0","flex items-center gap-2","Dates","attendance","first_name","Export Pipeline","DECEMBER","month-col","SUBJECT","Processing LIR PDF pages: ","performance_tasks","Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections.","Filter learners by name or LRN...","add","useEffect","warn","space-y-2","dates",`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `,"text-[10px] text-slate-400 font-semibold uppercase tracking-widest","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0",`;
                        padding: `," learners selected","flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider","w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200","has","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden","px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0",`rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,"210mm","-11px",`rem;
                    }

                    .row-label {
                        background-color: `,"font-bold py-1","w-3 h-3 group-hover:translate-y-0.5 transition-transform","space-y-1.5","145615ByGgkm","Export failed: ",`rem; 
                        padding: `,"3RD","row-label",`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `,"8ohqFIT","useMemo",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1","bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm","success","Download PDF","section_id","font-bold leading-tight","logo_url","JANUARY","10%","red","Dec 3-4, 2026","text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase",` !important;
                        height: `,`rem; 
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
                `,"lrn","student_section","LRN: "];return o0=function(){return x},o0()}export{px as LIRPage};
