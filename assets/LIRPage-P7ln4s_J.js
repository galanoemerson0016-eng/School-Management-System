import{j as a,r as f,cr as J0,bH as d0,cB as Y0,ca as q0,be as v0,bN as _0,cd as o0,cA as K0,br as V0,dj as W0,cC as p0,cD as j0,bE as Z0}from"./vendor-Baw8Mocq.js";import{b as X0,u as Q0,h as $0,n as xx}from"./index-DPCyYbLy.js";import{e as ex,p as ax}from"./pdf-export-DvXRjfPU.js";import"./vendor-pdf-libs-F9NHdXr1.js";import"./vendor-firebase-HwCNxALe.js";import"./vendor-framer-motion-CeC3HJGw.js";const l0=U;(function(x,N){const p=U,k=x();for(;;)try{if(parseInt(p(631))/1+parseInt(p(232))/2*(-parseInt(p(402))/3)+-parseInt(p(582))/4*(parseInt(p(238))/5)+parseInt(p(569))/6+parseInt(p(266))/7+parseInt(p(303))/8*(-parseInt(p(568))/9)+-parseInt(p(386))/10*(-parseInt(p(492))/11)===N)break;k.push(k.shift())}catch{k.push(k.shift())}})(c0,328380);const s0=(function(){let x=!0;return function(N,p){const k=x?function(){const j=U;if(p){const L=p[j(497)](N,arguments);return p=null,L}}:function(){};return x=!1,k}})(),U0=s0(void 0,function(){const x=U;let N;try{N=Function(x(524)+x(578)+");")()}catch{N=window}const p=N[x(601)]=N[x(601)]||{},k=[x(361),x(522),x(390),x(587),x(340),"table",x(259)];for(let j=0;j<k[x(499)];j++){const L=s0[x(377)].prototype[x(309)](s0),b=k[j],d=p[b]||L;L[x(590)]=s0.bind(s0),L.toString=d[x(570)].bind(d),p[b]=L}});U0();function U(x,N){return x=x-224,c0()[x]}const S0=({pageNumber:x,student:N,profile:p,schoolYear:k,subject:j,teacher:L,fillColor:b=l0(293),outlineColor:d=l0(557),gradeData:S,paperSize:M=l0(240),attendanceData:n0={}})=>{const e=l0,V="./",w=25,i0=n=>Array[U(438)]({length:w},(o,_)=>n[_]??""),T=(n,m)=>{const o=U,_=Number(m);if(!_)return!1;const C=n.toUpperCase();return C===o(431)&&_===12||C===o(556)&&(_===21||_===31)||C===o(462)&&(_===2||_===30)||C===o(276)&&_===8||C===o(488)&&_===1};let P=e(306),u="8.5in",s=1.12,Y=1.2,q=.8,B=.75,E=5,A=.8,W=40,v=240,Z=100,X=50,J="0px";M==="a4"?(u="210mm",P=e(534),s=1.02,Y=.85,q=.55,B=.5,E=2,A=.65,W=26,v=140,Z=80,X=40):M===e(560)?(u=e(637),P="11in",s=.98,Y=.85,q=.55,B=.5,E=3,A=.7,W=28,v=160,Z=65,X=32,J=e(622)):M===e(240)&&(u=e(637),P="13in",s=.98,Y=.85,q=.55,B=.5,E=3,A=.7,W=28,v=160,Z=65,X=32,J=e(622));const z=(n,m)=>{const o=e,_=(n||"")[o(255)]();return _.length>32?m*.65:_[o(499)]>24?m*.78:_[o(499)]>16?m*.88:m},F=z(j,A*s),K=z(L,A*s);return a.jsx(e(555),{className:e(324),children:a.jsxs(e(555),{className:"page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none",style:{width:u,height:P},children:[a.jsx(e(334),{children:e(635)+u+" "+P+e(621)+d+e(327)+8*s+e(458)+5*s+`px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: `+b+e(653)+d+`;
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `+3*s+e(359)+.85*s+e(308)+b+e(577)+d+e(315)+.6*s+e(595)+d+e(327)+2*s+e(564)+.8*s+`rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `+.6*s+e(333)+d+e(327)+1.5*s+e(394)+24*s+e(599)+b+`44;
                        font-weight: 800;
                        font-size: `+.6*s+`rem;
                    }

                    .row-label {
                        background-color: `+b+e(310)+.6*s+e(516)+70*s+e(400)+b+e(501)+d+e(250)+W*s+e(296)+v*s+`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `+b+`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `+.9*s+e(237)+4*s+e(241)+d+e(451)+d+e(287)+d+e(226)+.5*s+e(658)+21*s+`px; 
                        padding: `+1*s+e(391)+b+e(563)+.5*s+e(246)+d+e(254)+b+`; 
                        color: black !important; 
                        font-size: `+.9*s+e(512)+b+e(465)+.45*s+`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `+.5*s+e(274)+d+e(346)+b+e(405)+3*s+e(544)+.85*s+e(589)+d+e(350)+d+`; 
                        font-size: `+.45*s+e(511)+18*s+`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `+95*s+e(393)+d+e(496)+1.5*s+e(562)+4*s+e(376)+1.5*s+e(562)+4*s+e(482)+.42*s+e(477)}),a[e(479)](e(555),{className:e(648),children:[a[e(479)](e(555),{className:e(307),children:[a[e(479)](e(555),{className:e(520),children:[a.jsxs(e(555),{className:e(291),children:[a[e(243)](e(555),{className:e(549),style:{width:64*s,height:64*s},children:a[e(243)](e(364),{src:p.logo_url||V+"school-logo.png",alt:e(263),className:e(633),onError:n=>{const m=e;n[m(529)][m(351)]=V+m(343)}})}),a[e(479)]("div",{children:[a.jsx("h1",{className:e(618),style:{fontSize:Y*s+e(614)},children:p[e(323)]||e(519)}),a.jsx("p",{className:"font-black uppercase italic",style:{fontSize:q*s+e(614),color:d},children:e(331)}),a[e(479)]("p",{className:e(502),style:{fontSize:B*s+e(614)},children:[e(447),a[e(243)](e(453),{className:e(654),children:k})]})]})]}),a[e(243)]("div",{className:"shrink-0 ml-auto",children:a[e(243)](e(311),{className:e(495),style:{borderColor:d},children:a.jsx(e(647),{children:a[e(479)]("tr",{children:[a[e(243)]("td",{className:e(541),style:{fontSize:A*s+e(614),padding:E*s+e(562)+E*2*s+"px",borderColor:d},children:e(490)}),a[e(243)]("td",{className:e(505),style:{fontSize:F+"rem",padding:E*s+e(562)+E*2.5*s+"px",borderColor:d},children:j}),a[e(243)]("td",{className:e(541),style:{fontSize:A*s+e(614),padding:E*s+e(562)+E*2*s+"px",borderColor:d},children:e(461)}),a[e(243)]("td",{className:e(505),style:{fontSize:K+e(614),padding:E*s+e(562)+E*2.5*s+"px",borderColor:d},children:L})]})})})})]}),a[e(479)]("div",{className:"flex gap-4 items-start w-full mt-2",children:[a[e(243)](e(555),{className:e(283),style:{width:1*s+"in",height:1*s+"in",borderColor:d},children:N[e(478)]?a.jsx(e(364),{src:N[e(478)],alt:"1x1 Learner Photo",className:e(498)}):a[e(479)](e(453),{className:e(455),style:{fontSize:.7*s+"rem"},children:["1 X 1",a[e(243)]("br",{}),e(523)]})}),a.jsx(e(555),{className:e(572),children:a[e(243)](e(311),{className:"student-info-table border-2",style:{borderColor:d,height:1*s+"in"},children:a[e(479)]("tbody",{children:[a[e(479)]("tr",{style:{height:.5*s+"in"},children:[a[e(243)]("td",{className:e(662),style:{borderColor:d,height:.5*s+"in"},children:N[e(294)]}),a.jsx("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:d,height:.5*s+"in"},children:N[e(586)]}),a[e(243)]("td",{className:e(415),style:{width:e(649),borderColor:d,height:.5*s+"in"},children:N[e(318)]?.[e(585)](0)||""}),a.jsx("td",{className:e(662),style:{borderColor:d,height:.5*s+"in"},children:N.student_section}),a[e(243)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:d,height:.5*s+"in"},children:N[e(442)]})]}),a.jsxs("tr",{style:{height:.5*s+"in"},children:[a[e(243)]("td",{className:e(517),style:{borderColor:d,height:.5*s+"in"},children:e(437)}),a[e(243)]("td",{className:e(517),style:{borderColor:d,height:.5*s+"in"},children:"FIRST NAME"}),a[e(243)]("td",{className:e(528),style:{width:e(649),borderColor:d,height:.5*s+"in"},children:"M.I"}),a.jsx("td",{className:e(517),style:{borderColor:d,height:.5*s+"in"},children:"GRADE & SECTION"}),a.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:d,height:.5*s+"in"},children:e(406)})]})]})})})]}),a[e(479)]("div",{className:"grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden",children:[a[e(479)](e(555),{children:[a[e(243)](e(555),{className:"header-green py-1",style:{fontSize:.75*s+e(614)},children:e(227)}),a.jsx(e(311),{style:{tableLayout:e(494)},children:a[e(479)]("tbody",{children:[a[e(479)]("tr",{className:e(425),children:[a[e(243)]("td",{className:e(584),style:{width:e(531)},children:"TERM"}),[1,2,3,4,5].map(n=>a.jsx("td",{style:{width:e(358)},children:n},n)),a[e(243)]("td",{className:"font-bold",style:{width:"20%"},children:e(484)})]}),[1,2,3][e(566)](n=>a[e(479)]("tr",{children:[a[e(243)]("td",{className:e(373),children:e(n===1?224:n===2?547:229)}),[...Array(5)].map((m,o)=>a[e(243)]("td",{children:S?.[n]?.[e(605)].ww[o]??""},o)),a.jsx("td",{className:e(502),children:S?.[n]?.[e(605)].ww[e(655)](0,5)[e(626)]((m,o)=>m+(Number(o)||0),0)||""})]},n))]})})]}),a.jsxs(e(555),{children:[a[e(243)](e(555),{className:e(357),style:{fontSize:.75*s+e(614)},children:e(262)}),a[e(243)]("table",{style:{tableLayout:e(494)},children:a[e(479)](e(647),{children:[a[e(479)]("tr",{className:e(425),children:[a[e(243)]("td",{className:e(584),style:{width:e(383)},children:e(481)}),[1,2,3][e(566)](n=>a[e(243)]("td",{style:{width:e(383)},children:n},n)),a.jsx("td",{className:"font-bold",style:{width:e(383)},children:e(484)})]}),[1,2,3][e(566)](n=>a[e(479)]("tr",{children:[a[e(243)]("td",{className:e(373),children:e(n===1?224:n===2?547:229)}),[...Array(3)][e(566)]((m,o)=>a[e(243)]("td",{children:S?.[n]?.[e(605)].pt[o]??""},o)),a[e(243)]("td",{className:e(502),children:S?.[n]?.[e(605)].pt[e(655)](0,3)[e(626)]((m,o)=>m+(Number(o)||0),0)||""})]},n))]})})]})]}),a.jsxs("div",{className:e(316),children:[a[e(479)](e(555),{className:e(604),children:[a.jsx("div",{className:e(357),style:{fontSize:.7*s+e(614)},children:e(489)}),a.jsx(e(311),{style:{tableLayout:"fixed"},children:a[e(479)](e(647),{children:[a.jsxs("tr",{className:e(425),children:[a[e(243)]("td",{className:"term-label",style:{width:e(267)},children:e(481)}),[1,2][e(566)](n=>a[e(243)]("td",{children:n},n))]}),[1,2,3].map(n=>a[e(479)]("tr",{children:[a[e(243)]("td",{className:"row-label",children:n===1?e(224):n===2?"SECOND":"THIRD"}),[...Array(2)][e(566)]((m,o)=>a.jsx("td",{children:S?.[n]?.[e(605)].st[o]??""},o))]},n))]})})]}),a[e(243)](e(555),{className:e(604),children:a.jsxs(e(311),{style:{tableLayout:e(494)},children:[a[e(243)](e(624),{children:a[e(243)]("tr",{className:e(425),children:a.jsx("td",{colSpan:2,className:e(594),style:{fontSize:.7*s+e(614)},children:e(615)})})}),a[e(243)](e(647),{children:[1,2,3][e(566)](n=>a[e(479)]("tr",{children:[a[e(479)]("td",{className:e(265),style:{borderColor:d},children:[n===1?e(468):n===2?"2ND":e(251),e(249)]}),a.jsx("td",{className:e(502),children:S?.[n]?.[e(605)].te||""})]},n))})]})}),a[e(243)](e(555),{className:e(604),children:a[e(479)](e(311),{style:{tableLayout:e(494)},children:[a.jsx("thead",{children:a[e(243)]("tr",{className:e(425),children:a[e(243)]("td",{colSpan:2,className:"font-bold py-1",style:{fontSize:.7*s+e(614)},children:e(513)})})}),a[e(243)](e(647),{children:[1,2,3].map(n=>a[e(479)]("tr",{children:[a[e(479)]("td",{className:e(265),style:{borderColor:d},children:[n===1?e(468):n===2?"2ND":e(251),e(249)]}),a[e(243)]("td",{className:"font-bold",children:S?.[n]?.[e(342)]||""})]},n))}),a[e(243)](e(421),{children:a[e(243)]("tr",{style:{height:1.5*s+"px"},children:a[e(243)]("td",{colSpan:2,style:{border:"none"}})})})]})}),a.jsxs(e(555),{className:e(664),style:{marginTop:J},children:[a.jsx(e(555),{className:e(597),children:a.jsx(e(364),{src:V+e(558),alt:e(603),className:e(509),style:{width:Z*s,height:X*s}})}),a[e(243)]("div",{className:e(270)}),a.jsx("p",{className:"font-bold uppercase leading-none text-center",style:{fontSize:.6*s+e(614),marginTop:14*s+"px"},children:e(610)})]})]})]}),a[e(479)](e(555),{className:e(395),style:{borderColor:d},children:[a[e(243)]("div",{className:e(470),children:e(433)}),a.jsxs(e(311),{className:e(332),children:[a.jsxs(e(508),{children:[a.jsx(e(456),{style:{width:e(378)}}),Array[e(438)]({length:w}).map((n,m)=>a[e(243)](e(456),{style:{width:"3.32%"}},m)),a[e(243)](e(456),{style:{width:"7%"}})]}),a[e(243)](e(624),{children:a[e(479)]("tr",{children:[a[e(243)]("th",{className:e(404),children:e(403)}),a[e(243)]("th",{colSpan:w,className:"dates-header-bar uppercase",children:"Dates"}),a[e(243)]("th",{className:e(356),children:e(375)})]})}),a[e(243)](e(647),{children:[{name:e(431),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:e(565),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:e(556),dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:e(533),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:e(389),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:e(462),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:e(276),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:e(488),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:e(353),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:e(253),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:e(414),dates:[1,2,5,6,7,8]}][e(566)](n=>a[e(479)]("tr",{children:[a.jsx("td",{className:e(330),children:n[e(323)]}),i0(n.dates)[e(566)]((m,o)=>a[e(243)]("td",{className:"attendance-date-cell",style:{color:T(n[e(323)],m)?e(574):e(510)},children:m},o)),a[e(243)]("td",{className:e(502),children:n0[n[e(323)]]||""})]},n[e(323)]))})]}),a[e(479)](e(555),{className:e(256),style:{borderColor:d},children:[a.jsxs(e(555),{className:e(641),children:[a.jsx(e(555),{className:e(452),children:e(428)}),[[e(338),"Opening Block: Term 1"],[e(242),"Term 1: Summative Test #1"],[e(640),e(401)],[e(409),e(320)],[e(571),"Term 1 Examination"],[e(651),e(297)],[e(260),"Start of Term 2"]].map(([n,m])=>a[e(479)](e(555),{className:e(636),children:[a[e(243)]("div",{className:"date-val uppercase",children:n}),a[e(243)]("div",{className:e(552),children:m})]},n))]}),a.jsxs(e(555),{className:e(641),children:[a[e(243)](e(555),{className:e(452),children:e(428)}),[["Oct 7, 2026",e(448)],[e(381),e(485)],[e(580),"Term 2 Examination"],[e(476),e(297)],["Dec 18, 2026",e(396)],[e(429),e(434)],[e(234),"Term 3: Summative Test #1"]].map(([n,m])=>a.jsxs(e(555),{className:e(636),children:[a[e(243)](e(555),{className:e(285),children:n}),a[e(243)](e(555),{className:"date-label uppercase",children:m})]},n))]}),a[e(479)](e(555),{className:e(641),children:[a.jsx(e(555),{className:e(452),children:e(428)}),[[e(329),"Term 3: Summative Test #2"],["Mar 15-16, 2027",e(507)],[e(426),e(652)],[e(388),e(297)],["Apr 1-8, 2027","End-of-Term Block"],[e(299),e(663)],[e(630),e(472)]].map(([n,m])=>a[e(479)](e(555),{className:e(636),children:[a[e(243)]("div",{className:e(285),children:n}),a[e(243)](e(555),{className:e(552),children:m})]},n))]})]})]})]})]})})};function ox(){const x=l0,{students:N,sections:p,subjects:k,teachers:j,schoolProfile:L,activeSchoolYear:b,setCurrentView:d,classRecords:S,gradingSheetRecords:M,hpsRecords:n0,sf2Sheets:e}=X0(),{user:V}=Q0(),[w,i0]=f.useState(""),[T,P]=f[x(617)](null),[u,s]=f[x(617)](""),[Y,q]=f[x(617)](1),[B,E]=f.useState("#86efac"),[A,W]=f.useState(x(557)),[v,Z]=f.useState(x(240)),[X,J]=f.useState(!1),[z,F]=f[x(617)](new Set),[K,n]=f.useState(""),[m,o]=f.useState(!1),[_,C]=f[x(617)](0),[T0,Q]=f.useState(""),O=f.useMemo(()=>{const t=x;return p.find(r=>r[t(272)]===w||r.id===w)},[p,w]),D=f.useMemo(()=>{const t=x;return k.find(r=>r.id===u||r[t(369)]===u)},[k,u]),E0=f[x(515)](()=>{if(!O)return[];const t=$0(V,O,k),r=new Set;return t.filter(l=>{const i=U,h=xx(l.subject_name);return r[i(280)](h)?!1:(r[i(611)](h),!0)})},[O,k,V]),u0=f[x(515)](()=>{const t=x;if(D?.[t(365)]){const r=j[t(628)](l=>l.uid===D[t(365)]||l.id===D[t(365)]);if(r)return r.displayName||r[t(323)]}return O?.[t(319)]||""},[D,j,O]),a0=f.useMemo(()=>[...p].sort((t,r)=>{const l=U,i=(t[l(487)]||"").localeCompare(r[l(487)]||"",void 0,{numeric:!0});return i!==0?i:(t[l(272)]||"")[l(467)](r.section_name||"")}),[p]),R0=f[x(515)](()=>{const t=x,r={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return a0[t(231)](l=>{const i=t,h=(l.section_grade_level||"")[i(600)](),y=parseInt(h.replace(/\D/g,""))||0;h[i(279)](i(257))||y>=1&&y<=6?r[i(335)][i(602)](l):y>=7&&y<=10?r[i(247)].push(l):y>=11&&y<=12&&r[i(290)].push(l)}),r},[a0]);f.useEffect(()=>{const t=x;if(!w&&a0[t(499)]===1){const r=setTimeout(()=>{const l=t;i0(a0[0][l(272)])},0);return()=>clearTimeout(r)}},[a0,w]),f[x(491)](()=>{const t=setTimeout(()=>{s(""),P(null),F(new Set)},0);return()=>clearTimeout(t)},[w]);const R=f[x(515)](()=>{const t=x;if(!w)return[];const r=p[t(628)](l=>l.section_name===w||l.id===w)?.id;return N[t(554)](l=>l[t(345)]===w||r&&l[t(345)]===r)},[N,w,p]),$=f[x(515)](()=>R[x(554)](t=>(t[x(629)]||"")[x(600)]()===x(616))[x(473)]((t,r)=>(t[x(294)]+", "+t[x(586)]).localeCompare(r[x(294)]+", "+r[x(586)])),[R]),x0=f.useMemo(()=>R.filter(t=>(t[x(629)]||"").toLowerCase()!==x(616))[x(473)]((t,r)=>(t[x(294)]+", "+t.first_name)[x(467)](r.last_name+", "+r[x(586)])),[R]),I0=()=>{const t=x;z.size===0&&R[t(499)]>0&&F(new Set(R[t(566)](r=>r[t(442)]))),J(!0)},h0=f.useCallback(t=>{const r=x;if(!t)return{};const l={};return e[r(554)](h=>h[r(339)]===b&&(h[r(261)]===O?.id||h.section_id===w))[r(231)](h=>{const y=r,c=h[y(292)]?.[t[y(442)]];if(c){const I=Object[y(341)](c).filter(H=>H?.toLowerCase()===y(619))[y(499)];I>0&&(l[h.month[y(288)]()]=I)}}),l},[e,b,O,w]),f0=f[x(579)]((t,r,l)=>{const i=x;if(!t||!r)return;const h={};return[1,2,3][i(231)](y=>{const c=i,I=S[c(628)](g=>g[c(643)]===t[c(442)]&&g.school_year===b&&Number(g.quarter)===y&&(g[c(573)]===l?.id||g[c(573)]===r))||M[c(628)](g=>g[c(643)]===t[c(442)]&&g[c(339)]===b&&Number(g[c(536)])===y&&(g[c(573)]===l?.id||g.subject_id===r)),H=n0[c(628)](g=>(g.subject_id===l?.id||g[c(573)]===r)&&g[c(339)]===b&&Number(g[c(536)])===y),e0=(g,F0)=>{const k0=c,H0=Array[k0(228)](g)?g:[];return Array[k0(438)]({length:F0},(tx,G0)=>H0[G0]??"")},P0=I,B0=H,G=g=>g===""||g===null||g===void 0?"":g;h[y]={scores:{ww:e0(I?.[c(411)],10).map(G),pt:e0(I?.[c(301)],10)[c(566)](G),st:e0(P0?.[c(450)],5)[c(566)](G),te:G(I?.quarterly_exam??"")},hps:{ww:e0(H?.[c(411)],10)[c(566)](G),pt:e0(H?.[c(301)],10).map(G),st:e0(B0?.[c(450)],5)[c(566)](G),te:G(H?.[c(609)]??"")},finalGrade:G(I?.[c(326)]??"")}}),h},[S,M,n0,b]),L0=f[x(515)](()=>h0(T),[T,h0]),A0=f[x(515)](()=>f0(T,u,D),[T,u,D,f0]),g0=f.useMemo(()=>[...$,...x0],[$,x0]),t0=f[x(515)](()=>{const t=x;return g0[t(554)](r=>z[t(280)](r[t(442)]))},[g0,z]),r0=f[x(515)](()=>{const t=x;if(!K[t(255)]())return R;const r=K[t(600)]();return R.filter(l=>l.last_name[t(600)]()[t(279)](r)||l[t(586)].toLowerCase()[t(279)](r)||l.lrn[t(279)](r))},[R,K]),b0=f[x(515)](()=>r0[x(554)](t=>(t[x(629)]||"")[x(600)]()===x(616)),[r0]),m0=f[x(515)](()=>r0[x(554)](t=>(t[x(629)]||"")[x(600)]()==="female"),[r0]),z0=()=>{const t=x;if(!T)return;const r=document[t(632)],l=(T[t(294)]+"_"+T[t(586)])[t(444)](/[^a-z0-9]/gi,"_");document.title=t(387)+l+"_"+b,window[t(314)](),setTimeout(()=>{const i=t;document[i(632)]=r},1e3)},w0=async()=>{const t=x;if(t0.length!==0){o(!0),C(10),Q(t(607));try{await new Promise(i=>setTimeout(i,400));const r=document[t(446)](t(445)),l=r?Array[t(438)](r.querySelectorAll(t(298))):[];if(l[t(499)]===0){alert("No sheets ready for printing. Please try again."),o(!1);return}C(50),Q(t(441)+l[t(499)]+t(371)),await ax({elements:l,paperSize:v,orientation:t(588),title:t(656)+(O?.[t(272)]||"Section")+"_"+(D?.[t(369)]||t(302))}),C(100),Q("Bulk print stream launched successfully."),setTimeout(()=>{o(!1),J(!1)},600)}catch(r){console[t(587)]("Bulk print error:",r),alert("Failed to launch bulk print."),o(!1)}}},N0=async()=>{const t=x;if(t0[t(499)]!==0){o(!0),C(5),Q(t(581));try{await new Promise(I=>setTimeout(I,400));const r=document[t(446)](t(445)),l=r?Array[t(438)](r[t(313)](t(298))):[];if(l[t(499)]===0){alert(t(410)),o(!1);return}const i=(O?.[t(272)]||w||t(430))[t(444)](/[^a-z0-9]/gi,"_"),h=(D?.[t(369)]||"Subject").replace(/[^a-z0-9]/gi,"_"),y="LIR_"+i+"_"+h+"_"+b,c=await ex({elements:l,filename:y,paperSize:v,orientation:"portrait",title:y,onProgressChange:I=>{const H=t;C(I),Q(H(483)+I+H(239))}});c[t(348)]?(C(100),Q(t(328)),setTimeout(()=>{o(!1),J(!1)},800)):(c[t(354)]||alert(t(625)+(c[t(587)]||"Unknown error")),o(!1))}catch(r){console[t(587)](t(608),r),alert(t(367)),o(!1)}}},y0=t=>{F(r=>{const l=U,i=new Set(r);return i.has(t)?i[l(258)](t):i[l(611)](t),i})},C0=()=>{const t=x;F(new Set(R[t(566)](r=>r.lrn)))},D0=()=>{const t=x;F(new Set($[t(566)](r=>r[t(442)])))},O0=()=>{const t=x;F(new Set(x0[t(566)](r=>r[t(442)])))},M0=()=>{F(new Set)};return a[x(479)](x(555),{className:x(457),children:[a[x(479)](x(555),{className:x(466),children:[a[x(243)](x(555),{className:"absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30"}),a[x(479)](x(555),{className:x(277),children:[a.jsxs("div",{className:x(398),children:[a[x(243)](x(281),{onClick:()=>d(x(397)),className:x(645),title:x(286),children:a[x(243)](J0,{className:x(660)})}),a.jsxs("div",{className:x(380),children:[a[x(243)]("h2",{className:x(537),children:"Learner Record"}),a[x(243)]("p",{className:x(424),children:x(244)})]})]}),a[x(243)](x(555),{className:x(370)}),a.jsxs(x(555),{className:x(613),children:[a.jsxs(x(551),{className:x(596),value:w,onChange:t=>{const r=x;i0(t[r(529)][r(360)]),P(null),s("")},children:[a[x(243)]("option",{value:"",children:"Choose Section"}),Object[x(606)](R0)[x(566)](([t,r])=>r[x(499)]>0&&a[x(243)](x(542),{label:t,children:r.map(l=>a[x(479)](x(638),{value:l[x(272)],children:[l.section_grade_level," - ",l[x(272)]]},l.id))},t))]}),a[x(243)](d0,{className:x(407)})]}),a[x(479)](x(555),{className:x(613),children:[a.jsxs(x(551),{className:x(384),value:u,onChange:t=>{const r=x;s(t[r(529)][r(360)]),P(null)},disabled:!w,children:[a[x(243)]("option",{value:"",children:"Select Subject"}),E0[x(566)](t=>a[x(243)](x(638),{value:t.id,children:t[x(369)]},t.id))]}),a[x(243)](d0,{className:x(407)})]}),a[x(479)](x(555),{className:x(613),children:[a[x(479)](x(551),{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200",value:T?.[x(442)]||"",onChange:t=>{const r=x,l=N.find(i=>i[r(442)]===t.target[r(360)])||null;P(l)},disabled:!u,children:[a[x(243)](x(638),{value:"",children:x(382)}),$.length>0&&a.jsx("optgroup",{label:x(264),children:$.map(t=>{const r=x,l=u&&(S[r(592)](i=>i[r(643)]===t[r(442)]&&i[r(573)]===u&&i.school_year===b)||M[r(592)](i=>i[r(643)]===t[r(442)]&&i.subject_id===u&&i[r(339)]===b));return a.jsxs(r(638),{value:t[r(442)],children:[t[r(294)],", ",t[r(586)]," ",l?"✓":""]},t.lrn)})}),x0.length>0&&a[x(243)]("optgroup",{label:"FEMALE",children:x0.map(t=>{const r=x,l=u&&(S[r(592)](i=>i[r(643)]===t[r(442)]&&i[r(573)]===u&&i[r(339)]===b)||M.some(i=>i[r(643)]===t[r(442)]&&i[r(573)]===u&&i[r(339)]===b));return a[r(479)](r(638),{value:t[r(442)],children:[t[r(294)],", ",t[r(586)]," ",l?"✓":""]},t[r(442)])})})]}),a[x(243)](d0,{className:x(407)})]}),a[x(243)]("div",{className:x(370)}),a.jsxs(x(555),{className:x(506),children:[a.jsxs(x(551),{value:v,onChange:t=>Z(t.target.value),className:x(527),title:x(514),children:[a[x(243)]("option",{value:"a4",children:"A4"}),a[x(243)](x(638),{value:x(560),children:x(344)}),a[x(243)](x(638),{value:"folio",children:"Folio"})]}),a[x(243)](d0,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),a.jsxs(x(555),{className:x(423),children:[a[x(479)](x(555),{className:x(561),title:"Choose Fill Color",children:[a[x(243)](x(555),{className:"w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0",style:{backgroundColor:B,width:18,height:18}}),a.jsx("input",{type:x(469),value:B,onChange:t=>E(t[x(529)][x(360)]),className:x(427)})]}),a[x(479)]("div",{className:"relative flex items-center justify-center cursor-pointer shrink-0",title:x(460),children:[a[x(243)](x(555),{className:"w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0",style:{backgroundColor:A,width:18,height:18}}),a[x(243)]("input",{type:x(469),value:A,onChange:t=>W(t.target[x(360)]),className:x(427)})]})]}),a[x(479)](x(555),{className:x(474),children:[a.jsx(x(281),{onClick:()=>q(t=>Math[x(567)](.4,t-.1)),className:x(363),title:x(459),children:a[x(243)](Y0,{className:"w-3 h-3"})}),a[x(479)](x(453),{className:x(526),children:[Math.round(Y*100),"%"]}),a[x(243)]("button",{onClick:()=>q(t=>Math[x(443)](1.5,t+.1)),className:x(363),title:"Zoom In",children:a.jsx(q0,{className:"w-3 h-3"})})]}),a[x(479)](x(281),{onClick:I0,disabled:!w||!u||R[x(499)]===0,className:x(325),title:x(418),children:[a[x(243)](v0,{className:x(546)}),x(236),z[x(225)],")"]}),a.jsxs("button",{onClick:N0,disabled:!w||!u||t0[x(499)]===0,className:x(593),title:x(349),children:[a.jsx(_0,{className:x(321)}),x(540)]}),a[x(479)](x(281),{onClick:w0,disabled:!w||!u||t0.length===0,className:x(372),title:x(412),children:[a[x(243)](o0,{className:x(399)}),"Bulk Print"]}),a[x(479)](x(281),{onClick:z0,disabled:!T,className:"h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(539),children:[a[x(243)](o0,{className:x(623)}),"Print Single"]})]})]}),a.jsx(x(555),{className:x(583),children:a[x(243)](x(555),{className:x(347),children:T?a[x(243)](x(555),{className:x(432),style:{transform:x(538)+Y+") translateZ(0)",willChange:x(336),backfaceVisibility:x(627),WebkitBackfaceVisibility:x(627)},children:a[x(479)](x(555),{className:x(612),children:[a[x(243)](x(555),{className:x(282)}),a[x(243)]("div",{className:"lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none",children:a[x(243)](S0,{pageNumber:1,student:T,profile:L,schoolYear:b,subject:D?.[x(369)]||"",teacher:u0,fillColor:B,outlineColor:A,gradeData:A0,attendanceData:L0,paperSize:v})})]})}):a[x(479)]("div",{className:"flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10",children:[a[x(479)](x(555),{className:x(612),children:[a[x(243)]("div",{className:x(245)}),a[x(479)]("div",{className:x(385),children:[a.jsx(K0,{className:x(233)}),a[x(479)](x(555),{className:x(269),children:[a[x(243)](x(453),{className:"text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic",children:"LIR"}),a[x(243)](x(555),{className:"w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4"})]}),a[x(243)]("div",{className:x(352),children:a.jsx(o0,{className:"w-10 h-10 text-white"})})]})]}),a[x(479)](x(555),{className:x(535),children:[a[x(243)]("h2",{className:x(550),children:x(454)}),a[x(243)]("p",{className:x(337),children:x(644)})]})]})})}),a[x(243)](x(555),{id:x(445),className:"fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block",style:{left:x(642)},children:t0[x(566)](t=>{const r=x,l=f0(t,u,D),i=h0(t);return a[r(243)](r(555),{className:r(289),children:a[r(243)](S0,{pageNumber:1,student:t,profile:L,schoolYear:b,subject:D?.subject_name||"",teacher:u0,fillColor:B,outlineColor:A,gradeData:l,attendanceData:i,paperSize:v})},t[r(442)])})}),X&&a[x(243)]("div",{className:x(657),children:a[x(479)](x(555),{className:x(235),children:[a[x(479)](x(555),{className:x(449),children:[a[x(479)](x(555),{className:x(248),children:[a.jsx("div",{className:x(392),children:a[x(243)](v0,{className:x(322)})}),a[x(479)]("div",{children:[a[x(243)]("h3",{className:x(620),children:x(486)}),a[x(479)]("p",{className:"text-[10px] text-slate-400 font-semibold uppercase tracking-widest",children:[O?.[x(487)],x(503),O?.section_name,x(559),D?.[x(369)]]})]})]}),a.jsx(x(281),{onClick:()=>J(!1),className:"w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors",children:a[x(243)](V0,{className:"w-4 h-4"})})]}),a[x(479)](x(555),{className:x(278),children:[a[x(479)]("div",{className:x(268),children:[a[x(243)](W0,{className:x(575)}),a[x(243)](x(305),{type:x(295),placeholder:x(273),value:K,onChange:t=>n(t[x(529)][x(360)]),className:x(521)})]}),a[x(479)](x(555),{className:x(422),children:[a.jsxs(x(281),{onClick:C0,className:x(252),children:[a[x(243)](p0,{className:x(464)}),x(419),R[x(499)],")"]}),a[x(479)](x(281),{onClick:D0,className:x(252),children:[x(271),$[x(499)],")"]}),a[x(479)](x(281),{onClick:O0,className:x(252),children:[x(312),x0[x(499)],")"]}),a.jsx(x(281),{onClick:M0,className:x(598),children:"Clear"})]})]}),a[x(479)](x(555),{className:x(500),children:[b0.length>0&&a[x(479)]("div",{className:x(362),children:[a[x(243)](x(555),{className:x(471),children:a[x(479)](x(453),{className:x(543),children:[x(439),b0[x(499)],")"]})}),a[x(243)]("div",{className:x(548),children:b0[x(566)](t=>{const r=x,l=z[r(280)](t[r(442)]),i=u&&(S[r(592)](h=>h[r(643)]===t[r(442)]&&h[r(573)]===u&&h.school_year===b)||M[r(592)](h=>h[r(643)]===t[r(442)]&&h[r(573)]===u&&h[r(339)]===b));return a[r(479)](r(555),{onClick:()=>y0(t[r(442)]),className:r(480)+r(l?576:416),children:[a.jsxs(r(555),{className:r(530),children:[l?a[r(243)](p0,{className:r(408)}):a.jsx(j0,{className:"w-4 h-4 text-slate-300 shrink-0"}),a[r(479)]("div",{className:r(634),children:[a[r(479)]("p",{className:"text-xs font-bold text-slate-800 truncate",children:[t.last_name,", ",t.first_name," ",t[r(318)]?t[r(318)][0]+".":""]}),a[r(479)]("p",{className:"text-[9px] font-medium text-slate-400",children:["LRN: ",t[r(442)]]})]})]}),i&&a[r(243)](r(453),{className:r(440),children:r(300)})]},t[r(442)])})})]}),m0[x(499)]>0&&a[x(479)](x(555),{className:"space-y-2",children:[a.jsx(x(555),{className:x(471),children:a[x(479)](x(453),{className:x(543),children:["Female Learners (",m0.length,")"]})}),a[x(243)](x(555),{className:x(548),children:m0[x(566)](t=>{const r=x,l=z[r(280)](t[r(442)]),i=u&&(S.some(h=>h[r(643)]===t[r(442)]&&h.subject_id===u&&h[r(339)]===b)||M.some(h=>h.student_lrn===t[r(442)]&&h[r(573)]===u&&h.school_year===b));return a.jsxs(r(555),{onClick:()=>y0(t[r(442)]),className:r(480)+(l?r(576):"bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"),children:[a[r(479)]("div",{className:r(530),children:[l?a[r(243)](p0,{className:r(408)}):a.jsx(j0,{className:r(275)}),a[r(479)](r(555),{className:"truncate",children:[a[r(479)]("p",{className:"text-xs font-bold text-slate-800 truncate",children:[t[r(294)],", ",t[r(586)]," ",t[r(318)]?t[r(318)][0]+".":""]}),a[r(479)]("p",{className:r(284),children:[r(504),t[r(442)]]})]})]}),i&&a[r(243)](r(453),{className:r(440),children:r(300)})]},t[r(442)])})})]}),r0[x(499)]===0&&a[x(479)](x(555),{className:"p-8 text-center text-slate-400 text-xs font-medium",children:['No learners found matching "',K,'".']})]}),a[x(479)]("div",{className:x(420),children:[a[x(479)]("div",{className:"text-xs font-bold text-slate-600",children:[a[x(243)]("span",{className:x(374),children:z[x(225)]}),x(304),R[x(499)],x(532)]}),a[x(479)]("div",{className:x(493),children:[a[x(479)](x(281),{onClick:N0,disabled:z[x(225)]===0,className:"h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer",children:[a[x(243)](_0,{className:x(646)}),"Download PDF"]}),a[x(479)](x(281),{onClick:w0,disabled:z[x(225)]===0,className:x(639),children:[a[x(243)](o0,{className:x(646)}),x(379)]})]})]})]})}),m&&a[x(243)](x(555),{className:x(553),children:a.jsxs(x(555),{className:x(475),children:[a[x(479)](x(555),{className:x(366),children:[a[x(243)](x(555),{className:x(525)}),a[x(243)](x(555),{className:x(659),children:a[x(243)](Z0,{className:"w-8 h-8 animate-spin"})})]}),a[x(479)](x(555),{className:x(362),children:[a.jsx("h3",{className:x(368),children:"Processing LIR Records"}),a[x(243)]("p",{className:x(417),children:T0})]}),a.jsxs(x(555),{className:"space-y-1.5",children:[a.jsx(x(555),{className:"h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200",children:a.jsx("div",{className:x(650),style:{width:Math[x(567)](5,_)+"%"}})}),a[x(479)]("div",{className:x(435),children:[a.jsx("span",{children:x(545)}),a[x(479)](x(453),{children:[_,"%"]})]})]})]})}),a[x(243)](x(334),{children:x(436)+(v==="a4"?x(230):v===x(560)?x(518):"8.5in 13in")+x(661)+x(v==="a4"?317:637)+x(355)+(v==="a4"?"210mm":"8.5in")+x(591)+x(v==="a4"?317:637)+x(463)+(v==="a4"?"297mm":v===x(560)?"11in":"13in")+x(413)})]})}function c0(){const x=["PDF download complete!","Feb 16, 2027","month-col","Learner's Individual Record Card","attendance-table mb-3",`rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `,"style","ELEMENTARY","transform","text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60","June 8-11, 2026","school_year","exception","values","finalGrade","school-logo.png","Letter","student_section",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0","success","Bulk Download PDF for selected learners",`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `,"src","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500","FEBRUARY","cancelled",` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `,"absences-header uppercase","header-green py-1","13%",`px;
                        font-size: `,"value","log","space-y-2","w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200","img","teacher_id","relative w-16 h-16 mx-auto flex items-center justify-center","Failed to generate PDF download.","text-lg font-black text-slate-900 tracking-tight uppercase","subject_name","h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0"," learners...","h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","row-label","text-indigo-600 font-black","Total Abs.",`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,"constructor","10%","Bulk Print","flex flex-col shrink-0","Oct 29, 2026","Select Learner","20%","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate","relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl","610uELvSg","LIR_","Mar 24-31, 2027","OCTOBER","info",`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `,"w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400",`px; 
                        border-right: 1px solid `,`px;
                        text-align: center;
                        height: `,"half-page-section border-t-4","End of Term 2","school-forms","flex items-center gap-1.5 lg:gap-2 shrink-0","w-3 h-3 group-hover:scale-110 transition-transform",`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,"Term 1: Summative Test #2","11283uTmNTd","Months","month-col uppercase",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,"LRN","w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors","w-4 h-4 text-indigo-600 shrink-0","Aug 28, 2026","No sheets ready for PDF export.","written_works","Bulk Print for selected learners",` !important;
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
             `,"APRIL","data-field uppercase font-bold border-2 whitespace-nowrap px-1","bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50","text-xs font-semibold text-slate-500","Filter / Select Learners","All (","p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0","tfoot","flex items-center gap-1.5 flex-wrap","flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5","text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none","header-row-fill","Mar 22-23, 2027","w-full h-full opacity-0 absolute inset-0 cursor-pointer","Important Dates","Jan 4, 2027","Section","JUNE","transition-all duration-700 ease-out origin-top print:scale-100","Daily Attendance","Start of Term 3","flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider",`
                @media print {
                    @page {
                        size: `,"LAST NAME","from","Male Learners (","px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0","Opening print stream for ","lrn","min","replace","lir-bulk-render-container","getElementById","School Year: ","Term 2: Summative Test #1","px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0","summative_tests",`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `,"important-dates-header uppercase italic","span","Individual Record","font-bold leading-tight","col","lir-print-root flex flex-col h-full bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white",`px;
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
                        padding: `,"Zoom Out","Choose Outline Color","TEACHER","NOVEMBER",` !important;
                        height: `,"w-3 h-3 text-indigo-600",`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `,"z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full","localeCompare","1ST","color","lir-title-bar-custom mb-3 uppercase tracking-widest","flex items-center justify-between px-1","End of Term 3","sort","flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0","bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6","Dec 7-18, 2026",`rem; 
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
                `,"photo_url","jsxs","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ","TERM",`px; 
                        font-weight: 700; 
                        font-size: `,"Processing LIR PDF pages: ","TOTAL","Term 2: Summative Test #2","Bulk LIR Operations","section_grade_level","JANUARY","SUMMATIVE TEST","SUBJECT","useEffect","114983lgJNXQ","flex items-center gap-2","fixed","header-subject-table border-collapse border-2",`; 
                        padding: `,"apply","w-full h-full object-cover","length","flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4",`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,"font-bold"," - ","LRN: ","data-field font-extrabold border-2 whitespace-nowrap","relative group shrink-0","Term 3 Exam (Graduating)","colgroup","object-contain","inherit",`rem; 
                        min-height: `,`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"FINAL GRADE","Paper Size","useMemo",`rem;
                        width: `,"label-green py-1 border-2","8.5in 11in","BAGONG BARRIO NATIONAL HIGH SCHOOL","flex justify-between items-center w-full overflow-hidden","w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500","warn","PHOTO","return (function() ","absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping","text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200","label-green py-1 border-2 px-1","target","flex items-center gap-2.5 min-w-0","15%"," learners selected","SEPTEMBER","297mm","space-y-4","quarter","text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5","scale(","Print single active learner","Bulk PDF","label-green border-2 whitespace-nowrap","optgroup","text-[10px] font-black text-slate-500 uppercase tracking-widest",`px; 
                        font-size: `,"Export Pipeline","w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform","SECOND","grid grid-cols-1 sm:grid-cols-2 gap-2","flex items-center justify-center bg-white overflow-hidden","text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase","select","date-label uppercase","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200","filter","div","AUGUST","#22c55e","deped_logo_right.png"," | ","letter","relative flex items-center justify-center cursor-pointer shrink-0","px ",`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `,"JULY","map","max","635193NhlXls","3077160hnpChA","toString","Sept 1, 2026","grow flex flex-col gap-1 overflow-hidden","subject_id","red","w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400","bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm",`dd;
                        border: 1px solid `,'{}.constructor("return this")( )',"useCallback","Dec 3-4, 2026","Initializing vector PDF export pipeline...","9780FpKLEN","flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar","term-label","charAt","first_name","error","portrait",`rem; 
                        border-bottom: 2px solid `,"__proto__",` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"some","h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","font-bold py-1",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate","mb-2","h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1",`px;
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
                        background-color: `,"toLowerCase","console","push","DepEd Logo","col-span-1","scores","entries","Preparing LIR sheets for bulk printing...","Bulk PDF download error:","quarterly_exam","Teacher's Signature","add","relative group","relative group min-w-0 flex-1","rem","TERM EXAM","male","useState","font-extrabold uppercase whitespace-nowrap","absent","text-sm font-black uppercase tracking-wide text-white",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid `,"-11px","w-3 h-3 group-hover:translate-y-0.5 transition-transform","thead","Export failed: ","reduce","hidden","find","gender","Apr 8, 2027","235488yKfRDY","title","max-w-full max-h-full object-contain","truncate",`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"date-row","8.5in","option","h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","July 28, 2026","important-dates-box","-9999px","student_lrn","Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections.","w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200","w-3.5 h-3.5","tbody","card-container-combined print:m-0 print:shadow-none","40px","h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300","Sept 2-15, 2026","Term 3 Exam (Non-Grad)",`;
                        border: 1px solid `,"font-normal ml-2","slice","Bulk_LIR_","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200",`rem; 
                        font-weight: 700; 
                        height: `,"relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30","w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform",`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `,"data-field uppercase font-bold border-2 whitespace-nowrap","EOSY Rites","col-span-1 flex flex-col items-center justify-center pt-1","FIRST","size",`; 
                        text-align: center; 
                        font-size: `,"WRITTEN /ORAL WORKS (WWs)","isArray","THIRD","210mm 297mm","forEach","134KlDaDF","w-28 h-28 text-slate-100 dark:text-slate-600","Jan 25, 2027","bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]","Select (",`rem; 
                        padding: `,"590Zjvfne","% complete...","folio",`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `,"July 6, 2026","jsx","Individual LIR","absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full",`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `,"JUNIOR HIGH SCHOOL","flex items-center gap-3"," TERM",`;
                        border-radius: 8px;
                        height: `,"3RD","h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1","MARCH",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,"trim","flex items-stretch border-2 w-full overflow-hidden","kinder","delete","trace","Sept 16, 2026","section_id","PRODUCT/PERFORMANCE TASK (PPTs)","School Logo","MALE","row-label py-1 px-1 border-2","826623MZdwxf","40%","relative flex-1 min-w-48","absolute inset-0 flex flex-col items-center justify-center","signature-box bg-white","Males (","section_name","Filter learners by name or LRN...",`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `,"w-4 h-4 text-slate-300 shrink-0","DECEMBER","flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden","p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0","includes","has","button","absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000","border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden","text-[9px] font-medium text-slate-400","date-val uppercase","Back to Hub",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,"toUpperCase","lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always","SENIOR HIGH SCHOOL","flex items-center gap-4 shrink-0","attendance","#86efac","last_name","text",`px;
                        width: `,"End-of-Term Block",".lir-bulk-sheet","Apr 6-7, 2027","✓ Grades","performance_tasks","Subject","72QiHBQl"," of ","input","13in","half-page-section",`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `,"bind",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"table","Females (","querySelectorAll","print",`;
                        color: #000000 !important;
                        font-size: `,"grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","210mm","middle_name","adviser_name","Term 1 Examination","w-3 h-3 group-hover:-translate-y-0.5 transition-transform","w-5 h-5","name","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","final_grade",`;
                        padding: `];return c0=function(){return x},c0()}export{ox as LIRPage};
