import{r as R,j as a,cd as c0,bC as s0,b_ as l0,co as i0,cu as d0}from"./vendor-jb77UrGI.js";import{b as o0,s as t0,n as y}from"./index-Dzi0KcTg.js";import"./vendor-pdf-libs-DfncxlVz.js";import"./vendor-firebase-BnVoqbHU.js";import"./vendor-framer-motion-DCKYskn4.js";(function(e,w){const p=B,u=e();for(;;)try{if(-parseInt(p(270))/1+parseInt(p(298))/2*(-parseInt(p(148))/3)+-parseInt(p(255))/4+parseInt(p(199))/5+parseInt(p(235))/6+-parseInt(p(306))/7*(-parseInt(p(350))/8)+parseInt(p(347))/9*(-parseInt(p(183))/10)===w)break;u.push(u.shift())}catch{u.push(u.shift())}})(e0,154065);const $=(function(){let e=!0;return function(w,p){const u=e?function(){const S=B;if(p){const k=p[S(155)](w,arguments);return p=null,k}}:function(){};return e=!1,u}})(),r0=$(void 0,function(){const e=B,w=function(){const k=B;let x;try{x=Function(k(369)+'{}.constructor("return this")( ));')()}catch{x=window}return x},p=w(),u=p.console=p[e(141)]||{},S=[e(268),e(187),e(322),"error",e(359),"table","trace"];for(let k=0;k<S.length;k++){const x=$[e(362)][e(316)][e(217)]($),P=S[k],q=u[P]||x;x[e(358)]=$[e(217)]($),x[e(314)]=q[e(314)][e(217)](q),u[P]=x}});r0();function B(e,w){return e=e-140,e0()[e]}function _0(){const e=B,{students:w,sections:p,subjects:u,schoolProfile:S,setCurrentView:k,gradingSheetRecords:x,activeSchoolYear:P}=o0(),[q,J]=R.useState(""),[j,I]=R[e(320)](e(319)),[W,Z]=R[e(320)](1),m=R[e(184)](()=>{const n=e;return[...p[n(223)](s=>s[n(346)]||s[n(168)])][n(326)]((s,c)=>{const l=n,i=(s[l(206)]||"")[l(182)](c.section_grade_level||"",void 0,{numeric:!0});return i!==0?i:(s[l(334)]||"")[l(182)](c[l(334)]||"")})},[p]);R[e(191)](()=>{const n=e;if(!q&&m[n(171)]>0){const d=setTimeout(()=>{const s=n;J(m[0][s(334)])},0);return()=>clearTimeout(d)}},[m,q]);const t=R[e(184)](()=>{const n=e;return q?w.filter(d=>d[n(330)]===q)[n(326)]((d,s)=>{const c=n;return d[c(262)]!==s.gender?d[c(262)]==="Male"?-1:1:d[c(360)][c(182)](s[c(360)])}):[]},[w,q]),f=R[e(184)](()=>p[e(370)](d=>d.section_name===q||d.id===q),[p,q]),r=R.useMemo(()=>{const n=e;if(!f)return[];const d=parseInt(f.section_grade_level[n(201)](/\D/g,""))||0;let s=u.filter(c=>c.section_id===f.id&&c[n(250)]!==n(274));return s.length===0&&(s=u[n(223)](c=>{const l=n,i=parseInt(c[l(308)]?.[l(314)]()[l(201)](/\D/g,"")||"0");return!c.section_id&&i===d&&c[l(250)]!==l(274)})),t0(s,c=>c[n(351)])},[u,f]),g=()=>{window[e(251)]()},h={a4:{height:e(289),width:"210mm",cssSize:e(286)},letter:{height:e(321),width:"215.9mm",cssSize:e(311)},folio:{height:e(366),width:e(166),cssSize:e(343)}};return a[e(352)]("div",{className:e(234),children:[a[e(178)](e(364),{children:e(192)+h[j][e(145)]+e(318)+h[j][e(169)]+e(179)+h[j][e(295)]+e(275)}),a.jsxs(e(195),{className:e(345),children:[a[e(352)](e(195),{className:"flex items-center gap-6",children:[a[e(178)](e(329),{onClick:()=>k(e(193)),className:e(222),children:a[e(178)](c0,{className:"w-5 h-5"})}),a[e(352)](e(195),{children:[a.jsx("h2",{className:e(340),children:e(245)}),a[e(178)]("p",{className:"text-[10px] font-black text-orange-600 uppercase tracking-widest",children:f?f[e(206)]+" - "+f.section_name:"Student Resource Tool"})]}),a.jsx(e(195),{className:e(210)}),a[e(178)](e(195),{className:e(218),children:a[e(352)](e(151),{className:e(333),value:j,onChange:n=>I(n[e(313)][e(263)]),children:[a[e(178)]("option",{value:e(319),children:e(152)}),a[e(178)](e(280),{value:"a4",children:"A4 Size (210 x 297mm)"}),a[e(178)](e(280),{value:e(242),children:e(144)})]})})]}),a[e(352)](e(195),{className:e(213),children:[a.jsxs(e(195),{className:e(240),children:[a[e(178)](e(329),{onClick:()=>Z(n=>Math.max(.4,n-.1)),className:e(363),title:e(361),children:a[e(178)](s0,{className:e(312)})}),a[e(352)](e(161),{className:"text-xs font-bold text-slate-900 w-12 text-center tabular-nums",children:[Math[e(194)](W*100),"%"]}),a[e(178)](e(329),{onClick:()=>Z(n=>Math[e(276)](1.5,n+.1)),className:"w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm",title:e(163),children:a[e(178)](l0,{className:e(312)})})]}),a[e(178)](e(195),{className:e(266)}),a.jsxs(e(329),{onClick:g,disabled:t[e(171)]===0,className:"h-11 px-6 rounded-xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2",children:[a[e(178)](i0,{className:e(236)}),e(371)]})]})]}),a.jsx("div",{className:e(219),children:t.length>0?a[e(178)](e(195),{className:"print-preview-container print:w-full flex flex-col items-center transition-all duration-300 ease-out origin-top print:scale-100",style:{transform:e(226)+W+")"},children:a.jsx(e(195),{className:e(301),children:Array[e(328)]({length:Math[e(307)](t.length/4)})[e(315)]((n,d)=>a.jsxs(e(195),{className:e(157),children:[a[e(352)](e(195),{className:e(176),children:["Page ",d+1,e(339),Math[e(307)](t[e(171)]/4)]}),a[e(178)]("div",{className:e(335)}),t[e(173)](d*4,(d+1)*4).map(s=>{const c=e,l=parseInt(f?.section_grade_level?.[c(201)](/\D/g,"")||"0");return l===11||l===12?a[c(178)](f0,{student:s,schoolProfile:S,section:f,subjects:r,records:x,activeSchoolYear:P},s.lrn):a[c(178)](b0,{student:s,schoolProfile:S,section:f,subjects:r,records:x,activeSchoolYear:P},s.lrn)})]},d))})}):a[e(352)](e(195),{className:"flex-1 flex flex-col items-center justify-center text-center max-w-md",children:[a[e(178)]("div",{className:e(164),children:a[e(178)](d0,{className:e(279)})}),a[e(178)]("h3",{className:e(284),children:e(355)}),a[e(178)]("p",{className:"text-sm text-slate-500 font-medium leading-relaxed",children:"Please set up your advisory grade level and section details in your Profile to generate temporary grade slips."})]})})]})}function e0(){const e=["FINAL GRADE","select","Letter (8.5 x 11in)","life and career skills","General Average","apply","w-min mx-auto","print-page relative","flex gap-4","remarks-col","final","span","general science","Zoom In","w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mb-6","age","215.9mm","SCHOOL YEAR: ","is_advisory_class","height","LEARNING AREAS","length","genT3","slice","left","uppercase text-[9px] font-normal tracking-wide mt-0.5","absolute -top-6 right-0 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden","2px","jsx",`;
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
                        size: `,"parent_ec_mk","text-center font-bold leading-none","localeCompare","680210NuAjvb","useMemo","text-[9px]","flex w-20","warn","font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none","1px solid black","pag-aaral ng kasaysayan at lipunang pilipino","useEffect",`
                .print-page {
                    width: `,"school-forms","round","div","some","toFixed","genAvg","922160oEyXVl","flex-1 border-b border-black font-bold pb-0.5 leading-none text-center","replace","final_grade","thead","kasaysayan at lipunang pilipino","remarks-col text-[6.5px] tracking-tighter uppercase font-bold","section_grade_level","_________________________","mabisangkomunikasyon","middle_name","h-8 w-px bg-slate-200 mx-2","header-","Prepared by:","flex items-center gap-4","q-col","w-10 h-10 object-contain","max","bind","flex items-center gap-3","flex-1 overflow-auto p-8 flex flex-col items-center bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible custom-scrollbar","forEach","subject","p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600","filter","remarks-col text-[6.5px] tracking-tighter uppercase","grade-table","scale(","subject-col font-bold text-[10px] text-center pb-1 pt-1","table","health","Age:","flex-1 border-b border-black font-bold leading-none text-center pb-0.5","2px 4px","effectivecommunication","h-full bg-slate-50 flex flex-col overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible","1625166qPpULt","w-4 h-4","flex-1 border-b border-black font-bold pb-0.5 leading-none","font-bold","includes","flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200","deped_logo_left.png","folio","isComponent","text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none","Temporary Grade Slip","mabisang komunikasyon","flex gap-4 mb-0.5","logo_url","type","term","print","adviser_name","flex flex-[1.2]","uppercase","939364SqNsVL","mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center","final-col font-bold","flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ","Section:","music","flex-1 min-h-0 mb-1.5 px-1","gender","value","Passed","subjectGrades","h-8 w-px bg-slate-200","all","log","School","31907YwpfhZ","Adviser","push","text-[8px] italic mt-0.5","none",`;
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
            `,"min","subject-col ","flex flex-1","w-10 h-10 text-slate-400","option","trim","name","mb-1.5 px-1 shrink-0 text-[9px]","text-xl font-black text-slate-800 mb-2","DepEd","A4 portrait","Effective Communication & Mabisang Komunikasyon","grade-slip-card font-serif text-[9px] relative text-black leading-tight","297mm","flex items-center justify-between mb-1.5 px-1 shrink-0","w-8","img","tbody","flex mb-0.5 items-baseline","cssSize","final-col","subject-col","24dcjLyp","Grade Slip","genT2","print:w-full flex flex-col items-center gap-8 print:gap-0","w-45 mx-auto text-center mt-2.5","arts","effective communication","uppercase text-[9px]","11515AlstBd","ceil","grade_level","school-logo.png","1.1","letter portrait","w-3.5 h-3.5","target","toString","map","prototype","black",`;
                    height: `,"letter","useState","279.4mm","info","school_year","Grade Level:","final-col leading-tight","sort","pl-3 font-normal","from","button","student_section","bold","#E5E7EB","bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer","section_name","cut-cross","w-10 text-[9px]","text-[8px] mb-1 w-full text-center","Failed"," of ","text-sm font-black text-slate-900 uppercase tracking-tight","flex-1 border-b border-black font-bold leading-none pb-0.5 uppercase text-center","Core Subjects","8.5in 13in portrait","general mathematics","h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-100 shadow-sm print:hidden","is_advisory","27fPqymo","TERM","subject_id","1336GtFWlE","subject_name","jsxs","lrn","q-col font-bold","No Advisory Class Set","italic pl-3","genRemarks","__proto__","exception","last_name","Zoom Out","constructor","w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm","style","w-10 shrink-0","330.2mm","w-10","track","return (function() ","find","Print Slips","Name:","first_name","console","quarter","parent","Folio / Long (8.5 x 13in)","width","text-[8.2px] leading-tight","header","26283qpKdww","w-11.25"];return e0=function(){return e},e0()}function b0({student:e,schoolProfile:w,section:p,subjects:u,records:S,activeSchoolYear:k}){const x=B,P="./",q=w[x(248)]||x(309),J=P+x(241),j=R[x(184)](()=>{const m=x,t={};let f=0,r=0;const g={t1:0,t2:0,t3:0},h={t1:0,t2:0,t3:0};u.forEach(i=>{const _=B;let L="",Y="",X="",O=0,K=0;for(let G=1;G<=3;G++){const U=S[_(370)](E=>E.student_lrn===e[_(353)]&&E.subject_id===i.id&&Number(E.quarter)===G&&E.school_year===k);if(U&&U[_(202)]&&Number(U[_(202)])>0){const E=Number(U[_(202)]);G===1&&(L=E.toString(),g.t1+=E,h.t1++),G===2&&(Y=E.toString(),g.t2+=E,h.t2++),G===3&&(X=E[_(314)](),g.t3+=E,h.t3++),O+=E,K++}}let H="",x0="";if(K>0){const G=Math[_(194)](O/K);H=G[_(314)](),f+=G,r++,x0=G>=75?_(264):"Failed"}t[i.id]={q1:L,q2:Y,q3:X,final:H,remarks:x0}});const n=r>0?Math[m(194)](f/r)[m(314)]():"",d=n?Number(n)>=75?m(264):"Failed":"",s=h.t1>0?Math[m(194)](g.t1/h.t1)[m(314)]():"",c=h.t2>0?Math[m(194)](g.t2/h.t2)[m(314)]():"",l=h.t3>0?Math.round(g.t3/h.t3)[m(314)]():"";return{subjectGrades:t,genAvg:n,genRemarks:d,genT1:s,genT2:c,genT3:l}},[u,S,e[x(353)],k]),I=(e.last_name+", "+e[x(140)]+" "+(e.middle_name?e[x(209)][0]+".":"")).trim(),W=R[x(184)](()=>{const m=x;return I.length>35?"text-[7.5px] leading-tight":I[m(171)]>25?m(146):m(185)},[I]),Z=m=>{const t=x,f=m[t(171)];if(f===0)return{fontSize:"10px"};const r=y(m)[t(239)](t(260))||y(m)[t(239)](t(303))||y(m)[t(239)]("physical")||y(m)[t(239)]("health"),g=r?158:170,h=.54,n=g/(f*h),d=Math[t(216)](7.5,Math[t(276)](10,n));return{fontSize:d[t(197)](2)+"px",lineHeight:d<8.5?"1":t(310)}};return a.jsxs(x(195),{className:x(288),children:[a[x(352)](x(195),{className:x(290),children:[a[x(178)](x(292),{src:J,className:x(215),alt:"DepEd"}),a[x(352)](x(195),{className:"text-center font-bold leading-none",children:[a[x(178)]("p",{className:x(305),children:w[x(282)]}),a.jsxs("p",{className:x(175),children:[x(167),k]}),a[x(178)]("h3",{className:x(244),children:"Grade Slip"})]}),a[x(178)](x(292),{src:q,className:x(215),alt:x(269)})]}),a[x(352)]("div",{className:x(283),children:[a.jsxs(x(195),{className:x(294),children:[a[x(178)]("span",{className:"w-10 text-[9px]",children:"Name:"}),a.jsx(x(161),{className:x(258)+W,children:I})]}),a[x(352)](x(195),{className:x(247),children:[a[x(352)](x(195),{className:"flex flex-1",children:[a[x(178)](x(161),{className:"w-10",children:"LRN:"}),a[x(178)]("span",{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none",children:e.lrn})]}),a[x(352)]("div",{className:x(186),children:[a[x(178)](x(161),{className:x(291),children:"Age:"}),a[x(178)](x(161),{className:x(200),children:e[x(165)]||""})]})]}),a.jsxs("div",{className:x(158),children:[a[x(352)](x(195),{className:x(278),children:[a[x(178)](x(161),{className:"w-15",children:x(324)}),a.jsx(x(161),{className:x(231),children:p?.section_grade_level?.[x(201)](/Grade/i,"").trim()||""})]}),a[x(352)](x(195),{className:"flex flex-1",children:[a[x(178)](x(161),{className:x(149),children:"Section:"}),a.jsx(x(161),{className:"flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5",children:p?.[x(334)]||""})]})]})]}),a[x(178)](x(195),{className:x(261),children:a[x(352)](x(228),{className:x(225),children:[a[x(352)](x(203),{children:[a[x(352)]("tr",{children:[a[x(178)]("th",{rowSpan:2,className:x(297),children:"LEARNING AREAS"}),a[x(178)]("th",{colSpan:3,children:x(348)}),a[x(178)]("th",{rowSpan:2,className:x(325),children:a[x(178)](x(195),{className:x(156),children:x(150)})}),a.jsx("th",{rowSpan:2,className:x(159),children:"REMARKS"})]}),a[x(352)]("tr",{children:[a.jsx("th",{className:x(214),children:"1"}),a.jsx("th",{className:"q-col",children:"2"}),a.jsx("th",{className:x(214),children:"3"})]})]}),a[x(352)](x(293),{children:[u[x(315)](m=>{const t=x,f=j[t(265)][m.id],r=y(m[t(351)])[t(239)]("music")||y(m.subject_name)[t(239)](t(303))||y(m[t(351)])[t(239)]("physical")||y(m.subject_name)[t(239)](t(229));return a[t(352)]("tr",{children:[a[t(178)]("td",{className:"subject-col "+(r?t(356):""),style:Z(m[t(351)]),children:m.subject_name}),a[t(178)]("td",{className:t(214),children:f.q1||" "}),a[t(178)]("td",{className:t(214),children:f.q2||" "}),a.jsx("td",{className:"q-col",children:f.q3||" "}),a[t(178)]("td",{className:t(296),children:f[t(160)]||" "}),a[t(178)]("td",{className:t(224),children:f.remarks||" "})]},m.id)}),a[x(178)]("tr",{style:{height:"2px"},children:a[x(178)]("td",{colSpan:6,style:{backgroundColor:x(317),height:"2px",padding:0,borderLeft:"1px solid black",borderRight:x(189),borderTop:"1px solid black",borderBottom:x(189)}})}),a.jsxs("tr",{children:[a[x(178)]("td",{className:x(227),children:x(154)}),a.jsx("td",{className:"q-col font-bold",children:j.genT1||" "}),a[x(178)]("td",{className:"q-col font-bold",children:j.genT2||" "}),a.jsx("td",{className:"q-col font-bold",children:j[x(172)]||" "}),a[x(178)]("td",{className:x(257),children:j[x(198)]||" "}),a.jsx("td",{className:x(205),children:j.genRemarks||" "})]})]})]})}),a[x(352)](x(195),{className:x(256),children:[a.jsx("p",{className:x(337),children:x(212)}),a[x(352)]("div",{className:x(302),children:[a[x(178)](x(195),{className:"font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none",children:w[x(252)]||x(207)}),a[x(178)]("p",{className:x(273),children:x(271)})]})]})]})}function V(e,w){const p=B;if(e===void 0||e===p(267)||e===p(274)||e===null)return!1;const u=Number(e);return isNaN(u)?!1:u!==w}function f0({student:e,schoolProfile:w,section:p,subjects:u,records:S,activeSchoolYear:k}){const x=B,P="./",q=w.logo_url||x(309),J=P+"deped_logo_left.png",j=R[x(184)](()=>{const t=x,f={};u[t(220)](N=>{const o=t;let b=0,C=0,A=0;for(let v=1;v<=3;v++){const M=S[o(370)](T=>T.student_lrn===e[o(353)]&&T[o(349)]===N.id&&Number(T[o(142)])===v&&T[o(323)]===k);if(M&&M[o(202)]&&Number(M.final_grade)>0){const T=Number(M[o(202)]);v===1&&(b=T),v===2&&(C=T),v===3&&(A=T)}}const z=N.term;let F=0;if(z===1||Number(z)===1)F=b;else if(z===2||Number(z)===2)F=C;else if(z===3||Number(z)===3)F=A;else{let v=0,M=0;b>0&&(v+=b,M++),C>0&&(v+=C,M++),A>0&&(v+=A,M++),F=M>0?Math.round(v/M):0}f[N.id]={q1:b,q2:C,q3:A,final:F,term:z}});const r=u.filter(N=>{const o=t,b=N[o(351)][o(281)]().toLowerCase();return["effective communication",o(246),o(344),o(162),o(153),o(190),"kasaysayan at lipunang pilipino"].some(A=>b[o(239)](A))}),g=r[t(223)](N=>{const o=t,b=y(N[o(351)]);return b==="effectivecommunication"||b===o(208)});let h=0,n=0,d=0,s=0,c;if(g.length>0){const N=g.find(D=>y(D.subject_name)===t(233)),o=g[t(370)](D=>y(D.subject_name)===t(208));N&&N[t(250)]?c=N[t(250)]:o&&o.term&&(c=o[t(250)]);const b=N?f[N.id]:null,C=o?f[o.id]:null,A=b?.q1||0,z=C?.q1||0;A>0&&z>0?h=Math[t(194)]((A+z)/2):A>0?h=A:z>0&&(h=z);const F=b?.q2||0,v=C?.q2||0;F>0&&v>0?n=Math[t(194)]((F+v)/2):F>0?n=F:v>0&&(n=v);const M=b?.q3||0,T=C?.q3||0;if(M>0&&T>0?d=Math.round((M+T)/2):M>0?d=M:T>0&&(d=T),c===1||Number(c)===1)s=h;else if(c===2||Number(c)===2)s=n;else if(c===3||Number(c)===3)s=d;else{let D=0,Q=0;h>0&&(D+=h,Q++),n>0&&(D+=n,Q++),d>0&&(D+=d,Q++),s=Q>0?Math.round(D/Q):0}}const l={};l.parent_ec_mk={q1:h>0?h.toString():"",q2:n>0?n[t(314)]():"",q3:d>0?d[t(314)]():"",final:s>0?s[t(314)]():"",remarks:s>0?s>=75?t(264):t(338):"",term:c},u[t(220)](N=>{const o=t,b=f[N.id];l[N.id]={q1:b.q1>0?b.q1.toString():"",q2:b.q2>0?b.q2[o(314)]():"",q3:b.q3>0?b.q3[o(314)]():"",final:b[o(160)]>0?b[o(160)][o(314)]():"",remarks:b[o(160)]>0?b[o(160)]>=75?o(264):o(338):"",term:b[o(250)]}});let i=0,_=0,L=0,Y=0,X=0,O=0,K=0,H=0;const x0=N=>{const o=t,b=u.find(A=>A.id===N);if(!b)return!1;const C=y(b[o(351)]);return C==="effectivecommunication"||C===o(208)};u.forEach(N=>{const o=t;if(x0(N.id))return;const b=f[N.id];b.q1>0&&!V(b[o(250)],1)&&(i+=b.q1,_++),b.q2>0&&!V(b[o(250)],2)&&(L+=b.q2,Y++),b.q3>0&&!V(b.term,3)&&(X+=b.q3,O++),b.final>0&&(K+=b[o(160)],H++)}),g.length>0&&(h>0&&!V(c,1)&&(i+=h,_++),n>0&&!V(c,2)&&(L+=n,Y++),d>0&&!V(c,3)&&(X+=d,O++),s>0&&(K+=s,H++));const G=_>0?Math.round(i/_)[t(314)]():"",U=Y>0?Math.round(L/Y).toString():"",E=O>0?Math[t(194)](X/O)[t(314)]():"",a0=H>0?Math[t(194)](K/H)[t(314)]():"",n0=a0?Number(a0)>=75?t(264):"Failed":"";return{subjectGrades:l,genAvg:a0,genRemarks:n0,genT1:G,genT2:U,genT3:E}},[u,S,e[x(353)],k]),I=(e[x(360)]+", "+e[x(140)]+" "+(e.middle_name?e[x(209)][0]+".":"")).trim(),W=R[x(184)](()=>{const t=x;return I[t(171)]>35?"text-[7.5px] leading-tight":I[t(171)]>25?"text-[8.2px] leading-tight":t(185)},[I]),Z=(t,f)=>{const r=x,g=t[r(171)];if(g===0)return{fontSize:"10px"};const h=f?158:170,n=.54,d=h/(g*n),s=Math.max(7.5,Math[r(276)](10,d));return{fontSize:s[r(197)](2)+"px",lineHeight:s<8.5?"1":r(310)}},m=R[x(184)](()=>{const t=x,f=[],r=[];u[t(220)](l=>{const i=t,_=l.subject_name.trim().toLowerCase();[i(304),i(246),"general mathematics","general science",i(153),i(190),i(204)][i(196)](Y=>_[i(239)](Y))?f[i(272)](l):r.push(l)});const g=f.filter(l=>{const i=t,_=y(l.subject_name);return _===i(233)||_===i(208)}),h=f[t(223)](l=>{const i=t,_=y(l[i(351)]);return _!==i(233)&&_!==i(208)}),n=t0(h,l=>l[t(351)]),d=t0(r,l=>l.subject_name),s=[],c=[];if(g[t(171)]>0){const l=g[t(370)](L=>y(L[t(351)])===t(233)),i=g[t(370)](L=>y(L.subject_name)===t(208)),_=l?.[t(250)]||i?.[t(250)];c.push({type:t(143),name:t(287),id:"parent_ec_mk",term:_}),l&&c[t(272)]({type:t(221),name:l[t(351)],id:l.id,isComponent:!0,term:l[t(250)]}),i&&c[t(272)]({type:"subject",name:i[t(351)],id:i.id,isComponent:!0,term:i.term})}return n[t(220)](l=>{const i=t;c[i(272)]({type:i(221),name:l.subject_name,id:l.id,term:l[i(250)]})}),c[t(171)]>0&&(s[t(272)]({type:t(147),name:t(342)}),s[t(272)](...c)),d[t(171)]>0&&(s.push({type:"header",name:"Electives"}),d.forEach(l=>{const i=t;s[i(272)]({type:i(221),name:l[i(351)],id:l.id,term:l[i(250)]})})),s},[u]);return a.jsxs(x(195),{className:"grade-slip-card font-serif text-[9px] relative text-black leading-tight",children:[a[x(352)]("div",{className:x(290),children:[a[x(178)](x(292),{src:J,className:x(215),alt:x(285)}),a[x(352)](x(195),{className:x(181),children:[a[x(178)]("p",{className:x(305),children:w[x(282)]}),a[x(352)]("p",{className:x(175),children:[x(167),k]}),a[x(178)]("h3",{className:x(244),children:x(299)})]}),a.jsx(x(292),{src:q,className:"w-10 h-10 object-contain",alt:x(269)})]}),a[x(352)](x(195),{className:x(283),children:[a.jsxs(x(195),{className:x(294),children:[a.jsx(x(161),{className:x(336),children:x(372)}),a.jsx("span",{className:"flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none "+W,children:I})]}),a[x(352)](x(195),{className:x(247),children:[a[x(352)](x(195),{className:x(278),children:[a[x(178)]("span",{className:x(367),children:"LRN:"}),a[x(178)]("span",{className:x(237),children:e.lrn})]}),a[x(352)](x(195),{className:x(186),children:[a[x(178)](x(161),{className:x(291),children:x(230)}),a[x(178)]("span",{className:"flex-1 border-b border-black font-bold pb-0.5 leading-none text-center",children:e[x(165)]||""})]})]}),a.jsxs("div",{className:x(158),children:[a[x(352)](x(195),{className:x(278),children:[a[x(178)](x(161),{className:"w-15 shrink-0",children:"Grade Level:"}),a[x(178)](x(161),{className:"flex-1 border-b border-black font-bold leading-none text-center pb-0.5",children:p?.[x(206)]?.[x(201)](/Grade/i,"")[x(281)]()||""})]}),a[x(352)]("div",{className:"flex flex-1",children:[a[x(178)](x(161),{className:x(365),children:x(259)}),a[x(178)]("span",{className:"flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5",children:p?.[x(334)]||""})]}),a.jsxs(x(195),{className:x(253),children:[a[x(178)](x(161),{className:x(365),children:"Track:"}),a[x(178)](x(161),{className:x(341),children:e[x(368)]||""})]})]})]}),a[x(178)](x(195),{className:"flex-1 min-h-0 mb-1.5 px-1",children:a.jsxs("table",{className:x(225),children:[a[x(352)](x(203),{children:[a[x(352)]("tr",{children:[a[x(178)]("th",{rowSpan:2,className:"subject-col",children:x(170)}),a.jsx("th",{colSpan:3,children:x(348)}),a.jsx("th",{rowSpan:2,className:x(325),children:a.jsx(x(195),{className:x(156),children:x(150)})}),a.jsx("th",{rowSpan:2,className:x(159),children:"REMARKS"})]}),a[x(352)]("tr",{children:[a[x(178)]("th",{className:x(214),children:"1"}),a[x(178)]("th",{className:x(214),children:"2"}),a[x(178)]("th",{className:x(214),children:"3"})]})]}),a[x(352)]("tbody",{children:[m[x(315)]((t,f)=>{const r=x;if(t[r(249)]==="header")return a[r(178)]("tr",{children:a[r(178)]("td",{colSpan:6,style:{backgroundColor:"#E5E7EB",fontWeight:r(331),textAlign:r(174),padding:r(232),fontSize:"8px",textTransform:r(254)},children:t[r(282)]})},r(211)+f);const g=t[r(249)]===r(143),h=g?r(180):t.id,n=j[r(265)][h]||{q1:"",q2:"",q3:"",final:"",remarks:""},d=!g&&t[r(243)];return a[r(352)]("tr",{children:[a[r(178)]("td",{className:r(277)+r(d?327:238),style:{...Z(t[r(282)],d),fontWeight:d?"normal":r(331)},children:t.name}),[1,2,3][r(315)](s=>{const c=r;if(V(t[c(250)],s))return a.jsx("td",{className:c(214),style:{backgroundColor:c(332)},children:" "},s);const i=s===1?n.q1:s===2?n.q2:n.q3;return a[c(178)]("td",{className:c(214),children:i||" "},s)}),a[r(178)]("td",{className:r(296),children:n[r(160)]||" "}),a[r(178)]("td",{className:r(224),children:n.remarks||" "})]},h)}),a[x(178)]("tr",{style:{height:x(177)},children:a.jsx("td",{colSpan:6,style:{backgroundColor:x(317),height:"2px",padding:0,borderLeft:x(189),borderRight:x(189),borderTop:x(189),borderBottom:x(189)}})}),a.jsxs("tr",{children:[a[x(178)]("td",{className:x(227),children:x(154)}),a[x(178)]("td",{className:x(354),children:j.genT1||" "}),a[x(178)]("td",{className:"q-col font-bold",children:j[x(300)]||" "}),a.jsx("td",{className:x(354),children:j.genT3||" "}),a.jsx("td",{className:x(257),children:j[x(198)]||" "}),a[x(178)]("td",{className:x(205),children:j[x(357)]||" "})]})]})]})}),a[x(352)](x(195),{className:x(256),children:[a[x(178)]("p",{className:x(337),children:x(212)}),a.jsxs(x(195),{className:x(302),children:[a[x(178)](x(195),{className:x(188),children:w[x(252)]||x(207)}),a.jsx("p",{className:x(273),children:x(271)})]})]})]})}export{_0 as TemporaryGradeSlipPage};
