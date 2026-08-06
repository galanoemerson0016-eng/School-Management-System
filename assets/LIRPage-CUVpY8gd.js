import{j as a,r as h,cq as J0,bH as c0,cA as Y0,c9 as q0,be as v0,bO as _0,cc as o0,cz as V0,bs as W0,dn as K0,cB as f0,cC as j0,bE as Z0}from"./vendor-D807hmOL.js";import{b as X0,u as Q0,h as $0,n as xx}from"./index-CkojG4Jx.js";import{e as ex,p as ax}from"./pdf-export-DZe6gtiW.js";import"./vendor-pdf-libs-BVl_U1Kq.js";import"./vendor-firebase-CEUkPUSI.js";import"./vendor-framer-motion-ByrjgV2f.js";const s0=J;(function(x,y){const f=J,k=x();for(;;)try{if(-parseInt(f(597))/1*(parseInt(f(594))/2)+-parseInt(f(699))/3+-parseInt(f(613))/4+parseInt(f(402))/5*(-parseInt(f(323))/6)+parseInt(f(593))/7*(parseInt(f(421))/8)+parseInt(f(524))/9*(parseInt(f(560))/10)+parseInt(f(711))/11===y)break;k.push(k.shift())}catch{k.push(k.shift())}})(d0,899938);const l0=(function(){let x=!0;return function(y,f){const k=x?function(){const _=J;if(f){const z=f[_(605)](y,arguments);return f=null,z}}:function(){};return x=!1,k}})(),U0=l0(void 0,function(){const x=J;let y;try{y=Function(x(558)+'{}.constructor("return this")( ));')()}catch{y=window}const f=y[x(360)]=y[x(360)]||{},k=["log",x(441),x(620),x(412),x(457),x(309),"trace"];for(let _=0;_<k[x(452)];_++){const z=l0.constructor[x(337)][x(383)](l0),b=k[_],c=f[b]||z;z[x(621)]=l0.bind(l0),z[x(443)]=c.toString[x(383)](c),f[b]=z}});U0();function J(x,y){return x=x-289,d0()[x]}const S0=({pageNumber:x,student:y,profile:f,schoolYear:k,subject:_,teacher:z,fillColor:b=s0(695),outlineColor:c=s0(374),gradeData:S,paperSize:M=s0(514),attendanceData:n0={}})=>{const e=s0,W="./",N=25,i0=s=>Array.from({length:N},(p,o)=>s[o]??""),T=(s,p)=>{const o=J,j=Number(p);if(!j)return!1;const C=s.toUpperCase();return C===o(485)&&j===12||C===o(551)&&(j===21||j===31)||C==="NOVEMBER"&&(j===2||j===30)||C===o(450)&&j===8||C===o(455)&&j===1};let P=e(395),u=e(447),l=1.12,Y=1.2,q=.8,B=.75,E=5,A=.8,K=40,v=240,Z=100,X=50,U=e(518);M==="a4"?(u=e(705),P=e(410),l=1.02,Y=.85,q=.55,B=.5,E=2,A=.65,K=26,v=140,Z=80,X=40):M==="letter"?(u=e(447),P=e(445),l=.98,Y=.85,q=.55,B=.5,E=3,A=.7,K=28,v=160,Z=65,X=32,U=e(390)):M===e(514)&&(u=e(447),P=e(395),l=.98,Y=.85,q=.55,B=.5,E=3,A=.7,K=28,v=160,Z=65,X=32,U="-11px");const L=(s,p)=>{const o=e,j=(s||"")[o(344)]();return j[o(452)]>32?p*.65:j[o(452)]>24?p*.78:j[o(452)]>16?p*.88:p},F=L(_,A*l),V=L(z,A*l);return a[e(375)]("div",{className:e(704),children:a[e(426)]("div",{className:e(330),style:{width:u,height:P},children:[a[e(375)](e(691),{children:e(399)+u+" "+P+e(348)+c+e(371)+8*l+e(693)+5*l+e(321)+b+e(719)+c+e(391)+3*l+e(520)+.85*l+e(586)+b+e(493)+c+e(675)+.6*l+`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `+c+e(371)+2*l+`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `+.8*l+`rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `+.6*l+e(502)+c+e(371)+1.5*l+e(656)+24*l+e(489)+b+e(311)+.6*l+e(293)+b+e(318)+.6*l+`rem;
                        width: `+70*l+e(471)+b+e(582)+c+e(671)+K*l+e(435)+v*l+e(298)+b+e(540)+.9*l+`rem; 
                        padding: `+4*l+`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `+c+`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `+c+e(339)+c+e(659)+.5*l+`rem; 
                        font-weight: 700; 
                        height: `+21*l+e(477)+1*l+`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `+b+e(384)+.5*l+e(491)+c+` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `+b+e(559)+.9*l+e(373)+b+e(394)+.45*l+e(506)+.5*l+e(326)+c+e(503)+b+`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `+3*l+`px; 
                        font-size: `+.85*l+e(516)+c+e(364)+c+e(430)+.45*l+`rem; 
                        min-height: `+18*l+e(638)+95*l+`px; 
                        border-right: 1px solid `+c+e(561)+1.5*l+e(515)+4*l+`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `+1.5*l+e(515)+4*l+e(655)+.42*l+`rem; 
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
                `}),a[e(426)](e(618),{className:e(319),children:[a[e(426)](e(618),{className:e(640),children:[a[e(426)](e(618),{className:e(294),children:[a[e(426)](e(618),{className:e(685),children:[a[e(375)](e(618),{className:"flex items-center justify-center bg-white overflow-hidden",style:{width:64*l,height:64*l},children:a[e(375)](e(708),{src:f[e(424)]||W+"school-logo.png",alt:e(509),className:e(317),onError:s=>{const p=e;s[p(510)][p(500)]=W+p(296)}})}),a[e(426)](e(618),{children:[a[e(375)]("h1",{className:e(583),style:{fontSize:Y*l+e(427)},children:f[e(549)]||"BAGONG BARRIO NATIONAL HIGH SCHOOL"}),a.jsx("p",{className:"font-black uppercase italic",style:{fontSize:q*l+e(427),color:c},children:e(568)}),a[e(426)]("p",{className:"font-bold",style:{fontSize:B*l+e(427)},children:[e(574),a.jsx("span",{className:"font-normal ml-2",children:k})]})]})]}),a.jsx(e(618),{className:e(526),children:a[e(375)](e(309),{className:"header-subject-table border-collapse border-2",style:{borderColor:c},children:a[e(375)]("tbody",{children:a[e(426)]("tr",{children:[a.jsx("td",{className:e(570),style:{fontSize:A*l+"rem",padding:E*l+e(515)+E*2*l+"px",borderColor:c},children:"SUBJECT"}),a.jsx("td",{className:e(466),style:{fontSize:F+"rem",padding:E*l+e(515)+E*2.5*l+"px",borderColor:c},children:_}),a[e(375)]("td",{className:"label-green border-2 whitespace-nowrap",style:{fontSize:A*l+e(427),padding:E*l+e(515)+E*2*l+"px",borderColor:c},children:e(603)}),a[e(375)]("td",{className:e(466),style:{fontSize:V+e(427),padding:E*l+e(515)+E*2.5*l+"px",borderColor:c},children:z})]})})})})]}),a.jsxs("div",{className:"flex gap-4 items-start w-full mt-2",children:[a[e(375)](e(618),{className:"border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden",style:{width:1*l+"in",height:1*l+"in",borderColor:c},children:y[e(690)]?a.jsx(e(708),{src:y.photo_url,alt:e(314),className:"w-full h-full object-cover"}):a[e(426)](e(305),{className:e(454),style:{fontSize:.7*l+"rem"},children:["1 X 1",a.jsx("br",{}),e(297)]})}),a[e(375)](e(618),{className:"grow flex flex-col gap-1 overflow-hidden",children:a.jsx(e(309),{className:"student-info-table border-2",style:{borderColor:c,height:1*l+"in"},children:a.jsxs(e(636),{children:[a[e(426)]("tr",{style:{height:.5*l+"in"},children:[a[e(375)]("td",{className:e(576),style:{borderColor:c,height:.5*l+"in"},children:y[e(658)]}),a[e(375)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:c,height:.5*l+"in"},children:y.first_name}),a.jsx("td",{className:e(607),style:{width:e(425),borderColor:c,height:.5*l+"in"},children:y[e(564)]?.[e(710)](0)||""}),a[e(375)]("td",{className:e(576),style:{borderColor:c,height:.5*l+"in"},children:y[e(333)]}),a[e(375)]("td",{className:e(576),style:{borderColor:c,height:.5*l+"in"},children:y[e(601)]})]}),a.jsxs("tr",{style:{height:.5*l+"in"},children:[a.jsx("td",{className:e(608),style:{borderColor:c,height:.5*l+"in"},children:e(368)}),a[e(375)]("td",{className:e(608),style:{borderColor:c,height:.5*l+"in"},children:e(505)}),a.jsx("td",{className:"label-green py-1 border-2 px-1",style:{width:e(425),borderColor:c,height:.5*l+"in"},children:"M.I"}),a[e(375)]("td",{className:e(608),style:{borderColor:c,height:.5*l+"in"},children:e(396)}),a.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:c,height:.5*l+"in"},children:e(429)})]})]})})})]}),a.jsxs(e(618),{className:e(320),children:[a.jsxs(e(618),{children:[a[e(375)]("div",{className:e(642),style:{fontSize:.75*l+"rem"},children:e(590)}),a[e(375)](e(309),{style:{tableLayout:e(398)},children:a[e(426)]("tbody",{children:[a[e(426)]("tr",{className:e(300),children:[a[e(375)]("td",{className:"term-label",style:{width:"15%"},children:e(304)}),[1,2,3,4,5].map(s=>a[e(375)]("td",{style:{width:e(413)},children:s},s)),a[e(375)]("td",{className:e(494),style:{width:e(624)},children:e(717)})]}),[1,2,3].map(s=>a.jsxs("tr",{children:[a[e(375)]("td",{className:e(295),children:s===1?"FIRST":e(s===2?366:486)}),[...Array(5)].map((p,o)=>a[e(375)]("td",{children:S?.[s]?.[e(698)].ww[o]??""},o)),a[e(375)]("td",{className:e(494),children:S?.[s]?.[e(698)].ww.slice(0,5).reduce((p,o)=>p+(Number(o)||0),0)||""})]},s))]})})]}),a[e(426)]("div",{children:[a[e(375)](e(618),{className:e(642),style:{fontSize:.75*l+"rem"},children:e(545)}),a[e(375)]("table",{style:{tableLayout:e(398)},children:a.jsxs(e(636),{children:[a[e(426)]("tr",{className:e(300),children:[a[e(375)]("td",{className:e(716),style:{width:e(624)},children:"TERM"}),[1,2,3][e(692)](s=>a.jsx("td",{style:{width:"20%"},children:s},s)),a.jsx("td",{className:e(494),style:{width:e(624)},children:e(717)})]}),[1,2,3][e(692)](s=>a[e(426)]("tr",{children:[a[e(375)]("td",{className:e(295),children:s===1?e(634):s===2?"SECOND":e(486)}),[...Array(3)][e(692)]((p,o)=>a[e(375)]("td",{children:S?.[s]?.[e(698)].pt[o]??""},o)),a[e(375)]("td",{className:e(494),children:S?.[s]?.[e(698)].pt[e(490)](0,3).reduce((p,o)=>p+(Number(o)||0),0)||""})]},s))]})})]})]}),a.jsxs(e(618),{className:e(584),children:[a[e(426)](e(618),{className:e(440),children:[a[e(375)](e(618),{className:e(642),style:{fontSize:.7*l+e(427)},children:"SUMMATIVE TEST"}),a.jsx(e(309),{style:{tableLayout:e(398)},children:a[e(426)]("tbody",{children:[a[e(426)]("tr",{className:e(300),children:[a.jsx("td",{className:"term-label",style:{width:e(331)},children:e(304)}),[1,2].map(s=>a[e(375)]("td",{children:s},s))]}),[1,2,3][e(692)](s=>a[e(426)]("tr",{children:[a.jsx("td",{className:e(295),children:s===1?e(634):s===2?"SECOND":e(486)}),[...Array(2)][e(692)]((p,o)=>a[e(375)]("td",{children:S?.[s]?.scores.st[o]??""},o))]},s))]})})]}),a[e(375)](e(618),{className:e(440),children:a.jsxs(e(309),{style:{tableLayout:e(398)},children:[a[e(375)](e(306),{children:a.jsx("tr",{className:e(300),children:a[e(375)]("td",{colSpan:2,className:"font-bold py-1",style:{fontSize:.7*l+e(427)},children:e(377)})})}),a[e(375)](e(636),{children:[1,2,3].map(s=>a[e(426)]("tr",{children:[a.jsxs("td",{className:e(404),style:{borderColor:c},children:[s===1?"1ST":s===2?"2ND":e(474),e(405)]}),a[e(375)]("td",{className:e(494),children:S?.[s]?.[e(698)].te||""})]},s))})]})}),a[e(375)](e(618),{className:e(440),children:a[e(426)](e(309),{style:{tableLayout:e(398)},children:[a[e(375)](e(306),{children:a[e(375)]("tr",{className:e(300),children:a.jsx("td",{colSpan:2,className:"font-bold py-1",style:{fontSize:.7*l+e(427)},children:e(507)})})}),a[e(375)](e(636),{children:[1,2,3][e(692)](s=>a[e(426)]("tr",{children:[a[e(426)]("td",{className:e(404),style:{borderColor:c},children:[s===1?"1ST":e(s===2?352:474),e(405)]}),a[e(375)]("td",{className:e(494),children:S?.[s]?.[e(444)]||""})]},s))}),a[e(375)]("tfoot",{children:a.jsx("tr",{style:{height:1.5*l+"px"},children:a.jsx("td",{colSpan:2,style:{border:"none"}})})})]})}),a[e(426)](e(618),{className:e(663),style:{marginTop:U},children:[a[e(375)](e(618),{className:"mb-2",children:a[e(375)](e(708),{src:W+e(635),alt:e(459),className:"object-contain",style:{width:Z*l,height:X*l}})}),a[e(375)](e(618),{className:e(387)}),a[e(375)]("p",{className:e(633),style:{fontSize:.6*l+e(427),marginTop:14*l+"px"},children:e(587)})]})]})]}),a[e(426)](e(618),{className:"half-page-section border-t-4",style:{borderColor:c},children:[a[e(375)](e(618),{className:e(650),children:e(600)}),a[e(426)](e(309),{className:e(532),children:[a[e(426)](e(356),{children:[a[e(375)](e(353),{style:{width:"10%"}}),Array[e(632)]({length:N})[e(692)]((s,p)=>a[e(375)]("col",{style:{width:e(408)}},p)),a[e(375)](e(353),{style:{width:"7%"}})]}),a[e(375)](e(306),{children:a[e(426)]("tr",{children:[a.jsx("th",{className:e(648),children:e(469)}),a.jsx("th",{colSpan:N,className:e(315),children:"Dates"}),a[e(375)]("th",{className:"absences-header uppercase",children:e(528)})]})}),a.jsx("tbody",{children:[{name:e(485),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:e(301),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:e(551),dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:e(577),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:"OCTOBER",dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:e(670),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:e(450),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:e(455),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:e(359),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:e(458),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:e(511),dates:[1,2,5,6,7,8]}][e(692)](s=>a[e(426)]("tr",{children:[a[e(375)]("td",{className:e(538),children:s[e(549)]}),i0(s[e(411)])[e(692)]((p,o)=>a[e(375)]("td",{className:e(531),style:{color:T(s[e(549)],p)?e(681):e(713)},children:p},o)),a[e(375)]("td",{className:e(494),children:n0[s[e(549)]]||""})]},s[e(549)]))})]}),a[e(426)](e(618),{className:"flex items-stretch border-2 w-full overflow-hidden",style:{borderColor:c},children:[a[e(426)]("div",{className:"important-dates-box",children:[a[e(375)]("div",{className:e(512),children:e(612)}),[[e(625),e(720)],["July 6, 2026",e(527)],[e(712),e(484)],["Aug 28, 2026",e(376)],[e(641),"Term 1 Examination"],[e(682),e(302)],[e(678),e(370)]][e(692)](([s,p])=>a[e(426)](e(618),{className:e(599),children:[a[e(375)]("div",{className:"date-val uppercase",children:s}),a[e(375)]("div",{className:"date-label uppercase",children:p})]},s))]}),a.jsxs(e(618),{className:e(403),children:[a[e(375)](e(618),{className:e(512),children:e(612)}),[["Oct 7, 2026",e(400)],["Oct 29, 2026",e(660)],[e(595),"Term 2 Examination"],[e(626),e(302)],["Dec 18, 2026","End of Term 2"],["Jan 4, 2027",e(358)],[e(325),e(714)]][e(692)](([s,p])=>a[e(426)](e(618),{className:"date-row",children:[a[e(375)]("div",{className:"date-val uppercase",children:s}),a[e(375)](e(618),{className:e(488),children:p})]},s))]}),a[e(426)](e(618),{className:"important-dates-box",children:[a[e(375)](e(618),{className:e(512),children:e(612)}),[[e(646),e(290)],[e(479),e(676)],[e(703),e(481)],[e(446),e(302)],[e(363),e(302)],[e(696),e(465)],[e(592),e(407)]][e(692)](([s,p])=>a.jsxs(e(618),{className:"date-row",children:[a[e(375)](e(618),{className:e(689),children:s}),a[e(375)]("div",{className:e(488),children:p})]},s))]})]})]})]})]})})};function ox(){const x=s0,{students:y,sections:f,subjects:k,teachers:_,schoolProfile:z,activeSchoolYear:b,setCurrentView:c,classRecords:S,gradingSheetRecords:M,hpsRecords:n0,sf2Sheets:e}=X0(),{user:W}=Q0(),[N,i0]=h.useState(""),[T,P]=h[x(346)](null),[u,l]=h.useState(""),[Y,q]=h.useState(1),[B,E]=h[x(346)](x(695)),[A,K]=h[x(346)]("#22c55e"),[v,Z]=h.useState(x(514)),[X,U]=h[x(346)](!1),[L,F]=h[x(346)](new Set),[V,s]=h[x(346)](""),[p,o]=h.useState(!1),[j,C]=h[x(346)](0),[T0,Q]=h[x(346)](""),D=h.useMemo(()=>{const t=x;return f[t(291)](r=>r[t(567)]===N||r.id===N)},[f,N]),O=h[x(448)](()=>{const t=x;return k.find(r=>r.id===u||r[t(616)]===u)},[k,u]),E0=h[x(448)](()=>{if(!D)return[];const t=$0(W,D,k),r=new Set;return t.filter(n=>{const i=J,d=xx(n[i(616)]);return r.has(d)?!1:(r[i(439)](d),!0)})},[D,k,W]),u0=h[x(448)](()=>{const t=x;if(O?.[t(563)]){const r=_[t(291)](n=>n[t(541)]===O[t(563)]||n.id===O[t(563)]);if(r)return r[t(701)]||r[t(549)]}return D?.[t(521)]||""},[O,_,D]),a0=h.useMemo(()=>{const t=x;return[...f][t(619)]((r,n)=>{const i=t,d=(r[i(422)]||"").localeCompare(n.section_grade_level||"",void 0,{numeric:!0});return d!==0?d:(r[i(567)]||"").localeCompare(n[i(567)]||"")})},[f]),R0=h[x(448)](()=>{const t=x,r={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return a0[t(381)](n=>{const i=t,d=(n[i(422)]||"").toLowerCase(),g=parseInt(d[i(661)](/\D/g,""))||0;d.includes(i(680))||g>=1&&g<=6?r[i(571)][i(530)](n):g>=7&&g<=10?r[i(555)][i(530)](n):g>=11&&g<=12&&r[i(442)][i(530)](n)}),r},[a0]);h[x(707)](()=>{if(!N&&a0.length===1){const t=setTimeout(()=>{const r=J;i0(a0[0][r(567)])},0);return()=>clearTimeout(t)}},[a0,N]),h[x(707)](()=>{const t=setTimeout(()=>{l(""),P(null),F(new Set)},0);return()=>clearTimeout(t)},[N]);const R=h[x(448)](()=>{const t=x;if(!N)return[];const r=f[t(291)](n=>n[t(567)]===N||n.id===N)?.id;return y[t(388)](n=>n[t(333)]===N||r&&n[t(333)]===r)},[y,N,f]),$=h[x(448)](()=>R[x(388)](t=>(t[x(683)]||"")[x(529)]()===x(542))[x(619)]((t,r)=>(t[x(658)]+", "+t[x(550)])[x(460)](r[x(658)]+", "+r[x(550)])),[R]),x0=h[x(448)](()=>R.filter(t=>(t[x(683)]||"").toLowerCase()!==x(542))[x(619)]((t,r)=>(t[x(658)]+", "+t.first_name)[x(460)](r[x(658)]+", "+r[x(550)])),[R]),I0=()=>{const t=x;L[t(416)]===0&&R.length>0&&F(new Set(R[t(692)](r=>r.lrn))),U(!0)},h0=h[x(694)](t=>{const r=x;if(!t)return{};const n={};return e[r(388)](d=>d[r(622)]===b&&(d[r(349)]===D?.id||d.section_id===N)).forEach(d=>{const g=r,m=d[g(645)]?.[t[g(601)]];if(m){const I=Object[g(697)](m)[g(388)](H=>H?.[g(529)]()===g(522))[g(452)];I>0&&(n[d[g(684)][g(629)]()]=I)}}),n},[e,b,D,N]),b0=h[x(694)]((t,r,n)=>{const i=x;if(!t||!r)return;const d={};return[1,2,3][i(381)](g=>{const m=i,I=S[m(291)](w=>w[m(672)]===t[m(601)]&&w[m(622)]===b&&Number(w[m(718)])===g&&(w.subject_id===n?.id||w.subject_id===r))||M.find(w=>w[m(672)]===t[m(601)]&&w[m(622)]===b&&Number(w.quarter)===g&&(w[m(662)]===n?.id||w.subject_id===r)),H=n0.find(w=>(w[m(662)]===n?.id||w[m(662)]===r)&&w[m(622)]===b&&Number(w[m(718)])===g),e0=(w,F0)=>{const k0=m,H0=Array[k0(354)](w)?w:[];return Array[k0(632)]({length:F0},(tx,G0)=>H0[G0]??"")},P0=I,B0=H,G=w=>w===""||w===null||w===void 0?"":w;d[g]={scores:{ww:e0(I?.[m(456)],10)[m(692)](G),pt:e0(I?.[m(385)],10)[m(692)](G),st:e0(P0?.[m(379)],5).map(G),te:G(I?.quarterly_exam??"")},hps:{ww:e0(H?.written_works,10)[m(692)](G),pt:e0(H?.[m(385)],10)[m(692)](G),st:e0(B0?.summative_tests,5)[m(692)](G),te:G(H?.[m(643)]??"")},finalGrade:G(I?.[m(547)]??"")}}),d},[S,M,n0,b]),z0=h[x(448)](()=>h0(T),[T,h0]),A0=h.useMemo(()=>b0(T,u,O),[T,u,O,b0]),g0=h[x(448)](()=>[...$,...x0],[$,x0]),t0=h[x(448)](()=>{const t=x;return g0[t(388)](r=>L.has(r[t(601)]))},[g0,L]),r0=h[x(448)](()=>{const t=x;if(!V[t(344)]())return R;const r=V.toLowerCase();return R[t(388)](n=>n[t(658)][t(529)]()[t(517)](r)||n[t(550)][t(529)]().includes(r)||n.lrn[t(517)](r))},[R,V]),m0=h[x(448)](()=>r0[x(388)](t=>(t.gender||"")[x(529)]()==="male"),[r0]),p0=h[x(448)](()=>r0[x(388)](t=>(t[x(683)]||"")[x(529)]()===x(565)),[r0]),L0=()=>{const t=x;if(!T)return;const r=document[t(461)],n=(T[t(658)]+"_"+T[t(550)])[t(661)](/[^a-z0-9]/gi,"_");document[t(461)]=t(673)+n+"_"+b,window[t(406)](),setTimeout(()=>{document.title=r},1e3)},w0=async()=>{const t=x;if(t0[t(452)]!==0){o(!0),C(10),Q(t(419));try{await new Promise(i=>setTimeout(i,400));const r=document.getElementById(t(631)),n=r?Array[t(632)](r[t(610)](t(350))):[];if(n[t(452)]===0){alert(t(581)),o(!1);return}C(50),Q(t(700)+n[t(452)]+t(308)),await ax({elements:n,paperSize:v,orientation:t(715),title:t(313)+(D?.[t(567)]||t(355))+"_"+(O?.[t(616)]||"Subject")}),C(100),Q("Bulk print stream launched successfully."),setTimeout(()=>{o(!1),U(!1)},600)}catch(r){console.error("Bulk print error:",r),alert(t(423)),o(!1)}}},N0=async()=>{const t=x;if(t0[t(452)]!==0){o(!0),C(5),Q(t(328));try{await new Promise(I=>setTimeout(I,400));const r=document[t(417)](t(631)),n=r?Array[t(632)](r.querySelectorAll(t(350))):[];if(n.length===0){alert(t(566)),o(!1);return}const i=(D?.[t(567)]||N||"Section")[t(661)](/[^a-z0-9]/gi,"_"),d=(O?.[t(616)]||t(611))[t(661)](/[^a-z0-9]/gi,"_"),g=t(673)+i+"_"+d+"_"+b,m=await ex({elements:n,filename:g,paperSize:v,orientation:"portrait",title:g,onProgressChange:I=>{const H=t;C(I),Q(H(464)+I+H(382))}});m[t(536)]?(C(100),Q(t(578)),setTimeout(()=>{o(!1),U(!1)},800)):(m[t(543)]||alert(t(341)+(m[t(412)]||t(332))),o(!1))}catch(r){console[t(412)]("Bulk PDF download error:",r),alert(t(706)),o(!1)}}},y0=t=>{F(r=>{const n=J,i=new Set(r);return i.has(t)?i[n(644)](t):i[n(439)](t),i})},C0=()=>{const t=x;F(new Set(R.map(r=>r[t(601)])))},O0=()=>{const t=x;F(new Set($[t(692)](r=>r[t(601)])))},D0=()=>{const t=x;F(new Set(x0[t(692)](r=>r[t(601)])))},M0=()=>{F(new Set)};return a[x(426)]("div",{className:x(575),children:[a.jsxs(x(618),{className:x(487),children:[a[x(375)]("div",{className:x(647)}),a[x(426)](x(618),{className:x(657),children:[a[x(426)](x(618),{className:x(468),children:[a[x(375)](x(386),{onClick:()=>c("school-forms"),className:x(433),title:x(432),children:a[x(375)](J0,{className:x(324)})}),a[x(426)]("div",{className:x(721),children:[a.jsx("h2",{className:x(498),children:"Learner Record"}),a.jsx("p",{className:x(449),children:x(556)})]})]}),a[x(375)](x(618),{className:x(639)}),a[x(426)](x(618),{className:"relative group min-w-0 flex-1",children:[a.jsxs(x(589),{className:x(438),value:N,onChange:t=>{const r=x;i0(t.target[r(289)]),P(null),l("")},children:[a[x(375)](x(562),{value:"",children:"Choose Section"}),Object[x(307)](R0).map(([t,r])=>r[x(452)]>0&&a[x(375)](x(557),{label:t,children:r[x(692)](n=>a[x(426)](x(562),{value:n[x(567)],children:[n[x(422)],x(437),n[x(567)]]},n.id))},t))]}),a.jsx(c0,{className:x(322)})]}),a[x(426)](x(618),{className:"relative group min-w-0 flex-1",children:[a[x(426)]("select",{className:x(501),value:u,onChange:t=>{const r=x;l(t.target[r(289)]),P(null)},disabled:!N,children:[a[x(375)]("option",{value:"",children:x(483)}),E0.map(t=>a[x(375)](x(562),{value:t.id,children:t[x(616)]},t.id))]}),a[x(375)](c0,{className:x(322)})]}),a[x(426)](x(618),{className:"relative group min-w-0 flex-1",children:[a[x(426)](x(589),{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200",value:T?.lrn||"",onChange:t=>{const r=x,n=y.find(i=>i[r(601)]===t[r(510)][r(289)])||null;P(n)},disabled:!u,children:[a.jsx(x(562),{value:"",children:x(623)}),$.length>0&&a[x(375)](x(557),{label:x(473),children:$[x(692)](t=>{const r=x,n=u&&(S[r(591)](i=>i[r(672)]===t[r(601)]&&i[r(662)]===u&&i[r(622)]===b)||M[r(591)](i=>i[r(672)]===t.lrn&&i[r(662)]===u&&i.school_year===b));return a.jsxs("option",{value:t[r(601)],children:[t[r(658)],", ",t[r(550)]," ",n?"✓":""]},t[r(601)])})}),x0[x(452)]>0&&a[x(375)](x(557),{label:x(572),children:x0[x(692)](t=>{const r=x,n=u&&(S.some(i=>i.student_lrn===t.lrn&&i[r(662)]===u&&i.school_year===b)||M.some(i=>i[r(672)]===t.lrn&&i[r(662)]===u&&i[r(622)]===b));return a[r(426)](r(562),{value:t[r(601)],children:[t[r(658)],", ",t[r(550)]," ",n?"✓":""]},t[r(601)])})})]}),a[x(375)](c0,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),a.jsx(x(618),{className:x(639)}),a[x(426)](x(618),{className:x(316),children:[a.jsxs(x(589),{value:v,onChange:t=>Z(t[x(510)][x(289)]),className:x(299),title:"Paper Size",children:[a.jsx(x(562),{value:"a4",children:"A4"}),a[x(375)]("option",{value:x(508),children:x(544)}),a.jsx(x(562),{value:x(514),children:x(535)})]}),a[x(375)](c0,{className:x(322)})]}),a.jsxs(x(618),{className:x(628),children:[a[x(426)](x(618),{className:x(602),title:x(604),children:[a[x(375)](x(618),{className:x(609),style:{backgroundColor:B,width:18,height:18}}),a.jsx(x(573),{type:x(606),value:B,onChange:t=>E(t[x(510)].value),className:x(434)})]}),a.jsxs(x(618),{className:x(602),title:x(343),children:[a[x(375)](x(618),{className:x(609),style:{backgroundColor:A,width:18,height:18}}),a[x(375)](x(573),{type:x(606),value:A,onChange:t=>K(t[x(510)][x(289)]),className:"w-full h-full opacity-0 absolute inset-0 cursor-pointer"})]})]}),a[x(426)](x(618),{className:"flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0",children:[a[x(375)]("button",{onClick:()=>q(t=>Math.max(.4,t-.1)),className:x(495),title:x(361),children:a[x(375)](Y0,{className:x(519)})}),a[x(426)](x(305),{className:"text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums",children:[Math[x(389)](Y*100),"%"]}),a.jsx(x(386),{onClick:()=>q(t=>Math[x(666)](1.5,t+.1)),className:x(495),title:x(480),children:a[x(375)](q0,{className:x(519)})})]}),a[x(426)](x(386),{onClick:I0,disabled:!N||!u||R[x(452)]===0,className:x(653),title:"Filter / Select Learners",children:[a[x(375)](v0,{className:x(472)}),"Select (",L.size,")"]}),a.jsxs("button",{onClick:N0,disabled:!N||!u||t0.length===0,className:"h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(401),children:[a.jsx(_0,{className:x(709)}),x(351)]}),a[x(426)](x(386),{onClick:w0,disabled:!N||!u||t0[x(452)]===0,className:x(292),title:x(499),children:[a.jsx(o0,{className:"w-3 h-3 group-hover:scale-110 transition-transform"}),x(525)]}),a[x(426)]("button",{onClick:L0,disabled:!T,className:"h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(665),children:[a[x(375)](o0,{className:"w-3 h-3 group-hover:translate-y-0.5 transition-transform"}),x(569)]})]})]}),a[x(375)](x(618),{className:x(615),children:a.jsx(x(618),{className:"w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0",children:T?a[x(375)](x(618),{className:x(312),style:{transform:x(327)+Y+x(310),willChange:x(687),backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden"},children:a[x(426)](x(618),{className:"relative group",children:[a[x(375)](x(618),{className:"absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000"}),a[x(375)](x(618),{className:"lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none",children:a[x(375)](S0,{pageNumber:1,student:T,profile:z,schoolYear:b,subject:O?.[x(616)]||"",teacher:u0,fillColor:B,outlineColor:A,gradeData:A0,attendanceData:z0,paperSize:v})})]})}):a[x(426)](x(618),{className:x(649),children:[a[x(426)](x(618),{className:x(722),children:[a[x(375)](x(618),{className:"absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full"}),a.jsxs(x(618),{className:x(378),children:[a[x(375)](V0,{className:"w-28 h-28 text-slate-100 dark:text-slate-600"}),a[x(426)](x(618),{className:"absolute inset-0 flex flex-col items-center justify-center",children:[a[x(375)]("span",{className:x(470),children:"LIR"}),a[x(375)](x(618),{className:"w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4"})]}),a[x(375)]("div",{className:"absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500",children:a[x(375)](o0,{className:x(367)})})]})]}),a[x(426)](x(618),{className:x(669),children:[a.jsx("h2",{className:x(347),children:x(303)}),a[x(375)]("p",{className:x(637),children:"Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections."})]})]})})}),a[x(375)](x(618),{id:x(631),className:x(467),style:{left:x(513)},children:t0.map(t=>{const r=x,n=b0(t,u,O),i=h0(t);return a.jsx(r(618),{className:r(492),children:a[r(375)](S0,{pageNumber:1,student:t,profile:z,schoolYear:b,subject:O?.subject_name||"",teacher:u0,fillColor:B,outlineColor:A,gradeData:n,attendanceData:i,paperSize:v})},t[r(601)])})}),X&&a[x(375)](x(618),{className:x(539),children:a[x(426)](x(618),{className:x(702),children:[a[x(426)](x(618),{className:x(654),children:[a[x(426)](x(618),{className:"flex items-center gap-3",children:[a[x(375)]("div",{className:x(630),children:a[x(375)](v0,{className:"w-5 h-5"})}),a[x(426)](x(618),{children:[a[x(375)]("h3",{className:x(496),children:x(409)}),a[x(426)]("p",{className:x(580),children:[D?.[x(422)],x(437),D?.[x(567)]," | ",O?.[x(616)]]})]})]}),a.jsx("button",{onClick:()=>U(!1),className:x(362),children:a[x(375)](W0,{className:x(476)})})]}),a[x(426)](x(618),{className:x(334),children:[a.jsxs(x(618),{className:"relative flex-1 min-w-48",children:[a[x(375)](K0,{className:"w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"}),a.jsx(x(573),{type:x(420),placeholder:x(482),value:V,onChange:t=>s(t[x(510)][x(289)]),className:x(686)})]}),a.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap",children:[a.jsxs(x(386),{onClick:C0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[a.jsx(f0,{className:x(598)}),x(431),R[x(452)],")"]}),a[x(426)](x(386),{onClick:O0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[x(552),$.length,")"]}),a[x(426)](x(386),{onClick:D0,className:x(579),children:["Females (",x0.length,")"]}),a.jsx("button",{onClick:M0,className:"h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1",children:x(392)})]})]}),a[x(426)](x(618),{className:x(428),children:[m0.length>0&&a[x(426)](x(618),{className:x(588),children:[a.jsx("div",{className:"flex items-center justify-between px-1",children:a.jsxs(x(305),{className:x(523),children:["Male Learners (",m0.length,")"]})}),a[x(375)](x(618),{className:x(453),children:m0[x(692)](t=>{const r=x,n=L[r(369)](t[r(601)]),i=u&&(S[r(591)](d=>d[r(672)]===t[r(601)]&&d[r(662)]===u&&d[r(622)]===b)||M[r(591)](d=>d[r(672)]===t[r(601)]&&d[r(662)]===u&&d.school_year===b));return a[r(426)](r(618),{onClick:()=>y0(t[r(601)]),className:r(345)+(n?r(478):"bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"),children:[a[r(426)](r(618),{className:r(677),children:[n?a[r(375)](f0,{className:r(342)}):a.jsx(j0,{className:r(335)}),a[r(426)](r(618),{className:r(614),children:[a.jsxs("p",{className:r(372),children:[t[r(658)],", ",t[r(550)]," ",t[r(564)]?t[r(564)][0]+".":""]}),a[r(426)]("p",{className:r(497),children:[r(462),t.lrn]})]})]}),i&&a[r(375)](r(305),{className:r(475),children:r(533)})]},t[r(601)])})})]}),p0[x(452)]>0&&a[x(426)]("div",{className:"space-y-2",children:[a[x(375)]("div",{className:x(667),children:a[x(426)](x(305),{className:x(523),children:["Female Learners (",p0[x(452)],")"]})}),a[x(375)](x(618),{className:x(453),children:p0.map(t=>{const r=x,n=L[r(369)](t.lrn),i=u&&(S.some(d=>d[r(672)]===t[r(601)]&&d[r(662)]===u&&d[r(622)]===b)||M.some(d=>d[r(672)]===t[r(601)]&&d[r(662)]===u&&d[r(622)]===b));return a[r(426)](r(618),{onClick:()=>y0(t[r(601)]),className:r(345)+r(n?478:436),children:[a[r(426)](r(618),{className:r(677),children:[n?a[r(375)](f0,{className:r(342)}):a.jsx(j0,{className:r(335)}),a[r(426)]("div",{className:r(614),children:[a[r(426)]("p",{className:r(372),children:[t[r(658)],", ",t[r(550)]," ",t[r(564)]?t[r(564)][0]+".":""]}),a[r(426)]("p",{className:r(497),children:[r(462),t[r(601)]]})]})]}),i&&a[r(375)]("span",{className:r(475),children:r(533)})]},t[r(601)])})})]}),r0[x(452)]===0&&a[x(426)](x(618),{className:x(329),children:[x(418),V,'".']})]}),a[x(426)](x(618),{className:x(554),children:[a[x(426)](x(618),{className:"text-xs font-bold text-slate-600",children:[a[x(375)](x(305),{className:x(679),children:L.size}),x(585),R[x(452)],x(668)]}),a.jsxs(x(618),{className:x(365),children:[a[x(426)]("button",{onClick:N0,disabled:L[x(416)]===0,className:x(357),children:[a[x(375)](_0,{className:x(537)}),x(674)]}),a[x(426)]("button",{onClick:w0,disabled:L[x(416)]===0,className:x(451),children:[a[x(375)](o0,{className:"w-3.5 h-3.5"}),"Bulk Print"]})]})]})]})}),p&&a.jsx("div",{className:x(651),children:a[x(426)](x(618),{className:x(463),children:[a.jsxs(x(618),{className:x(546),children:[a[x(375)](x(618),{className:x(414)}),a.jsx(x(618),{className:"relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30",children:a[x(375)](Z0,{className:x(553)})})]}),a[x(426)](x(618),{className:x(588),children:[a[x(375)]("h3",{className:x(380),children:x(340)}),a[x(375)]("p",{className:"text-xs font-semibold text-slate-500",children:T0})]}),a[x(426)](x(618),{className:x(652),children:[a[x(375)](x(618),{className:x(397),children:a[x(375)](x(618),{className:x(664),style:{width:Math[x(534)](5,j)+"%"}})}),a[x(426)](x(618),{className:x(688),children:[a[x(375)](x(305),{children:x(504)}),a[x(426)](x(305),{children:[j,"%"]})]})]})]})}),a[x(375)](x(691),{children:x(596)+(v==="a4"?x(548):v===x(508)?x(415):x(627))+x(338)+x(v==="a4"?705:447)+x(336)+x(v==="a4"?705:447)+` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `+(v==="a4"?"210mm":"8.5in")+x(393)+(v==="a4"?x(410):v===x(508)?x(445):x(395))+x(617)})]})}function d0(){const x=["297mm","dates","error","13%","absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping","8.5in 11in","size","getElementById",'No learners found matching "',"Preparing LIR sheets for bulk printing...","text","8bDjGYs","section_grade_level","Failed to launch bulk print.","logo_url","40px","jsxs","rem","flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4","LRN",`; 
                        font-size: `,"All (","Back to Hub","w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200","w-full h-full opacity-0 absolute inset-0 cursor-pointer",`px;
                        width: `,"bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"," - ","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate","add","col-span-1","warn","SENIOR HIGH SCHOOL","toString","finalGrade","11in","Mar 24-31, 2027","8.5in","useMemo","text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none","DECEMBER","h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","length","grid grid-cols-1 sm:grid-cols-2 gap-2","font-bold leading-tight","JANUARY","written_works","exception","MARCH","DepEd Logo","localeCompare","title","LRN: ","bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6","Processing LIR PDF pages: ","EOSY Rites","data-field font-extrabold border-2 whitespace-nowrap","fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block","flex items-center gap-1.5 lg:gap-2 shrink-0","Months","text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic",`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,"w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform","MALE","3RD","px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0","w-4 h-4",`px; 
                        padding: `,"bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm","Mar 15-16, 2027","Zoom In","Term 3 Exam (Non-Grad)","Filter learners by name or LRN...","Select Subject","Term 1: Summative Test #2","JUNE","THIRD","z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full","date-label uppercase",`px;
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
                        background-color: `,"slice",`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `,"lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always",`dd;
                        border: 1px solid `,"font-bold","w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200","text-sm font-black uppercase tracking-wide text-white","text-[9px] font-medium text-slate-400","text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5","Bulk Print for selected learners","src","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate",`rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `,`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"Export Pipeline","FIRST NAME",`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,"FINAL GRADE","letter","School Logo","target","APRIL","important-dates-header uppercase italic","-9999px","folio","px ",`rem; 
                        border-bottom: 2px solid `,"includes","0px","w-3 h-3",`px;
                        font-size: `,"adviser_name","absent","text-[10px] font-black text-slate-500 uppercase tracking-widest","1022121EqrTin","Bulk Print","shrink-0 ml-auto","Term 1: Summative Test #1","Total Abs.","toLowerCase","push","attendance-date-cell","attendance-table mb-3","✓ Grades","max","Folio","success","w-3.5 h-3.5","month-col","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200",`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,"uid","male","cancelled","Letter","PRODUCT/PERFORMANCE TASK (PPTs)","relative w-16 h-16 mx-auto flex items-center justify-center","final_grade","210mm 297mm","name","first_name","AUGUST","Males (","w-8 h-8 animate-spin","p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0","JUNIOR HIGH SCHOOL","Individual LIR","optgroup","return (function() ",`; 
                        color: black !important; 
                        font-size: `,"40XCLexI",`; 
                        padding: `,"option","teacher_id","middle_name","female","No sheets ready for PDF export.","section_name","Learner's Individual Record Card","Print Single","label-green border-2 whitespace-nowrap","ELEMENTARY","FEMALE","input","School Year: ","lir-print-root flex flex-col h-full bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white","data-field uppercase font-bold border-2 whitespace-nowrap","SEPTEMBER","PDF download complete!","h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1","text-[10px] text-slate-400 font-semibold uppercase tracking-widest","No sheets ready for printing. Please try again.",`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,"font-extrabold uppercase whitespace-nowrap","grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden"," of ",`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `,"Teacher's Signature","space-y-2","select","WRITTEN /ORAL WORKS (WWs)","some","Apr 8, 2027","9272389zpHxKH","4156ZfdaeD","Dec 3-4, 2026",`
                @media print {
                    @page {
                        size: `,"217kmYzyB","w-3 h-3 text-indigo-600","date-row","Daily Attendance","lrn","relative flex items-center justify-center cursor-pointer shrink-0","TEACHER","Choose Fill Color","apply","color","data-field uppercase font-bold border-2 whitespace-nowrap px-1","label-green py-1 border-2","w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0","querySelectorAll","Subject","Important Dates","436348VhNcpm","truncate","flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar","subject_name",` !important;
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
             `,"div","sort","info","__proto__","school_year","Select Learner","20%","June 8-11, 2026","Dec 7-18, 2026","8.5in 13in","flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5","toUpperCase","w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400","lir-bulk-render-container","from","font-bold uppercase leading-none text-center","FIRST","deped_logo_right.png","tbody","text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0","half-page-section","Sept 1, 2026","header-green py-1","quarterly_exam","delete","attendance","Feb 16, 2027","absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30","month-col uppercase","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10","lir-title-bar-custom mb-3 uppercase tracking-widest","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200","space-y-1.5","ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0",`px; 
                        font-weight: 700; 
                        font-size: `,`px;
                        text-align: center;
                        height: `,"flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden","last_name",`; 
                        text-align: center; 
                        font-size: `,"Term 2: Summative Test #2","replace","subject_id","col-span-1 flex flex-col items-center justify-center pt-1","h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300","Print single active learner","min","flex items-center justify-between px-1"," learners selected","space-y-4","NOVEMBER",`;
                        border-radius: 8px;
                        height: `,"student_lrn","LIR_","Download PDF",`;
                        color: #000000 !important;
                        font-size: `,"Term 3 Exam (Graduating)","flex items-center gap-2.5 min-w-0","Sept 16, 2026","text-indigo-600 font-black","kinder","red","Sept 2-15, 2026","gender","month","flex items-center gap-4 shrink-0","w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500","transform","flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider","date-val uppercase","photo_url","style","map",`px;
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
                        padding: `,"useCallback","#86efac","Apr 6-7, 2027","values","scores","1968762NJrAdn","Opening print stream for ","displayName","bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]","Mar 22-23, 2027","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","210mm","Failed to generate PDF download.","useEffect","img","w-3 h-3 group-hover:-translate-y-0.5 transition-transform","charAt","10740510HuOqNg","July 28, 2026","inherit","Term 3: Summative Test #1","portrait","term-label","TOTAL","quarter",`;
                        border: 1px solid `,"Opening Block: Term 1","flex flex-col shrink-0","relative group","value","Term 3: Summative Test #2","find","h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",`rem;
                    }

                    .row-label {
                        background-color: `,"flex justify-between items-center w-full overflow-hidden","row-label","school-logo.png","PHOTO",`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200","header-row-fill","JULY","End-of-Term Block","Individual Record","TERM","span","thead","entries"," learners...","table",") translateZ(0)",`44;
                        font-weight: 800;
                        font-size: `,"transition-all duration-700 ease-out origin-top print:scale-100","Bulk_LIR_","1x1 Learner Photo","dates-header-bar uppercase","relative group shrink-0","max-w-full max-h-full object-contain",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"card-container-combined print:m-0 print:shadow-none","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden",`px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: `,"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors","738DPWlJT","w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform","Jan 25, 2027",`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `,"scale(","Initializing vector PDF export pipeline...","p-8 text-center text-slate-400 text-xs font-medium","page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none","40%","Unknown error","student_section","p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0","w-4 h-4 text-slate-300 shrink-0",` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `,"prototype",`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `,`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,"Processing LIR Records","Export failed: ","w-4 h-4 text-indigo-600 shrink-0","Choose Outline Color","trim","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ","useState","text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid `,"section_id",".lir-bulk-sheet","Bulk PDF","2ND","col","isArray","Section","colgroup","h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","Start of Term 3","FEBRUARY","console","Zoom Out","w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors","Apr 1-8, 2027",`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `,"flex items-center gap-2","SECOND","w-10 h-10 text-white","LAST NAME","has","Start of Term 2",`;
                        padding: `,"text-xs font-bold text-slate-800 truncate",`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"#22c55e","jsx","Term 1 Examination","TERM EXAM","relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl","summative_tests","text-lg font-black text-slate-900 tracking-tight uppercase","forEach","% complete...","bind",`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,"performance_tasks","button","signature-box bg-white","filter","round","-11px",`;
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"Clear",` !important;
                        height: `,`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `,"13in","GRADE & SECTION","h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200","fixed",`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"Term 2: Summative Test #1","Bulk Download PDF for selected learners","25980oqiliK","important-dates-box","row-label py-1 px-1 border-2"," TERM","print","End of Term 3","3.32%","Bulk LIR Operations"];return d0=function(){return x},d0()}export{ox as LIRPage};
