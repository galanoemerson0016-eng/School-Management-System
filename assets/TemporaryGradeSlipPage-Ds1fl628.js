import{r as G,j as a,cd as s0,bC as l0,b_ as c0,co as i0,cu as o0}from"./vendor-jb77UrGI.js";import{b as d0,s as t0,n as y}from"./index-BmcO3L-e.js";import"./vendor-pdf-libs-DfncxlVz.js";import"./vendor-firebase-BnVoqbHU.js";import"./vendor-framer-motion-DCKYskn4.js";(function(e,w){const p=L,u=e();for(;;)try{if(-parseInt(p(118))/1+-parseInt(p(245))/2+parseInt(p(222))/3*(parseInt(p(304))/4)+parseInt(p(131))/5+-parseInt(p(303))/6+-parseInt(p(260))/7*(-parseInt(p(120))/8)+-parseInt(p(240))/9===w)break;u.push(u.shift())}catch{u.push(u.shift())}})(e0,316307);const $=(function(){let e=!0;return function(w,p){const u=e?function(){const S=L;if(p){const k=p[S(279)](w,arguments);return p=null,k}}:function(){};return e=!1,u}})(),n0=$(void 0,function(){const e=L,w=function(){const k=L;let x;try{x=Function(k(285)+k(345)+");")()}catch{x=window}return x},p=w(),u=p[e(268)]=p.console||{},S=["log","warn","info",e(307),e(168),"table","trace"];for(let k=0;k<S[e(186)];k++){const x=$[e(149)][e(298)].bind($),F=S[k],q=u[F]||x;x[e(333)]=$[e(270)]($),x[e(337)]=q[e(337)].bind(q),u[F]=x}});n0();function L(e,w){return e=e-118,e0()[e]}function _0(){const e=L,{students:w,sections:p,subjects:u,schoolProfile:S,setCurrentView:k,gradingSheetRecords:x,activeSchoolYear:F}=d0(),[q,Q]=G[e(126)](""),[j,I]=G[e(126)]("letter"),[X,Z]=G.useState(1),f=G[e(328)](()=>{const r=e;return[...p[r(334)](i=>i[r(119)]||i[r(338)])].sort((i,n)=>{const o=r,l=(i[o(141)]||"")[o(287)](n[o(141)]||"",void 0,{numeric:!0});return l!==0?l:(i[o(134)]||"").localeCompare(n[o(134)]||"")})},[p]);G.useEffect(()=>{if(!q&&f.length>0){const r=setTimeout(()=>{const d=L;Q(f[0][d(134)])},0);return()=>clearTimeout(r)}},[f,q]);const t=G[e(328)](()=>{const r=e;return q?w[r(334)](d=>d.student_section===q).sort((d,i)=>{const n=r;return d[n(163)]!==i[n(163)]?d[n(163)]===n(349)?-1:1:d.last_name[n(287)](i.last_name)}):[]},[w,q]),m=G.useMemo(()=>{const r=e;return p[r(263)](d=>d[r(134)]===q||d.id===q)},[p,q]),s=G[e(328)](()=>{const r=e;if(!m)return[];const d=parseInt(m[r(141)].replace(/\D/g,""))||0;let i=u[r(334)](n=>n.section_id===m.id&&n[r(301)]!==r(157));return i[r(186)]===0&&(i=u[r(334)](n=>{const o=r,l=parseInt(n[o(146)]?.toString().replace(/\D/g,"")||"0");return!n[o(336)]&&l===d&&n.term!==o(157)})),t0(i,n=>n[r(272)])},[u,m]),g=()=>{window.print()},h={a4:{height:e(161),width:e(140),cssSize:e(250)},letter:{height:e(219),width:"215.9mm",cssSize:e(124)},folio:{height:e(221),width:e(314),cssSize:e(256)}};return a.jsxs("div",{className:e(253),children:[a[e(296)](e(181),{children:`
                .print-page {
                    width: `+h[j][e(212)]+e(183)+h[j][e(299)]+e(199)+h[j].cssSize+e(172)}),a.jsxs(e(180),{className:"h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-100 shadow-sm print:hidden",children:[a[e(224)](e(180),{className:e(213),children:[a[e(296)](e(144),{onClick:()=>k(e(274)),className:e(331),children:a[e(296)](s0,{className:e(174)})}),a[e(224)](e(180),{children:[a[e(296)]("h2",{className:"text-sm font-black text-slate-900 uppercase tracking-tight",children:e(286)}),a[e(296)]("p",{className:"text-[10px] font-black text-orange-600 uppercase tracking-widest",children:m?m[e(141)]+e(305)+m[e(134)]:e(135)})]}),a[e(296)]("div",{className:e(133)}),a[e(296)](e(180),{className:e(189),children:a[e(224)](e(175),{className:e(280),value:j,onChange:r=>I(r[e(138)].value),children:[a.jsx(e(232),{value:"letter",children:"Letter (8.5 x 11in)"}),a.jsx(e(232),{value:"a4",children:"A4 Size (210 x 297mm)"}),a[e(296)](e(232),{value:e(273),children:e(177)})]})})]}),a[e(224)]("div",{className:e(340),children:[a[e(224)](e(180),{className:e(130),children:[a.jsx(e(144),{onClick:()=>Z(r=>Math[e(330)](.4,r-.1)),className:e(339),title:e(269),children:a.jsx(l0,{className:e(257)})}),a[e(224)](e(218),{className:e(216),children:[Math[e(208)](X*100),"%"]}),a[e(296)](e(144),{onClick:()=>Z(r=>Math.min(1.5,r+.1)),className:e(339),title:e(278),children:a[e(296)](c0,{className:e(257)})})]}),a[e(296)](e(180),{className:e(128)}),a[e(224)](e(144),{onClick:g,disabled:t.length===0,className:e(154),children:[a[e(296)](i0,{className:e(214)}),e(230)]})]})]}),a[e(296)](e(180),{className:e(348),children:t[e(186)]>0?a[e(296)](e(180),{className:"print-preview-container print:w-full flex flex-col items-center transition-all duration-300 ease-out origin-top print:scale-100",style:{transform:e(313)+X+")"},children:a[e(296)](e(180),{className:"print:w-full flex flex-col items-center gap-8 print:gap-0",children:Array[e(350)]({length:Math[e(267)](t[e(186)]/4)})[e(239)]((r,d)=>a[e(224)](e(180),{className:e(335),children:[a.jsxs("div",{className:"absolute -top-6 right-0 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden",children:[e(225),d+1,e(151),Math[e(267)](t[e(186)]/4)]}),a[e(296)]("div",{className:"cut-cross"}),t[e(244)](d*4,(d+1)*4)[e(239)](i=>{const n=e,o=parseInt(m?.[n(141)]?.[n(210)](/\D/g,"")||"0");return o===11||o===12?a[n(296)](m0,{student:i,schoolProfile:S,section:m,subjects:s,records:x,activeSchoolYear:F},i[n(248)]):a[n(296)](b0,{student:i,schoolProfile:S,section:m,subjects:s,records:x,activeSchoolYear:F},i[n(248)])})]},d))})}):a[e(224)](e(180),{className:e(191),children:[a[e(296)](e(180),{className:e(233),children:a.jsx(o0,{className:e(327)})}),a[e(296)]("h3",{className:e(182),children:e(125)}),a[e(296)]("p",{className:e(162),children:e(137)})]})})]})}function b0({student:e,schoolProfile:w,section:p,subjects:u,records:S,activeSchoolYear:k}){const x=L,F="./",q=w.logo_url||x(193),Q=F+"deped_logo_left.png",j=G[x(328)](()=>{const f=x,t={};let m=0,s=0;const g={t1:0,t2:0,t3:0},h={t1:0,t2:0,t3:0};u.forEach(l=>{const _=L;let P="",Y="",J="",H=0,O=0;for(let T=1;T<=3;T++){const V=S[_(263)](C=>C.student_lrn===e[_(248)]&&C.subject_id===l.id&&Number(C.quarter)===T&&C.school_year===k);if(V&&V[_(178)]&&Number(V[_(178)])>0){const C=Number(V[_(178)]);T===1&&(P=C[_(337)](),g.t1+=C,h.t1++),T===2&&(Y=C.toString(),g.t2+=C,h.t2++),T===3&&(J=C.toString(),g.t3+=C,h.t3++),H+=C,O++}}let K="",x0="";if(O>0){const T=Math.round(H/O);K=T[_(337)](),m+=T,s++,x0=T>=75?_(179):_(266)}t[l.id]={q1:P,q2:Y,q3:J,final:K,remarks:x0}});const r=s>0?Math[f(208)](m/s)[f(337)]():"",d=r?Number(r)>=75?f(179):f(266):"",i=h.t1>0?Math[f(208)](g.t1/h.t1)[f(337)]():"",n=h.t2>0?Math[f(208)](g.t2/h.t2).toString():"",o=h.t3>0?Math[f(208)](g.t3/h.t3)[f(337)]():"";return{subjectGrades:t,genAvg:r,genRemarks:d,genT1:i,genT2:n,genT3:o}},[u,S,e.lrn,k]),I=(e[x(306)]+", "+e.first_name+" "+(e[x(164)]?e[x(164)][0]+".":""))[x(294)](),X=G[x(328)](()=>{const f=x;return I[f(186)]>35?f(190):I.length>25?"text-[8.2px] leading-tight":f(123)},[I]),Z=f=>{const t=x,m=f[t(186)];if(m===0)return{fontSize:"10px"};const s=y(f)[t(315)](t(254))||y(f)[t(315)](t(231))||y(f)[t(315)]("physical")||y(f)[t(315)](t(158)),g=s?158:170,h=.54,r=g/(m*h),d=Math[t(330)](7.5,Math[t(226)](10,r));return{fontSize:d.toFixed(2)+"px",lineHeight:d<8.5?"1":t(320)}};return a[x(224)](x(180),{className:x(347),children:[a.jsxs("div",{className:x(196),children:[a[x(296)](x(249),{src:Q,className:x(139),alt:"DepEd"}),a[x(224)](x(180),{className:x(297),children:[a.jsx("p",{className:x(281),children:w.name}),a[x(224)]("p",{className:"uppercase text-[9px] font-normal tracking-wide mt-0.5",children:[x(290),k]}),a[x(296)]("h3",{className:x(325),children:x(332)})]}),a.jsx("img",{src:q,className:x(139),alt:"School"})]}),a[x(224)](x(180),{className:x(291),children:[a[x(224)]("div",{className:x(237),children:[a[x(296)](x(218),{className:"w-10 text-[9px]",children:x(194)}),a[x(296)]("span",{className:"flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none "+X,children:I})]}),a[x(224)](x(180),{className:"flex gap-4 mb-0.5",children:[a[x(224)]("div",{className:x(276),children:[a.jsx(x(218),{className:x(206),children:x(259)}),a[x(296)]("span",{className:x(171),children:e[x(248)]})]}),a[x(224)](x(180),{className:x(284),children:[a[x(296)](x(218),{className:x(235),children:x(167)}),a.jsx(x(218),{className:x(255),children:e[x(188)]||""})]})]}),a[x(224)]("div",{className:x(323),children:[a[x(224)]("div",{className:x(276),children:[a[x(296)](x(218),{className:x(321),children:x(147)}),a[x(296)](x(218),{className:x(223),children:p?.section_grade_level?.[x(210)](/Grade/i,"").trim()||""})]}),a[x(224)](x(180),{className:"flex flex-1",children:[a[x(296)](x(218),{className:x(142),children:x(129)}),a[x(296)]("span",{className:"flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5",children:p?.section_name||""})]})]})]}),a.jsx(x(180),{className:"flex-1 min-h-0 mb-1.5 px-1",children:a.jsxs(x(238),{className:x(153),children:[a[x(224)](x(343),{children:[a[x(224)]("tr",{children:[a[x(296)]("th",{rowSpan:2,className:x(204),children:"LEARNING AREAS"}),a[x(296)]("th",{colSpan:3,children:x(152)}),a.jsx("th",{rowSpan:2,className:x(251),children:a[x(296)](x(180),{className:"w-min mx-auto",children:x(234)})}),a.jsx("th",{rowSpan:2,className:x(203),children:x(145)})]}),a[x(224)]("tr",{children:[a[x(296)]("th",{className:x(211),children:"1"}),a[x(296)]("th",{className:"q-col",children:"2"}),a[x(296)]("th",{className:x(211),children:"3"})]})]}),a[x(224)]("tbody",{children:[u[x(239)](f=>{const t=x,m=j[t(302)][f.id],s=y(f[t(272)])[t(315)]("music")||y(f[t(272)])[t(315)](t(231))||y(f[t(272)]).includes(t(170))||y(f[t(272)])[t(315)](t(158));return a[t(224)]("tr",{children:[a[t(296)]("td",{className:t(324)+(s?t(156):""),style:Z(f.subject_name),children:f[t(272)]}),a[t(296)]("td",{className:t(211),children:m.q1||" "}),a[t(296)]("td",{className:t(211),children:m.q2||" "}),a[t(296)]("td",{className:t(211),children:m.q3||" "}),a[t(296)]("td",{className:t(150),children:m[t(127)]||" "}),a.jsx("td",{className:t(148),children:m[t(229)]||" "})]},f.id)}),a[x(296)]("tr",{style:{height:x(283)},children:a[x(296)]("td",{colSpan:6,style:{backgroundColor:"black",height:x(283),padding:0,borderLeft:x(192),borderRight:x(192),borderTop:"1px solid black",borderBottom:x(192)}})}),a.jsxs("tr",{children:[a[x(296)]("td",{className:x(264),children:x(300)}),a.jsx("td",{className:x(346),children:j[x(198)]||" "}),a[x(296)]("td",{className:x(346),children:j[x(201)]||" "}),a.jsx("td",{className:x(346),children:j.genT3||" "}),a.jsx("td",{className:x(247),children:j[x(236)]||" "}),a[x(296)]("td",{className:x(310),children:j[x(318)]||" "})]})]})]})}),a.jsxs(x(180),{className:x(293),children:[a.jsx("p",{className:"text-[8px] mb-1 w-full text-center",children:x(227)}),a[x(224)]("div",{className:x(342),children:[a[x(296)](x(180),{className:"font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none",children:w[x(169)]||x(173)}),a[x(296)]("p",{className:x(289),children:x(176)})]})]})]})}function W(e,w){const p=L;if(e===void 0||e===p(215)||e===p(157)||e===null)return!1;const u=Number(e);return isNaN(u)?!1:u!==w}function m0({student:e,schoolProfile:w,section:p,subjects:u,records:S,activeSchoolYear:k}){const x=L,F="./",q=w[x(228)]||x(193),Q=F+x(265),j=G[x(328)](()=>{const t=x,m={};u.forEach(N=>{const c=L;let b=0,A=0,E=0;for(let v=1;v<=3;v++){const M=S[c(263)](R=>R[c(262)]===e.lrn&&R[c(277)]===N.id&&Number(R[c(271)])===v&&R[c(159)]===k);if(M&&M[c(178)]&&Number(M[c(178)])>0){const R=Number(M[c(178)]);v===1&&(b=R),v===2&&(A=R),v===3&&(E=R)}}const z=N[c(301)];let D=0;if(z===1||Number(z)===1)D=b;else if(z===2||Number(z)===2)D=A;else if(z===3||Number(z)===3)D=E;else{let v=0,M=0;b>0&&(v+=b,M++),A>0&&(v+=A,M++),E>0&&(v+=E,M++),D=M>0?Math[c(208)](v/M):0}m[N.id]={q1:b,q2:A,q3:E,final:D,term:z}});const s=u[t(334)](N=>{const c=t,b=N[c(272)].trim()[c(160)]();return[c(319),c(165),"general mathematics","general science",c(329),c(121),c(309)][c(258)](E=>b[c(315)](E))}),g=s[t(334)](N=>{const c=t,b=y(N[c(272)]);return b===c(136)||b===c(288)});let h=0,r=0,d=0,i=0,n;if(g[t(186)]>0){const N=g[t(263)](B=>y(B[t(272)])===t(136)),c=g.find(B=>y(B[t(272)])==="mabisangkomunikasyon");N&&N[t(301)]?n=N[t(301)]:c&&c[t(301)]&&(n=c[t(301)]);const b=N?m[N.id]:null,A=c?m[c.id]:null,E=b?.q1||0,z=A?.q1||0;E>0&&z>0?h=Math[t(208)]((E+z)/2):E>0?h=E:z>0&&(h=z);const D=b?.q2||0,v=A?.q2||0;D>0&&v>0?r=Math.round((D+v)/2):D>0?r=D:v>0&&(r=v);const M=b?.q3||0,R=A?.q3||0;if(M>0&&R>0?d=Math.round((M+R)/2):M>0?d=M:R>0&&(d=R),n===1||Number(n)===1)i=h;else if(n===2||Number(n)===2)i=r;else if(n===3||Number(n)===3)i=d;else{let B=0,U=0;h>0&&(B+=h,U++),r>0&&(B+=r,U++),d>0&&(B+=d,U++),i=U>0?Math[t(208)](B/U):0}}const o={};o[t(317)]={q1:h>0?h[t(337)]():"",q2:r>0?r[t(337)]():"",q3:d>0?d.toString():"",final:i>0?i.toString():"",remarks:i>0?i>=75?t(179):t(266):"",term:n},u[t(261)](N=>{const c=t,b=m[N.id];o[N.id]={q1:b.q1>0?b.q1[c(337)]():"",q2:b.q2>0?b.q2.toString():"",q3:b.q3>0?b.q3.toString():"",final:b[c(127)]>0?b.final[c(337)]():"",remarks:b[c(127)]>0?b[c(127)]>=75?c(179):c(266):"",term:b.term}});let l=0,_=0,P=0,Y=0,J=0,H=0,O=0,K=0;const x0=N=>{const c=t,b=u[c(263)](E=>E.id===N);if(!b)return!1;const A=y(b[c(272)]);return A==="effectivecommunication"||A===c(288)};u[t(261)](N=>{const c=t;if(x0(N.id))return;const b=m[N.id];b.q1>0&&!W(b[c(301)],1)&&(l+=b.q1,_++),b.q2>0&&!W(b[c(301)],2)&&(P+=b.q2,Y++),b.q3>0&&!W(b[c(301)],3)&&(J+=b.q3,H++),b[c(127)]>0&&(O+=b[c(127)],K++)}),g[t(186)]>0&&(h>0&&!W(n,1)&&(l+=h,_++),r>0&&!W(n,2)&&(P+=r,Y++),d>0&&!W(n,3)&&(J+=d,H++),i>0&&(O+=i,K++));const T=_>0?Math.round(l/_).toString():"",V=Y>0?Math[t(208)](P/Y).toString():"",C=H>0?Math[t(208)](J/H)[t(337)]():"",a0=K>0?Math[t(208)](O/K)[t(337)]():"",r0=a0?Number(a0)>=75?"Passed":"Failed":"";return{subjectGrades:o,genAvg:a0,genRemarks:r0,genT1:T,genT2:V,genT3:C}},[u,S,e[x(248)],k]),I=(e[x(306)]+", "+e[x(166)]+" "+(e[x(164)]?e[x(164)][0]+".":"")).trim(),X=G.useMemo(()=>{const t=x;return I[t(186)]>35?t(190):I[t(186)]>25?t(341):t(123)},[I]),Z=(t,m)=>{const s=x,g=t[s(186)];if(g===0)return{fontSize:s(185)};const h=m?158:170,r=.54,d=h/(g*r),i=Math[s(330)](7.5,Math[s(226)](10,d));return{fontSize:i[s(316)](2)+"px",lineHeight:i<8.5?"1":s(320)}},f=G.useMemo(()=>{const t=x,m=[],s=[];u[t(261)](o=>{const l=t,_=o[l(272)][l(294)]().toLowerCase();[l(319),l(165),"general mathematics",l(132),l(329),l(121),l(309)][l(258)](Y=>_[l(315)](Y))?m[l(209)](o):s[l(209)](o)});const g=m[t(334)](o=>{const l=t,_=y(o.subject_name);return _===l(136)||_==="mabisangkomunikasyon"}),h=m[t(334)](o=>{const l=t,_=y(o[l(272)]);return _!==l(136)&&_!==l(288)}),r=t0(h,o=>o[t(272)]),d=t0(s,o=>o.subject_name),i=[],n=[];if(g[t(186)]>0){const o=g[t(263)](P=>y(P[t(272)])===t(136)),l=g[t(263)](P=>y(P[t(272)])===t(288)),_=o?.term||l?.[t(301)];n[t(209)]({type:t(217),name:"Effective Communication & Mabisang Komunikasyon",id:t(317),term:_}),o&&n[t(209)]({type:"subject",name:o[t(272)],id:o.id,isComponent:!0,term:o[t(301)]}),l&&n[t(209)]({type:"subject",name:l[t(272)],id:l.id,isComponent:!0,term:l.term})}return r.forEach(o=>{const l=t;n[l(209)]({type:l(207),name:o[l(272)],id:o.id,term:o[l(301)]})}),n[t(186)]>0&&(i.push({type:t(311),name:"Core Subjects"}),i.push(...n)),d[t(186)]>0&&(i[t(209)]({type:t(311),name:t(344)}),d.forEach(o=>{const l=t;i.push({type:l(207),name:o[l(272)],id:o.id,term:o[l(301)]})})),i},[u]);return a[x(224)](x(180),{className:x(347),children:[a.jsxs("div",{className:x(196),children:[a[x(296)](x(249),{src:Q,className:x(139),alt:"DepEd"}),a[x(224)](x(180),{className:"text-center font-bold leading-none",children:[a[x(296)]("p",{className:"uppercase text-[9px]",children:w[x(155)]}),a[x(224)]("p",{className:"uppercase text-[9px] font-normal tracking-wide mt-0.5",children:[x(290),k]}),a.jsx("h3",{className:x(325),children:x(332)})]}),a[x(296)](x(249),{src:q,className:x(139),alt:x(326)})]}),a[x(224)](x(180),{className:x(291),children:[a[x(224)](x(180),{className:x(237),children:[a[x(296)]("span",{className:x(220),children:"Name:"}),a[x(296)](x(218),{className:x(187)+X,children:I})]}),a[x(224)]("div",{className:"flex gap-4 mb-0.5",children:[a[x(224)]("div",{className:"flex flex-1",children:[a[x(296)]("span",{className:"w-10",children:x(259)}),a.jsx(x(218),{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none",children:e[x(248)]})]}),a.jsxs(x(180),{className:x(284),children:[a.jsx(x(218),{className:"w-8",children:x(167)}),a[x(296)](x(218),{className:x(255),children:e[x(188)]||""})]})]}),a[x(224)](x(180),{className:x(323),children:[a.jsxs("div",{className:x(276),children:[a[x(296)](x(218),{className:x(122),children:x(147)}),a[x(296)](x(218),{className:"flex-1 border-b border-black font-bold leading-none text-center pb-0.5",children:p?.[x(141)]?.[x(210)](/Grade/i,"")[x(294)]()||""})]}),a[x(224)](x(180),{className:"flex flex-1",children:[a[x(296)](x(218),{className:"w-10 shrink-0",children:x(129)}),a[x(296)](x(218),{className:"flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5",children:p?.[x(134)]||""})]}),a[x(224)](x(180),{className:"flex flex-[1.2]",children:[a.jsx(x(218),{className:x(143),children:x(295)}),a[x(296)](x(218),{className:x(292),children:e.track||""})]})]})]}),a.jsx(x(180),{className:x(195),children:a[x(224)](x(238),{className:x(153),children:[a[x(224)](x(343),{children:[a.jsxs("tr",{children:[a[x(296)]("th",{rowSpan:2,className:x(204),children:x(202)}),a.jsx("th",{colSpan:3,children:"TERM"}),a[x(296)]("th",{rowSpan:2,className:x(251),children:a.jsx(x(180),{className:x(241),children:"FINAL GRADE"})}),a[x(296)]("th",{rowSpan:2,className:x(203),children:"REMARKS"})]}),a[x(224)]("tr",{children:[a[x(296)]("th",{className:"q-col",children:"1"}),a[x(296)]("th",{className:x(211),children:"2"}),a[x(296)]("th",{className:x(211),children:"3"})]})]}),a[x(224)](x(197),{children:[f[x(239)]((t,m)=>{const s=x;if(t[s(252)]===s(311))return a[s(296)]("tr",{children:a[s(296)]("td",{colSpan:6,style:{backgroundColor:s(205),fontWeight:s(246),textAlign:s(243),padding:s(308),fontSize:s(200),textTransform:s(242)},children:t.name})},s(184)+m);const g=t[s(252)]===s(217),h=g?"parent_ec_mk":t.id,r=j[s(302)][h]||{q1:"",q2:"",q3:"",final:"",remarks:""},d=!g&&t[s(322)];return a[s(224)]("tr",{children:[a[s(296)]("td",{className:s(324)+(d?"pl-3 font-normal":s(282)),style:{...Z(t.name,d),fontWeight:s(d?312:246)},children:t[s(155)]}),[1,2,3][s(239)](i=>{const n=s;if(W(t[n(301)],i))return a[n(296)]("td",{className:n(211),style:{backgroundColor:n(205)},children:" "},i);const l=i===1?r.q1:i===2?r.q2:r.q3;return a[n(296)]("td",{className:"q-col",children:l||" "},i)}),a[s(296)]("td",{className:"final-col",children:r.final||" "}),a[s(296)]("td",{className:s(148),children:r[s(229)]||" "})]},h)}),a.jsx("tr",{style:{height:x(283)},children:a[x(296)]("td",{colSpan:6,style:{backgroundColor:"black",height:x(283),padding:0,borderLeft:x(192),borderRight:"1px solid black",borderTop:"1px solid black",borderBottom:x(192)}})}),a[x(224)]("tr",{children:[a[x(296)]("td",{className:x(264),children:x(300)}),a[x(296)]("td",{className:"q-col font-bold",children:j[x(198)]||" "}),a.jsx("td",{className:"q-col font-bold",children:j[x(201)]||" "}),a[x(296)]("td",{className:x(346),children:j.genT3||" "}),a.jsx("td",{className:x(247),children:j[x(236)]||" "}),a[x(296)]("td",{className:x(310),children:j[x(318)]||" "})]})]})]})}),a.jsxs(x(180),{className:"mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center",children:[a.jsx("p",{className:x(275),children:x(227)}),a.jsxs(x(180),{className:x(342),children:[a[x(296)](x(180),{className:"font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none",children:w[x(169)]||x(173)}),a[x(296)]("p",{className:"text-[8px] italic mt-0.5",children:x(176)})]})]})]})}function e0(){const e=["w-10 text-[9px]","330.2mm","3IGFyth","flex-1 border-b border-black font-bold leading-none text-center pb-0.5","jsxs","Page ","min","Prepared by:","logo_url","remarks","Print Slips","arts","option","w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mb-6","FINAL GRADE","w-8","genAvg","flex mb-0.5 items-baseline","table","map","3416040sNWZXp","w-min mx-auto","uppercase","left","slice","112524ExGzeP","bold","final-col font-bold","lrn","img","A4 portrait","final-col leading-tight","type","h-full bg-slate-50 flex flex-col overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible","music","flex-1 border-b border-black font-bold pb-0.5 leading-none text-center","8.5in 13in portrait","w-3.5 h-3.5","some","LRN:","1039332DcGHFp","forEach","student_lrn","find","subject-col font-bold text-[10px] text-center pb-1 pt-1","deped_logo_left.png","Failed","ceil","console","Zoom Out","bind","quarter","subject_name","folio","school-forms","text-[8px] mb-1 w-full text-center","flex flex-1","subject_id","Zoom In","apply","bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer","uppercase text-[9px]","font-bold","2px","flex w-20","return (function() ","Temporary Grade Slip","localeCompare","mabisangkomunikasyon","text-[8px] italic mt-0.5","SCHOOL YEAR: ","mb-1.5 px-1 shrink-0 text-[9px]","flex-1 border-b border-black font-bold leading-none pb-0.5 uppercase text-center","mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center","trim","Track:","jsx","text-center font-bold leading-none","prototype","height","General Average","term","subjectGrades","1428360BvyRGF","1418964rmJRyo"," - ","last_name","error","2px 4px","kasaysayan at lipunang pilipino","remarks-col text-[6.5px] tracking-tighter uppercase font-bold","header","normal","scale(","215.9mm","includes","toFixed","parent_ec_mk","genRemarks","effective communication","1.1","w-15","isComponent","flex gap-4","subject-col ","text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none","School","w-10 h-10 text-slate-400","useMemo","life and career skills","max","p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600","Grade Slip","__proto__","filter","print-page relative","section_id","toString","is_advisory_class","w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm","flex items-center gap-4","text-[8.2px] leading-tight","w-45 mx-auto text-center mt-2.5","thead","Electives",'{}.constructor("return this")( )',"q-col font-bold","grade-slip-card font-serif text-[9px] relative text-black leading-tight","flex-1 overflow-auto p-8 flex flex-col items-center bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible custom-scrollbar","Male","from","267863sdXris","is_advisory","24HYfGFK","pag-aaral ng kasaysayan at lipunang pilipino","w-15 shrink-0","text-[9px]","letter portrait","No Advisory Class Set","useState","final","h-8 w-px bg-slate-200","Section:","flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200","2289415snyitH","general science","h-8 w-px bg-slate-200 mx-2","section_name","Student Resource Tool","effectivecommunication","Please set up your advisory grade level and section details in your Profile to generate temporary grade slips.","target","w-10 h-10 object-contain","210mm","section_grade_level","w-11.25","w-10 shrink-0","button","REMARKS","grade_level","Grade Level:","remarks-col text-[6.5px] tracking-tighter uppercase","constructor","final-col"," of ","TERM","grade-table","h-11 px-6 rounded-xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2","name","italic pl-3","none","health","school_year","toLowerCase","297mm","text-sm text-slate-500 font-medium leading-relaxed","gender","middle_name","mabisang komunikasyon","first_name","Age:","exception","adviser_name","physical","flex-1 border-b border-black font-bold pb-0.5 leading-none",`;
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
            `,"_________________________","w-5 h-5","select","Adviser","Folio / Long (8.5 x 13in)","final_grade","Passed","div","style","text-xl font-black text-slate-800 mb-2",`;
                    height: `,"header-","10px","length","flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ","age","flex items-center gap-3","text-[7.5px] leading-tight","flex-1 flex flex-col items-center justify-center text-center max-w-md","1px solid black","school-logo.png","Name:","flex-1 min-h-0 mb-1.5 px-1","flex items-center justify-between mb-1.5 px-1 shrink-0","tbody","genT1",`;
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
                        size: `,"8px","genT2","LEARNING AREAS","remarks-col","subject-col","#E5E7EB","w-10","subject","round","push","replace","q-col","width","flex items-center gap-6","w-4 h-4","all","text-xs font-bold text-slate-900 w-12 text-center tabular-nums","parent","span","279.4mm"];return e0=function(){return e},e0()}export{_0 as TemporaryGradeSlipPage};
