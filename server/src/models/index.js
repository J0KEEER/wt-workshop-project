import User from './User.js';
import Student from './Student.js';
import Faculty from './Faculty.js';
import Course from './Course.js';
import Enrollment from './Enrollment.js';
import AttendanceSession from './AttendanceSession.js';
import AttendanceRecord from './AttendanceRecord.js';
import Exam from './Exam.js';
import ExamResult from './ExamResult.js';
import Fee from './Fee.js';
import Payment from './Payment.js';
import Book from './Book.js';
import BookLoan from './BookLoan.js';
import BookReservation from './BookReservation.js';
import Department from './Department.js';
import CourseFaculty from './CourseFaculty.js';
import CampusEvent from './CampusEvent.js';
import Holiday from './Holiday.js';
import Timetable from './Timetable.js';
import Feedback from './Feedback.js';
import LeaveRequest from './LeaveRequest.js';
import Payroll from './Payroll.js';
import Hostel from './Hostel.js';
import Room from './Room.js';
import HostelAllocation from './HostelAllocation.js';
import TransportRoute from './TransportRoute.js';
import TransportStop from './TransportStop.js';
import Vehicle from './Vehicle.js';
import TransportSubscription from './TransportSubscription.js';
import Asset from './Asset.js';
import MaintenanceRequest from './MaintenanceRequest.js';
import AssetBooking from './AssetBooking.js';

// === Associations ===
// Asset Associations
Room.hasMany(Asset, { foreignKey: 'roomId', as: 'assets' });
Asset.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

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

// Attendance Sessions & Records
Course.hasMany(AttendanceSession, { foreignKey: 'courseId', as: 'attendanceSessions' });
AttendanceSession.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Faculty.hasMany(AttendanceSession, { foreignKey: 'teacherId', as: 'attendanceSessions' });
AttendanceSession.belongsTo(Faculty, { foreignKey: 'teacherId', as: 'teacher' });

AttendanceSession.hasMany(AttendanceRecord, { foreignKey: 'sessionId', as: 'records' });
AttendanceRecord.belongsTo(AttendanceSession, { foreignKey: 'sessionId', as: 'session' });

Student.hasMany(AttendanceRecord, { foreignKey: 'studentId', as: 'attendanceRecords' });
AttendanceRecord.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Exam <-> Course
Course.hasMany(Exam, { foreignKey: 'courseId', as: 'exams' });
Exam.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Timetable
Course.hasMany(Timetable, { foreignKey: 'courseId', as: 'schedule' });
Timetable.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

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

// Book associations
Book.hasMany(BookLoan, { foreignKey: 'bookId', as: 'loans' });
BookLoan.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });
User.hasMany(BookLoan, { foreignKey: 'userId', as: 'bookLoans' });
BookLoan.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Book.hasMany(BookReservation, { foreignKey: 'bookId', as: 'reservations' });
BookReservation.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });
User.hasMany(BookReservation, { foreignKey: 'userId', as: 'reservations' });
BookReservation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Feedback <-> Student, Course
Student.hasMany(Feedback, { foreignKey: 'studentId', as: 'feedbacks' });
Feedback.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Course.hasMany(Feedback, { foreignKey: 'courseId', as: 'feedbacks' });
Feedback.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Department <-> Student, Faculty, Course
Department.hasMany(Student, { foreignKey: 'departmentId', as: 'students' });
Student.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentRef' });

Department.hasMany(Faculty, { foreignKey: 'departmentId', as: 'faculty' });
Faculty.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentRef' });

Department.hasMany(Course, { foreignKey: 'departmentId', as: 'courses' });
Course.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentRef' });

// LeaveRequest
User.hasMany(LeaveRequest, { foreignKey: 'userId', as: 'leaves' });
LeaveRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Payroll
User.hasMany(Payroll, { foreignKey: 'userId', as: 'payrolls' });
Payroll.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Hostel associations
Hostel.hasMany(Room, { foreignKey: 'hostelId', as: 'rooms' });
Room.belongsTo(Hostel, { foreignKey: 'hostelId', as: 'hostel' });

Room.hasMany(HostelAllocation, { foreignKey: 'roomId', as: 'allocations' });
HostelAllocation.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

Student.hasOne(HostelAllocation, { foreignKey: 'studentId', as: 'hostelAllocation' });
HostelAllocation.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Transport associations
TransportRoute.hasMany(TransportStop, { foreignKey: 'routeId', as: 'stops' });
TransportStop.belongsTo(TransportRoute, { foreignKey: 'routeId', as: 'route' });

TransportStop.hasMany(TransportSubscription, { foreignKey: 'stopId', as: 'subscriptions' });
TransportSubscription.belongsTo(TransportStop, { foreignKey: 'stopId', as: 'stop' });

Student.hasOne(TransportSubscription, { foreignKey: 'studentId', as: 'transportSubscription' });
TransportSubscription.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Vehicle.hasMany(TransportSubscription, { foreignKey: 'vehicleId', as: 'subscriptions' });
TransportSubscription.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

export {
    User, Student, Faculty, Course, Enrollment,
    AttendanceSession, AttendanceRecord, Exam, ExamResult, Fee, Payment,
    Book, BookLoan, BookReservation, Department, CourseFaculty, 
    Holiday, CampusEvent, Timetable, Feedback, LeaveRequest, Payroll,
    Hostel, Room, HostelAllocation, TransportRoute, TransportStop, 
    Vehicle, TransportSubscription, Asset, MaintenanceRequest, AssetBooking,
};
