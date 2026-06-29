import{j as a,r as N,cn as c0,cy as W,bE as o0,c6 as d0,c9 as e0,cw as h0}from"./vendor-BhdFOiKe.js";import{b as b0,u as m0,h as p0,n as f0}from"./index-Bdr5Pqj7.js";import"./vendor-pdf-libs-DsGp3SWi.js";import"./vendor-firebase-Disz2AMb.js";import"./vendor-framer-motion-CC-6_ZZ2.js";const K=M;(function(e,g){const d=M,y=e();for(;;)try{if(-parseInt(d(453))/1*(parseInt(d(538))/2)+parseInt(d(343))/3*(-parseInt(d(601))/4)+parseInt(d(448))/5*(parseInt(d(391))/6)+parseInt(d(592))/7*(-parseInt(d(426))/8)+parseInt(d(411))/9*(parseInt(d(493))/10)+-parseInt(d(326))/11+-parseInt(d(589))/12*(-parseInt(d(529))/13)===g)break;y.push(y.shift())}catch{y.push(y.shift())}})(X,428612);const J=(function(){let e=!0;return function(g,d){const y=e?function(){const R=M;if(d){const A=d[R(497)](g,arguments);return d=null,A}}:function(){};return e=!1,y}})(),i0=J(void 0,function(){const e=M,g=function(){const A=M;let o;try{o=Function("return (function() "+A(566)+");")()}catch{o=window}return o},d=g(),y=d[e(371)]=d[e(371)]||{},R=["log",e(585),e(495),"error","exception",e(563),e(380)];for(let A=0;A<R[e(483)];A++){const o=J[e(289)].prototype[e(476)](J),i=R[A],j=y[i]||o;o[e(524)]=J[e(476)](J),o[e(421)]=j[e(421)][e(476)](j),y[i]=o}});i0();function M(e,g){return e=e-265,X()[e]}const u0=({pageNumber:e,student:g,profile:d,schoolYear:y,subject:R,teacher:A,fillColor:o=K(301),outlineColor:i=K(523),gradeData:j,paperSize:D="folio",attendanceData:Y={}})=>{const x=K,F="./",f=25,V=n=>Array[M(362)]({length:f},(p,_)=>n[_]??""),v=(n,h)=>{const p=M,_=Number(h);if(!_)return!1;const B=n.toUpperCase();return B===p(568)&&_===12||B==="AUGUST"&&(_===21||_===31)||B===p(364)&&(_===2||_===30)||B===p(340)&&_===8||B==="JANUARY"&&_===1};let L=x(441),m="8.5in",r=1.12,C=1.2,U=.8,H=.75,S=5,I=.8,G=40,w=240,P=100,E=50,T=x(478);return D==="a4"?(m="210mm",L=x(507),r=1.02,C=.85,U=.55,H=.5,S=2,I=.65,G=26,w=140,P=80,E=40):D===x(339)?(m="8.5in",L=x(485),r=.98,C=.85,U=.55,H=.5,S=3,I=.7,G=28,w=160,P=65,E=32,T=x(556)):D===x(268)&&(m=x(333),L="13in",r=.98,C=.85,U=.55,H=.5,S=3,I=.7,G=28,w=160,P=65,E=32,T="-11px"),a[x(420)](x(390),{className:x(577),children:a[x(363)](x(390),{className:x(342),style:{width:m,height:L},children:[a[x(420)](x(462),{children:x(552)+m+" "+L+x(312)+i+x(572)+8*r+`px;
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
                        padding: `+5*r+x(360)+o+`;
                        border: 1px solid `+i+x(299)+3*r+x(408)+.85*r+`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `+o+`dd;
                        border: 1px solid `+i+x(349)+.6*r+x(267)+i+x(572)+2*r+x(506)+.8*r+`rem;
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
                        border: 1px solid `+i+`;
                        padding: `+1.5*r+x(323)+24*r+x(404)+o+x(413)+.6*r+`rem;
                    }

                    .row-label {
                        background-color: `+o+x(438)+.6*r+x(513)+70*r+x(355)+o+`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `+i+`;
                        border-radius: 8px;
                        height: `+G*r+`px;
                        width: `+w*r+`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `+o+x(338)+.9*r+x(576)+4*r+x(392)+i+x(457)+i+x(406)+i+x(286)+.5*r+x(544)+21*r+x(354)+1*r+x(412)+o+`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `+.5*r+x(372)+i+x(537)+o+x(466)+.9*r+`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `+o+`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `+.45*r+x(479)+.5*r+`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `+i+x(588)+o+x(595)+3*r+x(505)+.85*r+x(475)+i+x(534)+i+x(290)+.45*r+x(327)+18*r+x(454)+95*r+x(491)+i+x(560)+1.5*r+x(464)+4*r+x(307)+1.5*r+"px "+4*r+x(356)+.42*r+`rem; 
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
                `}),a.jsxs("div",{className:x(298),children:[a[x(363)]("div",{className:x(367),children:[a[x(363)](x(390),{className:x(455),children:[a[x(363)](x(390),{className:"flex items-center gap-4 shrink-0",children:[a[x(420)](x(390),{className:"flex items-center justify-center bg-white overflow-hidden",style:{width:64*r,height:64*r},children:a[x(420)](x(482),{src:d.logo_url||F+x(584),alt:x(274),className:x(317),onError:n=>{const h=x;n[h(542)][h(520)]=F+h(584)}})}),a.jsxs(x(390),{children:[a[x(420)]("h1",{className:"font-extrabold uppercase whitespace-nowrap",style:{fontSize:C*r+x(451)},children:d[x(337)]||x(469)}),a[x(420)]("p",{className:x(416),style:{fontSize:U*r+"rem",color:i},children:x(446)}),a[x(363)]("p",{className:"font-bold",style:{fontSize:H*r+x(451)},children:["School Year: ",a[x(420)](x(291),{className:"font-normal ml-2",children:y})]})]})]}),a[x(420)](x(390),{className:"w-auto ml-4 overflow-hidden",children:a[x(420)]("table",{className:x(384),style:{borderColor:i,tableLayout:"auto"},children:a[x(420)](x(316),{children:a.jsxs("tr",{children:[a[x(420)]("td",{className:"label-green border-2 whitespace-nowrap",style:{fontSize:I*r+x(451),padding:S*r+x(464)+S*4*r+"px",borderColor:i},children:x(379)}),a[x(420)]("td",{className:x(422),style:{fontSize:I*r+x(451),padding:S*r+"px "+S*4*r+"px",borderColor:i},children:R}),a[x(420)]("td",{className:x(399),style:{fontSize:I*r+"rem",padding:S*r+"px "+S*4*r+"px",borderColor:i},children:x(452)}),a[x(420)]("td",{className:x(422),style:{fontSize:I*r+x(451),padding:S*r+x(464)+S*4*r+"px",borderColor:i},children:A})]})})})})]}),a[x(363)](x(390),{className:x(277),children:[a[x(420)]("div",{className:x(385),style:{width:1*r+"in",height:1*r+"in",borderColor:i},children:g[x(541)]?a[x(420)](x(482),{src:g[x(541)],alt:x(383),className:"w-full h-full object-cover"}):a[x(363)](x(291),{className:x(331),style:{fontSize:.7*r+x(451)},children:[x(285),a.jsx("br",{}),x(427)]})}),a.jsx(x(390),{className:"grow flex flex-col gap-1 overflow-hidden",children:a[x(420)](x(563),{className:"student-info-table border-2",style:{borderColor:i,height:1*r+"in"},children:a[x(363)](x(316),{children:[a.jsxs("tr",{style:{height:.5*r+"in"},children:[a[x(420)]("td",{className:x(587),style:{borderColor:i,height:.5*r+"in"},children:g[x(517)]}),a[x(420)]("td",{className:x(587),style:{borderColor:i,height:.5*r+"in"},children:g[x(501)]}),a[x(420)]("td",{className:x(410),style:{width:x(508),borderColor:i,height:.5*r+"in"},children:g.middle_name?.[x(598)](0)||""}),a[x(420)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:i,height:.5*r+"in"},children:g[x(596)]}),a.jsx("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:i,height:.5*r+"in"},children:g.lrn})]}),a[x(363)]("tr",{style:{height:.5*r+"in"},children:[a.jsx("td",{className:x(545),style:{borderColor:i,height:.5*r+"in"},children:"LAST NAME"}),a.jsx("td",{className:x(545),style:{borderColor:i,height:.5*r+"in"},children:x(509)}),a[x(420)]("td",{className:x(403),style:{width:x(508),borderColor:i,height:.5*r+"in"},children:"M.I"}),a.jsx("td",{className:x(545),style:{borderColor:i,height:.5*r+"in"},children:x(515)}),a.jsx("td",{className:x(545),style:{borderColor:i,height:.5*r+"in"},children:x(393)})]})]})})})]}),a[x(363)](x(390),{className:x(429),children:[a[x(363)](x(390),{children:[a[x(420)](x(390),{className:x(519),style:{fontSize:.75*r+"rem"},children:"WRITTEN /ORAL WORKS (WWs)"}),a[x(420)](x(563),{style:{tableLayout:x(521)},children:a[x(363)]("tbody",{children:[a[x(363)]("tr",{className:x(593),children:[a[x(420)]("td",{className:x(322),style:{width:x(373)},children:x(374)}),[1,2,3,4,5].map(n=>a[x(420)]("td",{style:{width:"13%"},children:n},n)),a[x(420)]("td",{className:"font-bold",style:{width:x(350)},children:"TOTAL"})]}),[1,2,3].map(n=>a.jsxs("tr",{children:[a[x(420)]("td",{className:x(283),children:x(n===1?511:n===2?381:329)}),[...Array(5)].map((h,p)=>a[x(420)]("td",{children:j?.[n]?.scores.ww[p]??""},p)),a[x(420)]("td",{className:x(564),children:j?.[n]?.scores.ww[x(459)](0,5)[x(440)]((h,p)=>h+(Number(p)||0),0)||""})]},n))]})})]}),a.jsxs(x(390),{children:[a[x(420)](x(390),{className:x(519),style:{fontSize:.75*r+"rem"},children:x(409)}),a[x(420)](x(563),{style:{tableLayout:x(521)},children:a[x(363)]("tbody",{children:[a.jsxs("tr",{className:"header-row-fill",children:[a[x(420)]("td",{className:x(322),style:{width:x(350)},children:x(374)}),[1,2,3][x(369)](n=>a.jsx("td",{style:{width:x(350)},children:n},n)),a.jsx("td",{className:"font-bold",style:{width:x(350)},children:"TOTAL"})]}),[1,2,3][x(369)](n=>a[x(363)]("tr",{children:[a[x(420)]("td",{className:x(283),children:x(n===1?511:n===2?381:329)}),[...Array(3)][x(369)]((h,p)=>a[x(420)]("td",{children:j?.[n]?.scores.pt[p]??""},p)),a.jsx("td",{className:x(564),children:j?.[n]?.[x(599)].pt.slice(0,3)[x(440)]((h,p)=>h+(Number(p)||0),0)||""})]},n))]})})]})]}),a[x(363)]("div",{className:x(319),children:[a.jsxs(x(390),{className:x(335),children:[a[x(420)](x(390),{className:x(519),style:{fontSize:.7*r+x(451)},children:"SUMMATIVE TEST"}),a[x(420)](x(563),{style:{tableLayout:x(521)},children:a[x(363)](x(316),{children:[a[x(363)]("tr",{className:x(593),children:[a[x(420)]("td",{className:x(322),style:{width:x(315)},children:x(374)}),[1,2][x(369)](n=>a.jsx("td",{children:n},n))]}),[1,2,3][x(369)](n=>a[x(363)]("tr",{children:[a[x(420)]("td",{className:x(283),children:n===1?x(511):n===2?x(381):"THIRD"}),[...Array(2)][x(369)]((h,p)=>a[x(420)]("td",{children:j?.[n]?.[x(599)].st[p]??""},p))]},n))]})})]}),a[x(420)](x(390),{className:x(335),children:a[x(363)]("table",{style:{tableLayout:x(521)},children:[a[x(420)](x(463),{children:a[x(420)]("tr",{className:x(593),children:a.jsx("td",{colSpan:2,className:x(582),style:{fontSize:.7*r+"rem"},children:x(548)})})}),a[x(420)](x(316),{children:[1,2,3].map(n=>a[x(363)]("tr",{children:[a[x(363)]("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:i},children:[x(n===1?297:n===2?473:425),x(494)]}),a.jsx("td",{className:x(564),children:j?.[n]?.[x(599)].te||""})]},n))})]})}),a[x(420)](x(390),{className:x(335),children:a[x(363)](x(563),{style:{tableLayout:x(521)},children:[a[x(420)](x(463),{children:a.jsx("tr",{className:"header-row-fill",children:a[x(420)]("td",{colSpan:2,className:x(582),style:{fontSize:.7*r+x(451)},children:x(435)})})}),a[x(420)](x(316),{children:[1,2,3].map(n=>a.jsxs("tr",{children:[a.jsxs("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:i},children:[n===1?x(297):n===2?"2ND":"3RD",x(494)]}),a.jsx("td",{className:x(564),children:j?.[n]?.finalGrade||""})]},n))}),a[x(420)]("tfoot",{children:a[x(420)]("tr",{style:{height:1.5*r+"px"},children:a[x(420)]("td",{colSpan:2,style:{border:x(477)}})})})]})}),a[x(363)](x(390),{className:"col-span-1 flex flex-col items-center justify-center pt-1",style:{marginTop:T},children:[a[x(420)](x(390),{className:x(415),children:a.jsx(x(482),{src:F+x(488),alt:"DepEd Logo",className:x(423),style:{width:P*r,height:E*r}})}),a[x(420)](x(390),{className:x(430)}),a[x(420)]("p",{className:x(551),style:{fontSize:.6*r+x(451),marginTop:14*r+"px"},children:"Teacher's Signature"})]})]})]}),a[x(363)](x(390),{className:"half-page-section border-t-4",style:{borderColor:i},children:[a[x(420)](x(390),{className:"lir-title-bar-custom mb-3 uppercase tracking-widest",children:x(313)}),a[x(363)]("table",{className:x(579),children:[a[x(363)]("colgroup",{children:[a[x(420)]("col",{style:{width:x(512)}}),Array.from({length:f})[x(369)]((n,h)=>a[x(420)](x(436),{style:{width:x(531)}},h)),a[x(420)]("col",{style:{width:"7%"}})]}),a.jsx(x(463),{children:a[x(363)]("tr",{children:[a[x(420)]("th",{className:x(503),children:x(465)}),a[x(420)]("th",{colSpan:f,className:x(304),children:x(583)}),a.jsx("th",{className:x(402),children:x(281)})]})}),a[x(420)](x(316),{children:[{name:x(568),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:"JULY",dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:x(395),dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:"SEPTEMBER",dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:x(434),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:"NOVEMBER",dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:x(340),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:x(417),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:x(489),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:x(341),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:x(442),dates:[1,2,5,6,7,8]}][x(369)](n=>a[x(363)]("tr",{children:[a[x(420)]("td",{className:x(361),children:n[x(337)]}),V(n.dates)[x(369)]((h,p)=>a[x(420)]("td",{className:x(472),style:{color:v(n[x(337)],h)?x(468):x(282)},children:h},p)),a.jsx("td",{className:x(564),children:Y[n[x(337)]]||""})]},n[x(337)]))})]}),a.jsxs("div",{className:x(578),style:{borderColor:i},children:[a[x(363)](x(390),{className:x(558),children:[a[x(420)](x(390),{className:x(543),children:x(397)}),[["June 8-11, 2026",x(527)],["July 6, 2026",x(557)],[x(597),x(377)],["Aug 28, 2026","Term 1 Examination"],[x(357),x(324)],[x(553),"End-of-Term Block"],["Sept 16, 2026","Start of Term 2"]].map(([n,h])=>a[x(363)]("div",{className:x(320),children:[a[x(420)]("div",{className:"date-val uppercase",children:n}),a[x(420)](x(390),{className:x(432),children:h})]},n))]}),a[x(363)](x(390),{className:x(558),children:[a.jsx(x(390),{className:x(543),children:x(397)}),[[x(554),x(270)],[x(407),x(419)],["Dec 3-4, 2026",x(447)],[x(431),x(510)],[x(525),x(344)],["Jan 4, 2027",x(486)],[x(398),x(280)]][x(369)](([n,h])=>a[x(363)]("div",{className:x(320),children:[a.jsx(x(390),{className:x(516),children:n}),a[x(420)](x(390),{className:"date-label uppercase",children:h})]},n))]}),a[x(363)]("div",{className:x(558),children:[a[x(420)]("div",{className:x(543),children:x(397)}),[[x(310),x(273)],[x(287),x(375)],[x(570),x(490)],[x(318),"End-of-Term Block"],[x(370),x(510)],[x(368),"EOSY Rites"],["Apr 8, 2027",x(365)]][x(369)](([n,h])=>a.jsxs(x(390),{className:x(320),children:[a[x(420)](x(390),{className:x(516),children:n}),a[x(420)]("div",{className:x(432),children:h})]},n))]})]})]})]})]})})};function j0(){const e=K,{students:g,sections:d,subjects:y,teachers:R,schoolProfile:A,activeSchoolYear:o,setCurrentView:i,classRecords:j,gradingSheetRecords:D,hpsRecords:Y,sf2Sheets:x}=b0(),{user:F}=m0(),[f,V]=N[e(569)](""),[v,L]=N[e(569)](null),[m,r]=N[e(569)](""),[C,U]=N[e(569)](1),[H,S]=N[e(569)](e(301)),[I,G]=N[e(569)](e(523)),[w,P]=N[e(569)](e(268)),E=N.useMemo(()=>{const t=e;return d[t(539)](s=>s[t(555)]===f||s.id===f)},[d,f]),T=N[e(571)](()=>y[e(539)](s=>s.id===m||s.subject_name===m),[y,m]),n=N[e(571)](()=>{if(!E)return[];const t=p0(F,E,y),s=new Set;return t.filter(c=>{const l=M,u=f0(c[l(504)]);return s[l(269)](u)?!1:(s.add(u),!0)})},[E,y,F]),h=N[e(571)](()=>{const t=e;if(T?.teacher_id){const s=R[t(539)](c=>c[t(546)]===T[t(265)]||c.id===T[t(265)]);if(s)return s.displayName||s[t(337)]}return E?.adviser_name||""},[T,R,E]),p=()=>{const t=e;if(!v)return;const s=document[t(536)],c=(v.last_name+"_"+v[t(501)])[t(296)](/[^a-z0-9]/gi,"_");document[t(536)]=t(484)+c+"_"+o,window[t(376)](),setTimeout(()=>{const l=t;document[l(536)]=s},1e3)},_=N[e(571)](()=>{const t=e;return[...d][t(496)]((s,c)=>{const l=t,u=(s[l(575)]||"")[l(352)](c[l(575)]||"",void 0,{numeric:!0});return u!==0?u:(s[l(555)]||"")[l(352)](c.section_name||"")})},[d]),B=N[e(571)](()=>{const t=e,s={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return _[t(445)](c=>{const l=t,u=(c.section_grade_level||"")[l(580)](),k=parseInt(u[l(296)](/\D/g,""))||0;u.includes(l(325))||k>=1&&k<=6?s[l(405)][l(449)](c):k>=7&&k<=10?s[l(458)][l(449)](c):k>=11&&k<=12&&s[l(300)][l(449)](c)}),s},[_]);N[e(480)](()=>{if(!f&&_.length===1){const t=setTimeout(()=>{const s=M;V(_[0][s(555)])},0);return()=>clearTimeout(t)}},[_,f]),N.useEffect(()=>{const t=setTimeout(()=>{r(""),L(null)},0);return()=>clearTimeout(t)},[f]);const Z=N[e(571)](()=>{const t=e;if(!f)return[];const s=d[t(539)](c=>c[t(555)]===f||c.id===f)?.id;return g[t(559)](c=>c[t(596)]===f||s&&c[t(596)]===s)},[g,f,d]),Q=Z[e(559)](t=>(t[e(500)]||"")[e(580)]()===e(499)).sort((t,s)=>t[e(517)][e(352)](s[e(517)])),$=Z.filter(t=>(t[e(500)]||"")[e(580)]()===e(567))[e(496)]((t,s)=>t[e(517)][e(352)](s[e(517)])),a0=N[e(571)](()=>{const t=e;if(!v)return{};const s={};return x[t(559)](l=>l.school_year===o&&(l[t(351)]===E?.id||l[t(351)]===f))[t(445)](l=>{const u=t,k=l[u(443)]?.[v[u(396)]];if(k){const O=Object.values(k)[u(559)](q=>q?.toLowerCase()==="absent")[u(483)];O>0&&(s[l.month.toUpperCase()]=O)}}),s},[v,x,o,E,f]),t0=N[e(571)](()=>{const t=e;if(!v||!m)return;const s={};return[1,2,3][t(445)](c=>{const l=t,u=j[l(539)](b=>b[l(471)]===v[l(396)]&&b.school_year===o&&Number(b[l(444)])===c&&(b.subject_id===T?.id||b[l(492)]===m))||D.find(b=>b[l(471)]===v.lrn&&b[l(594)]===o&&Number(b.quarter)===c&&(b[l(492)]===T?.id||b.subject_id===m)),k=Y[l(539)](b=>(b[l(492)]===T?.id||b.subject_id===m)&&b.school_year===o&&Number(b[l(444)])===c),O=(b,s0)=>{const x0=l,l0=Array[x0(414)](b)?b:[];return Array[x0(362)]({length:s0},(g0,n0)=>l0[n0]??"")},q=u,r0=k,z=b=>b===""||b===null||b===void 0?"":b;s[c]={scores:{ww:O(u?.[l(389)],10)[l(369)](z),pt:O(u?.performance_tasks,10)[l(369)](z),st:O(q?.[l(314)],5)[l(369)](z),te:z(u?.[l(293)]??"")},hps:{ww:O(k?.[l(389)],10)[l(369)](z),pt:O(k?.performance_tasks,10)[l(369)](z),st:O(r0?.[l(314)],5)[l(369)](z),te:z(k?.[l(293)]??"")},finalGrade:z(u?.[l(302)]??"")}}),s},[v,m,T,j,D,Y,o]);return a[e(363)](e(390),{className:e(433),children:[a[e(363)](e(390),{className:e(487),children:[a[e(420)](e(390),{className:e(347)}),a[e(363)]("div",{className:e(533),children:[a.jsxs(e(390),{className:e(467),children:[a.jsx("button",{onClick:()=>i(e(366)),className:"w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all group shrink-0 active:scale-95 duration-200",title:e(334),children:a[e(420)](c0,{className:e(387)})}),a[e(363)](e(390),{className:e(271),children:[a[e(420)]("h2",{className:e(348),children:e(294)}),a[e(420)]("p",{className:e(359),children:"Individual LIR"})]})]}),a[e(420)](e(390),{className:"h-6 w-px bg-slate-200 shrink-0 mx-0.5"}),a[e(363)](e(390),{className:"relative group shrink-0",children:[a[e(363)](e(308),{className:e(528),value:f,onChange:t=>{const s=e;V(t.target[s(498)]),L(null),r("")},children:[a[e(420)](e(295),{value:"",children:e(518)}),Object[e(330)](B).map(([t,s])=>s.length>0&&a.jsx(e(550),{label:t,children:s[e(369)](c=>a.jsxs(e(295),{value:c[e(555)],children:[c[e(575)],e(590),c[e(555)]]},c.id))},t))]}),a[e(420)](W,{className:"w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors"})]}),a[e(363)]("div",{className:e(279),children:[a.jsxs(e(308),{className:"appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer min-w-[130px] lg:min-w-[145px] disabled:opacity-30 duration-200",value:m,onChange:t=>{const s=e;r(t[s(542)][s(498)]),L(null)},disabled:!f,children:[a.jsx("option",{value:"",children:e(547)}),n[e(369)](t=>a.jsx("option",{value:t.id,children:t[e(504)]},t.id))]}),a.jsx(W,{className:e(388)})]}),a[e(363)](e(390),{className:"relative group shrink-0",children:[a[e(363)](e(308),{className:e(328),value:v?.lrn||"",onChange:t=>{const s=e,c=g[s(539)](l=>l[s(396)]===t[s(542)].value)||null;L(c)},disabled:!m,children:[a[e(420)](e(295),{value:"",children:e(428)}),Q[e(483)]>0&&a.jsx(e(550),{label:e(358),children:Q[e(369)](t=>{const s=e,c=m&&(j.some(l=>l[s(471)]===t.lrn&&l[s(492)]===m&&l[s(594)]===o)||D[s(394)](l=>l[s(471)]===t[s(396)]&&l[s(492)]===m&&l[s(594)]===o));return a[s(363)](s(295),{value:t[s(396)],children:[t[s(517)],", ",t[s(501)]," ",c?"✓":""]},t[s(396)])})}),$.length>0&&a[e(420)](e(550),{label:"FEMALE",children:$[e(369)](t=>{const s=e,c=m&&(j[s(394)](l=>l[s(471)]===t.lrn&&l[s(492)]===m&&l[s(594)]===o)||D.some(l=>l[s(471)]===t.lrn&&l[s(492)]===m&&l[s(594)]===o));return a[s(363)](s(295),{value:t[s(396)],children:[t[s(517)],", ",t[s(501)]," ",c?"✓":""]},t[s(396)])})})]}),a.jsx(W,{className:"w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors"})]}),a.jsx(e(390),{className:e(378)}),a[e(363)](e(390),{className:e(279),children:[a[e(363)]("select",{value:w,onChange:t=>P(t[e(542)].value),className:"appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer min-w-[70px] lg:min-w-[80px] duration-200",title:e(600),children:[a[e(420)](e(295),{value:"a4",children:"A4"}),a.jsx(e(295),{value:"letter",children:e(450)}),a[e(420)](e(295),{value:e(268),children:"Folio"})]}),a[e(420)](W,{className:e(388)})]}),a[e(420)]("div",{className:"h-6 w-px bg-slate-200 shrink-0 mx-0.5"}),a.jsxs(e(390),{className:e(562),children:[a.jsxs("div",{className:e(549),title:e(303),children:[a[e(420)]("div",{className:e(565),style:{backgroundColor:H}}),a[e(420)](e(288),{type:e(311),value:H,onChange:t=>S(t[e(542)][e(498)]),className:e(586)})]}),a[e(363)](e(390),{className:"relative flex items-center justify-center cursor-pointer shrink-0",title:e(336),children:[a[e(420)](e(390),{className:e(565),style:{backgroundColor:I}}),a[e(420)]("input",{type:e(311),value:I,onChange:t=>G(t[e(542)][e(498)]),className:e(586)})]})]}),a[e(420)](e(390),{className:"h-6 w-px bg-slate-200 shrink-0 mx-0.5"}),a[e(363)](e(390),{className:e(532),children:[a.jsx("button",{onClick:()=>U(t=>Math[e(573)](.4,t-.1)),className:e(481),title:e(272),children:a[e(420)](o0,{className:"w-3.5 h-3.5"})}),a[e(363)](e(291),{className:e(275),children:[Math[e(418)](C*100),"%"]}),a[e(420)](e(460),{onClick:()=>U(t=>Math[e(574)](1.5,t+.1)),className:e(481),title:e(502),children:a[e(420)](d0,{className:"w-3.5 h-3.5"})})]}),a[e(420)](e(390),{className:"h-6 w-px bg-slate-200 shrink-0 mx-0.5"}),a[e(363)](e(460),{onClick:p,disabled:!v,className:e(522),children:[a[e(420)](e0,{className:"w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform"}),e(437)]})]})]}),a[e(420)](e(390),{className:e(535),children:a[e(420)](e(390),{className:"w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0",children:v?a[e(420)]("div",{className:e(456),style:{transform:e(321)+C+e(266),willChange:e(386),backfaceVisibility:"hidden",WebkitBackfaceVisibility:e(424)},children:a[e(363)]("div",{className:e(470),children:[a[e(420)](e(390),{className:e(332)}),a.jsx(e(390),{className:e(474),children:a.jsx(u0,{pageNumber:1,student:v,profile:A,schoolYear:o,subject:T?.[e(504)]||"",teacher:h,fillColor:H,outlineColor:I,gradeData:t0,attendanceData:a0,paperSize:w})})]})}):a.jsxs(e(390),{className:e(276),children:[a.jsxs(e(390),{className:e(470),children:[a.jsx(e(390),{className:e(306)}),a.jsxs(e(390),{className:e(292),children:[a[e(420)](h0,{className:e(346)}),a[e(363)](e(390),{className:e(439),children:[a[e(420)](e(291),{className:e(530),children:e(305)}),a[e(420)](e(390),{className:e(353)})]}),a[e(420)](e(390),{className:e(461),children:a[e(420)](e0,{className:e(526)})})]})]}),a[e(363)](e(390),{className:e(581),children:[a[e(420)]("h2",{className:e(309),children:e(540)}),a[e(420)]("p",{className:e(591),children:e(284)})]})]})})}),a.jsx(e(462),{children:e(382)+(w==="a4"?e(278):w===e(339)?"8.5in 11in":e(561))+`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `+(w==="a4"?e(345):"8.5in")+e(401)+(w==="a4"?e(507):w===e(339)?e(485):e(441))+` !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `+e(w==="a4"?345:333)+` !important;
                        height: `+(w==="a4"?e(507):w===e(339)?"11in":e(441))+e(514)+e(w==="a4"?345:333)+` !important;
                        height: `+(w==="a4"?e(507):w==="letter"?"11in":e(441))+e(400)})]})}function X(){const e=[`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,"useEffect","w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all active:scale-90 duration-200","img","length","LIR_","11in","Start of Term 3","z-20 bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm sticky top-0 print:hidden shrink-0 w-full","deped_logo_right.png","FEBRUARY","Term 3 Exam (Non-Grad)",`px; 
                        border-right: 1px solid `,"subject_id","410uLTPWA"," TERM","info","sort","apply","value","male","gender","first_name","Zoom In","month-col uppercase","subject_name",`px; 
                        font-size: `,`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `,"297mm","40px","FIRST NAME","End-of-Term Block","FIRST","10%",`rem;
                        width: `,` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"GRADE & SECTION","date-val uppercase","last_name","Choose Section","header-green py-1","src","fixed","h-9 px-3.5 lg:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8.5px] uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200","#22c55e","__proto__","Dec 18, 2026","w-10 h-10 text-white","Opening Block: Term 1","appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[120px] lg:min-w-[135px] duration-200","33969BKJeMm","text-7xl font-black text-slate-100 tracking-tighter leading-none italic","3.32%","flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 h-9 shrink-0","flex items-center justify-start w-full h-16 select-none relative px-3 lg:px-4 gap-2 lg:gap-3 overflow-x-auto scrollbar-none",`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `,"flex-1 overflow-auto relative bg-slate-100 print:bg-white custom-scrollbar","title",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,"47176PUBFlX","find","Individual Record","photo_url","target","important-dates-header uppercase italic",`rem; 
                        font-weight: 700; 
                        height: `,"label-green py-1 border-2","uid","Select Subject","TERM EXAM","relative flex items-center justify-center cursor-pointer shrink-0","optgroup","font-bold uppercase leading-none text-center",`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"Sept 2-15, 2026","Oct 7, 2026","section_name","-11px","Term 1: Summative Test #1","important-dates-box","filter",`; 
                        padding: `,"8.5in 13in","flex gap-1.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 h-9 shrink-0 items-center px-2","table","font-bold","w-5 h-5 rounded-lg border border-slate-200 shadow-sm shrink-0",'{}.constructor("return this")( )',"female","JUNE","useState","Mar 22-23, 2027","useMemo",`;
                        padding: `,"max","min","section_grade_level",`rem; 
                        padding: `,"lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","flex items-stretch border-2 w-full overflow-hidden","attendance-table mb-3","toLowerCase","space-y-4","font-bold py-1","Dates","school-logo.png","warn","w-5 h-5 opacity-0 absolute inset-0 cursor-pointer","data-field uppercase font-bold border-2 whitespace-nowrap",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"5496hYUbTu"," - ","text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60","4660264UFJQYn","header-row-fill","school_year",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,"student_section","July 28, 2026","charAt","scores","Paper Size","2626352DmKuJH","teacher_id",") translateZ(0)",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"folio","has","Term 2: Summative Test #1","flex flex-col shrink-0","Zoom Out","Term 3: Summative Test #2","School Logo","text-[9px] font-black text-slate-900 w-8 text-center tabular-nums","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10","flex gap-4 items-start w-full mt-2","210mm 297mm","relative group shrink-0","Term 3: Summative Test #1","Total Abs.","inherit","row-label","Select a learner from the toolbar above to preview their individual record card.","1 X 1",`; 
                        text-align: center; 
                        font-size: `,"Mar 15-16, 2027","input","constructor",`; 
                        font-size: `,"span","relative w-64 h-64 bg-white rounded-[5rem] border border-slate-200 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl","quarterly_exam","Learner Record","option","replace","1ST","card-container-combined print:m-0 print:shadow-none",`;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"SENIOR HIGH SCHOOL","#86efac","final_grade","Choose Fill Color","dates-header-bar uppercase","LIR","absolute -inset-24 bg-emerald-500/5 blur-[120px] rounded-full",`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,"select","text-4xl font-black text-slate-900 tracking-tight uppercase","Feb 16, 2027","color",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        border: 4px solid `,"Daily Attendance","summative_tests","40%","tbody","max-w-full max-h-full object-contain","Mar 24-31, 2027","grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","date-row","scale(","term-label",`px;
                        text-align: center;
                        height: `,"Term 1 Examination","kinder","9363101nFeLVk",`rem; 
                        min-height: `,"appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[140px] lg:min-w-[160px] max-w-[200px] truncate disabled:opacity-30 duration-200","THIRD","entries","font-bold leading-tight","absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000","8.5in","Back to Hub","col-span-1","Choose Outline Color","name",`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,"letter","DECEMBER","MARCH","page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none","3GoFKOp","End of Term 2","210mm","w-28 h-28 text-slate-100","absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30","text-[11px] lg:text-[12px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1",`;
                        font-size: `,"20%","section_id","localeCompare","w-20 h-1 bg-emerald-500/10 rounded-full mt-4",`px; 
                        padding: `,`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,`px; 
                        font-weight: 700; 
                        font-size: `,"Sept 1, 2026","MALE","text-[7.5px] font-black text-emerald-600 uppercase tracking-widest leading-none",`px 0;
                        width: 100%;
                    }

                    .header-green {
                        background-color: `,"month-col","from","jsxs","NOVEMBER","End of Term 3","school-forms","half-page-section","Apr 6-7, 2027","map","Apr 1-8, 2027","console",`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `,"15%","TERM","Term 3 Exam (Graduating)","print","Term 1: Summative Test #2","h-6 w-px bg-slate-200 shrink-0 mx-0.5","SUBJECT","trace","SECOND",`
                @media print {
                    @page {
                        size: `,"1x1 Learner Photo","border-collapse border-2","border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden","transform","w-4 h-4 group-hover:-translate-x-0.5 transition-transform","w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors","written_works","div","654036bEWIkO",`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `,"LRN","some","AUGUST","lrn","Important Dates","Jan 25, 2027","label-green border-2 whitespace-nowrap",` !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                }
             `,` !important;
                        height: `,"absences-header uppercase","label-green py-1 border-2 px-1",`px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .term-label {
                        color: #ef4444;
                        background-color: `,"ELEMENTARY",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,"Oct 29, 2026",`px;
                        font-size: `,"PRODUCT/PERFORMANCE TASK (PPTs)","data-field uppercase font-bold border-2 whitespace-nowrap px-1","170109NXktFv",`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `,`44;
                        font-weight: 800;
                        font-size: `,"isArray","mb-2","font-black uppercase italic","JANUARY","round","Term 2: Summative Test #2","jsx","toString","data-field font-extrabold border-2 whitespace-nowrap","object-contain","hidden","3RD","8gUIChQ","PHOTO","Select Learner","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden","signature-box bg-white","Dec 7-18, 2026","date-label uppercase","lir-print-root flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white","OCTOBER","FINAL GRADE","col","Print / PDF",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"absolute inset-0 flex flex-col items-center justify-center","reduce","13in","APRIL","attendance","quarter","forEach","Learner's Individual Record Card","Term 2 Examination","30kyVnhj","push","Letter","rem","TEACHER","1aAwNLP",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"flex justify-between items-center w-full overflow-hidden","transition-all duration-700 ease-out origin-top print:scale-100",`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `,"JUNIOR HIGH SCHOOL","slice","button","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 group-hover:rotate-12 transition-all duration-500","style","thead","px ","Months",`; 
                        color: black !important; 
                        font-size: `,"flex items-center gap-2 lg:gap-3 shrink-0","red","BAGONG BARRIO NATIONAL HIGH SCHOOL","relative group","student_lrn","attendance-date-cell","2ND","lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none",`rem; 
                        border-bottom: 2px solid `,"bind","none","0px"];return X=function(){return e},X()}export{j0 as LIRPage};
