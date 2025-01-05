export const systemPrompt = `<system-prompt>
situation [may be absent]  - this information should not be mentioned directly in the post. It's for your general context
info [may be absent] - general information for the post you need to write, includes in the very beginning the instructions of what exactly needs to be done with this information. 
information-to-summarize [may be absent] - write a summary of the information in this section for a viral post. Continue to follow all other instructions in other parts of the prompt though.

post-reference - use this as an example of how the final post should look. post-reference includes both title and text-body.
you must unclude everything in the post-reference in your final post.

textbody-instructions - actually how to write the
</system-prompt>`

export const audiencePrompt = `<audience>
- you are writing for Russian-speaking audience
- you are writing for wide-audience which is generally interested in AI and tech and would to benefit from it for the business and life
</audience>`

export const vocabularyPrompt = `<vocabulary>
- prefer ИИ to "AI"
- convert dollar values to rubles where relevant, also change the scale of amounts accordingly if makes sense in the particular situation (for example, SAAS of $20/month would be around 490 rubles/month in Russia's reality)
</vocabulary>`

export const situationPrompt = `<situation>
Context: I manage my social media accounts, and this post will be for Threads. I write in Russian, I'm an AI expert, and I need help writing this post that I'll publish on Threads
I'm 32 years old and spend all my time on AI
I'm passionate about this field and write for both narrow (business AI) and broader audiences
I have publications for the general public and for people in AI science, covering both specific and general topics
This is general background about me
</situation>`

export const titleInstructions = `<title-instructions>
- follow principles-write-cut for writing titles
- When appropriate: include brand names, famous people, etc.
- When appropriate: add numbers
- Promise interesting and useful content that intrigues readers and motivates them to click

${/* Create clickbait headlines (e.g., mention brands, numbers in the headline)
Aim for headline length of 15-25 characters (with spaces). Can go up to 128 if needed
Finalize/revise headline after writing main text to better capture its essence */``}
</title-instructions>`

export const textBodyInstructions = `<textbody-instructions>
- Follow Maxim Ilyakhov's "Пиши Сокращай" book principles, more on that in principles-write-cut. 
Also a meta-advice for you - write in the style this principles-write-cut are written

${/* 
- Use dry humor and "no fluff" Twitter-style, but only in Russian
- Structure: 1-3 lines per paragraph
- Use plain Russian, be concise—no fluff or extra words
- Write in Russian (include English terms where appropriate)
- Ensure reader gets one key takeaway
- No bullshit
- add a little bit of Artemy Lebedev writing style
- use relevant emojie when pointing to a link to follow (if post contains the link)
 */``}
</textbody-instructions>`

