import{j as a,r as m,cq as J0,bH as d0,cA as Y0,c9 as W0,be as _0,bN as k0,cc as i0,cz as q0,br as V0,dk as K0,cB as f0,cC as j0,bE as X0}from"./vendor-BkqcUYZC.js";import{b as Z0,u as Q0,h as $0,n as xx}from"./index-DXjLtVgQ.js";import{e as ex,p as ax}from"./pdf-export-CxezIkLW.js";import"./vendor-pdf-libs-J7uSz7bE.js";import"./vendor-firebase-0bCsHByl.js";import"./vendor-framer-motion-ab3f4cOX.js";const c0=U;(function(x,N){const u=U,y=x();for(;;)try{if(-parseInt(u(735))/1+-parseInt(u(578))/2*(-parseInt(u(627))/3)+-parseInt(u(580))/4*(parseInt(u(476))/5)+parseInt(u(808))/6+-parseInt(u(762))/7+parseInt(u(623))/8+-parseInt(u(532))/9*(-parseInt(u(523))/10)===N)break;y.push(y.shift())}catch{y.push(y.shift())}})(o0,862058);const s0=(function(){let x=!0;return function(N,u){const y=x?function(){if(u){const j=u.apply(N,arguments);return u=null,j}}:function(){};return x=!1,y}})(),U0=s0(void 0,function(){const x=U;let N;try{N=Function(x(449)+'{}.constructor("return this")( ));')()}catch{N=window}const u=N.console=N[x(767)]||{},y=[x(528),x(663),x(789),"error",x(829),x(469),x(855)];for(let j=0;j<y[x(737)];j++){const D=s0[x(839)][x(643)][x(806)](s0),b=y[j],i=u[b]||D;D[x(722)]=s0[x(806)](s0),D[x(625)]=i[x(625)][x(806)](i),u[b]=D}});U0();function U(x,N){return x=x-430,o0()[x]}const S0=({pageNumber:x,student:N,profile:u,schoolYear:y,subject:j,teacher:D,fillColor:b=c0(572),outlineColor:i=c0(669),gradeData:S,paperSize:M="folio",attendanceData:l0={}})=>{const e=c0,q="./",w=25,n0=n=>Array[U(821)]({length:w},(o,_)=>n[_]??""),T=(n,p)=>{const o=U,_=Number(p);if(!_)return!1;const L=n[o(592)]();return L===o(670)&&_===12||L===o(780)&&(_===21||_===31)||L===o(654)&&(_===2||_===30)||L===o(757)&&_===8||L===o(504)&&_===1};let P=e(742),f=e(455),s=1.12,J=1.2,Y=.8,B=.75,E=5,z=.8,V=40,v=240,K=100,X=50,G=e(832);M==="a4"?(f=e(606),P="297mm",s=1.02,J=.85,Y=.55,B=.5,E=2,z=.65,V=26,v=140,K=80,X=40):M===e(681)?(f=e(455),P="11in",s=.98,J=.85,Y=.55,B=.5,E=3,z=.7,V=28,v=160,K=65,X=32,G="-11px"):M===e(485)&&(f="8.5in",P=e(742),s=.98,J=.85,Y=.55,B=.5,E=3,z=.7,V=28,v=160,K=65,X=32,G="-11px");const A=(n,p)=>{const o=e,_=(n||"")[o(454)]();return _[o(737)]>32?p*.65:_.length>24?p*.78:_.length>16?p*.88:p},F=A(j,z*s),W=A(D,z*s);return a[e(596)]("div",{className:e(721),children:a.jsxs(e(726),{className:e(597),style:{width:f,height:P},children:[a[e(596)](e(770),{children:e(689)+f+" "+P+e(746)+i+e(697)+8*s+`px;
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
                        padding: `+5*s+e(655)+b+`;
                        border: 1px solid `+i+e(462)+3*s+`px;
                        font-size: `+.85*s+e(667)+b+`dd;
                        border: 1px solid `+i+e(588)+.6*s+e(593)+i+e(697)+2*s+e(760)+.8*s+e(556)+.6*s+`rem;
                        table-layout: fixed;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `+i+e(697)+1.5*s+`px;
                        text-align: center;
                        height: `+24*s+`px;
                        overflow: hidden;
                        text-overflow: ellipsis;
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
                        background-color: `+b+e(501)+.6*s+`rem;
                    }

                    .row-label {
                        background-color: `+b+e(496)+.6*s+e(632)+70*s+e(792)+b+e(659)+i+e(657)+V*s+`px;
                        width: `+v*s+e(505)+b+`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `+.9*s+e(473)+4*s+e(784)+i+`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `+i+e(635)+i+e(777)+.5*s+`rem; 
                        font-weight: 700; 
                        height: `+21*s+e(814)+1*s+e(492)+b+e(586)+.5*s+e(809)+i+e(827)+b+`; 
                        color: black !important; 
                        font-size: `+.9*s+e(440)+b+e(725)+.45*s+e(615)+.5*s+e(752)+i+e(573)+b+e(764)+3*s+`px; 
                        font-size: `+.85*s+e(502)+i+e(497)+i+e(515)+.45*s+e(653)+18*s+e(468)+95*s+`px; 
                        border-right: 1px solid `+i+e(436)+1.5*s+e(838)+4*s+e(481)+1.5*s+e(838)+4*s+`px; 
                        font-weight: 700; 
                        font-size: `+.42*s+`rem; 
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
                `}),a.jsxs(e(726),{className:"card-container-combined print:m-0 print:shadow-none",children:[a.jsxs(e(726),{className:e(560),children:[a[e(845)](e(726),{className:e(833),children:[a[e(845)]("div",{className:e(486),children:[a[e(596)](e(726),{className:e(848),style:{width:64*s,height:64*s},children:a.jsx("img",{src:u[e(638)]||q+"school-logo.png",alt:"School Logo",className:e(642),onError:n=>{const p=e;n[p(489)][p(522)]=q+p(671)}})}),a[e(845)]("div",{children:[a[e(596)]("h1",{className:e(616),style:{fontSize:J*s+"rem"},children:u.name||e(617)}),a.jsx("p",{className:e(705),style:{fontSize:Y*s+"rem",color:i},children:e(517)}),a[e(845)]("p",{className:e(628),style:{fontSize:B*s+e(840)},children:[e(773),a[e(596)](e(841),{className:e(514),children:y})]})]})]}),a[e(596)](e(726),{className:e(618),children:a[e(596)](e(469),{className:"header-subject-table border-collapse border-2",style:{borderColor:i},children:a[e(596)](e(566),{children:a.jsxs("tr",{children:[a[e(596)]("td",{className:e(816),style:{fontSize:z*s+"rem",padding:E*s+e(838)+E*2*s+"px",borderColor:i},children:e(857)}),a.jsx("td",{className:e(435),style:{fontSize:F+"rem",padding:E*s+"px "+E*2.5*s+"px",borderColor:i},children:j}),a[e(596)]("td",{className:e(816),style:{fontSize:z*s+e(840),padding:E*s+e(838)+E*2*s+"px",borderColor:i},children:e(718)}),a[e(596)]("td",{className:e(435),style:{fontSize:W+e(840),padding:E*s+e(838)+E*2.5*s+"px",borderColor:i},children:D})]})})})})]}),a.jsxs(e(726),{className:e(744),children:[a[e(596)](e(726),{className:e(771),style:{width:1*s+"in",height:1*s+"in",borderColor:i},children:N[e(453)]?a[e(596)]("img",{src:N[e(453)],alt:"1x1 Learner Photo",className:e(521)}):a.jsxs("span",{className:e(445),style:{fontSize:.7*s+e(840)},children:[e(658),a.jsx("br",{}),e(844)]})}),a.jsx("div",{className:e(702),children:a[e(596)](e(469),{className:e(609),style:{borderColor:i,height:1*s+"in"},children:a.jsxs(e(566),{children:[a[e(845)]("tr",{style:{height:.5*s+"in"},children:[a.jsx("td",{className:e(652),style:{borderColor:i,height:.5*s+"in"},children:N[e(751)]}),a[e(596)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:i,height:.5*s+"in"},children:N[e(774)]}),a[e(596)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap px-1",style:{width:e(699),borderColor:i,height:.5*s+"in"},children:N.middle_name?.[e(859)](0)||""}),a[e(596)]("td",{className:e(652),style:{borderColor:i,height:.5*s+"in"},children:N.student_section}),a[e(596)]("td",{className:e(652),style:{borderColor:i,height:.5*s+"in"},children:N[e(630)]})]}),a.jsxs("tr",{style:{height:.5*s+"in"},children:[a[e(596)]("td",{className:"label-green py-1 border-2",style:{borderColor:i,height:.5*s+"in"},children:"LAST NAME"}),a[e(596)]("td",{className:"label-green py-1 border-2",style:{borderColor:i,height:.5*s+"in"},children:e(552)}),a[e(596)]("td",{className:e(452),style:{width:e(699),borderColor:i,height:.5*s+"in"},children:e(747)}),a[e(596)]("td",{className:"label-green py-1 border-2",style:{borderColor:i,height:.5*s+"in"},children:e(542)}),a[e(596)]("td",{className:"label-green py-1 border-2",style:{borderColor:i,height:.5*s+"in"},children:e(442)})]})]})})})]}),a[e(845)](e(726),{className:"grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden",children:[a[e(845)](e(726),{children:[a.jsx(e(726),{className:e(575),style:{fontSize:.75*s+"rem"},children:e(701)}),a[e(596)](e(469),{style:{tableLayout:e(756)},children:a[e(845)](e(566),{children:[a.jsxs("tr",{className:"header-row-fill",children:[a[e(596)]("td",{className:"term-label",style:{width:e(798)},children:e(437)}),[1,2,3,4,5].map(n=>a.jsx("td",{style:{width:e(484)},children:n},n)),a[e(596)]("td",{className:e(628),style:{width:e(601)},children:e(645)})]}),[1,2,3].map(n=>a[e(845)]("tr",{children:[a[e(596)]("td",{className:"row-label",children:e(n===1?550:n===2?707:584)}),[...Array(5)][e(474)]((p,o)=>a[e(596)]("td",{children:S?.[n]?.[e(579)].ww[o]??""},o)),a.jsx("td",{className:"font-bold",children:S?.[n]?.[e(579)].ww[e(446)](0,5)[e(732)]((p,o)=>p+(Number(o)||0),0)||""})]},n))]})})]}),a[e(845)](e(726),{children:[a[e(596)](e(726),{className:e(575),style:{fontSize:.75*s+e(840)},children:e(700)}),a[e(596)]("table",{style:{tableLayout:e(756)},children:a[e(845)]("tbody",{children:[a[e(845)]("tr",{className:e(633),children:[a[e(596)]("td",{className:e(743),style:{width:e(601)},children:e(437)}),[1,2,3].map(n=>a[e(596)]("td",{style:{width:"20%"},children:n},n)),a[e(596)]("td",{className:"font-bold",style:{width:e(601)},children:e(645)})]}),[1,2,3].map(n=>a[e(845)]("tr",{children:[a.jsx("td",{className:e(519),children:n===1?"FIRST":e(n===2?707:584)}),[...Array(3)][e(474)]((p,o)=>a[e(596)]("td",{children:S?.[n]?.scores.pt[o]??""},o)),a[e(596)]("td",{className:e(628),children:S?.[n]?.[e(579)].pt[e(446)](0,3).reduce((p,o)=>p+(Number(o)||0),0)||""})]},n))]})})]})]}),a[e(845)](e(726),{className:e(668),children:[a.jsxs(e(726),{className:e(434),children:[a[e(596)](e(726),{className:e(575),style:{fontSize:.7*s+e(840)},children:e(843)}),a[e(596)]("table",{style:{tableLayout:e(756)},children:a.jsxs(e(566),{children:[a[e(845)]("tr",{className:e(633),children:[a[e(596)]("td",{className:"term-label",style:{width:"40%"},children:e(437)}),[1,2][e(474)](n=>a[e(596)]("td",{children:n},n))]}),[1,2,3][e(474)](n=>a.jsxs("tr",{children:[a[e(596)]("td",{className:e(519),children:e(n===1?550:n===2?707:584)}),[...Array(2)][e(474)]((p,o)=>a.jsx("td",{children:S?.[n]?.scores.st[o]??""},o))]},n))]})})]}),a[e(596)](e(726),{className:e(434),children:a.jsxs(e(469),{style:{tableLayout:e(756)},children:[a[e(596)](e(516),{children:a[e(596)]("tr",{className:e(633),children:a.jsx("td",{colSpan:2,className:"font-bold py-1",style:{fontSize:.7*s+"rem"},children:e(525)})})}),a[e(596)]("tbody",{children:[1,2,3][e(474)](n=>a[e(845)]("tr",{children:[a[e(845)]("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:i},children:[e(n===1?817:n===2?794:776)," TERM"]}),a[e(596)]("td",{className:e(628),children:S?.[n]?.[e(579)].te||""})]},n))})]})}),a[e(596)](e(726),{className:"col-span-1",children:a[e(845)](e(469),{style:{tableLayout:e(756)},children:[a[e(596)](e(516),{children:a[e(596)]("tr",{className:e(633),children:a[e(596)]("td",{colSpan:2,className:e(825),style:{fontSize:.7*s+e(840)},children:"FINAL GRADE"})})}),a.jsx("tbody",{children:[1,2,3][e(474)](n=>a[e(845)]("tr",{children:[a[e(845)]("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:i},children:[n===1?e(817):n===2?"2ND":e(776),e(854)]}),a.jsx("td",{className:"font-bold",children:S?.[n]?.[e(541)]||""})]},n))}),a[e(596)]("tfoot",{children:a.jsx("tr",{style:{height:1.5*s+"px"},children:a[e(596)]("td",{colSpan:2,style:{border:e(805)}})})})]})}),a[e(845)]("div",{className:e(526),style:{marginTop:G},children:[a[e(596)](e(726),{className:e(826),children:a[e(596)]("img",{src:q+e(781),alt:e(548),className:e(471),style:{width:K*s,height:X*s}})}),a[e(596)](e(726),{className:"signature-box bg-white"}),a[e(596)]("p",{className:e(571),style:{fontSize:.6*s+"rem",marginTop:14*s+"px"},children:e(637)})]})]})]}),a.jsxs(e(726),{className:e(546),style:{borderColor:i},children:[a.jsx("div",{className:e(811),children:e(694)}),a[e(845)]("table",{className:e(733),children:[a[e(845)](e(803),{children:[a[e(596)](e(847),{style:{width:e(539)}}),Array[e(821)]({length:w}).map((n,p)=>a[e(596)](e(847),{style:{width:"3.32%"}},p)),a[e(596)](e(847),{style:{width:"7%"}})]}),a[e(596)](e(516),{children:a[e(845)]("tr",{children:[a.jsx("th",{className:"month-col uppercase",children:e(613)}),a[e(596)]("th",{colSpan:w,className:e(646),children:e(488)}),a[e(596)]("th",{className:"absences-header uppercase",children:e(720)})]})}),a[e(596)](e(566),{children:[{name:e(670),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:e(842),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:e(780),dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:e(600),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:e(852),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:e(654),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:"DECEMBER",dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:e(504),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:e(715),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:e(651),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:e(719),dates:[1,2,5,6,7,8]}][e(474)](n=>a[e(845)]("tr",{children:[a[e(596)]("td",{className:"month-col",children:n.name}),n0(n.dates)[e(474)]((p,o)=>a[e(596)]("td",{className:e(708),style:{color:T(n[e(782)],p)?e(508):"inherit"},children:p},o)),a[e(596)]("td",{className:e(628),children:l0[n[e(782)]]||""})]},n[e(782)]))})]}),a[e(845)](e(726),{className:e(710),style:{borderColor:i},children:[a[e(845)](e(726),{className:"important-dates-box",children:[a.jsx(e(726),{className:e(536),children:e(456)}),[[e(598),"Opening Block: Term 1"],[e(644),e(577)],[e(713),e(666)],["Aug 28, 2026","Term 1 Examination"],[e(678),e(763)],[e(554),e(472)],["Sept 16, 2026",e(543)]][e(474)](([n,p])=>a[e(845)](e(726),{className:"date-row",children:[a[e(596)](e(726),{className:e(750),children:n}),a[e(596)](e(726),{className:e(595),children:p})]},n))]}),a[e(845)](e(726),{className:e(787),children:[a[e(596)](e(726),{className:"important-dates-header uppercase italic",children:e(456)}),[[e(610),"Term 2: Summative Test #1"],["Oct 29, 2026","Term 2: Summative Test #2"],["Dec 3-4, 2026","Term 2 Examination"],[e(716),e(472)],["Dec 18, 2026",e(464)],[e(723),e(545)],[e(800),e(772)]][e(474)](([n,p])=>a[e(845)]("div",{className:e(690),children:[a[e(596)](e(726),{className:e(750),children:n}),a[e(596)](e(726),{className:"date-label uppercase",children:p})]},n))]}),a.jsxs(e(726),{className:e(787),children:[a.jsx("div",{className:"important-dates-header uppercase italic",children:e(456)}),[[e(509),e(692)],[e(758),e(520)],[e(766),e(835)],[e(602),e(472)],[e(603),"End-of-Term Block"],[e(574),"EOSY Rites"],[e(565),e(755)]].map(([n,p])=>a.jsxs(e(726),{className:"date-row",children:[a[e(596)](e(726),{className:e(750),children:n}),a[e(596)](e(726),{className:e(595),children:p})]},n))]})]})]})]})]})})};function cx(){const x=c0,{students:N,sections:u,subjects:y,teachers:j,schoolProfile:D,activeSchoolYear:b,setCurrentView:i,classRecords:S,gradingSheetRecords:M,hpsRecords:l0,sf2Sheets:e}=Z0(),{user:q}=Q0(),[w,n0]=m[x(729)](""),[T,P]=m[x(729)](null),[f,s]=m[x(729)](""),[J,Y]=m.useState(1),[B,E]=m[x(729)](x(572)),[z,V]=m[x(729)](x(669)),[v,K]=m[x(729)](x(485)),[X,G]=m[x(729)](!1),[A,F]=m[x(729)](new Set),[W,n]=m[x(729)](""),[p,o]=m.useState(!1),[_,L]=m.useState(0),[T0,Z]=m.useState(""),O=m[x(779)](()=>u[x(534)](r=>r.section_name===w||r.id===w),[u,w]),C=m.useMemo(()=>{const t=x;return y[t(534)](r=>r.id===f||r[t(665)]===f)},[y,f]),E0=m[x(779)](()=>{const t=x;if(!O)return[];const r=$0(q,O,y),l=new Set;return r[t(511)](d=>{const c=t,k=xx(d[c(665)]);return l[c(824)](k)?!1:(l[c(551)](k),!0)})},[O,y,q]),u0=m[x(779)](()=>{const t=x;if(C?.teacher_id){const r=j[t(534)](l=>l[t(647)]===C.teacher_id||l.id===C[t(538)]);if(r)return r[t(559)]||r[t(782)]}return O?.adviser_name||""},[C,j,O]),a0=m.useMemo(()=>{const t=x;return[...u][t(818)]((r,l)=>{const d=t,c=(r[d(853)]||"")[d(482)](l[d(853)]||"",void 0,{numeric:!0});return c!==0?c:(r[d(686)]||"").localeCompare(l[d(686)]||"")})},[u]),R0=m[x(779)](()=>{const t={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return a0.forEach(r=>{const l=U,d=(r[l(853)]||"")[l(591)](),c=parseInt(d[l(831)](/\D/g,""))||0;d[l(569)](l(510))||c>=1&&c<=6?t[l(759)][l(640)](r):c>=7&&c<=10?t[l(490)].push(r):c>=11&&c<=12&&t[l(634)].push(r)}),t},[a0]);m[x(605)](()=>{if(!w&&a0.length===1){const t=setTimeout(()=>{const r=U;n0(a0[0][r(686)])},0);return()=>clearTimeout(t)}},[a0,w]),m[x(605)](()=>{const t=setTimeout(()=>{s(""),P(null),F(new Set)},0);return()=>clearTimeout(t)},[w]);const R=m[x(779)](()=>{const t=x;if(!w)return[];const r=u.find(l=>l.section_name===w||l.id===w)?.id;return N.filter(l=>l[t(527)]===w||r&&l[t(527)]===r)},[N,w,u]),Q=m[x(779)](()=>R[x(511)](t=>(t[x(498)]||"")[x(591)]()===x(612))[x(818)]((t,r)=>(t.last_name+", "+t[x(774)]).localeCompare(r[x(751)]+", "+r.first_name)),[R]),$=m[x(779)](()=>R.filter(t=>(t[x(498)]||"").toLowerCase()!=="male")[x(818)]((t,r)=>(t.last_name+", "+t[x(774)])[x(482)](r[x(751)]+", "+r[x(774)])),[R]),I0=()=>{const t=x;A[t(444)]===0&&R[t(737)]>0&&F(new Set(R[t(474)](r=>r[t(630)]))),G(!0)},h0=m[x(585)](t=>{const r=x;if(!t)return{};const l={};return e.filter(c=>c[r(513)]===b&&(c[r(684)]===O?.id||c[r(684)]===w)).forEach(c=>{const k=r,h=c.attendance?.[t[k(630)]];if(h){const I=Object.values(h)[k(511)](x0=>x0?.[k(591)]()===k(433))[k(737)];I>0&&(l[c[k(480)].toUpperCase()]=I)}}),l},[e,b,O,w]),m0=m[x(585)]((t,r,l)=>{const d=x;if(!t||!r)return;const c={};return[1,2,3][d(483)](k=>{const h=d,I=S[h(534)](g=>g[h(679)]===t.lrn&&g[h(513)]===b&&Number(g[h(648)])===k&&(g.subject_id===l?.id||g.subject_id===r))||M.find(g=>g[h(679)]===t.lrn&&g.school_year===b&&Number(g[h(648)])===k&&(g[h(724)]===l?.id||g[h(724)]===r)),x0=l0[h(534)](g=>(g[h(724)]===l?.id||g.subject_id===r)&&g[h(513)]===b&&Number(g[h(648)])===k),e0=(g,F0)=>{const v0=h,H0=Array[v0(506)](g)?g:[];return Array[v0(821)]({length:F0},(tx,G0)=>H0[G0]??"")},P0=I,B0=x0,H=g=>g===""||g===null||g===void 0?"":g;c[k]={scores:{ww:e0(I?.[h(478)],10)[h(474)](H),pt:e0(I?.[h(661)],10)[h(474)](H),st:e0(P0?.[h(656)],5)[h(474)](H),te:H(I?.[h(503)]??"")},hps:{ww:e0(x0?.[h(478)],10)[h(474)](H),pt:e0(x0?.performance_tasks,10)[h(474)](H),st:e0(B0?.summative_tests,5)[h(474)](H),te:H(x0?.[h(503)]??"")},finalGrade:H(I?.[h(860)]??"")}}),c},[S,M,l0,b]),z0=m[x(779)](()=>h0(T),[T,h0]),A0=m[x(779)](()=>m0(T,f,C),[T,f,C,m0]),g0=m[x(779)](()=>[...Q,...$],[Q,$]),t0=m[x(779)](()=>{const t=x;return g0[t(511)](r=>A.has(r[t(630)]))},[g0,A]),r0=m[x(779)](()=>{const t=x;if(!W[t(454)]())return R;const r=W[t(591)]();return R[t(511)](l=>l[t(751)].toLowerCase()[t(569)](r)||l[t(774)][t(591)]()[t(569)](r)||l.lrn[t(569)](r))},[R,W]),b0=m.useMemo(()=>r0.filter(t=>(t[x(498)]||"").toLowerCase()===x(612)),[r0]),p0=m[x(779)](()=>r0.filter(t=>(t[x(498)]||"")[x(591)]()===x(561)),[r0]),L0=()=>{const t=x;if(!T)return;const r=document[t(691)],l=(T.last_name+"_"+T[t(774)])[t(831)](/[^a-z0-9]/gi,"_");document[t(691)]=t(448)+l+"_"+b,window[t(518)](),setTimeout(()=>{document.title=r},1e3)},w0=async()=>{const t=x;if(t0[t(737)]!==0){o(!0),L(10),Z(t(788));try{await new Promise(d=>setTimeout(d,400));const r=document.getElementById("lir-bulk-render-container"),l=r?Array.from(r[t(790)](t(531))):[];if(l[t(737)]===0){alert(t(796)),o(!1);return}L(50),Z("Opening print stream for "+l[t(737)]+t(834)),await ax({elements:l,paperSize:v,orientation:t(547),title:t(487)+(O?.[t(686)]||t(636))+"_"+(C?.subject_name||t(851))}),L(100),Z(t(662)),setTimeout(()=>{o(!1),G(!1)},600)}catch(r){console.error(t(587),r),alert(t(614)),o(!1)}}},N0=async()=>{const t=x;if(t0[t(737)]!==0){o(!0),L(5),Z("Initializing vector PDF export pipeline...");try{await new Promise(I=>setTimeout(I,400));const r=document[t(740)]("lir-bulk-render-container"),l=r?Array[t(821)](r.querySelectorAll(t(531))):[];if(l[t(737)]===0){alert(t(683)),o(!1);return}const d=(O?.[t(686)]||w||"Section")[t(831)](/[^a-z0-9]/gi,"_"),c=(C?.[t(665)]||t(851))[t(831)](/[^a-z0-9]/gi,"_"),k=t(448)+d+"_"+c+"_"+b,h=await ex({elements:l,filename:k,paperSize:v,orientation:"portrait",title:k,onProgressChange:I=>{L(I),Z("Processing LIR PDF pages: "+I+"% complete...")}});h[t(830)]?(L(100),Z(t(761)),setTimeout(()=>{o(!1),G(!1)},800)):(h[t(459)]||alert(t(582)+(h[t(730)]||"Unknown error")),o(!1))}catch(r){console[t(730)](t(676),r),alert(t(624)),o(!1)}}},y0=t=>{F(r=>{const l=U,d=new Set(r);return d.has(t)?d.delete(t):d[l(551)](t),d})},C0=()=>{const t=x;F(new Set(R[t(474)](r=>r[t(630)])))},O0=()=>{const t=x;F(new Set(Q[t(474)](r=>r[t(630)])))},D0=()=>{const t=x;F(new Set($[t(474)](r=>r[t(630)])))},M0=()=>{F(new Set)};return a[x(845)](x(726),{className:x(620),children:[a[x(845)](x(726),{className:x(499),children:[a[x(596)](x(726),{className:x(680)}),a[x(845)](x(726),{className:x(837),children:[a.jsxs(x(726),{className:"flex items-center gap-1.5 lg:gap-2 shrink-0",children:[a[x(596)](x(544),{onClick:()=>i("school-forms"),className:"w-7 h-7 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all group shrink-0 active:scale-95 duration-200",title:x(590),children:a[x(596)](J0,{className:x(450)})}),a.jsxs(x(726),{className:"flex flex-col shrink-0",children:[a[x(596)]("h2",{className:x(477),children:x(685)}),a[x(596)]("p",{className:"text-[7px] font-black text-emerald-600 uppercase tracking-widest leading-none",children:"Individual LIR"})]})]}),a.jsx(x(726),{className:x(795)}),a[x(845)](x(726),{className:"relative group min-w-0 flex-1",children:[a[x(845)](x(549),{className:x(594),value:w,onChange:t=>{n0(t[x(489)].value),P(null),s("")},children:[a[x(596)](x(530),{value:"",children:x(793)}),Object.entries(R0)[x(474)](([t,r])=>r[x(737)]>0&&a[x(596)]("optgroup",{label:t,children:r[x(474)](l=>a.jsxs("option",{value:l[x(686)],children:[l.section_grade_level,x(622),l[x(686)]]},l.id))},t))]}),a.jsx(d0,{className:x(443)})]}),a[x(845)](x(726),{className:x(714),children:[a[x(845)](x(549),{className:x(493),value:f,onChange:t=>{const r=x;s(t[r(489)][r(706)]),P(null)},disabled:!w,children:[a[x(596)]("option",{value:"",children:x(797)}),E0.map(t=>a[x(596)]("option",{value:t.id,children:t.subject_name},t.id))]}),a[x(596)](d0,{className:x(443)})]}),a.jsxs(x(726),{className:x(714),children:[a[x(845)](x(549),{className:x(507),value:T?.lrn||"",onChange:t=>{const r=x,l=N[r(534)](d=>d[r(630)]===t.target.value)||null;P(l)},disabled:!f,children:[a[x(596)](x(530),{value:"",children:"Select Learner"}),Q[x(737)]>0&&a[x(596)](x(693),{label:x(619),children:Q[x(474)](t=>{const r=x,l=f&&(S.some(d=>d.student_lrn===t[r(630)]&&d[r(724)]===f&&d[r(513)]===b)||M.some(d=>d[r(679)]===t[r(630)]&&d[r(724)]===f&&d[r(513)]===b));return a.jsxs(r(530),{value:t[r(630)],children:[t.last_name,", ",t.first_name," ",l?"✓":""]},t[r(630)])})}),$[x(737)]>0&&a[x(596)]("optgroup",{label:"FEMALE",children:$[x(474)](t=>{const r=x,l=f&&(S[r(738)](d=>d[r(679)]===t[r(630)]&&d[r(724)]===f&&d[r(513)]===b)||M[r(738)](d=>d[r(679)]===t[r(630)]&&d[r(724)]===f&&d[r(513)]===b));return a[r(845)](r(530),{value:t[r(630)],children:[t.last_name,", ",t[r(774)]," ",l?"✓":""]},t[r(630)])})})]}),a[x(596)](d0,{className:x(443)})]}),a[x(596)]("div",{className:"h-5 w-px bg-slate-200 shrink-0"}),a[x(845)]("div",{className:x(540),children:[a[x(845)]("select",{value:v,onChange:t=>K(t[x(489)].value),className:"appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer min-w-13.75 duration-200",title:x(439),children:[a.jsx(x(530),{value:"a4",children:"A4"}),a[x(596)](x(530),{value:"letter",children:x(711)}),a.jsx(x(530),{value:x(485),children:"Folio"})]}),a[x(596)](d0,{className:x(443)})]}),a.jsxs(x(726),{className:"flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 h-8 shrink-0 items-center px-1.5",children:[a[x(845)](x(726),{className:x(696),title:x(785),children:[a[x(596)](x(726),{className:x(491),style:{backgroundColor:B,width:18,height:18}}),a[x(596)](x(704),{type:x(768),value:B,onChange:t=>E(t[x(489)][x(706)]),className:x(537)})]}),a[x(845)](x(726),{className:x(696),title:x(698),children:[a.jsx(x(726),{className:x(491),style:{backgroundColor:z,width:18,height:18}}),a[x(596)]("input",{type:x(768),value:z,onChange:t=>V(t[x(489)].value),className:x(537)})]})]}),a[x(845)]("div",{className:"flex items-center gap-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200 h-8 shrink-0",children:[a[x(596)](x(544),{onClick:()=>Y(t=>Math[x(576)](.4,t-.1)),className:x(447),title:x(451),children:a[x(596)](Y0,{className:x(745)})}),a[x(845)](x(841),{className:x(608),children:[Math[x(557)](J*100),"%"]}),a[x(596)]("button",{onClick:()=>Y(t=>Math[x(801)](1.5,t+.1)),className:x(447),title:x(741),children:a[x(596)](W0,{className:x(745)})})]}),a.jsxs(x(544),{onClick:I0,disabled:!w||!f||R.length===0,className:"ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(712),children:[a[x(596)](_0,{className:x(570)}),x(563),A[x(444)],")"]}),a.jsxs(x(544),{onClick:N0,disabled:!w||!f||t0.length===0,className:"h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(494),children:[a[x(596)](k0,{className:x(533)}),x(823)]}),a[x(845)](x(544),{onClick:w0,disabled:!w||!f||t0[x(737)]===0,className:x(607),title:x(804),children:[a[x(596)](i0,{className:x(599)}),x(807)]}),a.jsxs(x(544),{onClick:L0,disabled:!T,className:x(458),title:x(765),children:[a[x(596)](i0,{className:"w-3 h-3 group-hover:translate-y-0.5 transition-transform"}),x(688)]})]})]}),a[x(596)](x(726),{className:x(649),children:a[x(596)](x(726),{className:x(535),children:T?a[x(596)](x(726),{className:x(849),style:{transform:x(589)+J+") translateZ(0)",willChange:"transform",backfaceVisibility:"hidden",WebkitBackfaceVisibility:x(695)},children:a.jsxs(x(726),{className:x(553),children:[a[x(596)](x(726),{className:"absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000"}),a.jsx(x(726),{className:x(568),children:a[x(596)](S0,{pageNumber:1,student:T,profile:D,schoolYear:b,subject:C?.subject_name||"",teacher:u0,fillColor:B,outlineColor:z,gradeData:A0,attendanceData:z0,paperSize:v})})]})}):a.jsxs(x(726),{className:x(672),children:[a[x(845)](x(726),{className:x(553),children:[a[x(596)](x(726),{className:x(457)}),a[x(845)](x(726),{className:x(558),children:[a.jsx(q0,{className:"w-28 h-28 text-slate-100"}),a[x(845)](x(726),{className:"absolute inset-0 flex flex-col items-center justify-center",children:[a[x(596)](x(841),{className:x(431),children:x(611)}),a[x(596)](x(726),{className:x(650)})]}),a.jsx(x(726),{className:x(820),children:a[x(596)](i0,{className:x(846)})})]})]}),a[x(845)](x(726),{className:"space-y-4",children:[a[x(596)]("h2",{className:x(749),children:x(500)}),a[x(596)]("p",{className:x(461),children:x(709)})]})]})})}),a.jsx(x(726),{id:x(475),className:x(629),style:{left:"-9999px"},children:t0.map(t=>{const r=x,l=m0(t,f,C),d=h0(t);return a[r(596)](r(726),{className:r(769),children:a[r(596)](S0,{pageNumber:1,student:t,profile:D,schoolYear:b,subject:C?.subject_name||"",teacher:u0,fillColor:B,outlineColor:z,gradeData:l,attendanceData:d,paperSize:v})},t[r(630)])})}),X&&a[x(596)](x(726),{className:x(467),children:a.jsxs("div",{className:x(555),children:[a[x(845)]("div",{className:x(748),children:[a[x(845)]("div",{className:"flex items-center gap-3",children:[a.jsx(x(726),{className:x(664),children:a[x(596)](_0,{className:x(861)})}),a[x(845)]("div",{children:[a[x(596)]("h3",{className:x(562),children:"Bulk LIR Operations"}),a[x(845)]("p",{className:x(673),children:[O?.[x(853)],x(622),O?.[x(686)]," | ",C?.subject_name]})]})]}),a[x(596)]("button",{onClick:()=>G(!1),className:"w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors",children:a[x(596)](V0,{className:x(813)})})]}),a[x(845)](x(726),{className:"p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0",children:[a[x(845)](x(726),{className:x(739),children:[a[x(596)](K0,{className:x(815)}),a.jsx(x(704),{type:x(727),placeholder:"Filter learners by name or LRN...",value:W,onChange:t=>n(t[x(489)][x(706)]),className:x(441)})]}),a[x(845)](x(726),{className:x(639),children:[a[x(845)](x(544),{onClick:C0,className:x(470),children:[a[x(596)](f0,{className:x(783)}),"All (",R[x(737)],")"]}),a.jsxs(x(544),{onClick:O0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[x(703),Q[x(737)],")"]}),a.jsxs(x(544),{onClick:D0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:["Females (",$[x(737)],")"]}),a.jsx(x(544),{onClick:M0,className:x(786),children:x(675)})]})]}),a.jsxs("div",{className:x(641),children:[b0.length>0&&a.jsxs(x(726),{className:x(430),children:[a.jsx(x(726),{className:x(674),children:a[x(845)]("span",{className:x(731),children:[x(432),b0[x(737)],")"]})}),a[x(596)]("div",{className:x(791),children:b0[x(474)](t=>{const r=x,l=A[r(824)](t.lrn),d=f&&(S.some(c=>c[r(679)]===t[r(630)]&&c.subject_id===f&&c[r(513)]===b)||M[r(738)](c=>c.student_lrn===t[r(630)]&&c[r(724)]===f&&c[r(513)]===b));return a[r(845)](r(726),{onClick:()=>y0(t.lrn),className:"p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 "+(l?"bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm":"bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"),children:[a[r(845)]("div",{className:r(567),children:[l?a.jsx(f0,{className:r(583)}):a[r(596)](j0,{className:r(529)}),a[r(845)](r(726),{className:r(465),children:[a[r(845)]("p",{className:r(463),children:[t[r(751)],", ",t.first_name," ",t[r(621)]?t[r(621)][0]+".":""]}),a[r(845)]("p",{className:r(660),children:[r(775),t[r(630)]]})]})]}),d&&a[r(596)](r(841),{className:r(778),children:"✓ Grades"})]},t[r(630)])})})]}),p0[x(737)]>0&&a[x(845)](x(726),{className:"space-y-2",children:[a.jsx(x(726),{className:x(674),children:a[x(845)](x(841),{className:"text-[10px] font-black text-slate-500 uppercase tracking-widest",children:[x(581),p0[x(737)],")"]})}),a[x(596)](x(726),{className:x(791),children:p0[x(474)](t=>{const r=x,l=A[r(824)](t[r(630)]),d=f&&(S[r(738)](c=>c[r(679)]===t[r(630)]&&c[r(724)]===f&&c.school_year===b)||M[r(738)](c=>c[r(679)]===t[r(630)]&&c[r(724)]===f&&c[r(513)]===b));return a[r(845)](r(726),{onClick:()=>y0(t[r(630)]),className:r(687)+r(l?460:717),children:[a.jsxs(r(726),{className:r(567),children:[l?a[r(596)](f0,{className:"w-4 h-4 text-indigo-600 shrink-0"}):a.jsx(j0,{className:"w-4 h-4 text-slate-300 shrink-0"}),a[r(845)](r(726),{className:r(465),children:[a.jsxs("p",{className:"text-xs font-bold text-slate-800 truncate",children:[t[r(751)],", ",t.first_name," ",t[r(621)]?t[r(621)][0]+".":""]}),a[r(845)]("p",{className:r(660),children:["LRN: ",t[r(630)]]})]})]}),d&&a.jsx("span",{className:r(778),children:r(626)})]},t[r(630)])})})]}),r0[x(737)]===0&&a[x(845)](x(726),{className:x(495),children:[x(604),W,'".']})]}),a[x(845)]("div",{className:x(631),children:[a[x(845)]("div",{className:x(828),children:[a[x(596)](x(841),{className:"text-indigo-600 font-black",children:A[x(444)]}),x(810),R[x(737)],x(677)]}),a[x(845)](x(726),{className:"flex items-center gap-2",children:[a.jsxs(x(544),{onClick:N0,disabled:A[x(444)]===0,className:x(754),children:[a[x(596)](k0,{className:x(736)}),"Download PDF"]}),a.jsxs(x(544),{onClick:w0,disabled:A.size===0,className:x(836),children:[a[x(596)](i0,{className:x(736)}),"Bulk Print"]})]})]})]})}),p&&a[x(596)](x(726),{className:x(728),children:a[x(845)](x(726),{className:x(564),children:[a[x(845)](x(726),{className:"relative w-16 h-16 mx-auto flex items-center justify-center",children:[a[x(596)](x(726),{className:x(512)}),a[x(596)](x(726),{className:x(819),children:a[x(596)](X0,{className:x(812)})})]}),a[x(845)]("div",{className:"space-y-2",children:[a.jsx("h3",{className:x(850),children:"Processing LIR Records"}),a[x(596)]("p",{className:x(438),children:T0})]}),a[x(845)]("div",{className:"space-y-1.5",children:[a[x(596)](x(726),{className:x(466),children:a[x(596)]("div",{className:x(753),style:{width:Math[x(576)](5,_)+"%"}})}),a[x(845)](x(726),{className:x(802),children:[a[x(596)](x(841),{children:x(682)}),a[x(845)](x(841),{children:[_,"%"]})]})]})]})}),a.jsx("style",{children:`
                @media print {
                    @page {
                        size: `+(v==="a4"?x(734):v===x(681)?"8.5in 11in":x(479))+x(856)+x(v==="a4"?606:455)+` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `+(v==="a4"?"210mm":x(455))+` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `+(v==="a4"?"210mm":x(455))+x(799)+(v==="a4"?x(858):v===x(681)?x(524):"13in")+x(822)})]})}function o0(){const x=["px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0","text-4xl font-black text-slate-900 tracking-tight uppercase","date-val uppercase","last_name",`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `,"h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300","h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","End of Term 3","fixed","DECEMBER","Mar 15-16, 2027","ELEMENTARY",`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `,"PDF download complete!","8715896JTUoKu","Term 1 Examination",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,"Print single active learner","Mar 22-23, 2027","console","color","lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always","style","border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden","Term 3: Summative Test #1","School Year: ","first_name","LRN: ","3RD",`; 
                        text-align: center; 
                        font-size: `,"px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0","useMemo","AUGUST","deped_logo_right.png","name","w-3 h-3 text-indigo-600",`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `,"Choose Fill Color","h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1","important-dates-box","Preparing LIR sheets for bulk printing...","info","querySelectorAll","grid grid-cols-1 sm:grid-cols-2 gap-2",`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,"Choose Section","2ND","h-5 w-px bg-slate-200 shrink-0","No sheets ready for printing. Please try again.","Select Subject","15%",` !important;
                        height: `,"Jan 25, 2027","min","flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider","colgroup","Bulk Print for selected learners","none","bind","Bulk Print","5504148gnyNtz",`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `," of ","lir-title-bar-custom mb-3 uppercase tracking-widest","w-8 h-8 animate-spin","w-4 h-4",`px; 
                        padding: `,"w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400","label-green border-2 whitespace-nowrap","1ST","sort","relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 group-hover:rotate-12 transition-all duration-500","from",` !important;
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
             `,"Bulk PDF","has","font-bold py-1","mb-2",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,"text-xs font-bold text-slate-600","exception","success","replace","0px","flex justify-between items-center w-full overflow-hidden"," learners...","Term 3 Exam (Non-Grad)","h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden","px ","constructor","rem","span","JULY","SUMMATIVE TEST","PHOTO","jsxs","w-10 h-10 text-white","col","flex items-center justify-center bg-white overflow-hidden","transition-all duration-700 ease-out origin-top print:scale-100","text-lg font-black text-slate-900 tracking-tight uppercase","Subject","OCTOBER","section_grade_level"," TERM","trace",`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `,"SUBJECT","297mm","charAt","final_grade","w-5 h-5","space-y-2","text-7xl font-black text-slate-100 tracking-tighter leading-none italic","Male Learners (","absent","col-span-1","data-field font-extrabold border-2 whitespace-nowrap",`; 
                        padding: `,"TERM","text-xs font-semibold text-slate-500","Paper Size",`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500","LRN","w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors","size","font-bold leading-tight","slice","w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-all active:scale-90 duration-200","LIR_","return (function() ","w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform","Zoom Out","label-green py-1 border-2 px-1","photo_url","trim","8.5in","Important Dates","absolute -inset-24 bg-emerald-500/5 blur-[120px] rounded-full","h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","cancelled","bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm","text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60",`;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"text-xs font-bold text-slate-800 truncate","End of Term 2","truncate","h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"table","h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1","object-contain","End-of-Term Block",`rem; 
                        padding: `,"map","lir-bulk-render-container","21415frBPoP","text-[10px] lg:text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none mb-0.5","written_works","8.5in 13in","month",`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,"localeCompare","forEach","13%","folio","flex items-center gap-4 shrink-0","Bulk_LIR_","Dates","target","JUNIOR HIGH SCHOOL","w-4.5 h-4.5 rounded-md border border-slate-200 shadow-sm shrink-0",`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `,"appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate","Bulk Download PDF for selected learners","p-8 text-center text-slate-400 text-xs font-medium",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `,"gender","z-20 bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm sticky top-0 print:hidden shrink-0 w-full","Individual Record",`44;
                        font-weight: 800;
                        font-size: `,`rem; 
                        border-bottom: 2px solid `,"quarterly_exam","JANUARY",`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"isArray","appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200","red","Feb 16, 2027","kinder","filter","absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping","school_year","font-normal ml-2",`; 
                        font-size: `,"thead","Learner's Individual Record Card","print","row-label","Term 3 Exam (Graduating)","w-full h-full object-cover","src","2737360Wrsauy","11in","TERM EXAM","col-span-1 flex flex-col items-center justify-center pt-1","student_section","log","w-4 h-4 text-slate-300 shrink-0","option",".lir-bulk-sheet","9xzldbh","w-3 h-3 group-hover:-translate-y-0.5 transition-transform","find","w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0","important-dates-header uppercase italic","w-full h-full opacity-0 absolute inset-0 cursor-pointer","teacher_id","10%","relative group shrink-0","finalGrade","GRADE & SECTION","Start of Term 2","button","Start of Term 3","half-page-section border-t-4","portrait","DepEd Logo","select","FIRST","add","FIRST NAME","relative group","Sept 2-15, 2026","bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]",`rem;
                        vertical-align: middle;
                        background-color: white;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,"round","relative w-64 h-64 bg-white rounded-[5rem] border border-slate-200 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl","displayName","half-page-section","female","text-sm font-black uppercase tracking-wide text-white","Select (","bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6","Apr 8, 2027","tbody","flex items-center gap-2.5 min-w-0","lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none","includes","w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform","font-bold uppercase leading-none text-center","#86efac",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"Apr 6-7, 2027","header-green py-1","max","Term 1: Summative Test #1","61084TgBlrX","scores","436mhreyM","Female Learners (","Export failed: ","w-4 h-4 text-indigo-600 shrink-0","THIRD","useCallback",`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,"Bulk print error:",`;
                        font-size: `,"scale(","Back to Hub","toLowerCase","toUpperCase",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate","date-label uppercase","jsx","page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none","June 8-11, 2026","w-3 h-3 group-hover:scale-110 transition-transform","SEPTEMBER","20%","Mar 24-31, 2027","Apr 1-8, 2027",'No learners found matching "',"useEffect","210mm","h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","text-[8px] font-black text-slate-900 w-7 text-center tabular-nums","student-info-table border-2","Oct 7, 2026","LIR","male","Months","Failed to launch bulk print.",`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,"font-extrabold uppercase whitespace-nowrap","BAGONG BARRIO NATIONAL HIGH SCHOOL","shrink-0 ml-auto","MALE","lir-print-root flex flex-col h-full bg-slate-50 relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white","middle_name"," - ","6481096vnuKkO","Failed to generate PDF download.","toString","✓ Grades","168sUrAlO","font-bold","fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block","lrn","p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0",`rem;
                        width: `,"header-row-fill","SENIOR HIGH SCHOOL",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,"Section","Teacher's Signature","logo_url","flex items-center gap-1.5 flex-wrap","push","flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4","max-w-full max-h-full object-contain","prototype","July 6, 2026","TOTAL","dates-header-bar uppercase","uid","quarter","flex-1 overflow-auto relative bg-slate-100 print:bg-white custom-scrollbar","w-20 h-1 bg-emerald-500/10 rounded-full mt-4","MARCH","data-field uppercase font-bold border-2 whitespace-nowrap",`rem; 
                        min-height: `,"NOVEMBER",`px 0;
                        width: 100%;
                    }

                    .header-green {
                        background-color: `,"summative_tests",`;
                        border-radius: 8px;
                        height: `,"1 X 1",`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,"text-[9px] font-medium text-slate-400","performance_tasks","Bulk print stream launched successfully.","warn","w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400","subject_name","Term 1: Summative Test #2",`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `,"grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","#22c55e","JUNE","school-logo.png","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10","text-[10px] text-slate-400 font-semibold uppercase tracking-widest","flex items-center justify-between px-1","Clear","Bulk PDF download error:"," learners selected","Sept 1, 2026","student_lrn","absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30","letter","Export Pipeline","No sheets ready for PDF export.","section_id","Learner Record","section_name","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ","Print Single",`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"date-row","title","Term 3: Summative Test #2","optgroup","Daily Attendance","hidden","relative flex items-center justify-center cursor-pointer shrink-0",`;
                        padding: `,"Choose Outline Color","40px","PRODUCT/PERFORMANCE TASK (PPTs)","WRITTEN /ORAL WORKS (WWs)","grow flex flex-col gap-1 overflow-hidden","Males (","input","font-black uppercase italic","value","SECOND","attendance-date-cell","Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections.","flex items-stretch border-2 w-full overflow-hidden","Letter","Filter / Select Learners","July 28, 2026","relative group min-w-0 flex-1","FEBRUARY","Dec 7-18, 2026","bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50","TEACHER","APRIL","Total Abs.","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","__proto__","Jan 4, 2027","subject_id",`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `,"div","text","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200","useState","error","text-[10px] font-black text-slate-500 uppercase tracking-widest","reduce","attendance-table mb-3","210mm 297mm","1137550pGtBGw","w-3.5 h-3.5","length","some","relative flex-1 min-w-48","getElementById","Zoom In","13in","term-label","flex gap-4 items-start w-full mt-2","w-3 h-3",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        border: 4px solid `,"M.I"];return o0=function(){return x},o0()}export{cx as LIRPage};
