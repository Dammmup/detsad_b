import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import Child, { IChild } from '../src/entities/children/model';
import Group, { IGroup } from '../src/entities/groups/model';

// Import all medical journal models and their Create interfaces
import SomaticJournal from '../src/entities/medician/somaticJournal/model';
import ContactInfectionJournal, { IContactInfectionJournalCreate } from '../src/entities/medician/contactInfectionJournal/model';
import HelminthJournal, { IHelminthJournalCreate } from '../src/entities/medician/helminthJournal/model';
import InfectiousDiseasesJournal, { IInfectiousDiseasesJournalCreate } from '../src/entities/medician/infectiousDiseasesJournal/model';
import MantouxJournal, { IMantouxJournalCreate } from '../src/entities/medician/mantouxJournal/model';
import RiskGroupChild, { IRiskGroupChildCreate } from '../src/entities/medician/riskGroupChildren/model';
import TubPositiveJournal, { ITubPositiveJournalCreate } from '../src/entities/medician/tubPositiveJournal/model';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad_db';

const DIAGNOSES_SOMATIC = [
    { diagnosis: 'температура', treatment: 'парацетамол' },
    { diagnosis: 'понос', treatment: 'смекта 1 пакет' },
    { diagnosis: 'рвота', treatment: 'смекта/имудон' },
    { diagnosis: 'укус насекомого', treatment: 'псило бальзам' },
    { diagnosis: 'кашель', treatment: 'сироп от кашля' },
    { diagnosis: 'боль в горле', treatment: 'спрей для горла' },
    { diagnosis: 'аллергическая реакция', treatment: 'антигистаминное' },
    { diagnosis: 'насморк', treatment: 'капли для носа' },
    { diagnosis: 'головная боль', treatment: 'ибупрофен' },
    { diagnosis: 'небольшая травма', treatment: 'антисептик и пластырь' },
    { diagnosis: 'конъюнктивит', treatment: 'глазные капли' },
    { diagnosis: 'ожог', treatment: 'пантенол' },
    { diagnosis: 'простуда', treatment: 'обильное питье, покой' },
    { diagnosis: 'ветрянка', treatment: 'зеленка/каламин' }
];

const INFECTION_TYPES = ['ОРВИ', 'Грипп', 'Ветряная оспа', 'Скарлатина', 'Ротавирус'];
const DISEASE_NAMES = ['Грипп', 'Корь', 'Коклюш', 'Паротит', 'Краснуха'];
const MANTOUX_REACTION_TYPES = ['negative', 'positive', 'hyperergic'] as const;
const RISK_GROUP_REASONS = ['Часто болеющие', 'Хронические заболевания', 'Аллергические реакции'];
const TUB_POSITIVE_RESULTS = ['Положительный', 'Отрицательный', 'Сомнительный'];
const HELMINTH_RESULTS = ['Обнаружены', 'Не обнаружены'];
const HELMINTH_EXAM_TYPES = ['Плановое', 'Внеплановое'];


// Helper function to get random integer
function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get random item from an array
function getRandomItem<T extends readonly any[]>(arr: T): T[number] {
    return arr[getRandomInt(0, arr.length - 1)];
}

// Helper function to get start of week (Monday)
function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Helper function to add days to a date
function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

// Configuration for each medical journal
interface JournalConfig<T> {
    name: string;
    model: mongoose.Model<T>;
    type: 'weekly' | 'perChild';
    generateEntryData: (child: IChild, group: IGroup, date: Date) => T;
}

