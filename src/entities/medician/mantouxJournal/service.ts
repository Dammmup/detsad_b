import MantouxJournal from './model';
import { IMantouxJournal } from './model';
import Child from '../../children/model';

export class MantouxJournalService {
  async getAll(filters: { childId?: string }) {
    const filter: any = {};
    if (filters.childId) filter.childId = filters.childId;

    const journals = await MantouxJournal.find(filter)
      .populate('childId', 'fullName birthday address')
      .sort({ date: -1 });

    return journals;
  }

  async getById(id: string) {
    const journal = await MantouxJournal.findById(id)
      .populate('childId', 'fullName birthday address');

    if (!journal) {
      throw new Error('Запись манту не найдена');
    }

    return journal;
  }

  async create(journalData: Partial<IMantouxJournal>, userId: string) {
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

    const journal = new MantouxJournal(journalData);
    await journal.save();

    const populatedJournal = await MantouxJournal.findById(journal._id)
      .populate('childId', 'fullName birthday address');

    return populatedJournal;
  }

  async update(id: string, data: Partial<IMantouxJournal>) {
    const updatedJournal = await MantouxJournal.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('childId', 'fullName birthday address');

    if (!updatedJournal) {
      throw new Error('Запись манту не найдена');
    }

    return updatedJournal;
  }

  async delete(id: string) {
    const result = await MantouxJournal.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Запись манту не найдена');
    }

    return { message: 'Запись манту успешно удалена' };
  }

  async getByChildId(childId: string) {
    const journals = await MantouxJournal.find({ childId })
      .populate('childId', 'fullName birthday address')
      .sort({ date: -1 });

    return journals;
  }
}