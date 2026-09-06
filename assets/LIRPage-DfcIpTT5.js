import{j as a,r as b,cv as V0,bH as c0,cF as q0,cf as X0,be as T0,bP as E0,ch as h0,cE as K0,bs as Q0,ds as Z0,cH as w0,cI as R0,bE as $0}from"./vendor-Cj7XSgTs.js";import{b as xx,u as ex,v as ax,L as N0,P as tx}from"./index-CPipwkw-.js";import{e as rx,p as sx}from"./pdf-export-BRYmco5Z.js";import"./vendor-pdf-libs-ChAEQR0D.js";import"./vendor-firebase-Df5t39Xl.js";import"./vendor-framer-motion-JdOd8a5E.js";const f0=B;(function(x,N){const g=B,y=x();for(;;)try{if(-parseInt(g(762))/1+parseInt(g(691))/2*(-parseInt(g(536))/3)+parseInt(g(723))/4*(parseInt(g(698))/5)+-parseInt(g(603))/6+-parseInt(g(777))/7+parseInt(g(573))/8*(parseInt(g(493))/9)+-parseInt(g(882))/10*(-parseInt(g(881))/11)===N)break;y.push(y.shift())}catch{y.push(y.shift())}})(m0,809326);const l0=(function(){let x=!0;return function(N,g){const y=x?function(){if(g){const I=g.apply(N,arguments);return g=null,I}}:function(){};return x=!1,y}})(),W0=l0(void 0,function(){const x=B,N=function(){const L=B;let c;try{c=Function(L(907)+L(640)+");")()}catch{c=window}return c},g=N(),y=g.console=g[x(885)]||{},I=[x(600),x(830),"info","error",x(768),"table",x(908)];for(let L=0;L<I[x(718)];L++){const c=l0[x(518)].prototype[x(873)](l0),d=I[L],k=y[d]||c;c.__proto__=l0[x(873)](l0),c[x(715)]=k.toString[x(873)](k),y[d]=c}});function B(x,N){return x=x-487,m0()[x]}W0();const I0=({pageNumber:x,student:N,profile:g,schoolYear:y,subject:I,teacher:L,fillColor:c=f0(805),outlineColor:d="#22c55e",gradeData:k,paperSize:D=f0(727),attendanceData:q={}})=>{const e=f0,X="./",w=25,n0=n=>Array[B(513)]({length:w},(f,_)=>n[_]??""),T=(n,u)=>{const f=B,_=Number(u);if(!_)return!1;const C=n.toUpperCase();return C===f(780)&&_===12||C===f(548)&&(_===21||_===31)||C===f(891)&&(_===2||_===30)||C===f(739)&&_===8||C===f(582)&&_===1};let P=e(622),p="8.5in",s=1.12,Y=1.2,W=.8,F=.75,E=5,A=.8,K=40,v=240,Q=100,Z=50,J=e(753);D==="a4"?(p=e(796),P=e(697),s=1.02,Y=.85,W=.55,F=.5,E=2,A=.65,K=26,v=140,Q=80,Z=40):D==="letter"?(p="8.5in",P=e(797),s=.98,Y=.85,W=.55,F=.5,E=3,A=.7,K=28,v=160,Q=65,Z=32,J=e(841)):D===e(727)&&(p=e(806),P=e(622),s=.98,Y=.85,W=.55,F=.5,E=3,A=.7,K=28,v=160,Q=65,Z=32,J=e(841));const z=(n,u)=>{const f=e,_=(n||"").trim();return _[f(718)]>32?u*.65:_[f(718)]>24?u*.78:_.length>16?u*.88:u},H=z(I,A*s),V=z(L,A*s);return a[e(495)](e(550),{className:e(507),children:a[e(917)]("div",{className:e(783),style:{width:p,height:P},children:[a[e(495)](e(692),{children:e(644)+p+" "+P+e(822)+d+e(675)+8*s+e(651)+5*s+e(599)+c+e(632)+d+e(738)+3*s+`px;
                        font-size: `+.85*s+e(580)+c+e(541)+d+e(664)+.6*s+e(689)+d+e(675)+2*s+`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `+.8*s+e(547)+.6*s+e(934)+d+e(675)+1.5*s+e(531)+24*s+`px;
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
                        background-color: `+c+e(539)+.6*s+`rem;
                    }

                    .row-label {
                        background-color: `+c+e(756)+.6*s+e(490)+70*s+e(491)+c+e(769)+d+e(850)+K*s+e(647)+v*s+e(645)+c+e(670)+.9*s+e(503)+4*s+e(905)+d+`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `+d+e(593)+d+`; 
                        text-align: center; 
                        font-size: `+.5*s+`rem; 
                        font-weight: 700; 
                        height: `+21*s+e(754)+1*s+e(588)+c+e(569)+.5*s+e(532)+d+e(782)+c+e(858)+.9*s+e(623)+c+e(728)+.45*s+e(825)+.5*s+e(808)+d+e(680)+c+e(660)+3*s+e(502)+.85*s+e(724)+d+e(555)+d+e(893)+.45*s+e(747)+18*s+e(772)+95*s+e(521)+d+`; 
                        padding: `+1.5*s+e(737)+4*s+e(760)+1.5*s+e(737)+4*s+e(667)+.42*s+e(736)}),a[e(917)]("div",{className:e(510),children:[a[e(917)](e(550),{className:e(635),children:[a[e(917)](e(550),{className:e(791),children:[a[e(917)](e(550),{className:"flex items-center gap-4 shrink-0",children:[a[e(495)](e(550),{className:e(707),style:{width:64*s,height:64*s},children:a[e(495)](e(636),{src:g[e(608)]||X+e(556),alt:"School Logo",className:"max-w-full max-h-full object-contain",onError:n=>{const u=e;n[u(900)][u(807)]=X+u(556)}})}),a[e(917)](e(550),{children:[a[e(495)]("h1",{className:e(509),style:{fontSize:Y*s+e(626)},children:g[e(591)]||e(859)}),a.jsx("p",{className:"font-black uppercase italic",style:{fontSize:W*s+"rem",color:d},children:"Learner's Individual Record Card"}),a[e(917)]("p",{className:e(720),style:{fontSize:F*s+"rem"},children:[e(765),a[e(495)](e(778),{className:e(852),children:y})]})]})]}),a[e(495)]("div",{className:e(687),children:a.jsx(e(589),{className:e(693),style:{borderColor:d},children:a.jsx(e(936),{children:a[e(917)]("tr",{children:[a[e(495)]("td",{className:e(631),style:{fontSize:A*s+e(626),padding:E*s+e(737)+E*2*s+"px",borderColor:d},children:"SUBJECT"}),a[e(495)]("td",{className:e(646),style:{fontSize:H+"rem",padding:E*s+"px "+E*2.5*s+"px",borderColor:d},children:I}),a[e(495)]("td",{className:e(631),style:{fontSize:A*s+"rem",padding:E*s+"px "+E*2*s+"px",borderColor:d},children:e(835)}),a[e(495)]("td",{className:e(646),style:{fontSize:V+"rem",padding:E*s+"px "+E*2.5*s+"px",borderColor:d},children:L})]})})})})]}),a.jsxs(e(550),{className:"flex gap-4 items-start w-full mt-2",children:[a[e(495)](e(550),{className:e(748),style:{width:1*s+"in",height:1*s+"in",borderColor:d},children:N[e(662)]?a[e(495)](e(636),{src:N[e(662)],alt:e(639),className:e(567)}):a[e(917)](e(778),{className:e(702),style:{fontSize:.7*s+e(626)},children:[e(821),a[e(495)]("br",{}),e(643)]})}),a[e(495)]("div",{className:"grow flex flex-col gap-1 overflow-hidden",children:a.jsx(e(589),{className:"student-info-table border-2",style:{borderColor:d,height:1*s+"in"},children:a[e(917)](e(936),{children:[a[e(917)]("tr",{style:{height:.5*s+"in"},children:[a[e(495)]("td",{className:e(938),style:{borderColor:d,height:.5*s+"in"},children:N.last_name}),a[e(495)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:d,height:.5*s+"in"},children:N[e(587)]}),a.jsx("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap px-1",style:{width:e(609),borderColor:d,height:.5*s+"in"},children:N.middle_name?.[e(564)](0)||""}),a[e(495)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:d,height:.5*s+"in"},children:N[e(846)]}),a[e(495)]("td",{className:e(938),style:{borderColor:d,height:.5*s+"in"},children:N.lrn})]}),a[e(917)]("tr",{style:{height:.5*s+"in"},children:[a[e(495)]("td",{className:e(759),style:{borderColor:d,height:.5*s+"in"},children:e(621)}),a[e(495)]("td",{className:e(759),style:{borderColor:d,height:.5*s+"in"},children:"FIRST NAME"}),a[e(495)]("td",{className:"label-green py-1 border-2 px-1",style:{width:e(609),borderColor:d,height:.5*s+"in"},children:"M.I"}),a[e(495)]("td",{className:e(759),style:{borderColor:d,height:.5*s+"in"},children:e(928)}),a[e(495)]("td",{className:e(759),style:{borderColor:d,height:.5*s+"in"},children:e(870)})]})]})})})]}),a[e(917)](e(550),{className:e(919),children:[a.jsxs(e(550),{children:[a[e(495)](e(550),{className:e(862),style:{fontSize:.75*s+e(626)},children:e(659)}),a.jsx(e(589),{style:{tableLayout:e(845)},children:a.jsxs("tbody",{children:[a[e(917)]("tr",{className:e(740),children:[a[e(495)]("td",{className:e(828),style:{width:e(787)},children:"TERM"}),[1,2,3,4,5][e(855)](n=>a.jsx("td",{style:{width:e(745)},children:n},n)),a[e(495)]("td",{className:e(720),style:{width:e(894)},children:e(565)})]}),[1,2,3].map(n=>a[e(917)]("tr",{children:[a.jsx("td",{className:"row-label",children:e(n===1?706:n===2?710:860)}),[...Array(5)][e(855)]((u,f)=>a[e(495)]("td",{children:k?.[n]?.[e(625)].ww[f]??""},f)),a[e(495)]("td",{className:"font-bold",children:k?.[n]?.[e(625)].ww[e(526)](0,5)[e(814)]((u,f)=>u+(Number(f)||0),0)||""})]},n))]})})]}),a[e(917)](e(550),{children:[a.jsx(e(550),{className:e(862),style:{fontSize:.75*s+"rem"},children:e(553)}),a[e(495)]("table",{style:{tableLayout:e(845)},children:a[e(917)](e(936),{children:[a.jsxs("tr",{className:e(740),children:[a.jsx("td",{className:e(828),style:{width:"20%"},children:"TERM"}),[1,2,3][e(855)](n=>a[e(495)]("td",{style:{width:e(894)},children:n},n)),a[e(495)]("td",{className:e(720),style:{width:e(894)},children:"TOTAL"})]}),[1,2,3][e(855)](n=>a[e(917)]("tr",{children:[a[e(495)]("td",{className:e(488),children:n===1?e(706):n===2?"SECOND":e(860)}),[...Array(3)].map((u,f)=>a[e(495)]("td",{children:k?.[n]?.[e(625)].pt[f]??""},f)),a.jsx("td",{className:"font-bold",children:k?.[n]?.scores.pt[e(526)](0,3)[e(814)]((u,f)=>u+(Number(f)||0),0)||""})]},n))]})})]})]}),a.jsxs(e(550),{className:e(732),children:[a[e(917)](e(550),{className:"col-span-1",children:[a[e(495)](e(550),{className:"header-green py-1",style:{fontSize:.7*s+e(626)},children:e(876)}),a[e(495)](e(589),{style:{tableLayout:e(845)},children:a[e(917)]("tbody",{children:[a[e(917)]("tr",{className:e(740),children:[a[e(495)]("td",{className:e(828),style:{width:e(642)},children:e(700)}),[1,2][e(855)](n=>a[e(495)]("td",{children:n},n))]}),[1,2,3][e(855)](n=>a[e(917)]("tr",{children:[a.jsx("td",{className:e(488),children:n===1?"FIRST":e(n===2?710:860)}),[...Array(2)].map((u,f)=>a[e(495)]("td",{children:k?.[n]?.scores.st[f]??""},f))]},n))]})})]}),a[e(495)](e(550),{className:e(575),children:a[e(917)]("table",{style:{tableLayout:e(845)},children:[a.jsx(e(512),{children:a.jsx("tr",{className:e(740),children:a.jsx("td",{colSpan:2,className:e(758),style:{fontSize:.7*s+"rem"},children:e(673)})})}),a[e(495)](e(936),{children:[1,2,3][e(855)](n=>a[e(917)]("tr",{children:[a.jsxs("td",{className:e(809),style:{borderColor:d},children:[e(n===1?785:n===2?868:906)," TERM"]}),a[e(495)]("td",{className:e(720),children:k?.[n]?.[e(625)].te||""})]},n))})]})}),a[e(495)]("div",{className:e(575),children:a.jsxs("table",{style:{tableLayout:"fixed"},children:[a.jsx(e(512),{children:a[e(495)]("tr",{className:e(740),children:a[e(495)]("td",{colSpan:2,className:e(758),style:{fontSize:.7*s+e(626)},children:"FINAL GRADE"})})}),a[e(495)](e(936),{children:[1,2,3][e(855)](n=>a[e(917)]("tr",{children:[a.jsxs("td",{className:e(809),style:{borderColor:d},children:[e(n===1?785:n===2?868:906)," TERM"]}),a[e(495)]("td",{className:e(720),children:k?.[n]?.[e(613)]||""})]},n))}),a[e(495)](e(515),{children:a.jsx("tr",{style:{height:1.5*s+"px"},children:a[e(495)]("td",{colSpan:2,style:{border:e(741)}})})})]})}),a.jsxs(e(550),{className:e(766),style:{marginTop:J},children:[a[e(495)]("div",{className:e(595),children:a.jsx(e(636),{src:X+e(864),alt:e(813),className:"object-contain",style:{width:Q*s,height:Z*s}})}),a[e(495)](e(550),{className:e(897)}),a[e(495)]("p",{className:e(629),style:{fontSize:.6*s+e(626),marginTop:14*s+"px"},children:e(522)})]})]})]}),a[e(917)](e(550),{className:e(542),style:{borderColor:d},children:[a[e(495)]("div",{className:e(616),children:e(829)}),a[e(917)](e(589),{className:e(713),children:[a[e(917)](e(499),{children:[a[e(495)](e(875),{style:{width:"10%"}}),Array[e(513)]({length:w})[e(855)]((n,u)=>a[e(495)](e(875),{style:{width:e(649)}},u)),a[e(495)](e(875),{style:{width:"7%"}})]}),a[e(495)](e(512),{children:a[e(917)]("tr",{children:[a[e(495)]("th",{className:e(901),children:e(854)}),a[e(495)]("th",{colSpan:w,className:e(617),children:e(815)}),a[e(495)]("th",{className:e(764),children:e(798)})]})}),a[e(495)](e(936),{children:[{name:"JUNE",dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:e(910),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:e(548),dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:e(838),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:e(792),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:e(891),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:e(739),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:e(582),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:e(638),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:e(818),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:"APRIL",dates:[1,2,5,6,7,8]}].map(n=>a[e(917)]("tr",{children:[a[e(495)]("td",{className:e(889),children:n[e(591)]}),n0(n[e(799)])[e(855)]((u,f)=>a[e(495)]("td",{className:"attendance-date-cell",style:{color:T(n[e(591)],u)?e(540):e(911)},children:u},f)),a.jsx("td",{className:e(720),children:q[n[e(591)]]||""})]},n[e(591)]))})]}),a.jsxs(e(550),{className:e(750),style:{borderColor:d},children:[a[e(917)](e(550),{className:e(839),children:[a[e(495)](e(550),{className:e(500),children:e(634)}),[[e(656),e(672)],["July 6, 2026",e(816)],[e(776),e(558)],[e(605),"Term 1 Examination"],["Sept 1, 2026",e(757)],[e(612),"End-of-Term Block"],[e(618),e(601)]][e(855)](([n,u])=>a[e(917)](e(550),{className:e(590),children:[a.jsx("div",{className:e(696),children:n}),a[e(495)](e(550),{className:e(927),children:u})]},n))]}),a.jsxs(e(550),{className:"important-dates-box",children:[a.jsx(e(550),{className:"important-dates-header uppercase italic",children:e(634)}),[[e(592),e(888)],["Oct 29, 2026",e(886)],[e(856),e(516)],[e(726),e(658)],[e(735),e(583)],[e(705),e(703)],[e(916),e(826)]][e(855)](([n,u])=>a[e(917)]("div",{className:e(590),children:[a[e(495)](e(550),{className:e(696),children:n}),a[e(495)](e(550),{className:e(927),children:u})]},n))]}),a.jsxs(e(550),{className:"important-dates-box",children:[a[e(495)]("div",{className:e(500),children:e(634)}),[[e(721),e(520)],[e(869),e(771)],[e(933),e(557)],[e(572),e(658)],[e(879),e(658)],["Apr 6-7, 2027",e(677)],[e(803),e(913)]][e(855)](([n,u])=>a.jsxs(e(550),{className:e(590),children:[a.jsx(e(550),{className:e(696),children:n}),a.jsx(e(550),{className:e(927),children:u})]},n))]})]})]})]})]})})};function fx(){const x=f0,{students:N,sections:g,subjects:y,teachers:I,schoolProfile:L,activeSchoolYear:c,setCurrentView:d,classRecords:k,gradingSheetRecords:D,hpsRecords:q,sf2Sheets:e}=xx(),{user:X}=ex(),[w,n0]=b[x(923)](""),[T,P]=b[x(923)](null),[p,s]=b[x(923)](""),[Y,W]=b[x(923)](1),[F,E]=b[x(923)]("#86efac"),[A,K]=b[x(923)](x(712)),[v,Q]=b[x(923)](x(727)),[Z,J]=b[x(923)](!1),[z,H]=b.useState(new Set),[V,n]=b.useState(""),[u,f]=b.useState(!1),[_,C]=b[x(923)](0),[L0,$]=b[x(923)](""),j=b[x(909)](()=>{const t=x;return g[t(914)](r=>r[t(530)]===w||r.id===w)},[g,w]),O=b[x(909)](()=>{const t=x;return y[t(914)](r=>r.id===p||r[t(770)]===p)},[y,p]),A0=b[x(909)](()=>{if(!j)return[];const t=ax(X,j,y),r=new Set;return t.filter(l=>{const i=B,h=N0(l[i(770)]);return r[i(779)](h)?!1:(r[i(694)](h),!0)})},[j,y,X]),k0=b.useMemo(()=>{const t=x;if(O?.[t(630)]){const r=I[t(914)](l=>l[t(665)]===O[t(630)]||l.id===O.teacher_id);if(r)return r.displayName||r[t(591)]}return j?.adviser_name||""},[O,I,j]),t0=b[x(909)](()=>{const t=x;return[...g][t(730)]((r,l)=>{const i=t,h=(r[i(566)]||"")[i(904)](l[i(566)]||"",void 0,{numeric:!0});return h!==0?h:(r.section_name||"").localeCompare(l[i(530)]||"")})},[g]),z0=b.useMemo(()=>{const t={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return t0.forEach(r=>{const l=B,i=(r[l(566)]||"")[l(611)](),h=parseInt(i[l(719)](/\D/g,""))||0;i.includes(l(755))||h>=1&&h<=6?t[l(666)].push(r):h>=7&&h<=10?t[l(843)][l(912)](r):h>=11&&h<=12&&t[l(674)][l(912)](r)}),t},[t0]);b[x(872)](()=>{if(!w&&t0.length===1){const t=setTimeout(()=>{n0(t0[0].section_name)},0);return()=>clearTimeout(t)}},[t0,w]),b[x(872)](()=>{const t=setTimeout(()=>{s(""),P(null),H(new Set)},0);return()=>clearTimeout(t)},[w]);const R=b.useMemo(()=>{const t=x;if(!w)return[];const r=g[t(914)](l=>l[t(530)]===w||l.id===w)?.id;return N[t(867)](l=>l[t(846)]===w||r&&l.student_section===r)},[N,w,g]),x0=b[x(909)](()=>R[x(867)](t=>(t[x(683)]||"").toLowerCase()===x(633)).sort((t,r)=>(t.last_name+", "+t[x(587)])[x(904)](r.last_name+", "+r[x(587)])),[R]),e0=b[x(909)](()=>R[x(867)](t=>(t.gender||"")[x(611)]()!=="male").sort((t,r)=>(t[x(574)]+", "+t[x(587)])[x(904)](r[x(574)]+", "+r[x(587)])),[R]),C0=()=>{const t=x;z.size===0&&R[t(718)]>0&&H(new Set(R[t(855)](r=>r[t(786)]))),J(!0)},b0=b[x(834)](t=>{const r=x;if(!t)return{};const l={};return e.filter(h=>h[r(789)]===c&&(h[r(874)]===j?.id||h[r(874)]===w))[r(524)](h=>{const S=r,o=h.attendance?.[t[S(786)]];if(o){const M=Object[S(812)](o)[S(867)](G=>G?.toLowerCase()===S(679))[S(718)];M>0&&(l[h.month[S(637)]()]=M)}}),l},[e,c,j,w]),p0=b[x(834)]((t,r,l)=>{const i=x;if(!t||!r)return;const h={};return[1,2,3][i(524)](S=>{const o=i,M=(m,o0)=>{const d0=B;return!!(m===l?.id||m===r||o0&&l?.[d0(770)]&&N0(o0)===N0(l[d0(770)]))},G=k[o(914)](m=>m[o(506)]===t[o(786)]&&m[o(789)]===c&&Number(m.quarter)===S&&M(m[o(688)],m[o(770)]))||D[o(914)](m=>m[o(506)]===t[o(786)]&&m[o(789)]===c&&Number(m[o(681)])===S&&M(m[o(688)],m[o(770)])),i0=q[o(914)](m=>M(m[o(688)],m[o(770)])&&m.school_year===c&&Number(m[o(681)])===S&&(m[o(874)]===t[o(846)]||j?.id&&m[o(874)]===j.id))||q[o(914)](m=>M(m[o(688)],m[o(770)])&&m.school_year===c&&Number(m[o(681)])===S),a0=(m,o0)=>{const d0=o,J0=Array[d0(554)](m)?m:[];return Array.from({length:o0},(lx,Y0)=>J0[Y0]??"")},G0=G,U0=i0,U=m=>m===""||m===null||m===void 0?"":m,S0=tx(t[o(786)],l?.id||p,S,c,k,D,q,j?.[o(566)],j?.[o(744)]);h[S]={scores:{ww:a0(G?.[o(743)],10)[o(855)](U),pt:a0(G?.[o(504)],10)[o(855)](U),st:a0(G0?.[o(935)],5)[o(855)](U),te:U(G?.[o(795)]??"")},hps:{ww:a0(i0?.written_works,10)[o(855)](U),pt:a0(i0?.[o(504)],10)[o(855)](U),st:a0(U0?.summative_tests,5)[o(855)](U),te:U(i0?.[o(795)]??"")},finalGrade:S0>0?S0:U(G?.[o(761)]??"")}}),h},[k,D,q,c,j,p]),O0=b.useMemo(()=>b0(T),[T,b0]),M0=b[x(909)](()=>p0(T,p,O),[T,p,O,p0]),y0=b[x(909)](()=>[...x0,...e0],[x0,e0]),r0=b[x(909)](()=>{const t=x;return y0[t(867)](r=>z[t(779)](r[t(786)]))},[y0,z]),s0=b[x(909)](()=>{const t=x;if(!V[t(614)]())return R;const r=V[t(611)]();return R[t(867)](l=>l[t(574)][t(611)]()[t(877)](r)||l[t(587)].toLowerCase()[t(877)](r)||l[t(786)].includes(r))},[R,V]),u0=b[x(909)](()=>s0[x(867)](t=>(t[x(683)]||"")[x(611)]()==="male"),[s0]),g0=b[x(909)](()=>s0[x(867)](t=>(t[x(683)]||"").toLowerCase()===x(581)),[s0]),D0=()=>{const t=x;if(!T)return;const r=document[t(650)],l=(T.last_name+"_"+T[t(587)]).replace(/[^a-z0-9]/gi,"_");document[t(650)]=t(722)+l+"_"+c,window[t(817)](),setTimeout(()=>{document.title=r},1e3)},v0=async()=>{const t=x;if(r0[t(718)]!==0){f(!0),C(10),$(t(684));try{await new Promise(i=>setTimeout(i,400));const r=document[t(604)](t(602)),l=r?Array[t(513)](r[t(833)](t(924))):[];if(l[t(718)]===0){alert(t(742)),f(!1);return}C(50),$(t(820)+l.length+" learners..."),await sx({elements:l,paperSize:v,orientation:"portrait",title:t(544)+(j?.[t(530)]||t(561))+"_"+(O?.[t(770)]||"Subject")}),C(100),$("Bulk print stream launched successfully."),setTimeout(()=>{f(!1),J(!1)},600)}catch(r){console[t(831)](t(824),r),alert(t(489)),f(!1)}}},_0=async()=>{const t=x;if(r0.length!==0){f(!0),C(5),$(t(494));try{await new Promise(M=>setTimeout(M,400));const r=document.getElementById(t(602)),l=r?Array.from(r.querySelectorAll(t(924))):[];if(l[t(718)]===0){alert("No sheets ready for PDF export."),f(!1);return}const i=(j?.section_name||w||t(561)).replace(/[^a-z0-9]/gi,"_"),h=(O?.[t(770)]||t(717))[t(719)](/[^a-z0-9]/gi,"_"),S=t(722)+i+"_"+h+"_"+c,o=await rx({elements:l,filename:S,paperSize:v,orientation:t(586),title:S,onProgressChange:M=>{const G=t;C(M),$("Processing LIR PDF pages: "+M+G(657))}});o[t(930)]?(C(100),$(t(597)),setTimeout(()=>{f(!1),J(!1)},800)):(o[t(725)]||alert(t(523)+(o[t(831)]||t(734))),f(!1))}catch(r){console[t(831)]("Bulk PDF download error:",r),alert(t(800)),f(!1)}}},j0=t=>{H(r=>{const l=B,i=new Set(r);return i[l(779)](t)?i[l(781)](t):i.add(t),i})},P0=()=>{const t=x;H(new Set(R[t(855)](r=>r[t(786)])))},B0=()=>{const t=x;H(new Set(x0[t(855)](r=>r[t(786)])))},F0=()=>{const t=x;H(new Set(e0[t(855)](r=>r.lrn)))},H0=()=>{H(new Set)};return a.jsxs(x(550),{className:x(711),children:[a.jsxs(x(550),{className:x(527),children:[a[x(495)](x(550),{className:x(570)}),a[x(917)](x(550),{className:"flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden",children:[a[x(917)]("div",{className:x(607),children:[a.jsx(x(931),{onClick:()=>d("school-forms"),className:x(884),title:x(682),children:a[x(495)](V0,{className:x(655)})}),a[x(917)](x(550),{className:x(538),children:[a.jsx("h2",{className:x(624),children:x(498)}),a.jsx("p",{className:"text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none",children:x(505)})]})]}),a[x(495)]("div",{className:x(579)}),a.jsxs(x(550),{className:x(598),children:[a[x(917)]("select",{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate",value:w,onChange:t=>{const r=x;n0(t[r(900)][r(653)]),P(null),s("")},children:[a[x(495)]("option",{value:"",children:"Choose Section"}),Object[x(902)](z0)[x(855)](([t,r])=>r[x(718)]>0&&a[x(495)]("optgroup",{label:t,children:r[x(855)](l=>a.jsxs(x(819),{value:l[x(530)],children:[l[x(566)],x(578),l[x(530)]]},l.id))},t))]}),a.jsx(c0,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),a[x(917)](x(550),{className:"relative group min-w-0 flex-1",children:[a[x(917)](x(802),{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate",value:p,onChange:t=>{const r=x;s(t[r(900)][r(653)]),P(null)},disabled:!w,children:[a.jsx(x(819),{value:"",children:"Select Subject"}),A0.map(t=>a.jsx(x(819),{value:t.id,children:t.subject_name},t.id))]}),a[x(495)](c0,{className:x(663)})]}),a[x(917)]("div",{className:"relative group min-w-0 flex-1",children:[a[x(917)](x(802),{className:x(533),value:T?.[x(786)]||"",onChange:t=>{const r=x,l=N[r(914)](i=>i[r(786)]===t[r(900)][r(653)])||null;P(l)},disabled:!p,children:[a[x(495)](x(819),{value:"",children:x(669)}),x0[x(718)]>0&&a[x(495)](x(773),{label:"MALE",children:x0[x(855)](t=>{const r=x,l=p&&(k.some(i=>i.student_lrn===t[r(786)]&&i.subject_id===p&&i.school_year===c)||D[r(519)](i=>i[r(506)]===t[r(786)]&&i.subject_id===p&&i[r(789)]===c));return a[r(917)](r(819),{value:t[r(786)],children:[t.last_name,", ",t[r(587)]," ",l?"✓":""]},t[r(786)])})}),e0.length>0&&a[x(495)]("optgroup",{label:x(577),children:e0.map(t=>{const r=x,l=p&&(k[r(519)](i=>i[r(506)]===t[r(786)]&&i.subject_id===p&&i[r(789)]===c)||D[r(519)](i=>i[r(506)]===t[r(786)]&&i[r(688)]===p&&i[r(789)]===c));return a[r(917)](r(819),{value:t[r(786)],children:[t[r(574)],", ",t[r(587)]," ",l?"✓":""]},t.lrn)})})]}),a.jsx(c0,{className:x(663)})]}),a[x(495)]("div",{className:x(579)}),a[x(917)](x(550),{className:x(528),children:[a[x(917)]("select",{value:v,onChange:t=>Q(t[x(900)][x(653)]),className:x(576),title:"Paper Size",children:[a[x(495)](x(819),{value:"a4",children:"A4"}),a[x(495)](x(819),{value:x(652),children:x(701)}),a[x(495)]("option",{value:x(727),children:"Folio"})]}),a[x(495)](c0,{className:x(663)})]}),a.jsxs(x(550),{className:x(915),children:[a.jsxs("div",{className:x(546),title:x(925),children:[a[x(495)](x(550),{className:"w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0",style:{backgroundColor:F,width:18,height:18}}),a.jsx(x(508),{type:x(551),value:F,onChange:t=>E(t[x(900)][x(653)]),className:x(866)})]}),a[x(917)](x(550),{className:x(546),title:"Choose Outline Color",children:[a[x(495)]("div",{className:x(937),style:{backgroundColor:A,width:18,height:18}}),a[x(495)](x(508),{type:x(551),value:A,onChange:t=>K(t[x(900)].value),className:x(866)})]})]}),a.jsxs(x(550),{className:x(863),children:[a[x(495)](x(931),{onClick:()=>W(t=>Math[x(921)](.4,t-.1)),className:"w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200",title:x(641),children:a[x(495)](q0,{className:x(529)})}),a[x(917)]("span",{className:x(899),children:[Math[x(871)](Y*100),"%"]}),a[x(495)](x(931),{onClick:()=>W(t=>Math[x(847)](1.5,t+.1)),className:x(525),title:x(668),children:a[x(495)](X0,{className:x(529)})})]}),a.jsxs(x(931),{onClick:C0,disabled:!w||!p||R[x(718)]===0,className:x(752),title:x(648),children:[a.jsx(T0,{className:"w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform"}),x(892),z.size,")"]}),a[x(917)](x(931),{onClick:_0,disabled:!w||!p||r0[x(718)]===0,className:x(920),title:x(926),children:[a.jsx(E0,{className:x(537)}),"Bulk PDF"]}),a[x(917)](x(931),{onClick:v0,disabled:!w||!p||r0[x(718)]===0,className:x(774),title:x(844),children:[a[x(495)](h0,{className:"w-3 h-3 group-hover:scale-110 transition-transform"}),x(878)]}),a.jsxs(x(931),{onClick:D0,disabled:!T,className:"h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(628),children:[a[x(495)](h0,{className:x(627)}),x(840)]})]})]}),a[x(495)](x(550),{className:x(517),children:a[x(495)]("div",{className:x(543),children:T?a.jsx(x(550),{className:x(571),style:{transform:"scale("+Y+x(497),willChange:"transform",backfaceVisibility:x(678),WebkitBackfaceVisibility:x(678)},children:a.jsxs(x(550),{className:x(709),children:[a[x(495)](x(550),{className:x(836)}),a[x(495)](x(550),{className:x(559),children:a[x(495)](I0,{pageNumber:1,student:T,profile:L,schoolYear:c,subject:O?.[x(770)]||"",teacher:k0,fillColor:F,outlineColor:A,gradeData:M0,attendanceData:O0,paperSize:v})})]})}):a[x(917)](x(550),{className:x(704),children:[a[x(917)]("div",{className:x(709),children:[a[x(495)](x(550),{className:"absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full"}),a[x(917)](x(550),{className:x(922),children:[a[x(495)](K0,{className:x(851)}),a.jsxs(x(550),{className:x(823),children:[a[x(495)](x(778),{className:x(708),children:x(496)}),a[x(495)](x(550),{className:"w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4"})]}),a[x(495)](x(550),{className:"absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500",children:a[x(495)](h0,{className:x(568)})})]})]}),a[x(917)](x(550),{className:x(865),children:[a[x(495)]("h2",{className:x(903),children:x(895)}),a.jsx("p",{className:x(562),children:x(511)})]})]})})}),a[x(495)](x(550),{id:"lir-bulk-render-container",className:x(671),style:{left:"-9999px"},children:r0[x(855)](t=>{const r=x,l=p0(t,p,O),i=b0(t);return a.jsx(r(550),{className:r(661),children:a.jsx(I0,{pageNumber:1,student:t,profile:L,schoolYear:c,subject:O?.[r(770)]||"",teacher:k0,fillColor:F,outlineColor:A,gradeData:l,attendanceData:i,paperSize:v})},t[r(786)])})}),Z&&a[x(495)](x(550),{className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200",children:a[x(917)](x(550),{className:x(746),children:[a[x(917)](x(550),{className:x(585),children:[a.jsxs(x(550),{className:"flex items-center gap-3",children:[a[x(495)](x(550),{className:x(751),children:a[x(495)](T0,{className:x(883)})}),a[x(917)]("div",{children:[a[x(495)]("h3",{className:x(549),children:"Bulk LIR Operations"}),a.jsxs("p",{className:"text-[10px] text-slate-400 font-semibold uppercase tracking-widest",children:[j?.[x(566)],x(578),j?.section_name,x(848),O?.[x(770)]]})]})]}),a[x(495)](x(931),{onClick:()=>J(!1),className:"w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors",children:a[x(495)](Q0,{className:x(620)})})]}),a[x(917)](x(550),{className:x(501),children:[a.jsxs(x(550),{className:x(811),children:[a[x(495)](Z0,{className:x(685)}),a[x(495)](x(508),{type:x(842),placeholder:x(890),value:V,onChange:t=>n(t[x(900)].value),className:"w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"})]}),a[x(917)](x(550),{className:x(837),children:[a[x(917)](x(931),{onClick:P0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[a[x(495)](w0,{className:"w-3 h-3 text-indigo-600"}),"All (",R.length,")"]}),a[x(917)](x(931),{onClick:B0,className:x(545),children:[x(898),x0.length,")"]}),a[x(917)](x(931),{onClick:F0,className:x(545),children:[x(596),e0[x(718)],")"]}),a[x(495)](x(931),{onClick:H0,className:x(929),children:x(827)})]})]}),a.jsxs(x(550),{className:x(606),children:[u0[x(718)]>0&&a[x(917)](x(550),{className:x(699),children:[a[x(495)](x(550),{className:x(535),children:a.jsxs(x(778),{className:x(714),children:[x(788),u0[x(718)],")"]})}),a[x(495)](x(550),{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:u0[x(855)](t=>{const r=x,l=z[r(779)](t.lrn),i=p&&(k.some(h=>h[r(506)]===t[r(786)]&&h[r(688)]===p&&h[r(789)]===c)||D[r(519)](h=>h.student_lrn===t[r(786)]&&h[r(688)]===p&&h[r(789)]===c));return a[r(917)](r(550),{onClick:()=>j0(t[r(786)]),className:"p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 "+r(l?716:534),children:[a[r(917)](r(550),{className:r(763),children:[l?a[r(495)](w0,{className:r(619)}):a[r(495)](R0,{className:r(686)}),a.jsxs(r(550),{className:r(790),children:[a[r(917)]("p",{className:r(832),children:[t[r(574)],", ",t[r(587)]," ",t[r(810)]?t.middle_name[0]+".":""]}),a[r(917)]("p",{className:r(861),children:[r(731),t.lrn]})]})]}),i&&a[r(495)](r(778),{className:r(514),children:r(887)})]},t[r(786)])})})]}),g0.length>0&&a[x(917)]("div",{className:x(699),children:[a[x(495)](x(550),{className:x(535),children:a[x(917)](x(778),{className:x(714),children:[x(853),g0[x(718)],")"]})}),a[x(495)](x(550),{className:x(804),children:g0[x(855)](t=>{const r=x,l=z[r(779)](t.lrn),i=p&&(k[r(519)](h=>h[r(506)]===t.lrn&&h[r(688)]===p&&h[r(789)]===c)||D[r(519)](h=>h[r(506)]===t[r(786)]&&h[r(688)]===p&&h[r(789)]===c));return a[r(917)](r(550),{onClick:()=>j0(t[r(786)]),className:r(857)+(l?r(716):"bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"),children:[a.jsxs(r(550),{className:r(763),children:[l?a[r(495)](w0,{className:r(619)}):a[r(495)](R0,{className:r(686)}),a[r(917)](r(550),{className:r(790),children:[a[r(917)]("p",{className:r(832),children:[t[r(574)],", ",t.first_name," ",t[r(810)]?t[r(810)][0]+".":""]}),a[r(917)]("p",{className:r(861),children:[r(731),t[r(786)]]})]})]}),i&&a.jsx(r(778),{className:r(514),children:r(887)})]},t.lrn)})})]}),s0.length===0&&a.jsxs("div",{className:x(690),children:[x(849),V,'".']})]}),a[x(917)](x(550),{className:"p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0",children:[a[x(917)]("div",{className:x(880),children:[a[x(495)](x(778),{className:"text-indigo-600 font-black",children:z[x(594)]}),x(767),R.length,x(793)]}),a[x(917)](x(550),{className:x(584),children:[a.jsxs("button",{onClick:_0,disabled:z[x(594)]===0,className:x(733),children:[a[x(495)](E0,{className:x(932)}),x(563)]}),a.jsxs(x(931),{onClick:v0,disabled:z[x(594)]===0,className:"h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer",children:[a.jsx(h0,{className:x(932)}),x(878)]})]})]})]})}),u&&a[x(495)](x(550),{className:x(775),children:a.jsxs("div",{className:x(552),children:[a[x(917)](x(550),{className:"relative w-16 h-16 mx-auto flex items-center justify-center",children:[a[x(495)](x(550),{className:x(610)}),a.jsx(x(550),{className:x(794),children:a[x(495)]($0,{className:x(784)})})]}),a[x(917)]("div",{className:x(699),children:[a[x(495)]("h3",{className:"text-lg font-black text-slate-900 tracking-tight uppercase",children:x(749)}),a[x(495)]("p",{className:"text-xs font-semibold text-slate-500",children:L0})]}),a.jsxs(x(550),{className:x(729),children:[a.jsx(x(550),{className:"h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200",children:a[x(495)](x(550),{className:x(560),style:{width:Math[x(921)](5,_)+"%"}})}),a[x(917)]("div",{className:x(695),children:[a[x(495)](x(778),{children:x(492)}),a.jsxs("span",{children:[_,"%"]})]})]})]})}),a.jsx(x(692),{children:x(801)+(v==="a4"?"210mm 297mm":v==="letter"?"8.5in 11in":x(615))+x(676)+x(v==="a4"?796:806)+x(896)+x(v==="a4"?796:806)+x(654)+(v==="a4"?x(796):"8.5in")+x(918)+(v==="a4"?"297mm":v===x(652)?x(797):x(622))+x(487)})]})}function m0(){const x=["PHOTO",`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"data-field font-extrabold border-2 whitespace-nowrap",`px;
                        width: `,"Filter / Select Learners","3.32%","title",`px;
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
                        padding: `,"letter","value",` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform","June 8-11, 2026","% complete...","End-of-Term Block","WRITTEN /ORAL WORKS (WWs)",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,"lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always","photo_url","w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors",`;
                        color: #000000 !important;
                        font-size: `,"uid","ELEMENTARY",`px; 
                        font-weight: 700; 
                        font-size: `,"Zoom In","Select Learner",`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,"fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block","Opening Block: Term 1","TERM EXAM","SENIOR HIGH SCHOOL",`;
                        padding: `,`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `,"EOSY Rites","hidden","absent",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"quarter","Back to Hub","gender","Preparing LIR sheets for bulk printing...","w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400","w-4 h-4 text-slate-300 shrink-0","shrink-0 ml-auto","subject_id",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"p-8 text-center text-slate-400 text-xs font-medium","122338EduQaK","style","header-subject-table border-collapse border-2","add","flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider","date-val uppercase","297mm","5AnFpwW","space-y-2","TERM","Letter","font-bold leading-tight","Start of Term 3","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10","Jan 4, 2027","FIRST","flex items-center justify-center bg-white overflow-hidden","text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic","relative group","SECOND","lir-print-root flex flex-col h-full bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white","#22c55e","attendance-table mb-3","text-[10px] font-black text-slate-500 uppercase tracking-widest","toString","bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm","Subject","length","replace","font-bold","Feb 16, 2027","LIR_","2375396MqvGEQ",`rem; 
                        border-bottom: 2px solid `,"cancelled","Dec 7-18, 2026","folio",`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `,"space-y-1.5","sort","LRN: ","grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","Unknown error","Dec 18, 2026",`rem; 
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
                `,"px ",`;
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"DECEMBER","header-row-fill","none","No sheets ready for printing. Please try again.","written_works","track","13%","bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]",`rem; 
                        min-height: `,"border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden","Processing LIR Records","flex items-stretch border-2 w-full overflow-hidden","w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400","ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","0px",`px; 
                        padding: `,"kinder",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"Term 1 Examination","font-bold py-1","label-green py-1 border-2",`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,"final_grade","45621raXWfW","flex items-center gap-2.5 min-w-0","absences-header uppercase","School Year: ","col-span-1 flex flex-col items-center justify-center pt-1"," of ","exception",`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,"subject_name","Term 3 Exam (Graduating)",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"optgroup","h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200","July 28, 2026","1253525RKkyjQ","span","has","JUNE","delete",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,"page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none","w-8 h-8 animate-spin","1ST","lrn","15%","Male Learners (","school_year","truncate","flex justify-between items-center w-full overflow-hidden","OCTOBER"," learners selected","relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30","quarterly_exam","210mm","11in","Total Abs.","dates","Failed to generate PDF download.",`
                @media print {
                    @page {
                        size: `,"select","Apr 8, 2027","grid grid-cols-1 sm:grid-cols-2 gap-2","#86efac","8.5in","src",`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `,"row-label py-1 px-1 border-2","middle_name","relative flex-1 min-w-48","values","DepEd Logo","reduce","Dates","Term 1: Summative Test #1","print","MARCH","option","Opening print stream for ","1 X 1",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid `,"absolute inset-0 flex flex-col items-center justify-center","Bulk print error:",`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,"Term 3: Summative Test #1","Clear","term-label","Daily Attendance","warn","error","text-xs font-bold text-slate-800 truncate","querySelectorAll","useCallback","TEACHER","absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000","flex items-center gap-1.5 flex-wrap","SEPTEMBER","important-dates-box","Print Single","-11px","text","JUNIOR HIGH SCHOOL","Bulk Print for selected learners","fixed","student_section","min"," | ",'No learners found matching "',`;
                        border-radius: 8px;
                        height: `,"w-28 h-28 text-slate-100 dark:text-slate-600","font-normal ml-2","Female Learners (","Months","map","Dec 3-4, 2026","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ",`; 
                        color: black !important; 
                        font-size: `,"BAGONG BARRIO NATIONAL HIGH SCHOOL","THIRD","text-[9px] font-medium text-slate-400","header-green py-1","flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0","deped_logo_right.png","space-y-4","w-full h-full opacity-0 absolute inset-0 cursor-pointer","filter","2ND","Mar 15-16, 2027","LRN","round","useEffect","bind","section_id","col","SUMMATIVE TEST","includes","Bulk Print","Apr 1-8, 2027","text-xs font-bold text-slate-600","1613370JUmSnc","180VeXhVz","w-5 h-5","w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200","console","Term 2: Summative Test #2","✓ Grades","Term 2: Summative Test #1","month-col","Filter learners by name or LRN...","NOVEMBER","Select (",`; 
                        font-size: `,"20%","Individual Record",` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `,"signature-box bg-white","Males (","text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums","target","month-col uppercase","entries","text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase","localeCompare",`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `,"3RD","return (function() ","trace","useMemo","JULY","inherit","push","End of Term 3","find","flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5","Jan 25, 2027","jsxs",` !important;
                        height: `,"grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden","h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","max","relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl","useState",".lir-bulk-sheet","Choose Fill Color","Bulk Download PDF for selected learners","date-label uppercase","GRADE & SECTION","h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1","success","button","w-3.5 h-3.5","Mar 22-23, 2027",`rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `,"summative_tests","tbody","w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0","data-field uppercase font-bold border-2 whitespace-nowrap",` !important;
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
             `,"row-label","Failed to launch bulk print.",`rem;
                        width: `,`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,"Export Pipeline","8009019bRDhws","Initializing vector PDF export pipeline...","jsx","LIR",") translateZ(0)","Learner Record","colgroup","important-dates-header uppercase italic","p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0",`px; 
                        font-size: `,`rem; 
                        padding: `,"performance_tasks","Individual LIR","student_lrn","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","input","font-extrabold uppercase whitespace-nowrap","card-container-combined print:m-0 print:shadow-none","Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections.","thead","from","px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0","tfoot","Term 2 Examination","flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar","constructor","some","Term 3: Summative Test #2",`px; 
                        border-right: 1px solid `,"Teacher's Signature","Export failed: ","forEach","w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200","slice","z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full","relative group shrink-0","w-3 h-3","section_name",`px;
                        text-align: center;
                        height: `,`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `,"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200","bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50","flex items-center justify-between px-1","78vBpmlb","w-3 h-3 group-hover:-translate-y-0.5 transition-transform","flex flex-col shrink-0",`44;
                        font-weight: 800;
                        font-size: `,"red",`dd;
                        border: 1px solid `,"half-page-section border-t-4","w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0","Bulk_LIR_","h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1","relative flex items-center justify-center cursor-pointer shrink-0",`rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,"AUGUST","text-sm font-black uppercase tracking-wide text-white","div","color","bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6","PRODUCT/PERFORMANCE TASK (PPTs)","isArray",`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `,"school-logo.png","Term 3 Exam (Non-Grad)","Term 1: Summative Test #2","lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none","h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300","Section","text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60","Download PDF","charAt","TOTAL","section_grade_level","w-full h-full object-cover","w-10 h-10 text-white",`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,"absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30","transition-all duration-700 ease-out origin-top print:scale-100","Mar 24-31, 2027","8sBfGoE","last_name","col-span-1","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200","FEMALE"," - ","h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0",`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `,"female","JANUARY","End of Term 2","flex items-center gap-2","px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0","portrait","first_name",`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `,"table","date-row","name","Oct 7, 2026",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,"size","mb-2","Females (","PDF download complete!","relative group min-w-0 flex-1",`px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: `,"log","Start of Term 2","lir-bulk-render-container","8996304XcLtho","getElementById","Aug 28, 2026","flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4","flex items-center gap-1.5 lg:gap-2 shrink-0","logo_url","40px","absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping","toLowerCase","Sept 2-15, 2026","finalGrade","trim","8.5in 13in","lir-title-bar-custom mb-3 uppercase tracking-widest","dates-header-bar uppercase","Sept 16, 2026","w-4 h-4 text-indigo-600 shrink-0","w-4 h-4","LAST NAME","13in",`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5","scores","rem","w-3 h-3 group-hover:translate-y-0.5 transition-transform","Print single active learner","font-bold uppercase leading-none text-center","teacher_id","label-green border-2 whitespace-nowrap",`;
                        border: 1px solid `,"male","Important Dates","half-page-section","img","toUpperCase","FEBRUARY","1x1 Learner Photo",'{}.constructor("return this")( )',"Zoom Out","40%"];return m0=function(){return x},m0()}export{fx as LIRPage};
