import{j as a,r as N,cl as n0,cx as X,cv as i0,c4 as d0,c7 as x0,cu as o0}from"./vendor-CBB-Xj7m.js";import{b as h0,u as m0,h as b0,n as p0}from"./index-C9Jrcjcq.js";import"./vendor-pdf-libs-DdPxqjvt.js";import"./vendor-firebase-dDuEEUDn.js";import"./vendor-framer-motion-CzwoK_NS.js";const V=z;(function(e,g){const o=z,y=e();for(;;)try{if(-parseInt(o(471))/1+-parseInt(o(481))/2*(-parseInt(o(705))/3)+-parseInt(o(506))/4*(parseInt(o(699))/5)+-parseInt(o(610))/6+-parseInt(o(512))/7*(parseInt(o(503))/8)+parseInt(o(661))/9+parseInt(o(622))/10===g)break;y.push(y.shift())}catch{y.push(y.shift())}})(Z,439124);const J=(function(){let e=!0;return function(g,o){const y=e?function(){const R=z;if(o){const T=o[R(555)](g,arguments);return o=null,T}}:function(){};return e=!1,y}})(),l0=J(void 0,function(){const e=z,g=function(){const T=z;let d;try{d=Function(T(524)+T(514)+");")()}catch{d=window}return d},o=g(),y=o[e(476)]=o[e(476)]||{},R=[e(654),"warn","info",e(441),e(437),"table",e(682)];for(let T=0;T<R.length;T++){const d=J[e(686)][e(534)][e(448)](J),i=R[T],_=y[i]||d;d[e(414)]=J.bind(J),d[e(436)]=_[e(436)][e(448)](_),y[i]=d}});l0();const f0=({pageNumber:e,student:g,profile:o,schoolYear:y,subject:R,teacher:T,fillColor:d=V(620),outlineColor:i="#22c55e",gradeData:_,paperSize:M=V(662),attendanceData:F={}})=>{const x=V,B="./",u=25,Y=l=>Array.from({length:u},(h,b)=>l[b]??""),v=(l,h)=>{const b=z,j=Number(h);if(!j)return!1;const G=l[b(412)]();return G===b(679)&&j===12||G===b(644)&&(j===21||j===31)||G===b(652)&&(j===2||j===30)||G===b(598)&&j===8||G===b(427)&&j===1};let A=x(561),f="8.5in",r=1.12,C=1.2,H=.8,D=.75,k=5,I=.8,P=40,w=240,U=100,E=50,S=x(704);return M==="a4"?(f="210mm",A=x(543),r=1.02,C=.85,H=.55,D=.5,k=2,I=.65,P=26,w=140,U=80,E=40):M===x(442)?(f="8.5in",A="11in",r=.98,C=.85,H=.55,D=.5,k=3,I=.7,P=28,w=160,U=65,E=32,S=x(646)):M==="folio"&&(f=x(455),A="13in",r=.98,C=.85,H=.55,D=.5,k=3,I=.7,P=28,w=160,U=65,E=32,S=x(646)),a[x(482)](x(604),{className:x(521),children:a[x(706)](x(604),{className:x(552),style:{width:f,height:A},children:[a[x(482)]("style",{children:x(433)+f+" "+A+x(460)+i+x(486)+8*r+x(595)+5*r+x(424)+d+x(581)+i+x(411)+3*r+`px;
                        font-size: `+.85*r+`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `+d+x(739)+i+`;
                        font-size: `+.6*r+x(402)+i+x(486)+2*r+x(666)+.8*r+x(435)+.6*r+x(466)+i+x(486)+1.5*r+x(643)+24*r+x(560)+d+x(405)+.6*r+x(474)+d+`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `+.6*r+x(447)+70*r+x(725)+d+x(724)+i+`;
                        border-radius: 8px;
                        height: `+P*r+x(501)+w*r+`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `+d+x(398)+.9*r+x(530)+4*r+`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `+i+x(462)+i+x(428)+i+x(525)+.5*r+x(541)+21*r+x(565)+1*r+`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `+d+x(449)+.5*r+`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `+i+x(641)+d+`; 
                        color: black !important; 
                        font-size: `+.9*r+x(465)+d+x(423)+.45*r+`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `+.5*r+x(621)+i+x(523)+d+x(527)+3*r+x(693)+.85*r+x(546)+i+`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `+i+`; 
                        font-size: `+.45*r+x(432)+18*r+x(672)+95*r+`px; 
                        border-right: 1px solid `+i+x(717)+1.5*r+x(517)+4*r+`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `+1.5*r+x(517)+4*r+x(674)+.42*r+`rem; 
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
                `}),a[x(706)](x(604),{className:x(504),children:[a[x(706)]("div",{className:x(728),children:[a[x(706)](x(604),{className:x(671),children:[a[x(706)]("div",{className:x(723),children:[a[x(482)]("div",{className:x(407),style:{width:64*r,height:64*r},children:a.jsx(x(727),{src:o.logo_url||B+"school-logo.png",alt:x(453),className:"max-w-full max-h-full object-contain",onError:l=>{const h=x;l[h(478)][h(702)]=B+h(540)}})}),a[x(706)](x(604),{children:[a[x(482)]("h1",{className:x(570),style:{fontSize:C*r+x(688)},children:o[x(550)]||x(596)}),a.jsx("p",{className:x(656),style:{fontSize:H*r+"rem",color:i},children:x(669)}),a.jsxs("p",{className:x(532),style:{fontSize:D*r+x(688)},children:["School Year: ",a.jsx(x(533),{className:x(467),children:y})]})]})]}),a.jsx("div",{className:x(440),children:a[x(482)](x(718),{className:x(559),style:{borderColor:i,tableLayout:x(611)},children:a[x(482)](x(577),{children:a[x(706)]("tr",{children:[a[x(482)]("td",{className:"label-green border-2 whitespace-nowrap",style:{fontSize:I*r+x(688),padding:k*r+x(517)+k*4*r+"px",borderColor:i},children:"SUBJECT"}),a[x(482)]("td",{className:x(551),style:{fontSize:I*r+x(688),padding:k*r+x(517)+k*4*r+"px",borderColor:i},children:R}),a[x(482)]("td",{className:"label-green border-2 whitespace-nowrap",style:{fontSize:I*r+x(688),padding:k*r+x(517)+k*4*r+"px",borderColor:i},children:x(636)}),a[x(482)]("td",{className:x(551),style:{fontSize:I*r+x(688),padding:k*r+x(517)+k*4*r+"px",borderColor:i},children:T})]})})})})]}),a[x(706)](x(604),{className:x(709),children:[a[x(482)](x(604),{className:x(703),style:{width:1*r+"in",height:1*r+"in",borderColor:i},children:g.photo_url?a.jsx(x(727),{src:g[x(589)],alt:"1x1 Learner Photo",className:x(505)}):a[x(706)](x(533),{className:x(452),style:{fontSize:.7*r+x(688)},children:[x(511),a.jsx("br",{}),x(542)]})}),a[x(482)]("div",{className:x(668),children:a.jsx("table",{className:x(591),style:{borderColor:i,height:1*r+"in"},children:a[x(706)](x(577),{children:[a[x(706)]("tr",{style:{height:.5*r+"in"},children:[a[x(482)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:i,height:.5*r+"in"},children:g[x(556)]}),a[x(482)]("td",{className:x(659),style:{borderColor:i,height:.5*r+"in"},children:g.first_name}),a.jsx("td",{className:x(735),style:{width:x(487),borderColor:i,height:.5*r+"in"},children:g[x(528)]?.[x(698)](0)||""}),a[x(482)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:i,height:.5*r+"in"},children:g[x(658)]}),a[x(482)]("td",{className:x(659),style:{borderColor:i,height:.5*r+"in"},children:g[x(627)]})]}),a.jsxs("tr",{style:{height:.5*r+"in"},children:[a[x(482)]("td",{className:x(457),style:{borderColor:i,height:.5*r+"in"},children:x(509)}),a.jsx("td",{className:x(457),style:{borderColor:i,height:.5*r+"in"},children:x(616)}),a.jsx("td",{className:x(624),style:{width:x(487),borderColor:i,height:.5*r+"in"},children:x(618)}),a.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:i,height:.5*r+"in"},children:x(635)}),a[x(482)]("td",{className:"label-green py-1 border-2",style:{borderColor:i,height:.5*r+"in"},children:x(410)})]})]})})})]}),a[x(706)](x(604),{className:x(479),children:[a[x(706)](x(604),{children:[a[x(482)]("div",{className:"header-green py-1",style:{fontSize:.75*r+x(688)},children:x(403)}),a[x(482)](x(718),{style:{tableLayout:x(519)},children:a[x(706)](x(577),{children:[a[x(706)]("tr",{className:x(716),children:[a[x(482)]("td",{className:x(602),style:{width:x(720)},children:x(531)}),[1,2,3,4,5][x(500)](l=>a[x(482)]("td",{style:{width:x(544)},children:l},l)),a.jsx("td",{className:x(532),style:{width:x(660)},children:x(563)})]}),[1,2,3][x(500)](l=>a[x(706)]("tr",{children:[a[x(482)]("td",{className:x(599),children:l===1?x(710):l===2?"SECOND":"THIRD"}),[...Array(5)].map((h,b)=>a[x(482)]("td",{children:_?.[l]?.[x(609)].ww[b]??""},b)),a[x(482)]("td",{className:x(532),children:_?.[l]?.[x(609)].ww[x(587)](0,5)[x(691)]((h,b)=>h+(Number(b)||0),0)||""})]},l))]})})]}),a.jsxs(x(604),{children:[a.jsx(x(604),{className:"header-green py-1",style:{fontSize:.75*r+x(688)},children:x(429)}),a[x(482)](x(718),{style:{tableLayout:"fixed"},children:a[x(706)]("tbody",{children:[a[x(706)]("tr",{className:x(716),children:[a.jsx("td",{className:x(602),style:{width:x(660)},children:x(531)}),[1,2,3][x(500)](l=>a[x(482)]("td",{style:{width:x(660)},children:l},l)),a[x(482)]("td",{className:x(532),style:{width:x(660)},children:x(563)})]}),[1,2,3][x(500)](l=>a[x(706)]("tr",{children:[a.jsx("td",{className:x(599),children:x(l===1?710:l===2?690:600)}),[...Array(3)][x(500)]((h,b)=>a[x(482)]("td",{children:_?.[l]?.scores.pt[b]??""},b)),a[x(482)]("td",{className:x(532),children:_?.[l]?.[x(609)].pt[x(587)](0,3)[x(691)]((h,b)=>h+(Number(b)||0),0)||""})]},l))]})})]})]}),a.jsxs(x(604),{className:"grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden",children:[a[x(706)](x(604),{className:x(738),children:[a[x(482)](x(604),{className:x(421),style:{fontSize:.7*r+x(688)},children:x(648)}),a.jsx(x(718),{style:{tableLayout:"fixed"},children:a.jsxs(x(577),{children:[a[x(706)]("tr",{className:x(716),children:[a[x(482)]("td",{className:x(602),style:{width:x(566)},children:x(531)}),[1,2][x(500)](l=>a[x(482)]("td",{children:l},l))]}),[1,2,3][x(500)](l=>a[x(706)]("tr",{children:[a.jsx("td",{className:x(599),children:l===1?x(710):l===2?"SECOND":x(600)}),[...Array(2)][x(500)]((h,b)=>a[x(482)]("td",{children:_?.[l]?.[x(609)].st[b]??""},b))]},l))]})})]}),a[x(482)](x(604),{className:x(738),children:a[x(706)]("table",{style:{tableLayout:x(519)},children:[a[x(482)](x(614),{children:a[x(482)]("tr",{className:x(716),children:a[x(482)]("td",{colSpan:2,className:x(663),style:{fontSize:.7*r+"rem"},children:x(469)})})}),a[x(482)]("tbody",{children:[1,2,3].map(l=>a[x(706)]("tr",{children:[a[x(706)]("td",{className:x(417),style:{borderColor:i},children:[l===1?x(492):l===2?"2ND":x(522)," TERM"]}),a[x(482)]("td",{className:x(532),children:_?.[l]?.[x(609)].te||""})]},l))})]})}),a[x(482)](x(604),{className:"col-span-1",children:a[x(706)]("table",{style:{tableLayout:x(519)},children:[a.jsx(x(614),{children:a[x(482)]("tr",{className:"header-row-fill",children:a[x(482)]("td",{colSpan:2,className:x(663),style:{fontSize:.7*r+x(688)},children:x(687)})})}),a[x(482)](x(577),{children:[1,2,3][x(500)](l=>a[x(706)]("tr",{children:[a.jsxs("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:i},children:[l===1?x(492):l===2?"2ND":x(522),x(425)]}),a[x(482)]("td",{className:x(532),children:_?.[l]?.finalGrade||""})]},l))}),a.jsx(x(645),{children:a[x(482)]("tr",{style:{height:1.5*r+"px"},children:a[x(482)]("td",{colSpan:2,style:{border:x(657)}})})})]})}),a[x(706)](x(604),{className:"col-span-1 flex flex-col items-center justify-center pt-1",style:{marginTop:S},children:[a[x(482)](x(604),{className:x(515),children:a[x(482)]("img",{src:B+x(583),alt:x(439),className:x(558),style:{width:U*r,height:E*r}})}),a.jsx(x(604),{className:x(419)}),a[x(482)]("p",{className:"font-bold uppercase leading-none text-center",style:{fontSize:.6*r+"rem",marginTop:14*r+"px"},children:x(470)})]})]})]}),a[x(706)]("div",{className:"half-page-section border-t-4",style:{borderColor:i},children:[a.jsx(x(604),{className:x(734),children:"Daily Attendance"}),a.jsxs(x(718),{className:"attendance-table mb-3",children:[a[x(706)](x(472),{children:[a[x(482)](x(573),{style:{width:x(575)}}),Array[x(484)]({length:u}).map((l,h)=>a.jsx("col",{style:{width:"3.32%"}},h)),a[x(482)](x(573),{style:{width:"7%"}})]}),a[x(482)]("thead",{children:a[x(706)]("tr",{children:[a[x(482)]("th",{className:x(529),children:"Months"}),a[x(482)]("th",{colSpan:u,className:"dates-header-bar uppercase",children:x(586)}),a[x(482)]("th",{className:x(588),children:x(400)})]})}),a.jsx(x(577),{children:[{name:x(679),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:x(629),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:x(644),dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:x(696),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:x(707),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:x(652),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:x(598),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:x(427),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:x(549),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:x(701),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:x(507),dates:[1,2,5,6,7,8]}][x(500)](l=>a[x(706)]("tr",{children:[a[x(482)]("td",{className:"month-col",children:l[x(550)]}),Y(l.dates)[x(500)]((h,b)=>a[x(482)]("td",{className:"attendance-date-cell",style:{color:v(l[x(550)],h)?x(713):x(513)},children:h},b)),a.jsx("td",{className:x(532),children:F[l[x(550)]]||""})]},l.name))})]}),a[x(706)]("div",{className:x(459),style:{borderColor:i},children:[a.jsxs(x(604),{className:x(630),children:[a.jsx(x(604),{className:x(406),children:x(569)}),[[x(404),x(413)],[x(553),x(488)],[x(626),x(685)],[x(694),x(535)],[x(520),"Term 1 Examination"],[x(497),x(634)],[x(719),x(420)]][x(500)](([l,h])=>a[x(706)](x(604),{className:x(491),children:[a[x(482)]("div",{className:x(489),children:l}),a[x(482)](x(604),{className:"date-label uppercase",children:h})]},l))]}),a[x(706)](x(604),{className:x(630),children:[a[x(482)]("div",{className:x(406),children:x(569)}),[[x(613),x(714)],["Oct 29, 2026","Term 2: Summative Test #2"],["Dec 3-4, 2026",x(649)],[x(619),x(634)],["Dec 18, 2026",x(605)],[x(608),"Start of Term 3"],[x(721),x(401)]][x(500)](([l,h])=>a[x(706)](x(604),{className:x(491),children:[a.jsx(x(604),{className:"date-val uppercase",children:l}),a[x(482)](x(604),{className:x(729),children:h})]},l))]}),a[x(706)]("div",{className:"important-dates-box",children:[a.jsx(x(604),{className:x(406),children:x(569)}),[["Feb 16, 2027",x(430)],[x(731),x(458)],[x(399),x(612)],[x(539),x(634)],[x(557),x(634)],[x(708),"EOSY Rites"],["Apr 8, 2027",x(683)]][x(500)](([l,h])=>a[x(706)](x(604),{className:x(491),children:[a[x(482)](x(604),{className:"date-val uppercase",children:l}),a.jsx("div",{className:x(729),children:h})]},l))]})]})]})]})]})})};function _0(){const e=V,{students:g,sections:o,subjects:y,teachers:R,schoolProfile:T,activeSchoolYear:d,setCurrentView:i,classRecords:_,gradingSheetRecords:M,hpsRecords:F,sf2Sheets:x}=h0(),{user:B}=m0(),[u,Y]=N.useState(""),[v,A]=N[e(416)](null),[f,r]=N[e(416)](""),[C,H]=N[e(416)](1),[D,k]=N[e(416)]("#86efac"),[I,P]=N[e(416)](e(495)),[w,U]=N[e(416)](e(662)),E=N[e(637)](()=>{const t=e;return o[t(625)](c=>c[t(451)]===u||c.id===u)},[o,u]),S=N[e(637)](()=>y[e(625)](c=>c.id===f||c.subject_name===f),[y,f]),l=N[e(637)](()=>{if(!E)return[];const t=b0(B,E,y),c=new Set;return t.filter(s=>{const n=z,m=p0(s.subject_name);return c[n(579)](m)?!1:(c[n(545)](m),!0)})},[E,y,B]),h=N[e(637)](()=>{const t=e;if(S?.[t(418)]){const c=R[t(625)](s=>s[t(574)]===S.teacher_id||s.id===S[t(418)]);if(c)return c[t(585)]||c.name}return E?.adviser_name||""},[S,R,E]),b=()=>{const t=e;if(!v)return;const c=document[t(445)],s=(v[t(556)]+"_"+v[t(499)])[t(415)](/[^a-z0-9]/gi,"_");document[t(445)]=t(568)+s+"_"+d,window.print(),setTimeout(()=>{const n=t;document[n(445)]=c},1e3)},j=N.useMemo(()=>{const t=e;return[...o][t(434)]((c,s)=>{const n=t,m=(c[n(580)]||"").localeCompare(s[n(580)]||"",void 0,{numeric:!0});return m!==0?m:(c[n(451)]||"")[n(518)](s.section_name||"")})},[o]),G=N[e(637)](()=>{const t={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return j.forEach(c=>{const s=z,n=(c.section_grade_level||"").toLowerCase(),m=parseInt(n[s(415)](/\D/g,""))||0;n.includes(s(722))||m>=1&&m<=6?t[s(593)].push(c):m>=7&&m<=10?t[s(667)][s(508)](c):m>=11&&m<=12&&t[s(554)][s(508)](c)}),t},[j]);N[e(732)](()=>{if(!u&&j[e(712)]===1){const c=setTimeout(()=>{Y(j[0].section_name)},0);return()=>clearTimeout(c)}},[j,u]),N[e(732)](()=>{const t=setTimeout(()=>{r(""),A(null)},0);return()=>clearTimeout(t)},[u]);const K=N[e(637)](()=>{const t=e;if(!u)return[];const c=o.find(s=>s[t(451)]===u||s.id===u)?.id;return g[t(397)](s=>s[t(658)]===u||c&&s[t(658)]===c)},[g,u,o]),Q=K[e(397)](t=>(t.gender||"")[e(562)]()===e(502)).sort((t,c)=>t.last_name[e(518)](c.last_name)),$=K[e(397)](t=>(t[e(485)]||"").toLowerCase()===e(664))[e(434)]((t,c)=>t[e(556)][e(518)](c[e(556)])),e0=N.useMemo(()=>{const t=e;if(!v)return{};const c={};return x[t(397)](n=>n[t(681)]===d&&(n[t(516)]===E?.id||n[t(516)]===u))[t(655)](n=>{const m=t,L=n[m(510)]?.[v[m(627)]];if(L){const W=Object[m(592)](L)[m(397)](q=>q?.[m(562)]()===m(617))[m(712)];W>0&&(c[n.month[m(412)]()]=W)}}),c},[v,x,d,E,u]),a0=N[e(637)](()=>{if(!v||!f)return;const t={};return[1,2,3].forEach(c=>{const s=z,n=_.find(p=>p.student_lrn===v[s(627)]&&p.school_year===d&&Number(p[s(547)])===c&&(p[s(642)]===S?.id||p.subject_id===f))||M[s(625)](p=>p.student_lrn===v[s(627)]&&p[s(681)]===d&&Number(p[s(547)])===c&&(p[s(642)]===S?.id||p.subject_id===f)),m=F.find(p=>(p[s(642)]===S?.id||p[s(642)]===f)&&p[s(681)]===d&&Number(p[s(547)])===c),L=(p,t0)=>{const r0=s,c0=Array.isArray(p)?p:[];return Array[r0(484)]({length:t0},(u0,s0)=>c0[s0]??"")},W=n,q=m,O=p=>p===""||p===null||p===void 0?"":p;t[c]={scores:{ww:L(n?.[s(443)],10)[s(500)](O),pt:L(n?.[s(631)],10)[s(500)](O),st:L(W?.[s(676)],5)[s(500)](O),te:O(n?.[s(680)]??"")},hps:{ww:L(m?.written_works,10)[s(500)](O),pt:L(m?.[s(631)],10).map(O),st:L(q?.[s(676)],5)[s(500)](O),te:O(m?.[s(680)]??"")},finalGrade:O(n?.[s(597)]??"")}}),t},[v,f,S,_,M,F,d]);return a[e(706)](e(604),{className:e(498),children:[a[e(706)](e(604),{className:e(670),children:[a[e(482)]("div",{className:e(536)}),a.jsxs(e(604),{className:e(695),children:[a[e(706)](e(604),{className:e(632),children:[a.jsx(e(673),{onClick:()=>i(e(396)),className:e(684),title:e(450),children:a[e(482)](n0,{className:"w-4 h-4 group-hover:-translate-x-0.5 transition-transform"})}),a.jsxs("div",{className:"flex flex-col shrink-0",children:[a.jsx("h2",{className:"text-[11px] lg:text-[12px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1",children:"Learner Record"}),a[e(482)]("p",{className:"text-[7.5px] font-black text-emerald-600 uppercase tracking-widest leading-none",children:"Individual LIR"})]})]}),a[e(482)]("div",{className:"h-6 w-px bg-slate-200 shrink-0 mx-0.5"}),a.jsxs(e(604),{className:e(584),children:[a[e(706)](e(464),{className:e(480),value:u,onChange:t=>{const c=e;Y(t.target[c(444)]),A(null),r("")},children:[a.jsx(e(408),{value:"",children:e(665)}),Object[e(615)](G)[e(500)](([t,c])=>c[e(712)]>0&&a[e(482)](e(490),{label:t,children:c[e(500)](s=>a[e(706)](e(408),{value:s.section_name,children:[s[e(580)],e(578),s[e(451)]]},s.id))},t))]}),a[e(482)](X,{className:e(454)})]}),a.jsxs(e(604),{className:e(584),children:[a[e(706)](e(464),{className:e(493),value:f,onChange:t=>{const c=e;r(t.target[c(444)]),A(null)},disabled:!u,children:[a[e(482)](e(408),{value:"",children:e(431)}),l[e(500)](t=>a[e(482)](e(408),{value:t.id,children:t[e(678)]},t.id))]}),a.jsx(X,{className:e(454)})]}),a[e(706)](e(604),{className:"relative group shrink-0",children:[a[e(706)]("select",{className:"appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[140px] lg:min-w-[160px] max-w-[200px] truncate disabled:opacity-30 duration-200",value:v?.[e(627)]||"",onChange:t=>{const c=e,s=g[c(625)](n=>n.lrn===t[c(478)][c(444)])||null;A(s)},disabled:!f,children:[a[e(482)]("option",{value:"",children:e(582)}),Q[e(712)]>0&&a[e(482)](e(490),{label:e(651),children:Q[e(500)](t=>{const c=e,s=f&&(_.some(n=>n.student_lrn===t[c(627)]&&n[c(642)]===f&&n[c(681)]===d)||M[c(692)](n=>n.student_lrn===t[c(627)]&&n[c(642)]===f&&n.school_year===d));return a[c(706)](c(408),{value:t[c(627)],children:[t[c(556)],", ",t[c(499)]," ",s?"✓":""]},t[c(627)])})}),$[e(712)]>0&&a[e(482)](e(490),{label:e(711),children:$.map(t=>{const c=e,s=f&&(_[c(692)](n=>n.student_lrn===t[c(627)]&&n[c(642)]===f&&n[c(681)]===d)||M[c(692)](n=>n[c(623)]===t[c(627)]&&n[c(642)]===f&&n[c(681)]===d));return a[c(706)]("option",{value:t[c(627)],children:[t[c(556)],", ",t.first_name," ",s?"✓":""]},t[c(627)])})})]}),a.jsx(X,{className:"w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors"})]}),a[e(482)]("div",{className:"h-6 w-px bg-slate-200 shrink-0 mx-0.5"}),a[e(706)](e(604),{className:e(584),children:[a[e(706)](e(464),{value:w,onChange:t=>U(t[e(478)].value),className:e(647),title:"Paper Size",children:[a.jsx(e(408),{value:"a4",children:"A4"}),a.jsx(e(408),{value:e(442),children:e(715)}),a.jsx(e(408),{value:e(662),children:"Folio"})]}),a[e(482)](X,{className:"w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors"})]}),a[e(482)]("div",{className:e(733)}),a[e(706)](e(604),{className:e(496),children:[a[e(706)](e(604),{className:"relative flex items-center justify-center cursor-pointer shrink-0",title:e(538),children:[a.jsx("div",{className:e(463),style:{backgroundColor:D}}),a.jsx(e(461),{type:e(737),value:D,onChange:t=>k(t.target[e(444)]),className:e(426)})]}),a[e(706)](e(604),{className:e(475),title:e(638),children:[a[e(482)](e(604),{className:"w-5 h-5 rounded-lg border border-slate-200 shadow-sm shrink-0",style:{backgroundColor:I}}),a[e(482)](e(461),{type:"color",value:I,onChange:t=>P(t[e(478)][e(444)]),className:e(426)})]})]}),a[e(482)](e(604),{className:e(733)}),a[e(706)]("div",{className:e(446),children:[a[e(482)]("button",{onClick:()=>H(t=>Math[e(468)](.4,t-.1)),className:e(590),title:"Zoom Out",children:a[e(482)](i0,{className:e(740)})}),a.jsxs(e(533),{className:e(456),children:[Math[e(607)](C*100),"%"]}),a[e(482)](e(673),{onClick:()=>H(t=>Math.min(1.5,t+.1)),className:e(590),title:e(526),children:a.jsx(d0,{className:e(740)})})]}),a[e(482)](e(604),{className:e(733)}),a[e(706)](e(673),{onClick:b,disabled:!v,className:e(571),children:[a[e(482)](x0,{className:"w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform"}),e(730)]})]})]}),a.jsx(e(604),{className:"flex-1 overflow-auto relative bg-slate-100 print:bg-white custom-scrollbar",children:a[e(482)]("div",{className:e(564),children:v?a[e(482)]("div",{className:e(409),style:{transform:e(675)+C+e(494),willChange:e(628),backfaceVisibility:e(677),WebkitBackfaceVisibility:"hidden"},children:a[e(706)](e(604),{className:"relative group",children:[a[e(482)](e(604),{className:e(537)}),a[e(482)]("div",{className:e(473),children:a[e(482)](f0,{pageNumber:1,student:v,profile:T,schoolYear:d,subject:S?.[e(678)]||"",teacher:h,fillColor:D,outlineColor:I,gradeData:a0,attendanceData:e0,paperSize:w})})]})}):a.jsxs(e(604),{className:e(653),children:[a[e(706)]("div",{className:"relative group",children:[a[e(482)](e(604),{className:"absolute -inset-24 bg-emerald-500/5 blur-[120px] rounded-full"}),a.jsxs(e(604),{className:"relative w-64 h-64 bg-white rounded-[5rem] border border-slate-200 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl",children:[a[e(482)](o0,{className:e(477)}),a[e(706)](e(604),{className:e(572),children:[a.jsx(e(533),{className:e(700),children:e(689)}),a[e(482)](e(604),{className:"w-20 h-1 bg-emerald-500/10 rounded-full mt-4"})]}),a[e(482)](e(604),{className:e(603),children:a[e(482)](x0,{className:e(736)})})]})]}),a[e(706)]("div",{className:e(601),children:[a[e(482)]("h2",{className:e(594),children:"Individual Record"}),a.jsx("p",{className:e(640),children:e(650)})]})]})})}),a.jsx(e(576),{children:e(633)+e(w==="a4"?483:w==="letter"?639:697)+e(422)+e(w==="a4"?438:455)+e(606)+(w==="a4"?e(543):w==="letter"?e(567):"13in")+e(548)+(w==="a4"?"210mm":e(455))+` !important;
                        height: `+(w==="a4"?e(543):w===e(442)?e(567):"13in")+` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `+(w==="a4"?e(438):"8.5in")+e(606)+(w==="a4"?"297mm":w===e(442)?"11in":e(561))+e(726)})]})}function z(e,g){return e=e-396,Z()[e]}function Z(){const e=["school-logo.png",`rem; 
                        font-weight: 700; 
                        height: `,"PHOTO","297mm","13%","add",`rem; 
                        border-bottom: 2px solid `,"quarter",` !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `,"FEBRUARY","name","data-field font-extrabold border-2 whitespace-nowrap","page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none","July 6, 2026","SENIOR HIGH SCHOOL","apply","last_name","Apr 1-8, 2027","object-contain","border-collapse border-2",`px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .term-label {
                        color: #ef4444;
                        background-color: `,"13in","toLowerCase","TOTAL","w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0",`px; 
                        padding: `,"40%","11in","LIR_","Important Dates","font-extrabold uppercase whitespace-nowrap","h-9 px-3.5 lg:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8.5px] uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200","absolute inset-0 flex flex-col items-center justify-center","col","uid","10%","style","tbody"," - ","has","section_grade_level",`;
                        border: 1px solid `,"Select Learner","deped_logo_right.png","relative group shrink-0","displayName","Dates","slice","absences-header uppercase","photo_url","w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all active:scale-90 duration-200","student-info-table border-2","values","ELEMENTARY","text-4xl font-black text-slate-900 tracking-tight uppercase",`px;
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
                        padding: `,"BAGONG BARRIO NATIONAL HIGH SCHOOL","final_grade","DECEMBER","row-label","THIRD","space-y-4","term-label","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 group-hover:rotate-12 transition-all duration-500","div","End of Term 2",` !important;
                        height: `,"round","Jan 4, 2027","scores","1612890JXlSck","auto","Term 3 Exam (Non-Grad)","Oct 7, 2026","thead","entries","FIRST NAME","absent","M.I","Dec 7-18, 2026","#86efac",`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `,"7447840TeRQoH","student_lrn","label-green py-1 border-2 px-1","find","July 28, 2026","lrn","transform","JULY","important-dates-box","performance_tasks","flex items-center gap-2 lg:gap-3 shrink-0",`
                @media print {
                    @page {
                        size: `,"End-of-Term Block","GRADE & SECTION","TEACHER","useMemo","Choose Outline Color","8.5in 11in","text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,"subject_id",`px;
                        text-align: center;
                        height: `,"AUGUST","tfoot","-11px","appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer min-w-[70px] lg:min-w-[80px] duration-200","SUMMATIVE TEST","Term 2 Examination","Select a learner from the toolbar above to preview their individual record card.","MALE","NOVEMBER","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10","log","forEach","font-black uppercase italic","none","student_section","data-field uppercase font-bold border-2 whitespace-nowrap","20%","5335515XGrGpf","folio","font-bold py-1","female","Choose Section",`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `,"JUNIOR HIGH SCHOOL","grow flex flex-col gap-1 overflow-hidden","Learner's Individual Record Card","z-20 bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm sticky top-0 print:hidden shrink-0 w-full","flex justify-between items-center w-full overflow-hidden",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"button",`px; 
                        font-weight: 700; 
                        font-size: `,"scale(","summative_tests","hidden","subject_name","JUNE","quarterly_exam","school_year","trace","End of Term 3","w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all group shrink-0 active:scale-95 duration-200","Term 1: Summative Test #2","constructor","FINAL GRADE","rem","LIR","SECOND","reduce","some",`px; 
                        font-size: `,"Aug 28, 2026","flex items-center justify-start w-full h-16 select-none relative px-3 lg:px-4 gap-2 lg:gap-3 overflow-x-auto scrollbar-none","SEPTEMBER","8.5in 13in","charAt","5LithUi","text-7xl font-black text-slate-100 tracking-tighter leading-none italic","MARCH","src","border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden","0px","2559CuDUNa","jsxs","OCTOBER","Apr 6-7, 2027","flex gap-4 items-start w-full mt-2","FIRST","FEMALE","length","red","Term 2: Summative Test #1","Letter","header-row-fill",`; 
                        padding: `,"table","Sept 16, 2026","15%","Jan 25, 2027","kinder","flex items-center gap-4 shrink-0",`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,` !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                }
             `,"img","half-page-section","date-label uppercase","Print / PDF","Mar 15-16, 2027","useEffect","h-6 w-px bg-slate-200 shrink-0 mx-0.5","lir-title-bar-custom mb-3 uppercase tracking-widest","data-field uppercase font-bold border-2 whitespace-nowrap px-1","w-10 h-10 text-white","color","col-span-1",`dd;
                        border: 1px solid `,"w-3.5 h-3.5","school-forms","filter",`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,"Mar 22-23, 2027","Total Abs.","Term 3: Summative Test #1",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"WRITTEN /ORAL WORKS (WWs)","June 8-11, 2026",`44;
                        font-weight: 800;
                        font-size: `,"important-dates-header uppercase italic","flex items-center justify-center bg-white overflow-hidden","option","transition-all duration-700 ease-out origin-top print:scale-100","LRN",`;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"toUpperCase","Opening Block: Term 1","__proto__","replace","useState","row-label py-1 px-1 border-2","teacher_id","signature-box bg-white","Start of Term 2","header-green py-1",`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `,`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `,`px 0;
                        width: 100%;
                    }

                    .header-green {
                        background-color: `," TERM","w-5 h-5 opacity-0 absolute inset-0 cursor-pointer","JANUARY",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,"PRODUCT/PERFORMANCE TASK (PPTs)","Term 3: Summative Test #2","Select Subject",`rem; 
                        min-height: `,`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"sort",`rem;
                        vertical-align: middle;
                        background-color: white;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,"toString","exception","210mm","DepEd Logo","w-auto ml-4 overflow-hidden","error","letter","written_works","value","title","flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 h-9 shrink-0",`rem;
                        width: `,"bind",`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,"Back to Hub","section_name","font-bold leading-tight","School Logo","w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors","8.5in","text-[9px] font-black text-slate-900 w-8 text-center tabular-nums","label-green py-1 border-2","Term 3 Exam (Graduating)","flex items-stretch border-2 w-full overflow-hidden",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        border: 4px solid `,"input",`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `,"w-5 h-5 rounded-lg border border-slate-200 shadow-sm shrink-0","select",`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,`rem;
                        table-layout: fixed;
                    }

                    th, td {
                        border: 1px solid `,"font-normal ml-2","max","TERM EXAM","Teacher's Signature","768734cXrfIW","colgroup","lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none",`rem;
                    }

                    .row-label {
                        background-color: `,"relative flex items-center justify-center cursor-pointer shrink-0","console","w-28 h-28 text-slate-100","target","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden","appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[120px] lg:min-w-[135px] duration-200","1390nkABmR","jsx","210mm 297mm","from","gender",`;
                        padding: `,"40px","Term 1: Summative Test #1","date-val uppercase","optgroup","date-row","1ST","appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer min-w-[130px] lg:min-w-[145px] disabled:opacity-30 duration-200",") translateZ(0)","#22c55e","flex gap-1.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 h-9 shrink-0 items-center px-2","Sept 2-15, 2026","lir-print-root flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white","first_name","map",`px;
                        width: `,"male","104uqXNoD","card-container-combined print:m-0 print:shadow-none","w-full h-full object-cover","237392vZgdpM","APRIL","push","LAST NAME","attendance","1 X 1","212387JIPTjH","inherit",'{}.constructor("return this")( )',"mb-2","section_id","px ","localeCompare","fixed","Sept 1, 2026","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","3RD",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"return (function() ",`; 
                        text-align: center; 
                        font-size: `,"Zoom In",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,"middle_name","month-col uppercase",`rem; 
                        padding: `,"TERM","font-bold","span","prototype","Term 1 Examination","absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30","absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000","Choose Fill Color","Mar 24-31, 2027"];return Z=function(){return e},Z()}export{_0 as LIRPage};
