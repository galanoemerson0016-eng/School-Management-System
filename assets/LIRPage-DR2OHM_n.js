import{L as a,K as f,cz as V0,bM as c0,cM as W0,cj as Z0,bi as T0,bU as E0,cl as o0,cL as K0,bw as Q0,cI as X0,cO as g0,cP as R0,bJ as $0}from"./vendor-B1YpQqzi.js";import{b as xx,u as ex,Y as ax,F as w0,ao as tx}from"./index-FdNz-uE5.js";import{e as rx,p as sx}from"./pdf-export-Du-MyD1W.js";import"./vendor-pdf-libs-C8YZTzPR.js";import"./vendor-firebase-B2Ov03bZ.js";import"./vendor-framer-motion-OGGkbh84.js";const N0=U;(function(x,N){const g=U,y=x();for(;;)try{if(parseInt(g(408))/1+parseInt(g(448))/2*(parseInt(g(411))/3)+-parseInt(g(431))/4*(parseInt(g(671))/5)+-parseInt(g(655))/6+parseInt(g(515))/7*(-parseInt(g(592))/8)+parseInt(g(652))/9*(parseInt(g(678))/10)+parseInt(g(554))/11===N)break;y.push(y.shift())}catch{y.push(y.shift())}})(h0,524636);function U(x,N){return x=x-384,h0()[x]}const l0=(function(){let x=!0;return function(N,g){const y=x?function(){const S=U;if(g){const z=g[S(692)](N,arguments);return g=null,z}}:function(){};return x=!1,y}})(),q0=l0(void 0,function(){const x=U;let N;try{N=Function(x(452)+x(462)+");")()}catch{N=window}const g=N[x(651)]=N[x(651)]||{},y=[x(423),x(478),"info",x(640),x(469),x(816),x(413)];for(let S=0;S<y.length;S++){const z=l0.constructor[x(799)][x(681)](l0),b=y[S],c=g[b]||z;z[x(673)]=l0.bind(l0),z[x(747)]=c.toString[x(681)](c),g[b]=z}});q0();const I0=({pageNumber:x,student:N,profile:g,schoolYear:y,subject:S,teacher:z,fillColor:b=N0(533),outlineColor:c="#22c55e",gradeData:T,paperSize:M="folio",attendanceData:W={}})=>{const e=N0,Z="./",w=25,d0=d=>Array[U(644)]({length:w},(h,_)=>d[_]??""),E=(d,u)=>{const h=U,_=Number(u);if(!_)return!1;const O=d[h(577)]();return O===h(510)&&_===12||O===h(398)&&(_===21||_===31)||O===h(434)&&(_===2||_===30)||O===h(718)&&_===8||O===h(754)&&_===1};let P=e(789),p=e(590),s=1.12,Y=1.2,q=.8,F=.75,R=5,A=.8,K=40,v=240,Q=100,X=50,J=e(555);M==="a4"?(p="210mm",P=e(538),s=1.02,Y=.85,q=.55,F=.5,R=2,A=.65,K=26,v=140,Q=80,X=40):M===e(404)?(p=e(590),P=e(804),s=.98,Y=.85,q=.55,F=.5,R=3,A=.7,K=28,v=160,Q=65,X=32,J=e(762)):M===e(451)&&(p=e(590),P="13in",s=.98,Y=.85,q=.55,F=.5,R=3,A=.7,K=28,v=160,Q=65,X=32,J=e(762));const L=(d,u)=>{const h=e,_=(d||"")[h(676)]();return _.length>32?u*.65:_[h(405)]>24?u*.78:_.length>16?u*.88:u},H=L(S,A*s),V=L(z,A*s);return a.jsx("div",{className:e(778),children:a[e(719)](e(797),{className:e(571),style:{width:p,height:P},children:[a[e(730)](e(482),{children:e(467)+p+" "+P+`; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid `+c+e(633)+8*s+e(541)+5*s+e(512)+b+e(523)+c+e(630)+3*s+`px;
                        font-size: `+.85*s+e(424)+b+`dd;
                        border: 1px solid `+c+e(611)+.6*s+e(401)+c+e(633)+2*s+e(665)+.8*s+e(610)+.6*s+e(388)+c+e(633)+1.5*s+e(548)+24*s+e(484)+b+`44;
                        font-weight: 800;
                        font-size: `+.6*s+`rem;
                    }

                    .row-label {
                        background-color: `+b+`cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: `+.6*s+e(455)+70*s+e(506)+b+`99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid `+c+e(593)+K*s+`px;
                        width: `+v*s+e(596)+b+e(812)+.9*s+e(392)+4*s+e(667)+c+`; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid `+c+`; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid `+c+e(583)+.5*s+e(661)+21*s+e(803)+1*s+e(649)+b+`; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: `+.5*s+e(522)+c+e(521)+b+e(650)+.9*s+e(564)+b+e(420)+.45*s+e(495)+.5*s+e(645)+c+e(535)+b+e(695)+3*s+e(463)+.85*s+e(805)+c+e(714)+c+`; 
                        font-size: `+.45*s+e(801)+18*s+`px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: `+95*s+`px; 
                        border-right: 1px solid `+c+e(490)+1.5*s+e(820)+4*s+e(685)+1.5*s+e(820)+4*s+`px; 
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
                `}),a[e(719)]("div",{className:e(634),children:[a[e(719)](e(797),{className:e(791),children:[a[e(719)](e(797),{className:e(693),children:[a[e(719)](e(797),{className:e(729),children:[a[e(730)]("div",{className:"flex items-center justify-center bg-white overflow-hidden",style:{width:64*s,height:64*s},children:a[e(730)](e(713),{src:g[e(391)]||Z+"school-logo.png",alt:e(788),className:"max-w-full max-h-full object-contain",onError:d=>{const u=e;d[u(776)].src=Z+u(499)}})}),a[e(719)](e(797),{children:[a[e(730)]("h1",{className:e(385),style:{fontSize:Y*s+e(670)},children:g[e(731)]||e(527)}),a[e(730)]("p",{className:e(464),style:{fontSize:q*s+e(670),color:c},children:e(573)}),a[e(719)]("p",{className:e(660),style:{fontSize:F*s+e(670)},children:[e(500),a[e(730)](e(410),{className:e(540),children:y})]})]})]}),a[e(730)](e(797),{className:e(779),children:a[e(730)](e(816),{className:e(696),style:{borderColor:c},children:a[e(730)](e(505),{children:a[e(719)]("tr",{children:[a[e(730)]("td",{className:e(536),style:{fontSize:A*s+e(670),padding:R*s+e(820)+R*2*s+"px",borderColor:c},children:e(794)}),a.jsx("td",{className:e(621),style:{fontSize:H+e(670),padding:R*s+e(820)+R*2.5*s+"px",borderColor:c},children:S}),a[e(730)]("td",{className:"label-green border-2 whitespace-nowrap",style:{fontSize:A*s+"rem",padding:R*s+e(820)+R*2*s+"px",borderColor:c},children:e(727)}),a.jsx("td",{className:e(621),style:{fontSize:V+e(670),padding:R*s+e(820)+R*2.5*s+"px",borderColor:c},children:z})]})})})})]}),a[e(719)](e(797),{className:"flex gap-4 items-start w-full mt-2",children:[a[e(730)](e(797),{className:e(508),style:{width:1*s+"in",height:1*s+"in",borderColor:c},children:N[e(705)]?a[e(730)]("img",{src:N[e(705)],alt:e(532),className:e(589)}):a[e(719)]("span",{className:"font-bold leading-tight",style:{fontSize:.7*s+e(670)},children:[e(474),a[e(730)]("br",{}),"PHOTO"]})}),a[e(730)]("div",{className:e(470),children:a[e(730)](e(816),{className:"student-info-table border-2",style:{borderColor:c,height:1*s+"in"},children:a.jsxs("tbody",{children:[a[e(719)]("tr",{style:{height:.5*s+"in"},children:[a[e(730)]("td",{className:e(625),style:{borderColor:c,height:.5*s+"in"},children:N[e(516)]}),a.jsx("td",{className:e(625),style:{borderColor:c,height:.5*s+"in"},children:N[e(674)]}),a[e(730)]("td",{className:e(416),style:{width:e(529),borderColor:c,height:.5*s+"in"},children:N[e(628)]?.[e(586)](0)||""}),a[e(730)]("td",{className:e(625),style:{borderColor:c,height:.5*s+"in"},children:N[e(736)]}),a[e(730)]("td",{className:e(625),style:{borderColor:c,height:.5*s+"in"},children:N[e(732)]})]}),a[e(719)]("tr",{style:{height:.5*s+"in"},children:[a.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:c,height:.5*s+"in"},children:e(433)}),a[e(730)]("td",{className:"label-green py-1 border-2",style:{borderColor:c,height:.5*s+"in"},children:"FIRST NAME"}),a[e(730)]("td",{className:e(602),style:{width:e(529),borderColor:c,height:.5*s+"in"},children:e(553)}),a[e(730)]("td",{className:"label-green py-1 border-2",style:{borderColor:c,height:.5*s+"in"},children:e(808)}),a.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:c,height:.5*s+"in"},children:e(784)})]})]})})})]}),a[e(719)](e(797),{className:e(677),children:[a[e(719)]("div",{children:[a[e(730)](e(797),{className:e(442),style:{fontSize:.75*s+e(670)},children:"WRITTEN /ORAL WORKS (WWs)"}),a[e(730)](e(816),{style:{tableLayout:e(712)},children:a.jsxs(e(505),{children:[a[e(719)]("tr",{className:"header-row-fill",children:[a.jsx("td",{className:e(461),style:{width:e(770)},children:e(615)}),[1,2,3,4,5][e(419)](d=>a[e(730)]("td",{style:{width:e(453)},children:d},d)),a.jsx("td",{className:e(660),style:{width:e(775)},children:"TOTAL"})]}),[1,2,3][e(419)](d=>a[e(719)]("tr",{children:[a[e(730)]("td",{className:"row-label",children:d===1?e(486):d===2?e(639):"THIRD"}),[...Array(5)].map((u,h)=>a[e(730)]("td",{children:T?.[d]?.[e(662)].ww[h]??""},h)),a[e(730)]("td",{className:e(660),children:T?.[d]?.[e(662)].ww[e(752)](0,5)[e(454)]((u,h)=>u+(Number(h)||0),0)||""})]},d))]})})]}),a[e(719)](e(797),{children:[a[e(730)](e(797),{className:e(442),style:{fontSize:.75*s+e(670)},children:"PRODUCT/PERFORMANCE TASK (PPTs)"}),a[e(730)](e(816),{style:{tableLayout:e(712)},children:a[e(719)]("tbody",{children:[a[e(719)]("tr",{className:e(599),children:[a[e(730)]("td",{className:e(461),style:{width:e(775)},children:e(615)}),[1,2,3][e(419)](d=>a.jsx("td",{style:{width:e(775)},children:d},d)),a[e(730)]("td",{className:e(660),style:{width:e(775)},children:e(466)})]}),[1,2,3][e(419)](d=>a.jsxs("tr",{children:[a[e(730)]("td",{className:e(706),children:e(d===1?486:d===2?639:501)}),[...Array(3)][e(419)]((u,h)=>a[e(730)]("td",{children:T?.[d]?.scores.pt[h]??""},h)),a[e(730)]("td",{className:e(660),children:T?.[d]?.[e(662)].pt[e(752)](0,3)[e(454)]((u,h)=>u+(Number(h)||0),0)||""})]},d))]})})]})]}),a.jsxs(e(797),{className:e(759),children:[a.jsxs(e(797),{className:e(456),children:[a[e(730)](e(797),{className:"header-green py-1",style:{fontSize:.7*s+e(670)},children:e(683)}),a[e(730)](e(816),{style:{tableLayout:"fixed"},children:a.jsxs(e(505),{children:[a[e(719)]("tr",{className:e(599),children:[a[e(730)]("td",{className:e(461),style:{width:e(821)},children:e(615)}),[1,2].map(d=>a[e(730)]("td",{children:d},d))]}),[1,2,3][e(419)](d=>a[e(719)]("tr",{children:[a[e(730)]("td",{className:"row-label",children:e(d===1?486:d===2?639:501)}),[...Array(2)].map((u,h)=>a[e(730)]("td",{children:T?.[d]?.[e(662)].st[h]??""},h))]},d))]})})]}),a[e(730)](e(797),{className:e(456),children:a[e(719)](e(816),{style:{tableLayout:e(712)},children:[a[e(730)](e(684),{children:a[e(730)]("tr",{className:e(599),children:a[e(730)]("td",{colSpan:2,className:e(769),style:{fontSize:.7*s+e(670)},children:e(567)})})}),a[e(730)](e(505),{children:[1,2,3][e(419)](d=>a.jsxs("tr",{children:[a[e(719)]("td",{className:e(710),style:{borderColor:c},children:[d===1?e(587):d===2?e(687):"3RD",e(715)]}),a.jsx("td",{className:"font-bold",children:T?.[d]?.scores.te||""})]},d))})]})}),a.jsx(e(797),{className:e(456),children:a[e(719)]("table",{style:{tableLayout:e(712)},children:[a.jsx(e(684),{children:a[e(730)]("tr",{className:e(599),children:a[e(730)]("td",{colSpan:2,className:e(769),style:{fontSize:.7*s+"rem"},children:e(594)})})}),a[e(730)](e(505),{children:[1,2,3].map(d=>a[e(719)]("tr",{children:[a[e(719)]("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:c},children:[d===1?e(587):d===2?"2ND":e(817),e(715)]}),a[e(730)]("td",{className:e(660),children:T?.[d]?.[e(476)]||""})]},d))}),a[e(730)](e(399),{children:a[e(730)]("tr",{style:{height:1.5*s+"px"},children:a[e(730)]("td",{colSpan:2,style:{border:e(697)}})})})]})}),a[e(719)](e(797),{className:e(569),style:{marginTop:J},children:[a[e(730)]("div",{className:e(511),children:a.jsx(e(713),{src:Z+e(613),alt:"DepEd Logo",className:e(565),style:{width:Q*s,height:X*s}})}),a[e(730)](e(797),{className:e(622)}),a.jsx("p",{className:e(570),style:{fontSize:.6*s+e(670),marginTop:14*s+"px"},children:"Teacher's Signature"})]})]})]}),a[e(719)](e(797),{className:e(438),style:{borderColor:c},children:[a.jsx(e(797),{className:"lir-title-bar-custom mb-3 uppercase tracking-widest",children:e(792)}),a[e(719)](e(816),{className:"attendance-table mb-3",children:[a[e(719)]("colgroup",{children:[a[e(730)]("col",{style:{width:"10%"}}),Array[e(644)]({length:w})[e(419)]((d,u)=>a.jsx(e(498),{style:{width:e(656)}},u)),a[e(730)](e(498),{style:{width:"7%"}})]}),a.jsx("thead",{children:a[e(719)]("tr",{children:[a.jsx("th",{className:e(741),children:e(753)}),a.jsx("th",{colSpan:w,className:e(427),children:e(709)}),a[e(730)]("th",{className:e(763),children:e(707)})]})}),a[e(730)]("tbody",{children:[{name:"JUNE",dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:e(619),dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:e(398),dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:"SEPTEMBER",dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:e(556),dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:e(434),dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:e(718),dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:e(754),dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:e(807),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:e(780),dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:e(460),dates:[1,2,5,6,7,8]}][e(419)](d=>a[e(719)]("tr",{children:[a.jsx("td",{className:e(428),children:d[e(731)]}),d0(d[e(443)])[e(419)]((u,h)=>a.jsx("td",{className:e(810),style:{color:E(d.name,u)?e(578):e(740)},children:u},h)),a[e(730)]("td",{className:e(660),children:W[d[e(731)]]||""})]},d[e(731)]))})]}),a[e(719)](e(797),{className:e(393),style:{borderColor:c},children:[a[e(719)](e(797),{className:e(387),children:[a[e(730)](e(797),{className:e(530),children:e(562)}),[[e(458),e(485)],[e(389),"Term 1: Summative Test #1"],[e(699),e(786)],["Aug 28, 2026",e(682)],[e(396),"Term 1 Examination"],[e(702),e(534)],[e(580),e(550)]][e(419)](([d,u])=>a.jsxs(e(797),{className:"date-row",children:[a[e(730)](e(797),{className:e(767),children:d}),a.jsx(e(797),{className:e(597),children:u})]},d))]}),a[e(719)](e(797),{className:e(387),children:[a.jsx(e(797),{className:e(530),children:e(562)}),[[e(811),"Term 2: Summative Test #1"],["Oct 29, 2026",e(422)],[e(735),"Term 2 Examination"],[e(802),e(534)],["Dec 18, 2026",e(480)],[e(726),e(668)],[e(766),e(543)]][e(419)](([d,u])=>a[e(719)]("div",{className:e(406),children:[a.jsx(e(797),{className:e(767),children:d}),a[e(730)](e(797),{className:"date-label uppercase",children:u})]},d))]}),a.jsxs(e(797),{className:e(387),children:[a[e(730)]("div",{className:e(530),children:e(562)}),[["Feb 16, 2027","Term 3: Summative Test #2"],[e(588),e(514)],[e(637),e(782)],[e(473),"End-of-Term Block"],[e(595),"End-of-Term Block"],["Apr 6-7, 2027","EOSY Rites"],[e(716),e(493)]][e(419)](([d,u])=>a[e(719)](e(797),{className:e(406),children:[a.jsx(e(797),{className:e(767),children:d}),a[e(730)](e(797),{className:"date-label uppercase",children:u})]},d))]})]})]})]})]})})};function bx(){const x=N0,{students:N,sections:g,subjects:y,teachers:S,schoolProfile:z,activeSchoolYear:b,setCurrentView:c,classRecords:T,gradingSheetRecords:M,hpsRecords:W,sf2Sheets:e}=xx(),{user:Z}=ex(),[w,d0]=f[x(604)](""),[E,P]=f[x(604)](null),[p,s]=f[x(604)](""),[Y,q]=f[x(604)](1),[F,R]=f[x(604)](x(533)),[A,K]=f[x(604)]("#22c55e"),[v,Q]=f[x(604)](x(451)),[X,J]=f[x(604)](!1),[L,H]=f.useState(new Set),[V,d]=f[x(604)](""),[u,h]=f.useState(!1),[_,O]=f.useState(0),[z0,$]=f[x(604)](""),j=f.useMemo(()=>{const t=x;return g.find(r=>r[t(494)]===w||r.id===w)},[g,w]),C=f[x(680)](()=>y[x(635)](r=>r.id===p||r.subject_name===p),[y,p]),A0=f[x(680)](()=>{const t=x;if(!j)return[];const r=ax(Z,j,y),l=new Set;return r[t(711)](n=>{const o=t,k=w0(n[o(409)]);return l[o(520)](k)?!1:(l[o(653)](k),!0)})},[j,y,Z]),k0=f[x(680)](()=>{const t=x;if(C?.[t(744)]){const r=S.find(l=>l[t(488)]===C[t(744)]||l.id===C[t(744)]);if(r)return r.displayName||r.name}return j?.adviser_name||""},[C,S,j]),t0=f[x(680)](()=>{const t=x;return[...g][t(549)]((r,l)=>{const n=t,o=(r[n(542)]||"")[n(546)](l[n(542)]||"",void 0,{numeric:!0});return o!==0?o:(r[n(494)]||"")[n(546)](l.section_name||"")})},[g]),L0=f.useMemo(()=>{const t={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return t0.forEach(r=>{const l=U,n=(r.section_grade_level||"")[l(477)](),o=parseInt(n.replace(/\D/g,""))||0;n.includes(l(724))||o>=1&&o<=6?t.ELEMENTARY.push(r):o>=7&&o<=10?t[l(551)][l(390)](r):o>=11&&o<=12&&t["SENIOR HIGH SCHOOL"].push(r)}),t},[t0]);f[x(624)](()=>{const t=x;if(!w&&t0[t(405)]===1){const r=setTimeout(()=>{const l=t;d0(t0[0][l(494)])},0);return()=>clearTimeout(r)}},[t0,w]),f[x(624)](()=>{const t=setTimeout(()=>{s(""),P(null),H(new Set)},0);return()=>clearTimeout(t)},[w]);const I=f.useMemo(()=>{const t=x;if(!w)return[];const r=g[t(635)](l=>l[t(494)]===w||l.id===w)?.id;return N[t(711)](l=>l[t(736)]===w||r&&l[t(736)]===r)},[N,w,g]),x0=f[x(680)](()=>I[x(711)](t=>(t[x(481)]||"")[x(477)]()===x(723))[x(549)]((t,r)=>(t[x(516)]+", "+t.first_name)[x(546)](r[x(516)]+", "+r.first_name)),[I]),e0=f[x(680)](()=>I[x(711)](t=>(t[x(481)]||"")[x(477)]()!==x(723))[x(549)]((t,r)=>(t[x(516)]+", "+t[x(674)])[x(546)](r[x(516)]+", "+r[x(674)])),[I]),O0=()=>{const t=x;L.size===0&&I[t(405)]>0&&H(new Set(I[t(419)](r=>r[t(732)]))),J(!0)},b0=f[x(435)](t=>{const r=x;if(!t)return{};const l={};return e.filter(o=>o[r(657)]===b&&(o[r(487)]===j?.id||o[r(487)]===w))[r(591)](o=>{const k=r,i=o.attendance?.[t[k(732)]];if(i){const D=Object[k(579)](i)[k(711)](B=>B?.[k(477)]()===k(407))[k(405)];D>0&&(l[o.month[k(577)]()]=D)}}),l},[e,b,j,w]),m0=f.useCallback((t,r,l)=>{const n=x;if(!t||!r)return;const o={};return[1,2,3][n(591)](k=>{const i=n,D=(m,i0)=>{const u0=U;return!!(m===l?.id||m===r||i0&&l?.subject_name&&w0(i0)===w0(l[u0(409)]))},B=T[i(635)](m=>m[i(572)]===t[i(732)]&&m[i(657)]===b&&Number(m.quarter)===k&&D(m.subject_id,m[i(409)]))||M[i(635)](m=>m[i(572)]===t.lrn&&m[i(657)]===b&&Number(m[i(620)])===k&&D(m[i(417)],m[i(409)])),n0=W[i(635)](m=>D(m[i(417)],m[i(409)])&&m[i(657)]===b&&Number(m.quarter)===k&&(m[i(487)]===t[i(736)]||j?.id&&m[i(487)]===j.id))||W[i(635)](m=>D(m[i(417)],m[i(409)])&&m[i(657)]===b&&Number(m[i(620)])===k),a0=(m,i0)=>{const u0=i,J0=Array[u0(507)](m)?m:[];return Array.from({length:i0},(lx,Y0)=>J0[Y0]??"")},G0=B,U0=n0,G=m=>m===""||m===null||m===void 0?"":m,S0=tx(t[i(732)],l?.id||p,k,b,T,M,W,j?.section_grade_level,j?.[i(492)]);o[k]={scores:{ww:a0(B?.[i(607)],10)[i(419)](G),pt:a0(B?.[i(704)],10).map(G),st:a0(G0?.[i(641)],5)[i(419)](G),te:G(B?.[i(441)]??"")},hps:{ww:a0(n0?.[i(607)],10)[i(419)](G),pt:a0(n0?.[i(704)],10).map(G),st:a0(U0?.[i(641)],5)[i(419)](G),te:G(n0?.[i(441)]??"")},finalGrade:S0>0?S0:G(B?.final_grade??"")}}),o},[T,M,W,b,j,p]),C0=f[x(680)](()=>b0(E),[E,b0]),D0=f[x(680)](()=>m0(E,p,C),[E,p,C,m0]),y0=f[x(680)](()=>[...x0,...e0],[x0,e0]),r0=f[x(680)](()=>{const t=x;return y0.filter(r=>L.has(r[t(732)]))},[y0,L]),s0=f[x(680)](()=>{const t=x;if(!V[t(676)]())return I;const r=V[t(477)]();return I[t(711)](l=>l[t(516)][t(477)]()[t(694)](r)||l.first_name[t(477)]()[t(694)](r)||l.lrn[t(694)](r))},[I,V]),f0=f[x(680)](()=>s0[x(711)](t=>(t[x(481)]||"")[x(477)]()===x(723)),[s0]),p0=f[x(680)](()=>s0[x(711)](t=>(t[x(481)]||"")[x(477)]()===x(728)),[s0]),M0=()=>{const t=x;if(!E)return;const r=document[t(756)],l=(E.last_name+"_"+E[t(674)])[t(563)](/[^a-z0-9]/gi,"_");document[t(756)]=t(397)+l+"_"+b,window[t(603)](),setTimeout(()=>{const n=t;document[n(756)]=r},1e3)},v0=async()=>{const t=x;if(r0.length!==0){h(!0),O(10),$("Preparing LIR sheets for bulk printing...");try{await new Promise(n=>setTimeout(n,400));const r=document.getElementById("lir-bulk-render-container"),l=r?Array[t(644)](r[t(386)](t(642))):[];if(l[t(405)]===0){alert(t(531)),h(!1);return}O(50),$("Opening print stream for "+l[t(405)]+t(395)),await sx({elements:l,paperSize:v,orientation:t(739),title:t(796)+(j?.section_name||t(489))+"_"+(C?.[t(409)]||t(720))}),O(100),$(t(672)),setTimeout(()=>{h(!1),J(!1)},600)}catch(r){console[t(640)](t(666),r),alert(t(772)),h(!1)}}},_0=async()=>{const t=x;if(r0[t(405)]!==0){h(!0),O(5),$(t(814));try{await new Promise(D=>setTimeout(D,400));const r=document[t(664)](t(483)),l=r?Array[t(644)](r.querySelectorAll(t(642))):[];if(l[t(405)]===0){alert(t(497)),h(!1);return}const n=(j?.[t(494)]||w||t(489))[t(563)](/[^a-z0-9]/gi,"_"),o=(C?.subject_name||t(720))[t(563)](/[^a-z0-9]/gi,"_"),k="LIR_"+n+"_"+o+"_"+b,i=await rx({elements:l,filename:k,paperSize:v,orientation:t(739),title:k,onProgressChange:D=>{const B=t;O(D),$(B(815)+D+B(475))}});i[t(518)]?(O(100),$(t(790)),setTimeout(()=>{h(!1),J(!1)},800)):(i[t(575)]||alert(t(539)+(i.error||"Unknown error")),h(!1))}catch(r){console.error("Bulk PDF download error:",r),alert(t(616)),h(!1)}}},j0=t=>{H(r=>{const l=U,n=new Set(r);return n[l(520)](t)?n[l(643)](t):n[l(653)](t),n})},P0=()=>{const t=x;H(new Set(I[t(419)](r=>r.lrn)))},B0=()=>{const t=x;H(new Set(x0[t(419)](r=>r.lrn)))},F0=()=>{const t=x;H(new Set(e0.map(r=>r[t(732)])))},H0=()=>{H(new Set)};return a[x(719)]("div",{className:x(609),children:[a[x(719)](x(797),{className:x(773),children:[a[x(730)]("div",{className:x(465)}),a.jsxs("div",{className:"flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-hidden",children:[a[x(719)](x(797),{className:x(733),children:[a[x(730)]("button",{onClick:()=>c(x(524)),className:x(557),title:x(447),children:a[x(730)](V0,{className:x(601)})}),a[x(719)](x(797),{className:x(646),children:[a[x(730)]("h2",{className:x(614),children:x(626)}),a.jsx("p",{className:x(787),children:"Individual LIR"})]})]}),a.jsx("div",{className:x(585)}),a[x(719)](x(797),{className:x(758),children:[a[x(719)]("select",{className:x(743),value:w,onChange:t=>{const r=x;d0(t[r(776)][r(403)]),P(null),s("")},children:[a[x(730)](x(691),{value:"",children:x(471)}),Object[x(421)](L0)[x(419)](([t,r])=>r[x(405)]>0&&a[x(730)](x(822),{label:t,children:r[x(419)](l=>a[x(719)]("option",{value:l[x(494)],children:[l.section_grade_level,x(445),l.section_name]},l.id))},t))]}),a[x(730)](c0,{className:x(785)})]}),a.jsxs("div",{className:x(758),children:[a[x(719)](x(725),{className:x(764),value:p,onChange:t=>{const r=x;s(t[r(776)][r(403)]),P(null)},disabled:!w,children:[a[x(730)](x(691),{value:"",children:x(618)}),A0[x(419)](t=>a[x(730)](x(691),{value:t.id,children:t[x(409)]},t.id))]}),a[x(730)](c0,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),a[x(719)](x(797),{className:"relative group min-w-0 flex-1",children:[a.jsxs(x(725),{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200",value:E?.[x(732)]||"",onChange:t=>{const r=x,l=N[r(635)](n=>n[r(732)]===t[r(776)].value)||null;P(l)},disabled:!p,children:[a[x(730)]("option",{value:"",children:x(761)}),x0.length>0&&a.jsx(x(822),{label:"MALE",children:x0[x(419)](t=>{const r=x,l=p&&(T[r(647)](n=>n[r(572)]===t[r(732)]&&n[r(417)]===p&&n[r(657)]===b)||M[r(647)](n=>n[r(572)]===t[r(732)]&&n[r(417)]===p&&n[r(657)]===b));return a[r(719)](r(691),{value:t[r(732)],children:[t.last_name,", ",t[r(674)]," ",l?"✓":""]},t[r(732)])})}),e0.length>0&&a[x(730)](x(822),{label:x(690),children:e0[x(419)](t=>{const r=x,l=p&&(T[r(647)](n=>n.student_lrn===t.lrn&&n.subject_id===p&&n[r(657)]===b)||M[r(647)](n=>n[r(572)]===t[r(732)]&&n.subject_id===p&&n.school_year===b));return a[r(719)](r(691),{value:t.lrn,children:[t.last_name,", ",t[r(674)]," ",l?"✓":""]},t[r(732)])})})]}),a.jsx(c0,{className:x(785)})]}),a[x(730)](x(797),{className:x(585)}),a[x(719)](x(797),{className:x(748),children:[a.jsxs(x(725),{value:v,onChange:t=>Q(t.target[x(403)]),className:x(537),title:x(552),children:[a.jsx(x(691),{value:"a4",children:"A4"}),a[x(730)](x(691),{value:x(404),children:x(701)}),a[x(730)](x(691),{value:"folio",children:x(415)})]}),a[x(730)](c0,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),a.jsxs("div",{className:x(437),children:[a[x(719)]("div",{className:x(566),title:"Choose Fill Color",children:[a[x(730)]("div",{className:x(545),style:{backgroundColor:F,width:18,height:18}}),a.jsx(x(617),{type:x(774),value:F,onChange:t=>R(t[x(776)][x(403)]),className:x(400)})]}),a[x(719)]("div",{className:"relative flex items-center justify-center cursor-pointer shrink-0",title:"Choose Outline Color",children:[a[x(730)](x(797),{className:"w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0",style:{backgroundColor:A,width:18,height:18}}),a[x(730)](x(617),{type:"color",value:A,onChange:t=>K(t[x(776)][x(403)]),className:x(400)})]})]}),a[x(719)](x(797),{className:x(432),children:[a.jsx(x(751),{onClick:()=>q(t=>Math[x(793)](.4,t-.1)),className:x(525),title:x(544),children:a[x(730)](W0,{className:"w-3 h-3"})}),a[x(719)](x(410),{className:x(746),children:[Math.round(Y*100),"%"]}),a[x(730)]("button",{onClick:()=>q(t=>Math[x(750)](1.5,t+.1)),className:x(525),title:x(722),children:a[x(730)](Z0,{className:"w-3 h-3"})})]}),a[x(719)](x(751),{onClick:O0,disabled:!w||!p||I[x(405)]===0,className:x(574),title:"Filter / Select Learners",children:[a[x(730)](T0,{className:x(444)}),"Select (",L[x(698)],")"]}),a[x(719)](x(751),{onClick:_0,disabled:!w||!p||r0[x(405)]===0,className:"h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:x(663),children:[a.jsx(E0,{className:"w-3 h-3 group-hover:-translate-y-0.5 transition-transform"}),x(468)]}),a[x(719)](x(751),{onClick:v0,disabled:!w||!p||r0[x(405)]===0,className:x(686),title:x(632),children:[a.jsx(o0,{className:"w-3 h-3 group-hover:scale-110 transition-transform"}),"Bulk Print"]}),a[x(719)]("button",{onClick:M0,disabled:!E,className:x(612),title:x(430),children:[a[x(730)](o0,{className:x(806)}),x(771)]})]})]}),a[x(730)](x(797),{className:x(582),children:a[x(730)](x(797),{className:x(675),children:E?a[x(730)](x(797),{className:x(513),style:{transform:"scale("+Y+x(659),willChange:x(755),backfaceVisibility:x(608),WebkitBackfaceVisibility:"hidden"},children:a.jsxs(x(797),{className:x(605),children:[a[x(730)](x(797),{className:x(459)}),a[x(730)](x(797),{className:"lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none",children:a[x(730)](I0,{pageNumber:1,student:E,profile:z,schoolYear:b,subject:C?.[x(409)]||"",teacher:k0,fillColor:F,outlineColor:A,gradeData:D0,attendanceData:C0,paperSize:v})})]})}):a.jsxs("div",{className:x(700),children:[a.jsxs(x(797),{className:x(605),children:[a[x(730)](x(797),{className:x(721)}),a.jsxs(x(797),{className:x(425),children:[a[x(730)](K0,{className:x(584)}),a[x(719)](x(797),{className:x(745),children:[a[x(730)](x(410),{className:x(547),children:x(689)}),a[x(730)](x(797),{className:x(429)})]}),a[x(730)]("div",{className:"absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500",children:a.jsx(o0,{className:x(777)})})]})]}),a.jsxs(x(797),{className:x(800),children:[a[x(730)]("h2",{className:x(669),children:"Individual Record"}),a[x(730)]("p",{className:"text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60",children:x(479)})]})]})})}),a.jsx(x(797),{id:x(483),className:x(449),style:{left:x(560)},children:r0[x(419)](t=>{const r=x,l=m0(t,p,C),n=b0(t);return a[r(730)]("div",{className:r(559),children:a[r(730)](I0,{pageNumber:1,student:t,profile:z,schoolYear:b,subject:C?.[r(409)]||"",teacher:k0,fillColor:F,outlineColor:A,gradeData:l,attendanceData:n,paperSize:v})},t[r(732)])})}),X&&a[x(730)](x(797),{className:x(528),children:a.jsxs("div",{className:"bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]",children:[a[x(719)](x(797),{className:x(576),children:[a[x(719)]("div",{className:x(734),children:[a[x(730)]("div",{className:"w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400",children:a[x(730)](T0,{className:x(813)})}),a[x(719)](x(797),{children:[a[x(730)]("h3",{className:x(496),children:x(742)}),a[x(719)]("p",{className:x(446),children:[j?.[x(542)],x(445),j?.section_name,x(679),C?.[x(409)]]})]})]}),a[x(730)](x(751),{onClick:()=>J(!1),className:x(450),children:a[x(730)](Q0,{className:"w-4 h-4"})})]}),a[x(719)](x(797),{className:"p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0",children:[a.jsxs("div",{className:"relative flex-1 min-w-48",children:[a[x(730)](X0,{className:x(631)}),a[x(730)](x(617),{type:x(809),placeholder:x(783),value:V,onChange:t=>d(t[x(776)][x(403)]),className:x(491)})]}),a.jsxs(x(797),{className:"flex items-center gap-1.5 flex-wrap",children:[a[x(719)](x(751),{onClick:P0,className:x(504),children:[a[x(730)](g0,{className:x(798)}),"All (",I[x(405)],")"]}),a.jsxs(x(751),{onClick:B0,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[x(703),x0[x(405)],")"]}),a[x(719)](x(751),{onClick:F0,className:x(504),children:[x(737),e0[x(405)],")"]}),a[x(730)]("button",{onClick:H0,className:x(823),children:x(412)})]})]}),a[x(719)](x(797),{className:x(402),children:[f0[x(405)]>0&&a[x(719)](x(797),{className:"space-y-2",children:[a.jsx("div",{className:x(658),children:a[x(719)](x(410),{className:x(600),children:[x(517),f0[x(405)],")"]})}),a.jsx(x(797),{className:x(526),children:f0[x(419)](t=>{const r=x,l=L.has(t[r(732)]),n=p&&(T[r(647)](o=>o[r(572)]===t[r(732)]&&o[r(417)]===p&&o.school_year===b)||M[r(647)](o=>o[r(572)]===t[r(732)]&&o[r(417)]===p&&o[r(657)]===b));return a.jsxs(r(797),{onClick:()=>j0(t[r(732)]),className:r(760)+(l?"bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm":r(648)),children:[a.jsxs("div",{className:"flex items-center gap-2.5 min-w-0",children:[l?a[r(730)](g0,{className:"w-4 h-4 text-indigo-600 shrink-0"}):a.jsx(R0,{className:"w-4 h-4 text-slate-300 shrink-0"}),a[r(719)](r(797),{className:r(457),children:[a.jsxs("p",{className:r(568),children:[t[r(516)],", ",t[r(674)]," ",t[r(628)]?t.middle_name[0]+".":""]}),a[r(719)]("p",{className:r(414),children:[r(636),t[r(732)]]})]})]}),n&&a[r(730)](r(410),{className:r(765),children:r(638)})]},t.lrn)})})]}),p0[x(405)]>0&&a[x(719)](x(797),{className:x(623),children:[a.jsx("div",{className:x(658),children:a[x(719)](x(410),{className:x(600),children:[x(654),p0[x(405)],")"]})}),a[x(730)](x(797),{className:x(526),children:p0[x(419)](t=>{const r=x,l=L.has(t[r(732)]),n=p&&(T[r(647)](o=>o[r(572)]===t.lrn&&o[r(417)]===p&&o[r(657)]===b)||M.some(o=>o[r(572)]===t[r(732)]&&o[r(417)]===p&&o[r(657)]===b));return a[r(719)](r(797),{onClick:()=>j0(t.lrn),className:r(760)+r(l?738:648),children:[a[r(719)]("div",{className:r(472),children:[l?a.jsx(g0,{className:r(561)}):a[r(730)](R0,{className:"w-4 h-4 text-slate-300 shrink-0"}),a.jsxs("div",{className:r(457),children:[a[r(719)]("p",{className:r(568),children:[t[r(516)],", ",t[r(674)]," ",t[r(628)]?t[r(628)][0]+".":""]}),a[r(719)]("p",{className:r(414),children:[r(636),t[r(732)]]})]})]}),n&&a.jsx(r(410),{className:r(765),children:r(638)})]},t[r(732)])})})]}),s0[x(405)]===0&&a[x(719)](x(797),{className:x(757),children:[x(749),V,'".']})]}),a[x(719)](x(797),{className:x(795),children:[a.jsxs("div",{className:x(440),children:[a[x(730)](x(410),{className:"text-indigo-600 font-black",children:L[x(698)]}),x(629),I[x(405)],x(768)]}),a[x(719)]("div",{className:"flex items-center gap-2",children:[a[x(719)](x(751),{onClick:_0,disabled:L[x(698)]===0,className:x(384),children:[a[x(730)](E0,{className:x(717)}),x(509)]}),a.jsxs(x(751),{onClick:v0,disabled:L[x(698)]===0,className:x(819),children:[a.jsx(o0,{className:x(717)}),"Bulk Print"]})]})]})]})}),u&&a[x(730)](x(797),{className:x(503),children:a.jsxs(x(797),{className:"bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6",children:[a[x(719)](x(797),{className:x(394),children:[a.jsx(x(797),{className:x(627)}),a[x(730)](x(797),{className:"relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30",children:a[x(730)]($0,{className:"w-8 h-8 animate-spin"})})]}),a[x(719)]("div",{className:x(623),children:[a.jsx("h3",{className:x(598),children:x(781)}),a[x(730)]("p",{className:x(581),children:z0})]}),a[x(719)]("div",{className:x(519),children:[a[x(730)]("div",{className:"h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200",children:a[x(730)]("div",{className:x(558),style:{width:Math.max(5,_)+"%"}})}),a[x(719)](x(797),{className:x(818),children:[a.jsx(x(410),{children:x(606)}),a[x(719)](x(410),{children:[_,"%"]})]})]})]})}),a.jsx(x(482),{children:`
                @media print {
                    @page {
                        size: `+(v==="a4"?x(502):v===x(404)?x(418):x(708))+`;
                        margin: 0 !important;
                    }
                    html, body {
                        width: `+x(v==="a4"?688:590)+` !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: `+(v==="a4"?"210mm":x(590))+x(426)+(v==="a4"?"210mm":x(590))+x(439)+(v==="a4"?"297mm":v==="letter"?"11in":"13in")+x(436)})]})}function h0(){const x=["Female Learners (","6100332rsfHbf","3.32%","school_year","flex items-center justify-between px-1",") translateZ(0)","font-bold",`rem; 
                        font-weight: 700; 
                        height: `,"scores","Bulk Download PDF for selected learners","getElementById",`px;
                        text-align: center;
                        font-weight: 700;
                        font-size: `,"Bulk print error:",`px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid `,"Start of Term 3","text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase","rem","2100575VlFRPf","Bulk print stream launched successfully.","__proto__","first_name","w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0","trim","grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden","120Szddxk"," | ","useMemo","bind","Term 1 Examination","SUMMATIVE TEST","thead",`px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: `,"h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","2ND","210mm","LIR","FEMALE","option","apply","flex justify-between items-center w-full overflow-hidden","includes",`; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: `,"header-subject-table border-collapse border-2","none","size","July 28, 2026","flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10","Letter","Sept 2-15, 2026","Males (","performance_tasks","photo_url","row-label","Total Abs.","8.5in 13in","Dates","row-label py-1 px-1 border-2","filter","fixed","img",`; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid `," TERM","Apr 8, 2027","w-3.5 h-3.5","DECEMBER","jsxs","Subject","absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full","Zoom In","male","kinder","select","Jan 4, 2027","TEACHER","female","flex items-center gap-4 shrink-0","jsx","name","lrn","flex items-center gap-1.5 lg:gap-2 shrink-0","flex items-center gap-3","Dec 3-4, 2026","student_section","Females (","bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm","portrait","inherit","month-col uppercase","Bulk LIR Operations","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate","teacher_id","absolute inset-0 flex flex-col items-center justify-center","text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums","toString","relative group shrink-0",'No learners found matching "',"min","button","slice","Months","JANUARY","transform","title","p-8 text-center text-slate-400 text-xs font-medium","relative group min-w-0 flex-1","grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden","p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ","Select Learner","-11px","absences-header uppercase","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate","px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0","Jan 25, 2027","date-val uppercase"," learners selected","font-bold py-1","15%","Print Single","Failed to launch bulk print.","z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full","color","20%","target","w-10 h-10 text-white","lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0","shrink-0 ml-auto","MARCH","Processing LIR Records","Term 3 Exam (Non-Grad)","Filter learners by name or LRN...","LRN","w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors","Term 1: Summative Test #2","text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none","School Logo","13in","PDF download complete!","half-page-section","Daily Attendance","max","SUBJECT","p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0","Bulk_LIR_","div","w-3 h-3 text-indigo-600","prototype","space-y-4",`rem; 
                        min-height: `,"Dec 7-18, 2026",`px; 
                        padding: `,"11in",`rem; 
                        border-bottom: 2px solid `,"w-3 h-3 group-hover:translate-y-0.5 transition-transform","FEBRUARY","GRADE & SECTION","text","attendance-date-cell","Oct 7, 2026",`; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: `,"w-5 h-5","Initializing vector PDF export pipeline...","Processing LIR PDF pages: ","table","3RD","flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider","h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","px ","40%","optgroup","h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1","h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer","font-extrabold uppercase whitespace-nowrap","querySelectorAll","important-dates-box",`rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid `,"July 6, 2026","push","logo_url",`rem; 
                        padding: `,"flex items-stretch border-2 w-full overflow-hidden","relative w-16 h-16 mx-auto flex items-center justify-center"," learners...","Sept 1, 2026","LIR_","AUGUST","tfoot","w-full h-full opacity-0 absolute inset-0 cursor-pointer",`rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid `,"flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4","value","letter","length","date-row","absent","933285ENPfJy","subject_name","span","3tWMZEQ","Clear","trace","text-[9px] font-medium text-slate-400","Folio","data-field uppercase font-bold border-2 whitespace-nowrap px-1","subject_id","8.5in 11in","map",`; 
                        color: black !important; 
                        width: 7%; 
                        font-size: `,"entries","Term 2: Summative Test #2","log",`rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: `,"relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl",` !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: `,"dates-header-bar uppercase","month-col","w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4","Print single active learner","4jerFzH","flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0","LAST NAME","NOVEMBER","useCallback",` !important;
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
             `,"flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5","half-page-section border-t-4",` !important;
                        height: `,"text-xs font-bold text-slate-600","quarterly_exam","header-green py-1","dates","w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform"," - ","text-[10px] text-slate-400 font-semibold uppercase tracking-widest","Back to Hub","323484IdUpjN","fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block","w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors","folio","return (function() ","13%","reduce",`rem;
                        width: `,"col-span-1","truncate","June 8-11, 2026","absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000","APRIL","term-label",'{}.constructor("return this")( )',`px; 
                        font-size: `,"font-black uppercase italic","absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30","TOTAL",`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: `,"Bulk PDF","exception","grow flex flex-col gap-1 overflow-hidden","Choose Section","flex items-center gap-2.5 min-w-0","Mar 24-31, 2027","1 X 1","% complete...","finalGrade","toLowerCase","warn","Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections.","End of Term 2","gender","style","lir-bulk-render-container",`px;
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
                        background-color: `,"Opening Block: Term 1","FIRST","section_id","uid","Section",`; 
                        padding: `,"w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500","track","End of Term 3","section_name",`rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: `,"text-sm font-black uppercase tracking-wide text-white","No sheets ready for PDF export.","col","school-logo.png","School Year: ","THIRD","210mm 297mm","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200","h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1","tbody",`px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: `,"isArray","border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden","Download PDF","JUNE","mb-2",`px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: `,"transition-all duration-700 ease-out origin-top print:scale-100","Term 3 Exam (Graduating)","10927ACaaSq","last_name","Male Learners (","success","space-y-1.5","has",` !important; 
                    }

                    .dates-header-bar { 
                        background-color: `,`rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid `,`;
                        border: 1px solid `,"school-forms","w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200","grid grid-cols-1 sm:grid-cols-2 gap-2","BAGONG BARRIO NATIONAL HIGH SCHOOL","fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200","40px","important-dates-header uppercase italic","No sheets ready for printing. Please try again.","1x1 Learner Photo","#86efac","End-of-Term Block",`;
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: `,"label-green border-2 whitespace-nowrap","appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200","297mm","Export failed: ","font-normal ml-2",`px;
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
                        padding: `,"section_grade_level","Term 3: Summative Test #1","Zoom Out","w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0","localeCompare","text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic",`px;
                        text-align: center;
                        height: `,"sort","Start of Term 2","JUNIOR HIGH SCHOOL","Paper Size","M.I","16487460pVhknG","0px","OCTOBER","w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200","h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300","lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always","-9999px","w-4 h-4 text-indigo-600 shrink-0","Important Dates","replace",`rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: `,"object-contain","relative flex items-center justify-center cursor-pointer shrink-0","TERM EXAM","text-xs font-bold text-slate-800 truncate","col-span-1 flex flex-col items-center justify-center pt-1","font-bold uppercase leading-none text-center","page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none","student_lrn","Learner's Individual Record Card","ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","cancelled","px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0","toUpperCase","red","values","Sept 16, 2026","text-xs font-semibold text-slate-500","flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar",`; 
                        text-align: center; 
                        font-size: `,"w-28 h-28 text-slate-100 dark:text-slate-600","h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0","charAt","1ST","Mar 15-16, 2027","w-full h-full object-cover","8.5in","forEach","3568BMSREh",`;
                        border-radius: 8px;
                        height: `,"FINAL GRADE","Apr 1-8, 2027",`px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: `,"date-label uppercase","text-lg font-black text-slate-900 tracking-tight uppercase","header-row-fill","text-[10px] font-black text-slate-500 uppercase tracking-widest","w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform","label-green py-1 border-2 px-1","print","useState","relative group","Export Pipeline","written_works","hidden","lir-print-root flex flex-col h-full bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white",`rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: `,`;
                        color: #000000 !important;
                        font-size: `,"h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer","deped_logo_right.png","text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5","TERM","Failed to generate PDF download.","input","Select Subject","JULY","quarter","data-field font-extrabold border-2 whitespace-nowrap","signature-box bg-white","space-y-2","useEffect","data-field uppercase font-bold border-2 whitespace-nowrap","Learner Record","absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping","middle_name"," of ",`;
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: `,"w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400","Bulk Print for selected learners",`;
                        padding: `,"card-container-combined print:m-0 print:shadow-none","find","LRN: ","Mar 22-23, 2027","✓ Grades","SECOND","error","summative_tests",".lir-bulk-sheet","delete","from",`rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid `,"flex flex-col shrink-0","some","bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50",`px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: `,`; 
                        color: black !important; 
                        font-size: `,"console","47844fQsngG","add"];return h0=function(){return x},h0()}export{bx as LIRPage};
