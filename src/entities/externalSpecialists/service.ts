
import ExternalSpecialist, { IExternalSpecialist } from './model';

export class ExternalSpecialistService {
    async getAll(activeOnly: boolean = false) {
        const query: any = {};
        if (activeOnly) {
            query.active = true;
        }
        return await ExternalSpecialist.find(query).sort({ name: 1 });
    }

    async create(data: Partial<IExternalSpecialist>) {
        const specialist = new ExternalSpecialist(data);
        return await specialist.save();
    }

    async update(id: string, data: Partial<IExternalSpecialist>) {
        return await ExternalSpecialist.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string) {
        return await ExternalSpecialist.findByIdAndDelete(id);
    }

    async getById(id: string) {
        return await ExternalSpecialist.findById(id);
    }
}
