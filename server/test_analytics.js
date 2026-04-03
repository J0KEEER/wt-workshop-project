import { Exam, ExamResult, Student, Course } from './src/models/index.js';

async function setup() {
    try {
        const course = await Course.findOne();
        if (!course) {
            console.log('No course found');
            process.exit(1);
        }

        const students = await Student.findAll({ limit: 10 });
        if (students.length < 5) {
            console.log('Not enough students for analytics test');
            process.exit(1);
        }

        const exam = await Exam.create({
            courseId: course.id,
            title: 'Statistical Analytics Midterm',
            type: 'midterm',
            date: '2026-04-15',
            totalMarks: 100
        });

        // Create 10 results with varied grades
        const results = [
            { studentId: students[0].id, marks: 95, grade: 'A+' },
            { studentId: students[1].id, marks: 88, grade: 'A' },
            { studentId: students[2].id, marks: 82, grade: 'A' },
            { studentId: students[3].id, marks: 74, grade: 'B+' },
            { studentId: students[4].id, marks: 65, grade: 'B' },
            { studentId: students[5].id, marks: 58, grade: 'C' },
            { studentId: students[6].id, marks: 45, grade: 'D' },
            { studentId: students[7].id, marks: 32, grade: 'F' },
            { studentId: students[8].id, marks: 28, grade: 'F' },
            { studentId: students[9].id, marks: 99, grade: 'A+' },
        ];

        for (const r of results) {
            await ExamResult.create({
                examId: exam.id,
                studentId: r.studentId,
                marksObtained: r.marks,
                grade: r.grade,
                remarks: 'Auto-generated for test'
            });
        }

        console.log('--- TEST DATA CREATED ---');
        console.log('Exam ID:', exam.id);
        console.log('Exam Title:', exam.title);
        process.exit(0);
    } catch (err) {
        console.error('Setup failed:', err);
        process.exit(1);
    }
}

setup();
