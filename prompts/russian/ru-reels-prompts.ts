import {
    audiencePrompt,
    defaultInfo,
    defaultInformationToSummarize,
    defaultPostReference,
    principlesWriteCut,
    situationPrompt,
    systemPrompt,
    textBodyInstructions,
    titleInstructions,
    vocabularyPrompt,
} from "./ru-system-prompts";

const reelsSpecificInstructions = `<reels-instructions>
Be 100% sure to write in Russian!!

### **Структура ролика**

1. **Заголовок**
2. **Хук**
3. **Призыв**
4. **Решение**

### **Заголовок**
- Важный инсайт — у тебя секунда, чтобы остановить внимание человека и дать ему вескую причину смотреть твой ролик.
- Отличный источник форм заголовков — чужие залетевшие рилзы.
- Если вы хотите делать залетающие ролики – смотреть экспертные рилзы нужно каждый день.
- Заведите себе темник рилзов и обязательно записывайте все идеи, даже бредовые.
- Воспользуйтесь моим списком шаблонов заголовков для рилз.

### **Хук**
- Идет сразу после заголовка.
- Он нужен для того, чтобы "продать" идею просмотра ролика до конца.
    1. Начинаем с фраз.
    2. Дальше просто перефразируем заголовок другими словами.
- **Варианты начала:**
    - "Смотри до конца и..."
    - "Да..."
    - "То есть..."
- **Далее можно использовать фразы:**
    - Узнаешь
    - Получишь
    - Поймешь
    - Научишься
    - Это возможно, и вот как
    - Это легко, и вот как
    - Это реально, и вот как
- ***Пример:***
    - **Заголовок:** Как накачать бизнес за 3 часа?
    - **Хуки:**
        1. Смотри до конца и узнаешь гарантированный способ накачать банки.
        2. Да, накачать банки быстро возможно, и вот как.
        3. То есть не нужно долгие месяцы пропадать в зале, щас дам проверенный способ сделать это быстро.

### **Призыв**
- **На подписку:**
    - "Я – (имя), здесь все про (тема), подписывайся".
- **На рассылку или совместный рилз:**
    - **Важно!** Если вы делаете рилз на рассылку или совместный рилз с блогером или пабликом, то призыв размещаем в конце после блока решения и сразу на целевое действие.
    - **Пример:** Если хочешь во всем разобраться и узнать, как можно прогревать к покупке автоматизированно и без сторис за 30 минут – пиши в комментариях к этому ролику слово "Гайд" и сразу иди проверять запросы в директе, там тебя уже ждет урок.
- **Опционально:** Немного повышает конверсию в подписку.

### **Решение**
- Четкий, лаконичный, интересный и полезный ответ на вопрос, поставленный в заголовке.
- **Ошибки:**
    - "Лить воду".
    - Давать очевидную информацию.
    - Обманывать.

### **Как записывать**
1. По одному предложению.
2. Текст максимум 220 слов.
3. Выкрутить энергию и эмоции на максимум.

## **Шаблоны заголовков для Рилз**
- В это сложно поверить, но + (интересный факт из твоей ниши).
- Почему об этом никто не говорит + (факт, относительно которого заблуждаются).
- Представьте, что + (результат твоих клиентов + за счет какого действия).
- Перестань уже наконец (частая ошибка) и дальше описание ошибки с конкретикой.
- Просто попробуй + (легкий шаг из твоей ниши).
- Неприятная правда о том, что + (трудность на пути к успеху в твоей нише).
- Сейчас я буду разоблачать всех, кто + (заблуждение в твоей нише).
- А ты знал, что + (интересный факт из твоей ниши).
- Сейчас меня возненавидят все, кто + (называем свою нишу), но я расскажу (выдаем секрет).
- Самый простой способ + (действие из твоей ниши).
- Все "за" и "против" + (какого-то действия/метода).
- Никогда не + (популярная ошибка в твоей нише).
- Основное правило (твоей ниши).
- Самое главное в (твоя ниша) – это не (заблуждение).
- Главный инсайт за Х мес (длительность твоего опыта) в (ниша).
- Я решил провести эксперимент (тема), и вот что из этого вышло.
- Возможно, самый полезный совет (ниша).
- Важный принцип, после которого вам станет легче (действие из вашей темы).
- Правда ли, что (истинное или ложное утверждение из вашей темы).
- Это для всех, кто (действие из вашей ниши). Самое главное заблуждение, с которым вы можете столкнуться (заблуждение из вашей ниши).
- Как правильно (действие из вашей ниши).
- Почему одни ..., а другие ... (сравнение результатов в вашей нише).
- Что делать в такой ситуации (из вашей ниши).
- Мой главный инсайт по (действие из вашей ниши).
- Перестань (что-то делать из твоей ниши).

## **Общие инструкции для Рилз**

### **Все, что нужно знать о рилзах**
- Нужно снимать экспертные рилзы.
- В кадре присутствуете вы.
- Из видео зрители понимают, что вы эксперт в том, что вы делаете.
- Зрители понимают, что у них есть запрос на эту информацию.
- Зрители делают целевое действие.
- **Важные составляющие:**
    - Тема, заголовок.
    - Смыслы и контент.
    - Картинка и звук.
- Тема должна быть широкой, но оставаться в рамках вашей ниши или быть околонишевой.
- Она привлекает и вашу целевую аудиторию, и остальных людей, лишь косвенно связанных с вашей нишей.

### **Как выбрать тему, чтобы ролик залетел?**

### **Правило ширины**
- Тема должна быть широкой, но оставаться в рамках вашей ниши или быть околонишевой.
- Широкая тема – это тема, которая заинтересует большое количество аудитории.
- **Примеры:**
    - **Узкая тема (не зайдет):** "Как мастеру перманента найти себе клиентов".
    - **Средняя тема (может залететь):** "Как привлечь 10 клиентов бьюти-мастеру за 1 час".
    - **Широкая тема (скорее всего, залетит):** "ТОП-5 ужасных примеров, как не нужно делать перманент" (интересно и мастерам, и клиентам, и широкой аудитории).

### **Правило сохраняемости**
- Тематика ролика должна быть такой, чтобы его хотелось сохранить себе, отправить кому-то или оставить комментарии.
- Реакции на ролик сообщают Instagram, что контент интересный.
- **Примеры:**
    - "Как выбрать темы для Рилза?" (менее вероятно к сохранению).
    - "15 крутых идей для Рилза" (более вероятно к сохранению).

### **Правило досматриваемости**
- Чем больше досматривают ролик – тем вероятнее он залетит.
- По опыту, в среднем ролики смотрят от 14 до 40 секунд.
- **Чем короче ролик – тем выше % досматриваемости.**
- **Совет:** Можно сделать ролик на 30 секунд с заголовком, а основной контент разместить в описании.

### **Правило скандальности**
- Тема ролика должна быть интересной, захватывать внимание.
- Нам интересно то, что можно применить в своей жизни сейчас или в будущем.
- **В ролике должна быть:**
    - Новая информация.
    - Старая информация, поданная по-новому.
    - Новый взгляд на общепринятую и доступную информацию.

Не надо добавлять всякие лишние инстркуции по записи, пиши только скрипт и его структуру (где хук, заголовок, призыв, решение и тп)

В конце давай добавим второй скрипт по рилсу в чуть другой структуре: 
1. Заголовок который бьет в боль
2. Причина боли
3. Решение 
4. И какую выгоду он получит от этого решение

</reels-instructions>`;

