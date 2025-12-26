import HelminthJournal from './model';
import { IHelminthJournal } from './model';
import Child from '../../children/model';

export class HelminthJournalService {
  async getAll(filters: { childId?: string }) {
    const filter: any = {};
    if (filters.childId) filter.childId = filters.childId;

    const journals = await HelminthJournal.find(filter)
      .populate('childId', 'fullName birthday address')
      .sort({ date: -1 });

    return journals;
  }

  async getById(id: string) {
    const journal = await HelminthJournal.findById(id)
      .populate('childId', 'fullName birthday address');

    if (!journal) {
      throw new Error('Запись не найдена');
    }

    return journal;
  }

  async create(journalData: Partial<IHelminthJournal>, userId: string) {
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

    const journal = new HelminthJournal(journalData);
    await journal.save();

    const populatedJournal = await HelminthJournal.findById(journal._id)
      .populate('childId', 'fullName birthday address');

    return populatedJournal;
  }

  async update(id: string, data: Partial<IHelminthJournal>) {
    const updatedJournal = await HelminthJournal.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('childId', 'fullName birthday address');

    if (!updatedJournal) {
      throw new Error('Запись не найдена');
    }

    return updatedJournal;
  }

  async delete(id: string) {
    const result = await HelminthJournal.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Запись не найдена');
    }

    return { message: 'Запись успешно удалена' };
  }

  async getByChildId(childId: string) {
    const journals = await HelminthJournal.find({ childId })
      .populate('childId', 'fullName birthday address')
      .sort({ date: -1 });

    return journals;
  }
}