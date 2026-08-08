import{j as a,r as h,cq as Y0,bH as i0,cA as q0,c9 as V0,be as _0,bO as j0,cc as d0,cz as W0,bs as X0,dp as Z0,cB as p0,cC as S0,bE as K0}from"./vendor-CPdzHyoa.js";import{b as Q0,u as $0,h as xx,n as ex}from"./index-Cp2DvJOO.js";import{r as ax}from"./grading-helpers-BpPz1jc_.js";import{e as tx,p as rx}from"./pdf-export-CNDrnVwL.js";import"./vendor-pdf-libs-CUB0ZFCL.js";import"./vendor-firebase-QId1saCw.js";import"./vendor-framer-motion-PFt0oA6P.js";import"./terms-Vqo_HgiP.js";import"./grading-VeGCUM9a.js";const o0=V;(function(x,y){const u=V,v=x();for(;;)try{if(-parseInt(u(414))/1+-parseInt(u(548))/2+-parseInt(u(477))/3+-parseInt(u(494))/4+parseInt(u(479))/5+parseInt(u(473))/6*(parseInt(u(382))/7)+parseInt(u(419))/8*(parseInt(u(379))/9)===y)break;v.push(v.shift())}catch{v.push(v.shift())}})(c0,703116);const s0=(function(){let x=!0;return function(y,u){const v=x?function(){if(u){const A=u.apply(y,arguments);return u=null,A}}:function(){};return x=!1,v}})(),J0=s0(void 0,function(){const x=V,y=function(){const M=V;let o;try{o=Function(M(451)+'{}.constructor("return this")( ));')()}catch{o=window}return o},u=y(),v=u[x(471)]=u[x(471)]||{},A=[x(575),x(537),x(331),x(238),x(450),x(434),x(353)];for(let M=0;M<A.length;M++){const o=s0[x(408)][x(540)][x(587)](s0),d=A[M],k=v[d]||o;o[x(354)]=s0[x(587)](s0),o[x(405)]=k[x(405)][x(587)](k),v[d]=o}});J0();function V(x,y){return x=x-165,c0()[x]}const T0=({pageNumber:x,student:y,profile:u,schoolYear:v,subject:A,teacher:M,fillColor:o=o0(435),outlineColor:d=o0(416),gradeData:k,paperSize:D="folio",attendanceData:a0={}})=>{const e=o0,W="./",N=25,n0=n=>Array[V(242)]({length:N},(c,j)=>n[j]??""),T=(n,m)=>{const c=V,j=Number(m);if(!j)return!1;const C=n[c(200)]();return C===c(346)&&j===12||C===c(365)&&(j===21||j===31)||C===c(395)&&(j===2||j===30)||C===c(349)&&j===8||C===c(179)&&j===1};let P=e(585),f=e(556),l=1.12,J=1.2,Y=.8,B=.75,E=5,L=.8,X=40,_=240,Z=100,K=50,U=e(582);D==="a4"?(f=e(319),P=e(342),l=1.02,J=.85,Y=.55,B=.5,E=2,L=.65,X=26,_=140,Z=80,K=40):D===e(602)?(f=e(556),P=e(598),l=.98,J=.85,Y=.55,B=.5,E=3,L=.7,X=28,_=160,Z=65,K=32,U=e(446)):D===e(330)&&(f=e(556),P="13in",l=.98,J=.85,Y=.55,B=.5,E=3,L=.7,X=28,_=160,Z=65,K=32,U="-11px");const z=(n,m)=>{const c=e,j=(n||"")[c(378)]();return j.length>32?m*.65:j[c(347)]>24?m*.78:j[c(347)]>16?m*.88:m},F=z(A,L*l),q=z(M,L*l);return a[e(186)](e(209),{className:e(248),children:a.jsxs(e(209),{className:e(580),style:{width:f,height:P},children:[a.jsx(e(207),{children:e(311)+f+" "+P+`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid `+d+e(184)+8*l+`px;
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
                        padding: `+5*l+e(568)+o+`;
                        border: 1px solid `+d+e(499)+3*l+e(504)+.85*l+e(588)+o+e(304)+d+e(455)+.6*l+e(465)+d+e(184)+2*l+e(245)+.8*l+e(257)+.6*l+e(533)+d+`;
                        padding: `+1.5*l+e(564)+24*l+e(384)+o+`44;
                        font-weight: 800;
                        font-size: `+.6*l+e(574)+o+e(409)+.6*l+e(288)+70*l+e(218)+o+e(377)+d+e(279)+X*l+`px;
                        width: `+_*l+e(581)+o+e(573)+.9*l+e(572)+4*l+`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `+d+e(508)+d+e(497)+d+e(480)+.5*l+e(591)+21*l+e(297)+1*l+e(290)+o+e(320)+.5*l+e(206)+d+` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `+o+e(357)+.9*l+e(192)+o+e(224)+.45*l+`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `+.5*l+`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `+d+e(529)+o+e(369)+3*l+`px; 
                        font-size: `+.85*l+e(472)+d+e(244)+d+`; 
                        font-size: `+.45*l+e(280)+18*l+`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `+95*l+e(177)+d+e(376)+1.5*l+e(334)+4*l+e(482)+1.5*l+e(334)+4*l+e(428)+.42*l+e(460)}),a[e(431)](e(209),{className:e(489),children:[a[e(431)](e(209),{className:e(266),children:[a[e(431)]("div",{className:e(401),children:[a.jsxs(e(209),{className:e(302),children:[a[e(186)](e(209),{className:"flex items-center justify-center bg-white overflow-hidden",style:{width:64*l,height:64*l},children:a[e(186)](e(328),{src:u.logo_url||W+e(325),alt:e(560),className:e(270),onError:n=>{const m=e;n.target[m(391)]=W+m(325)}})}),a[e(431)](e(209),{children:[a[e(186)]("h1",{className:"font-extrabold uppercase whitespace-nowrap",style:{fontSize:J*l+e(577)},children:u.name||e(285)}),a[e(186)]("p",{className:e(475),style:{fontSize:Y*l+"rem",color:d},children:e(170)}),a[e(431)]("p",{className:"font-bold",style:{fontSize:B*l+e(577)},children:["School Year: ",a[e(186)](e(523),{className:e(314),children:v})]})]})]}),a[e(186)](e(209),{className:"shrink-0 ml-auto",children:a.jsx(e(434),{className:e(202),style:{borderColor:d},children:a.jsx("tbody",{children:a[e(431)]("tr",{children:[a[e(186)]("td",{className:"label-green border-2 whitespace-nowrap",style:{fontSize:L*l+e(577),padding:E*l+e(334)+E*2*l+"px",borderColor:d},children:e(283)}),a[e(186)]("td",{className:e(403),style:{fontSize:F+e(577),padding:E*l+e(334)+E*2.5*l+"px",borderColor:d},children:A}),a[e(186)]("td",{className:"label-green border-2 whitespace-nowrap",style:{fontSize:L*l+e(577),padding:E*l+e(334)+E*2*l+"px",borderColor:d},children:e(415)}),a[e(186)]("td",{className:e(403),style:{fontSize:q+e(577),padding:E*l+e(334)+E*2.5*l+"px",borderColor:d},children:M})]})})})})]}),a.jsxs("div",{className:e(231),children:[a[e(186)](e(209),{className:e(176),style:{width:1*l+"in",height:1*l+"in",borderColor:d},children:y[e(235)]?a[e(186)]("img",{src:y[e(235)],alt:e(239),className:e(254)}):a[e(431)](e(523),{className:e(605),style:{fontSize:.7*l+e(577)},children:[e(488),a.jsx("br",{}),e(576)]})}),a[e(186)](e(209),{className:e(491),children:a[e(186)]("table",{className:e(227),style:{borderColor:d,height:1*l+"in"},children:a[e(431)](e(426),{children:[a[e(431)]("tr",{style:{height:.5*l+"in"},children:[a[e(186)]("td",{className:e(502),style:{borderColor:d,height:.5*l+"in"},children:y[e(520)]}),a[e(186)]("td",{className:e(502),style:{borderColor:d,height:.5*l+"in"},children:y[e(498)]}),a.jsx("td",{className:e(308),style:{width:e(495),borderColor:d,height:.5*l+"in"},children:y[e(199)]?.[e(542)](0)||""}),a[e(186)]("td",{className:e(502),style:{borderColor:d,height:.5*l+"in"},children:y.student_section}),a[e(186)]("td",{className:e(502),style:{borderColor:d,height:.5*l+"in"},children:y[e(232)]})]}),a[e(431)]("tr",{style:{height:.5*l+"in"},children:[a.jsx("td",{className:e(425),style:{borderColor:d,height:.5*l+"in"},children:"LAST NAME"}),a[e(186)]("td",{className:e(425),style:{borderColor:d,height:.5*l+"in"},children:e(223)}),a[e(186)]("td",{className:e(196),style:{width:e(495),borderColor:d,height:.5*l+"in"},children:e(303)}),a[e(186)]("td",{className:e(425),style:{borderColor:d,height:.5*l+"in"},children:e(225)}),a[e(186)]("td",{className:"label-green py-1 border-2",style:{borderColor:d,height:.5*l+"in"},children:e(461)})]})]})})})]}),a[e(431)](e(209),{className:e(253),children:[a[e(431)](e(209),{children:[a[e(186)](e(209),{className:e(167),style:{fontSize:.75*l+e(577)},children:e(404)}),a.jsx("table",{style:{tableLayout:"fixed"},children:a[e(431)](e(426),{children:[a[e(431)]("tr",{className:e(454),children:[a[e(186)]("td",{className:e(394),style:{width:e(445)},children:e(584)}),[1,2,3,4,5][e(388)](n=>a[e(186)]("td",{style:{width:e(252)},children:n},n)),a[e(186)]("td",{className:e(411),style:{width:e(468)},children:e(181)})]}),[1,2,3][e(388)](n=>a[e(431)]("tr",{children:[a.jsx("td",{className:e(393),children:n===1?e(324):n===2?e(442):"THIRD"}),[...Array(5)][e(388)]((m,c)=>a[e(186)]("td",{children:k?.[n]?.[e(545)].ww[c]??""},c)),a[e(186)]("td",{className:e(411),children:k?.[n]?.scores.ww[e(554)](0,5)[e(368)]((m,c)=>m+(Number(c)||0),0)||""})]},n))]})})]}),a[e(431)](e(209),{children:[a[e(186)]("div",{className:e(167),style:{fontSize:.75*l+e(577)},children:"PRODUCT/PERFORMANCE TASK (PPTs)"}),a[e(186)](e(434),{style:{tableLayout:"fixed"},children:a[e(431)](e(426),{children:[a[e(431)]("tr",{className:e(454),children:[a[e(186)]("td",{className:e(394),style:{width:"20%"},children:"TERM"}),[1,2,3][e(388)](n=>a[e(186)]("td",{style:{width:e(468)},children:n},n)),a[e(186)]("td",{className:"font-bold",style:{width:e(468)},children:"TOTAL"})]}),[1,2,3][e(388)](n=>a[e(431)]("tr",{children:[a[e(186)]("td",{className:e(393),children:n===1?"FIRST":n===2?e(442):"THIRD"}),[...Array(3)][e(388)]((m,c)=>a[e(186)]("td",{children:k?.[n]?.[e(545)].pt[c]??""},c)),a[e(186)]("td",{className:e(411),children:k?.[n]?.scores.pt.slice(0,3)[e(368)]((m,c)=>m+(Number(c)||0),0)||""})]},n))]})})]})]}),a[e(431)](e(209),{className:"grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden",children:[a.jsxs(e(209),{className:e(276),children:[a[e(186)](e(209),{className:e(167),style:{fontSize:.7*l+"rem"},children:"SUMMATIVE TEST"}),a.jsx(e(434),{style:{tableLayout:e(518)},children:a[e(431)]("tbody",{children:[a[e(431)]("tr",{className:e(454),children:[a[e(186)]("td",{className:e(394),style:{width:e(463)},children:e(584)}),[1,2][e(388)](n=>a[e(186)]("td",{children:n},n))]}),[1,2,3][e(388)](n=>a[e(431)]("tr",{children:[a[e(186)]("td",{className:"row-label",children:n===1?"FIRST":n===2?e(442):"THIRD"}),[...Array(2)][e(388)]((m,c)=>a[e(186)]("td",{children:k?.[n]?.[e(545)].st[c]??""},c))]},n))]})})]}),a[e(186)]("div",{className:e(276),children:a[e(431)](e(434),{style:{tableLayout:e(518)},children:[a[e(186)](e(506),{children:a.jsx("tr",{className:e(454),children:a[e(186)]("td",{colSpan:2,className:e(329),style:{fontSize:.7*l+e(577)},children:"TERM EXAM"})})}),a[e(186)](e(426),{children:[1,2,3][e(388)](n=>a[e(431)]("tr",{children:[a[e(431)]("td",{className:e(385),style:{borderColor:d},children:[n===1?"1ST":e(n===2?566:220),e(549)]}),a[e(186)]("td",{className:e(411),children:k?.[n]?.[e(545)].te||""})]},n))})]})}),a[e(186)](e(209),{className:e(276),children:a[e(431)](e(434),{style:{tableLayout:e(518)},children:[a[e(186)](e(506),{children:a.jsx("tr",{className:e(454),children:a[e(186)]("td",{colSpan:2,className:"font-bold py-1",style:{fontSize:.7*l+"rem"},children:e(567)})})}),a[e(186)]("tbody",{children:[1,2,3][e(388)](n=>a[e(431)]("tr",{children:[a[e(431)]("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:d},children:[e(n===1?180:n===2?566:220),e(549)]}),a[e(186)]("td",{className:"font-bold",children:k?.[n]?.finalGrade||""})]},n))}),a[e(186)](e(201),{children:a[e(186)]("tr",{style:{height:1.5*l+"px"},children:a[e(186)]("td",{colSpan:2,style:{border:e(273)}})})})]})}),a[e(431)]("div",{className:e(327),style:{marginTop:U},children:[a.jsx(e(209),{className:e(589),children:a.jsx(e(328),{src:W+e(427),alt:e(364),className:e(339),style:{width:Z*l,height:K*l}})}),a.jsx(e(209),{className:e(555)}),a[e(186)]("p",{className:"font-bold uppercase leading-none text-center",style:{fontSize:.6*l+e(577),marginTop:14*l+"px"},children:e(512)})]})]})]}),a[e(431)](e(209),{className:e(228),style:{borderColor:d},children:[a.jsx(e(209),{className:e(282),children:e(538)}),a[e(431)](e(434),{className:e(515),children:[a.jsxs(e(213),{children:[a[e(186)](e(340),{style:{width:e(592)}}),Array[e(242)]({length:N})[e(388)]((n,m)=>a[e(186)]("col",{style:{width:e(563)}},m)),a[e(186)]("col",{style:{width:"7%"}})]}),a[e(186)](e(506),{children:a[e(431)]("tr",{children:[a[e(186)]("th",{className:e(222),children:e(386)}),a[e(186)]("th",{colSpan:N,className:"dates-header-bar uppercase",children:e(412)}),a.jsx("th",{className:"absences-header uppercase",children:e(562)})]})}),a[e(186)](e(426),{children:[{name:"JUNE",dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:e(307),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:"AUGUST",dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:e(380),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:"OCTOBER",dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:e(395),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:"DECEMBER",dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:e(179),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:e(299),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:"MARCH",dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:"APRIL",dates:[1,2,5,6,7,8]}][e(388)](n=>a.jsxs("tr",{children:[a[e(186)]("td",{className:e(579),children:n.name}),n0(n[e(513)])[e(388)]((m,c)=>a.jsx("td",{className:e(390),style:{color:T(n[e(332)],m)?e(274):e(265)},children:m},c)),a[e(186)]("td",{className:e(411),children:a0[n[e(332)]]||""})]},n[e(332)]))})]}),a[e(431)](e(209),{className:"flex items-stretch border-2 w-full overflow-hidden",style:{borderColor:d},children:[a[e(431)]("div",{className:e(256),children:[a[e(186)](e(209),{className:"important-dates-header uppercase italic",children:e(525)}),[[e(188),e(430)],[e(493),e(458)],[e(294),e(262)],[e(546),"Term 1 Examination"],["Sept 1, 2026","Term 1 Examination"],[e(516),e(356)],[e(381),e(503)]].map(([n,m])=>a[e(431)](e(209),{className:"date-row",children:[a[e(186)](e(209),{className:e(603),children:n}),a[e(186)](e(209),{className:e(601),children:m})]},n))]}),a[e(431)](e(209),{className:"important-dates-box",children:[a[e(186)](e(209),{className:e(205),children:e(525)}),[[e(514),e(397)],["Oct 29, 2026",e(355)],["Dec 3-4, 2026",e(530)],[e(597),"End-of-Term Block"],[e(169),e(338)],[e(313),e(183)],["Jan 25, 2027","Term 3: Summative Test #1"]][e(388)](([n,m])=>a.jsxs("div",{className:e(312),children:[a[e(186)](e(209),{className:e(603),children:n}),a[e(186)]("div",{className:e(601),children:m})]},n))]}),a[e(431)]("div",{className:"important-dates-box",children:[a[e(186)](e(209),{className:"important-dates-header uppercase italic",children:"Important Dates"}),[[e(212),e(583)],[e(226),"Term 3 Exam (Graduating)"],["Mar 22-23, 2027","Term 3 Exam (Non-Grad)"],[e(492),e(356)],[e(439),"End-of-Term Block"],[e(517),"EOSY Rites"],["Apr 8, 2027",e(171)]].map(([n,m])=>a[e(431)](e(209),{className:e(312),children:[a[e(186)]("div",{className:e(603),children:n}),a[e(186)](e(209),{className:e(601),children:m})]},n))]})]})]})]})]})})};function mx(){const x=o0,{students:y,sections:u,subjects:v,teachers:A,schoolProfile:M,activeSchoolYear:o,setCurrentView:d,classRecords:k,gradingSheetRecords:D,hpsRecords:a0,sf2Sheets:e}=Q0(),{user:W}=$0(),[N,n0]=h.useState(""),[T,P]=h[x(195)](null),[f,l]=h[x(195)](""),[J,Y]=h[x(195)](1),[B,E]=h.useState(x(435)),[L,X]=h.useState(x(416)),[_,Z]=h[x(195)](x(330)),[K,U]=h[x(195)](!1),[z,F]=h[x(195)](new Set),[q,n]=h[x(195)](""),[m,c]=h[x(195)](!1),[j,C]=h[x(195)](0),[E0,Q]=h[x(195)](""),S=h[x(351)](()=>{const t=x;return u.find(r=>r[t(521)]===N||r.id===N)},[u,N]),O=h[x(351)](()=>{const t=x;return v[t(358)](r=>r.id===f||r[t(571)]===f)},[v,f]),R0=h[x(351)](()=>{const t=x;if(!S)return[];const r=xx(W,S,v),s=new Set;return r[t(237)](i=>{const b=t,g=ex(i[b(571)]);return s[b(316)](g)?!1:(s[b(323)](g),!0)})},[S,v,W]),u0=h.useMemo(()=>{const t=x;if(O?.teacher_id){const r=A[t(358)](s=>s[t(444)]===O[t(443)]||s.id===O[t(443)]);if(r)return r[t(344)]||r.name}return S?.adviser_name||""},[O,A,S]),t0=h[x(351)](()=>{const t=x;return[...u][t(275)]((r,s)=>{const i=t,b=(r[i(178)]||"")[i(466)](s[i(178)]||"",void 0,{numeric:!0});return b!==0?b:(r.section_name||"")[i(466)](s[i(521)]||"")})},[u]),I0=h[x(351)](()=>{const t=x,r={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return t0[t(173)](s=>{const i=t,b=(s[i(178)]||"").toLowerCase(),g=parseInt(b.replace(/\D/g,""))||0;b[i(507)]("kinder")||g>=1&&g<=6?r.ELEMENTARY[i(532)](s):g>=7&&g<=10?r[i(558)][i(532)](s):g>=11&&g<=12&&r[i(501)][i(532)](s)}),r},[t0]);h[x(594)](()=>{const t=x;if(!N&&t0[t(347)]===1){const r=setTimeout(()=>{const s=t;n0(t0[0][s(521)])},0);return()=>clearTimeout(r)}},[t0,N]),h[x(594)](()=>{const t=setTimeout(()=>{l(""),P(null),F(new Set)},0);return()=>clearTimeout(t)},[N]);const R=h[x(351)](()=>{const t=x;if(!N)return[];const r=u[t(358)](s=>s[t(521)]===N||s.id===N)?.id;return y[t(237)](s=>s.student_section===N||r&&s[t(360)]===r)},[y,N,u]),$=h[x(351)](()=>R[x(237)](t=>(t[x(203)]||"").toLowerCase()===x(287))[x(275)]((t,r)=>(t.last_name+", "+t.first_name)[x(466)](r[x(520)]+", "+r.first_name)),[R]),x0=h[x(351)](()=>R[x(237)](t=>(t[x(203)]||"")[x(423)]()!=="male")[x(275)]((t,r)=>(t[x(520)]+", "+t[x(498)]).localeCompare(r.last_name+", "+r.first_name)),[R]),A0=()=>{const t=x;z[t(241)]===0&&R[t(347)]>0&&F(new Set(R.map(r=>r.lrn))),U(!0)},b0=h[x(236)](t=>{const r=x;if(!t)return{};const s={};return e[r(237)](b=>b.school_year===o&&(b[r(559)]===S?.id||b[r(559)]===N))[r(173)](b=>{const g=r,p=b[g(258)]?.[t.lrn];if(p){const I=Object[g(551)](p)[g(237)](G=>G?.[g(423)]()===g(269))[g(347)];I>0&&(s[b[g(528)][g(200)]()]=I)}}),s},[e,o,S,N]),h0=h[x(236)]((t,r,s)=>{const i=x;if(!t||!r)return;const b={};return[1,2,3][i(173)](g=>{const p=i,I=k.find(w=>w[p(165)]===t[p(232)]&&w.school_year===o&&Number(w[p(208)])===g&&(w.subject_id===s?.id||w.subject_id===r))||D[p(358)](w=>w.student_lrn===t[p(232)]&&w.school_year===o&&Number(w[p(208)])===g&&(w[p(550)]===s?.id||w[p(550)]===r)),G=a0.find(w=>(w[p(550)]===s?.id||w.subject_id===r)&&w[p(604)]===o&&Number(w[p(208)])===g),e0=(w,H0)=>{const v0=p,U0=Array[v0(166)](w)?w:[];return Array[v0(242)]({length:H0},(lx,G0)=>U0[G0]??"")},B0=I,F0=G,H=w=>w===""||w===null||w===void 0?"":w,k0=ax(t[p(232)],s?.id||f,g,o,k,D,a0,S?.section_grade_level,S?.[p(413)]);b[g]={scores:{ww:e0(I?.[p(600)],10)[p(388)](H),pt:e0(I?.performance_tasks,10)[p(388)](H),st:e0(B0?.summative_tests,5)[p(388)](H),te:H(I?.[p(298)]??"")},hps:{ww:e0(G?.written_works,10).map(H),pt:e0(G?.performance_tasks,10).map(H),st:e0(F0?.[p(387)],5)[p(388)](H),te:H(G?.quarterly_exam??"")},finalGrade:k0>0?k0:H(I?.[p(586)]??"")}}),b},[k,D,a0,o,S?.[x(178)],S?.[x(413)],f]),L0=h[x(351)](()=>b0(T),[T,b0]),z0=h.useMemo(()=>h0(T,f,O),[T,f,O,h0]),g0=h.useMemo(()=>[...$,...x0],[$,x0]),r0=h[x(351)](()=>{const t=x;return g0.filter(r=>z[t(316)](r[t(232)]))},[g0,z]),l0=h[x(351)](()=>{const t=x;if(!q[t(378)]())return R;const r=q[t(423)]();return R[t(237)](s=>s[t(520)][t(423)]().includes(r)||s.first_name[t(423)]().includes(r)||s[t(232)][t(507)](r))},[R,q]),f0=h[x(351)](()=>l0.filter(t=>(t.gender||"")[x(423)]()===x(287)),[l0]),m0=h[x(351)](()=>l0[x(237)](t=>(t.gender||"")[x(423)]()===x(306)),[l0]),C0=()=>{const t=x;if(!T)return;const r=document.title,s=(T[t(520)]+"_"+T[t(498)])[t(361)](/[^a-z0-9]/gi,"_");document[t(524)]=t(174)+s+"_"+o,window[t(476)](),setTimeout(()=>{const i=t;document[i(524)]=r},1e3)},w0=async()=>{const t=x;if(r0[t(347)]!==0){c(!0),C(10),Q("Preparing LIR sheets for bulk printing...");try{await new Promise(i=>setTimeout(i,400));const r=document.getElementById(t(547)),s=r?Array.from(r[t(531)](".lir-bulk-sheet")):[];if(s[t(347)]===0){alert(t(440)),c(!1);return}C(50),Q(t(350)+s.length+t(255)),await rx({elements:s,paperSize:_,orientation:t(448),title:"Bulk_LIR_"+(S?.[t(521)]||t(191))+"_"+(O?.[t(571)]||"Subject")}),C(100),Q(t(219)),setTimeout(()=>{c(!1),U(!1)},600)}catch(r){console[t(238)](t(485),r),alert(t(541)),c(!1)}}},N0=async()=>{const t=x;if(r0[t(347)]!==0){c(!0),C(5),Q("Initializing vector PDF export pipeline...");try{await new Promise(I=>setTimeout(I,400));const r=document[t(370)](t(547)),s=r?Array[t(242)](r.querySelectorAll(t(429))):[];if(s[t(347)]===0){alert(t(259)),c(!1);return}const i=(S?.[t(521)]||N||t(191))[t(361)](/[^a-z0-9]/gi,"_"),b=(O?.[t(571)]||t(436)).replace(/[^a-z0-9]/gi,"_"),g=t(174)+i+"_"+b+"_"+o,p=await tx({elements:s,filename:g,paperSize:_,orientation:t(448),title:g,onProgressChange:I=>{const G=t;C(I),Q("Processing LIR PDF pages: "+I+G(459))}});p[t(474)]?(C(100),Q(t(402)),setTimeout(()=>{c(!1),U(!1)},800)):(p[t(595)]||alert(t(193)+(p[t(238)]||t(478))),c(!1))}catch(r){console[t(238)](t(233),r),alert(t(278)),c(!1)}}},y0=t=>{F(r=>{const s=V,i=new Set(r);return i[s(316)](t)?i[s(284)](t):i[s(323)](t),i})},O0=()=>{const t=x;F(new Set(R[t(388)](r=>r[t(232)])))},M0=()=>{const t=x;F(new Set($[t(388)](r=>r[t(232)])))},D0=()=>{const t=x;F(new Set(x0[t(388)](r=>r.lrn)))},P0=()=>{F(new Set)};return a[x(431)](x(209),{className:"lir-print-root flex flex-col h-full bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white",children:[a[x(431)](x(209),{className:x(400),children:[a.jsx("div",{className:x(343)}),a[x(431)]("div",{className:x(322),children:[a[x(431)](x(209),{className:x(305),children:[a[x(186)]("button",{onClick:()=>d("school-forms"),className:x(424),title:"Back to Hub",children:a.jsx(Y0,{className:x(185)})}),a[x(431)](x(209),{className:x(569),children:[a[x(186)]("h2",{className:x(336),children:"Learner Record"}),a[x(186)]("p",{className:x(522),children:x(286)})]})]}),a[x(186)](x(209),{className:x(341)}),a[x(431)](x(209),{className:"relative group min-w-0 flex-1",children:[a[x(431)](x(484),{className:x(264),value:N,onChange:t=>{const r=x;n0(t[r(263)][r(536)]),P(null),l("")},children:[a[x(186)](x(172),{value:"",children:"Choose Section"}),Object.entries(I0)[x(388)](([t,r])=>r[x(347)]>0&&a[x(186)]("optgroup",{label:t,children:r[x(388)](s=>a[x(431)](x(172),{value:s[x(521)],children:[s.section_grade_level," - ",s[x(521)]]},s.id))},t))]}),a.jsx(i0,{className:x(348)})]}),a.jsxs(x(209),{className:x(260),children:[a[x(431)]("select",{className:x(570),value:f,onChange:t=>{l(t[x(263)].value),P(null)},disabled:!N,children:[a[x(186)](x(172),{value:"",children:x(438)}),R0[x(388)](t=>a.jsx(x(172),{value:t.id,children:t[x(571)]},t.id))]}),a.jsx(i0,{className:x(348)})]}),a[x(431)]("div",{className:"relative group min-w-0 flex-1",children:[a[x(431)](x(484),{className:x(406),value:T?.lrn||"",onChange:t=>{const r=x,s=y[r(358)](i=>i[r(232)]===t[r(263)][r(536)])||null;P(s)},disabled:!f,children:[a[x(186)]("option",{value:"",children:x(281)}),$[x(347)]>0&&a[x(186)](x(345),{label:"MALE",children:$[x(388)](t=>{const r=x,s=f&&(k[r(190)](i=>i.student_lrn===t[r(232)]&&i[r(550)]===f&&i.school_year===o)||D[r(190)](i=>i[r(165)]===t[r(232)]&&i[r(550)]===f&&i.school_year===o));return a[r(431)](r(172),{value:t[r(232)],children:[t[r(520)],", ",t[r(498)]," ",s?"✓":""]},t[r(232)])})}),x0[x(347)]>0&&a[x(186)](x(345),{label:x(561),children:x0[x(388)](t=>{const r=x,s=f&&(k[r(190)](i=>i.student_lrn===t[r(232)]&&i[r(550)]===f&&i[r(604)]===o)||D.some(i=>i[r(165)]===t[r(232)]&&i[r(550)]===f&&i[r(604)]===o));return a[r(431)](r(172),{value:t[r(232)],children:[t.last_name,", ",t.first_name," ",s?"✓":""]},t[r(232)])})})]}),a.jsx(i0,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),a.jsx("div",{className:x(341)}),a[x(431)](x(209),{className:x(453),children:[a[x(431)]("select",{value:_,onChange:t=>Z(t[x(263)][x(536)]),className:x(578),title:x(467),children:[a[x(186)](x(172),{value:"a4",children:"A4"}),a[x(186)](x(172),{value:x(602),children:x(292)}),a.jsx(x(172),{value:"folio",children:x(527)})]}),a[x(186)](i0,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),a[x(431)](x(209),{className:x(216),children:[a[x(431)](x(209),{className:x(321),title:x(421),children:[a[x(186)](x(209),{className:x(392),style:{backgroundColor:B,width:18,height:18}}),a[x(186)](x(267),{type:x(335),value:B,onChange:t=>E(t.target[x(536)]),className:x(194)})]}),a[x(431)]("div",{className:x(321),title:x(217),children:[a[x(186)](x(209),{className:x(392),style:{backgroundColor:L,width:18,height:18}}),a.jsx(x(267),{type:x(335),value:L,onChange:t=>X(t[x(263)][x(536)]),className:x(194)})]})]}),a.jsxs(x(209),{className:"flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0",children:[a[x(186)](x(310),{onClick:()=>Y(t=>Math[x(210)](.4,t-.1)),className:"w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200",title:x(398),children:a[x(186)](q0,{className:"w-3 h-3"})}),a.jsxs(x(523),{className:x(464),children:[Math[x(470)](J*100),"%"]}),a[x(186)](x(310),{onClick:()=>Y(t=>Math[x(291)](1.5,t+.1)),className:x(333),title:x(441),children:a[x(186)](V0,{className:x(315)})})]}),a[x(431)]("button",{onClick:A0,disabled:!N||!f||R[x(347)]===0,className:x(552),title:x(519),children:[a.jsx(_0,{className:x(462)}),x(420),z[x(241)],")"]}),a[x(431)](x(310),{onClick:N0,disabled:!N||!f||r0[x(347)]===0,className:x(483),title:x(422),children:[a[x(186)](j0,{className:"w-3 h-3 group-hover:-translate-y-0.5 transition-transform"}),"Bulk PDF"]}),a[x(431)](x(310),{onClick:w0,disabled:!N||!f||r0[x(347)]===0,className:x(383),title:x(198),children:[a[x(186)](d0,{className:x(182)}),x(544)]}),a[x(431)]("button",{onClick:C0,disabled:!T,className:"h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(277),children:[a.jsx(d0,{className:"w-3 h-3 group-hover:translate-y-0.5 transition-transform"}),x(418)]})]})]}),a[x(186)](x(209),{className:"flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar",children:a[x(186)](x(209),{className:x(590),children:T?a[x(186)](x(209),{className:"transition-all duration-700 ease-out origin-top print:scale-100",style:{transform:x(221)+J+x(247),willChange:x(452),backfaceVisibility:x(396),WebkitBackfaceVisibility:x(396)},children:a[x(431)](x(209),{className:"relative group",children:[a[x(186)]("div",{className:x(243)}),a.jsx(x(209),{className:"lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none",children:a[x(186)](T0,{pageNumber:1,student:T,profile:M,schoolYear:o,subject:O?.[x(571)]||"",teacher:u0,fillColor:B,outlineColor:L,gradeData:z0,attendanceData:L0,paperSize:_})})]})}):a[x(431)](x(209),{className:x(296),children:[a[x(431)](x(209),{className:x(505),children:[a[x(186)](x(209),{className:"absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full"}),a[x(431)](x(209),{className:"relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl",children:[a.jsx(W0,{className:"w-28 h-28 text-slate-100 dark:text-slate-600"}),a[x(431)](x(209),{className:x(189),children:[a[x(186)]("span",{className:x(309),children:"LIR"}),a[x(186)](x(209),{className:"w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4"})]}),a[x(186)]("div",{className:x(399),children:a[x(186)](d0,{className:x(240)})})]})]}),a[x(431)]("div",{className:"space-y-4",children:[a[x(186)]("h2",{className:x(371),children:x(261)}),a.jsx("p",{className:x(553),children:x(250)})]})]})})}),a[x(186)](x(209),{id:x(547),className:x(375),style:{left:x(557)},children:r0[x(388)](t=>{const r=x,s=h0(t,f,O),i=b0(t);return a[r(186)](r(209),{className:r(449),children:a[r(186)](T0,{pageNumber:1,student:t,profile:M,schoolYear:o,subject:O?.subject_name||"",teacher:u0,fillColor:B,outlineColor:L,gradeData:s,attendanceData:i,paperSize:_})},t[r(232)])})}),K&&a[x(186)](x(209),{className:x(389),children:a[x(431)]("div",{className:x(432),children:[a[x(431)](x(209),{className:"px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0",children:[a[x(431)](x(209),{className:x(326),children:[a[x(186)](x(209),{className:x(407),children:a.jsx(_0,{className:x(289)})}),a[x(431)]("div",{children:[a.jsx("h3",{className:x(214),children:x(300)}),a.jsxs("p",{className:x(175),children:[S?.section_grade_level,x(293),S?.[x(521)],x(366),O?.[x(571)]]})]})]}),a[x(186)](x(310),{onClick:()=>U(!1),className:x(215),children:a.jsx(X0,{className:x(372)})})]}),a[x(431)](x(209),{className:x(187),children:[a[x(431)](x(209),{className:x(539),children:[a[x(186)](Z0,{className:x(367)}),a[x(186)]("input",{type:x(490),placeholder:x(410),value:q,onChange:t=>n(t[x(263)].value),className:"w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"})]}),a.jsxs(x(209),{className:x(168),children:[a[x(431)](x(310),{onClick:O0,className:x(268),children:[a[x(186)](p0,{className:x(534)}),x(362),R[x(347)],")"]}),a[x(431)]("button",{onClick:M0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[x(457),$[x(347)],")"]}),a[x(431)](x(310),{onClick:D0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[x(359),x0[x(347)],")"]}),a[x(186)]("button",{onClick:P0,className:x(433),children:x(246)})]})]}),a[x(431)](x(209),{className:"flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4",children:[f0[x(347)]>0&&a[x(431)]("div",{className:x(317),children:[a[x(186)](x(209),{className:x(229),children:a.jsxs(x(523),{className:x(511),children:[x(271),f0.length,")"]})}),a[x(186)](x(209),{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:f0[x(388)](t=>{const r=x,s=z[r(316)](t[r(232)]),i=f&&(k[r(190)](b=>b[r(165)]===t.lrn&&b.subject_id===f&&b[r(604)]===o)||D.some(b=>b.student_lrn===t[r(232)]&&b[r(550)]===f&&b[r(604)]===o));return a[r(431)](r(209),{onClick:()=>y0(t[r(232)]),className:r(251)+r(s?211:543),children:[a[r(431)](r(209),{className:"flex items-center gap-2.5 min-w-0",children:[s?a.jsx(p0,{className:r(486)}):a.jsx(S0,{className:r(230)}),a[r(431)](r(209),{className:r(318),children:[a[r(431)]("p",{className:r(374),children:[t[r(520)],", ",t[r(498)]," ",t[r(199)]?t[r(199)][0]+".":""]}),a[r(431)]("p",{className:r(352),children:[r(197),t[r(232)]]})]})]}),i&&a[r(186)](r(523),{className:r(373),children:r(593)})]},t[r(232)])})})]}),m0.length>0&&a[x(431)]("div",{className:"space-y-2",children:[a[x(186)](x(209),{className:"flex items-center justify-between px-1",children:a[x(431)](x(523),{className:x(511),children:["Female Learners (",m0[x(347)],")"]})}),a[x(186)](x(209),{className:x(447),children:m0.map(t=>{const r=x,s=z.has(t[r(232)]),i=f&&(k[r(190)](b=>b[r(165)]===t[r(232)]&&b[r(550)]===f&&b[r(604)]===o)||D[r(190)](b=>b.student_lrn===t[r(232)]&&b[r(550)]===f&&b[r(604)]===o));return a.jsxs(r(209),{onClick:()=>y0(t[r(232)]),className:r(251)+r(s?211:543),children:[a[r(431)]("div",{className:r(337),children:[s?a[r(186)](p0,{className:r(486)}):a.jsx(S0,{className:r(230)}),a.jsxs(r(209),{className:r(318),children:[a.jsxs("p",{className:r(374),children:[t[r(520)],", ",t[r(498)]," ",t.middle_name?t[r(199)][0]+".":""]}),a[r(431)]("p",{className:r(352),children:["LRN: ",t.lrn]})]})]}),i&&a[r(186)](r(523),{className:r(373),children:r(593)})]},t[r(232)])})})]}),l0[x(347)]===0&&a.jsxs(x(209),{className:x(496),children:['No learners found matching "',q,'".']})]}),a[x(431)]("div",{className:x(596),children:[a[x(431)]("div",{className:x(500),children:[a[x(186)](x(523),{className:x(535),children:z.size}),x(510),R[x(347)],x(487)]}),a[x(431)](x(209),{className:x(437),children:[a.jsxs(x(310),{onClick:N0,disabled:z[x(241)]===0,className:"h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer",children:[a[x(186)](j0,{className:x(565)}),x(363)]}),a[x(431)](x(310),{onClick:w0,disabled:z[x(241)]===0,className:"h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer",children:[a[x(186)](d0,{className:x(565)}),x(544)]})]})]})]})}),m&&a[x(186)]("div",{className:x(272),children:a[x(431)](x(209),{className:x(509),children:[a[x(431)](x(209),{className:x(526),children:[a[x(186)]("div",{className:"absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping"}),a[x(186)](x(209),{className:x(295),children:a.jsx(K0,{className:x(417)})})]}),a[x(431)](x(209),{className:x(317),children:[a[x(186)]("h3",{className:"text-lg font-black text-slate-900 tracking-tight uppercase",children:"Processing LIR Records"}),a[x(186)]("p",{className:x(481),children:E0})]}),a[x(431)]("div",{className:"space-y-1.5",children:[a[x(186)](x(209),{className:x(469),children:a[x(186)](x(209),{className:"h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300",style:{width:Math[x(210)](5,j)+"%"}})}),a[x(431)](x(209),{className:x(249),children:[a[x(186)](x(523),{children:x(456)}),a[x(431)]("span",{children:[j,"%"]})]})]})]})}),a[x(186)]("style",{children:x(301)+(_==="a4"?"210mm 297mm":_===x(602)?x(204):"8.5in 13in")+x(599)+x(_==="a4"?319:556)+x(234)+x(_==="a4"?319:556)+` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `+(_==="a4"?"210mm":"8.5in")+` !important;
                        height: `+(_==="a4"?x(342):_==="letter"?x(598):"13in")+` !important;
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
             `})]})}function c0(){const x=["TERM","13in","final_grade","bind",`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `,"mb-2","w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0",`rem; 
                        font-weight: 700; 
                        height: `,"10%","✓ Grades","useEffect","cancelled","p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0","Dec 7-18, 2026","11in",`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `,"written_works","date-label uppercase","letter","date-val uppercase","school_year","font-bold leading-tight","student_lrn","isArray","header-green py-1","flex items-center gap-1.5 flex-wrap","Dec 18, 2026","Learner's Individual Record Card","End of Term 3","option","forEach","LIR_","text-[10px] text-slate-400 font-semibold uppercase tracking-widest","border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden",`px; 
                        border-right: 1px solid `,"section_grade_level","JANUARY","1ST","TOTAL","w-3 h-3 group-hover:scale-110 transition-transform","Start of Term 3",`;
                        padding: `,"w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform","jsx","p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0","June 8-11, 2026","absolute inset-0 flex flex-col items-center justify-center","some","Section",`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"Export failed: ","w-full h-full opacity-0 absolute inset-0 cursor-pointer","useState","label-green py-1 border-2 px-1","LRN: ","Bulk Print for selected learners","middle_name","toUpperCase","tfoot","header-subject-table border-collapse border-2","gender","8.5in 11in","important-dates-header uppercase italic",`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `,"style","quarter","div","max","bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm","Feb 16, 2027","colgroup","text-sm font-black uppercase tracking-wide text-white","w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors","flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5","Choose Outline Color",`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,"Bulk print stream launched successfully.","3RD","scale(","month-col uppercase","FIRST NAME",`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `,"GRADE & SECTION","Mar 15-16, 2027","student-info-table border-2","half-page-section border-t-4","flex items-center justify-between px-1","w-4 h-4 text-slate-300 shrink-0","flex gap-4 items-start w-full mt-2","lrn","Bulk PDF download error:",` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `,"photo_url","useCallback","filter","error","1x1 Learner Photo","w-10 h-10 text-white","size","from","absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000",`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `,`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `,"Clear",") translateZ(0)","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider","Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections.","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ","13%","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden","w-full h-full object-cover"," learners...","important-dates-box",`rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,"attendance","No sheets ready for PDF export.","relative group min-w-0 flex-1","Individual Record","Term 1: Summative Test #2","target","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate","inherit","half-page-section","input","h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1","absent","max-w-full max-h-full object-contain","Male Learners (","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200","none","red","sort","col-span-1","Print single active learner","Failed to generate PDF download.",`;
                        border-radius: 8px;
                        height: `,`rem; 
                        min-height: `,"Select Learner","lir-title-bar-custom mb-3 uppercase tracking-widest","SUBJECT","delete","BAGONG BARRIO NATIONAL HIGH SCHOOL","Individual LIR","male",`rem;
                        width: `,"w-5 h-5",`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `,"min","Letter"," - ","July 28, 2026","relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10",`px; 
                        padding: `,"quarterly_exam","FEBRUARY","Bulk LIR Operations",`
                @media print {
                    @page {
                        size: `,"flex items-center gap-4 shrink-0","M.I",`dd;
                        border: 1px solid `,"flex items-center gap-1.5 lg:gap-2 shrink-0","female","JULY","data-field uppercase font-bold border-2 whitespace-nowrap px-1","text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic","button",`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"date-row","Jan 4, 2027","font-normal ml-2","w-3 h-3","has","space-y-2","truncate","210mm",`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,"relative flex items-center justify-center cursor-pointer shrink-0","flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden","add","FIRST","school-logo.png","flex items-center gap-3","col-span-1 flex flex-col items-center justify-center pt-1","img","font-bold py-1","folio","info","name","w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200","px ","color","text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5","flex items-center gap-2.5 min-w-0","End of Term 2","object-contain","col","h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0","297mm","absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30","displayName","optgroup","JUNE","length","w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors","DECEMBER","Opening print stream for ","useMemo","text-[9px] font-medium text-slate-400","trace","__proto__","Term 2: Summative Test #2","End-of-Term Block",`; 
                        color: black !important; 
                        font-size: `,"find","Females (","student_section","replace","All (","Download PDF","DepEd Logo","AUGUST"," | ","w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400","reduce",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,"getElementById","text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase","w-4 h-4","px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0","text-xs font-bold text-slate-800 truncate","fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block",`; 
                        padding: `,`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,"trim","9639603NJXyyC","SEPTEMBER","Sept 16, 2026","14feJNlX","h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",`px;
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
                        background-color: `,"row-label py-1 px-1 border-2","Months","summative_tests","map","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200","attendance-date-cell","src","w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0","row-label","term-label","NOVEMBER","hidden","Term 2: Summative Test #1","Zoom Out","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500","z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full","flex justify-between items-center w-full overflow-hidden","PDF download complete!","data-field font-extrabold border-2 whitespace-nowrap","WRITTEN /ORAL WORKS (WWs)","toString","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200","w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400","constructor",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"Filter learners by name or LRN...","font-bold","Dates","track","1267954vJJQUB","TEACHER","#22c55e","w-8 h-8 animate-spin","Print Single","16bAgaMF","Select (","Choose Fill Color","Bulk Download PDF for selected learners","toLowerCase","w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200","label-green py-1 border-2","tbody","deped_logo_right.png",`px; 
                        font-weight: 700; 
                        font-size: `,".lir-bulk-sheet","Opening Block: Term 1","jsxs","bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]","h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1","table","#86efac","Subject","flex items-center gap-2","Select Subject","Apr 1-8, 2027","No sheets ready for printing. Please try again.","Zoom In","SECOND","teacher_id","uid","15%","-11px","grid grid-cols-1 sm:grid-cols-2 gap-2","portrait","lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always","exception","return (function() ","transform","relative group shrink-0","header-row-fill",`;
                        color: #000000 !important;
                        font-size: `,"Export Pipeline","Males (","Term 1: Summative Test #1","% complete...",`rem; 
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
                `,"LRN","w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform","40%","text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"localeCompare","Paper Size","20%","h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200","round","console",`rem; 
                        border-bottom: 2px solid `,"942204eoeoMF","success","font-black uppercase italic","print","2134596OMSDgL","Unknown error","1997695mThqMP",`; 
                        text-align: center; 
                        font-size: `,"text-xs font-semibold text-slate-500",`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,"h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","select","Bulk print error:","w-4 h-4 text-indigo-600 shrink-0"," learners selected","1 X 1","card-container-combined print:m-0 print:shadow-none","text","grow flex flex-col gap-1 overflow-hidden","Mar 24-31, 2027","July 6, 2026","74472ykMjlm","40px","p-8 text-center text-slate-400 text-xs font-medium",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,"first_name",`;
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"text-xs font-bold text-slate-600","SENIOR HIGH SCHOOL","data-field uppercase font-bold border-2 whitespace-nowrap","Start of Term 2",`px;
                        font-size: `,"relative group","thead","includes",`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `,"bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6"," of ","text-[10px] font-black text-slate-500 uppercase tracking-widest","Teacher's Signature","dates","Oct 7, 2026","attendance-table mb-3","Sept 2-15, 2026","Apr 6-7, 2027","fixed","Filter / Select Learners","last_name","section_name","text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none","span","title","Important Dates","relative w-16 h-16 mx-auto flex items-center justify-center","Folio","month",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"Term 2 Examination","querySelectorAll","push",`rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `,"w-3 h-3 text-indigo-600","text-indigo-600 font-black","value","warn","Daily Attendance","relative flex-1 min-w-48","prototype","Failed to launch bulk print.","charAt","bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50","Bulk Print","scores","Aug 28, 2026","lir-bulk-render-container","309042wHNRam"," TERM","subject_id","values","ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60","slice","signature-box bg-white","8.5in","-9999px","JUNIOR HIGH SCHOOL","section_id","School Logo","FEMALE","Total Abs.","3.32%",`px;
                        text-align: center;
                        height: `,"w-3.5 h-3.5","2ND","FINAL GRADE",`px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: `,"flex flex-col shrink-0","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate","subject_name",`rem; 
                        padding: `,`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,`rem;
                    }

                    .row-label {
                        background-color: `,"log","PHOTO","rem","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200","month-col","page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none",`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"0px","Term 3: Summative Test #2"];return c0=function(){return x},c0()}export{mx as LIRPage};
