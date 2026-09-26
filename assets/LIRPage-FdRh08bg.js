import{j as e,r as c,cC as Pe,bN as le,cP as Be,cm as Fe,bj as we,bV as je,co as ne,c9 as Ue,bx as He,cM as Ge,cJ as he,cS as ve,bK as Je}from"./vendor-CYWHR5QP.js";import{a as Ye,u as qe,a8 as We,I as me,a7 as Ve,c as Ze,ad as Ke,ae as Ne,al as Qe}from"./index-BpwIMTZV.js";import{e as Xe,p as et}from"./pdf-export-C7JZ5tNw.js";import"./vendor-pdf-libs-Pk85F4pG.js";import"./vendor-firebase-D2ssKo2s.js";import"./vendor-framer-motion-AEJAGP4_.js";import"./vendor-exceljs-BNnGb5Yw.js";const ke=({pageNumber:X,student:f,profile:C,schoolYear:ee,subject:B,teacher:x,fillColor:N="#86efac",outlineColor:n="#22c55e",gradeData:g,paperSize:M="folio",attendanceData:te={}})=>{const se=r=>Array.from({length:25},(m,i)=>r[i]??""),w=(r,m)=>{const i=Number(m);if(!i)return!1;const O=r.toUpperCase();return O==="JUNE"&&i===12||O==="AUGUST"&&(i===21||i===31)||O==="NOVEMBER"&&(i===2||i===30)||O==="DECEMBER"&&i===8||O==="JANUARY"&&i===1};let T="13in",h="8.5in",s=1.12,I=1.2,D=.8,A=.75,j=5,k=.8,F=40,u=240,U=100,H=50,z="0px";M==="a4"?(h="210mm",T="297mm",s=1.02,I=.85,D=.55,A=.5,j=2,k=.65,F=26,u=140,U=80,H=40):M==="letter"?(h="8.5in",T="11in",s=.98,I=.85,D=.55,A=.5,j=3,k=.7,F=28,u=160,U=65,H=32,z="-11px"):M==="folio"&&(h="8.5in",T="13in",s=.98,I=.85,D=.55,A=.5,j=3,k=.7,F=28,u=160,U=65,H=32,z="-11px");const y=(r,m)=>{const i=(r||"").trim();return i.length>32?m*.65:i.length>24?m*.78:i.length>16?m*.88:m},R=y(B,k*s),P=y(x,k*s);return e.jsx("div",{className:"lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0",children:e.jsxs("div",{className:"page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none",style:{width:h,height:T},children:[e.jsx("style",{children:`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: ${h} ${T}; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid ${n};
                        padding: ${8*s}px;
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
                        padding: ${5*s}px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: ${N};
                        border: 1px solid ${n};
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: ${3*s}px;
                        font-size: ${.85*s}rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: ${N}dd;
                        border: 1px solid ${n};
                        color: #000000 !important;
                        font-size: ${.6*s}rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid ${n};
                        padding: ${2*s}px;
                        text-align: center;
                        font-weight: 700;
                        font-size: ${.8*s}rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: ${.6*s}rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid ${n};
                        padding: ${1.5*s}px;
                        text-align: center;
                        height: ${24*s}px;
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
                        background-color: ${N}44;
                        font-weight: 800;
                        font-size: ${.6*s}rem;
                    }

                    .row-label {
                        background-color: ${N}cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: ${.6*s}rem;
                        width: ${70*s}px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: ${N}99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid ${n};
                        border-radius: 8px;
                        height: ${F*s}px;
                        width: ${u*s}px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: ${N}; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: ${.9*s}rem; 
                        padding: ${4*s}px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid ${n}; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid ${n}; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid ${n}; 
                        text-align: center; 
                        font-size: ${.5*s}rem; 
                        font-weight: 700; 
                        height: ${21*s}px; 
                        padding: ${1*s}px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: ${N}; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: ${.5*s}rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid ${n} !important; 
                    }

                    .dates-header-bar { 
                        background-color: ${N}; 
                        color: black !important; 
                        font-size: ${.9*s}rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: ${N}; 
                        color: black !important; 
                        width: 7%; 
                        font-size: ${.45*s}rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: ${.5*s}rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid ${n};
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: ${N}; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: ${3*s}px; 
                        font-size: ${.85*s}rem; 
                        border-bottom: 2px solid ${n}; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid ${n}; 
                        font-size: ${.45*s}rem; 
                        min-height: ${18*s}px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: ${95*s}px; 
                        border-right: 1px solid ${n}; 
                        padding: ${1.5*s}px ${4*s}px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: ${1.5*s}px ${4*s}px; 
                        font-weight: 700; 
                        font-size: ${.42*s}rem; 
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
                `}),e.jsxs("div",{className:"card-container-combined print:m-0 print:shadow-none",children:[e.jsxs("div",{className:"half-page-section",children:[e.jsxs("div",{className:"flex justify-between items-center w-full overflow-hidden",children:[e.jsxs("div",{className:"flex items-center gap-4 shrink-0",children:[e.jsx("div",{className:"flex items-center justify-center bg-white overflow-hidden",style:{width:64*s,height:64*s},children:e.jsx("img",{src:C.logo_url||"./school-logo.png",alt:"School Logo",className:"max-w-full max-h-full object-contain",onError:r=>{r.target.src="./school-logo.png"}})}),e.jsxs("div",{children:[e.jsx("h1",{className:"font-extrabold uppercase whitespace-nowrap",style:{fontSize:I*s+"rem"},children:C.name||"BAGONG BARRIO NATIONAL HIGH SCHOOL"}),e.jsx("p",{className:"font-black uppercase italic",style:{fontSize:D*s+"rem",color:n},children:"Learner's Individual Record Card"}),e.jsxs("p",{className:"font-bold",style:{fontSize:A*s+"rem"},children:["School Year: ",e.jsx("span",{className:"font-normal ml-2",children:ee})]})]})]}),e.jsx("div",{className:"shrink-0 ml-auto",children:e.jsx("table",{className:"header-subject-table border-collapse border-2",style:{borderColor:n},children:e.jsx("tbody",{children:e.jsxs("tr",{children:[e.jsx("td",{className:"label-green border-2 whitespace-nowrap",style:{fontSize:k*s+"rem",padding:`${j*s}px ${j*2*s}px`,borderColor:n},children:"SUBJECT"}),e.jsx("td",{className:"data-field font-extrabold border-2 max-w-45 truncate",title:B,style:{fontSize:R+"rem",padding:`${j*s}px ${j*2.5*s}px`,borderColor:n},children:B}),e.jsx("td",{className:"label-green border-2 whitespace-nowrap",style:{fontSize:k*s+"rem",padding:`${j*s}px ${j*2*s}px`,borderColor:n},children:"TEACHER"}),e.jsx("td",{className:"data-field font-extrabold border-2 max-w-45 truncate",title:x,style:{fontSize:P+"rem",padding:`${j*s}px ${j*2.5*s}px`,borderColor:n},children:x})]})})})})]}),e.jsxs("div",{className:"flex gap-4 items-start w-full mt-2",children:[e.jsx("div",{className:"border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden",style:{width:1*s+"in",height:1*s+"in",borderColor:n},children:f.photo_url?e.jsx("img",{src:f.photo_url,alt:"1x1 Learner Photo",className:"w-full h-full object-cover"}):e.jsxs("span",{className:"font-bold leading-tight",style:{fontSize:.7*s+"rem"},children:["1 X 1",e.jsx("br",{}),"PHOTO"]})}),e.jsx("div",{className:"grow flex flex-col gap-1 overflow-hidden",children:e.jsx("table",{className:"student-info-table border-2",style:{borderColor:n,height:1*s+"in"},children:e.jsxs("tbody",{children:[e.jsxs("tr",{style:{height:.5*s+"in"},children:[e.jsx("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:n,height:.5*s+"in"},children:f.last_name}),e.jsx("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:n,height:.5*s+"in"},children:f.first_name}),e.jsx("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap px-1",style:{width:"40px",borderColor:n,height:.5*s+"in"},children:f.middle_name?.charAt(0)||""}),e.jsx("td",{className:"data-field uppercase font-bold border-2 max-w-37.5 truncate",title:f.student_section,style:{borderColor:n,height:.5*s+"in"},children:f.student_section}),e.jsx("td",{className:"data-field uppercase font-bold border-2 whitespace-nowrap",style:{borderColor:n,height:.5*s+"in"},children:f.lrn})]}),e.jsxs("tr",{style:{height:.5*s+"in"},children:[e.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:n,height:.5*s+"in"},children:"LAST NAME"}),e.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:n,height:.5*s+"in"},children:"FIRST NAME"}),e.jsx("td",{className:"label-green py-1 border-2 px-1",style:{width:"40px",borderColor:n,height:.5*s+"in"},children:"M.I"}),e.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:n,height:.5*s+"in"},children:"GRADE & SECTION"}),e.jsx("td",{className:"label-green py-1 border-2",style:{borderColor:n,height:.5*s+"in"},children:"LRN"})]})]})})})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden",children:[e.jsxs("div",{children:[e.jsx("div",{className:"header-green py-1",style:{fontSize:.75*s+"rem"},children:"WRITTEN /ORAL WORKS (WWs)"}),e.jsx("table",{style:{tableLayout:"fixed"},children:e.jsxs("tbody",{children:[e.jsxs("tr",{className:"header-row-fill",children:[e.jsx("td",{className:"term-label",style:{width:"15%"},children:"TERM"}),[1,2,3,4,5].map(r=>e.jsx("td",{style:{width:"13%"},children:r},r)),e.jsx("td",{className:"font-bold",style:{width:"20%"},children:"TOTAL"})]}),[1,2,3].map(r=>e.jsxs("tr",{children:[e.jsx("td",{className:"row-label",children:r===1?"FIRST":r===2?"SECOND":"THIRD"}),[...Array(5)].map((m,i)=>e.jsx("td",{children:g?.[r]?.scores.ww[i]??""},i)),e.jsx("td",{className:"font-bold",children:g?.[r]?.scores.ww.slice(0,5).reduce((m,i)=>m+(Number(i)||0),0)||""})]},r))]})})]}),e.jsxs("div",{children:[e.jsx("div",{className:"header-green py-1",style:{fontSize:.75*s+"rem"},children:"PRODUCT/PERFORMANCE TASK (PPTs)"}),e.jsx("table",{style:{tableLayout:"fixed"},children:e.jsxs("tbody",{children:[e.jsxs("tr",{className:"header-row-fill",children:[e.jsx("td",{className:"term-label",style:{width:"20%"},children:"TERM"}),[1,2,3].map(r=>e.jsx("td",{style:{width:"20%"},children:r},r)),e.jsx("td",{className:"font-bold",style:{width:"20%"},children:"TOTAL"})]}),[1,2,3].map(r=>e.jsxs("tr",{children:[e.jsx("td",{className:"row-label",children:r===1?"FIRST":r===2?"SECOND":"THIRD"}),[...Array(3)].map((m,i)=>e.jsx("td",{children:g?.[r]?.scores.pt[i]??""},i)),e.jsx("td",{className:"font-bold",children:g?.[r]?.scores.pt.slice(0,3).reduce((m,i)=>m+(Number(i)||0),0)||""})]},r))]})})]})]}),e.jsxs("div",{className:"grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden",children:[e.jsxs("div",{className:"col-span-1",children:[e.jsx("div",{className:"header-green py-1",style:{fontSize:.7*s+"rem"},children:"SUMMATIVE TEST"}),e.jsx("table",{style:{tableLayout:"fixed"},children:e.jsxs("tbody",{children:[e.jsxs("tr",{className:"header-row-fill",children:[e.jsx("td",{className:"term-label",style:{width:"40%"},children:"TERM"}),[1,2].map(r=>e.jsx("td",{children:r},r))]}),[1,2,3].map(r=>e.jsxs("tr",{children:[e.jsx("td",{className:"row-label",children:r===1?"FIRST":r===2?"SECOND":"THIRD"}),[...Array(2)].map((m,i)=>e.jsx("td",{children:g?.[r]?.scores.st[i]??""},i))]},r))]})})]}),e.jsx("div",{className:"col-span-1",children:e.jsxs("table",{style:{tableLayout:"fixed"},children:[e.jsx("thead",{children:e.jsx("tr",{className:"header-row-fill",children:e.jsx("td",{colSpan:2,className:"font-bold py-1",style:{fontSize:.7*s+"rem"},children:"TERM EXAM"})})}),e.jsx("tbody",{children:[1,2,3].map(r=>e.jsxs("tr",{children:[e.jsxs("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:n},children:[r===1?"1ST":r===2?"2ND":"3RD"," TERM"]}),e.jsx("td",{className:"font-bold",children:g?.[r]?.scores.te||""})]},r))})]})}),e.jsx("div",{className:"col-span-1",children:e.jsxs("table",{style:{tableLayout:"fixed"},children:[e.jsx("thead",{children:e.jsx("tr",{className:"header-row-fill",children:e.jsx("td",{colSpan:2,className:"font-bold py-1",style:{fontSize:.7*s+"rem"},children:"FINAL GRADE"})})}),e.jsx("tbody",{children:[1,2,3].map(r=>e.jsxs("tr",{children:[e.jsxs("td",{className:"row-label py-1 px-1 border-2",style:{borderColor:n},children:[r===1?"1ST":r===2?"2ND":"3RD"," TERM"]}),e.jsx("td",{className:"font-bold",children:g?.[r]?.finalGrade||""})]},r))}),e.jsx("tfoot",{children:e.jsx("tr",{style:{height:1.5*s+"px"},children:e.jsx("td",{colSpan:2,style:{border:"none"}})})})]})}),e.jsxs("div",{className:"col-span-1 flex flex-col items-center justify-center pt-1",style:{marginTop:z},children:[e.jsx("div",{className:"mb-2",children:e.jsx("img",{src:"./deped_logo_right.png",alt:"DepEd Logo",className:"object-contain",style:{width:U*s,height:H*s}})}),e.jsx("div",{className:"signature-box bg-white"}),e.jsx("p",{className:"font-bold uppercase leading-none text-center",style:{fontSize:.6*s+"rem",marginTop:14*s+"px"},children:"Teacher's Signature"})]})]})]}),e.jsxs("div",{className:"half-page-section border-t-4",style:{borderColor:n},children:[e.jsx("div",{className:"lir-title-bar-custom mb-3 uppercase tracking-widest",children:"Daily Attendance"}),e.jsxs("table",{className:"attendance-table mb-3",children:[e.jsxs("colgroup",{children:[e.jsx("col",{style:{width:"10%"}}),Array.from({length:25}).map((r,m)=>e.jsx("col",{style:{width:"3.32%"}},m)),e.jsx("col",{style:{width:"7%"}})]}),e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{className:"month-col uppercase",children:"Months"}),e.jsx("th",{colSpan:25,className:"dates-header-bar uppercase",children:"Dates"}),e.jsx("th",{className:"absences-header uppercase",children:"Total Abs."})]})}),e.jsx("tbody",{children:[{name:"JUNE",dates:[8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30]},{name:"JULY",dates:[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]},{name:"AUGUST",dates:[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,31]},{name:"SEPTEMBER",dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18,21,22,23,24,25,28,29,30]},{name:"OCTOBER",dates:[1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30]},{name:"NOVEMBER",dates:[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30]},{name:"DECEMBER",dates:[1,2,3,4,7,8,9,10,11,14,15,16,17,18]},{name:"JANUARY",dates:[1,4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29]},{name:"FEBRUARY",dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26]},{name:"MARCH",dates:[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,29,30,31]},{name:"APRIL",dates:[1,2,5,6,7,8]}].map(r=>e.jsxs("tr",{children:[e.jsx("td",{className:"month-col",children:r.name}),se(r.dates).map((m,i)=>e.jsx("td",{className:"attendance-date-cell",style:{color:w(r.name,m)?"red":"inherit"},children:m},i)),e.jsx("td",{className:"font-bold",children:te[r.name]||""})]},r.name))})]}),e.jsxs("div",{className:"flex items-stretch border-2 w-full overflow-hidden",style:{borderColor:n},children:[e.jsxs("div",{className:"important-dates-box",children:[e.jsx("div",{className:"important-dates-header uppercase italic",children:"Important Dates"}),[["June 8-11, 2026","Opening Block: Term 1"],["July 6, 2026","Term 1: Summative Test #1"],["July 28, 2026","Term 1: Summative Test #2"],["Aug 28, 2026","Term 1 Examination"],["Sept 1, 2026","Term 1 Examination"],["Sept 2-15, 2026","End-of-Term Block"],["Sept 16, 2026","Start of Term 2"]].map(([r,m])=>e.jsxs("div",{className:"date-row",children:[e.jsx("div",{className:"date-val uppercase",children:r}),e.jsx("div",{className:"date-label uppercase",children:m})]},r))]}),e.jsxs("div",{className:"important-dates-box",children:[e.jsx("div",{className:"important-dates-header uppercase italic",children:"Important Dates"}),[["Oct 7, 2026","Term 2: Summative Test #1"],["Oct 29, 2026","Term 2: Summative Test #2"],["Dec 3-4, 2026","Term 2 Examination"],["Dec 7-18, 2026","End-of-Term Block"],["Dec 18, 2026","End of Term 2"],["Jan 4, 2027","Start of Term 3"],["Jan 25, 2027","Term 3: Summative Test #1"]].map(([r,m])=>e.jsxs("div",{className:"date-row",children:[e.jsx("div",{className:"date-val uppercase",children:r}),e.jsx("div",{className:"date-label uppercase",children:m})]},r))]}),e.jsxs("div",{className:"important-dates-box",children:[e.jsx("div",{className:"important-dates-header uppercase italic",children:"Important Dates"}),[["Feb 16, 2027","Term 3: Summative Test #2"],["Mar 15-16, 2027","Term 3 Exam (Graduating)"],["Mar 22-23, 2027","Term 3 Exam (Non-Grad)"],["Mar 24-31, 2027","End-of-Term Block"],["Apr 1-8, 2027","End-of-Term Block"],["Apr 6-7, 2027","EOSY Rites"],["Apr 8, 2027","End of Term 3"]].map(([r,m])=>e.jsxs("div",{className:"date-row",children:[e.jsx("div",{className:"date-val uppercase",children:r}),e.jsx("div",{className:"date-label uppercase",children:m})]},r))]})]})]})]})]})})};function dt(){const{students:X,sections:f,subjects:C,teachers:ee,schoolProfile:B,activeSchoolYear:x,setCurrentView:N,classRecords:n,gradingSheetRecords:g,hpsRecords:M,sf2Sheets:te}=Ye(),{user:V}=qe(),[b,se]=c.useState(""),[w,T]=c.useState(null),[h,s]=c.useState(""),[I,D]=c.useState(1),[A,j]=c.useState("#86efac"),[k,F]=c.useState("#22c55e"),[u,U]=c.useState("folio"),[H,z]=c.useState(!1),[y,R]=c.useState(new Set),[P,r]=c.useState(""),[m,i]=c.useState(!1),[O,G]=c.useState(0),[ye,J]=c.useState(""),p=c.useMemo(()=>f.find(t=>t.section_name===b||t.id===b),[f,b]),S=c.useMemo(()=>C.find(t=>t.id===h||t.subject_name===h),[C,h]),Se=c.useMemo(()=>{if(!p)return[];const t=We(V,p,C),a=new Set;return t.filter(l=>{const o=me(l.subject_name);return a.has(o)?!1:(a.add(o),!0)})},[p,C,V]),xe=c.useMemo(()=>{if(S?.teacher_id){const t=ee.find(a=>a.uid===S.teacher_id||a.id===S.teacher_id);if(t)return t.displayName||t.name}return p?.adviser_name||""},[S,ee,p]),Z=c.useMemo(()=>[...Ve(V,f)].sort((t,a)=>{const l=(t.section_grade_level||"").localeCompare(a.section_grade_level||"",void 0,{numeric:!0});return l!==0?l:(t.section_name||"").localeCompare(a.section_name||"")}),[f,C,V]),_e=c.useMemo(()=>{const t={ELEMENTARY:[],"JUNIOR HIGH SCHOOL":[],"SENIOR HIGH SCHOOL":[]};return Z.forEach(a=>{const l=(a.section_grade_level||"").toLowerCase(),o=parseInt(l.replace(/\D/g,""))||0;l.includes("kinder")||o>=1&&o<=6?t.ELEMENTARY.push(a):o>=7&&o<=10?t["JUNIOR HIGH SCHOOL"].push(a):o>=11&&o<=12?t["SENIOR HIGH SCHOOL"].push(a):t.ELEMENTARY.push(a)}),t},[Z]);c.useEffect(()=>{if(!b&&Z.length===1){const t=setTimeout(()=>{se(Z[0].id)},0);return()=>clearTimeout(t)}},[Z,b]),c.useEffect(()=>{const t=setTimeout(()=>{s(""),T(null),R(new Set)},0);return()=>clearTimeout(t)},[b]);const v=c.useMemo(()=>!b&&!p?[]:X.filter(t=>Ze(t,p,b)),[X,b,p]),Y=c.useMemo(()=>v.filter(t=>Ke(t)||!Ne(t)).sort((t,a)=>`${t.last_name}, ${t.first_name}`.localeCompare(`${a.last_name}, ${a.first_name}`)),[v]),q=c.useMemo(()=>v.filter(t=>Ne(t)).sort((t,a)=>`${t.last_name}, ${t.first_name}`.localeCompare(`${a.last_name}, ${a.first_name}`)),[v]),$e=()=>{y.size===0&&v.length>0&&R(new Set(v.map(t=>t.lrn))),z(!0)},ie=c.useCallback(t=>{if(!t)return{};const a={};return te.filter(o=>o.school_year===x&&(o.section_id===p?.id||o.section_id===b)).forEach(o=>{const _=o.attendance?.[t.lrn];if(_){const E=Object.values(_).filter($=>$?.toLowerCase()==="absent").length;E>0&&(a[o.month.toUpperCase()]=E)}}),a},[te,x,p,b]),oe=c.useCallback((t,a,l)=>{if(!t||!a)return;const o={};return[1,2,3].forEach(_=>{const E=(d,ae)=>!!(d===l?.id||d===a||ae&&l?.subject_name&&me(ae)===me(l.subject_name)),$=n.find(d=>d.student_lrn===t.lrn&&d.school_year===x&&Number(d.quarter)===_&&E(d.subject_id,d.subject_name))||g.find(d=>d.student_lrn===t.lrn&&d.school_year===x&&Number(d.quarter)===_&&E(d.subject_id,d.subject_name)),re=M.find(d=>E(d.subject_id,d.subject_name)&&d.school_year===x&&Number(d.quarter)===_&&(d.section_id===t.student_section||p?.id&&d.section_id===p.id))||M.find(d=>E(d.subject_id,d.subject_name)&&d.school_year===x&&Number(d.quarter)===_),W=(d,ae)=>{const Ie=Array.isArray(d)?d:[];return Array.from({length:ae},(tt,De)=>Ie[De]??"")},ze=$,Oe=re,L=d=>d===""||d===null||d===void 0?"":d,fe=Qe(t.lrn,l?.id||h,_,x,n,g,M,p?.section_grade_level,p?.track);o[_]={scores:{ww:W($?.written_works,10).map(L),pt:W($?.performance_tasks,10).map(L),st:W(ze?.summative_tests,5).map(L),te:L($?.quarterly_exam??"")},hps:{ww:W(re?.written_works,10).map(L),pt:W(re?.performance_tasks,10).map(L),st:W(Oe?.summative_tests,5).map(L),te:L(re?.quarterly_exam??"")},finalGrade:fe>0?fe:L($?.final_grade??"")}}),o},[n,g,M,x,p,h]),Ee=c.useMemo(()=>ie(w),[w,ie]),Te=c.useMemo(()=>oe(w,h,S),[w,h,S,oe]),pe=c.useMemo(()=>[...Y,...q],[Y,q]),K=c.useMemo(()=>pe.filter(t=>y.has(t.lrn)),[pe,y]),Q=c.useMemo(()=>{if(!P.trim())return v;const t=P.toLowerCase();return v.filter(a=>a.last_name.toLowerCase().includes(t)||a.first_name.toLowerCase().includes(t)||a.lrn.includes(t))},[v,P]),de=c.useMemo(()=>Q.filter(t=>(t.gender||"").toLowerCase()==="male"),[Q]),ce=c.useMemo(()=>Q.filter(t=>(t.gender||"").toLowerCase()==="female"),[Q]),Ae=()=>{if(!w)return;const t=document.title,a=`${w.last_name}_${w.first_name}`.replace(/[^a-z0-9]/gi,"_");document.title=`LIR_${a}_${x}`,window.print(),setTimeout(()=>{document.title=t},1e3)},be=async()=>{if(K.length!==0){i(!0),G(10),J("Preparing LIR sheets for bulk printing...");try{await new Promise(l=>setTimeout(l,400));const t=document.getElementById("lir-bulk-render-container"),a=t?Array.from(t.querySelectorAll(".lir-bulk-sheet")):[];if(a.length===0){alert("No sheets ready for printing. Please try again."),i(!1);return}G(50),J(`Opening print stream for ${a.length} learners...`),await et({elements:a,paperSize:u,orientation:"portrait",title:`Bulk_LIR_${p?.section_name||"Section"}_${S?.subject_name||"Subject"}`}),G(100),J("Bulk print stream launched successfully."),setTimeout(()=>{i(!1),z(!1)},600)}catch(t){console.error("Bulk print error:",t),alert("Failed to launch bulk print."),i(!1)}}},ue=async()=>{if(K.length!==0){i(!0),G(5),J("Initializing vector PDF export pipeline...");try{await new Promise($=>setTimeout($,400));const t=document.getElementById("lir-bulk-render-container"),a=t?Array.from(t.querySelectorAll(".lir-bulk-sheet")):[];if(a.length===0){alert("No sheets ready for PDF export."),i(!1);return}const l=(p?.section_name||b||"Section").replace(/[^a-z0-9]/gi,"_"),o=(S?.subject_name||"Subject").replace(/[^a-z0-9]/gi,"_"),_=`LIR_${l}_${o}_${x}`,E=await Xe({elements:a,filename:_,paperSize:u,orientation:"portrait",title:_,onProgressChange:$=>{G($),J(`Processing LIR PDF pages: ${$}% complete...`)}});E.success?(G(100),J("PDF download complete!"),setTimeout(()=>{i(!1),z(!1)},800)):(E.cancelled||alert(`Export failed: ${E.error||"Unknown error"}`),i(!1))}catch(t){console.error("Bulk PDF download error:",t),alert("Failed to generate PDF download."),i(!1)}}},ge=t=>{R(a=>{const l=new Set(a);return l.has(t)?l.delete(t):l.add(t),l})},Re=()=>{R(new Set(v.map(t=>t.lrn)))},Le=()=>{R(new Set(Y.map(t=>t.lrn)))},Ce=()=>{R(new Set(q.map(t=>t.lrn)))},Me=()=>{R(new Set)};return e.jsxs("div",{className:"lir-print-root flex flex-col h-full min-h-0 bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white",children:[e.jsxs("div",{className:"z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full",children:[e.jsx("div",{className:"absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30"}),e.jsxs("div",{className:"flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-x-auto no-scrollbar scroll-smooth",children:[e.jsxs("div",{className:"flex items-center gap-1.5 lg:gap-2 shrink-0",children:[e.jsx("button",{onClick:()=>N("school-forms"),className:"w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200",title:"Back to Hub",children:e.jsx(Pe,{className:"w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"})}),e.jsxs("div",{className:"flex flex-col shrink-0",children:[e.jsx("h2",{className:"text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5",children:"Learner Record"}),e.jsx("p",{className:"text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none",children:"Individual LIR"})]})]}),e.jsx("div",{className:"h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0"}),e.jsxs("div",{className:"relative group min-w-0 flex-1",children:[e.jsxs("select",{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate",value:b,onChange:t=>{se(t.target.value),T(null),s("")},children:[e.jsx("option",{value:"",children:"Choose Section"}),Object.entries(_e).map(([t,a])=>a.length>0&&e.jsx("optgroup",{label:t,children:a.map(l=>e.jsxs("option",{value:l.id,children:[l.section_grade_level," - ",l.section_name]},l.id))},t))]}),e.jsx(le,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),e.jsxs("div",{className:"relative group min-w-0 flex-1",children:[e.jsxs("select",{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate",value:h,onChange:t=>{s(t.target.value),T(null)},disabled:!b,children:[e.jsx("option",{value:"",children:"Select Subject"}),Se.map(t=>e.jsx("option",{value:t.id,children:t.subject_name},t.id))]}),e.jsx(le,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),e.jsxs("div",{className:"relative group min-w-0 flex-1",children:[e.jsxs("select",{className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200",value:w?.lrn||"",onChange:t=>{const a=X.find(l=>l.lrn===t.target.value)||null;T(a)},disabled:!h,children:[e.jsx("option",{value:"",children:"Select Learner"}),Y.length>0&&e.jsx("optgroup",{label:"MALE",children:Y.map(t=>{const a=h&&(n.some(l=>l.student_lrn===t.lrn&&l.subject_id===h&&l.school_year===x)||g.some(l=>l.student_lrn===t.lrn&&l.subject_id===h&&l.school_year===x));return e.jsxs("option",{value:t.lrn,children:[t.last_name,", ",t.first_name," ",a?"✓":""]},t.lrn)})}),q.length>0&&e.jsx("optgroup",{label:"FEMALE",children:q.map(t=>{const a=h&&(n.some(l=>l.student_lrn===t.lrn&&l.subject_id===h&&l.school_year===x)||g.some(l=>l.student_lrn===t.lrn&&l.subject_id===h&&l.school_year===x));return e.jsxs("option",{value:t.lrn,children:[t.last_name,", ",t.first_name," ",a?"✓":""]},t.lrn)})})]}),e.jsx(le,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),e.jsx("div",{className:"h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0"}),e.jsxs("div",{className:"relative group shrink-0",children:[e.jsxs("select",{value:u,onChange:t=>U(t.target.value),className:"appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200",title:"Paper Size",children:[e.jsx("option",{value:"a4",children:"A4"}),e.jsx("option",{value:"letter",children:"Letter"}),e.jsx("option",{value:"folio",children:"Folio"})]}),e.jsx(le,{className:"w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"})]}),e.jsxs("div",{className:"flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5",children:[e.jsxs("div",{className:"relative flex items-center justify-center cursor-pointer shrink-0",title:"Choose Fill Color",children:[e.jsx("div",{className:"w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0",style:{backgroundColor:A,width:18,height:18}}),e.jsx("input",{type:"color",value:A,onChange:t=>j(t.target.value),className:"w-full h-full opacity-0 absolute inset-0 cursor-pointer"})]}),e.jsxs("div",{className:"relative flex items-center justify-center cursor-pointer shrink-0",title:"Choose Outline Color",children:[e.jsx("div",{className:"w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0",style:{backgroundColor:k,width:18,height:18}}),e.jsx("input",{type:"color",value:k,onChange:t=>F(t.target.value),className:"w-full h-full opacity-0 absolute inset-0 cursor-pointer"})]})]}),e.jsxs("div",{className:"flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0",children:[e.jsx("button",{onClick:()=>D(t=>Math.max(.4,t-.1)),className:"w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200",title:"Zoom Out",children:e.jsx(Be,{className:"w-3 h-3"})}),e.jsxs("span",{className:"text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums",children:[Math.round(I*100),"%"]}),e.jsx("button",{onClick:()=>D(t=>Math.min(1.5,t+.1)),className:"w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200",title:"Zoom In",children:e.jsx(Fe,{className:"w-3 h-3"})})]}),e.jsxs("button",{onClick:$e,disabled:!b||!h||v.length===0,className:"ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:"Filter / Select Learners",children:[e.jsx(we,{className:"w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform"}),"Select (",y.size,")"]}),e.jsxs("button",{onClick:ue,disabled:!b||!h||K.length===0,className:"h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:"Bulk Download PDF for selected learners",children:[e.jsx(je,{className:"w-3 h-3 group-hover:-translate-y-0.5 transition-transform"}),"Bulk PDF"]}),e.jsxs("button",{onClick:be,disabled:!b||!h||K.length===0,className:"h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:"Bulk Print for selected learners",children:[e.jsx(ne,{className:"w-3 h-3 group-hover:scale-110 transition-transform"}),"Bulk Print"]}),e.jsxs("button",{onClick:Ae,disabled:!w,className:"h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer",title:"Print single active learner",children:[e.jsx(ne,{className:"w-3 h-3 group-hover:translate-y-0.5 transition-transform"}),"Print Single"]})]})]}),e.jsx("div",{className:"flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar",children:e.jsx("div",{className:"w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0",children:w?e.jsx("div",{className:"transition-all duration-700 ease-out origin-top print:scale-100",style:{transform:`scale(${I}) translateZ(0)`,willChange:"transform",backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden"},children:e.jsxs("div",{className:"relative group",children:[e.jsx("div",{className:"absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000"}),e.jsx("div",{className:"lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none",children:e.jsx(ke,{pageNumber:1,student:w,profile:B,schoolYear:x,subject:S?.subject_name||"",teacher:xe,fillColor:A,outlineColor:k,gradeData:Te,attendanceData:Ee,paperSize:u})})]})}):e.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10",children:[e.jsxs("div",{className:"relative group",children:[e.jsx("div",{className:"absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full"}),e.jsxs("div",{className:"relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl",children:[e.jsx(Ue,{className:"w-28 h-28 text-slate-100 dark:text-slate-600"}),e.jsxs("div",{className:"absolute inset-0 flex flex-col items-center justify-center",children:[e.jsx("span",{className:"text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic",children:"LIR"}),e.jsx("div",{className:"w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4"})]}),e.jsx("div",{className:"absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500",children:e.jsx(ne,{className:"w-10 h-10 text-white"})})]})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsx("h2",{className:"text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase",children:"Individual Record"}),e.jsx("p",{className:"text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60",children:"Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections."})]})]})})}),e.jsx("div",{id:"lir-bulk-render-container",className:"fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block",style:{left:"-9999px"},children:K.map(t=>{const a=oe(t,h,S),l=ie(t);return e.jsx("div",{className:"lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always",children:e.jsx(ke,{pageNumber:1,student:t,profile:B,schoolYear:x,subject:S?.subject_name||"",teacher:xe,fillColor:A,outlineColor:k,gradeData:a,attendanceData:l,paperSize:u})},t.lrn)})}),H&&e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200",children:e.jsxs("div",{className:"bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]",children:[e.jsxs("div",{className:"px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400",children:e.jsx(we,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-sm font-black uppercase tracking-wide text-white",children:"Bulk LIR Operations"}),e.jsxs("p",{className:"text-[10px] text-slate-400 font-semibold uppercase tracking-widest",children:[p?.section_grade_level," - ",p?.section_name," | ",S?.subject_name]})]})]}),e.jsx("button",{onClick:()=>z(!1),className:"w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors",children:e.jsx(He,{className:"w-4 h-4"})})]}),e.jsxs("div",{className:"p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0",children:[e.jsxs("div",{className:"relative flex-1 min-w-48",children:[e.jsx(Ge,{className:"w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"}),e.jsx("input",{type:"text",placeholder:"Filter learners by name or LRN...",value:P,onChange:t=>r(t.target.value),className:"w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"})]}),e.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap",children:[e.jsxs("button",{onClick:Re,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:[e.jsx(he,{className:"w-3 h-3 text-indigo-600"}),"All (",v.length,")"]}),e.jsxs("button",{onClick:Le,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:["Males (",Y.length,")"]}),e.jsxs("button",{onClick:Ce,className:"h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1",children:["Females (",q.length,")"]}),e.jsx("button",{onClick:Me,className:"h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1",children:"Clear"})]})]}),e.jsxs("div",{className:"flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4",children:[de.length>0&&e.jsxs("div",{className:"space-y-2",children:[e.jsx("div",{className:"flex items-center justify-between px-1",children:e.jsxs("span",{className:"text-[10px] font-black text-slate-500 uppercase tracking-widest",children:["Male Learners (",de.length,")"]})}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:de.map(t=>{const a=y.has(t.lrn),l=h&&(n.some(o=>o.student_lrn===t.lrn&&o.subject_id===h&&o.school_year===x)||g.some(o=>o.student_lrn===t.lrn&&o.subject_id===h&&o.school_year===x));return e.jsxs("div",{onClick:()=>ge(t.lrn),className:`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${a?"bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm":"bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`,children:[e.jsxs("div",{className:"flex items-center gap-2.5 min-w-0",children:[a?e.jsx(he,{className:"w-4 h-4 text-indigo-600 shrink-0"}):e.jsx(ve,{className:"w-4 h-4 text-slate-300 shrink-0"}),e.jsxs("div",{className:"truncate",children:[e.jsxs("p",{className:"text-xs font-bold text-slate-800 truncate",children:[t.last_name,", ",t.first_name," ",t.middle_name?t.middle_name[0]+".":""]}),e.jsxs("p",{className:"text-[9px] font-medium text-slate-400",children:["LRN: ",t.lrn]})]})]}),l&&e.jsx("span",{className:"px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0",children:"✓ Grades"})]},t.lrn)})})]}),ce.length>0&&e.jsxs("div",{className:"space-y-2",children:[e.jsx("div",{className:"flex items-center justify-between px-1",children:e.jsxs("span",{className:"text-[10px] font-black text-slate-500 uppercase tracking-widest",children:["Female Learners (",ce.length,")"]})}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:ce.map(t=>{const a=y.has(t.lrn),l=h&&(n.some(o=>o.student_lrn===t.lrn&&o.subject_id===h&&o.school_year===x)||g.some(o=>o.student_lrn===t.lrn&&o.subject_id===h&&o.school_year===x));return e.jsxs("div",{onClick:()=>ge(t.lrn),className:`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${a?"bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm":"bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`,children:[e.jsxs("div",{className:"flex items-center gap-2.5 min-w-0",children:[a?e.jsx(he,{className:"w-4 h-4 text-indigo-600 shrink-0"}):e.jsx(ve,{className:"w-4 h-4 text-slate-300 shrink-0"}),e.jsxs("div",{className:"truncate",children:[e.jsxs("p",{className:"text-xs font-bold text-slate-800 truncate",children:[t.last_name,", ",t.first_name," ",t.middle_name?t.middle_name[0]+".":""]}),e.jsxs("p",{className:"text-[9px] font-medium text-slate-400",children:["LRN: ",t.lrn]})]})]}),l&&e.jsx("span",{className:"px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0",children:"✓ Grades"})]},t.lrn)})})]}),Q.length===0&&e.jsxs("div",{className:"p-8 text-center text-slate-400 text-xs font-medium",children:['No learners found matching "',P,'".']})]}),e.jsxs("div",{className:"p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0",children:[e.jsxs("div",{className:"text-xs font-bold text-slate-600",children:[e.jsx("span",{className:"text-indigo-600 font-black",children:y.size})," of ",v.length," learners selected"]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("button",{onClick:ue,disabled:y.size===0,className:"h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer",children:[e.jsx(je,{className:"w-3.5 h-3.5"}),"Download PDF"]}),e.jsxs("button",{onClick:be,disabled:y.size===0,className:"h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer",children:[e.jsx(ne,{className:"w-3.5 h-3.5"}),"Bulk Print"]})]})]})]})}),m&&e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200",children:e.jsxs("div",{className:"bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6",children:[e.jsxs("div",{className:"relative w-16 h-16 mx-auto flex items-center justify-center",children:[e.jsx("div",{className:"absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping"}),e.jsx("div",{className:"relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30",children:e.jsx(Je,{className:"w-8 h-8 animate-spin"})})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("h3",{className:"text-lg font-black text-slate-900 tracking-tight uppercase",children:"Processing LIR Records"}),e.jsx("p",{className:"text-xs font-semibold text-slate-500",children:ye})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsx("div",{className:"h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200",children:e.jsx("div",{className:"h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300",style:{width:`${Math.max(5,O)}%`}})}),e.jsxs("div",{className:"flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider",children:[e.jsx("span",{children:"Export Pipeline"}),e.jsxs("span",{children:[O,"%"]})]})]})]})}),e.jsx("style",{children:`
                @media print {
                    @page {
                        size: ${u==="a4"?"210mm 297mm":u==="letter"?"8.5in 11in":"8.5in 13in"};
                        margin: 0 !important;
                    }
                    html, body {
                        width: ${u==="a4"?"210mm":"8.5in"} !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: ${u==="a4"?"210mm":"8.5in"} !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: ${u==="a4"?"210mm":"8.5in"} !important;
                        height: ${u==="a4"?"297mm":u==="letter"?"11in":"13in"} !important;
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
             `})]})}export{dt as LIRPage};
