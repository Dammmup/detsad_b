import { Request, Response } from 'express';
import { ContactInfectionJournalService } from './service';


let contactInfectionJournalService: ContactInfectionJournalService | null = null;

const getContactInfectionJournalService = (): ContactInfectionJournalService => {
  if (!contactInfectionJournalService) {
    contactInfectionJournalService = new ContactInfectionJournalService();
  }
  return contactInfectionJournalService;
};

export const getAllContactInfectionJournals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId, date, doctorId, status, infectionType, startDate, endDate, nextAppointmentDate, isolationEndDate, contactsTraced } = req.query;

    const journals = await getContactInfectionJournalService().getAll({
      childId: childId as string,
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      infectionType: infectionType as string,
      startDate: startDate as string,
      endDate: endDate as string,
      nextAppointmentDate: nextAppointmentDate as string,
      isolationEndDate: isolationEndDate as string,
      contactsTraced: contactsTraced === 'true' ? true : contactsTraced === 'false' ? false : undefined
    });

    res.json(journals);
  } catch (err) {
    console.error('Error fetching contact infection journals:', err);
    res.status(500).json({ error: 'Ошибка получения записей контактных инфекций' });
  }
};

export const getContactInfectionJournalById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const journal = await getContactInfectionJournalService().getById(req.params.id);
    res.json(journal);
  } catch (err: any) {
    console.error('Error fetching contact infection journal:', err);
    res.status(404).json({ error: err.message || 'Запись контактной инфекции не найдена' });
  }
};

export const createContactInfectionJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const journal = await getContactInfectionJournalService().create(req.body, req.user.id as string);
    res.status(201).json(journal);
  } catch (err: any) {
    console.error('Error creating contact infection journal:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи контактной инфекции' });
  }
};

export const updateContactInfectionJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const journal = await getContactInfectionJournalService().update(req.params.id, req.body);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating contact infection journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи контактной инфекции' });
  }
};

export const deleteContactInfectionJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await getContactInfectionJournalService().delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting contact infection journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи контактной инфекции' });
  }
};

export const getContactInfectionJournalsByChildId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId } = req.params;
    const { date, doctorId, status, infectionType, startDate, endDate, nextAppointmentDate, isolationEndDate, contactsTraced } = req.query;

    const journals = await getContactInfectionJournalService().getByChildId(childId, {
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      infectionType: infectionType as string,
      startDate: startDate as string,
      endDate: endDate as string,
      nextAppointmentDate: nextAppointmentDate as string,
      isolationEndDate: isolationEndDate as string,
      contactsTraced: contactsTraced === 'true' ? true : contactsTraced === 'false' ? false : undefined
    });

    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching contact infection journals by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей контактных инфекций по ребенку' });
  }
};

export const getContactInfectionJournalsByDoctorId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { doctorId } = req.params;
    const { childId, status, infectionType, startDate, endDate, nextAppointmentDate, isolationEndDate, contactsTraced } = req.query;

    const journals = await getContactInfectionJournalService().getByDoctorId(doctorId, {
      childId: childId as string,
      status: status as string,
      infectionType: infectionType as string,
      startDate: startDate as string,
      endDate: endDate as string,
      nextAppointmentDate: nextAppointmentDate as string,
      isolationEndDate: isolationEndDate as string,
      contactsTraced: contactsTraced === 'true' ? true : contactsTraced === 'false' ? false : undefined
    });

    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching contact infection journals by doctor ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей контактных инфекций по врачу' });
  }
};

export const getUpcomingAppointments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;

    const journals = await getContactInfectionJournalService().getUpcomingAppointments(daysNum);
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching upcoming appointments:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих записей' });
  }
};

export const updateContactInfectionJournalStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }

    const journal = await getContactInfectionJournalService().updateStatus(req.params.id, status);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating contact infection journal status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса записи контактной инфекции' });
  }
};

export const addContactInfectionJournalRecommendations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { recommendations } = req.body;

    if (!recommendations) {
      return res.status(400).json({ error: 'Не указаны рекомендации' });
    }

    const journal = await getContactInfectionJournalService().addRecommendations(req.params.id, recommendations);
    res.json(journal);
  } catch (err: any) {
    console.error('Error adding contact infection journal recommendations:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления рекомендаций к записи контактной инфекции' });
  }
};

export const traceContacts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const journal = await getContactInfectionJournalService().traceContacts(req.params.id);
    res.json(journal);
  } catch (err: any) {
    console.error('Error tracing contacts:', err);
    res.status(404).json({ error: err.message || 'Ошибка отслеживания контактов' });
  }
};

export const getContactInfectionJournalStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const stats = await getContactInfectionJournalService().getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching contact infection journal statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики контактных инфекций' });
  }
};