const journalConfigs: JournalConfig<any>[] = [
    {
        name: 'SomaticJournal',
        model: SomaticJournal,
        type: 'weekly',
        generateEntryData: (child: IChild, group: IGroup, date: Date) => {
            const { diagnosis, treatment } = getRandomItem(DIAGNOSES_SOMATIC);
            const illnessDuration = getRandomInt(1, 5);
            const fromDate = date;
            const toDate = addDays(date, illnessDuration - 1);
            return {
                childId: child._id as Types.ObjectId,
                date: date,
                diagnosis: diagnosis,
                fromDate: fromDate,
                toDate: toDate,
                days: illnessDuration,
                notes: `Лечение: ${treatment}`,
                fio: child.fullName,
                groupId: group._id as Types.ObjectId,
            };
        },
    },
    {
        name: 'ContactInfectionJournal',
        model: ContactInfectionJournal,
        type: 'weekly',
        generateEntryData: (child: IChild, group: IGroup, date: Date): IContactInfectionJournalCreate => {
            return {
                childId: child._id as Types.ObjectId,
                date: date,
                infectionType: getRandomItem(INFECTION_TYPES),
                notes: 'Контакт с инфекционным больным',
                fio: child.fullName,
                groupId: group._id as Types.ObjectId,
            };
        },
    },
    {
        name: 'InfectiousDiseasesJournal',
        model: InfectiousDiseasesJournal,
        type: 'weekly',
        generateEntryData: (child: IChild, group: IGroup, date: Date): IInfectiousDiseasesJournalCreate => {
            return {
                childId: child._id as Types.ObjectId,
                date: date,
                disease: getRandomItem(DISEASE_NAMES),
                diagnosis: 'Подтверждено',
                notes: 'Проведены меры профилактики',
                fio: child.fullName,
                groupId: group._id as Types.ObjectId,
            };
        },
    },
    {
        name: 'MantouxJournal',
        model: MantouxJournal,
        type: 'weekly',
        generateEntryData: (child: IChild, group: IGroup, date: Date): IMantouxJournalCreate => {
            const reactionType = getRandomItem(MANTOUX_REACTION_TYPES);
            return {
                childId: child._id as Types.ObjectId,
                date: date,
                reactionSize: getRandomInt(0, 15),
                reactionType: reactionType,
                injectionSite: 'Левое предплечье',
                doctor: new Types.ObjectId(), // Placeholder for a doctor ID
                notes: `Реакция: ${reactionType}`,
                fio: child.fullName,
                groupId: group._id as Types.ObjectId,
            };
        },
    },
    {
        name: 'RiskGroupChild',
        model: RiskGroupChild,
        type: 'weekly',
        generateEntryData: (child: IChild, group: IGroup, date: Date): IRiskGroupChildCreate => {
            return {
                childId: child._id as Types.ObjectId,
                date: date,
                group: 'Динамическое наблюдение',
                reason: getRandomItem(RISK_GROUP_REASONS),
                notes: 'Регулярные осмотры',
                fio: child.fullName,
                groupId: group._id as Types.ObjectId,
            };
        },
    },
    {
        name: 'TubPositiveJournal',
        model: TubPositiveJournal,
        type: 'weekly',
        generateEntryData: (child: IChild, group: IGroup, date: Date): ITubPositiveJournalCreate => {
            return {
                childId: child._id as Types.ObjectId,
                date: date,
                result: getRandomItem(TUB_POSITIVE_RESULTS),
                notes: 'Дополнительное обследование',
                fio: child.fullName,
                groupId: group._id as Types.ObjectId,
            };
        },
    },
    {
        name: 'HelminthJournal',
        model: HelminthJournal,
        type: 'perChild',
        generateEntryData: (child: IChild, group: IGroup, date: Date): IHelminthJournalCreate => {
            return {
                childId: child._id as Types.ObjectId,
                date: date,
                result: getRandomItem(HELMINTH_RESULTS),
                examType: getRandomItem(HELMINTH_EXAM_TYPES),
                notes: 'Профилактика гельминтозов',
                month: (date.getMonth() + 1).toString(),
                year: date.getFullYear().toString(),
                groupId: group._id as Types.ObjectId,
            };
        },
    },
];

