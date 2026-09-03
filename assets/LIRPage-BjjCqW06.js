import{j as a,r as m,cv as W0,bH as d0,cF as V0,cf as q0,be as S0,bP as T0,ch as b0,cE as X0,bs as K0,ds as Z0,cH as g0,cI as E0,bE as Q0}from"./vendor-Cj7XSgTs.js";import{b as $0,u as xx,l as ex,A as w0,F as ax}from"./index-DDS7F77-.js";import{e as tx,p as rx}from"./pdf-export-Drw0zfed.js";import"./vendor-pdf-libs-ChAEQR0D.js";import"./vendor-firebase-Df5t39Xl.js";import"./vendor-framer-motion-JdOd8a5E.js";const n0=U;(function(x,N){const g=U,y=x();for(;;)try{if(parseInt(g(427))/1+parseInt(g(249))/2*(-parseInt(g(545))/3)+parseInt(g(120))/4+-parseInt(g(535))/5*(-parseInt(g(195))/6)+-parseInt(g(200))/7*(parseInt(g(529))/8)+parseInt(g(441))/9*(-parseInt(g(225))/10)+parseInt(g(305))/11*(parseInt(g(289))/12)===N)break;y.push(y.shift())}catch{y.push(y.shift())}})(h0,714396);const l0=(function(){let x=!0;return function(N,g){const y=x?function(){const A=U;if(g){const S=g[A(563)](N,arguments);return g=null,S}}:function(){};return x=!1,y}})(),Y0=l0(void 0,function(){const x=U,N=function(){let S;try{S=Function('return (function() {}.constructor("return this")( ));')()}catch{S=window}return S},g=N(),y=g[x(124)]=g[x(124)]||{},A=["log",x(157),x(548),x(542),"exception",x(385),x(214)];for(let S=0;S<A[x(533)];S++){const b=l0[x(540)][x(456)][x(511)](l0),o=A[S],k=y[o]||b;b[x(126)]=l0[x(511)](l0),b.toString=k.toString[x(511)](k),y[o]=b}});Y0();function U(x,N){return x=x-120,h0()[x]}const R0=({pageNumber:x,student:N,profile:g,schoolYear:y,subject:A,teacher:S,fillColor:b=n0(482),outlineColor:o=n0(500),gradeData:k,paperSize:D=n0(267),attendanceData:q={}})=>{const e=n0,X="./",w=25,i0=n=>Array[U(539)]({length:w},(h,_)=>n[_]??""),T=(n,u)=>{const h=U,_=Number(u);if(!_)return!1;const C=n.toUpperCase();return C===h(436)&&_===12||C===h(435)&&(_===21||_===31)||C===h(509)&&(_===2||_===30)||C===h(352)&&_===8||C===h(383)&&_===1};let M=e(154),p=e(177),s=1.12,Y=1.2,W=.8,F=.75,E=5,L=.8,K=40,v=240,Z=100,Q=50,J=e(234);D==="a4"?(p=e(245),M=e(438),s=1.02,Y=.85,W=.55,F=.5,E=2,L=.65,K=26,v=140,Z=80,Q=40):D===e(492)?(p=e(177),M=e(466),s=.98,Y=.85,W=.55,F=.5,E=3,L=.7,K=28,v=160,Z=65,Q=32,J=e(227)):D==="folio"&&(p=e(177),M=e(154),s=.98,Y=.85,W=.55,F=.5,E=3,L=.7,K=28,v=160,Z=65,Q=32,J="-11px");const z=(n,u)=>{const h=e,_=(n||"").trim();return _[h(533)]>32?u*.65:_[h(533)]>24?u*.78:_[h(533)]>16?u*.88:u},B=z(A,L*s),V=z(S,L*s);return a[e(147)]("div",{className:"lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0",children:a[e(299)]("div",{className:e(462),style:{width:p,height:M},children:[a[e(147)](e(415),{children:e(518)+p+" "+M+e(479)+o+e(398)+8*s+`px;
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
                        padding: `+5*s+e(386)+b+`;
                        border: 1px solid `+o+e(361)+3*s+`px;
                        font-size: `+.85*s+`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `+b+e(153)+o+e(238)+.6*s+e(524)+o+`;
                        padding: `+2*s+e(473)+.8*s+e(236)+.6*s+e(489)+o+e(398)+1.5*s+e(172)+24*s+`px;
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
                        background-color: `+b+e(413)+.6*s+`rem;
                    }

                    .row-label {
                        background-color: `+b+e(350)+.6*s+e(486)+70*s+e(196)+b+`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `+o+e(550)+K*s+e(348)+v*s+e(261)+b+e(336)+.9*s+e(499)+4*s+e(434)+o+e(461)+o+`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `+o+e(401)+.5*s+`rem; 
                        font-weight: 700; 
                        height: `+21*s+`px; 
                        padding: `+1*s+e(171)+b+e(505)+.5*s+`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `+o+e(320)+b+e(566)+.9*s+e(165)+b+`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `+.45*s+e(424)+.5*s+e(364)+o+e(311)+b+`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `+3*s+e(216)+.85*s+e(515)+o+e(442)+o+e(506)+.45*s+e(193)+18*s+e(143)+95*s+`px; 
                        border-right: 1px solid `+o+e(487)+1.5*s+"px "+4*s+e(387)+1.5*s+e(241)+4*s+e(330)+.42*s+`rem; 
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
                `}),a[e(299)](e(191),{className:"card-container-combined print:m-0 print:shadow-none",children:[a[e(299)](e(191),{className:e(252),children:[a[e(299)](e(191),{className:"flex justify-between items-center w-full overflow-hidden",children:[a.jsxs("div",{className:"flex items-center gap-4 shrink-0",children:[a[e(147)](e(191),{className:e(525),style:{width:64*s,height:64*s},children:a.jsx(e(168),{src:g[e(498)]||X+"school-logo.png",alt:e(246),className:"max-w-full max-h-full object-contain",onError:n=>{const u=e;n[u(127)][u(169)]=X+u(481)}})}),a[e(299)](e(191),{children:[a[e(147)]("h1",{className:e(440),style:{fontSize:Y*s+e(403)},children:g[e(356)]||e(343)}),a[e(147)]("p",{className:e(449),style:{fontSize:W*s+"rem",color:o},children:e(235)}),a.jsxs("p",{className:e(146),style:{fontSize:F*s+e(403)},children:[e(389),a[e(147)](e(464),{className:e(467),children:y})]})]})]}),a[e(147)](e(191),{className:e(163),children:a[e(147)](e(385),{className:"header-subject-table border-collapse border-2",style:{borderColor:o},children:a.jsx(e(286),{children:a[e(299)]("tr",{children:[a[e(147)]("td",{className:e(439),style:{fontSize:L*s+"rem",padding:E*s+e(241)+E*2*s+"px",borderColor:o},children:"SUBJECT"}),a.jsx("td",{className:e(129),style:{fontSize:B+e(403),padding:E*s+e(241)+E*2.5*s+"px",borderColor:o},children:A}),a.jsx("td",{className:"label-green border-2 whitespace-nowrap",style:{fontSize:L*s+"rem",padding:E*s+"px "+E*2*s+"px",borderColor:o},children:e(186)}),a[e(147)]("td",{className:e(129),style:{fontSize:V+"rem",padding:E*s+e(241)+E*2.5*s+"px",borderColor:o},children:S})]})})})})]}),a[e(299)](e(191),{className:e(372),children:[a.jsx("div",{className:e(504),style:{width:1*s+"in",height:1*s+"in",borderColor:o},children:N[e(300)]?a[e(147)](e(168),{src:N.photo_url,alt:e(428),className:e(215)}):a[e(299)](e(464),{className:e(182),style:{fontSize:.7*s+e(403)},children:[e(554),a.jsx("br",{}),e(313)]})}),a[e(147)](e(191),{className:"grow flex flex-col gap-1 overflow-hidden",children:a[e(147)](e(385),{className:e(496),style:{borderColor:o,height:1*s+"in"},children:a[e(299)](e(286),{children:[a[e(299)]("tr",{style:{height:.5*s+"in"},children:[a.jsx("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:o,height:.5*s+"in"},children:N[e(188)]}),a[e(147)]("td",{className:e(159),style:{borderColor:o,height:.5*s+"in"},children:N[e(197)]}),a[e(147)]("td",{className:e(266),style:{width:"40px",borderColor:o,height:.5*s+"in"},children:N[e(549)]?.[e(160)](0)||""}),a.jsx("td",{className:e(159),style:{borderColor:o,height:.5*s+"in"},children:N.student_section}),a.jsx("td",{className:e(159),style:{borderColor:o,height:.5*s+"in"},children:N[e(455)]})]}),a[e(299)]("tr",{style:{height:.5*s+"in"},children:[a[e(147)]("td",{className:e(144),style:{borderColor:o,height:.5*s+"in"},children:e(370)}),a[e(147)]("td",{className:e(144),style:{borderColor:o,height:.5*s+"in"},children:e(349)}),a.jsx("td",{className:"label-green py-1 border-2 px-1",style:{width:e(244),borderColor:o,height:.5*s+"in"},children:e(306)}),a.jsx("td",{className:e(144),style:{borderColor:o,height:.5*s+"in"},children:e(341)}),a[e(147)]("td",{className:e(144),style:{borderColor:o,height:.5*s+"in"},children:e(483)})]})]})})})]}),a[e(299)]("div",{className:"grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden",children:[a.jsxs("div",{children:[a[e(147)]("div",{className:e(465),style:{fontSize:.75*s+e(403)},children:e(137)}),a.jsx(e(385),{style:{tableLayout:e(519)},children:a[e(299)](e(286),{children:[a[e(299)]("tr",{className:e(562),children:[a.jsx("td",{className:e(213),style:{width:e(229)},children:"TERM"}),[1,2,3,4,5][e(294)](n=>a[e(147)]("td",{style:{width:e(204)},children:n},n)),a[e(147)]("td",{className:e(146),style:{width:e(262)},children:e(503)})]}),[1,2,3][e(294)](n=>a.jsxs("tr",{children:[a[e(147)]("td",{className:"row-label",children:n===1?"FIRST":e(n===2?224:263)}),[...Array(5)][e(294)]((u,h)=>a[e(147)]("td",{children:k?.[n]?.scores.ww[h]??""},h)),a[e(147)]("td",{className:e(146),children:k?.[n]?.[e(484)].ww[e(201)](0,5)[e(282)]((u,h)=>u+(Number(h)||0),0)||""})]},n))]})})]}),a[e(299)](e(191),{children:[a[e(147)](e(191),{className:"header-green py-1",style:{fontSize:.75*s+e(403)},children:e(513)}),a.jsx(e(385),{style:{tableLayout:e(519)},children:a[e(299)]("tbody",{children:[a.jsxs("tr",{className:e(562),children:[a[e(147)]("td",{className:e(213),style:{width:e(262)},children:e(301)}),[1,2,3][e(294)](n=>a[e(147)]("td",{style:{width:"20%"},children:n},n)),a.jsx("td",{className:e(146),style:{width:e(262)},children:"TOTAL"})]}),[1,2,3][e(294)](n=>a[e(299)]("tr",{children:[a.jsx("td",{className:e(253),children:e(n===1?314:n===2?224:263)}),[...Array(3)][e(294)]((u,h)=>a[e(147)]("td",{children:k?.[n]?.[e(484)].pt[h]??""},h)),a[e(147)]("td",{className:e(146),children:k?.[n]?.[e(484)].pt[e(201)](0,3)[e(282)]((u,h)=>u+(Number(h)||0),0)||""})]},n))]})})]})]}),a.jsxs(e(191),{className:e(417),children:[a.jsxs("div",{className:"col-span-1",children:[a[e(147)]("div",{className:e(465),style:{fontSize:.7*s+e(403)},children:e(564)}),a[e(147)](e(385),{style:{tableLayout:e(519)},children:a[e(299)](e(286),{children:[a.jsxs("tr",{className:"header-row-fill",children:[a[e(147)]("td",{className:e(213),style:{width:"40%"},children:e(301)}),[1,2][e(294)](n=>a[e(147)]("td",{children:n},n))]}),[1,2,3][e(294)](n=>a[e(299)]("tr",{children:[a[e(147)]("td",{className:e(253),children:e(n===1?314:n===2?224:263)}),[...Array(2)][e(294)]((u,h)=>a[e(147)]("td",{children:k?.[n]?.[e(484)].st[h]??""},h))]},n))]})})]}),a[e(147)]("div",{className:"col-span-1",children:a[e(299)](e(385),{style:{tableLayout:"fixed"},children:[a.jsx(e(323),{children:a[e(147)]("tr",{className:e(562),children:a[e(147)]("td",{colSpan:2,className:e(192),style:{fontSize:.7*s+"rem"},children:e(312)})})}),a[e(147)]("tbody",{children:[1,2,3][e(294)](n=>a[e(299)]("tr",{children:[a[e(299)]("td",{className:e(176),style:{borderColor:o},children:[e(n===1?397:n===2?274:392),e(231)]}),a[e(147)]("td",{className:e(146),children:k?.[n]?.scores.te||""})]},n))})]})}),a[e(147)](e(191),{className:e(331),children:a[e(299)](e(385),{style:{tableLayout:e(519)},children:[a[e(147)](e(323),{children:a[e(147)]("tr",{className:e(562),children:a[e(147)]("td",{colSpan:2,className:e(192),style:{fontSize:.7*s+e(403)},children:e(561)})})}),a[e(147)]("tbody",{children:[1,2,3][e(294)](n=>a[e(299)]("tr",{children:[a[e(299)]("td",{className:e(176),style:{borderColor:o},children:[n===1?"1ST":n===2?e(274):"3RD",e(231)]}),a[e(147)]("td",{className:e(146),children:k?.[n]?.[e(133)]||""})]},n))}),a.jsx(e(149),{children:a.jsx("tr",{style:{height:1.5*s+"px"},children:a[e(147)]("td",{colSpan:2,style:{border:e(454)}})})})]})}),a[e(299)](e(191),{className:e(303),style:{marginTop:J},children:[a[e(147)](e(191),{className:e(382),children:a[e(147)]("img",{src:X+e(429),alt:"DepEd Logo",className:e(374),style:{width:Z*s,height:Q*s}})}),a[e(147)]("div",{className:e(326)}),a[e(147)]("p",{className:e(240),style:{fontSize:.6*s+e(403),marginTop:14*s+"px"},children:e(425)})]})]})]}),a[e(299)](e(191),{className:"half-page-section border-t-4",style:{borderColor:o},children:[a[e(147)]("div",{className:e(534),children:e(404)}),a[e(299)](e(385),{className:"attendance-table mb-3",children:[a[e(299)]("colgroup",{children:[a[e(147)](e(125),{style:{width:e(130)}}),Array[e(539)]({length:w})[e(294)]((n,u)=>a[e(147)]("col",{style:{width:e(268)}},u)),a[e(147)](e(125),{style:{width:"7%"}})]}),a[e(147)](e(323),{children:a[e(299)]("tr",{children:[a[e(147)]("th",{className:e(502),children:"Months"}),a.jsx("th",{colSpan:w,className:e(517),children:e(296)}),a[e(147)]("th",{className:e(507),children:"Total Abs."})]})}),a.jsx(e(286),{children:[{name:e(436),dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:e(391),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:e(435),dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:e(307),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:e(291),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:e(509),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:"DECEMBER",dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:e(383),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:e(530),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:e(237),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:e(173),dates:[1,2,5,6,7,8]}][e(294)](n=>a[e(299)]("tr",{children:[a[e(147)]("td",{className:e(357),children:n[e(356)]}),i0(n[e(408)]).map((u,h)=>a[e(147)]("td",{className:e(280),style:{color:T(n[e(356)],u)?"red":e(433)},children:u},h)),a[e(147)]("td",{className:e(146),children:q[n[e(356)]]||""})]},n[e(356)]))})]}),a[e(299)](e(191),{className:e(332),style:{borderColor:o},children:[a.jsxs(e(191),{className:e(351),children:[a[e(147)](e(191),{className:e(423),children:e(328)}),[[e(279),"Opening Block: Term 1"],[e(136),e(470)],[e(419),"Term 1: Summative Test #2"],[e(264),e(390)],[e(275),e(390)],["Sept 2-15, 2026",e(388)],[e(463),e(134)]][e(294)](([n,u])=>a[e(299)](e(191),{className:e(257),children:[a[e(147)]("div",{className:e(565),children:n}),a[e(147)](e(191),{className:e(407),children:u})]},n))]}),a.jsxs(e(191),{className:"important-dates-box",children:[a.jsx("div",{className:e(423),children:e(328)}),[[e(145),e(451)],[e(315),e(520)],[e(340),e(443)],[e(375),"End-of-Term Block"],[e(212),e(251)],[e(185),e(220)],["Jan 25, 2027",e(122)]].map(([n,u])=>a[e(299)]("div",{className:e(257),children:[a[e(147)](e(191),{className:"date-val uppercase",children:n}),a[e(147)](e(191),{className:e(407),children:u})]},n))]}),a[e(299)](e(191),{className:e(351),children:[a.jsx(e(191),{className:e(423),children:"Important Dates"}),[["Feb 16, 2027",e(411)],[e(202),e(474)],[e(319),e(353)],[e(368),"End-of-Term Block"],[e(472),e(388)],[e(217),e(298)],["Apr 8, 2027",e(355)]][e(294)](([n,u])=>a.jsxs(e(191),{className:e(257),children:[a.jsx(e(191),{className:e(565),children:n}),a[e(147)](e(191),{className:"date-label uppercase",children:u})]},n))]})]})]})]})]})})};function bx(){const x=n0,{students:N,sections:g,subjects:y,teachers:A,schoolProfile:S,activeSchoolYear:b,setCurrentView:o,classRecords:k,gradingSheetRecords:D,hpsRecords:q,sf2Sheets:e}=$0(),{user:X}=xx(),[w,i0]=m[x(395)](""),[T,M]=m[x(395)](null),[p,s]=m[x(395)](""),[Y,W]=m[x(395)](1),[F,E]=m[x(395)]("#86efac"),[L,K]=m[x(395)]("#22c55e"),[v,Z]=m[x(395)](x(267)),[Q,J]=m.useState(!1),[z,B]=m[x(395)](new Set),[V,n]=m[x(395)](""),[u,h]=m[x(395)](!1),[_,C]=m[x(395)](0),[I0,$]=m[x(395)](""),j=m.useMemo(()=>{const t=x;return g[t(151)](r=>r[t(527)]===w||r.id===w)},[g,w]),O=m[x(528)](()=>{const t=x;return y[t(151)](r=>r.id===p||r[t(184)]===p)},[y,p]),A0=m[x(528)](()=>{const t=x;if(!j)return[];const r=ex(X,j,y),l=new Set;return r[t(273)](i=>{const d=t,c=w0(i[d(184)]);return l.has(c)?!1:(l[d(402)](c),!0)})},[j,y,X]),N0=m[x(528)](()=>{const t=x;if(O?.teacher_id){const r=A[t(151)](l=>l[t(491)]===O[t(271)]||l.id===O[t(271)]);if(r)return r.displayName||r[t(356)]}return j?.[t(488)]||""},[O,A,j]),t0=m[x(528)](()=>{const t=x;return[...g][t(371)]((r,l)=>{const i=t,d=(r[i(174)]||"")[i(376)](l[i(174)]||"",void 0,{numeric:!0});return d!==0?d:(r[i(527)]||"")[i(376)](l[i(527)]||"")})},[g]),L0=m[x(528)](()=>{const t=x,r={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return t0[t(531)](l=>{const i=t,d=(l[i(174)]||"")[i(162)](),c=parseInt(d.replace(/\D/g,""))||0;d[i(414)]("kinder")||c>=1&&c<=6?r[i(254)][i(559)](l):c>=7&&c<=10?r[i(321)].push(l):c>=11&&c<=12&&r["SENIOR HIGH SCHOOL"][i(559)](l)}),r},[t0]);m[x(568)](()=>{if(!w&&t0[x(533)]===1){const r=setTimeout(()=>{i0(t0[0].section_name)},0);return()=>clearTimeout(r)}},[t0,w]),m.useEffect(()=>{const t=setTimeout(()=>{s(""),M(null),B(new Set)},0);return()=>clearTimeout(t)},[w]);const R=m[x(528)](()=>{const t=x;if(!w)return[];const r=g[t(151)](l=>l[t(527)]===w||l.id===w)?.id;return N.filter(l=>l.student_section===w||r&&l[t(344)]===r)},[N,w,g]),x0=m[x(528)](()=>R[x(273)](t=>(t.gender||"")[x(162)]()==="male")[x(371)]((t,r)=>(t[x(188)]+", "+t[x(197)])[x(376)](r[x(188)]+", "+r[x(197)])),[R]),e0=m[x(528)](()=>R[x(273)](t=>(t[x(211)]||"").toLowerCase()!==x(537))[x(371)]((t,r)=>(t[x(188)]+", "+t[x(197)]).localeCompare(r[x(188)]+", "+r.first_name)),[R]),z0=()=>{const t=x;z[t(493)]===0&&R[t(533)]>0&&B(new Set(R[t(294)](r=>r.lrn))),J(!0)},f0=m[x(140)](t=>{const r=x;if(!t)return{};const l={};return e[r(273)](d=>d[r(536)]===b&&(d[r(203)]===j?.id||d[r(203)]===w))[r(531)](d=>{const c=r,P=d.attendance?.[t[c(455)]];if(P){const I=Object[c(228)](P)[c(273)](H=>H?.[c(162)]()===c(150))[c(533)];I>0&&(l[d[c(221)].toUpperCase()]=I)}}),l},[e,b,j,w]),m0=m[x(140)]((t,r,l)=>{if(!t||!r)return;const i={};return[1,2,3].forEach(d=>{const c=U,P=(f,c0)=>{const o0=U;return!!(f===l?.id||f===r||c0&&l?.[o0(184)]&&w0(c0)===w0(l.subject_name))},I=k[c(151)](f=>f.student_lrn===t[c(455)]&&f.school_year===b&&Number(f.quarter)===d&&P(f[c(369)],f[c(184)]))||D[c(151)](f=>f[c(210)]===t[c(455)]&&f[c(536)]===b&&Number(f.quarter)===d&&P(f.subject_id,f[c(184)])),H=q[c(151)](f=>P(f.subject_id,f[c(184)])&&f.school_year===b&&Number(f[c(316)])===d&&(f.section_id===t[c(344)]||j?.id&&f[c(203)]===j.id))||q[c(151)](f=>P(f[c(369)],f.subject_name)&&f[c(536)]===b&&Number(f[c(316)])===d),a0=(f,c0)=>{const o0=c,U0=Array[o0(394)](f)?f:[];return Array[o0(539)]({length:c0},(sx,J0)=>U0[J0]??"")},H0=I,G0=H,G=f=>f===""||f===null||f===void 0?"":f,j0=ax(t[c(455)],l?.id||p,d,b,k,D,q,j?.[c(174)],j?.[c(556)]);i[d]={scores:{ww:a0(I?.[c(494)],10).map(G),pt:a0(I?.[c(337)],10)[c(294)](G),st:a0(H0?.[c(426)],5).map(G),te:G(I?.[c(359)]??"")},hps:{ww:a0(H?.written_works,10)[c(294)](G),pt:a0(H?.performance_tasks,10)[c(294)](G),st:a0(G0?.[c(426)],5)[c(294)](G),te:G(H?.[c(359)]??"")},finalGrade:j0>0?j0:G(I?.final_grade??"")}}),i},[k,D,q,b,j,p]),C0=m[x(528)](()=>f0(T),[T,f0]),O0=m[x(528)](()=>m0(T,p,O),[T,p,O,m0]),k0=m[x(528)](()=>[...x0,...e0],[x0,e0]),r0=m[x(528)](()=>{const t=x;return k0[t(273)](r=>z[t(190)](r.lrn))},[k0,z]),s0=m[x(528)](()=>{const t=x;if(!V[t(269)]())return R;const r=V[t(162)]();return R[t(273)](l=>l[t(188)][t(162)]()[t(414)](r)||l[t(197)][t(162)]()[t(414)](r)||l[t(455)][t(414)](r))},[R,V]),p0=m[x(528)](()=>s0.filter(t=>(t[x(211)]||"")[x(162)]()===x(537)),[s0]),u0=m[x(528)](()=>s0.filter(t=>(t[x(211)]||"")[x(162)]()==="female"),[s0]),D0=()=>{const t=x;if(!T)return;const r=document[t(295)],l=(T[t(188)]+"_"+T[t(197)]).replace(/[^a-z0-9]/gi,"_");document.title="LIR_"+l+"_"+b,window[t(223)](),setTimeout(()=>{const i=t;document[i(295)]=r},1e3)},y0=async()=>{const t=x;if(r0.length!==0){h(!0),C(10),$(t(547));try{await new Promise(i=>setTimeout(i,400));const r=document[t(310)]("lir-bulk-render-container"),l=r?Array[t(539)](r[t(138)](t(288))):[];if(l[t(533)]===0){alert(t(333)),h(!1);return}C(50),$(t(532)+l[t(533)]+t(161)),await rx({elements:l,paperSize:v,orientation:t(448),title:t(250)+(j?.section_name||t(458))+"_"+(O?.[t(184)]||"Subject")}),C(100),$(t(480)),setTimeout(()=>{h(!1),J(!1)},600)}catch(r){console[t(542)](t(308),r),alert(t(347)),h(!1)}}},v0=async()=>{const t=x;if(r0[t(533)]!==0){h(!0),C(5),$(t(416));try{await new Promise(I=>setTimeout(I,400));const r=document[t(310)]("lir-bulk-render-container"),l=r?Array.from(r[t(138)](t(288))):[];if(l[t(533)]===0){alert(t(437)),h(!1);return}const i=(j?.[t(527)]||w||t(458)).replace(/[^a-z0-9]/gi,"_"),d=(O?.[t(184)]||t(538)).replace(/[^a-z0-9]/gi,"_"),c=t(560)+i+"_"+d+"_"+b,P=await tx({elements:l,filename:c,paperSize:v,orientation:t(448),title:c,onProgressChange:I=>{const H=t;C(I),$(H(287)+I+H(276))}});P.success?(C(100),$(t(318)),setTimeout(()=>{h(!1),J(!1)},800)):(P[t(208)]||alert(t(452)+(P[t(542)]||t(141))),h(!1))}catch(r){console[t(542)](t(206),r),alert(t(354)),h(!1)}}},_0=t=>{B(r=>{const l=U,i=new Set(r);return i[l(190)](t)?i[l(278)](t):i[l(402)](t),i})},P0=()=>{const t=x;B(new Set(R[t(294)](r=>r[t(455)])))},M0=()=>{const t=x;B(new Set(x0[t(294)](r=>r[t(455)])))},F0=()=>{const t=x;B(new Set(e0[t(294)](r=>r[t(455)])))},B0=()=>{B(new Set)};return a[x(299)](x(191),{className:x(324),children:[a[x(299)](x(191),{className:x(447),children:[a[x(147)]("div",{className:"absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30"}),a[x(299)]("div",{className:"flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden",children:[a[x(299)](x(191),{className:x(265),children:[a[x(147)]("button",{onClick:()=>o(x(363)),className:"w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200",title:x(297),children:a[x(147)](W0,{className:x(164)})}),a[x(299)](x(191),{className:x(317),children:[a[x(147)]("h2",{className:x(510),children:x(207)}),a[x(147)]("p",{className:x(446),children:x(523)})]})]}),a[x(147)](x(191),{className:x(495)}),a[x(299)](x(191),{className:x(339),children:[a[x(299)](x(247),{className:x(284),value:w,onChange:t=>{const r=x;i0(t[r(127)][r(412)]),M(null),s("")},children:[a.jsx(x(360),{value:"",children:"Choose Section"}),Object[x(338)](L0).map(([t,r])=>r.length>0&&a[x(147)](x(457),{label:t,children:r[x(294)](l=>a[x(299)](x(360),{value:l[x(527)],children:[l.section_grade_level,x(178),l[x(527)]]},l.id))},t))]}),a.jsx(d0,{className:x(445)})]}),a[x(299)]("div",{className:x(339),children:[a[x(299)](x(247),{className:x(460),value:p,onChange:t=>{const r=x;s(t.target[r(412)]),M(null)},disabled:!w,children:[a.jsx("option",{value:"",children:x(258)}),A0[x(294)](t=>a.jsx(x(360),{value:t.id,children:t[x(184)]},t.id))]}),a[x(147)](d0,{className:x(445)})]}),a[x(299)](x(191),{className:"relative group min-w-0 flex-1",children:[a[x(299)](x(247),{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200",value:T?.[x(455)]||"",onChange:t=>{const r=x,l=N[r(151)](i=>i[r(455)]===t.target[r(412)])||null;M(l)},disabled:!p,children:[a.jsx(x(360),{value:"",children:x(450)}),x0[x(533)]>0&&a[x(147)]("optgroup",{label:x(553),children:x0.map(t=>{const r=x,l=p&&(k.some(i=>i[r(210)]===t[r(455)]&&i.subject_id===p&&i[r(536)]===b)||D[r(406)](i=>i.student_lrn===t[r(455)]&&i[r(369)]===p&&i[r(536)]===b));return a[r(299)](r(360),{value:t[r(455)],children:[t[r(188)],", ",t.first_name," ",l?"✓":""]},t[r(455)])})}),e0[x(533)]>0&&a[x(147)](x(457),{label:x(345),children:e0.map(t=>{const r=x,l=p&&(k.some(i=>i.student_lrn===t[r(455)]&&i.subject_id===p&&i[r(536)]===b)||D.some(i=>i[r(210)]===t[r(455)]&&i.subject_id===p&&i[r(536)]===b));return a[r(299)](r(360),{value:t.lrn,children:[t[r(188)],", ",t[r(197)]," ",l?"✓":""]},t[r(455)])})})]}),a[x(147)](d0,{className:x(445)})]}),a[x(147)](x(191),{className:x(495)}),a.jsxs(x(191),{className:"relative group shrink-0",children:[a.jsxs(x(247),{value:v,onChange:t=>Z(t.target.value),className:x(327),title:x(544),children:[a[x(147)](x(360),{value:"a4",children:"A4"}),a[x(147)](x(360),{value:x(492),children:x(377)}),a.jsx(x(360),{value:x(267),children:x(199)})]}),a.jsx(d0,{className:x(445)})]}),a[x(299)](x(191),{className:"flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5",children:[a[x(299)](x(191),{className:x(248),title:x(469),children:[a[x(147)](x(191),{className:x(293),style:{backgroundColor:F,width:18,height:18}}),a[x(147)]("input",{type:x(175),value:F,onChange:t=>E(t[x(127)].value),className:x(468)})]}),a[x(299)](x(191),{className:x(248),title:"Choose Outline Color",children:[a.jsx("div",{className:x(293),style:{backgroundColor:L,width:18,height:18}}),a[x(147)](x(132),{type:"color",value:L,onChange:t=>K(t[x(127)].value),className:x(468)})]})]}),a[x(299)]("div",{className:x(281),children:[a[x(147)]("button",{onClick:()=>W(t=>Math[x(551)](.4,t-.1)),className:x(255),title:x(183),children:a[x(147)](V0,{className:"w-3 h-3"})}),a[x(299)](x(464),{className:x(259),children:[Math[x(477)](Y*100),"%"]}),a.jsx("button",{onClick:()=>W(t=>Math.min(1.5,t+.1)),className:x(255),title:"Zoom In",children:a[x(147)](q0,{className:x(346)})})]}),a[x(299)](x(366),{onClick:z0,disabled:!w||!p||R[x(533)]===0,className:x(322),title:x(180),children:[a.jsx(S0,{className:x(400)}),"Select (",z[x(493)],")"]}),a[x(299)]("button",{onClick:v0,disabled:!w||!p||r0.length===0,className:x(358),title:x(189),children:[a[x(147)](T0,{className:x(230)}),x(135)]}),a[x(299)]("button",{onClick:y0,disabled:!w||!p||r0[x(533)]===0,className:x(219),title:x(514),children:[a[x(147)](b0,{className:x(475)}),x(521)]}),a[x(299)]("button",{onClick:D0,disabled:!T,className:"h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(420),children:[a[x(147)](b0,{className:"w-3 h-3 group-hover:translate-y-0.5 transition-transform"}),x(516)]})]})]}),a[x(147)](x(191),{className:x(431),children:a[x(147)](x(191),{className:x(256),children:T?a[x(147)](x(191),{className:x(242),style:{transform:"scale("+Y+x(292),willChange:x(422),backfaceVisibility:x(541),WebkitBackfaceVisibility:x(541)},children:a[x(299)]("div",{className:x(373),children:[a[x(147)](x(191),{className:x(209)}),a[x(147)](x(191),{className:x(335),children:a[x(147)](R0,{pageNumber:1,student:T,profile:S,schoolYear:b,subject:O?.[x(184)]||"",teacher:N0,fillColor:F,outlineColor:L,gradeData:O0,attendanceData:C0,paperSize:v})})]})}):a.jsxs(x(191),{className:"flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10",children:[a.jsxs("div",{className:x(373),children:[a[x(147)](x(191),{className:x(233)}),a[x(299)](x(191),{className:x(399),children:[a[x(147)](X0,{className:x(290)}),a[x(299)](x(191),{className:"absolute inset-0 flex flex-col items-center justify-center",children:[a[x(147)](x(464),{className:"text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic",children:x(277)}),a[x(147)]("div",{className:x(543)})]}),a[x(147)](x(191),{className:x(170),children:a[x(147)](b0,{className:x(459)})})]})]}),a.jsxs(x(191),{className:x(155),children:[a.jsx("h2",{className:x(309),children:x(380)}),a[x(147)]("p",{className:x(410),children:"Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections."})]})]})})}),a.jsx(x(191),{id:x(501),className:x(508),style:{left:x(302)},children:r0[x(294)](t=>{const r=x,l=m0(t,p,O),i=f0(t);return a[r(147)](r(191),{className:r(334),children:a[r(147)](R0,{pageNumber:1,student:t,profile:S,schoolYear:b,subject:O?.[r(184)]||"",teacher:N0,fillColor:F,outlineColor:L,gradeData:l,attendanceData:i,paperSize:v})},t[r(455)])})}),Q&&a[x(147)](x(191),{className:x(476),children:a[x(299)](x(191),{className:x(478),children:[a[x(299)](x(191),{className:x(396),children:[a[x(299)](x(191),{className:x(167),children:[a[x(147)](x(191),{className:x(558),children:a[x(147)](S0,{className:"w-5 h-5"})}),a[x(299)](x(191),{children:[a[x(147)]("h3",{className:x(490),children:"Bulk LIR Operations"}),a[x(299)]("p",{className:x(555),children:[j?.[x(174)],x(178),j?.section_name," | ",O?.[x(184)]]})]})]}),a.jsx("button",{onClick:()=>J(!1),className:x(342),children:a[x(147)](K0,{className:"w-4 h-4"})})]}),a.jsxs(x(191),{className:x(156),children:[a[x(299)](x(191),{className:"relative flex-1 min-w-48",children:[a[x(147)](Z0,{className:x(325)}),a.jsx(x(132),{type:x(384),placeholder:"Filter learners by name or LRN...",value:V,onChange:t=>n(t[x(127)][x(412)]),className:"w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"})]}),a[x(299)](x(191),{className:x(270),children:[a.jsxs(x(366),{onClick:P0,className:x(444),children:[a[x(147)](g0,{className:"w-3 h-3 text-indigo-600"}),x(148),R.length,")"]}),a[x(299)](x(366),{onClick:M0,className:x(444),children:[x(131),x0[x(533)],")"]}),a[x(299)](x(366),{onClick:F0,className:x(444),children:[x(381),e0.length,")"]}),a.jsx(x(366),{onClick:B0,className:x(379),children:"Clear"})]})]}),a.jsxs(x(191),{className:"flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4",children:[p0[x(533)]>0&&a[x(299)]("div",{className:"space-y-2",children:[a[x(147)](x(191),{className:x(121),children:a[x(299)]("span",{className:x(283),children:["Male Learners (",p0[x(533)],")"]})}),a[x(147)]("div",{className:x(526),children:p0[x(294)](t=>{const r=x,l=z[r(190)](t[r(455)]),i=p&&(k[r(406)](d=>d[r(210)]===t[r(455)]&&d.subject_id===p&&d[r(536)]===b)||D[r(406)](d=>d.student_lrn===t[r(455)]&&d[r(369)]===p&&d.school_year===b));return a.jsxs("div",{onClick:()=>_0(t[r(455)]),className:r(142)+r(l?123:166),children:[a[r(299)](r(191),{className:"flex items-center gap-2.5 min-w-0",children:[l?a[r(147)](g0,{className:r(546)}):a[r(147)](E0,{className:r(418)}),a[r(299)](r(191),{className:r(497),children:[a[r(299)]("p",{className:r(421),children:[t[r(188)],", ",t[r(197)]," ",t[r(549)]?t[r(549)][0]+".":""]}),a[r(299)]("p",{className:r(367),children:["LRN: ",t[r(455)]]})]})]}),i&&a.jsx(r(464),{className:r(569),children:r(218)})]},t.lrn)})})]}),u0[x(533)]>0&&a[x(299)]("div",{className:x(181),children:[a.jsx(x(191),{className:x(121),children:a[x(299)]("span",{className:"text-[10px] font-black text-slate-500 uppercase tracking-widest",children:[x(522),u0.length,")"]})}),a[x(147)](x(191),{className:x(526),children:u0.map(t=>{const r=x,l=z[r(190)](t[r(455)]),i=p&&(k.some(d=>d.student_lrn===t.lrn&&d.subject_id===p&&d[r(536)]===b)||D[r(406)](d=>d[r(210)]===t.lrn&&d[r(369)]===p&&d[r(536)]===b));return a[r(299)](r(191),{onClick:()=>_0(t[r(455)]),className:"p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 "+(l?"bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm":r(166)),children:[a.jsxs(r(191),{className:r(152),children:[l?a[r(147)](g0,{className:r(546)}):a[r(147)](E0,{className:r(418)}),a[r(299)](r(191),{className:r(497),children:[a.jsxs("p",{className:r(421),children:[t[r(188)],", ",t.first_name," ",t[r(549)]?t[r(549)][0]+".":""]}),a[r(299)]("p",{className:r(367),children:["LRN: ",t[r(455)]]})]})]}),i&&a[r(147)]("span",{className:r(569),children:r(218)})]},t[r(455)])})})]}),s0[x(533)]===0&&a[x(299)]("div",{className:x(260),children:[x(365),V,'".']})]}),a[x(299)](x(191),{className:x(552),children:[a[x(299)](x(191),{className:x(194),children:[a[x(147)](x(464),{className:x(362),children:z[x(493)]}),x(232),R[x(533)],x(128)]}),a.jsxs(x(191),{className:x(243),children:[a[x(299)](x(366),{onClick:v0,disabled:z.size===0,className:x(304),children:[a[x(147)](T0,{className:x(409)}),x(285)]}),a[x(299)](x(366),{onClick:y0,disabled:z.size===0,className:x(378),children:[a.jsx(b0,{className:x(409)}),x(521)]})]})]})]})}),u&&a[x(147)]("div",{className:x(432),children:a[x(299)]("div",{className:x(187),children:[a[x(299)](x(191),{className:x(329),children:[a[x(147)]("div",{className:x(198)}),a[x(147)](x(191),{className:x(179),children:a[x(147)](Q0,{className:x(205)})})]}),a[x(299)](x(191),{className:x(181),children:[a[x(147)]("h3",{className:x(158),children:x(485)}),a.jsx("p",{className:x(139),children:I0})]}),a[x(299)](x(191),{className:x(239),children:[a[x(147)](x(191),{className:x(272),children:a.jsx(x(191),{className:x(471),style:{width:Math[x(551)](5,_)+"%"}})}),a[x(299)](x(191),{className:x(393),children:[a[x(147)](x(464),{children:x(512)}),a[x(299)](x(464),{children:[_,"%"]})]})]})]})}),a[x(147)]("style",{children:x(453)+(v==="a4"?x(430):v===x(492)?x(567):x(405))+`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `+(v==="a4"?"210mm":x(177))+` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `+x(v==="a4"?245:177)+x(222)+x(v==="a4"?245:177)+x(226)+(v==="a4"?"297mm":x(v==="letter"?466:154))+x(557)})]})}function h0(){const x=["w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform",`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50","flex items-center gap-3","img","src","absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500",`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `,`px;
                        text-align: center;
                        height: `,"APRIL","section_grade_level","color","row-label py-1 px-1 border-2","8.5in"," - ","relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30","Filter / Select Learners","space-y-2","font-bold leading-tight","Zoom Out","subject_name","Jan 4, 2027","TEACHER","bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6","last_name","Bulk Download PDF for selected learners","has","div","font-bold py-1",`rem; 
                        min-height: `,"text-xs font-bold text-slate-600","7283316EXtKVH",`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,"first_name","absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping","Folio","117047cWlOPu","slice","Mar 15-16, 2027","section_id","13%","w-8 h-8 animate-spin","Bulk PDF download error:","Learner Record","cancelled","absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000","student_lrn","gender","Dec 18, 2026","term-label","trace","w-full h-full object-cover",`px; 
                        font-size: `,"Apr 6-7, 2027","✓ Grades","h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","Start of Term 3","month",` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"print","SECOND","2260eXETtd",` !important;
                        height: `,"-11px","values","15%","w-3 h-3 group-hover:-translate-y-0.5 transition-transform"," TERM"," of ","absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full","0px","Learner's Individual Record Card",`rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,"MARCH",`;
                        color: #000000 !important;
                        font-size: `,"space-y-1.5","font-bold uppercase leading-none text-center","px ","transition-all duration-700 ease-out origin-top print:scale-100","flex items-center gap-2","40px","210mm","School Logo","select","relative flex items-center justify-center cursor-pointer shrink-0","87838TsJJLp","Bulk_LIR_","End of Term 2","half-page-section","row-label","ELEMENTARY","w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200","w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0","date-row","Select Subject","text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums","p-8 text-center text-slate-400 text-xs font-medium",`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"20%","THIRD","Aug 28, 2026","flex items-center gap-1.5 lg:gap-2 shrink-0","data-field uppercase font-bold border-2 whitespace-nowrap px-1","folio","3.32%","trim","flex items-center gap-1.5 flex-wrap","teacher_id","h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200","filter","2ND","Sept 1, 2026","% complete...","LIR","delete","June 8-11, 2026","attendance-date-cell","flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0","reduce","text-[10px] font-black text-slate-500 uppercase tracking-widest","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate","Download PDF","tbody","Processing LIR PDF pages: ",".lir-bulk-sheet","1976280jPRAye","w-28 h-28 text-slate-100 dark:text-slate-600","OCTOBER",") translateZ(0)","w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0","map","title","Dates","Back to Hub","EOSY Rites","jsxs","photo_url","TERM","-9999px","col-span-1 flex flex-col items-center justify-center pt-1","h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","143jjaWAn","M.I","SEPTEMBER","Bulk print error:","text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase","getElementById",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"TERM EXAM","PHOTO","FIRST","Oct 29, 2026","quarter","flex flex-col shrink-0","PDF download complete!","Mar 22-23, 2027",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,"JUNIOR HIGH SCHOOL","ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","thead","lir-print-root flex flex-col h-full bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white","w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400","signature-box bg-white","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200","Important Dates","relative w-16 h-16 mx-auto flex items-center justify-center",`px; 
                        font-weight: 700; 
                        font-size: `,"col-span-1","flex items-stretch border-2 w-full overflow-hidden","No sheets ready for printing. Please try again.","lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always","lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none",`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,"performance_tasks","entries","relative group min-w-0 flex-1","Dec 3-4, 2026","GRADE & SECTION","w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors","BAGONG BARRIO NATIONAL HIGH SCHOOL","student_section","FEMALE","w-3 h-3","Failed to launch bulk print.",`px;
                        width: `,"FIRST NAME",`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `,"important-dates-box","DECEMBER","Term 3 Exam (Non-Grad)","Failed to generate PDF download.","End of Term 3","name","month-col","h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","quarterly_exam","option",`;
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"text-indigo-600 font-black","school-forms",`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `,'No learners found matching "',"button","text-[9px] font-medium text-slate-400","Mar 24-31, 2027","subject_id","LAST NAME","sort","flex gap-4 items-start w-full mt-2","relative group","object-contain","Dec 7-18, 2026","localeCompare","Letter","h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1","Individual Record","Females (","mb-2","JANUARY","text","table",`px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: `,`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,"End-of-Term Block","School Year: ","Term 1 Examination","JULY","3RD","flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider","isArray","useState","px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0","1ST",`;
                        padding: `,"relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl","w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform",`; 
                        text-align: center; 
                        font-size: `,"add","rem","Daily Attendance","8.5in 13in","some","date-label uppercase","dates","w-3.5 h-3.5","text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60","Term 3: Summative Test #2","value",`44;
                        font-weight: 800;
                        font-size: `,"includes","style","Initializing vector PDF export pipeline...","grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","w-4 h-4 text-slate-300 shrink-0","July 28, 2026","Print single active learner","text-xs font-bold text-slate-800 truncate","transform","important-dates-header uppercase italic",`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,"Teacher's Signature","summative_tests","314014TGImhT","1x1 Learner Photo","deped_logo_right.png","210mm 297mm","flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200","inherit",`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `,"AUGUST","JUNE","No sheets ready for PDF export.","297mm","label-green border-2 whitespace-nowrap","font-extrabold uppercase whitespace-nowrap","45711MDIaPD",`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `,"Term 2 Examination","h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1","w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors","text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none","z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full","portrait","font-black uppercase italic","Select Learner","Term 2: Summative Test #1","Export failed: ",`
                @media print {
                    @page {
                        size: `,"none","lrn","prototype","optgroup","Section","w-10 h-10 text-white","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate",`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `,"page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none","Sept 16, 2026","span","header-green py-1","11in","font-normal ml-2","w-full h-full opacity-0 absolute inset-0 cursor-pointer","Choose Fill Color","Term 1: Summative Test #1","h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300","Apr 1-8, 2027",`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `,"Term 3 Exam (Graduating)","w-3 h-3 group-hover:scale-110 transition-transform","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200","round","bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid `,"Bulk print stream launched successfully.","school-logo.png","#86efac","LRN","scores","Processing LIR Records",`rem;
                        width: `,`; 
                        padding: `,"adviser_name",`rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `,"text-sm font-black uppercase tracking-wide text-white","uid","letter","size","written_works","h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0","student-info-table border-2","truncate","logo_url",`rem; 
                        padding: `,"#22c55e","lir-bulk-render-container","month-col uppercase","TOTAL","border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden",`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `,`; 
                        font-size: `,"absences-header uppercase","fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block","NOVEMBER","text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5","bind","Export Pipeline","PRODUCT/PERFORMANCE TASK (PPTs)","Bulk Print for selected learners",`rem; 
                        border-bottom: 2px solid `,"Print Single","dates-header-bar uppercase",`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"fixed","Term 2: Summative Test #2","Bulk Print","Female Learners (","Individual LIR",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"flex items-center justify-center bg-white overflow-hidden","grid grid-cols-1 sm:grid-cols-2 gap-2","section_name","useMemo","352KTCGxy","FEBRUARY","forEach","Opening print stream for ","length","lir-title-bar-custom mb-3 uppercase tracking-widest","5hXLuab","school_year","male","Subject","from","constructor","hidden","error","w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4","Paper Size","90WVYgEc","w-4 h-4 text-indigo-600 shrink-0","Preparing LIR sheets for bulk printing...","info","middle_name",`;
                        border-radius: 8px;
                        height: `,"max","p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0","MALE","1 X 1","text-[10px] text-slate-400 font-semibold uppercase tracking-widest","track",` !important;
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
             `,"w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400","push","LIR_","FINAL GRADE","header-row-fill","apply","SUMMATIVE TEST","date-val uppercase",`; 
                        color: black !important; 
                        font-size: `,"8.5in 11in","useEffect","px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0","986696vGshIw","flex items-center justify-between px-1","Term 3: Summative Test #1","bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm","console","col","__proto__","target"," learners selected","data-field font-extrabold border-2 whitespace-nowrap","10%","Males (","input","finalGrade","Start of Term 2","Bulk PDF","July 6, 2026","WRITTEN /ORAL WORKS (WWs)","querySelectorAll","text-xs font-semibold text-slate-500","useCallback","Unknown error","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"label-green py-1 border-2","Oct 7, 2026","font-bold","jsx","All (","tfoot","absent","find","flex items-center gap-2.5 min-w-0",`dd;
                        border: 1px solid `,"13in","space-y-4","p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0","warn","text-lg font-black text-slate-900 tracking-tight uppercase","data-field uppercase font-bold border-2 whitespace-nowrap","charAt"," learners...","toLowerCase","shrink-0 ml-auto"];return h0=function(){return x},h0()}export{bx as LIRPage};
