
export const Recipes: Record<string, { name: string; quantity: number; unit: string; category?: string }[]> = {
    // --- ЗАВТРАК (Breakfast) ---
    "Каша молочная Дружба": [
        { name: "Рис", quantity: 20, unit: "г", category: "Бакалея" },
        { name: "Пшено", quantity: 20, unit: "г", category: "Бакалея" },
        { name: "Молоко", quantity: 100, unit: "мл", category: "Молочные продукты" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" },
        { name: "Сахар", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Соль", quantity: 1, unit: "г", category: "Бакалея" }
    ],
    "Каша молочная геркулесовая": [
        { name: "Хлопья овсяные (Геркулес)", quantity: 40, unit: "г", category: "Бакалея" },
        { name: "Молоко", quantity: 150, unit: "мл", category: "Молочные продукты" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" },
        { name: "Сахар", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Соль", quantity: 1, unit: "г", category: "Бакалея" }
    ],
    "Каша молочная гречневая": [
        { name: "Крупа гречневая", quantity: 40, unit: "г", category: "Бакалея" },
        { name: "Молоко", quantity: 150, unit: "мл", category: "Молочные продукты" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" },
        { name: "Сахар", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Соль", quantity: 1, unit: "г", category: "Бакалея" }
    ],
    "Каша молочная кукурузная": [
        { name: "Крупа кукурузная", quantity: 40, unit: "г", category: "Бакалея" },
        { name: "Молоко", quantity: 150, unit: "мл", category: "Молочные продукты" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" },
        { name: "Сахар", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Соль", quantity: 1, unit: "г", category: "Бакалея" }
    ],
    "Каша молочная манная": [
        { name: "Крупа манная", quantity: 30, unit: "г", category: "Бакалея" },
        { name: "Молоко", quantity: 150, unit: "мл", category: "Молочные продукты" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" },
        { name: "Сахар", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Соль", quantity: 1, unit: "г", category: "Бакалея" }
    ],
    "Каша молочная пшеничная": [
        { name: "Крупа пшеничная", quantity: 40, unit: "г", category: "Бакалея" },
        { name: "Молоко", quantity: 150, unit: "мл", category: "Молочные продукты" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" },
        { name: "Сахар", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Соль", quantity: 1, unit: "г", category: "Бакалея" }
    ],
    "Каша молочная пшенная": [
        { name: "Пшено", quantity: 40, unit: "г", category: "Бакалея" },
        { name: "Молоко", quantity: 150, unit: "мл", category: "Молочные продукты" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" },
        { name: "Сахар", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Соль", quantity: 1, unit: "г", category: "Бакалея" }
    ],
    "Каша молочная пшенная с тыквой": [
        { name: "Пшено", quantity: 30, unit: "г", category: "Бакалея" },
        { name: "Тыква", quantity: 50, unit: "г", category: "Овощи" },
        { name: "Молоко", quantity: 100, unit: "мл", category: "Молочные продукты" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" },
        { name: "Сахар", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Соль", quantity: 1, unit: "г", category: "Бакалея" }
    ],
    "Каша молочная рисовая": [
        { name: "Рис", quantity: 35, unit: "г", category: "Бакалея" },
        { name: "Молоко", quantity: 150, unit: "мл", category: "Молочные продукты" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" },
        { name: "Сахар", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Соль", quantity: 1, unit: "г", category: "Бакалея" }
    ],
    "Каша молочная ячневая": [
        { name: "Крупа ячневая", quantity: 40, unit: "г", category: "Бакалея" },
        { name: "Молоко", quantity: 150, unit: "мл", category: "Молочные продукты" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" },
        { name: "Сахар", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Соль", quantity: 1, unit: "г", category: "Бакалея" }
    ],
    "Какао на молоке": [
        { name: "Какао-порошок", quantity: 4, unit: "г", category: "Бакалея" },
        { name: "Молоко", quantity: 150, unit: "мл", category: "Молочные продукты" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" }
    ],
    "Молоко": [
        { name: "Молоко", quantity: 200, unit: "мл", category: "Молочные продукты" }
    ],
    "Свежие фрукты": [
        { name: "Яблоко", quantity: 100, unit: "г", category: "Фрукты" } // Типовой фрукт
    ],

    // --- ОБЕД (Lunch) - Первые блюда ---
    "Борщ на костном бульоне": [
        { name: "Говядина на кости", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Свекла", quantity: 30, unit: "г", category: "Овощи" },
        { name: "Капуста белокочанная", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Картофель", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Томатная паста", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" },
        { name: "Сметана", quantity: 10, unit: "г", category: "Молочные продукты" }
    ],
    "Рассольник на костном бульоне": [
        { name: "Говядина на кости", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Огурцы соленые", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Картофель", quantity: 30, unit: "г", category: "Овощи" },
        { name: "Крупа перловая", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" },
        { name: "Сметана", quantity: 10, unit: "г", category: "Молочные продукты" }
    ],
    "Щи на костном бульоне": [
        { name: "Говядина на кости", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Капуста белокочанная", quantity: 40, unit: "г", category: "Овощи" },
        { name: "Картофель", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" },
        { name: "Сметана", quantity: 10, unit: "г", category: "Молочные продукты" }
    ],
    "Суп Домашняя лапша на курином бульоне": [
        { name: "Курица (тушка)", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Лапша домашняя", quantity: 20, unit: "г", category: "Бакалея" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" }
    ],
    "Суп Кеспе на курином бульоне": [ // Аналог лапши
        { name: "Курица (тушка)", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Лапша (кеспе)", quantity: 20, unit: "г", category: "Бакалея" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" }
    ],
    "Суп Свекольник на костном бульоне со сметаной": [
        { name: "Говядина на кости", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Свекла", quantity: 40, unit: "г", category: "Овощи" },
        { name: "Картофель", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Сметана", quantity: 10, unit: "г", category: "Молочные продукты" }
    ],
    "Суп Чечевичный на костном бульоне": [
        { name: "Говядина на кости", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Чечевица", quantity: 25, unit: "г", category: "Бакалея" },
        { name: "Картофель", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" }
    ],
    "Суп гороховый на костном бульоне": [
        { name: "Говядина на кости", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Горох", quantity: 25, unit: "г", category: "Бакалея" },
        { name: "Картофель", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" }
    ],
    "Суп картофельный на курином бульоне со сметаной": [
        { name: "Курица (тушка)", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Картофель", quantity: 50, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Сметана", quantity: 10, unit: "г", category: "Молочные продукты" }
    ],
    "Суп овощной на курином бульоне": [
        { name: "Курица (тушка)", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Картофель", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Капуста белокочанная", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Зеленый горошек (консерв)", quantity: 10, unit: "г", category: "Бакалея" }
    ],
    "Суп пшенный на курином бульоне": [
        { name: "Курица (тушка)", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Пшено", quantity: 20, unit: "г", category: "Бакалея" },
        { name: "Картофель", quantity: 30, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" }
    ],
    "Суп с клецками на курином бульоне": [
        { name: "Курица (тушка)", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Мука пшеничная", quantity: 15, unit: "г", category: "Бакалея" },
        { name: "Яйцо куриное", quantity: 0.1, unit: "шт", category: "Яйца" }, // Часть яйца
        { name: "Картофель", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" }
    ],
    "Суп фасолевый на костном бульоне": [
        { name: "Говядина на кости", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Фасоль", quantity: 25, unit: "г", category: "Бакалея" },
        { name: "Картофель", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" }
    ],
    "Мампар на курином бульоне": [
        { name: "Курица (тушка)", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Мука пшеничная", quantity: 20, unit: "г", category: "Бакалея" }, // Тесто
        { name: "Картофель", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Томатная паста", quantity: 5, unit: "г", category: "Бакалея" }
    ],

    // --- ОБЕД (Lunch) - Вторые блюда ---
    "Бешбармак": [
        { name: "Говядина", quantity: 80, unit: "г", category: "Мясо" },
        { name: "Мука пшеничная", quantity: 40, unit: "г", category: "Бакалея" },
        { name: "Яйцо куриное", quantity: 0.1, unit: "шт", category: "Яйца" },
        { name: "Лук репчатый", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Картофель", quantity: 30, unit: "г", category: "Овощи" } // Иногда добавляют
    ],
    "Гуляш мясной": [
        { name: "Говядина", quantity: 70, unit: "г", category: "Мясо" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Томатная паста", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Мука пшеничная", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" }
    ],
    "Зразы с яйцом": [
        { name: "Говядина (фарш)", quantity: 60, unit: "г", category: "Мясо" },
        { name: "Хлеб пшеничный", quantity: 10, unit: "г", category: "Хлеб" },
        { name: "Яйцо куриное", quantity: 0.3, unit: "шт", category: "Яйца" }, // Начинка + в фарш
        { name: "Лук репчатый", quantity: 5, unit: "г", category: "Овощи" }
    ],
    "Котлета куриная": [
        { name: "Куриное филе", quantity: 70, unit: "г", category: "Мясо" },
        { name: "Хлеб пшеничный", quantity: 15, unit: "г", category: "Хлеб" },
        { name: "Молоко", quantity: 15, unit: "мл", category: "Молочные продукты" },
        { name: "Лук репчатый", quantity: 5, unit: "г", category: "Овощи" },
        { name: "Сухари панировочные", quantity: 5, unit: "г", category: "Бакалея" }
    ],
    "Куриный гуляш": [
        { name: "Куриное филе", quantity: 70, unit: "г", category: "Мясо" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Томатная паста", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" }
    ],
    "Курица запеченная с овощами": [
        { name: "Курица (части)", quantity: 80, unit: "г", category: "Мясо" },
        { name: "Картофель", quantity: 50, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Кабачки", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" }
    ],
    "Курица с запеченным картофелем": [
        { name: "Курица (части)", quantity: 80, unit: "г", category: "Мясо" },
        { name: "Картофель", quantity: 100, unit: "г", category: "Овощи" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" }
    ],
    "Курица с тушеными овощами": [
        { name: "Курица (части)", quantity: 80, unit: "г", category: "Мясо" },
        { name: "Капуста белокочанная", quantity: 50, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Томатная паста", quantity: 5, unit: "г", category: "Бакалея" }
    ],
    "Курица тушенная": [
        { name: "Курица (части)", quantity: 90, unit: "г", category: "Мясо" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Сметана", quantity: 10, unit: "г", category: "Молочные продукты" }
    ],
    "Куырдак с мясом": [
        { name: "Говядина", quantity: 70, unit: "г", category: "Мясо" },
        { name: "Картофель", quantity: 80, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 15, unit: "г", category: "Овощи" },
        { name: "Масло растительное", quantity: 10, unit: "мл", category: "Бакалея" }
    ],
    "Плов из индейки": [
        { name: "Филе индейки", quantity: 60, unit: "г", category: "Мясо" },
        { name: "Рис", quantity: 40, unit: "г", category: "Бакалея" },
        { name: "Морковь", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 15, unit: "г", category: "Овощи" },
        { name: "Масло растительное", quantity: 10, unit: "мл", category: "Бакалея" }
    ],
    "Плов с курицей": [
        { name: "Куриное филе", quantity: 60, unit: "г", category: "Мясо" },
        { name: "Рис", quantity: 40, unit: "г", category: "Бакалея" },
        { name: "Морковь", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 15, unit: "г", category: "Овощи" },
        { name: "Масло растительное", quantity: 10, unit: "мл", category: "Бакалея" }
    ],
    "Плов с мясом": [
        { name: "Говядина", quantity: 60, unit: "г", category: "Мясо" },
        { name: "Рис", quantity: 40, unit: "г", category: "Бакалея" },
        { name: "Морковь", quantity: 25, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 15, unit: "г", category: "Овощи" },
        { name: "Масло растительное", quantity: 10, unit: "мл", category: "Бакалея" }
    ],
    "Рыба запеченная": [
        { name: "Рыба (филе)", quantity: 90, unit: "г", category: "Рыба" },
        { name: "Сметана", quantity: 10, unit: "г", category: "Молочные продукты" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" },
        { name: "Сыр твердый", quantity: 5, unit: "г", category: "Молочные продукты" }
    ],
    "Рыба по польски с картофельным пюре": [
        { name: "Рыба (филе)", quantity: 80, unit: "г", category: "Рыба" },
        { name: "Яйцо куриное", quantity: 0.25, unit: "шт", category: "Яйца" }, // В соус
        { name: "Масло сливочное", quantity: 10, unit: "г", category: "Молочные продукты" },
        { name: "Картофель", quantity: 120, unit: "г", category: "Овощи" }, // Пюре
        { name: "Молоко", quantity: 20, unit: "мл", category: "Молочные продукты" } // Пюре
    ],
    "Рыба тушенная": [
        { name: "Рыба (филе)", quantity: 90, unit: "г", category: "Рыба" },
        { name: "Морковь", quantity: 15, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Томатная паста", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" }
    ],
    "Тефтели мясные": [
        { name: "Говядина (фарш)", quantity: 60, unit: "г", category: "Мясо" },
        { name: "Рис", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Томатная паста", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Сметана", quantity: 5, unit: "г", category: "Молочные продукты" },
        { name: "Мука пшеничная", quantity: 5, unit: "г", category: "Бакалея" }
    ],

    // --- УЖИН (Dinner) ---
    "Жаркое по домашнему": [
        { name: "Говядина", quantity: 60, unit: "г", category: "Мясо" },
        { name: "Картофель", quantity: 100, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Томатная паста", quantity: 3, unit: "г", category: "Бакалея" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" }
    ],
    "Капуста тушенная": [
        { name: "Капуста белокочанная", quantity: 150, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Томатная паста", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Масло растительное", quantity: 10, unit: "мл", category: "Бакалея" }
    ],
    "Картофельное пюре": [
        { name: "Картофель", quantity: 150, unit: "г", category: "Овощи" },
        { name: "Молоко", quantity: 30, unit: "мл", category: "Молочные продукты" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" }
    ],
    "Картофельный рулет с мясным фаршем": [
        { name: "Картофель", quantity: 100, unit: "г", category: "Овощи" },
        { name: "Говядина (фарш)", quantity: 40, unit: "г", category: "Мясо" },
        { name: "Яйцо куриное", quantity: 0.1, unit: "шт", category: "Яйца" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" }
    ],
    "Кисломолочный продукт": [
        { name: "Кефир", quantity: 180, unit: "мл", category: "Молочные продукты" }
    ],
    "Компот из сухофруктов": [
        { name: "Сухофрукты (смесь)", quantity: 20, unit: "г", category: "Бакалея" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Вода", quantity: 180, unit: "мл", category: "Бакалея" }
    ],
    "Компот из шиповника": [ // Напиток из плодов шиповника
        { name: "Шиповник сушеный", quantity: 15, unit: "г", category: "Бакалея" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Вода", quantity: 180, unit: "мл", category: "Бакалея" }
    ],
    "Напиток из плодов шиповника": [
        { name: "Шиповник сушеный", quantity: 15, unit: "г", category: "Бакалея" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Вода", quantity: 180, unit: "мл", category: "Бакалея" }
    ],
    "Кулебяка с овощами": [ // Пирог
        { name: "Мука пшеничная", quantity: 50, unit: "г", category: "Бакалея" },
        { name: "Капуста белокочанная", quantity: 50, unit: "г", category: "Овощи" }, // Начинка
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Яйцо куриное", quantity: 0.1, unit: "шт", category: "Яйца" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" }
    ],
    "Ленивые голубцы": [
        { name: "Говядина (фарш)", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Капуста белокочанная", quantity: 60, unit: "г", category: "Овощи" },
        { name: "Рис", quantity: 15, unit: "г", category: "Бакалея" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Сметана", quantity: 10, unit: "г", category: "Молочные продукты" },
        { name: "Томатная паста", quantity: 5, unit: "г", category: "Бакалея" }
    ],
    "Лимонный напиток": [ // Вода с лимоном
        { name: "Лимон", quantity: 5, unit: "г", category: "Фрукты" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Вода", quantity: 180, unit: "мл", category: "Бакалея" }
    ],
    "Макароны отварные": [
        { name: "Макаронные изделия", quantity: 50, unit: "г", category: "Бакалея" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" }
    ],
    "Макароны отварные с тертым сыром": [
        { name: "Макаронные изделия", quantity: 50, unit: "г", category: "Бакалея" },
        { name: "Сыр твердый", quantity: 10, unit: "г", category: "Молочные продукты" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" }
    ],
    "Молочный соус": [
        { name: "Молоко", quantity: 30, unit: "мл", category: "Молочные продукты" },
        { name: "Мука пшеничная", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" }
    ],
    "Сметанный соус": [
        { name: "Сметана", quantity: 30, unit: "г", category: "Молочные продукты" },
        { name: "Мука пшеничная", quantity: 5, unit: "г", category: "Бакалея" }
    ],
    "Фруктовый соус": [ // Подлива сладкая
        { name: "Повидло/Джем", quantity: 20, unit: "г", category: "Бакалея" },
        { name: "Крахмал", quantity: 3, unit: "г", category: "Бакалея" },
        { name: "Вода", quantity: 30, unit: "мл", category: "Бакалея" }
    ],
    "Мясная котлета": [
        { name: "Говядина (фарш)", quantity: 60, unit: "г", category: "Мясо" },
        { name: "Хлеб пшеничный", quantity: 12, unit: "г", category: "Хлеб" },
        { name: "Лук репчатый", quantity: 6, unit: "г", category: "Овощи" },
        { name: "Сухари панировочные", quantity: 5, unit: "г", category: "Бакалея" }
    ],
    "Мясные биточки": [ // По сути тоже самое
        { name: "Говядина (фарш)", quantity: 60, unit: "г", category: "Мясо" },
        { name: "Хлеб пшеничный", quantity: 12, unit: "г", category: "Хлеб" },
        { name: "Лук репчатый", quantity: 6, unit: "г", category: "Овощи" }
    ],
    "Овощное рагу": [
        { name: "Картофель", quantity: 50, unit: "г", category: "Овощи" },
        { name: "Капуста белокочанная", quantity: 40, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Кабачки", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Масло растительное", quantity: 10, unit: "мл", category: "Бакалея" }
    ],
    "Омлет": [
        { name: "Яйцо куриное", quantity: 1.5, unit: "шт", category: "Яйца" },
        { name: "Молоко", quantity: 50, unit: "мл", category: "Молочные продукты" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" }
    ],
    "Омлет салат из фасоли и капусты": [ // Вероятно, гарнир + омлет? Разделим по логике, если это одно блюдо
        { name: "Яйцо куриное", quantity: 1, unit: "шт", category: "Яйца" },
        { name: "Молоко", quantity: 40, unit: "мл", category: "Молочные продукты" },
        { name: "Фасоль", quantity: 30, unit: "г", category: "Бакалея" },
        { name: "Капуста белокочанная", quantity: 30, unit: "г", category: "Овощи" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" }
    ],
    "Орама нан с мясом": [ // Рулет на пару
        { name: "Говядина (фарш)", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Мука пшеничная", quantity: 50, unit: "г", category: "Бакалея" },
        { name: "Лук репчатый", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Картофель", quantity: 20, unit: "г", category: "Овощи" }, // Часто добавляют
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" }
    ],
    "Отварная гречка": [
        { name: "Крупа гречневая", quantity: 50, unit: "г", category: "Бакалея" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" }
    ],
    "Отварной рис": [
        { name: "Рис", quantity: 50, unit: "г", category: "Бакалея" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" }
    ],
    "Пирог с овощами": [
        { name: "Мука пшеничная", quantity: 60, unit: "г", category: "Бакалея" },
        { name: "Капуста белокочанная", quantity: 50, unit: "г", category: "Овощи" },
        { name: "Яйцо куриное", quantity: 0.2, unit: "шт", category: "Яйца" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" }
    ],
    "Рыбная запеканка": [
        { name: "Рыба (филе)", quantity: 80, unit: "г", category: "Рыба" },
        { name: "Картофель", quantity: 50, unit: "г", category: "Овощи" },
        { name: "Яйцо куриное", quantity: 0.2, unit: "шт", category: "Яйца" },
        { name: "Сметана", quantity: 10, unit: "г", category: "Молочные продукты" }
    ],
    "Рыбные биточки": [
        { name: "Рыба (филе)", quantity: 70, unit: "г", category: "Рыба" },
        { name: "Хлеб пшеничный", quantity: 15, unit: "г", category: "Хлеб" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Яйцо куриное", quantity: 0.1, unit: "шт", category: "Яйца" }
    ],
    "Рыбные котлеты": [
        { name: "Рыба (филе)", quantity: 70, unit: "г", category: "Рыба" },
        { name: "Хлеб пшеничный", quantity: 15, unit: "г", category: "Хлеб" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Сухари панировочные", quantity: 5, unit: "г", category: "Бакалея" }
    ],
    "Рыбные тефтели": [
        { name: "Рыба (филе)", quantity: 70, unit: "г", category: "Рыба" },
        { name: "Рис", quantity: 15, unit: "г", category: "Бакалея" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Томатная паста", quantity: 5, unit: "г", category: "Бакалея" }
    ],
    "Салат": [ // Обобщенный
        { name: "Огурцы свежие", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Помидоры", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" }
    ],
    "Салат из свежих овощей": [
        { name: "Огурцы свежие", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Помидоры", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" }
    ],
    "Салат из тертой моркови": [
        { name: "Морковь", quantity: 40, unit: "г", category: "Овощи" },
        { name: "Сахар", quantity: 3, unit: "г", category: "Бакалея" },
        { name: "Масло растительное", quantity: 3, unit: "мл", category: "Бакалея" }
    ],
    "Салат морковный": [ // То же самое
        { name: "Морковь", quantity: 40, unit: "г", category: "Овощи" },
        { name: "Сахар", quantity: 3, unit: "г", category: "Бакалея" },
        { name: "Масло растительное", quantity: 3, unit: "мл", category: "Бакалея" }
    ],
    "Свекла тушенная": [
        { name: "Свекла", quantity: 120, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Томатная паста", quantity: 5, unit: "г", category: "Бакалея" },
        { name: "Масло растительное", quantity: 10, unit: "мл", category: "Бакалея" }
    ],
    "Творожная запеканка": [
        { name: "Творог", quantity: 100, unit: "г", category: "Молочные продукты" },
        { name: "Крупа манная", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Яйцо куриное", quantity: 0.2, unit: "шт", category: "Яйца" },
        { name: "Сметана", quantity: 5, unit: "г", category: "Молочные продукты" }
    ],
    "Творожно морковная запеканка": [
        { name: "Творог", quantity: 80, unit: "г", category: "Молочные продукты" },
        { name: "Морковь", quantity: 30, unit: "г", category: "Овощи" },
        { name: "Крупа манная", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Яйцо куриное", quantity: 0.2, unit: "шт", category: "Яйца" }
    ],
    "Творожно яблочная запеканка": [
        { name: "Творог", quantity: 80, unit: "г", category: "Молочные продукты" },
        { name: "Яблоко", quantity: 30, unit: "г", category: "Фрукты" },
        { name: "Крупа манная", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Яйцо куриное", quantity: 0.2, unit: "шт", category: "Яйца" }
    ],
    "Творожные сырники": [
        { name: "Творог", quantity: 100, unit: "г", category: "Молочные продукты" },
        { name: "Мука пшеничная", quantity: 15, unit: "г", category: "Бакалея" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Яйцо куриное", quantity: 0.2, unit: "шт", category: "Яйца" },
        { name: "Масло растительное", quantity: 5, unit: "мл", category: "Бакалея" }
    ],
    "Творожный крупеник": [ // С крупой, обычно гречка или пшено
        { name: "Творог", quantity: 80, unit: "г", category: "Молочные продукты" },
        { name: "Крупа гречневая", quantity: 30, unit: "г", category: "Бакалея" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Яйцо куриное", quantity: 0.2, unit: "шт", category: "Яйца" }
    ],
    "Творожный пудинг": [
        { name: "Творог", quantity: 100, unit: "г", category: "Молочные продукты" },
        { name: "Крупа манная", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Сахар", quantity: 15, unit: "г", category: "Бакалея" },
        { name: "Яйцо куриное", quantity: 0.2, unit: "шт", category: "Яйца" },
        { name: "Изюм", quantity: 5, unit: "г", category: "Бакалея" }
    ],
    "Фаршированные перчики с мясом": [
        { name: "Перец сладкий", quantity: 80, unit: "г", category: "Овощи" },
        { name: "Говядина (фарш)", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Рис", quantity: 15, unit: "г", category: "Бакалея" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Томатная паста", quantity: 5, unit: "г", category: "Бакалея" }
    ],
    "Чай зеленый": [
        { name: "Чай зеленый (сухой)", quantity: 1, unit: "г", category: "Бакалея" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Вода", quantity: 200, unit: "мл", category: "Бакалея" }
    ],
    "Чай каркаде": [
        { name: "Чай каркаде (сухой)", quantity: 2, unit: "г", category: "Бакалея" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Вода", quantity: 200, unit: "мл", category: "Бакалея" }
    ],
    "Чай с лимоном": [
        { name: "Чай черный (сухой)", quantity: 1, unit: "г", category: "Бакалея" },
        { name: "Лимон", quantity: 5, unit: "г", category: "Фрукты" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Вода", quantity: 200, unit: "мл", category: "Бакалея" }
    ],
    "Чай сладкий": [
        { name: "Чай черный (сухой)", quantity: 1, unit: "г", category: "Бакалея" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Вода", quantity: 200, unit: "мл", category: "Бакалея" }
    ],
    "Чай фруктовый": [
        { name: "Чай фруктовый (смесь)", quantity: 2, unit: "г", category: "Бакалея" },
        { name: "Сахар", quantity: 10, unit: "г", category: "Бакалея" },
        { name: "Вода", quantity: 200, unit: "мл", category: "Бакалея" }
    ],
    "Яйцо отварное": [
        { name: "Яйцо куриное", quantity: 1, unit: "шт", category: "Яйца" }
    ],

    // --- ПЕРЕКУС (Snack) ---
    "Печенье": [
        { name: "Печенье", quantity: 30, unit: "г", category: "Сладости" }
    ],
    "Сушки": [
        { name: "Сушки/Баранки", quantity: 20, unit: "г", category: "Хлеб" }
    ],
    "Суп рисовый на курином бульоне со сметаной": [
        { name: "Курица (тушка)", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Рис", quantity: 15, unit: "г", category: "Бакалея" },
        { name: "Картофель", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Сметана", quantity: 10, unit: "г", category: "Молочные продукты" }
    ],
    "Бигус с курицей": [
        { name: "Курица (тушка)", quantity: 70, unit: "г", category: "Мясо" },
        { name: "Капуста белокочанная", quantity: 100, unit: "г", category: "Овощи" },
        { name: "Картофель", quantity: 30, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Томатная паста", quantity: 5, unit: "г", category: "Бакалея" }
    ],
    "Маш шурпа на костном бульоне": [
        { name: "Говядина на кости", quantity: 50, unit: "г", category: "Мясо" },
        { name: "Маш", quantity: 15, unit: "г", category: "Бакалея" },
        { name: "Картофель", quantity: 20, unit: "г", category: "Овощи" },
        { name: "Морковь", quantity: 10, unit: "г", category: "Овощи" },
        { name: "Лук репчатый", quantity: 10, unit: "г", category: "Овощи" }
    ],
    "Суп вермишелевый молочный": [
        { name: "Молоко", quantity: 150, unit: "мл", category: "Молочные продукты" },
        { name: "Вермишель", quantity: 20, unit: "г", category: "Бакалея" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" },
        { name: "Сахар", quantity: 5, unit: "г", category: "Бакалея" }
    ],
    "Хлеб пшеничный": [
        { name: "Хлеб пшеничный", quantity: 30, unit: "г", category: "Хлеб" }
    ],
    "Хлеб ржаной": [
        { name: "Хлеб ржаной", quantity: 30, unit: "г", category: "Хлеб" }
    ],
    "Хлеб с маслом": [
        { name: "Хлеб пшеничный", quantity: 30, unit: "г", category: "Хлеб" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" }
    ],
    "Хлеб с маслом с сыром": [
        { name: "Хлеб пшеничный", quantity: 30, unit: "г", category: "Хлеб" },
        { name: "Масло сливочное", quantity: 5, unit: "г", category: "Молочные продукты" },
        { name: "Сыр твердый", quantity: 10, unit: "г", category: "Молочные продукты" }
    ]
};