async function generateMedicalJournalEntries() {
    console.log('Начинаем генерацию записей в медицинских журналах...');

    try {
        await mongoose.connect(MONGO_URI);
        console.log('Подключение к MongoDB установлено.');

        const allChildren = await Child.find({ active: true }).populate('groupId'); // Populate groupId to get group details
        const allGroups = await Group.find({}); // Fetch all groups

        if (allChildren.length === 0) {
            console.warn('В базе данных нет активных детей. Генерация невозможна.');
            await mongoose.disconnect();
            return;
        }

        if (allGroups.length === 0) {
            console.warn('В базе данных нет групп. Генерация невозможна.');
            await mongoose.disconnect();
            return;
        }

        // Map children by group for easy access
        const childrenByGroup = new Map<string, IChild[]>();
        allChildren.forEach(child => {
            if (child.groupId) { // Ensure groupId exists
                const actualGroupId = (child.groupId instanceof Types.ObjectId)
                    ? child.groupId.toString()
                    : (child.groupId as IGroup)._id.toString();

                if (!childrenByGroup.has(actualGroupId)) {
                    childrenByGroup.set(actualGroupId, []);
                }
                childrenByGroup.get(actualGroupId)?.push(child);
            }
        });


        const startDate = new Date('2026-01-01T00:00:00.000Z');
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        for (const config of journalConfigs) {
            console.log(`\nГенерация записей для журнала: ${config.name}`);
            const entriesToInsert: any[] = []; // Use any[] for now, will cast before insertMany

            if (config.type === 'weekly') {
                let currentWeekStart = getStartOfWeek(startDate);

                while (currentWeekStart <= endDate) {
                    const numEntriesThisWeek = getRandomInt(2, 3);
                    const weekProcessedChildrenIds = new Set<string>(); // Children processed in this week across all groups

                    // Try to generate entries for different groups each week
                    const groupsForThisWeek = [...allGroups];
                    let entriesGeneratedThisWeek = 0;

                    while (entriesGeneratedThisWeek < numEntriesThisWeek && groupsForThisWeek.length > 0) {
                        const randomGroup = getRandomItem(groupsForThisWeek);
                        const childrenInGroup = childrenByGroup.get(randomGroup._id.toString()) || [];

                        // Filter out children already used this week
                        const availableChildrenInGroup = childrenInGroup.filter(
                            c => !weekProcessedChildrenIds.has(c._id.toString())
                        );

                        if (availableChildrenInGroup.length > 0) {
                            const child = getRandomItem(availableChildrenInGroup);
                            const entryDate = addDays(currentWeekStart, getRandomInt(0, 6)); // Random day within the week
                            entryDate.setHours(getRandomInt(8, 17), getRandomInt(0, 59), 0, 0);

                            const entryData = config.generateEntryData(child, randomGroup, entryDate);
                            entriesToInsert.push(entryData);
                            weekProcessedChildrenIds.add(child._id.toString());
                            entriesGeneratedThisWeek++;
                        }
                        // Remove group to avoid picking it again in this while loop iteration
                        groupsForThisWeek.splice(groupsForThisWeek.indexOf(randomGroup), 1);
                    }
                    currentWeekStart = addDays(currentWeekStart, 7);
                }
            } else if (config.type === 'perChild') { // For HelminthJournal
                for (const child of allChildren) {
                    // Determine the actual groupId from the child object, which might be populated
                    let childGroup: IGroup | undefined;
                    if (child.groupId) {
                        const childGroupId: Types.ObjectId = (child.groupId instanceof Types.ObjectId)
                            ? child.groupId
                            : (child.groupId as IGroup)._id as Types.ObjectId;
                        childGroup = allGroups.find(group => group._id.equals(childGroupId));
                    }

                    if (childGroup) {
                        const entryDate = addDays(startDate, getRandomInt(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                        entryDate.setHours(getRandomInt(8, 17), getRandomInt(0, 59), 0, 0);

                        const entryData = config.generateEntryData(child, childGroup, entryDate);
                        entriesToInsert.push(entryData);
                    }
                }
            }

            if (entriesToInsert.length > 0) {
                // Ensure to cast to the specific interface if needed, or rely on model.create
                await config.model.insertMany(entriesToInsert);
                console.log(`Успешно создано ${entriesToInsert.length} записей для ${config.name}`);
            } else {
                console.log(`Не удалось создать ни одной записи для ${config.name}`);
            }
        }

    } catch (error) {
        console.error('Ошибка при генерации записей:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Отключение от MongoDB.');
    }
}

generateMedicalJournalEntries().catch(console.error);