interface PromptOptions {
  includeSystem?: boolean;
  includeAudience?: boolean;
  includeVocabulary?: boolean;
  includeSituation?: boolean;
  includeTitle?: boolean;
  includeTextBody?: boolean;
  includePrinciples?: boolean;
  includeReelsSpecific?: boolean;
  includeDefaultInfo?: boolean;
  includeDefaultSummary?: boolean;
  includeDefaultReference?: boolean;
}

export function buildReelsPrompt(options: PromptOptions = {}): string {
  const {
    includeSystem = true,
    includeAudience = false,
    includeVocabulary = false,
    includeSituation = true,
    includeTitle = false,
    includeTextBody = false,
    includePrinciples = true,
    includeReelsSpecific = true,
    includeDefaultInfo = true,
    includeDefaultSummary = true,
    includeDefaultReference = true,
  } = options;

  return [
    includeSystem && systemPrompt,
    includeAudience && audiencePrompt,
    includeVocabulary && vocabularyPrompt,
    includeSituation && situationPrompt,
    includeTitle && titleInstructions,
    includeTextBody && textBodyInstructions,
    includePrinciples && principlesWriteCut,
    includeReelsSpecific && reelsSpecificInstructions,
    includeDefaultInfo && defaultInfo,
    includeDefaultSummary && defaultInformationToSummarize,
    includeDefaultReference && defaultPostReference,
  ]
    .filter(Boolean)
    .join('\n');
}

// For backward compatibility
export const reelsPrompt = buildReelsPrompt();