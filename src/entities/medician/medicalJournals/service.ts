import MedicalJournal from './model';
import { IMedicalJournal } from './model';
import Child from '../../children/model';

export class MedicalJournalsService {
  async getAll(filters: { childId?: string, type?: string }) {
    const filter: any = {};
    if (filters.childId) filter.childId = filters.childId;
    if (filters.type) filter.type = filters.type;

    const journals = await MedicalJournal.find(filter)
      .populate('childId', 'fullName birthday address')
      .sort({ date: -1 });

    return journals;
  }

  async getById(id: string) {
    const journal = await MedicalJournal.findById(id)
      .populate('childId', 'fullName birthday address');

    if (!journal) {
      throw new Error('Медицинская запись не найдена');
    }

    return journal;
  }

  async create(journalData: Partial<IMedicalJournal>, userId?: string) {
    if (!journalData.childId) {
      throw new Error('Не указан ребенок');
    }
    if (!journalData.date) {
      journalData.date = new Date();
    }

    const child = await Child.findById(journalData.childId);
    if (!child) {
      throw new Error('Ребенок не найден');
    }

    const journal = new MedicalJournal(journalData);
    await journal.save();

    const populatedJournal = await MedicalJournal.findById(journal._id)
      .populate('childId', 'fullName birthday address');

    return populatedJournal;
  }

  async update(id: string, data: Partial<IMedicalJournal>) {
    const updatedJournal = await MedicalJournal.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('childId', 'fullName birthday address');

    if (!updatedJournal) {
      throw new Error('Медицинская запись не найдена');
    }

    return updatedJournal;
  }

  async delete(id: string) {
    const result = await MedicalJournal.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Медицинская запись не найдена');
    }

    return { message: 'Медицинская запись успешно удалена' };
  }

  async getByChildId(childId: string) {
    const journals = await MedicalJournal.find({ childId })
      .populate('childId', 'fullName birthday address')
      .sort({ date: -1 });

    return journals;
  }
}