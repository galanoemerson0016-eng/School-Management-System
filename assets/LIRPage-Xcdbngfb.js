import{j as a,r as N,cq as d0,bH as W,cA as o0,c9 as c0,cc as x0,cz as h0}from"./vendor-Don31Pyb.js";import{b as b0,u as m0,h as p0,n as f0}from"./index-dH4LUQtE.js";import"./vendor-pdf-libs-CsceViYl.js";import"./vendor-firebase-DxYlaupo.js";import"./vendor-framer-motion-C5RdYTKi.js";const Z=B;(function(e,u){const c=B,y=e();for(;;)try{if(-parseInt(c(486))/1*(-parseInt(c(495))/2)+parseInt(c(479))/3+-parseInt(c(607))/4+parseInt(c(555))/5*(parseInt(c(433))/6)+parseInt(c(587))/7+-parseInt(c(574))/8*(parseInt(c(608))/9)+-parseInt(c(376))/10===u)break;y.push(y.shift())}catch{y.push(y.shift())}})(q,130220);const P=(function(){let e=!0;return function(u,c){const y=e?function(){if(c){const R=c.apply(u,arguments);return c=null,R}}:function(){};return e=!1,y}})(),i0=P(void 0,function(){const e=B,u=function(){const O=B;let o;try{o=Function(O(399)+'{}.constructor("return this")( ));')()}catch{o=window}return o},c=u(),y=c[e(559)]=c.console||{},R=[e(440),"warn",e(476),e(602),e(347),"table",e(263)];for(let O=0;O<R[e(506)];O++){const o=P[e(501)].prototype[e(530)](P),i=R[O],_=y[i]||o;o[e(314)]=P[e(530)](P),o[e(369)]=_.toString[e(530)](_),y[i]=o}});i0();const u0=({pageNumber:e,student:u,profile:c,schoolYear:y,subject:R,teacher:O,fillColor:o="#86efac",outlineColor:i="#22c55e",gradeData:_,paperSize:M=Z(468),attendanceData:Y={}})=>{const x=Z,U="./",f=25,V=n=>Array.from({length:f},(h,m)=>n[m]??""),v=(n,h)=>{const m=B,j=Number(h);if(!j)return!1;const G=n.toUpperCase();return G==="JUNE"&&j===12||G===m(581)&&(j===21||j===31)||G===m(308)&&(j===2||j===30)||G===m(535)&&j===8||G===m(566)&&j===1};let I=x(400),p=x(326),r=1.12,H=1.2,C=.8,D=.75,S=5,A=.8,F=40,g=240,J=100,E=50,T=x(567);return M==="a4"?(p=x(511),I=x(432),r=1.02,H=.85,C=.55,D=.5,S=2,A=.65,F=26,g=140,J=80,E=40):M===x(448)?(p=x(326),I="11in",r=.98,H=.85,C=.55,D=.5,S=3,A=.7,F=28,g=160,J=65,E=32,T=x(582)):M===x(468)&&(p=x(326),I="13in",r=.98,H=.85,C=.55,D=.5,S=3,A=.7,F=28,g=160,J=65,E=32,T=x(582)),a[x(306)](x(584),{className:x(575),children:a[x(603)](x(584),{className:x(294),style:{width:p,height:I},children:[a[x(306)](x(516),{children:x(591)+p+" "+I+x(437)+i+`;
                        padding: `+8*r+x(275)+5*r+`px 0;
                        width: 100%;
                    }

                    .header-green {
                        background-color: `+o+`;
                        border: 1px solid `+i+x(497)+3*r+x(416)+.85*r+x(600)+o+x(423)+i+x(371)+.6*r+x(350)+i+x(412)+2*r+x(395)+.8*r+`rem;
                        vertical-align: middle;
                        background-color: white;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `+.6*r+`rem;
                        table-layout: fixed;
                    }

                    th, td {
                        border: 1px solid `+i+x(412)+1.5*r+x(502)+24*r+x(339)+o+x(387)+.6*r+`rem;
                    }

                    .row-label {
                        background-color: `+o+x(316)+.6*r+x(543)+70*r+`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `+o+x(537)+i+x(329)+F*r+x(438)+g*r+x(293)+o+x(450)+.9*r+x(413)+4*r+x(490)+i+x(590)+i+`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `+i+`; 
                        text-align: center; 
                        font-size: `+.5*r+x(518)+21*r+x(536)+1*r+`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `+o+x(367)+.5*r+x(557)+i+x(274)+o+x(418)+.9*r+`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `+o+`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `+.45*r+x(348)+.5*r+x(491)+i+x(514)+o+x(332)+3*r+x(404)+.85*r+x(312)+i+x(366)+i+x(585)+.45*r+`rem; 
                        min-height: `+18*r+x(561)+95*r+x(453)+i+x(301)+1.5*r+"px "+4*r+x(606)+1.5*r+x(297)+4*r+x(313)+.42*r+`rem; 
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
                `}),a[x(603)](x(584),{className:x(386),children:[a[x(603)](x(584),{className:x(580),children:[a.jsxs(x(584),{className:x(325),children:[a[x(603)]("div",{className:x(465),children:[a[x(306)](x(584),{className:"flex items-center justify-center bg-white overflow-hidden",style:{width:64*r,height:64*r},children:a[x(306)](x(471),{src:c[x(283)]||U+x(383),alt:"School Logo",className:x(596),onError:n=>{const h=x;n[h(541)][h(553)]=U+"school-logo.png"}})}),a.jsxs(x(584),{children:[a[x(306)]("h1",{className:x(303),style:{fontSize:H*r+x(498)},children:c[x(568)]||x(296)}),a[x(306)]("p",{className:"font-black uppercase italic",style:{fontSize:C*r+x(498),color:i},children:x(489)}),a.jsxs("p",{className:x(569),style:{fontSize:D*r+x(498)},children:[x(492),a[x(306)](x(548),{className:"font-normal ml-2",children:y})]})]})]}),a[x(306)](x(584),{className:"w-auto ml-4 overflow-hidden",children:a[x(306)](x(572),{className:x(593),style:{borderColor:i,tableLayout:x(512)},children:a.jsx(x(305),{children:a.jsxs("tr",{children:[a[x(306)]("td",{className:x(351),style:{fontSize:A*r+x(498),padding:S*r+x(297)+S*4*r+"px",borderColor:i},children:"SUBJECT"}),a[x(306)]("td",{className:x(264),style:{fontSize:A*r+x(498),padding:S*r+x(297)+S*4*r+"px",borderColor:i},children:R}),a[x(306)]("td",{className:x(351),style:{fontSize:A*r+x(498),padding:S*r+x(297)+S*4*r+"px",borderColor:i},children:"TEACHER"}),a[x(306)]("td",{className:x(264),style:{fontSize:A*r+x(498),padding:S*r+x(297)+S*4*r+"px",borderColor:i},children:O})]})})})})]}),a[x(603)](x(584),{className:x(551),children:[a[x(306)](x(584),{className:x(534),style:{width:1*r+"in",height:1*r+"in",borderColor:i},children:u[x(265)]?a.jsx(x(471),{src:u[x(265)],alt:x(272),className:x(381)}):a[x(603)]("span",{className:"font-bold leading-tight",style:{fontSize:.7*r+"rem"},children:[x(349),a[x(306)]("br",{}),"PHOTO"]})}),a[x(306)]("div",{className:x(542),children:a[x(306)]("table",{className:x(403),style:{borderColor:i,height:1*r+"in"},children:a.jsxs(x(305),{children:[a[x(603)]("tr",{style:{height:.5*r+"in"},children:[a[x(306)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:i,height:.5*r+"in"},children:u.last_name}),a[x(306)]("td",{className:x(361),style:{borderColor:i,height:.5*r+"in"},children:u[x(379)]}),a.jsx("td",{className:x(392),style:{width:x(480),borderColor:i,height:.5*r+"in"},children:u.middle_name?.[x(595)](0)||""}),a[x(306)]("td",{className:x(361),style:{borderColor:i,height:.5*r+"in"},children:u[x(269)]}),a.jsx("td",{className:x(361),style:{borderColor:i,height:.5*r+"in"},children:u[x(295)]})]}),a[x(603)]("tr",{style:{height:.5*r+"in"},children:[a[x(306)]("td",{className:x(483),style:{borderColor:i,height:.5*r+"in"},children:x(521)}),a.jsx("td",{className:x(483),style:{borderColor:i,height:.5*r+"in"},children:x(331)}),a[x(306)]("td",{className:x(539),style:{width:x(480),borderColor:i,height:.5*r+"in"},children:x(517)}),a[x(306)]("td",{className:"label-green py-1 border-2",style:{borderColor:i,height:.5*r+"in"},children:x(284)}),a[x(306)]("td",{className:x(483),style:{borderColor:i,height:.5*r+"in"},children:x(407)})]})]})})})]}),a.jsxs(x(584),{className:x(525),children:[a[x(603)](x(584),{children:[a[x(306)](x(584),{className:"header-green py-1",style:{fontSize:.75*r+x(498)},children:x(456)}),a[x(306)](x(572),{style:{tableLayout:x(340)},children:a[x(603)](x(305),{children:[a.jsxs("tr",{className:x(378),children:[a[x(306)]("td",{className:x(333),style:{width:x(443)},children:x(554)}),[1,2,3,4,5][x(377)](n=>a[x(306)]("td",{style:{width:x(552)},children:n},n)),a.jsx("td",{className:x(569),style:{width:"20%"},children:x(531)})]}),[1,2,3][x(377)](n=>a[x(603)]("tr",{children:[a[x(306)]("td",{className:x(532),children:n===1?x(300):n===2?"SECOND":x(578)}),[...Array(5)][x(377)]((h,m)=>a.jsx("td",{children:_?.[n]?.scores.ww[m]??""},m)),a[x(306)]("td",{className:"font-bold",children:_?.[n]?.[x(389)].ww[x(355)](0,5)[x(320)]((h,m)=>h+(Number(m)||0),0)||""})]},n))]})})]}),a[x(603)](x(584),{children:[a[x(306)](x(584),{className:x(472),style:{fontSize:.75*r+x(498)},children:x(455)}),a[x(306)](x(572),{style:{tableLayout:x(340)},children:a[x(603)](x(305),{children:[a[x(603)]("tr",{className:x(378),children:[a[x(306)]("td",{className:x(333),style:{width:x(573)},children:"TERM"}),[1,2,3][x(377)](n=>a[x(306)]("td",{style:{width:"20%"},children:n},n)),a[x(306)]("td",{className:x(569),style:{width:x(573)},children:x(531)})]}),[1,2,3][x(377)](n=>a[x(603)]("tr",{children:[a.jsx("td",{className:"row-label",children:n===1?x(300):n===2?x(469):"THIRD"}),[...Array(3)].map((h,m)=>a[x(306)]("td",{children:_?.[n]?.scores.pt[m]??""},m)),a[x(306)]("td",{className:x(569),children:_?.[n]?.[x(389)].pt[x(355)](0,3)[x(320)]((h,m)=>h+(Number(m)||0),0)||""})]},n))]})})]})]}),a.jsxs(x(584),{className:x(335),children:[a[x(603)](x(584),{className:x(388),children:[a[x(306)](x(584),{className:"header-green py-1",style:{fontSize:.7*r+x(498)},children:x(522)}),a[x(306)](x(572),{style:{tableLayout:"fixed"},children:a[x(603)](x(305),{children:[a[x(603)]("tr",{className:x(378),children:[a[x(306)]("td",{className:x(333),style:{width:"40%"},children:x(554)}),[1,2].map(n=>a.jsx("td",{children:n},n))]}),[1,2,3][x(377)](n=>a[x(603)]("tr",{children:[a[x(306)]("td",{className:x(532),children:n===1?x(300):n===2?x(469):"THIRD"}),[...Array(2)][x(377)]((h,m)=>a.jsx("td",{children:_?.[n]?.[x(389)].st[m]??""},m))]},n))]})})]}),a.jsx(x(584),{className:x(388),children:a[x(603)](x(572),{style:{tableLayout:x(340)},children:[a[x(306)]("thead",{children:a[x(306)]("tr",{className:x(378),children:a.jsx("td",{colSpan:2,className:x(343),style:{fontSize:.7*r+x(498)},children:"TERM EXAM"})})}),a[x(306)](x(305),{children:[1,2,3][x(377)](n=>a[x(603)]("tr",{children:[a[x(603)]("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:i},children:[n===1?"1ST":x(n===2?428:426),x(565)]}),a[x(306)]("td",{className:x(569),children:_?.[n]?.scores.te||""})]},n))})]})}),a[x(306)](x(584),{className:x(388),children:a[x(603)](x(572),{style:{tableLayout:x(340)},children:[a.jsx(x(463),{children:a[x(306)]("tr",{className:x(378),children:a[x(306)]("td",{colSpan:2,className:x(343),style:{fontSize:.7*r+x(498)},children:x(544)})})}),a[x(306)](x(305),{children:[1,2,3].map(n=>a[x(603)]("tr",{children:[a[x(603)]("td",{className:x(503),style:{borderColor:i},children:[n===1?x(359):n===2?"2ND":"3RD",x(565)]}),a[x(306)]("td",{className:"font-bold",children:_?.[n]?.finalGrade||""})]},n))}),a[x(306)](x(380),{children:a[x(306)]("tr",{style:{height:1.5*r+"px"},children:a[x(306)]("td",{colSpan:2,style:{border:x(405)}})})})]})}),a[x(603)](x(584),{className:x(430),style:{marginTop:T},children:[a[x(306)](x(584),{className:x(346),children:a[x(306)]("img",{src:U+x(341),alt:x(291),className:x(292),style:{width:J*r,height:E*r}})}),a.jsx(x(584),{className:x(328)}),a[x(306)]("p",{className:x(429),style:{fontSize:.6*r+"rem",marginTop:14*r+"px"},children:x(419)})]})]})]}),a.jsxs(x(584),{className:"half-page-section border-t-4",style:{borderColor:i},children:[a[x(306)](x(584),{className:x(524),children:x(360)}),a[x(603)](x(572),{className:x(459),children:[a.jsxs(x(427),{children:[a[x(306)](x(563),{style:{width:x(546)}}),Array.from({length:f})[x(377)]((n,h)=>a[x(306)](x(563),{style:{width:"3.32%"}},h)),a[x(306)](x(563),{style:{width:"7%"}})]}),a.jsx(x(463),{children:a.jsxs("tr",{children:[a[x(306)]("th",{className:"month-col uppercase",children:x(478)}),a[x(306)]("th",{colSpan:f,className:x(406),children:"Dates"}),a.jsx("th",{className:x(336),children:x(393)})]})}),a[x(306)](x(305),{children:[{name:x(298),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:x(605),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:x(581),dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:x(424),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:x(330),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:x(308),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:x(535),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:"JANUARY",dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:x(374),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:"MARCH",dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:x(451),dates:[1,2,5,6,7,8]}][x(377)](n=>a[x(603)]("tr",{children:[a[x(306)]("td",{className:"month-col",children:n[x(568)]}),V(n[x(562)])[x(377)]((h,m)=>a.jsx("td",{className:x(464),style:{color:v(n[x(568)],h)?x(513):x(319)},children:h},m)),a[x(306)]("td",{className:x(569),children:Y[n[x(568)]]||""})]},n.name))})]}),a.jsxs("div",{className:x(452),style:{borderColor:i},children:[a[x(603)]("div",{className:x(289),children:[a[x(306)](x(584),{className:x(488),children:"Important Dates"}),[[x(421),x(307)],["July 6, 2026","Term 1: Summative Test #1"],[x(309),"Term 1: Summative Test #2"],[x(286),x(337)],["Sept 1, 2026","Term 1 Examination"],[x(310),x(466)],[x(473),x(411)]][x(377)](([n,h])=>a[x(603)](x(584),{className:x(583),children:[a[x(306)](x(584),{className:x(365),children:n}),a[x(306)]("div",{className:x(457),children:h})]},n))]}),a[x(603)](x(584),{className:"important-dates-box",children:[a.jsx(x(584),{className:x(488),children:x(385)}),[[x(508),"Term 2: Summative Test #1"],[x(586),x(315)],[x(556),x(370)],[x(527),"End-of-Term Block"],[x(280),"End of Term 2"],["Jan 4, 2027",x(499)],["Jan 25, 2027",x(273)]][x(377)](([n,h])=>a[x(603)]("div",{className:x(583),children:[a[x(306)](x(584),{className:x(365),children:n}),a.jsx(x(584),{className:"date-label uppercase",children:h})]},n))]}),a.jsxs(x(584),{className:x(289),children:[a.jsx("div",{className:x(488),children:x(385)}),[[x(598),x(268)],["Mar 15-16, 2027",x(570)],[x(302),"Term 3 Exam (Non-Grad)"],["Mar 24-31, 2027",x(466)],["Apr 1-8, 2027","End-of-Term Block"],[x(510),x(317)],[x(425),x(396)]][x(377)](([n,h])=>a[x(603)](x(584),{className:x(583),children:[a.jsx(x(584),{className:x(365),children:n}),a[x(306)]("div",{className:x(457),children:h})]},n))]})]})]})]})]})})};function j0(){const e=Z,{students:u,sections:c,subjects:y,teachers:R,schoolProfile:O,activeSchoolYear:o,setCurrentView:i,classRecords:_,gradingSheetRecords:M,hpsRecords:Y,sf2Sheets:x}=b0(),{user:U}=m0(),[f,V]=N.useState(""),[v,I]=N[e(267)](null),[p,r]=N[e(267)](""),[H,C]=N[e(267)](1),[D,S]=N[e(267)](e(345)),[A,F]=N[e(267)](e(401)),[g,J]=N[e(267)](e(468)),E=N[e(507)](()=>{const t=e;return c[t(594)](l=>l[t(357)]===f||l.id===f)},[c,f]),T=N[e(507)](()=>{const t=e;return y[t(594)](l=>l.id===p||l[t(271)]===p)},[y,p]),n=N[e(507)](()=>{if(!E)return[];const t=p0(U,E,y),l=new Set;return t.filter(d=>{const s=B,w=f0(d[s(271)]);return l[s(592)](w)?!1:(l.add(w),!0)})},[E,y,U]),h=N.useMemo(()=>{const t=e;if(T?.[t(610)]){const l=R[t(594)](d=>d[t(368)]===T[t(610)]||d.id===T[t(610)]);if(l)return l[t(321)]||l[t(568)]}return E?.[t(344)]||""},[T,R,E]),m=()=>{const t=e;if(!v)return;const l=document.title,d=(v[t(526)]+"_"+v[t(379)])[t(323)](/[^a-z0-9]/gi,"_");document[t(299)]=t(475)+d+"_"+o,window.print(),setTimeout(()=>{const s=t;document[s(299)]=l},1e3)},j=N[e(507)](()=>[...c].sort((t,l)=>{const d=B,s=(t.section_grade_level||"").localeCompare(l[d(409)]||"",void 0,{numeric:!0});return s!==0?s:(t[d(357)]||"").localeCompare(l[d(357)]||"")}),[c]),G=N[e(507)](()=>{const t=e,l={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return j[t(467)](d=>{const s=t,w=(d[s(409)]||"")[s(382)](),k=parseInt(w[s(323)](/\D/g,""))||0;w[s(435)](s(287))||k>=1&&k<=6?l[s(445)][s(577)](d):k>=7&&k<=10?l[s(414)][s(577)](d):k>=11&&k<=12&&l[s(519)].push(d)}),l},[j]);N[e(270)](()=>{const t=e;if(!f&&j[t(506)]===1){const l=setTimeout(()=>{const d=t;V(j[0][d(357)])},0);return()=>clearTimeout(l)}},[j,f]),N[e(270)](()=>{const t=setTimeout(()=>{r(""),I(null)},0);return()=>clearTimeout(t)},[f]);const K=N.useMemo(()=>{const t=e;if(!f)return[];const l=c[t(594)](d=>d.section_name===f||d.id===f)?.id;return u[t(504)](d=>d.student_section===f||l&&d[t(269)]===l)},[u,f,c]),Q=K.filter(t=>(t.gender||"")[e(382)]()===e(398))[e(549)]((t,l)=>t.last_name[e(529)](l.last_name)),$=K[e(504)](t=>(t[e(402)]||"")[e(382)]()===e(571))[e(549)]((t,l)=>t[e(526)][e(529)](l[e(526)])),e0=N[e(507)](()=>{const t=e;if(!v)return{};const l={};return x[t(504)](s=>s[t(436)]===o&&(s[t(487)]===E?.id||s[t(487)]===f))[t(467)](s=>{const w=t,k=s[w(538)]?.[v[w(295)]];if(k){const z=Object.values(k).filter(X=>X?.[w(382)]()===w(470))[w(506)];z>0&&(l[s[w(441)].toUpperCase()]=z)}}),l},[v,x,o,E,f]),a0=N[e(507)](()=>{const t=e;if(!v||!p)return;const l={};return[1,2,3][t(467)](d=>{const s=t,w=_[s(594)](b=>b[s(356)]===v.lrn&&b[s(436)]===o&&Number(b[s(597)])===d&&(b.subject_id===T?.id||b[s(375)]===p))||M[s(594)](b=>b[s(356)]===v[s(295)]&&b[s(436)]===o&&Number(b[s(597)])===d&&(b[s(375)]===T?.id||b[s(375)]===p)),k=Y[s(594)](b=>(b.subject_id===T?.id||b.subject_id===p)&&b[s(436)]===o&&Number(b[s(597)])===d),z=(b,r0)=>{const l0=s,s0=Array.isArray(b)?b:[];return Array[l0(482)]({length:r0},(g0,n0)=>s0[n0]??"")},X=w,t0=k,L=b=>b===""||b===null||b===void 0?"":b;l[d]={scores:{ww:z(w?.[s(564)],10)[s(377)](L),pt:z(w?.performance_tasks,10)[s(377)](L),st:z(X?.[s(446)],5)[s(377)](L),te:L(w?.[s(442)]??"")},hps:{ww:z(k?.[s(564)],10)[s(377)](L),pt:z(k?.[s(431)],10)[s(377)](L),st:z(t0?.[s(446)],5).map(L),te:L(k?.[s(442)]??"")},finalGrade:L(w?.[s(410)]??"")}}),l},[v,p,T,_,M,Y,o]);return a[e(603)]("div",{className:e(282),children:[a[e(603)]("div",{className:e(588),children:[a[e(306)](e(584),{className:e(362)}),a[e(603)](e(584),{className:e(485),children:[a[e(603)](e(584),{className:e(460),children:[a[e(306)](e(547),{onClick:()=>i(e(481)),className:e(599),title:e(604),children:a[e(306)](d0,{className:"w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"})}),a[e(603)]("div",{className:e(609),children:[a[e(306)]("h2",{className:e(358),children:e(415)}),a[e(306)]("p",{className:e(520),children:e(449)})]})]}),a[e(306)](e(584),{className:e(318)}),a[e(603)]("div",{className:e(281),children:[a[e(603)](e(434),{className:e(373),value:f,onChange:t=>{const l=e;V(t[l(541)][l(523)]),I(null),r("")},children:[a[e(306)]("option",{value:"",children:e(558)}),Object[e(545)](G).map(([t,l])=>l[e(506)]>0&&a[e(306)](e(540),{label:t,children:l[e(377)](d=>a.jsxs(e(278),{value:d[e(357)],children:[d.section_grade_level," - ",d[e(357)]]},d.id))},t))]}),a[e(306)](W,{className:"w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors"})]}),a[e(603)]("div",{className:"relative group min-w-0 flex-1",children:[a[e(603)](e(434),{className:e(579),value:p,onChange:t=>{const l=e;r(t[l(541)][l(523)]),I(null)},disabled:!f,children:[a[e(306)]("option",{value:"",children:"Select Subject"}),n.map(t=>a[e(306)](e(278),{value:t.id,children:t.subject_name},t.id))]}),a[e(306)](W,{className:e(417)})]}),a[e(603)]("div",{className:e(281),children:[a[e(603)](e(434),{className:e(461),value:v?.[e(295)]||"",onChange:t=>{const l=e,d=u[l(594)](s=>s.lrn===t.target[l(523)])||null;I(d)},disabled:!p,children:[a[e(306)](e(278),{value:"",children:"Select Learner"}),Q[e(506)]>0&&a[e(306)](e(540),{label:"MALE",children:Q[e(377)](t=>{const l=e,d=p&&(_[l(324)](s=>s[l(356)]===t.lrn&&s.subject_id===p&&s[l(436)]===o)||M.some(s=>s[l(356)]===t[l(295)]&&s[l(375)]===p&&s[l(436)]===o));return a[l(603)](l(278),{value:t[l(295)],children:[t.last_name,", ",t[l(379)]," ",d?"✓":""]},t[l(295)])})}),$[e(506)]>0&&a[e(306)](e(540),{label:e(494),children:$[e(377)](t=>{const l=e,d=p&&(_[l(324)](s=>s[l(356)]===t[l(295)]&&s[l(375)]===p&&s[l(436)]===o)||M[l(324)](s=>s[l(356)]===t[l(295)]&&s.subject_id===p&&s.school_year===o));return a[l(603)](l(278),{value:t[l(295)],children:[t.last_name,", ",t.first_name," ",d?"✓":""]},t[l(295)])})})]}),a.jsx(W,{className:e(417)})]}),a[e(306)](e(584),{className:e(318)}),a[e(603)](e(584),{className:"relative group shrink-0",children:[a[e(603)](e(434),{value:g,onChange:t=>J(t[e(541)][e(523)]),className:e(533),title:e(474),children:[a[e(306)](e(278),{value:"a4",children:"A4"}),a[e(306)](e(278),{value:e(448),children:e(420)}),a[e(306)](e(278),{value:"folio",children:e(290)})]}),a[e(306)](W,{className:e(417)})]}),a[e(603)](e(584),{className:e(500),children:[a[e(603)](e(584),{className:e(458),title:e(353),children:[a[e(306)](e(584),{className:e(515),style:{backgroundColor:D,width:18,height:18}}),a[e(306)](e(327),{type:e(277),value:D,onChange:t=>S(t.target[e(523)]),className:e(354)})]}),a[e(603)](e(584),{className:"relative flex items-center justify-center cursor-pointer shrink-0",title:"Choose Outline Color",children:[a[e(306)](e(584),{className:e(515),style:{backgroundColor:A,width:18,height:18}}),a[e(306)]("input",{type:"color",value:A,onChange:t=>F(t[e(541)][e(523)]),className:e(354)})]})]}),a[e(603)](e(584),{className:e(444),children:[a[e(306)](e(547),{onClick:()=>C(t=>Math.max(.4,t-.1)),className:e(462),title:"Zoom Out",children:a[e(306)](o0,{className:e(439)})}),a[e(603)](e(548),{className:e(408),children:[Math[e(342)](H*100),"%"]}),a[e(306)](e(547),{onClick:()=>C(t=>Math[e(454)](1.5,t+.1)),className:e(462),title:"Zoom In",children:a[e(306)](c0,{className:e(439)})})]}),a[e(603)](e(547),{onClick:m,disabled:!v,className:e(550),children:[a[e(306)](x0,{className:e(394)}),e(390)]})]})]}),a[e(306)](e(584),{className:e(505),children:a[e(306)](e(584),{className:e(397),children:v?a[e(306)](e(584),{className:e(391),style:{transform:e(311)+H+e(304),willChange:e(447),backfaceVisibility:e(384),WebkitBackfaceVisibility:e(384)},children:a[e(603)](e(584),{className:e(276),children:[a[e(306)](e(584),{className:e(372)}),a[e(306)]("div",{className:"lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none",children:a[e(306)](u0,{pageNumber:1,student:v,profile:O,schoolYear:o,subject:T?.[e(271)]||"",teacher:h,fillColor:D,outlineColor:A,gradeData:a0,attendanceData:e0,paperSize:g})})]})}):a[e(603)](e(584),{className:e(560),children:[a.jsxs(e(584),{className:e(276),children:[a[e(306)](e(584),{className:e(496)}),a[e(603)](e(584),{className:e(352),children:[a.jsx(h0,{className:e(322)}),a[e(603)](e(584),{className:e(288),children:[a[e(306)](e(548),{className:e(338),children:e(493)}),a[e(306)](e(584),{className:"w-20 h-1 bg-emerald-500/10 rounded-full mt-4"})]}),a[e(306)](e(584),{className:e(422),children:a.jsx(x0,{className:e(363)})})]})]}),a.jsxs("div",{className:e(509),children:[a[e(306)]("h2",{className:e(576),children:e(364)}),a.jsx("p",{className:e(484),children:e(601)})]})]})})}),a[e(306)](e(516),{children:e(528)+(g==="a4"?"210mm 297mm":g===e(448)?e(279):e(589))+`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `+(g==="a4"?"210mm":e(326))+e(266)+(g==="a4"?e(432):g===e(448)?"11in":e(400))+e(285)+(g==="a4"?e(511):"8.5in")+` !important;
                        height: `+(g==="a4"?"297mm":g===e(448)?e(334):e(400))+` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `+e(g==="a4"?511:326)+e(266)+(g==="a4"?e(432):g===e(448)?e(334):e(400))+e(477)})]})}function B(e,u){return e=e-263,q()[e]}function q(){const e=["teacher_id","trace","data-field font-extrabold border-2 whitespace-nowrap","photo_url",` !important;
                        height: `,"useState","Term 3: Summative Test #2","student_section","useEffect","subject_name","1x1 Learner Photo","Term 3: Summative Test #1",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,`px;
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
                        padding: `,"relative group","color","option","8.5in 11in","Dec 18, 2026","relative group min-w-0 flex-1","lir-print-root flex flex-col h-full bg-slate-50 relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white","logo_url","GRADE & SECTION",` !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `,"Aug 28, 2026","kinder","absolute inset-0 flex flex-col items-center justify-center","important-dates-box","Folio","DepEd Logo","object-contain",`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none","lrn","BAGONG BARRIO NATIONAL HIGH SCHOOL","px ","JUNE","title","FIRST",`; 
                        padding: `,"Mar 22-23, 2027","font-extrabold uppercase whitespace-nowrap",") translateZ(0)","tbody","jsx","Opening Block: Term 1","NOVEMBER","July 28, 2026","Sept 2-15, 2026","scale(",`rem; 
                        border-bottom: 2px solid `,`px; 
                        font-weight: 700; 
                        font-size: `,"__proto__","Term 2: Summative Test #2",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"EOSY Rites","h-5 w-px bg-slate-200 shrink-0","inherit","reduce","displayName","w-28 h-28 text-slate-100","replace","some","flex justify-between items-center w-full overflow-hidden","8.5in","input","signature-box bg-white",`;
                        border-radius: 8px;
                        height: `,"OCTOBER","FIRST NAME",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,"term-label","11in","grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","absences-header uppercase","Term 1 Examination","text-7xl font-black text-slate-100 tracking-tighter leading-none italic",`px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .term-label {
                        color: #ef4444;
                        background-color: `,"fixed","deped_logo_right.png","round","font-bold py-1","adviser_name","#86efac","mb-2","exception",`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,"1 X 1",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"label-green border-2 whitespace-nowrap","relative w-64 h-64 bg-white rounded-[5rem] border border-slate-200 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl","Choose Fill Color","w-full h-full opacity-0 absolute inset-0 cursor-pointer","slice","student_lrn","section_name","text-[10px] lg:text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none mb-0.5","1ST","Daily Attendance","data-field uppercase font-bold border-2 whitespace-nowrap","absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30","w-10 h-10 text-white","Individual Record","date-val uppercase",`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `,`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,"uid","toString","Term 2 Examination",`;
                        font-size: `,"absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000","appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-full min-w-[90px] duration-200 truncate","FEBRUARY","subject_id","60210xPGIFl","map","header-row-fill","first_name","tfoot","w-full h-full object-cover","toLowerCase","school-logo.png","hidden","Important Dates","card-container-combined print:m-0 print:shadow-none",`44;
                        font-weight: 800;
                        font-size: `,"col-span-1","scores","Print","transition-all duration-700 ease-out origin-top print:scale-100","data-field uppercase font-bold border-2 whitespace-nowrap px-1","Total Abs.","w-3 h-3 group-hover:translate-y-0.5 transition-transform",`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `,"End of Term 3","w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0","male","return (function() ","13in","#22c55e","gender","student-info-table border-2",`px; 
                        font-size: `,"none","dates-header-bar uppercase","LRN","text-[8px] font-black text-slate-900 w-7 text-center tabular-nums","section_grade_level","final_grade","Start of Term 2",`;
                        padding: `,`rem; 
                        padding: `,"JUNIOR HIGH SCHOOL","Learner Record",`px;
                        font-size: `,"w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors",`; 
                        color: black !important; 
                        font-size: `,"Teacher's Signature","Letter","June 8-11, 2026","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 group-hover:rotate-12 transition-all duration-500",`dd;
                        border: 1px solid `,"SEPTEMBER","Apr 8, 2027","3RD","colgroup","2ND","font-bold uppercase leading-none text-center","col-span-1 flex flex-col items-center justify-center pt-1","performance_tasks","297mm","12HZfScf","select","includes","school_year",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        border: 4px solid `,`px;
                        width: `,"w-3 h-3","log","month","quarterly_exam","15%","flex items-center gap-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200 h-8 shrink-0","ELEMENTARY","summative_tests","transform","letter","Individual LIR",`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,"APRIL","flex items-stretch border-2 w-full overflow-hidden",`px; 
                        border-right: 1px solid `,"min","PRODUCT/PERFORMANCE TASK (PPTs)","WRITTEN /ORAL WORKS (WWs)","date-label uppercase","relative flex items-center justify-center cursor-pointer shrink-0","attendance-table mb-3","flex items-center gap-1.5 lg:gap-2 shrink-0","appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-full min-w-[100px] truncate disabled:opacity-30 duration-200","w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-all active:scale-90 duration-200","thead","attendance-date-cell","flex items-center gap-4 shrink-0","End-of-Term Block","forEach","folio","SECOND","absent","img","header-green py-1","Sept 16, 2026","Paper Size","LIR_","info",` !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                }
             `,"Months","227637GKGGQk","40px","school-forms","from","label-green py-1 border-2","text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60","flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden","20611AFQdro","section_id","important-dates-header uppercase italic","Learner's Individual Record Card",`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `,`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `,"School Year: ","LIR","FEMALE","16CGUFXq","absolute -inset-24 bg-emerald-500/5 blur-[120px] rounded-full",`;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"rem","Start of Term 3","flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 h-8 shrink-0 items-center px-1.5","constructor",`px;
                        text-align: center;
                        height: `,"row-label py-1 px-1 border-2","filter","flex-1 overflow-auto relative bg-slate-100 print:bg-white custom-scrollbar","length","useMemo","Oct 7, 2026","space-y-4","Apr 6-7, 2027","210mm","auto","red",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"w-4.5 h-4.5 rounded-md border border-slate-200 shadow-sm shrink-0","style","M.I",`rem; 
                        font-weight: 700; 
                        height: `,"SENIOR HIGH SCHOOL","text-[7px] font-black text-emerald-600 uppercase tracking-widest leading-none","LAST NAME","SUMMATIVE TEST","value","lir-title-bar-custom mb-3 uppercase tracking-widest","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden","last_name","Dec 7-18, 2026",`
                @media print {
                    @page {
                        size: `,"localeCompare","bind","TOTAL","row-label","appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer min-w-[55px] duration-200","border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden","DECEMBER",`px; 
                        padding: `,`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,"attendance","label-green py-1 border-2 px-1","optgroup","target","grow flex flex-col gap-1 overflow-hidden",`rem;
                        width: `,"FINAL GRADE","entries","10%","button","span","sort","ml-auto h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0","flex gap-4 items-start w-full mt-2","13%","src","TERM","256105YCOCip","Dec 3-4, 2026",`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `,"Choose Section","console","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"dates","col","written_works"," TERM","JANUARY","0px","name","font-bold","Term 3 Exam (Graduating)","female","table","20%","272SdyMsz","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","text-4xl font-black text-slate-900 tracking-tight uppercase","push","THIRD","appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer w-full min-w-[90px] disabled:opacity-30 duration-200 truncate","half-page-section","AUGUST","-11px","date-row","div",`; 
                        font-size: `,"Oct 29, 2026","606263HRaBMN","z-20 bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm sticky top-0 print:hidden shrink-0 w-full","8.5in 13in",`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `,`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"has","border-collapse border-2","find","charAt","max-w-full max-h-full object-contain","quarter","Feb 16, 2027","w-7 h-7 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all group shrink-0 active:scale-95 duration-200",`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `,"Select a learner from the toolbar above to preview their individual record card.","error","jsxs","Back to Hub","JULY",`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,"153356XjGvHV","67563NSQGSF","flex flex-col shrink-0"];return q=function(){return e},q()}export{j0 as LIRPage};
