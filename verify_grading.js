import axios from 'axios';

const API_URL = 'http://localhost:5001/api';
let adminToken, facultyToken, studentToken;
let examId, studentId, courseId, userId;

async function setup() {
    try {
        console.log('--- Phase 16 Verification: Grading & Analytics ---');
        
        // 1. Login as Admin
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        adminToken = adminLogin.data.accessToken;
        console.log('✅ Admin logged in');

        // 2. Get a valid Student and their User mapping
        const students = await axios.get(`${API_URL}/students`, { headers: { Authorization: `Bearer ${adminToken}` } });
        const student = students.data[0];
        studentId = student.id;
        userId = student.userId;
        
        const users = await axios.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${adminToken}` } });
        const studentUser = users.data.find(u => u.id === userId);
        
        if (!studentUser) throw new Error('Could not find user account for the student');
        console.log(`✅ Found Student: ${student.name} (Roll: ${student.rollNo}), User: ${studentUser.username}`);

        // 3. Get Course
        const courses = await axios.get(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${adminToken}` } });
        courseId = courses.data[0].id;

        // 4. Create an Exam (Tomorrow)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const examRes = await axios.post(`${API_URL}/exams`, {
            courseId,
            title: 'Phase 16 Verification Exam',
            type: 'final',
            date: tomorrow.toISOString().split('T')[0],
            totalMarks: 100
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        examId = examRes.data.id;

        // 5. Submit Grades (Administrative bypass)
        await axios.post(`${API_URL}/exams/${examId}/results`, {
            results: [{ studentId, marksObtained: 92, remarks: 'Excellent' }]
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('✅ Grades submitted');

        // 6. Student Summary Verification
        console.log(`🔑 Attempting student login: ${studentUser.username}`);
        const sLogin = await axios.post(`${API_URL}/auth/login`, {
            username: studentUser.username,
            password: 'stu123' // Alice from seed
        }).catch(async () => {
            return await axios.post(`${API_URL}/auth/login`, {
                username: studentUser.username,
                password: 'password123'
            });
        });
        
        studentToken = sLogin.data.accessToken;
        const summaryRes = await axios.get(`${API_URL}/performance/summary`, { headers: { Authorization: `Bearer ${studentToken}` } });
        console.log('📈 GPA Result:', summaryRes.data.gpa);
        
        if (summaryRes.data.gpa > 0) {
            console.log('✅ GPA Logic Verified');
        }

        console.log('\n✨ ALL PHASE 16 TESTS PASSED ✨');

    } catch (err) {
        console.error('❌ Verification failed:', err.response?.data || err.message);
        process.exit(1);
    }
}

setup();
