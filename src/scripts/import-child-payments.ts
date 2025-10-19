import mongoose from "mongoose";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import Child from "../entities/children/model";
import User from "../entities/users/model";
import ChildPayment from "../entities/childPayment/model";
import Group from "../entities/groups/model"; // 👈 добавил импорт модели групп

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/yourdb";
const EXCEL_FILE = path.join(__dirname, "../../Октябрь.xlsx");
const LOG_FILE = path.join(__dirname, "import-log.txt");

// 👇 нормализуем строки (для сравнения)
const normalize = (str?: string): string =>
  (str || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[’'`]/g, "")
    .toLowerCase();

(async () => {
  const logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });
  const log = (msg: string) => {
    console.log(msg);
    logStream.write(`[${new Date().toISOString()}] ${msg}\n`);
  };

  try {
    await mongoose.connect(MONGO_URI);
    log("✅ Подключение к MongoDB установлено.");

    // Загружаем Excel-файл
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(6); // пропускаем первые 6 строк

    // Загружаем все сущности
    const [children, users, groups] = await Promise.all([
      Child.find(),
      User.find(),
      Group.find(),
    ]);

    const created: string[] = [];
    const skipped: string[] = [];

    for (const row of data) {
      const [
        name,
        location,
        department, // 👈 колонка "Отдел"
        position,
        period,
        salary,
        bonuses,
        deductions,
        taxesWorker,
        taxesEmployer,
        loan,
        netSalary,
        companyCost,
      ] = row as string[];

      if (!name || typeof name !== "string" || name.trim() === "") continue;

      const normalizedName = normalize(name);
      const normalizedDept = normalize(department);

      // Определяем, ребёнок это или сотрудник
      const isChild = /воспитан|ребен|ребён|child/i.test(position || "");

      // Ищем человека по имени
      const match = isChild
        ? children.find((c) => {
            const dbName = normalize(c.fullName);
            return (
              dbName === normalizedName ||
              dbName.startsWith(normalizedName) ||
              normalizedName.startsWith(dbName)
            );
          })
        : users.find((u) => {
            const dbName = normalize(u.fullName);
            return (
              dbName === normalizedName ||
              dbName.startsWith(normalizedName) ||
              normalizedName.startsWith(dbName)
            );
          });

      if (!match) {
        skipped.push(`${name} (${isChild ? "ребёнок" : "сотрудник"})`);
        log(`⚠️ Не найден в базе: ${name}`);
        continue;
      }

      // 👇 Поиск группы (сравниваем "Отдел" из Excel и имя группы из базы)
      const matchedGroup = groups.find(
        (g) =>
          normalize(g.name) === normalizedDept ||
          normalize(g.name).startsWith(normalizedDept) ||
          normalizedDept.startsWith(normalize(g.name))
      );

      // Создаём платеж
      await ChildPayment.create({
        childId: isChild ? match._id : undefined,
        userId: isChild ? undefined : match._id,
        groupId: matchedGroup ? matchedGroup._id : match.groupId || undefined, // 👈 приоритет группе из Excel
        period: period || "Октябрь 2025",
        amount: Number(salary) || 0,
        total: Number(netSalary) || 0,
        status: "active",
        latePenalties: Number(taxesWorker) || 0,
        absencePenalties: Number(taxesEmployer) || 0,
        penalties: Number(deductions) || 0,
        accruals: Number(bonuses) || 0,
        paidAmount: Number(companyCost) || 0,
      });

      created.push(match.fullName);
      log(
        `✅ Добавлено: ${match.fullName} (${isChild ? "ребёнок" : "сотрудник"}), группа: ${
          matchedGroup ? matchedGroup.name : "❌ не найдена"
        }`
      );
    }

    // Статистика
    log("\n=== 📊 Итог ===");
    log(`Всего строк в файле: ${data.length}`);
    log(`Создано платежей: ${created.length}`);
    log(`Пропущено: ${skipped.length}`);

    if (skipped.length > 0) {
      log("\n⚠️ Не найдены:");
      skipped.forEach((s) => log(` - ${s}`));
    }

    log("✅ Импорт завершён.");
  } catch (err) {
    console.error("❌ Ошибка импорта:", err);
  } finally {
    await mongoose.disconnect();
    log("🔌 Соединение с MongoDB закрыто.");
  }
})();
