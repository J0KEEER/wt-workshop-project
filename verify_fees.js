import { Fee, Student } from './server/src/models/index.js';
import { sequelize } from './server/src/db.js';

async function verify() {
  try {
    const student = await Student.findOne();
    if (!student) {
      console.error('No students found for testing');
      return;
    }

    // 1. Create a fee with a past due date to test "overdue" logic
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    
    console.log('--- Testing Overdue Hook ---');
    const overdueFee = await Fee.create({
      studentId: student.id,
      description: 'Test Overdue Fee',
      type: 'tuition',
      amount: 1000,
      paidAmount: 0,
      dueDate: pastDate.toISOString().split('T')[0],
      status: 'pending' // Hook should change this to 'overdue'
    });
    console.log(`Created Fee: ${overdueFee.description}, Due: ${overdueFee.dueDate}, Status: ${overdueFee.status}`);
    
    if (overdueFee.status === 'overdue') {
      console.log('✅ Success: Overdue status assigned automatically');
    } else {
      console.log('❌ Failure: Overdue status not assigned');
    }

    // 2. Test "partial" logic
    console.log('--- Testing Partial Hook ---');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const partialFee = await Fee.create({
      studentId: student.id,
      description: 'Test Partial Fee',
      type: 'tuition',
      amount: 1000,
      paidAmount: 500,
      dueDate: futureDate.toISOString().split('T')[0],
      status: 'pending' // Hook should change this to 'partial'
    });
    console.log(`Created Fee: ${partialFee.description}, Paid: ${partialFee.paidAmount}, Status: ${partialFee.status}`);

    if (partialFee.status === 'partial') {
      console.log('✅ Success: Partial status assigned automatically');
    } else {
      console.log('❌ Failure: Partial status not assigned');
    }

    // Cleanup
    await overdueFee.destroy();
    await partialFee.destroy();
    
    console.log('--- Verification Complete ---');
    process.exit(0);
  } catch (err) {
    console.error('Verification error:', err);
    process.exit(1);
  }
}

verify();
