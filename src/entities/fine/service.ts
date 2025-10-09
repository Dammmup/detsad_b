import { IFine } from './model';
import Fine from './model';
import mongoose from 'mongoose';

export class FineService {
  async getAll() {
    return await Fine.find().populate('user', 'fullName phone role');
  }

  async getById(id: string) {
    return await Fine.findById(id).populate('user', 'fullName phone role');
  }

  async create(fineData: Partial<IFine>) {
    const fine = new Fine(fineData);
    return await fine.save();
  }

  async update(id: string, fineData: Partial<IFine>) {
    return await Fine.findByIdAndUpdate(id, fineData, { new: true }).populate('user', 'fullName phone role');
  }

  async delete(id: string) {
    const result = await Fine.findByIdAndDelete(id);
    return !!result;
 }

  async getByUserId(userId: string) {
    return await Fine.find({ user: userId }).sort({ date: -1 });
  }

  async getTotalByUserId(userId: string) {
    const result = await Fine.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$amount" } }}
    ]);
    return result[0]?.total || 0;
  }
}