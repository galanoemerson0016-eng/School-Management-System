import{j as a,r as b,cq as J0,bH as i0,cA as Y0,c9 as K0,be as v0,bN as _0,cc as c0,cz as q0,br as V0,dk as Z0,cB as f0,cC as k0,bE as W0}from"./vendor-4CUCBNS3.js";import{b as X0,u as Q0,h as $0,n as xx}from"./index-C_Oz-meO.js";import{e as ex,p as ax}from"./pdf-export-DWU7n-YQ.js";import"./vendor-pdf-libs-B7pIjGAa.js";import"./vendor-firebase-DHW4GZTb.js";import"./vendor-framer-motion-kqy7ILiZ.js";const o0=J;(function(x,y){const u=J,v=x();for(;;)try{if(-parseInt(u(502))/1+parseInt(u(186))/2+parseInt(u(148))/3+parseInt(u(106))/4+-parseInt(u(388))/5*(-parseInt(u(491))/6)+parseInt(u(317))/7*(-parseInt(u(372))/8)+parseInt(u(302))/9*(parseInt(u(162))/10)===y)break;v.push(v.shift())}catch{v.push(v.shift())}})(d0,477137);const s0=(function(){let x=!0;return function(y,u){const v=x?function(){const j=J;if(u){const A=u[j(341)](y,arguments);return u=null,A}}:function(){};return x=!1,v}})(),G0=s0(void 0,function(){const x=J;let y;try{y=Function(x(516)+x(232)+");")()}catch{y=window}const u=y[x(512)]=y.console||{},v=["log",x(255),x(445),x(527),x(520),"table",x(289)];for(let j=0;j<v.length;j++){const A=s0[x(391)][x(153)].bind(s0),m=v[j],c=u[m]||A;A[x(356)]=s0.bind(s0),A[x(379)]=c[x(379)][x(141)](c),u[m]=A}});G0();const j0=({pageNumber:x,student:y,profile:u,schoolYear:v,subject:j,teacher:A,fillColor:m=o0(281),outlineColor:c=o0(235),gradeData:S,paperSize:M="folio",attendanceData:l0={}})=>{const e=o0,V="./",w=25,n0=n=>Array[J(493)]({length:w},(o,k)=>n[k]??""),T=(n,p)=>{const o=J,k=Number(p);if(!k)return!1;const C=n.toUpperCase();return C==="JUNE"&&k===12||C===o(463)&&(k===21||k===31)||C===o(292)&&(k===2||k===30)||C===o(362)&&k===8||C===o(314)&&k===1};let P=e(357),f=e(293),s=1.12,Y=1.2,K=.8,B=.75,E=5,L=.8,Z=40,_=240,W=100,X=50,G=e(284);M==="a4"?(f=e(243),P=e(366),s=1.02,Y=.85,K=.55,B=.5,E=2,L=.65,Z=26,_=140,W=80,X=40):M===e(167)?(f=e(293),P=e(346),s=.98,Y=.85,K=.55,B=.5,E=3,L=.7,Z=28,_=160,W=65,X=32,G=e(218)):M===e(198)&&(f=e(293),P=e(357),s=.98,Y=.85,K=.55,B=.5,E=3,L=.7,Z=28,_=160,W=65,X=32,G="-11px");const z=(n,p)=>{const o=e,k=(n||"")[o(466)]();return k[o(316)]>32?p*.65:k[o(316)]>24?p*.78:k[o(316)]>16?p*.88:p},F=z(j,L*s),q=z(A,L*s);return a[e(377)](e(392),{className:e(105),children:a.jsxs(e(392),{className:e(132),style:{width:f,height:P},children:[a[e(377)](e(159),{children:`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `+f+" "+P+`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        border: 4px solid `+c+e(393)+8*s+e(242)+5*s+e(287)+m+e(241)+c+e(336)+3*s+`px;
                        font-size: `+.85*s+e(304)+m+e(436)+c+e(409)+.6*s+e(155)+c+e(393)+2*s+`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `+.8*s+e(439)+.6*s+e(283)+c+e(393)+1.5*s+e(276)+24*s+e(451)+m+e(296)+.6*s+e(501)+m+`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `+.6*s+e(338)+70*s+e(147)+m+`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `+c+e(490)+Z*s+`px;
                        width: `+_*s+`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `+m+`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `+.9*s+e(401)+4*s+`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `+c+`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `+c+e(278)+c+e(428)+.5*s+`rem; 
                        font-weight: 700; 
                        height: `+21*s+e(201)+1*s+e(450)+m+e(360)+.5*s+`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `+c+e(386)+m+e(250)+.9*s+e(206)+m+e(188)+.45*s+e(305)+.5*s+`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `+c+e(514)+m+e(408)+3*s+e(329)+.85*s+e(340)+c+`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `+c+`; 
                        font-size: `+.45*s+e(456)+18*s+`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `+95*s+e(505)+c+e(427)+1.5*s+e(138)+4*s+e(412)+1.5*s+e(138)+4*s+`px; 
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
                `}),a.jsxs(e(392),{className:e(154),children:[a[e(334)](e(392),{className:e(143),children:[a.jsxs(e(392),{className:e(352),children:[a[e(334)](e(392),{className:e(123),children:[a.jsx(e(392),{className:e(325),style:{width:64*s,height:64*s},children:a[e(377)](e(193),{src:u[e(440)]||V+e(327),alt:e(499),className:e(275),onError:n=>{const p=e;n[p(402)][p(131)]=V+p(327)}})}),a.jsxs(e(392),{children:[a[e(377)]("h1",{className:e(485),style:{fontSize:Y*s+e(344)},children:u[e(442)]||e(231)}),a.jsx("p",{className:"font-black uppercase italic",style:{fontSize:K*s+e(344),color:c},children:e(117)}),a.jsxs("p",{className:"font-bold",style:{fontSize:B*s+e(344)},children:[e(219),a[e(377)]("span",{className:e(471),children:v})]})]})]}),a[e(377)](e(392),{className:e(479),children:a[e(377)](e(432),{className:e(134),style:{borderColor:c},children:a.jsx(e(333),{children:a[e(334)]("tr",{children:[a[e(377)]("td",{className:e(403),style:{fontSize:L*s+"rem",padding:E*s+e(138)+E*2*s+"px",borderColor:c},children:"SUBJECT"}),a.jsx("td",{className:e(247),style:{fontSize:F+"rem",padding:E*s+e(138)+E*2.5*s+"px",borderColor:c},children:j}),a[e(377)]("td",{className:"label-green border-2 whitespace-nowrap",style:{fontSize:L*s+e(344),padding:E*s+"px "+E*2*s+"px",borderColor:c},children:e(118)}),a[e(377)]("td",{className:e(247),style:{fontSize:q+e(344),padding:E*s+e(138)+E*2.5*s+"px",borderColor:c},children:A})]})})})})]}),a.jsxs(e(392),{className:"flex gap-4 items-start w-full mt-2",children:[a[e(377)]("div",{className:e(506),style:{width:1*s+"in",height:1*s+"in",borderColor:c},children:y.photo_url?a.jsx(e(193),{src:y[e(424)],alt:e(387),className:"w-full h-full object-cover"}):a[e(334)](e(313),{className:e(260),style:{fontSize:.7*s+e(344)},children:["1 X 1",a.jsx("br",{}),"PHOTO"]})}),a[e(377)]("div",{className:e(263),children:a[e(377)](e(432),{className:"student-info-table border-2",style:{borderColor:c,height:1*s+"in"},children:a[e(334)]("tbody",{children:[a[e(334)]("tr",{style:{height:.5*s+"in"},children:[a[e(377)]("td",{className:e(191),style:{borderColor:c,height:.5*s+"in"},children:y[e(181)]}),a[e(377)]("td",{className:e(191),style:{borderColor:c,height:.5*s+"in"},children:y[e(251)]}),a[e(377)]("td",{className:e(203),style:{width:e(299),borderColor:c,height:.5*s+"in"},children:y[e(136)]?.[e(364)](0)||""}),a.jsx("td",{className:e(191),style:{borderColor:c,height:.5*s+"in"},children:y.student_section}),a[e(377)]("td",{className:e(191),style:{borderColor:c,height:.5*s+"in"},children:y[e(337)]})]}),a[e(334)]("tr",{style:{height:.5*s+"in"},children:[a[e(377)]("td",{className:e(359),style:{borderColor:c,height:.5*s+"in"},children:e(467)}),a.jsx("td",{className:e(359),style:{borderColor:c,height:.5*s+"in"},children:e(240)}),a[e(377)]("td",{className:e(368),style:{width:"40px",borderColor:c,height:.5*s+"in"},children:"M.I"}),a[e(377)]("td",{className:e(359),style:{borderColor:c,height:.5*s+"in"},children:"GRADE & SECTION"}),a[e(377)]("td",{className:e(359),style:{borderColor:c,height:.5*s+"in"},children:"LRN"})]})]})})})]}),a[e(334)]("div",{className:e(339),children:[a[e(334)](e(392),{children:[a.jsx("div",{className:e(238),style:{fontSize:.75*s+e(344)},children:e(163)}),a[e(377)]("table",{style:{tableLayout:"fixed"},children:a[e(334)](e(333),{children:[a.jsxs("tr",{className:"header-row-fill",children:[a[e(377)]("td",{className:"term-label",style:{width:e(482)},children:"TERM"}),[1,2,3,4,5][e(273)](n=>a[e(377)]("td",{style:{width:e(453)},children:n},n)),a[e(377)]("td",{className:e(196),style:{width:e(113)},children:"TOTAL"})]}),[1,2,3][e(273)](n=>a[e(334)]("tr",{children:[a[e(377)]("td",{className:e(110),children:n===1?"FIRST":e(n===2?396:128)}),[...Array(5)][e(273)]((p,o)=>a[e(377)]("td",{children:S?.[n]?.[e(157)].ww[o]??""},o)),a.jsx("td",{className:"font-bold",children:S?.[n]?.[e(157)].ww[e(294)](0,5).reduce((p,o)=>p+(Number(o)||0),0)||""})]},n))]})})]}),a[e(334)](e(392),{children:[a.jsx(e(392),{className:e(238),style:{fontSize:.75*s+e(344)},children:"PRODUCT/PERFORMANCE TASK (PPTs)"}),a[e(377)](e(432),{style:{tableLayout:e(307)},children:a[e(334)](e(333),{children:[a[e(334)]("tr",{className:e(282),children:[a[e(377)]("td",{className:e(369),style:{width:e(113)},children:e(411)}),[1,2,3][e(273)](n=>a[e(377)]("td",{style:{width:e(113)},children:n},n)),a[e(377)]("td",{className:e(196),style:{width:e(113)},children:"TOTAL"})]}),[1,2,3][e(273)](n=>a.jsxs("tr",{children:[a.jsx("td",{className:"row-label",children:n===1?"FIRST":n===2?"SECOND":e(128)}),[...Array(3)][e(273)]((p,o)=>a[e(377)]("td",{children:S?.[n]?.[e(157)].pt[o]??""},o)),a[e(377)]("td",{className:e(196),children:S?.[n]?.[e(157)].pt[e(294)](0,3).reduce((p,o)=>p+(Number(o)||0),0)||""})]},n))]})})]})]}),a.jsxs(e(392),{className:e(447),children:[a[e(334)](e(392),{className:e(335),children:[a.jsx(e(392),{className:e(238),style:{fontSize:.7*s+e(344)},children:e(328)}),a.jsx("table",{style:{tableLayout:e(307)},children:a[e(334)](e(333),{children:[a[e(334)]("tr",{className:"header-row-fill",children:[a.jsx("td",{className:e(369),style:{width:"40%"},children:e(411)}),[1,2][e(273)](n=>a[e(377)]("td",{children:n},n))]}),[1,2,3][e(273)](n=>a.jsxs("tr",{children:[a[e(377)]("td",{className:"row-label",children:e(n===1?345:n===2?396:128)}),[...Array(2)].map((p,o)=>a.jsx("td",{children:S?.[n]?.[e(157)].st[o]??""},o))]},n))]})})]}),a.jsx("div",{className:e(335),children:a.jsxs(e(432),{style:{tableLayout:e(307)},children:[a.jsx(e(145),{children:a[e(377)]("tr",{className:"header-row-fill",children:a.jsx("td",{colSpan:2,className:e(309),style:{fontSize:.7*s+e(344)},children:"TERM EXAM"})})}),a[e(377)]("tbody",{children:[1,2,3][e(273)](n=>a[e(334)]("tr",{children:[a[e(334)]("td",{className:e(332),style:{borderColor:c},children:[n===1?"1ST":n===2?"2ND":e(487),e(202)]}),a[e(377)]("td",{className:e(196),children:S?.[n]?.[e(157)].te||""})]},n))})]})}),a[e(377)](e(392),{className:e(335),children:a.jsxs("table",{style:{tableLayout:"fixed"},children:[a[e(377)](e(145),{children:a.jsx("tr",{className:e(282),children:a.jsx("td",{colSpan:2,className:e(309),style:{fontSize:.7*s+e(344)},children:e(394)})})}),a[e(377)]("tbody",{children:[1,2,3][e(273)](n=>a[e(334)]("tr",{children:[a.jsxs("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:c},children:[e(n===1?197:n===2?291:487),e(202)]}),a[e(377)]("td",{className:"font-bold",children:S?.[n]?.[e(298)]||""})]},n))}),a[e(377)](e(495),{children:a[e(377)]("tr",{style:{height:1.5*s+"px"},children:a.jsx("td",{colSpan:2,style:{border:e(507)}})})})]})}),a[e(334)](e(392),{className:e(107),style:{marginTop:G},children:[a.jsx("div",{className:e(426),children:a[e(377)](e(193),{src:V+e(259),alt:e(166),className:e(382),style:{width:W*s,height:X*s}})}),a[e(377)]("div",{className:e(176)}),a.jsx("p",{className:e(210),style:{fontSize:.6*s+"rem",marginTop:14*s+"px"},children:e(524)})]})]})]}),a[e(334)](e(392),{className:"half-page-section border-t-4",style:{borderColor:c},children:[a[e(377)](e(392),{className:e(195),children:e(496)}),a[e(334)](e(432),{className:"attendance-table mb-3",children:[a.jsxs(e(286),{children:[a[e(377)](e(184),{style:{width:e(351)}}),Array.from({length:w})[e(273)]((n,p)=>a[e(377)](e(184),{style:{width:"3.32%"}},p)),a[e(377)]("col",{style:{width:"7%"}})]}),a[e(377)](e(145),{children:a[e(334)]("tr",{children:[a[e(377)]("th",{className:e(522),children:e(115)}),a[e(377)]("th",{colSpan:w,className:e(481),children:e(149)}),a[e(377)]("th",{className:e(306),children:e(355)})]})}),a[e(377)](e(333),{children:[{name:e(142),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:e(319),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:"AUGUST",dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:"SEPTEMBER",dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:e(213),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:e(292),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:"DECEMBER",dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:e(314),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:"FEBRUARY",dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:"MARCH",dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:"APRIL",dates:[1,2,5,6,7,8]}][e(273)](n=>a.jsxs("tr",{children:[a[e(377)]("td",{className:"month-col",children:n[e(442)]}),n0(n[e(267)])[e(273)]((p,o)=>a[e(377)]("td",{className:e(449),style:{color:T(n[e(442)],p)?e(104):e(168)},children:p},o)),a[e(377)]("td",{className:e(196),children:l0[n[e(442)]]||""})]},n[e(442)]))})]}),a.jsxs(e(392),{className:"flex items-stretch border-2 w-full overflow-hidden",style:{borderColor:c},children:[a[e(334)](e(392),{className:e(253),children:[a[e(377)](e(392),{className:e(207),children:"Important Dates"}),[["June 8-11, 2026",e(503)],[e(400),"Term 1: Summative Test #1"],[e(175),e(111)],[e(350),e(256)],[e(405),e(256)],[e(300),e(264)],["Sept 16, 2026",e(525)]][e(273)](([n,p])=>a[e(334)](e(392),{className:e(185),children:[a.jsx(e(392),{className:e(410),children:n}),a.jsx("div",{className:e(236),children:p})]},n))]}),a[e(334)](e(392),{className:"important-dates-box",children:[a[e(377)](e(392),{className:e(207),children:e(158)}),[[e(221),e(370)],["Oct 29, 2026",e(101)],[e(407),"Term 2 Examination"],[e(483),e(264)],["Dec 18, 2026",e(492)],["Jan 4, 2027","Start of Term 3"],[e(279),e(526)]][e(273)](([n,p])=>a[e(334)](e(392),{className:e(185),children:[a[e(377)](e(392),{className:e(410),children:n}),a[e(377)]("div",{className:e(236),children:p})]},n))]}),a.jsxs("div",{className:e(253),children:[a[e(377)](e(392),{className:e(207),children:e(158)}),[[e(462),e(222)],[e(390),e(361)],[e(116),e(290)],[e(271),e(264)],[e(151),e(264)],[e(109),e(469)],[e(434),"End of Term 3"]][e(273)](([n,p])=>a[e(334)](e(392),{className:e(185),children:[a[e(377)](e(392),{className:"date-val uppercase",children:n}),a.jsx(e(392),{className:e(236),children:p})]},n))]})]})]})]})]})})};function J(x,y){return x=x-100,d0()[x]}function ox(){const x=o0,{students:y,sections:u,subjects:v,teachers:j,schoolProfile:A,activeSchoolYear:m,setCurrentView:c,classRecords:S,gradingSheetRecords:M,hpsRecords:l0,sf2Sheets:e}=X0(),{user:V}=Q0(),[w,n0]=b[x(459)](""),[T,P]=b[x(459)](null),[f,s]=b[x(459)](""),[Y,K]=b.useState(1),[B,E]=b[x(459)]("#86efac"),[L,Z]=b.useState(x(235)),[_,W]=b[x(459)](x(198)),[X,G]=b.useState(!1),[z,F]=b[x(459)](new Set),[q,n]=b[x(459)](""),[p,o]=b.useState(!1),[k,C]=b[x(459)](0),[S0,Q]=b[x(459)](""),D=b[x(508)](()=>{const t=x;return u[t(465)](r=>r[t(140)]===w||r.id===w)},[u,w]),O=b.useMemo(()=>v[x(465)](r=>r.id===f||r.subject_name===f),[v,f]),T0=b[x(508)](()=>{if(!D)return[];const t=$0(V,D,v),r=new Set;return t.filter(l=>{const i=J,d=xx(l[i(285)]);return r[i(214)](d)?!1:(r[i(437)](d),!0)})},[D,v,V]),u0=b[x(508)](()=>{const t=x;if(O?.[t(417)]){const r=j[t(465)](l=>l[t(468)]===O[t(417)]||l.id===O.teacher_id);if(r)return r[t(441)]||r[t(442)]}return D?.[t(268)]||""},[O,j,D]),a0=b[x(508)](()=>{const t=x;return[...u][t(454)]((r,l)=>{const i=t,d=(r.section_grade_level||"").localeCompare(l[i(517)]||"",void 0,{numeric:!0});return d!==0?d:(r[i(140)]||"").localeCompare(l[i(140)]||"")})},[u]),E0=b[x(508)](()=>{const t=x,r={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return a0[t(225)](l=>{const i=t,d=(l[i(517)]||"")[i(146)](),N=parseInt(d[i(415)](/\D/g,""))||0;d[i(249)](i(239))||N>=1&&N<=6?r[i(500)][i(228)](l):N>=7&&N<=10?r[i(421)].push(l):N>=11&&N<=12&&r[i(150)][i(228)](l)}),r},[a0]);b[x(171)](()=>{const t=x;if(!w&&a0[t(316)]===1){const r=setTimeout(()=>{const l=t;n0(a0[0][l(140)])},0);return()=>clearTimeout(r)}},[a0,w]),b[x(171)](()=>{const t=setTimeout(()=>{s(""),P(null),F(new Set)},0);return()=>clearTimeout(t)},[w]);const R=b[x(508)](()=>{const t=x;if(!w)return[];const r=u[t(465)](l=>l.section_name===w||l.id===w)?.id;return y.filter(l=>l.student_section===w||r&&l[t(183)]===r)},[y,w,u]),$=b[x(508)](()=>R[x(399)](t=>(t[x(187)]||"")[x(146)]()===x(521))[x(454)]((t,r)=>(t.last_name+", "+t[x(251)])[x(125)](r[x(181)]+", "+r.first_name)),[R]),x0=b.useMemo(()=>R[x(399)](t=>(t.gender||"")[x(146)]()!==x(521))[x(454)]((t,r)=>(t.last_name+", "+t[x(251)])[x(125)](r[x(181)]+", "+r[x(251)])),[R]),R0=()=>{const t=x;z[t(112)]===0&&R.length>0&&F(new Set(R.map(r=>r[t(337)]))),G(!0)},h0=b[x(354)](t=>{const r=x;if(!t)return{};const l={};return e[r(399)](d=>d[r(315)]===m&&(d.section_id===D?.id||d[r(311)]===w))[r(225)](d=>{const N=r,h=d[N(497)]?.[t[N(337)]];if(h){const I=Object[N(498)](h)[N(399)](H=>H?.[N(146)]()===N(470))[N(316)];I>0&&(l[d.month[N(212)]()]=I)}}),l},[e,m,D,w]),b0=b[x(354)]((t,r,l)=>{const i=x;if(!t||!r)return;const d={};return[1,2,3][i(225)](N=>{const h=i,I=S.find(g=>g[h(435)]===t[h(337)]&&g[h(315)]===m&&Number(g[h(189)])===N&&(g[h(422)]===l?.id||g[h(422)]===r))||M[h(465)](g=>g[h(435)]===t.lrn&&g[h(315)]===m&&Number(g[h(189)])===N&&(g[h(422)]===l?.id||g[h(422)]===r)),H=l0.find(g=>(g[h(422)]===l?.id||g[h(422)]===r)&&g.school_year===m&&Number(g[h(189)])===N),e0=(g,B0)=>{const F0=h,H0=Array[F0(226)](g)?g:[];return Array.from({length:B0},(tx,U0)=>H0[U0]??"")},M0=I,P0=H,U=g=>g===""||g===null||g===void 0?"":g;d[N]={scores:{ww:e0(I?.written_works,10)[h(273)](U),pt:e0(I?.[h(511)],10)[h(273)](U),st:e0(M0?.[h(108)],5)[h(273)](U),te:U(I?.[h(252)]??"")},hps:{ww:e0(H?.[h(261)],10)[h(273)](U),pt:e0(H?.[h(511)],10)[h(273)](U),st:e0(P0?.[h(108)],5).map(U),te:U(H?.[h(252)]??"")},finalGrade:U(I?.final_grade??"")}}),d},[S,M,l0,m]),I0=b.useMemo(()=>h0(T),[T,h0]),A0=b[x(508)](()=>b0(T,f,O),[T,f,O,b0]),g0=b[x(508)](()=>[...$,...x0],[$,x0]),t0=b[x(508)](()=>{const t=x;return g0[t(399)](r=>z[t(214)](r.lrn))},[g0,z]),r0=b[x(508)](()=>{const t=x;if(!q[t(466)]())return R;const r=q[t(146)]();return R[t(399)](l=>l[t(181)][t(146)]()[t(249)](r)||l[t(251)][t(146)]()[t(249)](r)||l[t(337)].includes(r))},[R,q]),m0=b[x(508)](()=>r0[x(399)](t=>(t[x(187)]||"")[x(146)]()==="male"),[r0]),p0=b[x(508)](()=>r0.filter(t=>(t[x(187)]||"").toLowerCase()===x(220)),[r0]),L0=()=>{const t=x;if(!T)return;const r=document[t(119)],l=(T[t(181)]+"_"+T[t(251)])[t(415)](/[^a-z0-9]/gi,"_");document[t(119)]=t(413)+l+"_"+m,window[t(280)](),setTimeout(()=>{const i=t;document[i(119)]=r},1e3)},w0=async()=>{const t=x;if(t0[t(316)]!==0){o(!0),C(10),Q(t(224));try{await new Promise(i=>setTimeout(i,400));const r=document.getElementById(t(385)),l=r?Array[t(493)](r.querySelectorAll(t(384))):[];if(l[t(316)]===0){alert(t(230)),o(!1);return}C(50),Q("Opening print stream for "+l[t(316)]+" learners..."),await ax({elements:l,paperSize:_,orientation:t(367),title:t(182)+(D?.[t(140)]||t(395))+"_"+(O?.[t(285)]||t(347))}),C(100),Q(t(460)),setTimeout(()=>{o(!1),G(!1)},600)}catch(r){console[t(527)](t(248),r),alert(t(444)),o(!1)}}},N0=async()=>{const t=x;if(t0[t(316)]!==0){o(!0),C(5),Q(t(257));try{await new Promise(I=>setTimeout(I,400));const r=document[t(266)](t(385)),l=r?Array[t(493)](r[t(423)](t(384))):[];if(l[t(316)]===0){alert(t(144)),o(!1);return}const i=(D?.section_name||w||t(395))[t(415)](/[^a-z0-9]/gi,"_"),d=(O?.[t(285)]||"Subject")[t(415)](/[^a-z0-9]/gi,"_"),N=t(413)+i+"_"+d+"_"+m,h=await ex({elements:l,filename:N,paperSize:_,orientation:t(367),title:N,onProgressChange:I=>{const H=t;C(I),Q(H(494)+I+H(528))}});h.success?(C(100),Q("PDF download complete!"),setTimeout(()=>{o(!1),G(!1)},800)):(h[t(297)]||alert(t(121)+(h[t(527)]||t(124))),o(!1))}catch(r){console[t(527)]("Bulk PDF download error:",r),alert(t(217)),o(!1)}}},y0=t=>{F(r=>{const l=J,i=new Set(r);return i[l(214)](t)?i.delete(t):i[l(437)](t),i})},z0=()=>{const t=x;F(new Set(R[t(273)](r=>r.lrn)))},C0=()=>{const t=x;F(new Set($[t(273)](r=>r[t(337)])))},O0=()=>{const t=x;F(new Set(x0[t(273)](r=>r[t(337)])))},D0=()=>{F(new Set)};return a[x(334)](x(392),{className:"lir-print-root flex flex-col h-full bg-slate-50 relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white",children:[a.jsxs(x(392),{className:"z-20 bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm sticky top-0 print:hidden shrink-0 w-full",children:[a[x(377)]("div",{className:x(363)}),a[x(334)]("div",{className:x(418),children:[a[x(334)]("div",{className:"flex items-center gap-1.5 lg:gap-2 shrink-0",children:[a[x(377)](x(262),{onClick:()=>c(x(209)),className:x(301),title:x(323),children:a[x(377)](J0,{className:x(331)})}),a.jsxs(x(392),{className:"flex flex-col shrink-0",children:[a[x(377)]("h2",{className:x(472),children:x(358)}),a[x(377)]("p",{className:"text-[7px] font-black text-emerald-600 uppercase tracking-widest leading-none",children:"Individual LIR"})]})]}),a.jsx("div",{className:"h-5 w-px bg-slate-200 shrink-0"}),a[x(334)]("div",{className:x(173),children:[a[x(334)](x(476),{className:"appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate",value:w,onChange:t=>{n0(t[x(402)].value),P(null),s("")},children:[a.jsx(x(376),{value:"",children:x(510)}),Object[x(438)](E0).map(([t,r])=>r.length>0&&a.jsx(x(480),{label:t,children:r[x(273)](l=>a[x(334)](x(376),{value:l.section_name,children:[l[x(517)],x(164),l[x(140)]]},l.id))},t))]}),a[x(377)](i0,{className:x(204)})]}),a[x(334)](x(392),{className:"relative group min-w-0 flex-1",children:[a[x(334)](x(476),{className:x(488),value:f,onChange:t=>{const r=x;s(t[r(402)][r(484)]),P(null)},disabled:!w,children:[a[x(377)](x(376),{value:"",children:x(509)}),T0[x(273)](t=>a[x(377)](x(376),{value:t.id,children:t[x(285)]},t.id))]}),a.jsx(i0,{className:x(204)})]}),a[x(334)](x(392),{className:x(173),children:[a[x(334)](x(476),{className:x(330),value:T?.[x(337)]||"",onChange:t=>{const r=x,l=y.find(i=>i.lrn===t[r(402)][r(484)])||null;P(l)},disabled:!f,children:[a[x(377)](x(376),{value:"",children:x(165)}),$[x(316)]>0&&a[x(377)](x(480),{label:"MALE",children:$[x(273)](t=>{const r=x,l=f&&(S[r(446)](i=>i[r(435)]===t[r(337)]&&i[r(422)]===f&&i[r(315)]===m)||M[r(446)](i=>i[r(435)]===t[r(337)]&&i.subject_id===f&&i[r(315)]===m));return a[r(334)]("option",{value:t[r(337)],children:[t.last_name,", ",t[r(251)]," ",l?"✓":""]},t.lrn)})}),x0[x(316)]>0&&a[x(377)]("optgroup",{label:x(342),children:x0[x(273)](t=>{const r=x,l=f&&(S[r(446)](i=>i[r(435)]===t[r(337)]&&i[r(422)]===f&&i[r(315)]===m)||M[r(446)](i=>i[r(435)]===t[r(337)]&&i.subject_id===f&&i[r(315)]===m));return a[r(334)](r(376),{value:t[r(337)],children:[t.last_name,", ",t[r(251)]," ",l?"✓":""]},t[r(337)])})})]}),a[x(377)](i0,{className:x(204)})]}),a.jsx(x(392),{className:x(114)}),a.jsxs(x(392),{className:x(215),children:[a[x(334)](x(476),{value:_,onChange:t=>W(t.target[x(484)]),className:"appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer min-w-13.75 duration-200",title:"Paper Size",children:[a[x(377)]("option",{value:"a4",children:"A4"}),a[x(377)](x(376),{value:x(167),children:"Letter"}),a[x(377)](x(376),{value:x(198),children:x(406)})]}),a.jsx(i0,{className:"w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors"})]}),a[x(334)](x(392),{className:x(365),children:[a[x(334)](x(392),{className:"relative flex items-center justify-center cursor-pointer shrink-0",title:x(102),children:[a.jsx(x(392),{className:"w-4.5 h-4.5 rounded-md border border-slate-200 shadow-sm shrink-0",style:{backgroundColor:B,width:18,height:18}}),a.jsx(x(137),{type:x(473),value:B,onChange:t=>E(t[x(402)][x(484)]),className:"w-full h-full opacity-0 absolute inset-0 cursor-pointer"})]}),a[x(334)](x(392),{className:"relative flex items-center justify-center cursor-pointer shrink-0",title:x(348),children:[a[x(377)](x(392),{className:x(375),style:{backgroundColor:L,width:18,height:18}}),a[x(377)](x(137),{type:x(473),value:L,onChange:t=>Z(t[x(402)][x(484)]),className:x(398)})]})]}),a[x(334)]("div",{className:x(431),children:[a.jsx(x(262),{onClick:()=>K(t=>Math.max(.4,t-.1)),className:x(464),title:x(397),children:a[x(377)](Y0,{className:x(455)})}),a[x(334)](x(313),{className:"text-[8px] font-black text-slate-900 w-7 text-center tabular-nums",children:[Math[x(308)](Y*100),"%"]}),a[x(377)]("button",{onClick:()=>K(t=>Math[x(477)](1.5,t+.1)),className:x(464),title:"Zoom In",children:a.jsx(K0,{className:x(455)})})]}),a.jsxs(x(262),{onClick:R0,disabled:!w||!f||R[x(316)]===0,className:"ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:"Filter / Select Learners",children:[a.jsx(v0,{className:x(322)}),"Select (",z[x(112)],")"]}),a[x(334)](x(262),{onClick:N0,disabled:!w||!f||t0[x(316)]===0,className:x(156),title:x(353),children:[a[x(377)](_0,{className:x(321)}),"Bulk PDF"]}),a[x(334)](x(262),{onClick:w0,disabled:!w||!f||t0[x(316)]===0,className:"h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(513),children:[a[x(377)](c0,{className:"w-3 h-3 group-hover:scale-110 transition-transform"}),x(169)]}),a.jsxs("button",{onClick:L0,disabled:!T,className:"h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:"Print single active learner",children:[a[x(377)](c0,{className:x(223)}),"Print Single"]})]})]}),a[x(377)](x(392),{className:"flex-1 overflow-auto relative bg-slate-100 print:bg-white custom-scrollbar",children:a[x(377)](x(392),{className:"w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0",children:T?a[x(377)](x(392),{className:x(383),style:{transform:x(504)+Y+x(295),willChange:x(478),backfaceVisibility:x(515),WebkitBackfaceVisibility:"hidden"},children:a[x(334)]("div",{className:"relative group",children:[a.jsx(x(392),{className:x(425)}),a[x(377)](x(392),{className:x(343),children:a[x(377)](j0,{pageNumber:1,student:T,profile:A,schoolYear:m,subject:O?.[x(285)]||"",teacher:u0,fillColor:B,outlineColor:L,gradeData:A0,attendanceData:I0,paperSize:_})})]})}):a[x(334)](x(392),{className:"flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10",children:[a[x(334)](x(392),{className:x(120),children:[a[x(377)](x(392),{className:x(133)}),a[x(334)](x(392),{className:x(419),children:[a.jsx(q0,{className:x(461)}),a.jsxs(x(392),{className:"absolute inset-0 flex flex-col items-center justify-center",children:[a.jsx(x(313),{className:x(373),children:"LIR"}),a[x(377)](x(392),{className:x(474)})]}),a[x(377)](x(392),{className:"absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 group-hover:rotate-12 transition-all duration-500",children:a[x(377)](c0,{className:"w-10 h-10 text-white"})})]})]}),a[x(334)](x(392),{className:x(443),children:[a.jsx("h2",{className:x(448),children:x(277)}),a[x(377)]("p",{className:x(378),children:x(486)})]})]})})}),a[x(377)](x(392),{id:x(385),className:x(254),style:{left:"-9999px"},children:t0[x(273)](t=>{const r=x,l=b0(t,f,O),i=h0(t);return a.jsx(r(392),{className:r(194),children:a[r(377)](j0,{pageNumber:1,student:t,profile:A,schoolYear:m,subject:O?.[r(285)]||"",teacher:u0,fillColor:B,outlineColor:L,gradeData:l,attendanceData:i,paperSize:_})},t[r(337)])})}),X&&a[x(377)](x(392),{className:x(318),children:a[x(334)](x(392),{className:x(269),children:[a[x(334)](x(392),{className:x(234),children:[a[x(334)](x(392),{className:"flex items-center gap-3",children:[a[x(377)](x(392),{className:x(245),children:a[x(377)](v0,{className:"w-5 h-5"})}),a[x(334)]("div",{children:[a.jsx("h3",{className:x(414),children:x(205)}),a[x(334)]("p",{className:x(200),children:[D?.[x(517)],x(164),D?.[x(140)],x(288),O?.subject_name]})]})]}),a[x(377)](x(262),{onClick:()=>G(!1),className:x(430),children:a[x(377)](V0,{className:x(452)})})]}),a[x(334)]("div",{className:x(127),children:[a[x(334)](x(392),{className:x(174),children:[a.jsx(Z0,{className:x(216)}),a[x(377)](x(137),{type:x(380),placeholder:x(420),value:q,onChange:t=>n(t[x(402)][x(484)]),className:x(152)})]}),a[x(334)](x(392),{className:x(179),children:[a.jsxs(x(262),{onClick:z0,className:x(122),children:[a[x(377)](f0,{className:x(103)}),x(458),R.length,")"]}),a[x(334)](x(262),{onClick:C0,className:x(122),children:[x(178),$.length,")"]}),a.jsxs("button",{onClick:O0,className:x(122),children:[x(161),x0.length,")"]}),a.jsx(x(262),{onClick:D0,className:"h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1",children:"Clear"})]})]}),a[x(334)](x(392),{className:x(320),children:[m0[x(316)]>0&&a[x(334)](x(392),{className:x(381),children:[a[x(377)](x(392),{className:"flex items-center justify-between px-1",children:a.jsxs(x(313),{className:x(172),children:["Male Learners (",m0[x(316)],")"]})}),a[x(377)]("div",{className:x(404),children:m0.map(t=>{const r=x,l=z[r(214)](t.lrn),i=f&&(S[r(446)](d=>d[r(435)]===t.lrn&&d[r(422)]===f&&d[r(315)]===m)||M[r(446)](d=>d[r(435)]===t[r(337)]&&d[r(422)]===f&&d.school_year===m));return a.jsxs(r(392),{onClick:()=>y0(t[r(337)]),className:r(310)+r(l?190:389),children:[a[r(334)](r(392),{className:r(270),children:[l?a[r(377)](f0,{className:r(324)}):a[r(377)](k0,{className:r(416)}),a[r(334)](r(392),{className:r(326),children:[a[r(334)]("p",{className:r(135),children:[t.last_name,", ",t[r(251)]," ",t.middle_name?t[r(136)][0]+".":""]}),a[r(334)]("p",{className:r(489),children:[r(429),t[r(337)]]})]})]}),i&&a[r(377)](r(313),{className:r(475),children:r(233)})]},t[r(337)])})})]}),p0[x(316)]>0&&a.jsxs(x(392),{className:x(381),children:[a[x(377)](x(392),{className:x(246),children:a[x(334)](x(313),{className:"text-[10px] font-black text-slate-500 uppercase tracking-widest",children:[x(433),p0[x(316)],")"]})}),a[x(377)](x(392),{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:p0[x(273)](t=>{const r=x,l=z[r(214)](t[r(337)]),i=f&&(S[r(446)](d=>d[r(435)]===t[r(337)]&&d[r(422)]===f&&d[r(315)]===m)||M[r(446)](d=>d.student_lrn===t[r(337)]&&d[r(422)]===f&&d[r(315)]===m));return a[r(334)](r(392),{onClick:()=>y0(t[r(337)]),className:r(310)+(l?r(190):"bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"),children:[a[r(334)](r(392),{className:r(270),children:[l?a[r(377)](f0,{className:r(324)}):a[r(377)](k0,{className:"w-4 h-4 text-slate-300 shrink-0"}),a[r(334)](r(392),{className:r(326),children:[a[r(334)]("p",{className:"text-xs font-bold text-slate-800 truncate",children:[t[r(181)],", ",t[r(251)]," ",t[r(136)]?t[r(136)][0]+".":""]}),a.jsxs("p",{className:r(489),children:[r(429),t[r(337)]]})]})]}),i&&a[r(377)](r(313),{className:r(475),children:r(233)})]},t.lrn)})})]}),r0.length===0&&a[x(334)]("div",{className:x(180),children:[x(303),q,'".']})]}),a[x(334)](x(392),{className:x(349),children:[a[x(334)](x(392),{className:x(130),children:[a[x(377)](x(313),{className:"text-indigo-600 font-black",children:z[x(112)]}),x(227),R[x(316)],x(523)]}),a.jsxs(x(392),{className:x(192),children:[a[x(334)](x(262),{onClick:N0,disabled:z[x(112)]===0,className:x(160),children:[a.jsx(_0,{className:x(274)}),x(244)]}),a[x(334)]("button",{onClick:w0,disabled:z[x(112)]===0,className:x(139),children:[a[x(377)](c0,{className:x(274)}),x(169)]})]})]})]})}),p&&a[x(377)](x(392),{className:x(170),children:a.jsxs("div",{className:"bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6",children:[a[x(334)](x(392),{className:x(374),children:[a.jsx(x(392),{className:"absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping"}),a[x(377)](x(392),{className:"relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30",children:a[x(377)](W0,{className:x(457)})})]}),a[x(334)](x(392),{className:x(381),children:[a[x(377)]("h3",{className:x(519),children:"Processing LIR Records"}),a[x(377)]("p",{className:x(126),children:S0})]}),a[x(334)]("div",{className:x(229),children:[a.jsx("div",{className:"h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200",children:a[x(377)]("div",{className:x(518),style:{width:Math[x(199)](5,k)+"%"}})}),a[x(334)]("div",{className:x(211),children:[a[x(377)]("span",{children:x(272)}),a.jsxs("span",{children:[k,"%"]})]})]})]})}),a.jsx(x(159),{children:x(100)+x(_==="a4"?371:_==="letter"?312:177)+x(258)+(_==="a4"?"210mm":x(293))+x(237)+(_==="a4"?x(243):"8.5in")+x(265)+x(_==="a4"?243:293)+x(208)+(_==="a4"?x(366):_===x(167)?x(346):x(357))+x(129)})]})}function d0(){const x=["cancelled","finalGrade","40px","Sept 2-15, 2026","w-7 h-7 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all group shrink-0 active:scale-95 duration-200","18ZLhLSK",'No learners found matching "',`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `,`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,"absences-header uppercase","fixed","round","font-bold py-1","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ","section_id","8.5in 11in","span","JANUARY","school_year","length","301YyZkiK","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200","JULY","flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4","w-3 h-3 group-hover:-translate-y-0.5 transition-transform","w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform","Back to Hub","w-4 h-4 text-indigo-600 shrink-0","flex items-center justify-center bg-white overflow-hidden","truncate","school-logo.png","SUMMATIVE TEST",`px; 
                        font-size: `,"appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200","w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform","row-label py-1 px-1 border-2","tbody","jsxs","col-span-1",`;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"lrn",`rem;
                        width: `,"grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden",`rem; 
                        border-bottom: 2px solid `,"apply","FEMALE","lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none","rem","FIRST","11in","Subject","Choose Outline Color","p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0","Aug 28, 2026","10%","flex justify-between items-center w-full overflow-hidden","Bulk Download PDF for selected learners","useCallback","Total Abs.","__proto__","13in","Learner Record","label-green py-1 border-2",`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,"Term 3 Exam (Graduating)","DECEMBER","absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30","charAt","flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 h-8 shrink-0 items-center px-1.5","297mm","portrait","label-green py-1 border-2 px-1","term-label","Term 2: Summative Test #1","210mm 297mm","148952kxPKKp","text-7xl font-black text-slate-100 tracking-tighter leading-none italic","relative w-16 h-16 mx-auto flex items-center justify-center","w-4.5 h-4.5 rounded-md border border-slate-200 shadow-sm shrink-0","option","jsx","text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60","toString","text","space-y-2","object-contain","transition-all duration-700 ease-out origin-top print:scale-100",".lir-bulk-sheet","lir-bulk-render-container",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,"1x1 Learner Photo","5tsAQGD","bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50","Mar 15-16, 2027","constructor","div",`;
                        padding: `,"FINAL GRADE","Section","SECOND","Zoom Out","w-full h-full opacity-0 absolute inset-0 cursor-pointer","filter","July 6, 2026",`rem; 
                        padding: `,"target","label-green border-2 whitespace-nowrap","grid grid-cols-1 sm:grid-cols-2 gap-2","Sept 1, 2026","Folio","Dec 3-4, 2026",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,`;
                        font-size: `,"date-val uppercase","TERM",`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,"LIR_","text-sm font-black uppercase tracking-wide text-white","replace","w-4 h-4 text-slate-300 shrink-0","teacher_id","flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden","relative w-64 h-64 bg-white rounded-[5rem] border border-slate-200 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl","Filter learners by name or LRN...","JUNIOR HIGH SCHOOL","subject_id","querySelectorAll","photo_url","absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000","mb-2",`; 
                        padding: `,`; 
                        text-align: center; 
                        font-size: `,"LRN: ","w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors","flex items-center gap-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200 h-8 shrink-0","table","Female Learners (","Apr 8, 2027","student_lrn",`dd;
                        border: 1px solid `,"add","entries",`rem;
                        vertical-align: middle;
                        background-color: white;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,"logo_url","displayName","name","space-y-4","Failed to launch bulk print.","info","some","grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","text-4xl font-black text-slate-900 tracking-tight uppercase","attendance-date-cell",`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `,`px;
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
                        background-color: `,"w-4 h-4","13%","sort","w-3 h-3",`rem; 
                        min-height: `,"w-8 h-8 animate-spin","All (","useState","Bulk print stream launched successfully.","w-28 h-28 text-slate-100","Feb 16, 2027","AUGUST","w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-all active:scale-90 duration-200","find","trim","LAST NAME","uid","EOSY Rites","absent","font-normal ml-2","text-[10px] lg:text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none mb-0.5","color","w-20 h-1 bg-emerald-500/10 rounded-full mt-4","px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0","select","min","transform","shrink-0 ml-auto","optgroup","dates-header-bar uppercase","15%","Dec 7-18, 2026","value","font-extrabold uppercase whitespace-nowrap","Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections.","3RD","appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate","text-[9px] font-medium text-slate-400",`;
                        border-radius: 8px;
                        height: `,"4453590OkyAOU","End of Term 2","from","Processing LIR PDF pages: ","tfoot","Daily Attendance","attendance","values","School Logo","ELEMENTARY",`rem;
                    }

                    .row-label {
                        background-color: `,"803860LobPwk","Opening Block: Term 1","scale(",`px; 
                        border-right: 1px solid `,"border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden","none","useMemo","Select Subject","Choose Section","performance_tasks","console","Bulk Print for selected learners",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"hidden","return (function() ","section_grade_level","h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300","text-lg font-black text-slate-900 tracking-tight uppercase","exception","male","month-col uppercase"," learners selected","Teacher's Signature","Start of Term 2","Term 3: Summative Test #1","error","% complete...",`
                @media print {
                    @page {
                        size: `,"Term 2: Summative Test #2","Choose Fill Color","w-3 h-3 text-indigo-600","red","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","299072zrIERX","col-span-1 flex flex-col items-center justify-center pt-1","summative_tests","Apr 6-7, 2027","row-label","Term 1: Summative Test #2","size","20%","h-5 w-px bg-slate-200 shrink-0","Months","Mar 22-23, 2027","Learner's Individual Record Card","TEACHER","title","relative group","Export failed: ","h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1","flex items-center gap-4 shrink-0","Unknown error","localeCompare","text-xs font-semibold text-slate-500","p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0","THIRD",` !important;
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
             `,"text-xs font-bold text-slate-600","src","page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none","absolute -inset-24 bg-emerald-500/5 blur-[120px] rounded-full","header-subject-table border-collapse border-2","text-xs font-bold text-slate-800 truncate","middle_name","input","px ","h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","section_name","bind","JUNE","half-page-section","No sheets ready for PDF export.","thead","toLowerCase",`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,"423978ICtrMZ","Dates","SENIOR HIGH SCHOOL","Apr 1-8, 2027","w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500","prototype","card-container-combined print:m-0 print:shadow-none",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","scores","Important Dates","style","h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","Females (","2844890OVTjwd","WRITTEN /ORAL WORKS (WWs)"," - ","Select Learner","DepEd Logo","letter","inherit","Bulk Print","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200","useEffect","text-[10px] font-black text-slate-500 uppercase tracking-widest","relative group min-w-0 flex-1","relative flex-1 min-w-48","July 28, 2026","signature-box bg-white","8.5in 13in","Males (","flex items-center gap-1.5 flex-wrap","p-8 text-center text-slate-400 text-xs font-medium","last_name","Bulk_LIR_","student_section","col","date-row","1108554BHqhKf","gender",`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `,"quarter","bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm","data-field uppercase font-bold border-2 whitespace-nowrap","flex items-center gap-2","img","lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always","lir-title-bar-custom mb-3 uppercase tracking-widest","font-bold","1ST","folio","max","text-[10px] text-slate-400 font-semibold uppercase tracking-widest",`px; 
                        padding: `," TERM","data-field uppercase font-bold border-2 whitespace-nowrap px-1","w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors","Bulk LIR Operations",`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"important-dates-header uppercase italic",` !important;
                        height: `,"school-forms","font-bold uppercase leading-none text-center","flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider","toUpperCase","OCTOBER","has","relative group shrink-0","w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400","Failed to generate PDF download.","-11px","School Year: ","female","Oct 7, 2026","Term 3: Summative Test #2","w-3 h-3 group-hover:translate-y-0.5 transition-transform","Preparing LIR sheets for bulk printing...","forEach","isArray"," of ","push","space-y-1.5","No sheets ready for printing. Please try again.","BAGONG BARRIO NATIONAL HIGH SCHOOL",'{}.constructor("return this")( )',"✓ Grades","px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0","#22c55e","date-label uppercase",` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `,"header-green py-1","kinder","FIRST NAME",`;
                        border: 1px solid `,`px;
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
                        padding: `,"210mm","Download PDF","w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400","flex items-center justify-between px-1","data-field font-extrabold border-2 whitespace-nowrap","Bulk print error:","includes",`; 
                        color: black !important; 
                        font-size: `,"first_name","quarterly_exam","important-dates-box","fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block","warn","Term 1 Examination","Initializing vector PDF export pipeline...",`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `,"deped_logo_right.png","font-bold leading-tight","written_works","button","grow flex flex-col gap-1 overflow-hidden","End-of-Term Block",` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"getElementById","dates","adviser_name","bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]","flex items-center gap-2.5 min-w-0","Mar 24-31, 2027","Export Pipeline","map","w-3.5 h-3.5","max-w-full max-h-full object-contain",`px;
                        text-align: center;
                        height: `,"Individual Record",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,"Jan 25, 2027","print","#86efac","header-row-fill",`rem;
                        table-layout: fixed;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `,"0px","subject_name","colgroup",`px 0;
                        width: 100%;
                    }

                    .header-green {
                        background-color: `," | ","trace","Term 3 Exam (Non-Grad)","2ND","NOVEMBER","8.5in","slice",") translateZ(0)",`44;
                        font-weight: 800;
                        font-size: `];return d0=function(){return x},d0()}export{ox as LIRPage};
