import{j as a,r as h,cq as J0,bH as i0,cA as Y0,c9 as q0,be as k0,bO as v0,cc as d0,cz as V0,bs as W0,dn as Z0,cB as b0,cC as _0,bE as K0}from"./vendor-D807hmOL.js";import{b as Q0,u as X0,h as $0,n as xx}from"./index-CWCwHKk5.js";import{e as ex,p as ax}from"./pdf-export-B_wPBXib.js";import"./vendor-pdf-libs-BVl_U1Kq.js";import"./vendor-firebase-CEUkPUSI.js";import"./vendor-framer-motion-ByrjgV2f.js";const p0=V;(function(x,y){const u=V,k=x();for(;;)try{if(-parseInt(u(509))/1*(-parseInt(u(496))/2)+parseInt(u(626))/3+parseInt(u(288))/4+parseInt(u(355))/5*(-parseInt(u(247))/6)+-parseInt(u(581))/7*(parseInt(u(429))/8)+parseInt(u(580))/9+-parseInt(u(226))/10===y)break;k.push(k.shift())}catch{k.push(k.shift())}})(c0,966262);const s0=(function(){let x=!0;return function(y,u){const k=x?function(){const j=V;if(u){const I=u[j(401)](y,arguments);return u=null,I}}:function(){};return x=!1,k}})(),G0=s0(void 0,function(){const x=V;let y;try{y=Function(x(556)+x(222)+");")()}catch{y=window}const u=y.console=y[x(500)]||{},k=[x(262),"warn",x(482),"error",x(254),"table","trace"];for(let j=0;j<k[x(220)];j++){const I=s0[x(271)].prototype[x(591)](s0),f=k[j],d=u[f]||I;I.__proto__=s0[x(591)](s0),I[x(256)]=d[x(256)][x(591)](d),u[f]=I}});G0();function V(x,y){return x=x-204,c0()[x]}const j0=({pageNumber:x,student:y,profile:u,schoolYear:k,subject:j,teacher:I,fillColor:f="#86efac",outlineColor:d=p0(379),gradeData:S,paperSize:M="folio",attendanceData:l0={}})=>{const e=p0,W="./",w=25,n0=n=>Array[V(611)]({length:w},(c,_)=>n[_]??""),T=(n,m)=>{const c=V,_=Number(m);if(!_)return!1;const O=n[c(501)]();return O===c(574)&&_===12||O===c(583)&&(_===21||_===31)||O===c(495)&&(_===2||_===30)||O===c(408)&&_===8||O===c(320)&&_===1};let P=e(532),p=e(213),s=1.12,J=1.2,Y=.8,B=.75,E=5,z=.8,Z=40,v=240,K=100,Q=50,U=e(498);M==="a4"?(p=e(309),P=e(557),s=1.02,J=.85,Y=.55,B=.5,E=2,z=.65,Z=26,v=140,K=80,Q=40):M===e(476)?(p="8.5in",P=e(307),s=.98,J=.85,Y=.55,B=.5,E=3,z=.7,Z=28,v=160,K=65,Q=32,U=e(609)):M===e(269)&&(p="8.5in",P=e(532),s=.98,J=.85,Y=.55,B=.5,E=3,z=.7,Z=28,v=160,K=65,Q=32,U=e(609));const L=(n,m)=>{const c=e,_=(n||"")[c(617)]();return _[c(220)]>32?m*.65:_[c(220)]>24?m*.78:_[c(220)]>16?m*.88:m},F=L(j,z*s),q=L(I,z*s);return a[e(497)]("div",{className:e(323),children:a[e(488)](e(374),{className:"page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none",style:{width:p,height:P},children:[a[e(497)](e(289),{children:`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `+p+" "+P+e(442)+d+e(485)+8*s+e(381)+5*s+e(435)+f+e(470)+d+e(554)+3*s+e(575)+.85*s+`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `+f+e(629)+d+`;
                        color: #000000 !important;
                        font-size: `+.6*s+e(499)+d+e(485)+2*s+e(582)+.8*s+e(533)+.6*s+e(584)+d+`;
                        padding: `+1.5*s+e(232)+24*s+`px;
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
                        background-color: `+f+e(620)+.6*s+e(231)+f+e(446)+.6*s+e(376)+70*s+e(273)+f+e(479)+d+e(506)+Z*s+`px;
                        width: `+v*s+e(605)+f+`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `+.9*s+`rem; 
                        padding: `+4*s+`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `+d+e(300)+d+e(561)+d+`; 
                        text-align: center; 
                        font-size: `+.5*s+e(236)+21*s+e(210)+1*s+e(463)+f+e(352)+.5*s+`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `+d+e(616)+f+e(625)+.9*s+e(211)+f+e(276)+.45*s+e(278)+.5*s+e(243)+d+e(543)+f+e(257)+3*s+e(298)+.85*s+e(363)+d+`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `+d+`; 
                        font-size: `+.45*s+e(368)+18*s+e(208)+95*s+e(526)+d+`; 
                        padding: `+1.5*s+"px "+4*s+`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `+1.5*s+e(515)+4*s+`px; 
                        font-weight: 700; 
                        font-size: `+.42*s+e(399)}),a.jsxs("div",{className:e(394),children:[a[e(488)](e(374),{className:e(549),children:[a[e(488)](e(374),{className:"flex justify-between items-center w-full overflow-hidden",children:[a[e(488)](e(374),{className:"flex items-center gap-4 shrink-0",children:[a[e(497)]("div",{className:e(568),style:{width:64*s,height:64*s},children:a[e(497)](e(524),{src:u[e(212)]||W+e(502),alt:e(466),className:e(235),onError:n=>{const m=e;n[m(347)][m(503)]=W+m(502)}})}),a[e(488)]("div",{children:[a[e(497)]("h1",{className:"font-extrabold uppercase whitespace-nowrap",style:{fontSize:J*s+"rem"},children:u[e(384)]||e(415)}),a[e(497)]("p",{className:e(430),style:{fontSize:Y*s+e(383),color:d},children:e(353)}),a[e(488)]("p",{className:e(576),style:{fontSize:B*s+"rem"},children:[e(346),a[e(497)](e(560),{className:e(303),children:k})]})]})]}),a[e(497)](e(374),{className:"shrink-0 ml-auto",children:a[e(497)](e(382),{className:e(464),style:{borderColor:d},children:a[e(497)](e(302),{children:a.jsxs("tr",{children:[a.jsx("td",{className:"label-green border-2 whitespace-nowrap",style:{fontSize:z*s+e(383),padding:E*s+e(515)+E*2*s+"px",borderColor:d},children:e(378)}),a[e(497)]("td",{className:"data-field font-extrabold border-2 whitespace-nowrap",style:{fontSize:F+e(383),padding:E*s+"px "+E*2.5*s+"px",borderColor:d},children:j}),a[e(497)]("td",{className:e(342),style:{fontSize:z*s+e(383),padding:E*s+e(515)+E*2*s+"px",borderColor:d},children:e(214)}),a[e(497)]("td",{className:"data-field font-extrabold border-2 whitespace-nowrap",style:{fontSize:q+"rem",padding:E*s+e(515)+E*2.5*s+"px",borderColor:d},children:I})]})})})})]}),a[e(488)](e(374),{className:e(542),children:[a.jsx(e(374),{className:"border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden",style:{width:1*s+"in",height:1*s+"in",borderColor:d},children:y.photo_url?a[e(497)]("img",{src:y[e(292)],alt:"1x1 Learner Photo",className:e(553)}):a.jsxs(e(560),{className:e(452),style:{fontSize:.7*s+"rem"},children:[e(461),a[e(497)]("br",{}),e(224)]})}),a[e(497)](e(374),{className:e(265),children:a[e(497)](e(382),{className:e(603),style:{borderColor:d,height:1*s+"in"},children:a.jsxs(e(302),{children:[a.jsxs("tr",{style:{height:.5*s+"in"},children:[a[e(497)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:d,height:.5*s+"in"},children:y[e(218)]}),a.jsx("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:d,height:.5*s+"in"},children:y.first_name}),a[e(497)]("td",{className:e(550),style:{width:e(468),borderColor:d,height:.5*s+"in"},children:y[e(570)]?.[e(375)](0)||""}),a[e(497)]("td",{className:e(564),style:{borderColor:d,height:.5*s+"in"},children:y[e(371)]}),a[e(497)]("td",{className:e(564),style:{borderColor:d,height:.5*s+"in"},children:y[e(448)]})]}),a[e(488)]("tr",{style:{height:.5*s+"in"},children:[a[e(497)]("td",{className:"label-green py-1 border-2",style:{borderColor:d,height:.5*s+"in"},children:e(400)}),a.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:d,height:.5*s+"in"},children:e(246)}),a[e(497)]("td",{className:e(264),style:{width:e(468),borderColor:d,height:.5*s+"in"},children:e(372)}),a.jsx("td",{className:e(449),style:{borderColor:d,height:.5*s+"in"},children:"GRADE & SECTION"}),a[e(497)]("td",{className:e(449),style:{borderColor:d,height:.5*s+"in"},children:e(286)})]})]})})})]}),a.jsxs(e(374),{className:e(508),children:[a[e(488)](e(374),{children:[a[e(497)](e(374),{className:e(301),style:{fontSize:.75*s+e(383)},children:e(558)}),a.jsx(e(382),{style:{tableLayout:e(260)},children:a.jsxs(e(302),{children:[a.jsxs("tr",{className:e(250),children:[a.jsx("td",{className:e(534),style:{width:"15%"},children:"TERM"}),[1,2,3,4,5][e(332)](n=>a[e(497)]("td",{style:{width:"13%"},children:n},n)),a[e(497)]("td",{className:e(576),style:{width:e(259)},children:e(473)})]}),[1,2,3][e(332)](n=>a[e(488)]("tr",{children:[a[e(497)]("td",{className:e(483),children:e(n===1?317:n===2?422:631)}),[...Array(5)][e(332)]((m,c)=>a[e(497)]("td",{children:S?.[n]?.[e(569)].ww[c]??""},c)),a[e(497)]("td",{className:"font-bold",children:S?.[n]?.[e(569)].ww[e(559)](0,5)[e(240)]((m,c)=>m+(Number(c)||0),0)||""})]},n))]})})]}),a[e(488)](e(374),{children:[a[e(497)](e(374),{className:e(301),style:{fontSize:.75*s+e(383)},children:e(456)}),a[e(497)](e(382),{style:{tableLayout:e(260)},children:a.jsxs(e(302),{children:[a.jsxs("tr",{className:e(250),children:[a[e(497)]("td",{className:e(534),style:{width:e(259)},children:e(608)}),[1,2,3][e(332)](n=>a[e(497)]("td",{style:{width:e(259)},children:n},n)),a.jsx("td",{className:e(576),style:{width:e(259)},children:"TOTAL"})]}),[1,2,3][e(332)](n=>a.jsxs("tr",{children:[a[e(497)]("td",{className:"row-label",children:n===1?e(317):n===2?"SECOND":e(631)}),[...Array(3)][e(332)]((m,c)=>a[e(497)]("td",{children:S?.[n]?.[e(569)].pt[c]??""},c)),a[e(497)]("td",{className:e(576),children:S?.[n]?.[e(569)].pt[e(559)](0,3)[e(240)]((m,c)=>m+(Number(c)||0),0)||""})]},n))]})})]})]}),a[e(488)](e(374),{className:e(451),children:[a[e(488)](e(374),{className:e(334),children:[a.jsx(e(374),{className:e(301),style:{fontSize:.7*s+e(383)},children:e(447)}),a[e(497)](e(382),{style:{tableLayout:"fixed"},children:a.jsxs(e(302),{children:[a[e(488)]("tr",{className:"header-row-fill",children:[a[e(497)]("td",{className:e(534),style:{width:e(380)},children:e(608)}),[1,2][e(332)](n=>a[e(497)]("td",{children:n},n))]}),[1,2,3][e(332)](n=>a[e(488)]("tr",{children:[a[e(497)]("td",{className:e(483),children:e(n===1?317:n===2?422:631)}),[...Array(2)][e(332)]((m,c)=>a[e(497)]("td",{children:S?.[n]?.[e(569)].st[c]??""},c))]},n))]})})]}),a.jsx(e(374),{className:"col-span-1",children:a.jsxs("table",{style:{tableLayout:"fixed"},children:[a[e(497)]("thead",{children:a.jsx("tr",{className:e(250),children:a[e(497)]("td",{colSpan:2,className:e(426),style:{fontSize:.7*s+e(383)},children:e(529)})})}),a[e(497)](e(302),{children:[1,2,3][e(332)](n=>a.jsxs("tr",{children:[a[e(488)]("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:d},children:[n===1?e(341):n===2?e(344):"3RD",e(252)]}),a[e(497)]("td",{className:e(576),children:S?.[n]?.[e(569)].te||""})]},n))})]})}),a[e(497)](e(374),{className:e(334),children:a.jsxs(e(382),{style:{tableLayout:e(260)},children:[a.jsx("thead",{children:a[e(497)]("tr",{className:"header-row-fill",children:a.jsx("td",{colSpan:2,className:e(426),style:{fontSize:.7*s+e(383)},children:e(586)})})}),a[e(497)]("tbody",{children:[1,2,3][e(332)](n=>a[e(488)]("tr",{children:[a[e(488)]("td",{className:e(377),style:{borderColor:d},children:[n===1?"1ST":n===2?e(344):"3RD"," TERM"]}),a[e(497)]("td",{className:e(576),children:S?.[n]?.finalGrade||""})]},n))}),a[e(497)](e(335),{children:a[e(497)]("tr",{style:{height:1.5*s+"px"},children:a.jsx("td",{colSpan:2,style:{border:"none"}})})})]})}),a[e(488)](e(374),{className:e(412),style:{marginTop:U},children:[a[e(497)](e(374),{className:e(531),children:a.jsx(e(524),{src:W+"deped_logo_right.png",alt:"DepEd Logo",className:"object-contain",style:{width:K*s,height:Q*s}})}),a[e(497)](e(374),{className:e(462)}),a[e(497)]("p",{className:e(390),style:{fontSize:.6*s+e(383),marginTop:14*s+"px"},children:e(607)})]})]})]}),a.jsxs(e(374),{className:e(486),style:{borderColor:d},children:[a.jsx(e(374),{className:e(555),children:"Daily Attendance"}),a[e(488)]("table",{className:"attendance-table mb-3",children:[a[e(488)](e(491),{children:[a.jsx(e(333),{style:{width:"10%"}}),Array[e(611)]({length:w})[e(332)]((n,m)=>a[e(497)]("col",{style:{width:e(431)}},m)),a[e(497)]("col",{style:{width:"7%"}})]}),a[e(497)](e(530),{children:a[e(488)]("tr",{children:[a[e(497)]("th",{className:e(492),children:e(321)}),a[e(497)]("th",{colSpan:w,className:e(409),children:e(443)}),a[e(497)]("th",{className:e(504),children:e(520)})]})}),a[e(497)](e(302),{children:[{name:e(574),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:e(465),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:e(583),dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:e(297),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:e(421),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:"NOVEMBER",dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:e(408),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:"JANUARY",dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:e(601),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:e(414),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:"APRIL",dates:[1,2,5,6,7,8]}].map(n=>a.jsxs("tr",{children:[a[e(497)]("td",{className:e(480),children:n[e(384)]}),n0(n[e(594)])[e(332)]((m,c)=>a[e(497)]("td",{className:e(432),style:{color:T(n[e(384)],m)?e(453):e(419)},children:m},c)),a.jsx("td",{className:e(576),children:l0[n[e(384)]]||""})]},n[e(384)]))})]}),a.jsxs(e(374),{className:"flex items-stretch border-2 w-full overflow-hidden",style:{borderColor:d},children:[a[e(488)](e(374),{className:e(396),children:[a[e(497)](e(374),{className:"important-dates-header uppercase italic",children:e(237)}),[["June 8-11, 2026",e(539)],[e(324),"Term 1: Summative Test #1"],["July 28, 2026",e(329)],[e(563),"Term 1 Examination"],[e(577),e(227)],[e(615),e(592)],["Sept 16, 2026",e(228)]][e(332)](([n,m])=>a[e(488)]("div",{className:"date-row",children:[a[e(497)](e(374),{className:"date-val uppercase",children:n}),a.jsx(e(374),{className:"date-label uppercase",children:m})]},n))]}),a[e(488)](e(374),{className:"important-dates-box",children:[a.jsx("div",{className:e(395),children:e(237)}),[[e(293),"Term 2: Summative Test #1"],[e(517),"Term 2: Summative Test #2"],[e(410),e(318)],[e(440),"End-of-Term Block"],[e(590),"End of Term 2"],["Jan 4, 2027",e(546)],[e(510),e(225)]][e(332)](([n,m])=>a[e(488)](e(374),{className:"date-row",children:[a.jsx(e(374),{className:e(512),children:n}),a.jsx("div",{className:e(239),children:m})]},n))]}),a.jsxs(e(374),{className:e(396),children:[a[e(497)](e(374),{className:e(395),children:e(237)}),[[e(598),e(511)],["Mar 15-16, 2027",e(315)],[e(428),"Term 3 Exam (Non-Grad)"],[e(367),e(592)],["Apr 1-8, 2027",e(592)],[e(242),e(284)],[e(547),"End of Term 3"]][e(332)](([n,m])=>a.jsxs("div",{className:"date-row",children:[a[e(497)](e(374),{className:e(512),children:n}),a[e(497)](e(374),{className:e(239),children:m})]},n))]})]})]})]})]})})};function cx(){const x=p0,{students:y,sections:u,subjects:k,teachers:j,schoolProfile:I,activeSchoolYear:f,setCurrentView:d,classRecords:S,gradingSheetRecords:M,hpsRecords:l0,sf2Sheets:e}=Q0(),{user:W}=X0(),[w,n0]=h[x(365)](""),[T,P]=h[x(365)](null),[p,s]=h[x(365)](""),[J,Y]=h.useState(1),[B,E]=h[x(365)](x(579)),[z,Z]=h[x(365)]("#22c55e"),[v,K]=h.useState(x(269)),[Q,U]=h[x(365)](!1),[L,F]=h[x(365)](new Set),[q,n]=h[x(365)](""),[m,c]=h[x(365)](!1),[_,O]=h[x(365)](0),[S0,X]=h[x(365)](""),D=h.useMemo(()=>{const t=x;return u[t(339)](r=>r[t(593)]===w||r.id===w)},[u,w]),C=h[x(552)](()=>{const t=x;return k.find(r=>r.id===p||r[t(369)]===p)},[k,p]),T0=h[x(552)](()=>{const t=x;if(!D)return[];const r=$0(W,D,k),l=new Set;return r[t(205)](i=>{const o=t,N=xx(i[o(369)]);return l[o(274)](N)?!1:(l.add(N),!0)})},[D,k,W]),u0=h[x(552)](()=>{const t=x;if(C?.[t(358)]){const r=j[t(339)](l=>l[t(621)]===C[t(358)]||l.id===C.teacher_id);if(r)return r.displayName||r.name}return D?.adviser_name||""},[C,j,D]),a0=h.useMemo(()=>{const t=x;return[...u][t(268)]((r,l)=>{const i=t,o=(r[i(403)]||"").localeCompare(l[i(403)]||"",void 0,{numeric:!0});return o!==0?o:(r.section_name||"")[i(398)](l.section_name||"")})},[u]),E0=h[x(552)](()=>{const t=x,r={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return a0[t(420)](l=>{const i=t,o=(l.section_grade_level||"")[i(573)](),N=parseInt(o[i(386)](/\D/g,""))||0;o[i(280)]("kinder")||N>=1&&N<=6?r[i(366)].push(l):N>=7&&N<=10?r[i(606)][i(223)](l):N>=11&&N<=12&&r[i(472)][i(223)](l)}),r},[a0]);h[x(484)](()=>{const t=x;if(!w&&a0[t(220)]===1){const r=setTimeout(()=>{const l=t;n0(a0[0][l(593)])},0);return()=>clearTimeout(r)}},[a0,w]),h[x(484)](()=>{const t=setTimeout(()=>{s(""),P(null),F(new Set)},0);return()=>clearTimeout(t)},[w]);const R=h[x(552)](()=>{const t=x;if(!w)return[];const r=u[t(339)](l=>l.section_name===w||l.id===w)?.id;return y.filter(l=>l[t(371)]===w||r&&l.student_section===r)},[y,w,u]),$=h[x(552)](()=>R[x(205)](t=>(t[x(459)]||"")[x(573)]()===x(523))[x(268)]((t,r)=>(t[x(218)]+", "+t[x(618)])[x(398)](r.last_name+", "+r[x(618)])),[R]),x0=h[x(552)](()=>R[x(205)](t=>(t[x(459)]||"")[x(573)]()!==x(523))[x(268)]((t,r)=>(t[x(218)]+", "+t[x(618)])[x(398)](r[x(218)]+", "+r.first_name)),[R]),R0=()=>{const t=x;L.size===0&&R[t(220)]>0&&F(new Set(R[t(332)](r=>r.lrn))),U(!0)},o0=h[x(359)](t=>{const r=x;if(!t)return{};const l={};return e[r(205)](o=>o.school_year===f&&(o[r(296)]===D?.id||o.section_id===w))[r(420)](o=>{const N=r,b=o[N(314)]?.[t.lrn];if(b){const A=Object[N(540)](b)[N(205)](G=>G?.[N(573)]()==="absent")[N(220)];A>0&&(l[o.month.toUpperCase()]=A)}}),l},[e,f,D,w]),h0=h[x(359)]((t,r,l)=>{const i=x;if(!t||!r)return;const o={};return[1,2,3][i(420)](N=>{const b=i,A=S.find(g=>g.student_lrn===t[b(448)]&&g[b(326)]===f&&Number(g.quarter)===N&&(g[b(287)]===l?.id||g.subject_id===r))||M.find(g=>g.student_lrn===t[b(448)]&&g[b(326)]===f&&Number(g[b(266)])===N&&(g[b(287)]===l?.id||g.subject_id===r)),G=l0[b(339)](g=>(g.subject_id===l?.id||g[b(287)]===r)&&g.school_year===f&&Number(g[b(266)])===N),e0=(g,B0)=>{const F0=b,H0=Array[F0(513)](g)?g:[];return Array.from({length:B0},(tx,U0)=>H0[U0]??"")},M0=A,P0=G,H=g=>g===""||g===null||g===void 0?"":g;o[N]={scores:{ww:e0(A?.[b(279)],10).map(H),pt:e0(A?.[b(248)],10)[b(332)](H),st:e0(M0?.[b(622)],5)[b(332)](H),te:H(A?.[b(285)]??"")},hps:{ww:e0(G?.[b(279)],10)[b(332)](H),pt:e0(G?.performance_tasks,10)[b(332)](H),st:e0(P0?.[b(622)],5)[b(332)](H),te:H(G?.[b(285)]??"")},finalGrade:H(A?.final_grade??"")}}),o},[S,M,l0,f]),A0=h[x(552)](()=>o0(T),[T,o0]),I0=h.useMemo(()=>h0(T,p,C),[T,p,C,h0]),g0=h[x(552)](()=>[...$,...x0],[$,x0]),t0=h[x(552)](()=>{const t=x;return g0[t(205)](r=>L[t(274)](r[t(448)]))},[g0,L]),r0=h[x(552)](()=>{const t=x;if(!q[t(617)]())return R;const r=q[t(573)]();return R[t(205)](l=>l[t(218)][t(573)]().includes(r)||l[t(618)][t(573)]().includes(r)||l[t(448)].includes(r))},[R,q]),f0=h.useMemo(()=>r0[x(205)](t=>(t[x(459)]||"")[x(573)]()===x(523)),[r0]),m0=h[x(552)](()=>r0.filter(t=>(t.gender||"").toLowerCase()===x(487)),[r0]),z0=()=>{const t=x;if(!T)return;const r=document[t(397)],l=(T[t(218)]+"_"+T.first_name)[t(386)](/[^a-z0-9]/gi,"_");document.title="LIR_"+l+"_"+f,window[t(587)](),setTimeout(()=>{const i=t;document[i(397)]=r},1e3)},w0=async()=>{const t=x;if(t0[t(220)]!==0){c(!0),O(10),X(t(627));try{await new Promise(i=>setTimeout(i,400));const r=document[t(340)](t(249)),l=r?Array[t(611)](r[t(437)](t(416))):[];if(l[t(220)]===0){alert(t(348)),c(!1);return}O(50),X(t(281)+l[t(220)]+t(234)),await ax({elements:l,paperSize:v,orientation:"portrait",title:t(253)+(D?.[t(593)]||"Section")+"_"+(C?.[t(369)]||t(566))}),O(100),X(t(299)),setTimeout(()=>{c(!1),U(!1)},600)}catch(r){console[t(406)]("Bulk print error:",r),alert(t(316)),c(!1)}}},N0=async()=>{const t=x;if(t0[t(220)]!==0){c(!0),O(5),X(t(516));try{await new Promise(A=>setTimeout(A,400));const r=document[t(340)]("lir-bulk-render-container"),l=r?Array[t(611)](r.querySelectorAll(".lir-bulk-sheet")):[];if(l[t(220)]===0){alert(t(439)),c(!1);return}const i=(D?.[t(593)]||w||"Section")[t(386)](/[^a-z0-9]/gi,"_"),o=(C?.[t(369)]||t(566))[t(386)](/[^a-z0-9]/gi,"_"),N=t(596)+i+"_"+o+"_"+f,b=await ex({elements:l,filename:N,paperSize:v,orientation:t(441),title:N,onProgressChange:A=>{const G=t;O(A),X("Processing LIR PDF pages: "+A+G(258))}});b[t(514)]?(O(100),X(t(460)),setTimeout(()=>{c(!1),U(!1)},800)):(b.cancelled||alert(t(345)+(b[t(406)]||t(327))),c(!1))}catch(r){console[t(406)](t(562),r),alert(t(328)),c(!1)}}},y0=t=>{F(r=>{const l=V,i=new Set(r);return i[l(274)](t)?i[l(518)](t):i[l(425)](t),i})},L0=()=>{const t=x;F(new Set(R[t(332)](r=>r[t(448)])))},O0=()=>{const t=x;F(new Set($[t(332)](r=>r[t(448)])))},C0=()=>{const t=x;F(new Set(x0[t(332)](r=>r[t(448)])))},D0=()=>{F(new Set)};return a[x(488)](x(374),{className:x(477),children:[a[x(488)]("div",{className:"z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full",children:[a[x(497)](x(374),{className:"absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30"}),a.jsxs("div",{className:x(619),children:[a[x(488)](x(374),{className:x(241),children:[a.jsx(x(350),{onClick:()=>d("school-forms"),className:x(481),title:x(474),children:a.jsx(J0,{className:x(551)})}),a.jsxs("div",{className:x(215),children:[a[x(497)]("h2",{className:x(599),children:x(244)}),a[x(497)]("p",{className:x(417),children:x(209)})]})]}),a[x(497)](x(374),{className:x(310)}),a[x(488)]("div",{className:x(489),children:[a.jsxs("select",{className:x(263),value:w,onChange:t=>{n0(t[x(347)].value),P(null),s("")},children:[a[x(497)]("option",{value:"",children:"Choose Section"}),Object[x(402)](E0).map(([t,r])=>r[x(220)]>0&&a[x(497)]("optgroup",{label:t,children:r.map(l=>a[x(488)](x(536),{value:l.section_name,children:[l[x(403)]," - ",l[x(593)]]},l.id))},t))]}),a[x(497)](i0,{className:x(535)})]}),a[x(488)](x(374),{className:x(489),children:[a[x(488)](x(604),{className:x(427),value:p,onChange:t=>{const r=x;s(t[r(347)][r(261)]),P(null)},disabled:!w,children:[a[x(497)](x(536),{value:"",children:x(330)}),T0[x(332)](t=>a[x(497)]("option",{value:t.id,children:t.subject_name},t.id))]}),a[x(497)](i0,{className:x(535)})]}),a.jsxs(x(374),{className:x(489),children:[a[x(488)](x(604),{className:x(294),value:T?.[x(448)]||"",onChange:t=>{const r=x,l=y.find(i=>i.lrn===t[r(347)].value)||null;P(l)},disabled:!p,children:[a[x(497)](x(536),{value:"",children:x(393)}),$[x(220)]>0&&a[x(497)](x(388),{label:x(467),children:$[x(332)](t=>{const r=x,l=p&&(S.some(i=>i[r(216)]===t[r(448)]&&i[r(287)]===p&&i[r(326)]===f)||M[r(454)](i=>i[r(216)]===t.lrn&&i[r(287)]===p&&i.school_year===f));return a[r(488)](r(536),{value:t[r(448)],children:[t[r(218)],", ",t.first_name," ",l?"✓":""]},t[r(448)])})}),x0[x(220)]>0&&a.jsx(x(388),{label:x(207),children:x0[x(332)](t=>{const r=x,l=p&&(S.some(i=>i[r(216)]===t[r(448)]&&i[r(287)]===p&&i.school_year===f)||M[r(454)](i=>i[r(216)]===t[r(448)]&&i[r(287)]===p&&i[r(326)]===f));return a[r(488)]("option",{value:t[r(448)],children:[t[r(218)],", ",t[r(618)]," ",l?"✓":""]},t[r(448)])})})]}),a[x(497)](i0,{className:x(535)})]}),a[x(497)](x(374),{className:x(310)}),a.jsxs("div",{className:x(295),children:[a[x(488)]("select",{value:v,onChange:t=>K(t[x(347)][x(261)]),className:x(245),title:x(423),children:[a[x(497)]("option",{value:"a4",children:"A4"}),a[x(497)](x(536),{value:"letter",children:x(206)}),a.jsx("option",{value:x(269),children:"Folio"})]}),a[x(497)](i0,{className:x(535)})]}),a[x(488)](x(374),{className:"flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5",children:[a[x(488)]("div",{className:x(438),title:x(407),children:[a.jsx(x(374),{className:x(331),style:{backgroundColor:B,width:18,height:18}}),a.jsx("input",{type:"color",value:B,onChange:t=>E(t[x(347)].value),className:x(319)})]}),a.jsxs(x(374),{className:x(438),title:"Choose Outline Color",children:[a.jsx(x(374),{className:x(331),style:{backgroundColor:z,width:18,height:18}}),a[x(497)]("input",{type:"color",value:z,onChange:t=>Z(t[x(347)].value),className:x(319)})]})]}),a[x(488)](x(374),{className:x(229),children:[a[x(497)](x(350),{onClick:()=>Y(t=>Math[x(444)](.4,t-.1)),className:"w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200",title:"Zoom Out",children:a[x(497)](Y0,{className:"w-3 h-3"})}),a[x(488)](x(560),{className:"text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums",children:[Math[x(602)](J*100),"%"]}),a[x(497)]("button",{onClick:()=>Y(t=>Math.min(1.5,t+.1)),className:x(354),title:x(325),children:a[x(497)](q0,{className:"w-3 h-3"})})]}),a.jsxs(x(350),{onClick:R0,disabled:!w||!p||R.length===0,className:x(337),title:x(455),children:[a[x(497)](k0,{className:x(445)}),x(404),L[x(343)],")"]}),a[x(488)]("button",{onClick:N0,disabled:!w||!p||t0[x(220)]===0,className:x(433),title:x(450),children:[a[x(497)](v0,{className:"w-3 h-3 group-hover:-translate-y-0.5 transition-transform"}),x(525)]}),a.jsxs(x(350),{onClick:w0,disabled:!w||!p||t0.length===0,className:x(361),title:x(311),children:[a[x(497)](d0,{className:x(541)}),x(338)]}),a[x(488)]("button",{onClick:z0,disabled:!T,className:x(308),title:x(385),children:[a[x(497)](d0,{className:x(283)}),x(357)]})]})]}),a.jsx("div",{className:x(230),children:a[x(497)](x(374),{className:x(457),children:T?a[x(497)]("div",{className:x(578),style:{transform:x(349)+J+") translateZ(0)",willChange:x(490),backfaceVisibility:x(356),WebkitBackfaceVisibility:"hidden"},children:a[x(488)](x(374),{className:x(336),children:[a[x(497)](x(374),{className:x(238)}),a[x(497)](x(374),{className:x(282),children:a[x(497)](j0,{pageNumber:1,student:T,profile:I,schoolYear:f,subject:C?.[x(369)]||"",teacher:u0,fillColor:B,outlineColor:z,gradeData:I0,attendanceData:A0,paperSize:v})})]})}):a[x(488)](x(374),{className:"flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10",children:[a.jsxs(x(374),{className:x(336),children:[a[x(497)](x(374),{className:"absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full"}),a[x(488)](x(374),{className:"relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl",children:[a[x(497)](V0,{className:x(424)}),a[x(488)](x(374),{className:x(519),children:[a.jsx(x(560),{className:x(290),children:x(392)}),a[x(497)](x(374),{className:x(391)})]}),a[x(497)](x(374),{className:x(545),children:a[x(497)](d0,{className:x(572)})})]})]}),a[x(488)](x(374),{className:x(219),children:[a[x(497)]("h2",{className:x(588),children:x(291)}),a[x(497)]("p",{className:"text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60",children:x(628)})]})]})})}),a[x(497)](x(374),{id:x(249),className:x(494),style:{left:x(306)},children:t0[x(332)](t=>{const r=x,l=h0(t,p,C),i=o0(t);return a.jsx(r(374),{className:r(600),children:a[r(497)](j0,{pageNumber:1,student:t,profile:I,schoolYear:f,subject:C?.subject_name||"",teacher:u0,fillColor:B,outlineColor:z,gradeData:l,attendanceData:i,paperSize:v})},t[r(448)])})}),Q&&a[x(497)](x(374),{className:x(305),children:a[x(488)](x(374),{className:x(469),children:[a[x(488)]("div",{className:x(405),children:[a[x(488)]("div",{className:"flex items-center gap-3",children:[a[x(497)](x(374),{className:x(571),children:a.jsx(k0,{className:"w-5 h-5"})}),a[x(488)](x(374),{children:[a[x(497)]("h3",{className:x(595),children:"Bulk LIR Operations"}),a[x(488)]("p",{className:x(613),children:[D?.section_grade_level,x(528),D?.[x(593)],x(610),C?.[x(369)]]})]})]}),a[x(497)](x(350),{onClick:()=>U(!1),className:x(507),children:a[x(497)](W0,{className:x(304)})})]}),a[x(488)]("div",{className:x(373),children:[a[x(488)]("div",{className:x(217),children:[a[x(497)](Z0,{className:x(251)}),a[x(497)](x(614),{type:x(623),placeholder:x(522),value:q,onChange:t=>n(t.target[x(261)]),className:x(360)})]}),a[x(488)](x(374),{className:x(589),children:[a[x(488)](x(350),{onClick:L0,className:x(567),children:[a.jsx(b0,{className:x(387)}),"All (",R.length,")"]}),a[x(488)](x(350),{onClick:O0,className:x(567),children:["Males (",$[x(220)],")"]}),a[x(488)](x(350),{onClick:C0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[x(322),x0.length,")"]}),a[x(497)]("button",{onClick:D0,className:x(471),children:x(351)})]})]}),a[x(488)](x(374),{className:"flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4",children:[f0[x(220)]>0&&a[x(488)]("div",{className:"space-y-2",children:[a[x(497)](x(374),{className:"flex items-center justify-between px-1",children:a[x(488)](x(560),{className:x(221),children:[x(521),f0[x(220)],")"]})}),a[x(497)](x(374),{className:x(624),children:f0[x(332)](t=>{const r=x,l=L[r(274)](t[r(448)]),i=p&&(S[r(454)](o=>o[r(216)]===t[r(448)]&&o.subject_id===p&&o[r(326)]===f)||M.some(o=>o[r(216)]===t[r(448)]&&o[r(287)]===p&&o[r(326)]===f));return a[r(488)](r(374),{onClick:()=>y0(t[r(448)]),className:r(418)+(l?r(544):"bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"),children:[a[r(488)](r(374),{className:r(493),children:[l?a[r(497)](b0,{className:r(270)}):a[r(497)](_0,{className:"w-4 h-4 text-slate-300 shrink-0"}),a.jsxs(r(374),{className:"truncate",children:[a.jsxs("p",{className:r(475),children:[t.last_name,", ",t.first_name," ",t[r(570)]?t[r(570)][0]+".":""]}),a[r(488)]("p",{className:r(370),children:[r(312),t[r(448)]]})]})]}),i&&a[r(497)](r(560),{className:"px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0",children:r(362)})]},t[r(448)])})})]}),m0[x(220)]>0&&a[x(488)](x(374),{className:x(548),children:[a.jsx(x(374),{className:x(612),children:a[x(488)](x(560),{className:x(221),children:[x(597),m0[x(220)],")"]})}),a[x(497)]("div",{className:x(624),children:m0[x(332)](t=>{const r=x,l=L[r(274)](t[r(448)]),i=p&&(S[r(454)](o=>o[r(216)]===t.lrn&&o[r(287)]===p&&o[r(326)]===f)||M[r(454)](o=>o[r(216)]===t.lrn&&o[r(287)]===p&&o[r(326)]===f));return a[r(488)]("div",{onClick:()=>y0(t[r(448)]),className:"p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 "+(l?"bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm":r(364)),children:[a[r(488)](r(374),{className:"flex items-center gap-2.5 min-w-0",children:[l?a.jsx(b0,{className:r(270)}):a[r(497)](_0,{className:"w-4 h-4 text-slate-300 shrink-0"}),a[r(488)]("div",{className:"truncate",children:[a[r(488)]("p",{className:"text-xs font-bold text-slate-800 truncate",children:[t[r(218)],", ",t.first_name," ",t.middle_name?t[r(570)][0]+".":""]}),a[r(488)]("p",{className:r(370),children:["LRN: ",t[r(448)]]})]})]}),i&&a[r(497)](r(560),{className:r(267),children:r(362)})]},t[r(448)])})})]}),r0[x(220)]===0&&a[x(488)]("div",{className:x(413),children:['No learners found matching "',q,'".']})]}),a[x(488)](x(374),{className:"p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0",children:[a.jsxs("div",{className:"text-xs font-bold text-slate-600",children:[a[x(497)](x(560),{className:x(204),children:L.size})," of ",R[x(220)],x(538)]}),a[x(488)]("div",{className:x(233),children:[a[x(488)](x(350),{onClick:N0,disabled:L[x(343)]===0,className:x(434),children:[a[x(497)](v0,{className:x(478)}),"Download PDF"]}),a.jsxs(x(350),{onClick:w0,disabled:L.size===0,className:"h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer",children:[a[x(497)](d0,{className:x(478)}),x(338)]})]})]})]})}),m&&a[x(497)](x(374),{className:x(505),children:a.jsxs(x(374),{className:"bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6",children:[a[x(488)](x(374),{className:x(277),children:[a.jsx("div",{className:x(411)}),a[x(497)](x(374),{className:"relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30",children:a[x(497)](K0,{className:x(313)})})]}),a[x(488)](x(374),{className:x(548),children:[a[x(497)]("h3",{className:x(585),children:x(389)}),a[x(497)]("p",{className:x(272),children:S0})]}),a[x(488)]("div",{className:x(255),children:[a[x(497)](x(374),{className:"h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200",children:a[x(497)](x(374),{className:"h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300",style:{width:Math[x(444)](5,_)+"%"}})}),a[x(488)](x(374),{className:x(537),children:[a[x(497)](x(560),{children:"Export Pipeline"}),a.jsxs("span",{children:[_,"%"]})]})]})]})}),a.jsx("style",{children:`
                @media print {
                    @page {
                        size: `+(v==="a4"?x(436):v===x(476)?x(527):x(565))+x(458)+x(v==="a4"?309:213)+` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `+x(v==="a4"?309:213)+x(630)+x(v==="a4"?309:213)+` !important;
                        height: `+(v==="a4"?x(557):v===x(476)?x(307):x(532))+x(275)})]})}function c0(){const x=["px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0","sort","folio","w-4 h-4 text-indigo-600 shrink-0","constructor","text-xs font-semibold text-slate-500",`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,"has",` !important;
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
             `,`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `,"relative w-16 h-16 mx-auto flex items-center justify-center",`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,"written_works","includes","Opening print stream for ","lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none","w-3 h-3 group-hover:translate-y-0.5 transition-transform","EOSY Rites","quarterly_exam","LRN","subject_id","6519948coSeQa","style","text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic","Individual Record","photo_url","Oct 7, 2026","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200","relative group shrink-0","section_id","SEPTEMBER",`px; 
                        font-size: `,"Bulk print stream launched successfully.",`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `,"header-green py-1","tbody","font-normal ml-2","w-4 h-4","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200","-9999px","11in","h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","210mm","h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0","Bulk Print for selected learners","LRN: ","w-8 h-8 animate-spin","attendance","Term 3 Exam (Graduating)","Failed to launch bulk print.","FIRST","Term 2 Examination","w-full h-full opacity-0 absolute inset-0 cursor-pointer","JANUARY","Months","Females (","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","July 6, 2026","Zoom In","school_year","Unknown error","Failed to generate PDF download.","Term 1: Summative Test #2","Select Subject","w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0","map","col","col-span-1","tfoot","relative group","ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","Bulk Print","find","getElementById","1ST","label-green border-2 whitespace-nowrap","size","2ND","Export failed: ","School Year: ","target","No sheets ready for printing. Please try again.","scale(","button","Clear",`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,"Learner's Individual Record Card","w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200","9995ESydSP","hidden","Print Single","teacher_id","useCallback","w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500","h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","✓ Grades",`rem; 
                        border-bottom: 2px solid `,"bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50","useState","ELEMENTARY","Mar 24-31, 2027",`rem; 
                        min-height: `,"subject_name","text-[9px] font-medium text-slate-400","student_section","M.I","p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0","div","charAt",`rem;
                        width: `,"row-label py-1 px-1 border-2","SUBJECT","#22c55e","40%",`px;
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
                        padding: `,"table","rem","name","Print single active learner","replace","w-3 h-3 text-indigo-600","optgroup","Processing LIR Records","font-bold uppercase leading-none text-center","w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4","LIR","Select Learner","card-container-combined print:m-0 print:shadow-none","important-dates-header uppercase italic","important-dates-box","title","localeCompare",`rem; 
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
                `,"LAST NAME","apply","entries","section_grade_level","Select (","px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0","error","Choose Fill Color","DECEMBER","dates-header-bar uppercase","Dec 3-4, 2026","absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping","col-span-1 flex flex-col items-center justify-center pt-1","p-8 text-center text-slate-400 text-xs font-medium","MARCH","BAGONG BARRIO NATIONAL HIGH SCHOOL",".lir-bulk-sheet","text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ","inherit","forEach","OCTOBER","SECOND","Paper Size","w-28 h-28 text-slate-100 dark:text-slate-600","add","font-bold py-1","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate","Mar 22-23, 2027","2592WDyXhH","font-black uppercase italic","3.32%","attendance-date-cell","h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer",`px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: `,"210mm 297mm","querySelectorAll","relative flex items-center justify-center cursor-pointer shrink-0","No sheets ready for PDF export.","Dec 7-18, 2026","portrait",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid `,"Dates","max","w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"SUMMATIVE TEST","lrn","label-green py-1 border-2","Bulk Download PDF for selected learners","grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","font-bold leading-tight","red","some","Filter / Select Learners","PRODUCT/PERFORMANCE TASK (PPTs)","w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0",`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `,"gender","PDF download complete!","1 X 1","signature-box bg-white",`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `,"header-subject-table border-collapse border-2","JULY","School Logo","MALE","40px","bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]",`;
                        border: 1px solid `,"h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1","SENIOR HIGH SCHOOL","TOTAL","Back to Hub","text-xs font-bold text-slate-800 truncate","letter","lir-print-root flex flex-col h-full bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white","w-3.5 h-3.5",`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,"month-col","w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200","info","row-label","useEffect",`;
                        padding: `,"half-page-section border-t-4","female","jsxs","relative group min-w-0 flex-1","transform","colgroup","month-col uppercase","flex items-center gap-2.5 min-w-0","fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block","NOVEMBER","2abxAPd","jsx","0px",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"console","toUpperCase","school-logo.png","src","absences-header uppercase","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200",`;
                        border-radius: 8px;
                        height: `,"w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden","272808mpjIcc","Jan 25, 2027","Term 3: Summative Test #2","date-val uppercase","isArray","success","px ","Initializing vector PDF export pipeline...","Oct 29, 2026","delete","absolute inset-0 flex flex-col items-center justify-center","Total Abs.","Male Learners (","Filter learners by name or LRN...","male","img","Bulk PDF",`px; 
                        border-right: 1px solid `,"8.5in 11in"," - ","TERM EXAM","thead","mb-2","13in",`rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,"term-label","w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors","option","flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider"," learners selected","Opening Block: Term 1","values","w-3 h-3 group-hover:scale-110 transition-transform","flex gap-4 items-start w-full mt-2",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500","Start of Term 3","Apr 8, 2027","space-y-2","half-page-section","data-field uppercase font-bold border-2 whitespace-nowrap px-1","w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform","useMemo","w-full h-full object-cover",`;
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"lir-title-bar-custom mb-3 uppercase tracking-widest","return (function() ","297mm","WRITTEN /ORAL WORKS (WWs)","slice","span",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,"Bulk PDF download error:","Aug 28, 2026","data-field uppercase font-bold border-2 whitespace-nowrap","8.5in 13in","Subject","h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1","flex items-center justify-center bg-white overflow-hidden","scores","middle_name","w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400","w-10 h-10 text-white","toLowerCase","JUNE",`px;
                        font-size: `,"font-bold","Sept 1, 2026","transition-all duration-700 ease-out origin-top print:scale-100","#86efac","17037306IfcNxY","11263wqQdCU",`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `,"AUGUST",`rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `,"text-lg font-black text-slate-900 tracking-tight uppercase","FINAL GRADE","print","text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase","flex items-center gap-1.5 flex-wrap","Dec 18, 2026","bind","End-of-Term Block","section_name","dates","text-sm font-black uppercase tracking-wide text-white","LIR_","Female Learners (","Feb 16, 2027","text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5","lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always","FEBRUARY","round","student-info-table border-2","select",`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"JUNIOR HIGH SCHOOL","Teacher's Signature","TERM","-11px"," | ","from","flex items-center justify-between px-1","text-[10px] text-slate-400 font-semibold uppercase tracking-widest","input","Sept 2-15, 2026",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,"trim","first_name","flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden",`44;
                        font-weight: 800;
                        font-size: `,"uid","summative_tests","text","grid grid-cols-1 sm:grid-cols-2 gap-2",`; 
                        color: black !important; 
                        font-size: `,"4424958IvZnAQ","Preparing LIR sheets for bulk printing...","Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections.",`dd;
                        border: 1px solid `,` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"THIRD","text-indigo-600 font-black","filter","Letter","FEMALE",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"Individual LIR",`px; 
                        padding: `,`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"logo_url","8.5in","TEACHER","flex flex-col shrink-0","student_lrn","relative flex-1 min-w-48","last_name","space-y-4","length","text-[10px] font-black text-slate-500 uppercase tracking-widest",'{}.constructor("return this")( )',"push","PHOTO","Term 3: Summative Test #1","31315630SJblnJ","Term 1 Examination","Start of Term 2","flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0","flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar",`rem;
                    }

                    .row-label {
                        background-color: `,`px;
                        text-align: center;
                        height: `,"flex items-center gap-2"," learners...","max-w-full max-h-full object-contain",`rem; 
                        font-weight: 700; 
                        height: `,"Important Dates","absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000","date-label uppercase","reduce","flex items-center gap-1.5 lg:gap-2 shrink-0","Apr 6-7, 2027",`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `,"Learner Record","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200","FIRST NAME","1956YHKmxA","performance_tasks","lir-bulk-render-container","header-row-fill","w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"," TERM","Bulk_LIR_","exception","space-y-1.5","toString",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,"% complete...","20%","fixed","value","log","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate","label-green py-1 border-2 px-1","grow flex flex-col gap-1 overflow-hidden","quarter"];return c0=function(){return x},c0()}export{cx as LIRPage};
