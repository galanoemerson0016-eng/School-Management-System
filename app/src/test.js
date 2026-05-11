const grades = ["Grade 1", "Grade 7", "Kindergarten", "Grade 11"];
const activeCategory = "ELEMENTARY";

grades.forEach(grade => {
    let isMatch = false;
    const num = parseInt(grade.replace(/\D/g, '')) || 0;
    
    if (activeCategory === 'ELEMENTARY' && (grade.toLowerCase().includes('kinder') || (num >= 1 && num <= 6))) isMatch = true;
    else if (activeCategory === 'JUNIOR HIGH SCHOOL' && (num >= 7 && num <= 10)) isMatch = true;
    else if (activeCategory === 'SENIOR HIGH SCHOOL' && (num >= 11 && num <= 12)) isMatch = true;
    
    console.log(grade, "num:", num, "isMatch:", isMatch);
});
