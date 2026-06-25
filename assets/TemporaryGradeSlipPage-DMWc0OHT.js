import{r as R,j as a,ck as r0,bE as s0,c6 as l0,cu as i0,cA as d0}from"./vendor-LK1VZhIQ.js";import{b as o0,s as t0,n as S}from"./index-C8iV3Rws.js";import"./vendor-pdf-libs-MESoeBbz.js";import"./vendor-firebase-DM2ua5U3.js";import"./vendor-framer-motion-RPyr9DzJ.js";(function(e,N){const u=O,p=e();for(;;)try{if(-parseInt(u(238))/1+parseInt(u(244))/2+-parseInt(u(289))/3*(-parseInt(u(166))/4)+-parseInt(u(328))/5+-parseInt(u(250))/6+parseInt(u(268))/7+-parseInt(u(222))/8===N)break;p.push(p.shift())}catch{p.push(p.shift())}})(e0,567295);const $=(function(){let e=!0;return function(N,u){const p=e?function(){const k=O;if(u){const v=u[k(290)](N,arguments);return u=null,v}}:function(){};return e=!1,p}})(),n0=$(void 0,function(){const e=O;let N;try{N=Function(e(293)+e(275)+");")()}catch{N=window}const u=N[e(135)]=N[e(135)]||{},p=["log",e(312),"info",e(107),"exception",e(315),"trace"];for(let k=0;k<p.length;k++){const v=$[e(158)].prototype[e(296)]($),x=p[k],Y=u[x]||v;v.__proto__=$.bind($),v[e(210)]=Y.toString[e(296)](Y),u[x]=v}});n0();function O(e,N){return e=e-104,e0()[e]}function _0(){const e=O,{students:N,sections:u,subjects:p,schoolProfile:k,setCurrentView:v,gradingSheetRecords:x,activeSchoolYear:Y}=o0(),[T,U]=R[e(271)](""),[j,I]=R[e(271)](e(108)),[J,Q]=R[e(271)](1),h=R[e(142)](()=>{const c=e;return[...u[c(193)](l=>l[c(212)]||l[c(213)])][c(245)]((l,n)=>{const o=c,s=(l[o(119)]||"")[o(283)](n[o(119)]||"",void 0,{numeric:!0});return s!==0?s:(l[o(170)]||"").localeCompare(n[o(170)]||"")})},[u]);R.useEffect(()=>{const c=e;if(!T&&h[c(249)]>0){const d=setTimeout(()=>{const l=c;U(h[0][l(170)])},0);return()=>clearTimeout(d)}},[h,T]);const t=R.useMemo(()=>{const c=e;return T?N.filter(d=>d.student_section===T)[c(245)]((d,l)=>{const n=c;return d[n(220)]!==l[n(220)]?d[n(220)]===n(189)?-1:1:d[n(131)][n(283)](l[n(131)])}):[]},[N,T]),m=R[e(142)](()=>{const c=e;return u.find(d=>d[c(170)]===T||d.id===T)},[u,T]),r=R[e(142)](()=>{const c=e;if(!m)return[];const d=parseInt(m.section_grade_level.replace(/\D/g,""))||0;let l=p[c(193)](n=>n[c(229)]===m.id&&n.term!=="none");return l[c(249)]===0&&(l=p[c(193)](n=>{const o=c,s=parseInt(n.grade_level?.toString().replace(/\D/g,"")||"0");return!n.section_id&&s===d&&n[o(281)]!=="none"})),t0(l,n=>n[c(121)])},[p,m]),g=()=>{window[e(330)]()},b={a4:{height:e(286),width:e(257),cssSize:e(316)},letter:{height:"279.4mm",width:e(118),cssSize:e(216)},folio:{height:e(215),width:e(118),cssSize:e(209)}};return a[e(321)](e(204),{className:e(123),children:[a.jsx(e(198),{children:`
                .print-page {
                    width: `+b[j].width+`;
                    height: `+b[j][e(267)]+e(295)+b[j][e(128)]+e(183)}),a.jsxs(e(204),{className:e(126),children:[a.jsxs(e(204),{className:e(311),children:[a.jsx(e(133),{onClick:()=>v(e(125)),className:e(137),children:a.jsx(r0,{className:e(303)})}),a[e(321)](e(204),{children:[a[e(141)]("h2",{className:e(308),children:e(205)}),a.jsx("p",{className:e(211),children:m?m.section_grade_level+e(323)+m.section_name:e(150)})]}),a[e(141)]("div",{className:e(171)}),a[e(141)](e(204),{className:e(110),children:a[e(321)](e(270),{className:e(297),value:j,onChange:c=>I(c.target[e(327)]),children:[a[e(141)](e(227),{value:e(108),children:e(307)}),a.jsx(e(227),{value:"a4",children:e(280)}),a.jsx("option",{value:"folio",children:e(195)})]})})]}),a[e(321)](e(204),{className:e(304),children:[a[e(321)](e(204),{className:e(313),children:[a[e(141)](e(133),{onClick:()=>Q(c=>Math[e(235)](.4,c-.1)),className:"w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm",title:e(298),children:a[e(141)](s0,{className:e(320)})}),a[e(321)](e(217),{className:e(225),children:[Math[e(104)](J*100),"%"]}),a[e(141)](e(133),{onClick:()=>Q(c=>Math[e(309)](1.5,c+.1)),className:e(294),title:e(318),children:a[e(141)](l0,{className:"w-3.5 h-3.5"})})]}),a.jsx(e(204),{className:"h-8 w-px bg-slate-200"}),a[e(321)](e(133),{onClick:g,disabled:t[e(249)]===0,className:e(314),children:[a[e(141)](i0,{className:e(190)}),e(319)]})]})]}),a[e(141)](e(204),{className:e(160),children:t[e(249)]>0?a[e(141)](e(204),{className:e(326),style:{transform:e(138)+J+")"},children:a[e(141)](e(204),{className:"print:w-full flex flex-col items-center gap-8 print:gap-0",children:Array.from({length:Math[e(237)](t[e(249)]/4)})[e(162)]((c,d)=>a[e(321)](e(204),{className:"print-page relative",children:[a[e(321)](e(204),{className:"absolute -top-6 right-0 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden",children:[e(253),d+1," of ",Math.ceil(t[e(249)]/4)]}),a.jsx(e(204),{className:"cut-cross"}),t[e(239)](d*4,(d+1)*4)[e(162)](l=>{const n=e,o=parseInt(m?.section_grade_level?.[n(156)](/\D/g,"")||"0");return o===11||o===12?a[n(141)](m0,{student:l,schoolProfile:k,section:m,subjects:r,records:x,activeSchoolYear:Y},l[n(301)]):a[n(141)](f0,{student:l,schoolProfile:k,section:m,subjects:r,records:x,activeSchoolYear:Y},l[n(301)])})]},d))})}):a.jsxs(e(204),{className:e(134),children:[a[e(141)](e(204),{className:e(279),children:a.jsx(d0,{className:e(175)})}),a[e(141)]("h3",{className:e(194),children:"No Advisory Class Set"}),a[e(141)]("p",{className:e(184),children:e(116)})]})})]})}function f0({student:e,schoolProfile:N,section:u,subjects:p,records:k,activeSchoolYear:v}){const x=O,Y="./",T=N[x(109)]||x(300),U=Y+x(259),j=R[x(142)](()=>{const h=x,t={};let m=0,r=0;const g={t1:0,t2:0,t3:0},b={t1:0,t2:0,t3:0};p.forEach(s=>{const _=O;let P="",D="",W="",F=0,H=0;for(let z=1;z<=3;z++){const Z=k[_(149)](M=>M[_(276)]===e.lrn&&M[_(144)]===s.id&&Number(M[_(233)])===z&&M[_(299)]===v);if(Z&&Z.final_grade&&Number(Z[_(145)])>0){const M=Number(Z.final_grade);z===1&&(P=M[_(210)](),g.t1+=M,b.t1++),z===2&&(D=M.toString(),g.t2+=M,b.t2++),z===3&&(W=M.toString(),g.t3+=M,b.t3++),F+=M,H++}}let K="",x0="";if(H>0){const z=Math[_(104)](F/H);K=z[_(210)](),m+=z,r++,x0=z>=75?"Passed":_(248)}t[s.id]={q1:P,q2:D,q3:W,final:K,remarks:x0}});const c=r>0?Math.round(m/r)[h(210)]():"",d=c?Number(c)>=75?h(272):h(248):"",l=b.t1>0?Math[h(104)](g.t1/b.t1).toString():"",n=b.t2>0?Math[h(104)](g.t2/b.t2)[h(210)]():"",o=b.t3>0?Math.round(g.t3/b.t3)[h(210)]():"";return{subjectGrades:t,genAvg:c,genRemarks:d,genT1:l,genT2:n,genT3:o}},[p,k,e[x(301)],v]),I=(e.last_name+", "+e[x(261)]+" "+(e[x(246)]?e[x(246)][0]+".":""))[x(173)](),J=R[x(142)](()=>{const h=x;return I[h(249)]>35?h(113):I[h(249)]>25?h(260):h(221)},[I]),Q=h=>{const t=x,m=h[t(249)];if(m===0)return{fontSize:"10px"};const r=S(h)[t(228)](t(155))||S(h)[t(228)](t(269))||S(h).includes(t(214))||S(h).includes(t(288)),g=r?158:170,b=.54,c=g/(m*b),d=Math[t(235)](7.5,Math[t(309)](10,c));return{fontSize:d[t(219)](2)+"px",lineHeight:d<8.5?"1":t(111)}};return a[x(321)](x(204),{className:x(243),children:[a[x(321)]("div",{className:x(179),children:[a[x(141)]("img",{src:U,className:x(196),alt:"DepEd"}),a[x(321)](x(204),{className:x(177),children:[a.jsx("p",{className:x(182),children:N[x(266)]}),a[x(321)]("p",{className:x(230),children:["SCHOOL YEAR: ",v]}),a[x(141)]("h3",{className:x(161),children:"Grade Slip"})]}),a[x(141)](x(331),{src:T,className:x(196),alt:"School"})]}),a[x(321)](x(204),{className:x(252),children:[a[x(321)](x(204),{className:x(136),children:[a[x(141)](x(217),{className:"w-10 text-[9px]",children:x(264)}),a[x(141)]("span",{className:x(305)+J,children:I})]}),a[x(321)]("div",{className:"flex gap-4 mb-0.5",children:[a[x(321)](x(204),{className:x(178),children:[a[x(141)](x(217),{className:x(200),children:"LRN:"}),a[x(141)](x(217),{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none",children:e[x(301)]})]}),a[x(321)](x(204),{className:x(165),children:[a.jsx("span",{className:x(148),children:x(185)}),a.jsx(x(217),{className:x(188),children:e[x(322)]||""})]})]}),a[x(321)](x(204),{className:x(122),children:[a[x(321)]("div",{className:x(178),children:[a[x(141)](x(217),{className:x(236),children:x(146)}),a[x(141)](x(217),{className:x(207),children:u?.[x(119)]?.[x(156)](/Grade/i,"")[x(173)]()||""})]}),a[x(321)](x(204),{className:x(178),children:[a[x(141)](x(217),{className:"w-11.25",children:x(282)}),a[x(141)](x(217),{className:x(292),children:u?.section_name||""})]})]})]}),a.jsx(x(204),{className:"flex-1 min-h-0 mb-1.5 px-1",children:a[x(321)](x(315),{className:x(247),children:[a[x(321)](x(181),{children:[a[x(321)]("tr",{children:[a[x(141)]("th",{rowSpan:2,className:x(218),children:x(226)}),a.jsx("th",{colSpan:3,children:x(159)}),a[x(141)]("th",{rowSpan:2,className:"final-col leading-tight",children:a[x(141)](x(204),{className:x(256),children:x(206)})}),a[x(141)]("th",{rowSpan:2,className:"remarks-col",children:x(199)})]}),a.jsxs("tr",{children:[a[x(141)]("th",{className:"q-col",children:"1"}),a[x(141)]("th",{className:x(169),children:"2"}),a.jsx("th",{className:x(169),children:"3"})]})]}),a[x(321)](x(154),{children:[p.map(h=>{const t=x,m=j[t(262)][h.id],r=S(h[t(121)])[t(228)](t(155))||S(h[t(121)])[t(228)](t(269))||S(h[t(121)])[t(228)](t(214))||S(h.subject_name).includes(t(288));return a.jsxs("tr",{children:[a[t(141)]("td",{className:t(163)+(r?"italic pl-3":""),style:Q(h[t(121)]),children:h[t(121)]}),a[t(141)]("td",{className:"q-col",children:m.q1||" "}),a.jsx("td",{className:t(169),children:m.q2||" "}),a[t(141)]("td",{className:t(169),children:m.q3||" "}),a.jsx("td",{className:"final-col",children:m.final||" "}),a[t(141)]("td",{className:"remarks-col text-[6.5px] tracking-tighter uppercase",children:m[t(192)]||" "})]},h.id)}),a.jsx("tr",{style:{height:x(291)},children:a[x(141)]("td",{colSpan:6,style:{backgroundColor:"black",height:"2px",padding:0,borderLeft:x(106),borderRight:x(106),borderTop:"1px solid black",borderBottom:x(106)}})}),a[x(321)]("tr",{children:[a[x(141)]("td",{className:x(174),children:x(151)}),a[x(141)]("td",{className:x(117),children:j[x(167)]||" "}),a[x(141)]("td",{className:x(117),children:j.genT2||" "}),a[x(141)]("td",{className:x(117),children:j[x(240)]||" "}),a[x(141)]("td",{className:x(306),children:j[x(329)]||" "}),a.jsx("td",{className:"remarks-col text-[6.5px] tracking-tighter uppercase font-bold",children:j[x(114)]||" "})]})]})]})}),a.jsxs(x(204),{className:"mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center",children:[a[x(141)]("p",{className:x(127),children:x(231)}),a[x(321)](x(204),{className:x(255),children:[a[x(141)](x(204),{className:"font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none",children:N[x(186)]||"_________________________"}),a[x(141)]("p",{className:x(287),children:x(224)})]})]})]})}function V(e,N){if(e===void 0||e==="all"||e===O(112)||e===null)return!1;const p=Number(e);return isNaN(p)?!1:p!==N}function e0(){const e=[" - ","remarks-col text-[6.5px] tracking-tighter uppercase","pag-aaral ng kasaysayan at lipunang pilipino","print-preview-container print:w-full flex flex-col items-center transition-all duration-300 ease-out origin-top print:scale-100","value","4188290hjrjUO","genAvg","print","img","round","final-col leading-tight","1px solid black","error","letter","logo_url","flex items-center gap-3","1.1","none","text-[7.5px] leading-tight","genRemarks","parent","Please set up your advisory grade level and section details in your Profile to generate temporary grade slips.","q-col font-bold","215.9mm","section_grade_level","bold","subject_name","flex gap-4","h-full bg-slate-50 flex flex-col overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible","subject","school-forms","h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-100 shadow-sm print:hidden","text-[8px] mb-1 w-full text-center","cssSize","isComponent","normal","last_name","forEach","button","flex-1 flex flex-col items-center justify-center text-center max-w-md","console","flex mb-0.5 items-baseline","p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600","scale(","remarks-col text-[6.5px] tracking-tighter uppercase font-bold","header","jsx","useMemo","parent_ec_mk","subject_id","final_grade","Grade Level:","kasaysayan at lipunang pilipino","w-8","find","Student Resource Tool","General Average","some","#E5E7EB","tbody","music","replace","School","constructor","TERM","flex-1 overflow-auto p-8 flex flex-col items-center bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible custom-scrollbar","text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none","map","subject-col ","8px","flex w-20","4231556uJvHlf","genT1","pl-3 font-normal","q-col","section_name","h-8 w-px bg-slate-200 mx-2","font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none","trim","subject-col font-bold text-[10px] text-center pb-1 pt-1","w-10 h-10 text-slate-400","remarks-col","text-center font-bold leading-none","flex flex-1","flex items-center justify-between mb-1.5 px-1 shrink-0","_________________________","thead","uppercase text-[9px]",`;
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
            `,"text-sm text-slate-500 font-medium leading-relaxed","Age:","adviser_name","final","flex-1 border-b border-black font-bold pb-0.5 leading-none text-center","Male","w-4 h-4","flex-1 min-h-0 mb-1.5 px-1","remarks","filter","text-xl font-black text-slate-800 mb-2","Folio / Long (8.5 x 13in)","w-10 h-10 object-contain","life and career skills","style","REMARKS","w-10","uppercase","mabisangkomunikasyon","left","div","Temporary Grade Slip","FINAL GRADE","flex-1 border-b border-black font-bold leading-none text-center pb-0.5","black","8.5in 13in portrait","toString","text-[10px] font-black text-orange-600 uppercase tracking-widest","is_advisory","is_advisory_class","physical","330.2mm","letter portrait","span","subject-col","toFixed","gender","text-[9px]","1535352RrDVjh","Track:","Adviser","text-xs font-bold text-slate-900 w-12 text-center tabular-nums","LEARNING AREAS","option","includes","section_id","uppercase text-[9px] font-normal tracking-wide mt-0.5","Prepared by:","general mathematics","quarter","final-col","max","w-15","ceil","838077ztILNk","slice","genT3","effectivecommunication","DepEd","grade-slip-card font-serif text-[9px] relative text-black leading-tight","1406112VTtMet","sort","middle_name","grade-table","Failed","length","508944rOAdQT","flex gap-4 mb-0.5","mb-1.5 px-1 shrink-0 text-[9px]","Page ","flex-1 border-b border-black font-bold leading-none pb-0.5 uppercase text-center","w-45 mx-auto text-center mt-2.5","w-min mx-auto","210mm","Electives","deped_logo_left.png","text-[8.2px] leading-tight","first_name","subjectGrades","SCHOOL YEAR: ","Name:","Core Subjects","name","height","5311796EiJNzu","arts","select","useState","Passed","push","type",'{}.constructor("return this")( )',"student_lrn","mabisang komunikasyon","w-15 shrink-0","w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mb-6","A4 Size (210 x 297mm)","term","Section:","localeCompare","track","flex flex-[1.2]","297mm","text-[8px] italic mt-0.5","health","3YuCPoQ","apply","2px","flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5","return (function() ","w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm",`;
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
                        size: `,"bind","bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer","Zoom Out","school_year","school-logo.png","lrn","general science","w-5 h-5","flex items-center gap-4","flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ","final-col font-bold","Letter (8.5 x 11in)","text-sm font-black text-slate-900 uppercase tracking-tight","min","toLowerCase","flex items-center gap-6","warn","flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200","h-11 px-6 rounded-xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2","table","A4 portrait","10px","Zoom In","Print Slips","w-3.5 h-3.5","jsxs","age"];return e0=function(){return e},e0()}function m0({student:e,schoolProfile:N,section:u,subjects:p,records:k,activeSchoolYear:v}){const x=O,Y="./",T=N.logo_url||x(300),U=Y+"deped_logo_left.png",j=R[x(142)](()=>{const t=x,m={};p.forEach(w=>{const i=O;let f=0,A=0,E=0;for(let y=1;y<=3;y++){const q=k[i(149)](C=>C.student_lrn===e[i(301)]&&C.subject_id===w.id&&Number(C.quarter)===y&&C[i(299)]===v);if(q&&q[i(145)]&&Number(q.final_grade)>0){const C=Number(q.final_grade);y===1&&(f=C),y===2&&(A=C),y===3&&(E=C)}}const G=w[i(281)];let L=0;if(G===1||Number(G)===1)L=f;else if(G===2||Number(G)===2)L=A;else if(G===3||Number(G)===3)L=E;else{let y=0,q=0;f>0&&(y+=f,q++),A>0&&(y+=A,q++),E>0&&(y+=E,q++),L=q>0?Math[i(104)](y/q):0}m[w.id]={q1:f,q2:A,q3:E,final:L,term:G}});const r=p.filter(w=>{const i=O,f=w.subject_name[i(173)]()[i(310)]();return["effective communication",i(277),i(232),i(302),i(197),i(325),i(147)][i(152)](E=>f.includes(E))}),g=r[t(193)](w=>{const i=t,f=S(w[i(121)]);return f==="effectivecommunication"||f===i(202)});let b=0,c=0,d=0,l=0,n;if(g[t(249)]>0){const w=g[t(149)](B=>S(B[t(121)])===t(241)),i=g[t(149)](B=>S(B.subject_name)==="mabisangkomunikasyon");w&&w[t(281)]?n=w[t(281)]:i&&i[t(281)]&&(n=i[t(281)]);const f=w?m[w.id]:null,A=i?m[i.id]:null,E=f?.q1||0,G=A?.q1||0;E>0&&G>0?b=Math.round((E+G)/2):E>0?b=E:G>0&&(b=G);const L=f?.q2||0,y=A?.q2||0;L>0&&y>0?c=Math.round((L+y)/2):L>0?c=L:y>0&&(c=y);const q=f?.q3||0,C=A?.q3||0;if(q>0&&C>0?d=Math.round((q+C)/2):q>0?d=q:C>0&&(d=C),n===1||Number(n)===1)l=b;else if(n===2||Number(n)===2)l=c;else if(n===3||Number(n)===3)l=d;else{let B=0,X=0;b>0&&(B+=b,X++),c>0&&(B+=c,X++),d>0&&(B+=d,X++),l=X>0?Math[t(104)](B/X):0}}const o={};o[t(143)]={q1:b>0?b[t(210)]():"",q2:c>0?c[t(210)]():"",q3:d>0?d[t(210)]():"",final:l>0?l[t(210)]():"",remarks:l>0?l>=75?t(272):t(248):"",term:n},p[t(132)](w=>{const i=t,f=m[w.id];o[w.id]={q1:f.q1>0?f.q1[i(210)]():"",q2:f.q2>0?f.q2[i(210)]():"",q3:f.q3>0?f.q3[i(210)]():"",final:f.final>0?f[i(187)].toString():"",remarks:f[i(187)]>0?f[i(187)]>=75?"Passed":i(248):"",term:f[i(281)]}});let s=0,_=0,P=0,D=0,W=0,F=0,H=0,K=0;const x0=w=>{const i=t,f=p[i(149)](E=>E.id===w);if(!f)return!1;const A=S(f[i(121)]);return A===i(241)||A===i(202)};p.forEach(w=>{const i=t;if(x0(w.id))return;const f=m[w.id];f.q1>0&&!V(f[i(281)],1)&&(s+=f.q1,_++),f.q2>0&&!V(f[i(281)],2)&&(P+=f.q2,D++),f.q3>0&&!V(f[i(281)],3)&&(W+=f.q3,F++),f.final>0&&(H+=f[i(187)],K++)}),g[t(249)]>0&&(b>0&&!V(n,1)&&(s+=b,_++),c>0&&!V(n,2)&&(P+=c,D++),d>0&&!V(n,3)&&(W+=d,F++),l>0&&(H+=l,K++));const z=_>0?Math[t(104)](s/_)[t(210)]():"",Z=D>0?Math[t(104)](P/D)[t(210)]():"",M=F>0?Math[t(104)](W/F).toString():"",a0=K>0?Math[t(104)](H/K)[t(210)]():"",c0=a0?Number(a0)>=75?t(272):t(248):"";return{subjectGrades:o,genAvg:a0,genRemarks:c0,genT1:z,genT2:Z,genT3:M}},[p,k,e[x(301)],v]),I=(e.last_name+", "+e[x(261)]+" "+(e[x(246)]?e.middle_name[0]+".":""))[x(173)](),J=R[x(142)](()=>{const t=x;return I[t(249)]>35?t(113):I[t(249)]>25?"text-[8.2px] leading-tight":t(221)},[I]),Q=(t,m)=>{const r=x,g=t[r(249)];if(g===0)return{fontSize:r(317)};const b=m?158:170,c=.54,d=b/(g*c),l=Math[r(235)](7.5,Math[r(309)](10,d));return{fontSize:l[r(219)](2)+"px",lineHeight:l<8.5?"1":r(111)}},h=R[x(142)](()=>{const t=x,m=[],r=[];p[t(132)](o=>{const s=t,_=o[s(121)][s(173)]()[s(310)]();["effective communication",s(277),s(232),s(302),"life and career skills",s(325),s(147)][s(152)](D=>_[s(228)](D))?m[s(273)](o):r[s(273)](o)});const g=m[t(193)](o=>{const s=t,_=S(o[s(121)]);return _===s(241)||_===s(202)}),b=m[t(193)](o=>{const s=t,_=S(o.subject_name);return _!==s(241)&&_!==s(202)}),c=t0(b,o=>o[t(121)]),d=t0(r,o=>o.subject_name),l=[],n=[];if(g[t(249)]>0){const o=g[t(149)](P=>S(P[t(121)])===t(241)),s=g[t(149)](P=>S(P[t(121)])==="mabisangkomunikasyon"),_=o?.[t(281)]||s?.[t(281)];n[t(273)]({type:t(115),name:"Effective Communication & Mabisang Komunikasyon",id:t(143),term:_}),o&&n[t(273)]({type:t(124),name:o.subject_name,id:o.id,isComponent:!0,term:o[t(281)]}),s&&n[t(273)]({type:t(124),name:s[t(121)],id:s.id,isComponent:!0,term:s[t(281)]})}return c[t(132)](o=>{const s=t;n[s(273)]({type:s(124),name:o[s(121)],id:o.id,term:o.term})}),n[t(249)]>0&&(l[t(273)]({type:"header",name:t(265)}),l[t(273)](...n)),d[t(249)]>0&&(l[t(273)]({type:t(140),name:t(258)}),d[t(132)](o=>{const s=t;l[s(273)]({type:s(124),name:o[s(121)],id:o.id,term:o[s(281)]})})),l},[p]);return a[x(321)](x(204),{className:x(243),children:[a[x(321)](x(204),{className:x(179),children:[a[x(141)](x(331),{src:U,className:x(196),alt:x(242)}),a[x(321)](x(204),{className:"text-center font-bold leading-none",children:[a.jsx("p",{className:x(182),children:N[x(266)]}),a[x(321)]("p",{className:x(230),children:[x(263),v]}),a.jsx("h3",{className:x(161),children:"Grade Slip"})]}),a.jsx(x(331),{src:T,className:x(196),alt:x(157)})]}),a[x(321)]("div",{className:x(252),children:[a[x(321)](x(204),{className:x(136),children:[a[x(141)](x(217),{className:"w-10 text-[9px]",children:x(264)}),a[x(141)](x(217),{className:x(305)+J,children:I})]}),a[x(321)](x(204),{className:x(251),children:[a[x(321)]("div",{className:"flex flex-1",children:[a[x(141)]("span",{className:"w-10",children:"LRN:"}),a[x(141)](x(217),{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none",children:e[x(301)]})]}),a[x(321)](x(204),{className:x(165),children:[a.jsx(x(217),{className:"w-8",children:x(185)}),a[x(141)](x(217),{className:x(188),children:e[x(322)]||""})]})]}),a.jsxs(x(204),{className:"flex gap-4",children:[a[x(321)](x(204),{className:x(178),children:[a[x(141)](x(217),{className:x(278),children:x(146)}),a[x(141)](x(217),{className:"flex-1 border-b border-black font-bold leading-none text-center pb-0.5",children:u?.[x(119)]?.[x(156)](/Grade/i,"")[x(173)]()||""})]}),a[x(321)](x(204),{className:"flex flex-1",children:[a.jsx(x(217),{className:"w-10 shrink-0",children:"Section:"}),a[x(141)](x(217),{className:x(292),children:u?.section_name||""})]}),a[x(321)](x(204),{className:x(285),children:[a[x(141)]("span",{className:"w-10 shrink-0",children:x(223)}),a[x(141)](x(217),{className:x(254),children:e[x(284)]||""})]})]})]}),a[x(141)](x(204),{className:x(191),children:a[x(321)](x(315),{className:x(247),children:[a[x(321)](x(181),{children:[a.jsxs("tr",{children:[a[x(141)]("th",{rowSpan:2,className:"subject-col",children:"LEARNING AREAS"}),a.jsx("th",{colSpan:3,children:"TERM"}),a[x(141)]("th",{rowSpan:2,className:x(105),children:a.jsx(x(204),{className:x(256),children:x(206)})}),a[x(141)]("th",{rowSpan:2,className:x(176),children:"REMARKS"})]}),a[x(321)]("tr",{children:[a.jsx("th",{className:x(169),children:"1"}),a[x(141)]("th",{className:"q-col",children:"2"}),a[x(141)]("th",{className:x(169),children:"3"})]})]}),a[x(321)](x(154),{children:[h[x(162)]((t,m)=>{const r=x;if(t[r(274)]===r(140))return a.jsx("tr",{children:a[r(141)]("td",{colSpan:6,style:{backgroundColor:r(153),fontWeight:r(120),textAlign:r(203),padding:"2px 4px",fontSize:r(164),textTransform:r(201)},children:t[r(266)]})},"header-"+m);const g=t[r(274)]==="parent",b=g?r(143):t.id,c=j[r(262)][b]||{q1:"",q2:"",q3:"",final:"",remarks:""},d=!g&&t[r(129)];return a[r(321)]("tr",{children:[a[r(141)]("td",{className:r(163)+(d?r(168):"font-bold"),style:{...Q(t[r(266)],d),fontWeight:r(d?130:120)},children:t.name}),[1,2,3][r(162)](l=>{const n=r;if(V(t[n(281)],l))return a[n(141)]("td",{className:n(169),style:{backgroundColor:"#E5E7EB"},children:" "},l);const s=l===1?c.q1:l===2?c.q2:c.q3;return a[n(141)]("td",{className:n(169),children:s||" "},l)}),a[r(141)]("td",{className:r(234),children:c[r(187)]||" "}),a[r(141)]("td",{className:r(324),children:c.remarks||" "})]},b)}),a[x(141)]("tr",{style:{height:x(291)},children:a[x(141)]("td",{colSpan:6,style:{backgroundColor:x(208),height:x(291),padding:0,borderLeft:x(106),borderRight:"1px solid black",borderTop:x(106),borderBottom:x(106)}})}),a.jsxs("tr",{children:[a.jsx("td",{className:x(174),children:x(151)}),a[x(141)]("td",{className:x(117),children:j[x(167)]||" "}),a[x(141)]("td",{className:x(117),children:j.genT2||" "}),a[x(141)]("td",{className:x(117),children:j[x(240)]||" "}),a[x(141)]("td",{className:x(306),children:j[x(329)]||" "}),a[x(141)]("td",{className:x(139),children:j.genRemarks||" "})]})]})]})}),a[x(321)](x(204),{className:"mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center",children:[a[x(141)]("p",{className:x(127),children:x(231)}),a.jsxs(x(204),{className:x(255),children:[a[x(141)](x(204),{className:x(172),children:N[x(186)]||x(180)}),a[x(141)]("p",{className:x(287),children:x(224)})]})]})]})}export{_0 as TemporaryGradeSlipPage};
