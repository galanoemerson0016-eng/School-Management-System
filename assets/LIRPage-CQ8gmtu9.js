import{j as a,r as N,cl as i0,cx as X,cv as d0,c4 as o0,c7 as e0,cu as h0}from"./vendor-CBB-Xj7m.js";import{b as m0,u as b0,h as p0,n as f0}from"./index-k-AXcera.js";import"./vendor-pdf-libs-DdPxqjvt.js";import"./vendor-firebase-dDuEEUDn.js";import"./vendor-framer-motion-CzwoK_NS.js";const Y=D;(function(e,u){const d=D,y=e();for(;;)try{if(parseInt(d(355))/1+parseInt(d(203))/2*(-parseInt(d(306))/3)+-parseInt(d(430))/4+parseInt(d(212))/5*(-parseInt(d(214))/6)+parseInt(d(351))/7*(-parseInt(d(237))/8)+-parseInt(d(357))/9*(parseInt(d(195))/10)+parseInt(d(418))/11===u)break;y.push(y.shift())}catch{y.push(y.shift())}})(q,881492);const J=(function(){let e=!0;return function(u,d){const y=e?function(){const j=D;if(d){const I=d[j(452)](u,arguments);return d=null,I}}:function(){};return e=!1,y}})(),c0=J(void 0,function(){const e=D;let u;try{u=Function(e(223)+'{}.constructor("return this")( ));')()}catch{u=window}const d=u[e(354)]=u[e(354)]||{},y=["log","warn",e(429),e(240),e(419),e(467),"trace"];for(let j=0;j<y[e(396)];j++){const I=J[e(188)].prototype.bind(J),o=y[j],c=d[o]||I;I.__proto__=J[e(504)](J),I.toString=c.toString[e(504)](c),d[o]=I}});c0();const u0=({pageNumber:e,student:u,profile:d,schoolYear:y,subject:j,teacher:I,fillColor:o=Y(437),outlineColor:c=Y(198),gradeData:T,paperSize:L=Y(378),attendanceData:V={}})=>{const x=Y,P="./",g=25,W=n=>Array[D(265)]({length:g},(p,_)=>n[_]??""),v=(n,m)=>{const p=D,_=Number(m);if(!_)return!1;const B=n.toUpperCase();return B===p(266)&&_===12||B===p(409)&&(_===21||_===31)||B===p(405)&&(_===2||_===30)||B===p(268)&&_===8||B===p(389)&&_===1};let A=x(385),f=x(497),r=1.12,C=1.2,H=.8,M=.75,k=5,R=.8,U=40,w=240,F=100,E=50,S="0px";return L==="a4"?(f=x(341),A=x(362),r=1.02,C=.85,H=.55,M=.5,k=2,R=.65,U=26,w=140,F=80,E=40):L===x(460)?(f=x(497),A="11in",r=.98,C=.85,H=.55,M=.5,k=3,R=.7,U=28,w=160,F=65,E=32,S="-11px"):L===x(378)&&(f=x(497),A=x(385),r=.98,C=.85,H=.55,M=.5,k=3,R=.7,U=28,w=160,F=65,E=32,S=x(305)),a[x(294)](x(304),{className:x(194),children:a[x(421)]("div",{className:"page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none",style:{width:f,height:A},children:[a[x(294)](x(393),{children:x(469)+f+" "+A+`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        border: 4px solid `+c+x(273)+8*r+`px;
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
                        padding: `+5*r+x(387)+o+x(432)+c+x(449)+3*r+`px;
                        font-size: `+.85*r+`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `+o+x(346)+c+x(234)+.6*r+x(216)+c+x(273)+2*r+`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `+.8*r+x(424)+.6*r+x(472)+c+x(273)+1.5*r+x(206)+24*r+x(353)+o+`44;
                        font-weight: 800;
                        font-size: `+.6*r+x(508)+o+x(398)+.6*r+x(249)+70*r+x(191)+o+x(208)+c+x(380)+U*r+x(392)+w*r+x(359)+o+x(503)+.9*r+x(428)+4*r+x(461)+c+x(179)+c+x(453)+c+x(290)+.5*r+`rem; 
                        font-weight: 700; 
                        height: `+21*r+x(506)+1*r+`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `+o+x(238)+.5*r+x(322)+c+x(181)+o+x(459)+.9*r+`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `+o+x(318)+.45*r+x(448)+.5*r+x(284)+c+x(347)+o+`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `+3*r+x(489)+.85*r+`rem; 
                        border-bottom: 2px solid `+c+x(479)+c+x(454)+.45*r+`rem; 
                        min-height: `+18*r+x(280)+95*r+x(295)+c+`; 
                        padding: `+1.5*r+"px "+4*r+x(468)+1.5*r+"px "+4*r+x(314)+.42*r+x(365)}),a[x(421)](x(304),{className:x(490),children:[a[x(421)](x(304),{className:x(204),children:[a[x(421)](x(304),{className:"flex justify-between items-center w-full overflow-hidden",children:[a[x(421)](x(304),{className:x(413),children:[a[x(294)]("div",{className:x(228),style:{width:64*r,height:64*r},children:a[x(294)](x(368),{src:d.logo_url||P+x(455),alt:x(425),className:x(254),onError:n=>{const m=x;n[m(366)].src=P+"school-logo.png"}})}),a.jsxs("div",{children:[a.jsx("h1",{className:"font-extrabold uppercase whitespace-nowrap",style:{fontSize:C*r+"rem"},children:d[x(350)]||x(394)}),a[x(294)]("p",{className:x(317),style:{fontSize:H*r+x(278),color:c},children:"Learner's Individual Record Card"}),a[x(421)]("p",{className:"font-bold",style:{fontSize:M*r+x(278)},children:[x(334),a[x(294)]("span",{className:x(236),children:y})]})]})]}),a[x(294)]("div",{className:x(438),children:a[x(294)](x(467),{className:x(499),style:{borderColor:c,tableLayout:x(446)},children:a[x(294)](x(260),{children:a[x(421)]("tr",{children:[a[x(294)]("td",{className:"label-green border-2 whitespace-nowrap",style:{fontSize:R*r+x(278),padding:k*r+x(445)+k*4*r+"px",borderColor:c},children:"SUBJECT"}),a[x(294)]("td",{className:x(182),style:{fontSize:R*r+"rem",padding:k*r+x(445)+k*4*r+"px",borderColor:c},children:j}),a.jsx("td",{className:x(395),style:{fontSize:R*r+x(278),padding:k*r+x(445)+k*4*r+"px",borderColor:c},children:x(498)}),a[x(294)]("td",{className:"data-field font-extrabold border-2 whitespace-nowrap",style:{fontSize:R*r+x(278),padding:k*r+x(445)+k*4*r+"px",borderColor:c},children:I})]})})})})]}),a[x(421)](x(304),{className:"flex gap-4 items-start w-full mt-2",children:[a[x(294)](x(304),{className:"border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden",style:{width:1*r+"in",height:1*r+"in",borderColor:c},children:u[x(356)]?a[x(294)](x(368),{src:u[x(356)],alt:"1x1 Learner Photo",className:x(451)}):a[x(421)](x(494),{className:"font-bold leading-tight",style:{fontSize:.7*r+x(278)},children:[x(241),a[x(294)]("br",{}),x(485)]})}),a[x(294)](x(304),{className:"grow flex flex-col gap-1 overflow-hidden",children:a[x(294)](x(467),{className:x(367),style:{borderColor:c,height:1*r+"in"},children:a[x(421)](x(260),{children:[a.jsxs("tr",{style:{height:.5*r+"in"},children:[a[x(294)]("td",{className:x(310),style:{borderColor:c,height:.5*r+"in"},children:u[x(464)]}),a[x(294)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:c,height:.5*r+"in"},children:u[x(193)]}),a[x(294)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap px-1",style:{width:x(243),borderColor:c,height:.5*r+"in"},children:u[x(487)]?.charAt(0)||""}),a.jsx("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:c,height:.5*r+"in"},children:u[x(339)]}),a[x(294)]("td",{className:x(310),style:{borderColor:c,height:.5*r+"in"},children:u[x(426)]})]}),a[x(421)]("tr",{style:{height:.5*r+"in"},children:[a.jsx("td",{className:x(379),style:{borderColor:c,height:.5*r+"in"},children:x(364)}),a[x(294)]("td",{className:x(379),style:{borderColor:c,height:.5*r+"in"},children:x(261)}),a[x(294)]("td",{className:x(435),style:{width:"40px",borderColor:c,height:.5*r+"in"},children:x(436)}),a[x(294)]("td",{className:x(379),style:{borderColor:c,height:.5*r+"in"},children:x(297)}),a.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:c,height:.5*r+"in"},children:x(199)})]})]})})})]}),a[x(421)](x(304),{className:x(481),children:[a.jsxs(x(304),{children:[a.jsx(x(304),{className:x(215),style:{fontSize:.75*r+"rem"},children:x(257)}),a[x(294)](x(467),{style:{tableLayout:x(253)},children:a[x(421)](x(260),{children:[a.jsxs("tr",{className:x(296),children:[a.jsx("td",{className:x(371),style:{width:x(323)},children:x(329)}),[1,2,3,4,5][x(293)](n=>a[x(294)]("td",{style:{width:"13%"},children:n},n)),a[x(294)]("td",{className:x(423),style:{width:x(463)},children:x(200)})]}),[1,2,3][x(293)](n=>a[x(421)]("tr",{children:[a.jsx("td",{className:"row-label",children:n===1?"FIRST":x(n===2?412:450)}),[...Array(5)][x(293)]((m,p)=>a.jsx("td",{children:T?.[n]?.scores.ww[p]??""},p)),a.jsx("td",{className:x(423),children:T?.[n]?.[x(224)].ww[x(250)](0,5)[x(225)]((m,p)=>m+(Number(p)||0),0)||""})]},n))]})})]}),a[x(421)]("div",{children:[a[x(294)](x(304),{className:x(215),style:{fontSize:.75*r+"rem"},children:x(332)}),a[x(294)](x(467),{style:{tableLayout:x(253)},children:a[x(421)](x(260),{children:[a.jsxs("tr",{className:x(296),children:[a.jsx("td",{className:x(371),style:{width:x(463)},children:x(329)}),[1,2,3][x(293)](n=>a[x(294)]("td",{style:{width:x(463)},children:n},n)),a.jsx("td",{className:"font-bold",style:{width:"20%"},children:x(200)})]}),[1,2,3][x(293)](n=>a[x(421)]("tr",{children:[a[x(294)]("td",{className:"row-label",children:n===1?"FIRST":n===2?"SECOND":x(450)}),[...Array(3)].map((m,p)=>a[x(294)]("td",{children:T?.[n]?.[x(224)].pt[p]??""},p)),a[x(294)]("td",{className:"font-bold",children:T?.[n]?.scores.pt[x(250)](0,3).reduce((m,p)=>m+(Number(p)||0),0)||""})]},n))]})})]})]}),a[x(421)](x(304),{className:x(276),children:[a[x(421)](x(304),{className:x(411),children:[a.jsx(x(304),{className:"header-green py-1",style:{fontSize:.7*r+x(278)},children:"SUMMATIVE TEST"}),a[x(294)](x(467),{style:{tableLayout:x(253)},children:a[x(421)](x(260),{children:[a[x(421)]("tr",{className:"header-row-fill",children:[a[x(294)]("td",{className:x(371),style:{width:"40%"},children:x(329)}),[1,2][x(293)](n=>a[x(294)]("td",{children:n},n))]}),[1,2,3][x(293)](n=>a[x(421)]("tr",{children:[a[x(294)]("td",{className:x(201),children:n===1?x(242):n===2?"SECOND":x(450)}),[...Array(2)][x(293)]((m,p)=>a[x(294)]("td",{children:T?.[n]?.scores.st[p]??""},p))]},n))]})})]}),a[x(294)]("div",{className:"col-span-1",children:a[x(421)](x(467),{style:{tableLayout:"fixed"},children:[a.jsx(x(382),{children:a.jsx("tr",{className:"header-row-fill",children:a[x(294)]("td",{colSpan:2,className:x(482),style:{fontSize:.7*r+x(278)},children:"TERM EXAM"})})}),a[x(294)](x(260),{children:[1,2,3][x(293)](n=>a.jsxs("tr",{children:[a[x(421)]("td",{className:x(217),style:{borderColor:c},children:[x(n===1?462:n===2?333:196)," TERM"]}),a[x(294)]("td",{className:x(423),children:T?.[n]?.[x(224)].te||""})]},n))})]})}),a[x(294)](x(304),{className:x(411),children:a[x(421)]("table",{style:{tableLayout:x(253)},children:[a.jsx("thead",{children:a[x(294)]("tr",{className:"header-row-fill",children:a[x(294)]("td",{colSpan:2,className:x(482),style:{fontSize:.7*r+x(278)},children:x(283)})})}),a[x(294)]("tbody",{children:[1,2,3][x(293)](n=>a.jsxs("tr",{children:[a[x(421)]("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:c},children:[n===1?"1ST":n===2?"2ND":x(196)," TERM"]}),a.jsx("td",{className:"font-bold",children:T?.[n]?.[x(476)]||""})]},n))}),a[x(294)]("tfoot",{children:a[x(294)]("tr",{style:{height:1.5*r+"px"},children:a[x(294)]("td",{colSpan:2,style:{border:"none"}})})})]})}),a[x(421)](x(304),{className:x(282),style:{marginTop:S},children:[a[x(294)](x(304),{className:x(383),children:a[x(294)]("img",{src:P+x(255),alt:x(375),className:"object-contain",style:{width:F*r,height:E*r}})}),a.jsx(x(304),{className:x(338)}),a[x(294)]("p",{className:x(361),style:{fontSize:.6*r+x(278),marginTop:14*r+"px"},children:x(470)})]})]})]}),a[x(421)]("div",{className:x(399),style:{borderColor:c},children:[a.jsx(x(304),{className:x(288),children:x(484)}),a[x(421)]("table",{className:x(269),children:[a[x(421)]("colgroup",{children:[a[x(294)](x(403),{style:{width:x(440)}}),Array[x(265)]({length:g})[x(293)]((n,m)=>a[x(294)]("col",{style:{width:x(507)}},m)),a[x(294)](x(403),{style:{width:"7%"}})]}),a[x(294)]("thead",{children:a.jsxs("tr",{children:[a[x(294)]("th",{className:"month-col uppercase",children:"Months"}),a[x(294)]("th",{colSpan:g,className:x(407),children:"Dates"}),a.jsx("th",{className:x(286),children:x(474)})]})}),a[x(294)](x(260),{children:[{name:x(266),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:x(427),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:x(409),dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:"SEPTEMBER",dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:"OCTOBER",dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:"NOVEMBER",dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:x(268),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:x(389),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:"FEBRUARY",dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:x(190),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:x(501),dates:[1,2,5,6,7,8]}][x(293)](n=>a[x(421)]("tr",{children:[a.jsx("td",{className:x(239),children:n[x(350)]}),W(n[x(447)])[x(293)]((m,p)=>a[x(294)]("td",{className:x(205),style:{color:v(n[x(350)],m)?x(312):x(415)},children:m},p)),a[x(294)]("td",{className:x(423),children:V[n[x(350)]]||""})]},n.name))})]}),a.jsxs(x(304),{className:"flex items-stretch border-2 w-full overflow-hidden",style:{borderColor:c},children:[a[x(421)](x(304),{className:x(488),children:[a[x(294)](x(304),{className:x(401),children:"Important Dates"}),[["June 8-11, 2026",x(376)],[x(373),x(298)],["July 28, 2026",x(232)],[x(326),"Term 1 Examination"],["Sept 1, 2026",x(227)],[x(422),x(258)],["Sept 16, 2026","Start of Term 2"]][x(293)](([n,m])=>a[x(421)](x(304),{className:x(388),children:[a[x(294)](x(304),{className:x(369),children:n}),a[x(294)](x(304),{className:x(302),children:m})]},n))]}),a[x(421)](x(304),{className:x(488),children:[a[x(294)](x(304),{className:"important-dates-header uppercase italic",children:x(330)}),[[x(331),x(444)],["Oct 29, 2026",x(184)],["Dec 3-4, 2026",x(486)],["Dec 7-18, 2026",x(258)],[x(221),x(183)],["Jan 4, 2027","Start of Term 3"],[x(256),x(340)]].map(([n,m])=>a[x(421)](x(304),{className:x(388),children:[a.jsx(x(304),{className:"date-val uppercase",children:n}),a[x(294)](x(304),{className:x(302),children:m})]},n))]}),a[x(421)](x(304),{className:x(488),children:[a[x(294)](x(304),{className:x(401),children:x(330)}),[[x(349),"Term 3: Summative Test #2"],["Mar 15-16, 2027",x(465)],[x(211),x(180)],["Mar 24-31, 2027","End-of-Term Block"],[x(281),"End-of-Term Block"],[x(316),x(313)],[x(386),x(189)]][x(293)](([n,m])=>a[x(421)](x(304),{className:x(388),children:[a[x(294)](x(304),{className:"date-val uppercase",children:n}),a[x(294)]("div",{className:x(302),children:m})]},n))]})]})]})]})]})})};function j0(){const e=Y,{students:u,sections:d,subjects:y,teachers:j,schoolProfile:I,activeSchoolYear:o,setCurrentView:c,classRecords:T,gradingSheetRecords:L,hpsRecords:V,sf2Sheets:x}=m0(),{user:P}=b0(),[g,W]=N[e(372)](""),[v,A]=N[e(372)](null),[f,r]=N[e(372)](""),[C,H]=N[e(372)](1),[M,k]=N[e(372)](e(437)),[R,U]=N.useState("#22c55e"),[w,F]=N[e(372)]("folio"),E=N[e(466)](()=>{const t=e;return d.find(l=>l[t(414)]===g||l.id===g)},[d,g]),S=N[e(466)](()=>{const t=e;return y[t(433)](l=>l.id===f||l[t(321)]===f)},[y,f]),n=N.useMemo(()=>{if(!E)return[];const t=p0(P,E,y),l=new Set;return t.filter(i=>{const s=D,h=f0(i.subject_name);return l[s(358)](h)?!1:(l.add(h),!0)})},[E,y,P]),m=N[e(466)](()=>{const t=e;if(S?.[t(272)]){const l=j[t(433)](i=>i[t(263)]===S.teacher_id||i.id===S[t(272)]);if(l)return l.displayName||l.name}return E?.[t(471)]||""},[S,j,E]),p=()=>{const t=e;if(!v)return;const l=document[t(229)],i=(v[t(464)]+"_"+v[t(193)])[t(431)](/[^a-z0-9]/gi,"_");document[t(229)]=t(292)+i+"_"+o,window[t(285)](),setTimeout(()=>{const s=t;document[s(229)]=l},1e3)},_=N.useMemo(()=>{const t=e;return[...d][t(307)]((l,i)=>{const s=t,h=(l[s(259)]||"")[s(251)](i[s(259)]||"",void 0,{numeric:!0});return h!==0?h:(l.section_name||"")[s(251)](i[s(414)]||"")})},[d]),B=N[e(466)](()=>{const t={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return _.forEach(l=>{const i=D,s=(l[i(259)]||"")[i(327)](),h=parseInt(s[i(431)](/\D/g,""))||0;s.includes(i(420))||h>=1&&h<=6?t.ELEMENTARY.push(l):h>=7&&h<=10?t[i(360)][i(500)](l):h>=11&&h<=12&&t["SENIOR HIGH SCHOOL"].push(l)}),t},[_]);N[e(192)](()=>{const t=e;if(!g&&_[t(396)]===1){const l=setTimeout(()=>{const i=t;W(_[0][i(414)])},0);return()=>clearTimeout(l)}},[_,g]),N[e(192)](()=>{const t=setTimeout(()=>{r(""),A(null)},0);return()=>clearTimeout(t)},[g]);const K=N[e(466)](()=>{const t=e;if(!g)return[];const l=d[t(433)](i=>i[t(414)]===g||i.id===g)?.id;return u.filter(i=>i[t(339)]===g||l&&i[t(339)]===l)},[u,g,d]),Q=K.filter(t=>(t[e(311)]||"")[e(327)]()===e(391))[e(307)]((t,l)=>t[e(464)][e(251)](l.last_name)),$=K[e(218)](t=>(t.gender||"")[e(327)]()===e(222))[e(307)]((t,l)=>t[e(464)].localeCompare(l[e(464)])),a0=N[e(466)](()=>{const t=e;if(!v)return{};const l={};return x.filter(s=>s[t(303)]===o&&(s[t(277)]===E?.id||s.section_id===g)).forEach(s=>{const h=t,G=s[h(207)]?.[v.lrn];if(G){const O=Object[h(408)](G)[h(218)](Z=>Z?.[h(327)]()===h(374))[h(396)];O>0&&(l[s.month[h(289)]()]=O)}}),l},[v,x,o,E,g]),t0=N[e(466)](()=>{const t=e;if(!v||!f)return;const l={};return[1,2,3][t(496)](i=>{const s=t,h=T[s(433)](b=>b[s(363)]===v[s(426)]&&b[s(303)]===o&&Number(b[s(271)])===i&&(b[s(458)]===S?.id||b.subject_id===f))||L[s(433)](b=>b[s(363)]===v[s(426)]&&b[s(303)]===o&&Number(b[s(271)])===i&&(b.subject_id===S?.id||b[s(458)]===f)),G=V[s(433)](b=>(b[s(458)]===S?.id||b[s(458)]===f)&&b[s(303)]===o&&Number(b[s(271)])===i),O=(b,l0)=>{const x0=s,s0=Array[x0(219)](b)?b:[];return Array[x0(265)]({length:l0},(g0,n0)=>s0[n0]??"")},Z=h,r0=G,z=b=>b===""||b===null||b===void 0?"":b;l[i]={scores:{ww:O(h?.[s(343)],10)[s(293)](z),pt:O(h?.[s(397)],10)[s(293)](z),st:O(Z?.[s(439)],5)[s(293)](z),te:z(h?.[s(328)]??"")},hps:{ww:O(G?.[s(343)],10)[s(293)](z),pt:O(G?.performance_tasks,10).map(z),st:O(r0?.summative_tests,5)[s(293)](z),te:z(G?.quarterly_exam??"")},finalGrade:z(h?.[s(336)]??"")}}),l},[v,f,S,T,L,V,o]);return a[e(421)](e(304),{className:e(337),children:[a[e(421)]("div",{className:e(370),children:[a[e(294)](e(304),{className:e(441)}),a.jsxs(e(304),{className:e(417),children:[a.jsxs(e(304),{className:"flex items-center gap-2 lg:gap-3 shrink-0",children:[a.jsx(e(270),{onClick:()=>c("school-forms"),className:e(502),title:e(377),children:a.jsx(i0,{className:e(209)})}),a[e(421)](e(304),{className:"flex flex-col shrink-0",children:[a[e(294)]("h2",{className:e(344),children:e(279)}),a[e(294)]("p",{className:e(185),children:e(300)})]})]}),a[e(294)](e(304),{className:e(245)}),a[e(421)](e(304),{className:e(210),children:[a[e(421)](e(301),{className:"appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[120px] lg:min-w-[135px] duration-200",value:g,onChange:t=>{const l=e;W(t[l(366)][l(493)]),A(null),r("")},children:[a[e(294)](e(325),{value:"",children:e(402)}),Object.entries(B).map(([t,l])=>l[e(396)]>0&&a[e(294)](e(400),{label:t,children:l[e(293)](i=>a.jsxs(e(325),{value:i[e(414)],children:[i.section_grade_level,e(244),i[e(414)]]},i.id))},t))]}),a[e(294)](X,{className:e(231)})]}),a[e(421)]("div",{className:e(210),children:[a[e(421)](e(301),{className:e(456),value:f,onChange:t=>{const l=e;r(t[l(366)][l(493)]),A(null)},disabled:!g,children:[a[e(294)](e(325),{value:"",children:e(335)}),n[e(293)](t=>a.jsx("option",{value:t.id,children:t[e(321)]},t.id))]}),a[e(294)](X,{className:"w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors"})]}),a.jsxs(e(304),{className:e(210),children:[a.jsxs(e(301),{className:"appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[140px] lg:min-w-[160px] max-w-[200px] truncate disabled:opacity-30 duration-200",value:v?.[e(426)]||"",onChange:t=>{const l=e,i=u[l(433)](s=>s[l(426)]===t.target[l(493)])||null;A(i)},disabled:!f,children:[a[e(294)](e(325),{value:"",children:e(202)}),Q[e(396)]>0&&a[e(294)](e(400),{label:e(478),children:Q[e(293)](t=>{const l=e,i=f&&(T[l(247)](s=>s[l(363)]===t[l(426)]&&s.subject_id===f&&s[l(303)]===o)||L[l(247)](s=>s[l(363)]===t[l(426)]&&s.subject_id===f&&s[l(303)]===o));return a[l(421)](l(325),{value:t[l(426)],children:[t.last_name,", ",t[l(193)]," ",i?"✓":""]},t[l(426)])})}),$[e(396)]>0&&a[e(294)](e(400),{label:e(226),children:$[e(293)](t=>{const l=e,i=f&&(T[l(247)](s=>s.student_lrn===t[l(426)]&&s[l(458)]===f&&s.school_year===o)||L.some(s=>s[l(363)]===t[l(426)]&&s[l(458)]===f&&s[l(303)]===o));return a[l(421)]("option",{value:t[l(426)],children:[t[l(464)],", ",t[l(193)]," ",i?"✓":""]},t[l(426)])})})]}),a[e(294)](X,{className:e(231)})]}),a[e(294)](e(304),{className:e(245)}),a[e(421)](e(304),{className:e(210),children:[a[e(421)](e(301),{value:w,onChange:t=>F(t.target.value),className:"appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer min-w-[70px] lg:min-w-[80px] duration-200",title:"Paper Size",children:[a[e(294)](e(325),{value:"a4",children:"A4"}),a[e(294)](e(325),{value:e(460),children:e(324)}),a[e(294)]("option",{value:e(378),children:"Folio"})]}),a[e(294)](X,{className:e(231)})]}),a[e(294)](e(304),{className:"h-6 w-px bg-slate-200 shrink-0 mx-0.5"}),a.jsxs(e(304),{className:e(495),children:[a[e(421)](e(304),{className:"relative flex items-center justify-center cursor-pointer shrink-0",title:"Choose Fill Color",children:[a[e(294)]("div",{className:e(505),style:{backgroundColor:M}}),a.jsx(e(406),{type:"color",value:M,onChange:t=>k(t.target.value),className:e(320)})]}),a.jsxs(e(304),{className:e(291),title:"Choose Outline Color",children:[a[e(294)]("div",{className:e(505),style:{backgroundColor:R}}),a[e(294)](e(406),{type:e(491),value:R,onChange:t=>U(t[e(366)][e(493)]),className:"w-5 h-5 opacity-0 absolute inset-0 cursor-pointer"})]})]}),a.jsx(e(304),{className:e(245)}),a.jsxs(e(304),{className:e(434),children:[a[e(294)](e(270),{onClick:()=>H(t=>Math[e(381)](.4,t-.1)),className:e(384),title:e(477),children:a[e(294)](d0,{className:e(267)})}),a.jsxs(e(494),{className:e(264),children:[Math.round(C*100),"%"]}),a[e(294)](e(270),{onClick:()=>H(t=>Math[e(442)](1.5,t+.1)),className:e(384),title:"Zoom In",children:a[e(294)](o0,{className:e(267)})})]}),a.jsx("div",{className:e(245)}),a[e(421)]("button",{onClick:p,disabled:!v,className:e(248),children:[a[e(294)](e0,{className:e(319)}),e(233)]})]})]}),a[e(294)](e(304),{className:e(473),children:a[e(294)](e(304),{className:e(390),children:v?a[e(294)](e(304),{className:e(299),style:{transform:e(352)+C+e(457),willChange:e(220),backfaceVisibility:e(480),WebkitBackfaceVisibility:e(480)},children:a[e(421)](e(304),{className:"relative group",children:[a[e(294)](e(304),{className:e(492)}),a[e(294)]("div",{className:e(308),children:a[e(294)](u0,{pageNumber:1,student:v,profile:I,schoolYear:o,subject:S?.subject_name||"",teacher:m,fillColor:M,outlineColor:R,gradeData:t0,attendanceData:a0,paperSize:w})})]})}):a[e(421)]("div",{className:e(345),children:[a[e(421)](e(304),{className:e(252),children:[a.jsx(e(304),{className:e(342)}),a.jsxs(e(304),{className:e(483),children:[a[e(294)](h0,{className:e(416)}),a[e(421)]("div",{className:"absolute inset-0 flex flex-col items-center justify-center",children:[a[e(294)](e(494),{className:e(274),children:e(197)}),a.jsx("div",{className:"w-20 h-1 bg-emerald-500/10 rounded-full mt-4"})]}),a[e(294)]("div",{className:e(213),children:a[e(294)](e0,{className:e(230)})})]})]}),a.jsxs("div",{className:e(410),children:[a[e(294)]("h2",{className:e(262),children:e(246)}),a[e(294)]("p",{className:"text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60",children:e(404)})]})]})})}),a[e(294)](e(393),{children:e(187)+e(w==="a4"?287:w==="letter"?186:348)+e(309)+e(w==="a4"?341:497)+e(235)+(w==="a4"?e(362):w===e(460)?e(443):e(385))+e(275)+(w==="a4"?"210mm":e(497))+e(235)+(w==="a4"?"297mm":e(w==="letter"?443:385))+e(475)+e(w==="a4"?341:497)+e(235)+(w==="a4"?e(362):w===e(460)?e(443):e(385))+e(315)})]})}function D(e,u){return e=e-179,q()[e]}function q(){const e=["WRITTEN /ORAL WORKS (WWs)","End-of-Term Block","section_grade_level","tbody","FIRST NAME","text-4xl font-black text-slate-900 tracking-tight uppercase","uid","text-[9px] font-black text-slate-900 w-8 text-center tabular-nums","from","JUNE","w-3.5 h-3.5","DECEMBER","attendance-table mb-3","button","quarter","teacher_id",`;
                        padding: `,"text-7xl font-black text-slate-100 tracking-tighter leading-none italic",` !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `,"grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","section_id","rem","Learner Record",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"Apr 1-8, 2027","col-span-1 flex flex-col items-center justify-center pt-1","FINAL GRADE",`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `,"print","absences-header uppercase","210mm 297mm","lir-title-bar-custom mb-3 uppercase tracking-widest","toUpperCase",`; 
                        text-align: center; 
                        font-size: `,"relative flex items-center justify-center cursor-pointer shrink-0","LIR_","map","jsx",`px; 
                        border-right: 1px solid `,"header-row-fill","GRADE & SECTION","Term 1: Summative Test #1","transition-all duration-700 ease-out origin-top print:scale-100","Individual LIR","select","date-label uppercase","school_year","div","-11px","746727iTLHYS","sort","lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none",`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `,"data-field uppercase font-bold border-2 whitespace-nowrap","gender","red","EOSY Rites",`px; 
                        font-weight: 700; 
                        font-size: `,` !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                }
             `,"Apr 6-7, 2027","font-black uppercase italic",`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `,"w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform","w-5 h-5 opacity-0 absolute inset-0 cursor-pointer","subject_name",`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `,"15%","Letter","option","Aug 28, 2026","toLowerCase","quarterly_exam","TERM","Important Dates","Oct 7, 2026","PRODUCT/PERFORMANCE TASK (PPTs)","2ND","School Year: ","Select Subject","final_grade","lir-print-root flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white","signature-box bg-white","student_section","Term 3: Summative Test #1","210mm","absolute -inset-24 bg-emerald-500/5 blur-[120px] rounded-full","written_works","text-[11px] lg:text-[12px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10",`dd;
                        border: 1px solid `,`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"8.5in 13in","Feb 16, 2027","name","203882xMrzgy","scale(",`px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .term-label {
                        color: #ef4444;
                        background-color: `,"console","1724432CgrVdA","photo_url","5769thCmwz","has",`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"JUNIOR HIGH SCHOOL","font-bold uppercase leading-none text-center","297mm","student_lrn","LAST NAME",`rem; 
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
                `,"target","student-info-table border-2","img","date-val uppercase","z-20 bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm sticky top-0 print:hidden shrink-0 w-full","term-label","useState","July 6, 2026","absent","DepEd Logo","Opening Block: Term 1","Back to Hub","folio","label-green py-1 border-2",`;
                        border-radius: 8px;
                        height: `,"max","thead","mb-2","w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all active:scale-90 duration-200","13in","Apr 8, 2027",`px 0;
                        width: 100%;
                    }

                    .header-green {
                        background-color: `,"date-row","JANUARY","w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0","male",`px;
                        width: `,"style","BAGONG BARRIO NATIONAL HIGH SCHOOL","label-green border-2 whitespace-nowrap","length","performance_tasks",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"half-page-section border-t-4","optgroup","important-dates-header uppercase italic","Choose Section","col","Select a learner from the toolbar above to preview their individual record card.","NOVEMBER","input","dates-header-bar uppercase","values","AUGUST","space-y-4","col-span-1","SECOND","flex items-center gap-4 shrink-0","section_name","inherit","w-28 h-28 text-slate-100","flex items-center justify-start w-full h-16 select-none relative px-3 lg:px-4 gap-2 lg:gap-3 overflow-x-auto scrollbar-none","39832067CYhHUl","exception","kinder","jsxs","Sept 2-15, 2026","font-bold",`rem;
                        vertical-align: middle;
                        background-color: white;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,"School Logo","lrn","JULY",`rem; 
                        padding: `,"info","5483076ROkDDi","replace",`;
                        border: 1px solid `,"find","flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 h-9 shrink-0","label-green py-1 border-2 px-1","M.I","#86efac","w-auto ml-4 overflow-hidden","summative_tests","10%","absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30","min","11in","Term 2: Summative Test #1","px ","auto","dates",`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,`;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"THIRD","w-full h-full object-cover","apply",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,`; 
                        font-size: `,"school-logo.png","appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer min-w-[130px] lg:min-w-[145px] disabled:opacity-30 duration-200",") translateZ(0)","subject_id",`; 
                        color: black !important; 
                        font-size: `,"letter",`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `,"1ST","20%","last_name","Term 3 Exam (Graduating)","useMemo","table",`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"Teacher's Signature","adviser_name",`rem;
                        table-layout: fixed;
                    }

                    th, td {
                        border: 1px solid `,"flex-1 overflow-auto relative bg-slate-100 print:bg-white custom-scrollbar","Total Abs.",` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"finalGrade","Zoom Out","MALE",`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `,"hidden","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden","font-bold py-1","relative w-64 h-64 bg-white rounded-[5rem] border border-slate-200 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl","Daily Attendance","PHOTO","Term 2 Examination","middle_name","important-dates-box",`px; 
                        font-size: `,"card-container-combined print:m-0 print:shadow-none","color","absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000","value","span","flex gap-1.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 h-9 shrink-0 items-center px-2","forEach","8.5in","TEACHER","border-collapse border-2","push","APRIL","w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all group shrink-0 active:scale-95 duration-200",`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,"bind","w-5 h-5 rounded-lg border border-slate-200 shadow-sm shrink-0",`px; 
                        padding: `,"3.32%",`rem;
                    }

                    .row-label {
                        background-color: `,`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `,"Term 3 Exam (Non-Grad)",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,"data-field font-extrabold border-2 whitespace-nowrap","End of Term 2","Term 2: Summative Test #2","text-[7.5px] font-black text-emerald-600 uppercase tracking-widest leading-none","8.5in 11in",`
                @media print {
                    @page {
                        size: `,"constructor","End of Term 3","MARCH",`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,"useEffect","first_name","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","14890PPrPUm","3RD","LIR","#22c55e","LRN","TOTAL","row-label","Select Learner","4FpMlDX","half-page-section","attendance-date-cell",`px;
                        text-align: center;
                        height: `,"attendance",`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,"w-4 h-4 group-hover:-translate-x-0.5 transition-transform","relative group shrink-0","Mar 22-23, 2027","69855hXGJyn","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 group-hover:rotate-12 transition-all duration-500","342ckxbWG","header-green py-1",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"row-label py-1 px-1 border-2","filter","isArray","transform","Dec 18, 2026","female","return (function() ","scores","reduce","FEMALE","Term 1 Examination","flex items-center justify-center bg-white overflow-hidden","title","w-10 h-10 text-white","w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors","Term 1: Summative Test #2","Print / PDF",`;
                        font-size: `,` !important;
                        height: `,"font-normal ml-2","232sendai",`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,"month-col","error","1 X 1","FIRST","40px"," - ","h-6 w-px bg-slate-200 shrink-0 mx-0.5","Individual Record","some","h-9 px-3.5 lg:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8.5px] uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200",`rem;
                        width: `,"slice","localeCompare","relative group","fixed","max-w-full max-h-full object-contain","deped_logo_right.png","Jan 25, 2027"];return q=function(){return e},q()}export{j0 as LIRPage};
