import User from './User.js';
import Student from './Student.js';
import Faculty from './Faculty.js';
import Course from './Course.js';
import Enrollment from './Enrollment.js';
import Attendance from './Attendance.js';
import Exam from './Exam.js';
import ExamResult from './ExamResult.js';
import Fee from './Fee.js';
import Payment from './Payment.js';
import Book from './Book.js';
import BookLoan from './BookLoan.js';
import Department from './Department.js';
import CourseFaculty from './CourseFaculty.js';

// === Associations ===

// User <-> Student (one-to-one)
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Faculty (one-to-one)
User.hasOne(Faculty, { foreignKey: 'userId', as: 'facultyProfile' });
Faculty.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Faculty <-> Course (many-to-many via CourseFaculty)
Faculty.belongsToMany(Course, { through: CourseFaculty, foreignKey: 'facultyId', as: 'courses' });
Course.belongsToMany(Faculty, { through: CourseFaculty, foreignKey: 'courseId', as: 'faculties' });
Faculty.hasMany(CourseFaculty, { foreignKey: 'facultyId', as: 'assignmentRecords' });
Course.hasMany(CourseFaculty, { foreignKey: 'courseId', as: 'assignmentRecords' });
CourseFaculty.belongsTo(Faculty, { foreignKey: 'facultyId', as: 'faculty' });
CourseFaculty.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Student <-> Course (many-to-many via Enrollment)
Student.belongsToMany(Course, { through: Enrollment, foreignKey: 'studentId', otherKey: 'courseId', as: 'courses' });
Course.belongsToMany(Student, { through: Enrollment, foreignKey: 'courseId', otherKey: 'studentId', as: 'students' });
Student.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Attendance
Student.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendanceRecords' });
Course.hasMany(Attendance, { foreignKey: 'courseId', as: 'attendanceRecords' });
Attendance.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Attendance.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Exam <-> Course
Course.hasMany(Exam, { foreignKey: 'courseId', as: 'exams' });
Exam.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// ExamResult
Exam.hasMany(ExamResult, { foreignKey: 'examId', as: 'results' });
ExamResult.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });
Student.hasMany(ExamResult, { foreignKey: 'studentId', as: 'examResults' });
ExamResult.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Fee <-> Student
Student.hasMany(Fee, { foreignKey: 'studentId', as: 'fees' });
Fee.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Payment <-> Fee, Student
Fee.hasMany(Payment, { foreignKey: 'feeId', as: 'payments' });
Payment.belongsTo(Fee, { foreignKey: 'feeId', as: 'fee' });
Student.hasMany(Payment, { foreignKey: 'studentId', as: 'payments' });
Payment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// BookLoan
Book.hasMany(BookLoan, { foreignKey: 'bookId', as: 'loans' });
BookLoan.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });
User.hasMany(BookLoan, { foreignKey: 'userId', as: 'bookLoans' });
BookLoan.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Department <-> Student, Faculty, Course
Department.hasMany(Student, { foreignKey: 'departmentId', as: 'students' });
Student.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentRef' });

Department.hasMany(Faculty, { foreignKey: 'departmentId', as: 'faculty' });
Faculty.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentRef' });

Department.hasMany(Course, { foreignKey: 'departmentId', as: 'courses' });
Course.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentRef' });

export {
    User, Student, Faculty, Course, Enrollment,
    Attendance, Exam, ExamResult, Fee, Payment,
    Book, BookLoan, Department, CourseFaculty,
};
