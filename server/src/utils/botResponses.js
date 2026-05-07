export const getBotResponse = (text) => {
    const msg = text.toLowerCase();

    if (msg.includes("цена") || msg.includes("стоимость")) {
        return "Стоимость смены начинается от 25 000 рублей.";
    }

    if (msg.includes("сколько дней") || msg.includes("длительность")) {
        return "Смена длится 14 дней.";
    }

    if (msg.includes("возраст")) {
        return "Мы принимаем детей от 7 до 17 лет.";
    }

    if (msg.includes("еда") || msg.includes("питание")) {
        return "Питание 5-разовое, сбалансированное.";
    }

    if (msg.includes("врач") || msg.includes("здоровье")) {
        return "На территории лагеря круглосуточно работает медицинский персонал.";
    }

    if (msg.includes("где") || msg.includes("расположение")) {
        return "Лагерь находится за городом, в экологически чистой зоне.";
    }

    if (msg.includes("смены")) {
        return "У нас есть летние, зимние и тематические смены.";
    }

    if (msg.includes("админ") || msg.includes("человек")) {
        return "Сейчас подключим администратора, подождите...";
    }

    return "Я бот 🤖 Напишите «админ», чтобы связаться с человеком.";
};