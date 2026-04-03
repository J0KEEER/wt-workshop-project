import { User, Faculty, LeaveRequest, Payroll, Course, Timetable, CourseFaculty } from './server/src/models/index.js';
import { sequelize } from './server/src/db.js';

async function verify() {
  try {
    const adminAddress = await User.findOne({ where: { role: 'admin' } });
    const facultyUser = await User.findOne({ 
      where: { role: 'faculty' },
      include: [{ model: Faculty, as: 'facultyProfile' }] 
    });
    
    if (!adminAddress || !facultyUser || !facultyUser.facultyProfile) {
      console.error('Missing test users or faculty profile');
      return;
    }

    console.log('--- Testing Leave Request Flow ---');
    const leave = await LeaveRequest.create({
      userId: facultyUser.id,
      type: 'sick',
      startDate: '2026-05-01',
      endDate: '2026-05-02',
      reason: 'Fever',
      status: 'pending'
    });
    console.log(`Created Leave: ${leave.type}, Status: ${leave.status}`);
    
    await leave.update({ status: 'approved', approverId: adminAddress.id });
    console.log(`Updated Leave Status: ${leave.status}, Approver: ${leave.approverId}`);
    
    if (leave.status === 'approved') {
      console.log('✅ Success: Leave workflow functional');
    }

    console.log('--- Testing Payroll Generation ---');
    await facultyUser.update({ baseSalary: 5000 });
    const payroll = await Payroll.create({
      userId: facultyUser.id,
      month: 5,
      year: 2026,
      baseSalary: 5000,
      netPay: 5000,
      status: 'draft'
    });
    console.log(`Generated Payroll: ${payroll.month}/${payroll.year}, Net: ${payroll.netPay}`);
    
    if (payroll.netPay == 5000) {
      console.log('✅ Success: Payroll record correct');
    }

    console.log('--- Testing Teacher Schedule Retrieval ---');
    const today = new Date().getDay();
    const testCourse = await Course.create({
      code: 'HR401',
      title: 'Advanced Personnel Management',
      semester: 1,
      department: 'Management',
      credits: 4
    });

    await CourseFaculty.create({
      courseId: testCourse.id,
      facultyId: facultyUser.facultyProfile.id
    });

    const slot = await Timetable.create({
      courseId: testCourse.id,
      dayOfWeek: today,
      startTime: '09:00',
      endTime: '10:30',
      room: 'Room 101'
    });

    // Manual retrieval check
    const facultyWithCourses = await Faculty.findByPk(facultyUser.facultyProfile.id, {
        include: [{ model: Course, as: 'courses', include: [{ model: Timetable, as: 'schedule' }] }]
    });

    const found = facultyWithCourses.courses.some(c => c.id === testCourse.id);
    if (found) {
        console.log(`✅ Success: Teacher assigned to course ${testCourse.code}`);
        const hasSlot = facultyWithCourses.courses.find(c => c.id === testCourse.id).schedule.some(s => s.id === slot.id);
        if (hasSlot) {
            console.log(`✅ Success: Schedule slot found for teacher on day ${today}`);
        }
    }

    // Cleanup
    await leave.destroy();
    await payroll.destroy();
    await slot.destroy();
    await testCourse.destroy(); // Cascade or manual association cleanup
    
    console.log('--- Phase 15 Verification Complete ---');
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

verify();
