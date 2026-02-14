import SomaticJournal from './model';
import { ISomaticJournal } from './model';
import Child from '../../children/model';

export class SomaticJournalService {
  async getAll(filters: { childId?: string }) {
    const filter: any = {};
    if (filters.childId) filter.childId = filters.childId;

    const journals = await SomaticJournal.find(filter)
      .populate('childId', 'fullName birthday address')
      .sort({ date: -1 });

    return journals;
  }

  async getById(id: string) {
    const journal = await SomaticJournal.findById(id)
      .populate('childId', 'fullName birthday address');

    if (!journal) {
      throw new Error('Запись не найдена');
    }

    return journal;
  }

  async create(journalData: Partial<ISomaticJournal>, userId: string) {
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

    const journal = new SomaticJournal(journalData);
    await journal.save();

    const populatedJournal = await SomaticJournal.findById(journal._id)
      .populate('childId', 'fullName birthday address');

    return populatedJournal;
  }

  async update(id: string, data: Partial<ISomaticJournal>) {
    const updatedJournal = await SomaticJournal.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('childId', 'fullName birthday address');

    if (!updatedJournal) {
      throw new Error('Запись не найдена');
    }

    return updatedJournal;
  }

  async delete(id: string) {
    const result = await SomaticJournal.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Запись не найдена');
    }

    return { message: 'Запись успешно удалена' };
  }

  async getByChildId(childId: string) {
    const journals = await SomaticJournal.find({ childId })
      .populate('childId', 'fullName birthday address')
      .sort({ date: -1 });

    return journals;
  }
}