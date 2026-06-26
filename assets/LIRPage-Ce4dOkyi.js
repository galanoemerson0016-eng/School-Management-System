import{j as a,r as N,cn as i0,cy as q,bE as c0,c6 as o0,c9 as x0,cw as h0}from"./vendor-BhdFOiKe.js";import{b as m0,u as b0,h as p0,n as f0}from"./index-BSAuN9N-.js";import"./vendor-pdf-libs-DsGp3SWi.js";import"./vendor-firebase-Disz2AMb.js";import"./vendor-framer-motion-CC-6_ZZ2.js";const W=M;(function(e,g){const o=M,y=e();for(;;)try{if(parseInt(o(330))/1+-parseInt(o(190))/2*(-parseInt(o(265))/3)+-parseInt(o(396))/4+parseInt(o(343))/5+-parseInt(o(325))/6+parseInt(o(439))/7+-parseInt(o(375))/8===g)break;y.push(y.shift())}catch{y.push(y.shift())}})(Z,604470);const Y=(function(){let e=!0;return function(g,o){const y=e?function(){if(o){const E=o.apply(g,arguments);return o=null,E}}:function(){};return e=!1,y}})(),d0=Y(void 0,function(){const e=M,g=function(){const O=M;let c;try{c=Function(O(251)+'{}.constructor("return this")( ));')()}catch{c=window}return c},o=g(),y=o.console=o[e(208)]||{},E=[e(288),e(276),"info","error","exception",e(338),e(174)];for(let O=0;O<E[e(381)];O++){const c=Y[e(418)][e(405)][e(346)](Y),d=E[O],j=y[d]||c;c[e(281)]=Y[e(346)](Y),c.toString=j[e(250)][e(346)](j),y[d]=c}});d0();const u0=({pageNumber:e,student:g,profile:o,schoolYear:y,subject:E,teacher:O,fillColor:c=W(183),outlineColor:d=W(355),gradeData:j,paperSize:C="folio",attendanceData:J={}})=>{const x=W,G="./",u=25,V=n=>Array[M(166)]({length:u},(p,_)=>n[_]??""),v=(n,h)=>{const p=M,_=Number(h);if(!_)return!1;const B=n[p(431)]();return B===p(345)&&_===12||B==="AUGUST"&&(_===21||_===31)||B===p(437)&&(_===2||_===30)||B===p(308)&&_===8||B===p(319)&&_===1};let A="13in",f=x(211),r=1.12,H=1.2,U=.8,D=.75,k=5,R=.8,P=40,w=240,F=100,T=50,S="0px";return C==="a4"?(f=x(237),A=x(404),r=1.02,H=.85,U=.55,D=.5,k=2,R=.65,P=26,w=140,F=80,T=40):C===x(181)?(f="8.5in",A="11in",r=.98,H=.85,U=.55,D=.5,k=3,R=.7,P=28,w=160,F=65,T=32,S=x(458)):C===x(230)&&(f=x(211),A=x(479),r=.98,H=.85,U=.55,D=.5,k=3,R=.7,P=28,w=160,F=65,T=32,S="-11px"),a.jsx("div",{className:"lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0",children:a[x(469)](x(289),{className:"page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none",style:{width:f,height:A},children:[a[x(342)](x(192),{children:x(182)+f+" "+A+x(221)+d+`;
                        padding: `+8*r+x(242)+5*r+x(367)+c+x(299)+d+x(304)+3*r+x(300)+.85*r+`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `+c+x(219)+d+x(187)+.6*r+`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `+d+`;
                        padding: `+2*r+`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `+.8*r+x(194)+.6*r+x(254)+d+`;
                        padding: `+1.5*r+x(223)+24*r+x(425)+c+x(287)+.6*r+`rem;
                    }

                    .row-label {
                        background-color: `+c+`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `+.6*r+`rem;
                        width: `+70*r+x(296)+c+x(416)+d+`;
                        border-radius: 8px;
                        height: `+P*r+x(297)+w*r+x(475)+c+`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `+.9*r+x(459)+4*r+x(154)+d+`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `+d+x(363)+d+x(233)+.5*r+x(335)+21*r+x(393)+1*r+x(201)+c+`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `+.5*r+x(248)+d+x(333)+c+x(257)+.9*r+x(460)+c+x(215)+.45*r+x(357)+.5*r+`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `+d+x(160)+c+x(451)+3*r+`px; 
                        font-size: `+.85*r+`rem; 
                        border-bottom: 2px solid `+d+`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `+d+x(161)+.45*r+x(449)+18*r+x(349)+95*r+x(390)+d+x(224)+1.5*r+x(241)+4*r+x(189)+1.5*r+x(241)+4*r+x(397)+.42*r+x(484)}),a.jsxs(x(289),{className:x(340),children:[a[x(469)](x(289),{className:x(385),children:[a[x(469)]("div",{className:x(155),children:[a.jsxs(x(289),{className:x(246),children:[a.jsx("div",{className:x(440),style:{width:64*r,height:64*r},children:a[x(342)]("img",{src:o[x(206)]||G+x(168),alt:x(392),className:x(271),onError:n=>{const h=x;n[h(415)][h(438)]=G+"school-logo.png"}})}),a[x(469)](x(289),{children:[a[x(342)]("h1",{className:x(204),style:{fontSize:H*r+x(314)},children:o[x(290)]||x(365)}),a[x(342)]("p",{className:x(387),style:{fontSize:U*r+x(314),color:d},children:x(252)}),a[x(469)]("p",{className:x(339),style:{fontSize:D*r+x(314)},children:[x(209),a[x(342)](x(380),{className:x(320),children:y})]})]})]}),a[x(342)](x(289),{className:x(353),children:a[x(342)](x(338),{className:x(169),style:{borderColor:d,tableLayout:"auto"},children:a[x(342)]("tbody",{children:a.jsxs("tr",{children:[a[x(342)]("td",{className:x(269),style:{fontSize:R*r+x(314),padding:k*r+x(241)+k*4*r+"px",borderColor:d},children:x(348)}),a[x(342)]("td",{className:x(218),style:{fontSize:R*r+x(314),padding:k*r+x(241)+k*4*r+"px",borderColor:d},children:E}),a[x(342)]("td",{className:x(269),style:{fontSize:R*r+x(314),padding:k*r+x(241)+k*4*r+"px",borderColor:d},children:x(196)}),a[x(342)]("td",{className:x(218),style:{fontSize:R*r+x(314),padding:k*r+x(241)+k*4*r+"px",borderColor:d},children:O})]})})})})]}),a.jsxs(x(289),{className:x(291),children:[a.jsx(x(289),{className:x(421),style:{width:1*r+"in",height:1*r+"in",borderColor:d},children:g[x(316)]?a[x(342)](x(383),{src:g.photo_url,alt:x(255),className:x(220)}):a[x(469)]("span",{className:x(441),style:{fontSize:.7*r+x(314)},children:["1 X 1",a.jsx("br",{}),x(301)]})}),a[x(342)](x(289),{className:x(366),children:a.jsx(x(338),{className:x(293),style:{borderColor:d,height:1*r+"in"},children:a[x(469)](x(260),{children:[a.jsxs("tr",{style:{height:.5*r+"in"},children:[a[x(342)]("td",{className:x(426),style:{borderColor:d,height:.5*r+"in"},children:g[x(399)]}),a[x(342)]("td",{className:x(426),style:{borderColor:d,height:.5*r+"in"},children:g[x(323)]}),a[x(342)]("td",{className:x(202),style:{width:x(428),borderColor:d,height:.5*r+"in"},children:g[x(286)]?.charAt(0)||""}),a[x(342)]("td",{className:x(426),style:{borderColor:d,height:.5*r+"in"},children:g[x(462)]}),a[x(342)]("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:d,height:.5*r+"in"},children:g[x(402)]})]}),a.jsxs("tr",{style:{height:.5*r+"in"},children:[a[x(342)]("td",{className:x(213),style:{borderColor:d,height:.5*r+"in"},children:"LAST NAME"}),a[x(342)]("td",{className:"label-green py-1 border-2",style:{borderColor:d,height:.5*r+"in"},children:"FIRST NAME"}),a[x(342)]("td",{className:x(313),style:{width:"40px",borderColor:d,height:.5*r+"in"},children:x(283)}),a.jsx("td",{className:x(213),style:{borderColor:d,height:.5*r+"in"},children:x(329)}),a.jsx("td",{className:x(213),style:{borderColor:d,height:.5*r+"in"},children:"LRN"})]})]})})})]}),a[x(469)](x(289),{className:x(253),children:[a[x(469)]("div",{children:[a[x(342)](x(289),{className:"header-green py-1",style:{fontSize:.75*r+x(314)},children:x(436)}),a[x(342)](x(338),{style:{tableLayout:x(163)},children:a[x(469)]("tbody",{children:[a[x(469)]("tr",{className:x(481),children:[a.jsx("td",{className:x(465),style:{width:x(315)},children:"TERM"}),[1,2,3,4,5].map(n=>a[x(342)]("td",{style:{width:x(422)},children:n},n)),a[x(342)]("td",{className:x(339),style:{width:"20%"},children:x(457)})]}),[1,2,3][x(267)](n=>a[x(469)]("tr",{children:[a[x(342)]("td",{className:x(197),children:x(n===1?368:n===2?306:295)}),[...Array(5)].map((h,p)=>a[x(342)]("td",{children:j?.[n]?.[x(442)].ww[p]??""},p)),a.jsx("td",{className:x(339),children:j?.[n]?.[x(442)].ww[x(468)](0,5)[x(309)]((h,p)=>h+(Number(p)||0),0)||""})]},n))]})})]}),a[x(469)](x(289),{children:[a[x(342)](x(289),{className:"header-green py-1",style:{fontSize:.75*r+x(314)},children:x(386)}),a[x(342)]("table",{style:{tableLayout:x(163)},children:a[x(469)]("tbody",{children:[a.jsxs("tr",{className:x(481),children:[a[x(342)]("td",{className:x(465),style:{width:"20%"},children:x(446)}),[1,2,3].map(n=>a.jsx("td",{style:{width:x(321)},children:n},n)),a[x(342)]("td",{className:x(339),style:{width:x(321)},children:x(457)})]}),[1,2,3][x(267)](n=>a.jsxs("tr",{children:[a.jsx("td",{className:"row-label",children:n===1?x(368):n===2?"SECOND":x(295)}),[...Array(3)][x(267)]((h,p)=>a[x(342)]("td",{children:j?.[n]?.scores.pt[p]??""},p)),a[x(342)]("td",{className:x(339),children:j?.[n]?.[x(442)].pt[x(468)](0,3).reduce((h,p)=>h+(Number(p)||0),0)||""})]},n))]})})]})]}),a[x(469)](x(289),{className:"grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden",children:[a.jsxs("div",{className:"col-span-1",children:[a[x(342)]("div",{className:x(261),style:{fontSize:.7*r+x(314)},children:x(186)}),a.jsx(x(338),{style:{tableLayout:"fixed"},children:a[x(469)]("tbody",{children:[a.jsxs("tr",{className:x(481),children:[a[x(342)]("td",{className:"term-label",style:{width:"40%"},children:x(446)}),[1,2][x(267)](n=>a[x(342)]("td",{children:n},n))]}),[1,2,3][x(267)](n=>a[x(469)]("tr",{children:[a[x(342)]("td",{className:x(197),children:n===1?"FIRST":n===2?"SECOND":x(295)}),[...Array(2)][x(267)]((h,p)=>a.jsx("td",{children:j?.[n]?.[x(442)].st[p]??""},p))]},n))]})})]}),a[x(342)](x(289),{className:x(370),children:a[x(469)](x(338),{style:{tableLayout:x(163)},children:[a[x(342)]("thead",{children:a[x(342)]("tr",{className:"header-row-fill",children:a[x(342)]("td",{colSpan:2,className:"font-bold py-1",style:{fontSize:.7*r+x(314)},children:"TERM EXAM"})})}),a[x(342)](x(260),{children:[1,2,3].map(n=>a[x(469)]("tr",{children:[a[x(469)]("td",{className:x(258),style:{borderColor:d},children:[n===1?x(225):n===2?"2ND":x(270)," TERM"]}),a[x(342)]("td",{className:"font-bold",children:j?.[n]?.[x(442)].te||""})]},n))})]})}),a.jsx(x(289),{className:x(370),children:a[x(469)]("table",{style:{tableLayout:"fixed"},children:[a[x(342)]("thead",{children:a[x(342)]("tr",{className:x(481),children:a.jsx("td",{colSpan:2,className:x(280),style:{fontSize:.7*r+"rem"},children:x(273)})})}),a[x(342)](x(260),{children:[1,2,3][x(267)](n=>a[x(469)]("tr",{children:[a[x(469)]("td",{className:x(258),style:{borderColor:d},children:[n===1?x(225):n===2?"2ND":x(270),x(382)]}),a[x(342)]("td",{className:x(339),children:j?.[n]?.[x(376)]||""})]},n))}),a[x(342)](x(207),{children:a.jsx("tr",{style:{height:1.5*r+"px"},children:a.jsx("td",{colSpan:2,style:{border:"none"}})})})]})}),a[x(469)](x(289),{className:x(444),style:{marginTop:S},children:[a[x(342)](x(289),{className:"mb-2",children:a[x(342)](x(383),{src:G+x(359),alt:"DepEd Logo",className:"object-contain",style:{width:F*r,height:T*r}})}),a[x(342)]("div",{className:x(336)}),a[x(342)]("p",{className:x(177),style:{fontSize:.6*r+x(314),marginTop:14*r+"px"},children:x(423)})]})]})]}),a[x(469)](x(289),{className:x(450),style:{borderColor:d},children:[a[x(342)](x(289),{className:"lir-title-bar-custom mb-3 uppercase tracking-widest",children:x(432)}),a[x(469)](x(338),{className:x(373),children:[a[x(469)](x(471),{children:[a.jsx(x(278),{style:{width:"10%"}}),Array.from({length:u})[x(267)]((n,h)=>a[x(342)](x(278),{style:{width:x(272)}},h)),a[x(342)](x(278),{style:{width:"7%"}})]}),a[x(342)](x(229),{children:a[x(469)]("tr",{children:[a[x(342)]("th",{className:x(388),children:x(244)}),a[x(342)]("th",{colSpan:u,className:x(372),children:x(455)}),a[x(342)]("th",{className:x(347),children:x(358)})]})}),a[x(342)]("tbody",{children:[{name:"JUNE",dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:x(327),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:"AUGUST",dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:x(331),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:x(236),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:x(437),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:x(308),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:x(319),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:"FEBRUARY",dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:"MARCH",dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:x(178),dates:[1,2,5,6,7,8]}][x(267)](n=>a[x(469)]("tr",{children:[a[x(342)]("td",{className:x(231),children:n[x(290)]}),V(n[x(477)])[x(267)]((h,p)=>a[x(342)]("td",{className:x(318),style:{color:v(n.name,h)?x(398):x(226)},children:h},p)),a[x(342)]("td",{className:x(339),children:J[n[x(290)]]||""})]},n[x(290)]))})]}),a[x(469)]("div",{className:x(361),style:{borderColor:d},children:[a.jsxs("div",{className:x(263),children:[a[x(342)](x(289),{className:x(199),children:x(371)}),[["June 8-11, 2026","Opening Block: Term 1"],[x(247),"Term 1: Summative Test #1"],["July 28, 2026",x(470)],["Aug 28, 2026",x(217)],[x(277),x(217)],[x(334),"End-of-Term Block"],["Sept 16, 2026",x(198)]][x(267)](([n,h])=>a[x(469)]("div",{className:x(445),children:[a[x(342)](x(289),{className:x(212),children:n}),a[x(342)](x(289),{className:x(279),children:h})]},n))]}),a.jsxs("div",{className:x(263),children:[a[x(342)]("div",{className:x(199),children:x(371)}),[["Oct 7, 2026",x(483)],[x(179),x(203)],[x(162),x(303)],["Dec 7-18, 2026",x(266)],["Dec 18, 2026","End of Term 2"],["Jan 4, 2027",x(337)],["Jan 25, 2027",x(282)]].map(([n,h])=>a[x(469)](x(289),{className:x(445),children:[a[x(342)](x(289),{className:x(212),children:n}),a[x(342)]("div",{className:"date-label uppercase",children:h})]},n))]}),a[x(469)](x(289),{className:x(263),children:[a[x(342)](x(289),{className:"important-dates-header uppercase italic",children:x(371)}),[["Feb 16, 2027",x(435)],[x(322),x(232)],[x(464),x(472)],[x(377),"End-of-Term Block"],["Apr 1-8, 2027","End-of-Term Block"],[x(326),x(195)],[x(180),x(351)]][x(267)](([n,h])=>a[x(469)]("div",{className:x(445),children:[a[x(342)](x(289),{className:x(212),children:n}),a[x(342)](x(289),{className:"date-label uppercase",children:h})]},n))]})]})]})]})]})})};function M(e,g){return e=e-154,Z()[e]}function j0(){const e=W,{students:g,sections:o,subjects:y,teachers:E,schoolProfile:O,activeSchoolYear:c,setCurrentView:d,classRecords:j,gradingSheetRecords:C,hpsRecords:J,sf2Sheets:x}=m0(),{user:G}=b0(),[u,V]=N[e(400)](""),[v,A]=N[e(400)](null),[f,r]=N[e(400)](""),[H,U]=N[e(400)](1),[D,k]=N[e(400)]("#86efac"),[R,P]=N[e(400)](e(355)),[w,F]=N[e(400)](e(230)),T=N[e(395)](()=>{const t=e;return o[t(379)](s=>s[t(235)]===u||s.id===u)},[o,u]),S=N.useMemo(()=>y[e(379)](s=>s.id===f||s.subject_name===f),[y,f]),n=N[e(395)](()=>{const t=e;if(!T)return[];const s=p0(G,T,y),i=new Set;return s[t(317)](l=>{const m=t,I=f0(l[m(157)]);return i.has(I)?!1:(i[m(485)](I),!0)})},[T,y,G]),h=N[e(395)](()=>{const t=e;if(S?.[t(362)]){const s=E[t(379)](i=>i[t(164)]===S[t(362)]||i.id===S[t(362)]);if(s)return s[t(378)]||s[t(290)]}return T?.[t(328)]||""},[S,E,T]),p=()=>{const t=e;if(!v)return;const s=document.title,i=(v[t(399)]+"_"+v[t(323)])[t(264)](/[^a-z0-9]/gi,"_");document[t(268)]=t(410)+i+"_"+c,window[t(389)](),setTimeout(()=>{document.title=s},1e3)},_=N[e(395)](()=>[...o].sort((t,s)=>{const i=M,l=(t[i(302)]||"").localeCompare(s[i(302)]||"",void 0,{numeric:!0});return l!==0?l:(t[i(235)]||"")[i(344)](s.section_name||"")}),[o]),B=N[e(395)](()=>{const t={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return _.forEach(s=>{const i=M,l=(s[i(302)]||"")[i(214)](),m=parseInt(l.replace(/\D/g,""))||0;l.includes(i(394))||m>=1&&m<=6?t[i(173)][i(259)](s):m>=7&&m<=10?t["JUNIOR HIGH SCHOOL"].push(s):m>=11&&m<=12&&t[i(443)].push(s)}),t},[_]);N[e(478)](()=>{if(!u&&_.length===1){const t=setTimeout(()=>{const s=M;V(_[0][s(235)])},0);return()=>clearTimeout(t)}},[_,u]),N[e(478)](()=>{const t=setTimeout(()=>{r(""),A(null)},0);return()=>clearTimeout(t)},[u]);const K=N.useMemo(()=>{const t=e;if(!u)return[];const s=o[t(379)](i=>i.section_name===u||i.id===u)?.id;return g[t(317)](i=>i[t(462)]===u||s&&i[t(462)]===s)},[g,u,o]),Q=K[e(317)](t=>(t[e(454)]||"")[e(214)]()===e(175)).sort((t,s)=>t[e(399)][e(344)](s[e(399)])),$=K.filter(t=>(t.gender||"")[e(214)]()===e(275)).sort((t,s)=>t[e(399)].localeCompare(s[e(399)])),e0=N[e(395)](()=>{const t=e;if(!v)return{};const s={};return x[t(317)](l=>l[t(305)]===c&&(l.section_id===T?.id||l.section_id===u))[t(184)](l=>{const m=t,I=l.attendance?.[v[m(402)]];if(I){const z=Object[m(411)](I)[m(317)](X=>X?.[m(214)]()===m(262))[m(381)];z>0&&(s[l[m(369)][m(431)]()]=z)}}),s},[v,x,c,T,u]),a0=N[e(395)](()=>{const t=e;if(!v||!f)return;const s={};return[1,2,3][t(184)](i=>{const l=t,m=j[l(379)](b=>b.student_lrn===v[l(402)]&&b[l(305)]===c&&Number(b.quarter)===i&&(b[l(239)]===S?.id||b[l(239)]===f))||C[l(379)](b=>b[l(222)]===v[l(402)]&&b[l(305)]===c&&Number(b[l(480)])===i&&(b[l(239)]===S?.id||b.subject_id===f)),I=J[l(379)](b=>(b[l(239)]===S?.id||b[l(239)]===f)&&b.school_year===c&&Number(b[l(480)])===i),z=(b,r0)=>{const s0=l,l0=Array.isArray(b)?b:[];return Array[s0(166)]({length:r0},(g0,n0)=>l0[n0]??"")},X=m,t0=I,L=b=>b===""||b===null||b===void 0?"":b;s[i]={scores:{ww:z(m?.[l(448)],10)[l(267)](L),pt:z(m?.[l(424)],10)[l(267)](L),st:z(X?.summative_tests,5)[l(267)](L),te:L(m?.[l(354)]??"")},hps:{ww:z(I?.[l(448)],10).map(L),pt:z(I?.[l(424)],10)[l(267)](L),st:z(t0?.[l(324)],5)[l(267)](L),te:L(I?.quarterly_exam??"")},finalGrade:L(m?.[l(452)]??"")}}),s},[v,f,S,j,C,J,c]);return a[e(469)](e(289),{className:"lir-print-root flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white",children:[a.jsxs(e(289),{className:e(473),children:[a[e(342)](e(289),{className:"absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30"}),a.jsxs(e(289),{className:"flex items-center justify-start w-full h-16 select-none relative px-3 lg:px-4 gap-2 lg:gap-3 overflow-x-auto scrollbar-none",children:[a[e(469)](e(289),{className:e(245),children:[a.jsx(e(243),{onClick:()=>d("school-forms"),className:e(185),title:e(427),children:a[e(342)](i0,{className:e(447)})}),a[e(469)]("div",{className:e(176),children:[a[e(342)]("h2",{className:e(310),children:"Learner Record"}),a[e(342)]("p",{className:e(474),children:e(409)})]})]}),a[e(342)](e(289),{className:"h-6 w-px bg-slate-200 shrink-0 mx-0.5"}),a[e(469)]("div",{className:e(311),children:[a.jsxs(e(332),{className:e(463),value:u,onChange:t=>{const s=e;V(t[s(415)][s(434)]),A(null),r("")},children:[a[e(342)](e(256),{value:"",children:e(466)}),Object.entries(B)[e(267)](([t,s])=>s[e(381)]>0&&a[e(342)](e(165),{label:t,children:s.map(i=>a.jsxs(e(256),{value:i[e(235)],children:[i[e(302)],e(430),i[e(235)]]},i.id))},t))]}),a.jsx(q,{className:e(205)})]}),a.jsxs(e(289),{className:e(311),children:[a[e(469)]("select",{className:e(407),value:f,onChange:t=>{const s=e;r(t[s(415)][s(434)]),A(null)},disabled:!u,children:[a[e(342)](e(256),{value:"",children:"Select Subject"}),n[e(267)](t=>a[e(342)](e(256),{value:t.id,children:t[e(157)]},t.id))]}),a.jsx(q,{className:e(205)})]}),a[e(469)](e(289),{className:"relative group shrink-0",children:[a[e(469)]("select",{className:e(238),value:v?.[e(402)]||"",onChange:t=>{const s=e,i=g[s(379)](l=>l[s(402)]===t[s(415)].value)||null;A(i)},disabled:!f,children:[a[e(342)](e(256),{value:"",children:e(476)}),Q[e(381)]>0&&a[e(342)](e(165),{label:e(188),children:Q[e(267)](t=>{const s=e,i=f&&(j[s(461)](l=>l[s(222)]===t[s(402)]&&l[s(239)]===f&&l.school_year===c)||C[s(461)](l=>l[s(222)]===t[s(402)]&&l[s(239)]===f&&l[s(305)]===c));return a.jsxs(s(256),{value:t[s(402)],children:[t[s(399)],", ",t.first_name," ",i?"✓":""]},t[s(402)])})}),$[e(381)]>0&&a.jsx(e(165),{label:"FEMALE",children:$[e(267)](t=>{const s=e,i=f&&(j[s(461)](l=>l[s(222)]===t[s(402)]&&l.subject_id===f&&l[s(305)]===c)||C[s(461)](l=>l[s(222)]===t[s(402)]&&l[s(239)]===f&&l[s(305)]===c));return a.jsxs("option",{value:t[s(402)],children:[t.last_name,", ",t.first_name," ",i?"✓":""]},t.lrn)})})]}),a[e(342)](q,{className:"w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors"})]}),a.jsx(e(289),{className:e(210)}),a.jsxs(e(289),{className:e(311),children:[a.jsxs(e(332),{value:w,onChange:t=>F(t.target[e(434)]),className:"appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer min-w-[70px] lg:min-w-[80px] duration-200",title:e(240),children:[a[e(342)](e(256),{value:"a4",children:"A4"}),a[e(342)](e(256),{value:e(181),children:e(172)}),a[e(342)](e(256),{value:e(230),children:e(403)})]}),a[e(342)](q,{className:"w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors"})]}),a.jsx(e(289),{className:e(210)}),a[e(469)]("div",{className:e(200),children:[a[e(469)](e(289),{className:e(285),title:e(419),children:[a[e(342)](e(289),{className:e(406),style:{backgroundColor:D}}),a.jsx(e(364),{type:e(352),value:D,onChange:t=>k(t.target.value),className:e(216)})]}),a[e(469)](e(289),{className:"relative flex items-center justify-center cursor-pointer shrink-0",title:e(292),children:[a[e(342)](e(289),{className:"w-5 h-5 rounded-lg border border-slate-200 shadow-sm shrink-0",style:{backgroundColor:R}}),a[e(342)](e(364),{type:"color",value:R,onChange:t=>P(t.target[e(434)]),className:e(216)})]})]}),a.jsx(e(289),{className:e(210)}),a.jsxs(e(289),{className:e(360),children:[a.jsx(e(243),{onClick:()=>U(t=>Math[e(414)](.4,t-.1)),className:e(420),title:e(274),children:a.jsx(c0,{className:e(312)})}),a[e(469)](e(380),{className:e(228),children:[Math[e(391)](H*100),"%"]}),a[e(342)](e(243),{onClick:()=>U(t=>Math[e(408)](1.5,t+.1)),className:e(420),title:e(298),children:a[e(342)](o0,{className:"w-3.5 h-3.5"})})]}),a[e(342)](e(289),{className:e(210)}),a[e(469)](e(243),{onClick:p,disabled:!v,className:e(374),children:[a[e(342)](x0,{className:e(249)}),e(401)]})]})]}),a.jsx(e(289),{className:e(486),children:a[e(342)](e(289),{className:e(191),children:v?a[e(342)](e(289),{className:e(170),style:{transform:e(158)+H+e(307),willChange:e(171),backfaceVisibility:e(453),WebkitBackfaceVisibility:e(453)},children:a[e(469)](e(289),{className:e(482),children:[a[e(342)]("div",{className:e(193)}),a[e(342)](e(289),{className:e(429),children:a[e(342)](u0,{pageNumber:1,student:v,profile:O,schoolYear:c,subject:S?.[e(157)]||"",teacher:h,fillColor:D,outlineColor:R,gradeData:a0,attendanceData:e0,paperSize:w})})]})}):a[e(469)](e(289),{className:e(294),children:[a[e(469)](e(289),{className:e(482),children:[a[e(342)](e(289),{className:e(159)}),a[e(469)](e(289),{className:"relative w-64 h-64 bg-white rounded-[5rem] border border-slate-200 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl",children:[a[e(342)](h0,{className:e(156)}),a.jsxs(e(289),{className:e(234),children:[a[e(342)](e(380),{className:"text-7xl font-black text-slate-100 tracking-tighter leading-none italic",children:"LIR"}),a.jsx(e(289),{className:e(433)})]}),a[e(342)](e(289),{className:"absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 group-hover:rotate-12 transition-all duration-500",children:a[e(342)](x0,{className:"w-10 h-10 text-white"})})]})]}),a[e(469)]("div",{className:e(456),children:[a[e(342)]("h2",{className:e(356),children:"Individual Record"}),a.jsx("p",{className:e(284),children:e(467)})]})]})})}),a[e(342)](e(192),{children:e(412)+(w==="a4"?"210mm 297mm":w===e(181)?e(350):e(167))+`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `+e(w==="a4"?237:211)+e(417)+(w==="a4"?e(404):w===e(181)?"11in":"13in")+e(413)+(w==="a4"?"210mm":"8.5in")+e(417)+(w==="a4"?e(404):w===e(181)?e(341):e(479))+e(227)+(w==="a4"?"210mm":"8.5in")+e(417)+(w==="a4"?e(404):w===e(181)?e(341):"13in")+e(384)})]})}function Z(){const e=[`; 
                        font-size: `,"Dec 3-4, 2026","fixed","uid","optgroup","from","8.5in 13in","school-logo.png","border-collapse border-2","transition-all duration-700 ease-out origin-top print:scale-100","transform","Letter","ELEMENTARY","trace","male","flex flex-col shrink-0","font-bold uppercase leading-none text-center","APRIL","Oct 29, 2026","Apr 8, 2027","letter",`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"#86efac","forEach","w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all group shrink-0 active:scale-95 duration-200","SUMMATIVE TEST",`;
                        font-size: `,"MALE",`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,"420118dVzXQd","w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0","style","absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000",`rem;
                        vertical-align: middle;
                        background-color: white;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,"EOSY Rites","TEACHER","row-label","Start of Term 2","important-dates-header uppercase italic","flex gap-1.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 h-9 shrink-0 items-center px-2",`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `,"data-field uppercase font-bold border-2 whitespace-nowrap px-1","Term 2: Summative Test #2","font-extrabold uppercase whitespace-nowrap","w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors","logo_url","tfoot","console","School Year: ","h-6 w-px bg-slate-200 shrink-0 mx-0.5","8.5in","date-val uppercase","label-green py-1 border-2","toLowerCase",`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `,"w-5 h-5 opacity-0 absolute inset-0 cursor-pointer","Term 1 Examination","data-field font-extrabold border-2 whitespace-nowrap",`dd;
                        border: 1px solid `,"w-full h-full object-cover",`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        border: 4px solid `,"student_lrn",`px;
                        text-align: center;
                        height: `,`; 
                        padding: `,"1ST","inherit",` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"text-[9px] font-black text-slate-900 w-8 text-center tabular-nums","thead","folio","month-col","Term 3 Exam (Graduating)",`; 
                        text-align: center; 
                        font-size: `,"absolute inset-0 flex flex-col items-center justify-center","section_name","OCTOBER","210mm","appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[140px] lg:min-w-[160px] max-w-[200px] truncate disabled:opacity-30 duration-200","subject_id","Paper Size","px ",`px;
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
                        padding: `,"button","Months","flex items-center gap-2 lg:gap-3 shrink-0","flex items-center gap-4 shrink-0","July 6, 2026",`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `,"w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform","toString","return (function() ","Learner's Individual Record Card","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden",`rem;
                        table-layout: fixed;
                    }

                    th, td {
                        border: 1px solid `,"1x1 Learner Photo","option",`; 
                        color: black !important; 
                        font-size: `,"row-label py-1 px-1 border-2","push","tbody","header-green py-1","absent","important-dates-box","replace","9hsIGdU","End-of-Term Block","map","title","label-green border-2 whitespace-nowrap","3RD","max-w-full max-h-full object-contain","3.32%","FINAL GRADE","Zoom Out","female","warn","Sept 1, 2026","col","date-label uppercase","font-bold py-1","__proto__","Term 3: Summative Test #1","M.I","text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60","relative flex items-center justify-center cursor-pointer shrink-0","middle_name",`44;
                        font-weight: 800;
                        font-size: `,"log","div","name","flex gap-4 items-start w-full mt-2","Choose Outline Color","student-info-table border-2","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10","THIRD",`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,`px;
                        width: `,"Zoom In",`;
                        border: 1px solid `,`px;
                        font-size: `,"PHOTO","section_grade_level","Term 2 Examination",`;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"school_year","SECOND",") translateZ(0)","DECEMBER","reduce","text-[11px] lg:text-[12px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1","relative group shrink-0","w-3.5 h-3.5","label-green py-1 border-2 px-1","rem","15%","photo_url","filter","attendance-date-cell","JANUARY","font-normal ml-2","20%","Mar 15-16, 2027","first_name","summative_tests","3550278IpFmbO","Apr 6-7, 2027","JULY","adviser_name","GRADE & SECTION","522966HcVYtK","SEPTEMBER","select",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,"Sept 2-15, 2026",`rem; 
                        font-weight: 700; 
                        height: `,"signature-box bg-white","Start of Term 3","table","font-bold","card-container-combined print:m-0 print:shadow-none","11in","jsx","5761185YEkfYh","localeCompare","JUNE","bind","absences-header uppercase","SUBJECT",`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `,"8.5in 11in","End of Term 3","color","w-auto ml-4 overflow-hidden","quarterly_exam","#22c55e","text-4xl font-black text-slate-900 tracking-tight uppercase",`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,"Total Abs.","deped_logo_right.png","flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 h-9 shrink-0","flex items-stretch border-2 w-full overflow-hidden","teacher_id",`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `,"input","BAGONG BARRIO NATIONAL HIGH SCHOOL","grow flex flex-col gap-1 overflow-hidden",`px 0;
                        width: 100%;
                    }

                    .header-green {
                        background-color: `,"FIRST","month","col-span-1","Important Dates","dates-header-bar uppercase","attendance-table mb-3","h-9 px-3.5 lg:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8.5px] uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200","10240000vZqjPA","finalGrade","Mar 24-31, 2027","displayName","find","span","length"," TERM","img",` !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                }
             `,"half-page-section","PRODUCT/PERFORMANCE TASK (PPTs)","font-black uppercase italic","month-col uppercase","print",`px; 
                        border-right: 1px solid `,"round","School Logo",`px; 
                        padding: `,"kinder","useMemo","3531204CXcxIC",`px; 
                        font-weight: 700; 
                        font-size: `,"red","last_name","useState","Print / PDF","lrn","Folio","297mm","prototype","w-5 h-5 rounded-lg border border-slate-200 shadow-sm shrink-0","appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer min-w-[130px] lg:min-w-[145px] disabled:opacity-30 duration-200","min","Individual LIR","LIR_","values",`
                @media print {
                    @page {
                        size: `,` !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `,"max","target",`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `,` !important;
                        height: `,"constructor","Choose Fill Color","w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all active:scale-90 duration-200","border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden","13%","Teacher's Signature","performance_tasks",`px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .term-label {
                        color: #ef4444;
                        background-color: `,"data-field uppercase font-bold border-2 whitespace-nowrap","Back to Hub","40px","lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none"," - ","toUpperCase","Daily Attendance","w-20 h-1 bg-emerald-500/10 rounded-full mt-4","value","Term 3: Summative Test #2","WRITTEN /ORAL WORKS (WWs)","NOVEMBER","src","7375228ZiTrUV","flex items-center justify-center bg-white overflow-hidden","font-bold leading-tight","scores","SENIOR HIGH SCHOOL","col-span-1 flex flex-col items-center justify-center pt-1","date-row","TERM","w-4 h-4 group-hover:-translate-x-0.5 transition-transform","written_works",`rem; 
                        min-height: `,"half-page-section border-t-4",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,"final_grade","hidden","gender","Dates","space-y-4","TOTAL","-11px",`rem; 
                        padding: `,`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"some","student_section","appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[120px] lg:min-w-[135px] duration-200","Mar 22-23, 2027","term-label","Choose Section","Select a learner from the toolbar above to preview their individual record card.","slice","jsxs","Term 1: Summative Test #2","colgroup","Term 3 Exam (Non-Grad)","z-20 bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm sticky top-0 print:hidden shrink-0 w-full","text-[7.5px] font-black text-emerald-600 uppercase tracking-widest leading-none",`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"Select Learner","dates","useEffect","13in","quarter","header-row-fill","relative group","Term 2: Summative Test #1",`rem; 
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
                `,"add","flex-1 overflow-auto relative bg-slate-100 print:bg-white custom-scrollbar",`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `,"flex justify-between items-center w-full overflow-hidden","w-28 h-28 text-slate-100","subject_name","scale(","absolute -inset-24 bg-emerald-500/5 blur-[120px] rounded-full",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `];return Z=function(){return e},Z()}export{j0 as LIRPage};
