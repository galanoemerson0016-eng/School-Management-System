import{r as z,j as a,cn as s0,bE as c0,c6 as l0,c9 as i0,cC as o0}from"./vendor-BhdFOiKe.js";import{b as d0,s as t0,n as y}from"./index-Bdr5Pqj7.js";import"./vendor-pdf-libs-DsGp3SWi.js";import"./vendor-firebase-Disz2AMb.js";import"./vendor-framer-motion-CC-6_ZZ2.js";(function(e,w){const f=D,u=e();for(;;)try{if(parseInt(f(543))/1+parseInt(f(396))/2*(-parseInt(f(442))/3)+-parseInt(f(440))/4+-parseInt(f(463))/5*(-parseInt(f(448))/6)+parseInt(f(578))/7*(parseInt(f(605))/8)+-parseInt(f(589))/9*(-parseInt(f(526))/10)+parseInt(f(541))/11===w)break;u.push(u.shift())}catch{u.push(u.shift())}})(e0,573412);const $=(function(){let e=!0;return function(w,f){const u=e?function(){const S=D;if(f){const k=f[S(438)](w,arguments);return f=null,k}}:function(){};return e=!1,u}})(),r0=$(void 0,function(){const e=D,w=function(){const k=D;let x;try{x=Function(k(500)+k(615)+");")()}catch{x=window}return x},f=w(),u=f[e(422)]=f[e(422)]||{},S=[e(583),"warn",e(413),"error","exception",e(402),e(458)];for(let k=0;k<S[e(588)];k++){const x=$[e(631)][e(419)].bind($),F=S[k],q=u[F]||x;x[e(397)]=$[e(481)]($),x[e(516)]=q[e(516)][e(481)](q),u[F]=x}});r0();function D(e,w){return e=e-395,e0()[e]}function _0(){const e=D,{students:w,sections:f,subjects:u,schoolProfile:S,setCurrentView:k,gradingSheetRecords:x,activeSchoolYear:F}=d0(),[q,X]=z[e(551)](""),[v,R]=z[e(551)](e(531)),[W,Z]=z[e(551)](1),h=z[e(595)](()=>{const n=e;return[...f[n(418)](c=>c.is_advisory||c[n(469)])].sort((c,r)=>{const d=n,i=(c[d(493)]||"").localeCompare(r.section_grade_level||"",void 0,{numeric:!0});return i!==0?i:(c[d(444)]||"").localeCompare(r[d(444)]||"")})},[f]);z[e(478)](()=>{const n=e;if(!q&&h[n(588)]>0){const o=setTimeout(()=>{const c=n;X(h[0][c(444)])},0);return()=>clearTimeout(o)}},[h,q]);const t=z.useMemo(()=>{const n=e;return q?w[n(418)](o=>o[n(614)]===q).sort((o,c)=>{const r=n;return o[r(573)]!==c[r(573)]?o.gender==="Male"?-1:1:o[r(627)][r(620)](c[r(627)])}):[]},[w,q]),b=z[e(595)](()=>{const n=e;return f.find(o=>o[n(444)]===q||o.id===q)},[f,q]),s=z[e(595)](()=>{const n=e;if(!b)return[];const o=parseInt(b[n(493)][n(454)](/\D/g,""))||0;let c=u[n(418)](r=>r[n(497)]===b.id&&r[n(594)]!==n(593));return c[n(588)]===0&&(c=u.filter(r=>{const d=n,i=parseInt(r.grade_level?.[d(516)]().replace(/\D/g,"")||"0");return!r[d(497)]&&i===o&&r.term!==d(593)})),t0(c,r=>r[n(546)])},[u,b]),_=()=>{window[e(476)]()},p={a4:{height:e(459),width:e(624),cssSize:e(525)},letter:{height:"279.4mm",width:e(482),cssSize:"letter portrait"},folio:{height:e(569),width:e(482),cssSize:e(558)}};return a[e(561)]("div",{className:e(532),children:[a.jsx(e(490),{children:e(451)+p[v][e(480)]+e(574)+p[v].height+e(622)+p[v][e(491)]+e(432)}),a[e(561)](e(515),{className:"h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-100 shadow-sm print:hidden",children:[a[e(561)](e(515),{className:e(409),children:[a[e(514)](e(576),{onClick:()=>k(e(548)),className:e(430),children:a.jsx(s0,{className:e(511)})}),a[e(561)](e(515),{children:[a[e(514)]("h2",{className:e(607),children:e(465)}),a[e(514)]("p",{className:e(533),children:b?b[e(493)]+" - "+b[e(444)]:"Student Resource Tool"})]}),a[e(514)](e(515),{className:e(505)}),a.jsx(e(515),{className:e(433),children:a[e(561)](e(494),{className:"bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer",value:v,onChange:n=>R(n[e(395)][e(477)]),children:[a[e(514)](e(434),{value:e(531),children:e(513)}),a.jsx(e(434),{value:"a4",children:e(484)}),a[e(514)](e(434),{value:e(475),children:"Folio / Long (8.5 x 13in)"})]})})]}),a[e(561)](e(515),{className:e(580),children:[a[e(561)](e(515),{className:"flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200",children:[a.jsx(e(576),{onClick:()=>Z(n=>Math.max(.4,n-.1)),className:e(521),title:e(441),children:a.jsx(c0,{className:e(568)})}),a[e(561)](e(414),{className:e(544),children:[Math[e(428)](W*100),"%"]}),a[e(514)](e(576),{onClick:()=>Z(n=>Math[e(556)](1.5,n+.1)),className:e(521),title:e(470),children:a.jsx(l0,{className:"w-3.5 h-3.5"})})]}),a.jsx(e(515),{className:e(545)}),a[e(561)](e(576),{onClick:_,disabled:t[e(588)]===0,className:e(528),children:[a.jsx(i0,{className:e(461)}),e(423)]})]})]}),a[e(514)](e(515),{className:e(483),children:t[e(588)]>0?a.jsx("div",{className:"print-preview-container print:w-full flex flex-col items-center transition-all duration-300 ease-out origin-top print:scale-100",style:{transform:e(518)+W+")"},children:a[e(514)](e(515),{className:e(520),children:Array[e(426)]({length:Math[e(602)](t.length/4)})[e(534)]((n,o)=>a[e(561)](e(515),{className:e(621),children:[a[e(561)](e(515),{className:e(439),children:["Page ",o+1," of ",Math[e(602)](t.length/4)]}),a[e(514)](e(515),{className:"cut-cross"}),t.slice(o*4,(o+1)*4).map(c=>{const r=e,d=parseInt(b?.section_grade_level?.replace(/\D/g,"")||"0");return d===11||d===12?a[r(514)](b0,{student:c,schoolProfile:S,section:b,subjects:s,records:x,activeSchoolYear:F},c.lrn):a[r(514)](m0,{student:c,schoolProfile:S,section:b,subjects:s,records:x,activeSchoolYear:F},c[r(437)])})]},o))})}):a[e(561)](e(515),{className:e(600),children:[a[e(514)](e(515),{className:"w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mb-6",children:a[e(514)](o0,{className:e(522)})}),a[e(514)]("h3",{className:"text-xl font-black text-slate-800 mb-2",children:e(629)}),a.jsx("p",{className:e(431),children:e(575)})]})})]})}function m0({student:e,schoolProfile:w,section:f,subjects:u,records:S,activeSchoolYear:k}){const x=D,F="./",q=w.logo_url||x(456),X=F+"deped_logo_left.png",v=z[x(595)](()=>{const h=x,t={};let b=0,s=0;const _={t1:0,t2:0,t3:0},p={t1:0,t2:0,t3:0};u[h(427)](i=>{const g=h;let P="",B="",J="",O=0,H=0;for(let G=1;G<=3;G++){const Q=S[g(570)](C=>C[g(537)]===e[g(437)]&&C.subject_id===i.id&&Number(C[g(572)])===G&&C[g(540)]===k);if(Q&&Q[g(586)]&&Number(Q[g(586)])>0){const C=Number(Q[g(586)]);G===1&&(P=C[g(516)](),_.t1+=C,p.t1++),G===2&&(B=C[g(516)](),_.t2+=C,p.t2++),G===3&&(J=C[g(516)](),_.t3+=C,p.t3++),O+=C,H++}}let K="",x0="";if(H>0){const G=Math[g(428)](O/H);K=G[g(516)](),b+=G,s++,x0=G>=75?g(527):g(601)}t[i.id]={q1:P,q2:B,q3:J,final:K,remarks:x0}});const n=s>0?Math[h(428)](b/s).toString():"",o=n?Number(n)>=75?h(527):h(601):"",c=p.t1>0?Math[h(428)](_.t1/p.t1)[h(516)]():"",r=p.t2>0?Math[h(428)](_.t2/p.t2)[h(516)]():"",d=p.t3>0?Math[h(428)](_.t3/p.t3)[h(516)]():"";return{subjectGrades:t,genAvg:n,genRemarks:o,genT1:c,genT2:r,genT3:d}},[u,S,e.lrn,k]),R=(e[x(627)]+", "+e.first_name+" "+(e[x(420)]?e[x(420)][0]+".":""))[x(509)](),W=z[x(595)](()=>{const h=x;return R.length>35?h(412):R.length>25?h(495):"text-[9px]"},[R]),Z=h=>{const t=x,b=h.length;if(b===0)return{fontSize:t(446)};const s=y(h)[t(405)]("music")||y(h)[t(405)](t(404))||y(h)[t(405)](t(411))||y(h)[t(405)](t(550)),_=s?158:170,p=.54,n=_/(b*p),o=Math[t(455)](7.5,Math.min(10,n));return{fontSize:o.toFixed(2)+"px",lineHeight:o<8.5?"1":t(535)}};return a.jsxs("div",{className:"grade-slip-card font-serif text-[9px] relative text-black leading-tight",children:[a.jsxs(x(515),{className:x(424),children:[a[x(514)](x(466),{src:X,className:x(468),alt:x(611)}),a[x(561)](x(515),{className:x(564),children:[a.jsx("p",{className:"uppercase text-[9px]",children:w[x(435)]}),a[x(561)]("p",{className:x(508),children:["SCHOOL YEAR: ",k]}),a[x(514)]("h3",{className:x(472),children:"Grade Slip"})]}),a.jsx("img",{src:q,className:"w-10 h-10 object-contain",alt:"School"})]}),a.jsxs("div",{className:x(502),children:[a[x(561)](x(515),{className:x(581),children:[a[x(514)](x(414),{className:x(523),children:"Name:"}),a[x(514)](x(414),{className:x(415)+W,children:R})]}),a[x(561)](x(515),{className:x(400),children:[a[x(561)]("div",{className:x(584),children:[a.jsx(x(414),{className:x(519),children:x(524)}),a[x(514)]("span",{className:x(554),children:e.lrn})]}),a[x(561)]("div",{className:x(445),children:[a[x(514)]("span",{className:x(399),children:x(460)}),a.jsx(x(414),{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none text-center",children:e[x(598)]||""})]})]}),a[x(561)](x(515),{className:x(471),children:[a[x(561)](x(515),{className:x(584),children:[a[x(514)](x(414),{className:x(591),children:"Grade Level:"}),a[x(514)](x(414),{className:x(510),children:f?.[x(493)]?.[x(454)](/Grade/i,"").trim()||""})]}),a[x(561)](x(515),{className:x(584),children:[a[x(514)](x(414),{className:x(625),children:x(539)}),a[x(514)](x(414),{className:x(467),children:f?.section_name||""})]})]})]}),a[x(514)](x(515),{className:"flex-1 min-h-0 mb-1.5 px-1",children:a.jsxs(x(402),{className:x(592),children:[a[x(561)](x(547),{children:[a.jsxs("tr",{children:[a.jsx("th",{rowSpan:2,className:x(563),children:x(536)}),a[x(514)]("th",{colSpan:3,children:x(407)}),a[x(514)]("th",{rowSpan:2,className:"final-col leading-tight",children:a[x(514)](x(515),{className:x(425),children:x(506)})}),a[x(514)]("th",{rowSpan:2,className:x(406),children:x(403)})]}),a[x(561)]("tr",{children:[a.jsx("th",{className:"q-col",children:"1"}),a[x(514)]("th",{className:x(623),children:"2"}),a[x(514)]("th",{className:"q-col",children:"3"})]})]}),a[x(561)](x(596),{children:[u[x(534)](h=>{const t=x,b=v[t(401)][h.id],s=y(h[t(546)]).includes(t(626))||y(h[t(546)])[t(405)](t(404))||y(h[t(546)]).includes(t(411))||y(h[t(546)])[t(405)](t(550));return a[t(561)]("tr",{children:[a[t(514)]("td",{className:t(538)+(s?t(457):""),style:Z(h[t(546)]),children:h[t(546)]}),a[t(514)]("td",{className:t(623),children:b.q1||" "}),a.jsx("td",{className:t(623),children:b.q2||" "}),a[t(514)]("td",{className:t(623),children:b.q3||" "}),a[t(514)]("td",{className:"final-col",children:b[t(503)]||" "}),a[t(514)]("td",{className:t(410),children:b[t(417)]||" "})]},h.id)}),a.jsx("tr",{style:{height:x(499)},children:a.jsx("td",{colSpan:6,style:{backgroundColor:x(436),height:x(499),padding:0,borderLeft:x(398),borderRight:"1px solid black",borderTop:x(398),borderBottom:x(398)}})}),a[x(561)]("tr",{children:[a[x(514)]("td",{className:x(485),children:"General Average"}),a[x(514)]("td",{className:"q-col font-bold",children:v[x(604)]||" "}),a.jsx("td",{className:x(473),children:v[x(630)]||" "}),a.jsx("td",{className:x(473),children:v[x(449)]||" "}),a.jsx("td",{className:x(504),children:v[x(587)]||" "}),a[x(514)]("td",{className:x(452),children:v[x(618)]||" "})]})]})]})}),a[x(561)]("div",{className:x(612),children:[a[x(514)]("p",{className:x(599),children:x(619)}),a.jsxs(x(515),{className:x(447),children:[a[x(514)](x(515),{className:x(462),children:w.adviser_name||x(486)}),a[x(514)]("p",{className:x(489),children:x(453)})]})]})]})}function V(e,w){const f=D;if(e===void 0||e===f(474)||e===f(593)||e===null)return!1;const u=Number(e);return isNaN(u)?!1:u!==w}function b0({student:e,schoolProfile:w,section:f,subjects:u,records:S,activeSchoolYear:k}){const x=D,F="./",q=w[x(566)]||x(456),X=F+"deped_logo_left.png",v=z.useMemo(()=>{const t=x,b={};u[t(427)](N=>{const l=t;let m=0,T=0,A=0;for(let j=1;j<=3;j++){const M=S[l(570)](E=>E.student_lrn===e[l(437)]&&E[l(542)]===N.id&&Number(E[l(572)])===j&&E[l(540)]===k);if(M&&M[l(586)]&&Number(M[l(586)])>0){const E=Number(M[l(586)]);j===1&&(m=E),j===2&&(T=E),j===3&&(A=E)}}const I=N[l(594)];let L=0;if(I===1||Number(I)===1)L=m;else if(I===2||Number(I)===2)L=T;else if(I===3||Number(I)===3)L=A;else{let j=0,M=0;m>0&&(j+=m,M++),T>0&&(j+=T,M++),A>0&&(j+=A,M++),L=M>0?Math.round(j/M):0}b[N.id]={q1:m,q2:T,q3:A,final:L,term:I}});const s=u[t(418)](N=>{const l=t,m=N[l(546)][l(509)]()[l(408)]();return[l(579),"mabisang komunikasyon",l(617),l(416),l(609),"pag-aaral ng kasaysayan at lipunang pilipino","kasaysayan at lipunang pilipino"][l(555)](A=>m[l(405)](A))}),_=s[t(418)](N=>{const l=t,m=y(N[l(546)]);return m==="effectivecommunication"||m==="mabisangkomunikasyon"});let p=0,n=0,o=0,c=0,r;if(_[t(588)]>0){const N=_[t(570)](Y=>y(Y[t(546)])==="effectivecommunication"),l=_[t(570)](Y=>y(Y[t(546)])===t(610));N&&N[t(594)]?r=N[t(594)]:l&&l[t(594)]&&(r=l[t(594)]);const m=N?b[N.id]:null,T=l?b[l.id]:null,A=m?.q1||0,I=T?.q1||0;A>0&&I>0?p=Math[t(428)]((A+I)/2):A>0?p=A:I>0&&(p=I);const L=m?.q2||0,j=T?.q2||0;L>0&&j>0?n=Math[t(428)]((L+j)/2):L>0?n=L:j>0&&(n=j);const M=m?.q3||0,E=T?.q3||0;if(M>0&&E>0?o=Math[t(428)]((M+E)/2):M>0?o=M:E>0&&(o=E),r===1||Number(r)===1)c=p;else if(r===2||Number(r)===2)c=n;else if(r===3||Number(r)===3)c=o;else{let Y=0,U=0;p>0&&(Y+=p,U++),n>0&&(Y+=n,U++),o>0&&(Y+=o,U++),c=U>0?Math[t(428)](Y/U):0}}const d={};d.parent_ec_mk={q1:p>0?p[t(516)]():"",q2:n>0?n[t(516)]():"",q3:o>0?o[t(516)]():"",final:c>0?c[t(516)]():"",remarks:c>0?c>=75?"Passed":t(601):"",term:r},u[t(427)](N=>{const l=t,m=b[N.id];d[N.id]={q1:m.q1>0?m.q1[l(516)]():"",q2:m.q2>0?m.q2[l(516)]():"",q3:m.q3>0?m.q3[l(516)]():"",final:m[l(503)]>0?m[l(503)].toString():"",remarks:m[l(503)]>0?m.final>=75?l(527):"Failed":"",term:m[l(594)]}});let i=0,g=0,P=0,B=0,J=0,O=0,H=0,K=0;const x0=N=>{const l=t,m=u[l(570)](A=>A.id===N);if(!m)return!1;const T=y(m[l(546)]);return T==="effectivecommunication"||T===l(610)};u[t(427)](N=>{const l=t;if(x0(N.id))return;const m=b[N.id];m.q1>0&&!V(m[l(594)],1)&&(i+=m.q1,g++),m.q2>0&&!V(m[l(594)],2)&&(P+=m.q2,B++),m.q3>0&&!V(m[l(594)],3)&&(J+=m.q3,O++),m[l(503)]>0&&(H+=m[l(503)],K++)}),_[t(588)]>0&&(p>0&&!V(r,1)&&(i+=p,g++),n>0&&!V(r,2)&&(P+=n,B++),o>0&&!V(r,3)&&(J+=o,O++),c>0&&(H+=c,K++));const G=g>0?Math[t(428)](i/g)[t(516)]():"",Q=B>0?Math.round(P/B)[t(516)]():"",C=O>0?Math.round(J/O)[t(516)]():"",a0=K>0?Math[t(428)](H/K)[t(516)]():"",n0=a0?Number(a0)>=75?t(527):"Failed":"";return{subjectGrades:d,genAvg:a0,genRemarks:n0,genT1:G,genT2:Q,genT3:C}},[u,S,e[x(437)],k]),R=(e.last_name+", "+e.first_name+" "+(e[x(420)]?e.middle_name[0]+".":"")).trim(),W=z[x(595)](()=>{const t=x;return R[t(588)]>35?t(412):R.length>25?t(495):"text-[9px]"},[R]),Z=(t,b)=>{const s=x,_=t[s(588)];if(_===0)return{fontSize:s(446)};const p=b?158:170,n=.54,o=p/(_*n),c=Math[s(455)](7.5,Math[s(556)](10,o));return{fontSize:c[s(597)](2)+"px",lineHeight:c<8.5?"1":s(535)}},h=z[x(595)](()=>{const t=x,b=[],s=[];u[t(427)](d=>{const i=t,g=d[i(546)][i(509)]()[i(408)]();[i(579),i(549),i(617),i(416),"life and career skills",i(429),"kasaysayan at lipunang pilipino"][i(555)](B=>g[i(405)](B))?b.push(d):s.push(d)});const _=b[t(418)](d=>{const i=t,g=y(d.subject_name);return g===i(488)||g==="mabisangkomunikasyon"}),p=b[t(418)](d=>{const i=t,g=y(d.subject_name);return g!=="effectivecommunication"&&g!==i(610)}),n=t0(p,d=>d.subject_name),o=t0(s,d=>d[t(546)]),c=[],r=[];if(_[t(588)]>0){const d=_.find(P=>y(P[t(546)])===t(488)),i=_.find(P=>y(P.subject_name)===t(610)),g=d?.[t(594)]||i?.[t(594)];r[t(443)]({type:t(479),name:t(496),id:t(582),term:g}),d&&r.push({type:t(501),name:d.subject_name,id:d.id,isComponent:!0,term:d[t(594)]}),i&&r.push({type:"subject",name:i[t(546)],id:i.id,isComponent:!0,term:i[t(594)]})}return n[t(427)](d=>{const i=t;r[i(443)]({type:i(501),name:d[i(546)],id:d.id,term:d[i(594)]})}),r[t(588)]>0&&(c[t(443)]({type:t(492),name:t(530)}),c[t(443)](...r)),o[t(588)]>0&&(c[t(443)]({type:t(492),name:t(559)}),o[t(427)](d=>{const i=t;c[i(443)]({type:i(501),name:d[i(546)],id:d.id,term:d[i(594)]})})),c},[u]);return a[x(561)](x(515),{className:x(512),children:[a.jsxs("div",{className:x(424),children:[a[x(514)](x(466),{src:X,className:x(468),alt:x(611)}),a[x(561)](x(515),{className:x(564),children:[a[x(514)]("p",{className:x(487),children:w[x(435)]}),a.jsxs("p",{className:x(508),children:[x(565),k]}),a[x(514)]("h3",{className:x(472),children:x(498)})]}),a.jsx(x(466),{src:q,className:x(468),alt:x(577)})]}),a[x(561)](x(515),{className:"mb-1.5 px-1 shrink-0 text-[9px]",children:[a[x(561)](x(515),{className:x(581),children:[a[x(514)](x(414),{className:"w-10 text-[9px]",children:x(560)}),a[x(514)](x(414),{className:x(415)+W,children:R})]}),a[x(561)](x(515),{className:x(400),children:[a[x(561)](x(515),{className:x(584),children:[a[x(514)](x(414),{className:"w-10",children:x(524)}),a[x(514)]("span",{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none",children:e.lrn})]}),a[x(561)]("div",{className:x(445),children:[a[x(514)](x(414),{className:x(399),children:x(460)}),a[x(514)](x(414),{className:x(567),children:e[x(598)]||""})]})]}),a[x(561)]("div",{className:x(471),children:[a[x(561)]("div",{className:"flex flex-1",children:[a[x(514)](x(414),{className:x(529),children:x(562)}),a.jsx("span",{className:"flex-1 border-b border-black font-bold leading-none text-center pb-0.5",children:f?.section_grade_level?.[x(454)](/Grade/i,"").trim()||""})]}),a.jsxs("div",{className:x(584),children:[a[x(514)](x(414),{className:x(628),children:"Section:"}),a[x(514)](x(414),{className:x(467),children:f?.[x(444)]||""})]}),a[x(561)]("div",{className:x(608),children:[a[x(514)]("span",{className:x(628),children:x(421)}),a[x(514)](x(414),{className:x(590),children:e[x(557)]||""})]})]})]}),a.jsx(x(515),{className:"flex-1 min-h-0 mb-1.5 px-1",children:a[x(561)]("table",{className:x(592),children:[a[x(561)](x(547),{children:[a[x(561)]("tr",{children:[a[x(514)]("th",{rowSpan:2,className:x(563),children:x(536)}),a[x(514)]("th",{colSpan:3,children:x(407)}),a.jsx("th",{rowSpan:2,className:x(606),children:a.jsx(x(515),{className:"w-min mx-auto",children:x(506)})}),a[x(514)]("th",{rowSpan:2,className:x(406),children:x(403)})]}),a[x(561)]("tr",{children:[a[x(514)]("th",{className:"q-col",children:"1"}),a[x(514)]("th",{className:x(623),children:"2"}),a.jsx("th",{className:x(623),children:"3"})]})]}),a[x(561)](x(596),{children:[h[x(534)]((t,b)=>{const s=x;if(t.type===s(492))return a[s(514)]("tr",{children:a[s(514)]("td",{colSpan:6,style:{backgroundColor:"#E5E7EB",fontWeight:s(571),textAlign:s(507),padding:s(603),fontSize:"8px",textTransform:"uppercase"},children:t.name})},s(613)+b);const _=t[s(552)]===s(479),p=_?s(582):t.id,n=v[s(401)][p]||{q1:"",q2:"",q3:"",final:"",remarks:""},o=!_&&t.isComponent;return a[s(561)]("tr",{children:[a[s(514)]("td",{className:s(538)+s(o?464:616),style:{...Z(t[s(435)],o),fontWeight:s(o?553:571)},children:t.name}),[1,2,3][s(534)](c=>{const r=s;if(V(t.term,c))return a[r(514)]("td",{className:r(623),style:{backgroundColor:r(517)},children:" "},c);const i=c===1?n.q1:c===2?n.q2:n.q3;return a[r(514)]("td",{className:r(623),children:i||" "},c)}),a.jsx("td",{className:s(585),children:n[s(503)]||" "}),a.jsx("td",{className:s(410),children:n[s(417)]||" "})]},p)}),a[x(514)]("tr",{style:{height:x(499)},children:a.jsx("td",{colSpan:6,style:{backgroundColor:x(436),height:"2px",padding:0,borderLeft:x(398),borderRight:x(398),borderTop:"1px solid black",borderBottom:x(398)}})}),a[x(561)]("tr",{children:[a[x(514)]("td",{className:x(485),children:x(450)}),a[x(514)]("td",{className:x(473),children:v[x(604)]||" "}),a[x(514)]("td",{className:x(473),children:v[x(630)]||" "}),a[x(514)]("td",{className:x(473),children:v[x(449)]||" "}),a[x(514)]("td",{className:x(504),children:v.genAvg||" "}),a[x(514)]("td",{className:x(452),children:v[x(618)]||" "})]})]})]})}),a.jsxs("div",{className:"mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center",children:[a.jsx("p",{className:x(599),children:x(619)}),a[x(561)](x(515),{className:"w-45 mx-auto text-center mt-2.5",children:[a[x(514)](x(515),{className:x(462),children:w.adviser_name||x(486)}),a[x(514)]("p",{className:x(489),children:x(453)})]})]})]})}function e0(){const e=["6mJQzVs","genT3","General Average",`
                .print-page {
                    width: `,"remarks-col text-[6.5px] tracking-tighter uppercase font-bold","Adviser","replace","max","school-logo.png","italic pl-3","trace","297mm","Age:","w-4 h-4","font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none","5702835mqlyBI","pl-3 font-normal","Temporary Grade Slip","img","flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5","w-10 h-10 object-contain","is_advisory_class","Zoom In","flex gap-4","text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none","q-col font-bold","all","folio","print","value","useEffect","parent","width","bind","215.9mm","flex-1 overflow-auto p-8 flex flex-col items-center bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible custom-scrollbar","A4 Size (210 x 297mm)","subject-col font-bold text-[10px] text-center pb-1 pt-1","_________________________","uppercase text-[9px]","effectivecommunication","text-[8px] italic mt-0.5","style","cssSize","header","section_grade_level","select","text-[8.2px] leading-tight","Effective Communication & Mabisang Komunikasyon","section_id","Grade Slip","2px","return (function() ","subject","mb-1.5 px-1 shrink-0 text-[9px]","final","final-col font-bold","h-8 w-px bg-slate-200 mx-2","FINAL GRADE","left","uppercase text-[9px] font-normal tracking-wide mt-0.5","trim","flex-1 border-b border-black font-bold leading-none text-center pb-0.5","w-5 h-5","grade-slip-card font-serif text-[9px] relative text-black leading-tight","Letter (8.5 x 11in)","jsx","div","toString","#E5E7EB","scale(","w-10","print:w-full flex flex-col items-center gap-8 print:gap-0","w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm","w-10 h-10 text-slate-400","w-10 text-[9px]","LRN:","A4 portrait","810rknTDJ","Passed","h-11 px-6 rounded-xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2","w-15 shrink-0","Core Subjects","letter","h-full bg-slate-50 flex flex-col overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible","text-[10px] font-black text-orange-600 uppercase tracking-widest","map","1.1","LEARNING AREAS","student_lrn","subject-col ","Section:","school_year","5941232HsWTEq","subject_id","421844xPnnvF","text-xs font-bold text-slate-900 w-12 text-center tabular-nums","h-8 w-px bg-slate-200","subject_name","thead","school-forms","mabisang komunikasyon","health","useState","type","normal","flex-1 border-b border-black font-bold pb-0.5 leading-none","some","min","track","8.5in 13in portrait","Electives","Name:","jsxs","Grade Level:","subject-col","text-center font-bold leading-none","SCHOOL YEAR: ","logo_url","flex-1 border-b border-black font-bold pb-0.5 leading-none text-center","w-3.5 h-3.5","330.2mm","find","bold","quarter","gender",`;
                    height: `,"Please set up your advisory grade level and section details in your Profile to generate temporary grade slips.","button","School","376775pkuBPI","effective communication","flex items-center gap-4","flex mb-0.5 items-baseline","parent_ec_mk","log","flex flex-1","final-col","final_grade","genAvg","length","1386xrqhSG","flex-1 border-b border-black font-bold leading-none pb-0.5 uppercase text-center","w-15","grade-table","none","term","useMemo","tbody","toFixed","age","text-[8px] mb-1 w-full text-center","flex-1 flex flex-col items-center justify-center text-center max-w-md","Failed","ceil","2px 4px","genT1","48KVpmwj","final-col leading-tight","text-sm font-black text-slate-900 uppercase tracking-tight","flex flex-[1.2]","life and career skills","mabisangkomunikasyon","DepEd","mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center","header-","student_section",'{}.constructor("return this")( )',"font-bold","general mathematics","genRemarks","Prepared by:","localeCompare","print-page relative",`;
                    padding: 0;
                    margin: 20px auto;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    grid-template-rows: repeat(2, 1fr);
                    gap: 0;
                    background: white;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    border-radius: 4px;
                    position: relative;
                }

                /* Crossline cut guides */
                .print-page::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    border-top: 1px dashed #999;
                    z-index: 5;
                }
                .print-page::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 0;
                    bottom: 0;
                    border-left: 1px dashed #999;
                    z-index: 5;
                }
                /* Small cross marks at intersection */
                .cut-cross {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 6;
                    width: 12px;
                    height: 12px;
                }
                .cut-cross::before, .cut-cross::after {
                    content: '';
                    position: absolute;
                    background: #999;
                }
                .cut-cross::before {
                    width: 12px;
                    height: 1px;
                    top: 50%;
                    left: 0;
                    transform: translateY(-50%);
                }
                .cut-cross::after {
                    width: 1px;
                    height: 12px;
                    left: 50%;
                    top: 0;
                    transform: translateX(-50%);
                }

                .grade-slip-card {
                    box-sizing: border-box;
                    padding: 4mm;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    height: 100%;
                    font-family: "Bookman Old Style", "Bookman", "Georgia", serif;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    background: white;
                }

                /* Standard table styles to match the layout precisely */
                .grade-table {
                    width: 100%;
                    height: 100%;
                    border-collapse: collapse;
                    font-size: 8.5px;
                    table-layout: fixed;
                }
                .grade-table th, .grade-table td {
                    border: 1px solid #000;
                    padding: 2px 3px;
                }
                .grade-table th {
                    font-weight: bold;
                    text-align: center;
                }
                .grade-table .subject-col {
                    width: 48%;
                    text-align: left;
                }
                .grade-table .q-col {
                    width: 9%;
                    text-align: center;
                }
                .grade-table .final-col {
                    width: 11%;
                    text-align: center;
                    font-weight: bold;
                }
                .grade-table .remarks-col {
                    width: 14%;
                    text-align: center;
                }

                @media print {
                    @page {
                        size: `,"q-col","210mm","w-11.25","music","last_name","w-10 shrink-0","No Advisory Class Set","genT2","constructor","target","2206504QbDZuF","__proto__","1px solid black","w-8","flex gap-4 mb-0.5","subjectGrades","table","REMARKS","arts","includes","remarks-col","TERM","toLowerCase","flex items-center gap-6","remarks-col text-[6.5px] tracking-tighter uppercase","physical","text-[7.5px] leading-tight","info","span","flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ","general science","remarks","filter","prototype","middle_name","Track:","console","Print Slips","flex items-center justify-between mb-1.5 px-1 shrink-0","w-min mx-auto","from","forEach","round","pag-aaral ng kasaysayan at lipunang pilipino","p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600","text-sm text-slate-500 font-medium leading-relaxed",`;
                        margin: 0;
                    }
                    html, body {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        overflow: visible !important;
                    }
                    .print-page {
                        width: 100vw !important;
                        height: 100vh !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        page-break-after: always;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .print-page:last-child {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }
                    .grade-slip-card {
                        box-shadow: none !important;
                        height: 100% !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-preview-container {
                        transform: none !important;
                        width: 100% !important;
                    }
                }
            `,"flex items-center gap-3","option","name","black","lrn","apply","absolute -top-6 right-0 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden","3045132MNXUEn","Zoom Out","3FxAFze","push","section_name","flex w-20","10px","w-45 mx-auto text-center mt-2.5"];return e0=function(){return e},e0()}export{_0 as TemporaryGradeSlipPage};