export const principlesWriteCut = `<principles-write-cut>
Вот подробная инструкция по написанию сильных текстов, основанная на книге Максима Ильяхова и Людмилы Сарычевой "Пиши, сокращай":

**Глава 1. Отжать воду**

**1.1. Введение в метод**

*   **Упрощать:** "Текст должен быть простым. Простым - то есть высказанным максимально просто не в ущерб смыслу. Если текст можно упростить, его следует упростить."
*   **Уровни упрощения:** "Текст упрощается от малого к большому: на уровне слов, предложений, смысла, порядка и подачи."

**1.2. Стоп-слова: вводные**

*   **Убрать всё, на что отвлекаешься:** "Вводные конструкции - самая простая категория стоп-слов. Их легко найти."
*   **Общеизвестное:** "Фразы вроде «всем известно» и «Не секрет» - это ловушка. Если что-то и так известно, то об этом незачем писать. Если же автор пишет о неизвестном, но подает это как известное, получается неправда."
    *   _Пример:_ Вместо "Как известно, времена года меняются..." лучше написать "Чтобы зимой попасть в лето, прилетайте в Латинскую Америку или Австралию."
*   **Словесная нумерация:** "На письме эти слова избыточны. Не нумеруйте мысли словами. Разбивайте их на абзацы: один абзац - одна мысль."
    *   _Пример:_ Вместо "Во-первых... Во-вторых..." лучше разбить текст на абзацы.
*   **Вводные для примера:** "Слова «например» почти всегда избыточное."
    *   _Пример:_ Вместо "Вот пришли вы в магазин. Например, за хлебом." лучше написать "Пришли вы в магазин за хлебом."
*   **Видимость вежливости:** "Подлинная вежливость проявляется не в словах, а во внимании и заботе о читателе."
    *   _Пример:_ Вместо "Пожалуйста, будьте так добры, подписать отчет..." лучше написать "Пожалуйста, подпишите сегодня отчет за апрель. Прилагаю его в письме..."
*   **Кстати:** "Если что-то пришлось кстати, не надо это специально выделять."
    *   _Пример:_ Вместо "На ночь лучше не есть ничего жирного и калорийного. Кстати, в нашем йогурте..." лучше написать "В нашем йогурте полторы килокалории, чтобы его можно было есть на ночь."
*   **Скобки:** "Всё, что стоит в скобках, всем своим видом показывает, что это что-то неважное. Либо убирайте, либо доставайте из скобок."
    *   _Пример:_ Вместо "Василий Иванович (директор завода)..." лучше написать "Директор завода Василий Иванович..."

**1.3. Стоп-слова: оценки**

*   **Отказаться от оценок:** "Оценка - это яд. Она не доносит нужные мысли и не создает доверие."
*   **Как выявить оценку:** "Оценка - это характеристика, с помощью которой автор описывает субъективное ощущение."
    *   _Примеры:_ "вкусный завтрак", "эффективная система", "быстрый заработок".
*   **Ложное чувство проделанной работы:** "Текст с оценками становится слабым, потому что у автора появляется ложное чувство проделанной работы."
*   **Что делать с оценками:** "Чтобы оценка стала убедительной, замените или дополните ее фактами."
    *   _Пример:_ Вместо "Быстрый заработок" лучше написать "10 000 рублей, за 40 часов работы."
*   **Вместо оценок - истории:** "В рекламе вместо положительных оценок полезно рассказывать о ситуациях, когда ваш продукт окажется полезен."
    *   _Пример:_ Вместо "Ощутите незабываемую атмосферу тепла и уюта в нашем кафе." лучше написать "Приходите к нам, чтобы отметить дни рождения, поиграть с друзьями в игры или позавтракать и захватить кофе с собой."
*   **Не усиливайте оценку:** "Усилитель - оценка, наложенная на другую оценку."
    *   _Пример:_ Вместо "При покупке Айфона чехол вы получаете совершенно бесплатно." лучше написать "При покупке Айфона чехол вы получаете бесплатно."

**1.4. Стоп-слова· штампы**

*   **Не повторять за другими:** "Штамп - это популярное устойчивое словосочетание, смысл которого либо неясен, либо можно выразить одним словом."
*   **Штампы - всё, что знакомо:** "Человеку интересно всё новое и скучно от всего обыденного. Штампы по определению обыденные."
    *   _Пример:_ Вместо "Жизнь бьет ключом." лучше написать "Жизнь тарахтит всеми клапанами."
*   **Газетные штампы:** "Неопытные журналисты заучивают их, чтобы звучать профессионально. Но в языке такие штампы выглядят нелепо..."
    *   _Пример:_ Вместо "В первый день лета в стенах..." лучше написать "1 июня в МТИ вручали дипломы..."
*   **Бытовые штампы:** "Бытовые штампы - фразочки, которые настолько прочно вошли в обиход, что уже не вспомнишь, откуда они взялись."
    *   _Пример:_ Вместо "На каждом шагу" лучше написать "Сплошь".
*   **Корпоративные штампы:** "Корпоративные и рекламные штампы - затертые фразы с сайтов, буклетов и наружной рекламы."
    *   _Пример:_ Вместо "Команда единомышленников, объединенных общей целью" лучше написать "Компанию основали выпускники МФТИ в 2010 году..."

**1.5. Стоп-слова: заумное**

*   **Использовать простые слова:** "Чем проще слова, тем легче читателю воспринимать текст. Если можно написать проще, пишите проще."
    *   _Пример:_ Вместо "Ваши опасения по поводу аномалий в приоритизации задач легитимны..." лучше написать "Вы правы: мы неправильно расставили приоритеты. Обсужу это с директором."
*   **Не в ущерб точности:** "Не путайте заумные слова ради выпендрежа и термины по делу."
*   **Когда важны нюансы:** "Если заумное слово несет важный смысловой нюанс, у вас есть полное право использовать его в тексте."
*   **Критический, драматический:** "Когда автору особенно скучно или досталась унылая тема, он ради развлечения начинает злоупотреблять сильными заумными словами."
*   **Народная психология:** "Использовать психологические и медицинские термины, если вы пишете не о психологии или медицине, - дурной тон."

**1.6. Стоп-слова: эвфемизмы**

*   **Не сглаживать углы:** "Эвфемизмы - это когда неприятные слова заменяют безобидными синонимами."
*   **Называйте вещи своими именами:** "Мямлить, расшаркиваться и обтекать вокруг неудобных тем легко. Это не признак деликатности, так умеют все. А чтобы называть вещи своими именами, нужны характер и воля."
*   **Границы критики и переход на личности:** "Мы советуем не переходить на личности. Это значит не высказывать оценку человеку как таковому, только его поступкам."
    *   _Пример:_ Вместо "Он тупой." лучше написать "Он сделал глупую вещь."
*   **Инвалиды:** "Если у автора задача помочь инвалидам, привлечь внимание к их проблемам, собрать денег и улучшить их жизнь, то да, слово «инвалид» использовать можно."
*   **Популярные эвфемизмы:** "Эвфемизмы опасны тем, что проникают в жизнь незаметно."
    *   _Пример:_ Вместо "Трудность, затруднение" лучше написать "Проблема".

**1.7. Стоп-слова: отглагольное**

*   **Больше действий:** "Чтобы текст был интересным, в нём должно быть действие."
*   **Отглагольное существительное:** "Действие прячут, будто стесняются. Например, за существительное."
    *   _Пример:_ Вместо "Мы занимаемся продажей фильмов и музыки." лучше написать "Мы продаем фильмы и музыку."
*   **Причастие:** "Причастие - это отглагольное прилагательное."
    *   _Пример:_ Вместо "Сотрудник, работающий в офисе..." лучше написать "Офисный сотрудник".
*   **Деепричастие:** "Деепричастие - это отглагольное наречие."
    *   _Пример:_ Вместо "Окончив МГУ, он поступил в аспирантуру." лучше написать "После МГУ он поступил в аспирантуру."
*   **Страдательный залог:** "Страдательный залог - это действие наизнанку."
    *   _Пример:_ Вместо "Денежные средства успешно освоены." лучше написать "Подрядчики всё потратили."

**1.8. Стоп-слова: неопределенное**

*   **Определять неопределённое:** "Неопределенные - слова, которые вместо точной информации дают неточную, поэтому их невозможно представить."
*   **Числа:** "В коммерческом тексте чаще всего неопределенными становятся числа - особенно те, которые постоянно меняются."
    *   _Пример:_ Вместо "Системой пользуются более 20 000 клиентов" лучше написать "По данным на 1 января, системой пользуются 20 тысяч клиентов."
*   **Рейтинг:** "Еще один вид неопределенного - рейтинги."
    *   _Пример:_ Вместо "Мы входим в двадцатку крупнейших производителей..." лучше написать "У нас представительства в 40 городах России..."
*   **Нижняя граница:** "Рекламщики любят завлекать покупателей обещаниями низкой цены."
    *   _Пример:_ Вместо "Холодильники от 15 000 рублей." лучше написать "Холодильник для дачи или съемной квартиры за 15 000 рублей."
*   **Местоимения:** "Среди местоимений в русском языке есть неопределенные. Они вредят информативности."
    *   _Пример:_ Вместо "В последнее время все больше внимание общественности приковано к глобальному потеплению." лучше написать "В 1980 году американский астрофизик Карл Саган выпустил..."

**1.9. Стоп-слова: брехня**

*   **Не привирать, не притягивать за уши:** "Брехня в нашем понимании - это расплывчатые формулировки, которые формально не ложь, но и не правда."
*   **Как бороться с брехней:** "Единственный способ победить брехню - говорить правду, даже неудобную."

**1.10. Стоп-слова в жизни**

*   **Что будет мешать:** "У простого и честного текста есть один недостаток: вам всегда будут мешать его писать."
*   **Когда нечем хвастаться:** "Если рассказать правду, будет печально. Но если мы пишем текст для клиентов и будем скрывать печальную правду, мы выроем себе яму."
*   **Что делать, если тема незнакомая:** "Чтобы писать просто, нужно хорошо разбираться в теме."
*   **Если вам доведется писать для корпоративного блога или местного СМИ:** "Если у вас в редакции звучат слова «обидеть», «политес», «осторожно» и «сгладить», будьте начеку: кто-то стоит на пути простоты и честности."

**Глава 2. Донести мысли**

**2.1. Информативность**

*   **Не перегружать:** "Факты есть, информации много, мусора нет - но текст кажется перегруженным. Такое бывает, если нарушены принципы информативности."
*   **Информативность:** "...это то, сколько новых мыслей мы сообщаем в предложении."
*   **Удалите лишнюю мысль:** "Если в предложении больше трех новых мыслей, попробуйте избавиться от одной из них."
*   **Обобщите новые мысли:** "Обобщение «Три инструмента» дает читателю возможность отдохнуть, прежде чем изучать перечень."
*   **Объяснить по цепочке:** "Сначала мы объясняем промежуточные сущности, а потом с их помощью объясняем то, что должны были объяснить изначально."

**2.2. Синтаксис**

*   **Писать энергично:** "Синтаксис - это то, как слова связаны в предложении. Когда они связаны хорошо, речь льется."
*   **Лучший синтаксис - естественная речь:** "В вас уже встроен генератор хорошего простого текста. Вы умеете говорить складно, если расслабитесь."
*   **Действие и бездействие:** "Самые энергичные предложения получаются тогда, когда в них есть действие."
*   **Парцелляция:** "Парцелляция - это разбивка предложения точкой в произвольных местах."

**2.3. Запятая**

*   **Оставить запятую в покое:** "Чем больше в предложении запятых, тем сложнее его читать. Чтобы предложения читались легко, оставьте запятую в покое."
*   **Несколько предложений в одном:** "Если у вас сложное предложения без союзов и его части хорошо живут по отдельности, проверьте, не лучше ли их разделить."
*   **Лишнее подчинение:** "Проблемы начинаются, когда внутри одного подчинения появляется другое."
*   **Косвенная речь, воля и познание:** "Если в тексте встречается пересказ чужой речи, желания или планов, скорее всего, это можно упростить."
*   **Разделенные союзы и устойчивые фразы:** "Если в тексте встречается «как... так и...», «Не только... но и ...», «если... то...», будьте начеку."

**2.4. Однородные члены**

*   **Однородные члены сократить:** "Если в тексте встречаются однородные члены, проверьте, не близки ли они по смыслу. Если так - выберите самый точный, остальные удалите."

**2.5. Абзацы**

*   **Навести порядок в абзаце:** "Если текст плохо разделен на абзацы, сразу понятно, что автор не владеет повествованием."
*   **Порядок и навигация:** "Абзацы создают ощущение порядка."
*   **Как читатель изучает текст:** "Чаще всего читатель не изучает текст подряд, скользит по нему в поисках интересного."
*   **Первое предложение абзаца:** "Если начало абзаца интересное, читатель изучает его подробнее, если нет - прыгает к следующему."
*   **Вывод к абзацу:** "В конце абзацев полезно ставить выводы. Вывод отвечает на вопрос «Что делать с этой информацией?»"
*   **Емкость абзаца:** "Один абзац- одна тема."
*   **Поток сознания:** "Поток сознания - прием повествования, в котором предложения следуют друг за другом через ассоциации."

**2.6. Цель и задачи**

*   **Не отходить от темы:** "Цель - позвоночник статьи. Цель не дает статье развалиться."
*   **Что такое и зачем нужна цель:** "Цель - это то, что должно измениться в голове читателя после прочтения текста."
*   **Полезная и бесполезная цели:** "Если автор не контролирует цель статьи, с большой вероятностью так и произойдет."
*   **Задачи текста:** "Если цель - что мы хотим получить в итоге, то задачи - как мы этого достигнем."

**2.7. Структура**

*   **Навести порядок в тексте:** "Структура - это то, как организованы мысли в длинном тексте."
*   **Уборка в статье:** "Изнутри структура диктует логику развития рассказа: что за чем идет, что куда отнести, где закончить одну тему и начать другую."
*   **Модуль:** "Модуль - главная боевая единица структуры."
*   **Как делать модули привлекательными:** "Приятно, когда модули не только похожи друг на друга по структуре, но и дружат подзаголовками между собой и с общим заголовком."
*   **Как составить план статьи:** "Чтобы правильно разделить статью на модули, разберитесь, какая у нее цель и аудитория."
*   **Вступление ко всей статье:** "Во вступлении можно использовать четыре стратегии: погружать в тему, актуализировать знания, создавать интерес и формировать доверие к автору."
*   **Заключение ко всей статье:** "Заключение - самая скорбная часть статьи. До него редко доходят."

**2.8 Заголовок**

*   **Привлечь внимание к тексту:** "Заголовок - первое, что следует добавить тексту, чтобы обратить на него внимание."
*   **Заголовок называет тему текста:** "Хороший заголовок должен отвечать на вопрос «О чём сказано в этом тексте?»"
*   **Заголовок задает тему статьи:** "Если в статье есть что-то, что не относится к заголовку, то либо это что-то лишнее, либо заголовок сформулирован неверно."
*   **Заголовки для поиска и навигации:** "Некоторые заголовки нужны, чтобы помочь читателю найти нужный раздел статьи или главу в книге."
*   **Заголовки для привлечения внимания:** "Чтобы заголовок зацепил, он всего лишь должен стоять над полезной статьей."
*   **Кричащие заголовки:** "Кричащие заголовки привлекают лишь наименее образованных, опытных и вдумчивых читателей."
*   **Передергивание заголовка:** "Автор цепляется за какой-то факт, выдергивает его из контекста и раздувает до нужных размеров."

**2.9. Дидактика**

*   **Объяснить сложное простым языком:** "Дидактика - это дисциплина, которая изучает принципы обучения."
*   **Заставить себя слушать. Внимание и интерес:** "Чтобы читатели настроились, начните объясняющую статью с короткого вступления."
*   **Познакомить с предметом:** "Если предмет новый для читателя, обязательно объясните, что это такое."
*   **Сначала показать, потом рассказать:** "Иллюстрации всегда самые интересные в любом учебнике, книге и статье."
*   **От простого к сложному:** "Объяснять новое нужно всегда на основе того, что человек уже знает."
*   **Привязать к реальности:** "Голая теория - это скучно."
*   **Помочь с трудностями:** "Если вы пишете статью с практическими рекомендациями, предусмотрите эти трудности и предложите решение."
*   **Помочь структурой и выводами:** "Если учебная статья получается объемной, полезно разделить ее на небольшие фрагменты, каждый из которых будет самостоятельным и ценным."

**2.10. Чувственный опыт**

*   **Избавиться от абстракций:** "Конкретика - это всё, что человек уже воспринимал или может воспринять органами чувств."
*   **Как поддерживать абстрактное:** "Всё абстрактное поддержите конкретным."

**2.11. Факты**

*   **Сделать факты понятными:** "Сами факты не так важны, как способность читателя их воспринять."
*   **Опыт в восприятии фактов:** "Понимание фактов напрямую зависит от жизненного опыта читателя."
*   **Полезные читателю факты:** "Если факты не несут полезную информацию, их следует удалить - даже если сами по себе они забавные или милые."
*   **Факты, которые снижают доверие:** "Некоторые факты специально сделаны так, чтобы их не поняли."
*   **Перегрузка фактами:** "С фактами важно не переборщить, чтобы читателю не стало слишком сложно, и он не ушел."

**2.12. Сложные случаи**

*   **Слушайте себя:** "Всегда опирайтесь на вкус и здравый смысл."

**Глава 3. Рассказать о себе**

**3.1. Решение о покупке**

*   **Почему люди покупают:** "Люди покупают то, что, по их мнению, принесет им пользу или избавит от вреда."
*   **Продает не только текст:** "Решение о покупке - колоссально сложный процесс."
*   **Иллюстрации сильнее текста:** "Прежде чем писать текст, убедитесь, что вам есть чем его проиллюстрировать."
*   **Демонстрация сильнее текста и иллюстраций:** "Личный опыт использования продукта всегда сильнее, чем любой маркетинг, дизайн и иллюстрации вместе взятые."
*   **Продающего текста не существует, но весь текст - продающий:** "Сильным нужно делать не только рекламный текст."

**3.2 Рассказ о продукте**

*   **Пять правил рассказа о продукте:** "Простые слова, польза для клиента, детали и сценарии, доказательства, уважение и забота."

**3.3. Текст о себе и компании**

*   **Как рассказывать о себе и своей компании на сайте:** "Писать о том, чем вы полезны другим."
*   **Кто вы:** "Начните текст о себе или о компании с простого заявления, кто вы."
*   **Чем вы полезны:** "Сразу после «кто вы» напишите, какую пользу вы приносите людям."
*   **Подробности:** "Покажите, что вы хорошо владеете своей профессией."
*   **Сценарии:** "Полезно рассказывать не только о вашей пользе, но и о ситуациях, когда к вам лучше обращаться."
*   **Тонкости:** "Напишите о тонкостях, которые знают только профессионалы."
*   **Ограничения:** "Профессионал знает не только свои возможности, но и ограничения."
*   **Миссия и интересы:** "Миссия - это то, ради чего вы работаете, в глобальном смысле."
*   **Изюминка:** "Если кажется, что текст получается слишком сухим, придумайте для него изюминку."
*   **Проверка черным маркером:** "Если после этого текст подходит любой компании, вы сомневались не зря."

**3.4. Регалии**

*   **Не хвастаться:** "Если у вас много дипломов, наград и премий, вы лауреат международных конкурсов или носите почетные звания - это прекрасно. Но в тексте о себе это может оказаться бесполезным, если не объяснить пользу от этих регалий."
*   **Награды, дипломы и достижения:** "Чтобы членство в организациях и премии не выглядели пустым звуком, рассказывайте, какая от этого польза вашим клиентам."
*   **Как рассказывать о клиентах:** "Чтобы рассказ о клиентах стал полезным, расскажите, что именно вы делали для этих клиентов, с какими трудностями столкнулись и как их решили."

**3.5. Сопроводительное письмо**

*   **Как откликаться на вакансию:** "Чтобы откликнуться на вакансию, нужно соответствовать требованиям."
*   **Соответствовать требованиям:** "В хорошем письме следует просто и по-человечески объяснить, как вы соответствуете требованиям."
*   **Откликаться прицельно:** "Хорошо, когда в отклике на вакансию видно, что человек писал именно в эту компанию и именно на эту вакансию."
*   **Приводить доказательства:** "Избегайте оценок своей работы. Вместо этого рассказывайте о результатах и приводите доказательства."
*   **Не надеяться:** "Хороший отклик на вакансию не значит ничего."

**3.6. Вранье**

*   **Никогда не врать, даже в мелочах:** "Когда кандидат привирает в резюме, он думает, будто этого никто не видит, и он один такой умный. Но так делают очень многие."
*   **Не пытайтесь никого перехитрить:** "Такие люди забывают, что на работу их принимают опытные люди."

**3.7. Главный секрет**

*   **Дело не в словах:** "Подлинная индивидуальность проявляется в смысле, а не в словах."

Это подробный конспект книги "Пиши, сокращай". Используйте его как
инструкцию для создания сильных текстов. Помните, что главное - это
смысл, польза для читателя и искренность. Удачи!

</principles-write-cut>`

export const defaultInfo = `<info>
</info>`

export const defaultPostReference = `<post-reference>
</post-reference>`

export const defaultInformationToSummarize = `<information-to-summarize>
</information-to-summarize>` 

