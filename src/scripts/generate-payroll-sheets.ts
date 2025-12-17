import mongoose from 'mongoose';
import Payroll from '../entities/payroll/model';
import User from '../entities/users/model';
import StaffShift from '../entities/staffShifts/model';
import { IUser } from '../entities/users/model';


interface EmployeePayrollInfo {
  baseSalary?: number;
  type?: string;
  shiftRate?: number;
  latePenaltyRate?: number;
  bonuses?: number;
}


interface IUserWithPayroll {
  _id: string;
  payroll?: EmployeePayrollInfo;
  fullName?: string;
  role: string;
}


function getWorkingDaysInMonth(year: number, month: number): number {


  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }

  return workingDays;
}


function calculateLatePenalties(shifts: any[], latePenaltyRate: number = 13): number {
  let totalPenalty = 0;

  for (const shift of shifts) {
    if (shift.startTime && shift.scheduledStartTime) {
      const scheduledStart = new Date(shift.scheduledStartTime);
      const actualStart = new Date(shift.startTime);


      const delayInMinutes = Math.max(0, (actualStart.getTime() - scheduledStart.getTime()) / (1000 * 60));


      if (delayInMinutes >= 5) {

        const fiveMinuteIntervals = Math.ceil(delayInMinutes / 5);
        totalPenalty += fiveMinuteIntervals * latePenaltyRate;
      }
    }
  }

  return totalPenalty;
}


function calculateAbsencePenalties(shifts: any[]): number {
  let totalPenalty = 0;

  for (const shift of shifts) {

    if (shift.scheduledStartTime && !shift.startTime) {
      totalPenalty += 5000;
    }
  }

  return totalPenalty;
}


async function generatePayrollSheets(period: string) {
  try {

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/detsad');


    const [year, month] = period.split('-').map(Number);


    const staff = await User().find({ role: { $ne: 'admin' } });


    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const shifts = await StaffShift().find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('staffId', '_id');


    const shiftsByStaff: { [key: string]: any[] } = {};
    shifts.forEach(shift => {
      const staffId = (shift.staffId as any)._id.toString();
      if (!shiftsByStaff[staffId]) {
        shiftsByStaff[staffId] = [];
      }
      shiftsByStaff[staffId].push(shift);
    });


    for (const rawEmployee of staff) {

      const employeeWithPayroll = rawEmployee as IUserWithPayroll;

      const employeeShifts = shiftsByStaff[employeeWithPayroll._id.toString()] || [];


      const workingDaysInPeriod = getWorkingDaysInMonth(year, month - 1);
      const workedDays = employeeShifts.filter(shift => shift.startTime).length;
      const workedShifts = employeeShifts.length;


      const latePenaltyRate = employeeWithPayroll.payroll?.latePenaltyRate || 500;
      const latePenalties = calculateLatePenalties(employeeShifts, latePenaltyRate);
      const absencePenalties = calculateAbsencePenalties(employeeShifts);



      let baseSalary = employeeWithPayroll.payroll?.baseSalary || 0;


      if (employeeWithPayroll.payroll?.type === 'per_shift' && employeeWithPayroll.payroll?.shiftRate) {
        baseSalary = workedShifts * employeeWithPayroll.payroll.shiftRate;
      }

      else if (employeeWithPayroll.payroll?.type === 'per_shift_with_fixed' && employeeWithPayroll.payroll?.shiftRate) {
        const fixedPart = employeeWithPayroll.payroll.baseSalary || 0;
        const shiftPart = workedShifts * employeeWithPayroll.payroll.shiftRate;
        baseSalary = fixedPart + shiftPart;
      }


      const bonuses = employeeWithPayroll.payroll?.bonuses || 0;


      const penalties = latePenalties + absencePenalties;


      const total = baseSalary + bonuses - penalties;


      let payroll = await Payroll().findOne({
        staffId: employeeWithPayroll._id,
        period: period
      });

      if (payroll) {

        payroll.accruals = baseSalary;
        payroll.bonuses = bonuses;
        payroll.total = total;
        payroll.updatedAt = new Date();

        await payroll.save();
        console.log(`Обновлена зарплата для сотрудника ${employeeWithPayroll.fullName}: ${total} тг`);
      } else {

        payroll = new (Payroll())({
          staffId: employeeWithPayroll._id,
          period: period,
          baseSalary: baseSalary,
          accruals: baseSalary,
          bonuses: bonuses,
          penalties: penalties,
          latePenalties: latePenalties,
          absencePenalties: absencePenalties,
          total: total,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await payroll.save();
        console.log(`Создана зарплата для сотрудника ${employeeWithPayroll.fullName}: ${total} тг`);
      }
    }

    console.log('Расчетные листы успешно сгенерированы для периода:', period);
  } catch (error) {
    console.error('Ошибка при генерации расчетных листов:', error);
  } finally {

    await mongoose.disconnect();
  }
}


if (require.main === module) {
  const period = process.argv[2];

  if (!period) {
    console.error('Пожалуйста, укажите период в формате YYYY-MM (например, 2025-01)');
    process.exit(1);
  }


  const periodRegex = /^\d{4}-\d{2}$/;
  if (!periodRegex.test(period)) {
    console.error('Неверный формат периода. Используйте формат YYYY-MM (например, 2025-01)');
    process.exit(1);
  }

  generatePayrollSheets(period);
}

export default generatePayrollSheets;