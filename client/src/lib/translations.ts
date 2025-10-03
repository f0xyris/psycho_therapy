export type Language = 'uk';

export const languageNames: Record<Language, string> = {
  uk: 'Українська'
};

export interface Translations {
  // Navigation
  home: string;
  services: string;
  about: string;
  contact: string;
  portfolio: string;
  booking: string;
  training: string;
  events?: string;
  reviews: string;
  account: string;
  admin: string;
  login: string;
  logout: string;
  loginDescription: string;
  loginWithReplit: string;
  backToHome: string;
  loginRequired: string;
  
  // Theme toggle
  toggleTheme: string;
  
  // Language selector
  language: string;
  
  // Loading states
  common: {
    loading: string;
    processing: string;
    beautyStudio: string;
  };
  
  // Home page
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  bookNow: string;
  
  // Services
  servicesTitle: string;
  servicesDescription: string;
  learnMore: string;
  laserHairRemoval: string;
  massage: string;
  spaServices: string;
  groupTherapy: string;
  childTherapy: string;
  
  // Service details
  laserHairRemovalDesc: string;
  massageDesc: string;
  spaDesc: string;
  groupTherapyDesc: string;
  childTherapyDesc: string;
  trainingDesc: string;
  priceFrom: string;
  price: string;
  
  // Features section
  whyChooseUs: string;
  modernEquipment: string;
  modernEquipmentDesc: string;
  experiencedSpecialists: string;
  experiencedSpecialistsDesc: string;
  individualApproach: string;
  individualApproachDesc: string;
  
  // About
  aboutTitle: string;
  aboutDescription: string;
  
  // Contact
  contactTitle: string;
  contactDescription: string;
  phone: string;
  email: string;
  address: string;
  
  // Portfolio
  portfolioTitle: string;
  portfolioDescription: string;
  
  // Booking
  bookingTitle: string;
  bookingDescription: string;
  selectService: string;
  selectDate: string;
  selectTime: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  submit: string;
  
  // Training
  trainingTitle: string;
  trainingDescription: string;
  courses: string;
  coursesDescription: string;
  laserEpilationCourse: string;
  laserEpilationCourseDesc: string;
  massageCourse: string;
  massageCourseDesc: string;
  skinCareCourse: string;
  skinCareCourseDesc: string;
  
  // Reviews
  reviewsTitle: string;
  reviewsDescription: string;
  clientReviews: string;
  reviewAnna: string;
  reviewMaria: string;
  reviewElena: string;
  reviewOlga: string;
  reviewTatyana: string;
  reviewSvetlana: string;
  // --- Новые ключи для формы отзывов ---
  reviewFormTitle: string;
  reviewFormDescription: string;
  reviewFormNameLabel: string;
  reviewFormNamePlaceholder: string;
  reviewFormTextLabel: string;
  reviewFormTextPlaceholder: string;
  reviewFormRatingLabel: string;
  reviewFormSubmit: string;
  reviewFormSubmitting: string;
  reviewFormPending: string;
  reviewFormAnonymous: string;
  reviewApprove: string;
  reviewApproving: string;
  reviewReject: string;
  reviewRejecting: string;
  reviewStatusPending: string;
  reviewStatusPublished: string;
  reviewStatusRejected: string;
  reviewDelete: string;
  reviewDeleting: string;
  reviewDeleteConfirm: string;
  
  // Account
  accountTitle: string;
  personalAccount: string;
  
  // Admin
  adminTitle: string;
  adminPanel: string;
  
  // Additional pages content
  welcomeMessage: string;
  pageUnderConstruction: string;
  myAppointments: string;
  profileSettings: string;
  bookingHistory: string;
  dashboard: string;
  manageBookings: string;
  manageUsers: string;
  viewReports: string;
  
  // Not Found page
  notFoundTitle: string;
  notFoundSubtitle: string;
  backToSmoothness: string;
  
  // Hero slides
  slide1Title: string;
  slide1Subtitle: string;
  slide1Description: string;
  slide2Title: string;
  slide2Subtitle: string;
  slide2Description: string;
  slide3Title: string;
  slide3Subtitle: string;
  slide3Description: string;
  
  // Staff members (titles and descriptions)
  seniorMaster: string;
  massageTherapist: string;
  cosmetologist: string;
  trainingSpecialist: string;
  administrator: string;
  laserEpilationSpec: string;
  classicSpaSpec: string;
  facialBodyCareSpec: string;
  coursesWorkshopsSpec: string;
  consultationBookingSpec: string;
  experienceYears: string;
  certifiedSpecialistTitle: string;
  clientsCount: string;
  diplomaMassage: string;
  specialistYear: string;
  careExpert: string;
  internationalCert: string;
  topTrainer: string;
  graduatesCount: string;
  bestService: string;
  clientOriented: string;
  
  // Footer
  footerDescription: string;
  followUs: string;
  quickLinks: string;
  contactInfo: string;
  allRightsReserved: string;
  workingHours: string;
  
  // Common
  loading: string;
  error: string;
  success: string;
  close: string;
  save: string;
  cancel: string;
  confirm: string;
  duration: string;
  minutes: string;
  buy: string;
  hours: string;
  
  // Staff section
  ourTeam: string;
  ourTeamDescription: string;
  yearsExperience: string;
  rating: string;
  certifiedSpecialist: string;
  clients: string;
  
  // Staff names
  kseniaNovak: string;
  
  // Location section  
  howToFindUs: string;
  locationDescription: string;
  openInMaps: string;
  
  // Booking form
  name: string;
  namePlaceholder: string;
  phonePlaceholder: string;
  comments: string;
  commentsPlaceholder: string;
  bookAppointment: string;
  
  // Course checkout
  backToCourses: string;
  courseDetails: string;
  payment: string;
  paymentError: string;
  paymentSuccess: string;
  paymentSuccessMessage: string;
  processing: string;
  payAmount: string;
  courseNotFound: string;
  returnToCourses: string;
  cost: string;
  
  // Authentication
  auth: {
    welcome: string;
    subtitle: string;
    login: string;
    register: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    firstNamePlaceholder: string;
    lastNamePlaceholder: string;
    phonePlaceholder: string;
    loggingIn: string;
    registering: string;
    or: string;
    googleLogin: string;
    heroDescription: string;
    emailRequired: string;
    passwordRequired: string;
    firstNameRequired: string;
    lastNameRequired: string;
    phoneRequired: string;
    emailInvalid: string;
    passwordMinLength: string;
    oauthError: string;
    oauthErrorMessage: string;
    googleTemporaryDisabled: string;
    googleTemporaryDisabledMessage: string;
    loginWelcomeCreative: string;
    loginWelcomeTitle: string;
  };
  reviewDeleted: string;
  reviewDeleteError: string;
  adminStatusUpdated: string;
  adminStatusUpdateFailed: string;
  appointmentCreated: string;
  appointmentError: string;
  fillAllFields: string;
  reviewsTab: string;
  pricesTab: string;
  appointment: string;
  appointments: string;
  calendar: string;
  date: string;
  forDate: string;
  unknownClient: string;
  clientWithoutAccount: string;
  user: string;
  role: string;
  adminAccess: string;
  searchUsers: string;
  noUsersFound: string;
  noAppointments: string;
  noAppointmentsThisDay: string;
  completed: string;
  deleted: string;
  confirmed: string;
  pending: string;
  approved: string;
  rejected: string;
  cancelled: string;
  add: string;
  create: string;
  delete: string;
  deleteConfirm: string;
  deleteWarning: string;
  editPricesDesc: string;
  moderationReviewsDesc: string;
  courseName: string;
  courseDescription: string;
  serviceName: string;
  addCourse: string;
  addService: string;
  loadingReviews: string;
  noReviews: string;
  saving: string;
  added: string;
  saveError: string;
  deleteError: string;
  addError: string;
  uploadError: string;
  service: string;
  appointmentsFor: string;
  calendarDesc: string;
  userManagement: string;
  totalUsers: string;
  regularUsers: string;
  unauthorized: string;
  accessDenied: string;
  adminAccessRequired: string;
  errorLoadingUsers: string;
  firstName: string;
  lastName: string;
  confirmAppointment: string;
  rejectAppointment: string;
  completeAppointment: string;
  cancelAppointment: string;
  appointmentConfirmed: string;
  appointmentRejected: string;
  appointmentCompleted: string;
  appointmentCancelled: string;
  confirmAppointmentMessage: string;
  rejectAppointmentMessage: string;
  completeAppointmentMessage: string;
  cancelAppointmentMessage: string;
  appointmentStatusUpdated: string;
  appointmentStatusUpdateFailed: string;
  timeSlotUnavailable: string;
  timeSlotAvailable: string;
  pastTimeError: string;
  timeSlotAlreadyBooked: string;
  booked: string;
  deleteAppointment: string;
  deleteAppointmentConfirm: string;
  appointmentDeleted: string;
  appointmentDeleteError: string;
  deleting: string;
  
  // Delete dialogs
  deleteCourse: string;
  deleteCourseConfirm: string;
  deleteService: string;
  deleteServiceConfirm: string;
}

export const translations: Record<Language, Translations> = {
  uk: {
    home: "Головна",
    services: "Послуги",
    about: "Про нас",
    contact: "Контакти",
    portfolio: "Портфоліо",
    booking: "Запис",
    training: "Навчання",
    events: "Події",
    reviews: "Відгуки",
    account: "Акаунт",
    admin: "Адмін",
    login: "Вхід",
    logout: "Вихід",
    loginDescription: "Увійдіть, щоб отримати доступ до свого панелю",
    loginWithReplit: "Увійти через Replit",
    backToHome: "Повернутися на головну",
    loginRequired: "Щоб записатися на прийом, потрібно увійти в систему",
    toggleTheme: "Переключити тему",
    language: "Мова",
    common: {
      loading: "Завантаження...",
      processing: "Обробка...",
      beautyStudio: "Психотерапевтична практика",
    },
    heroTitle: "Професійна лазерна епіляція та масаж",
    heroSubtitle: "Відчуйте найвищий рівень краси та здоров'я",
    heroDescription: "Трансформуйте свою шкіру за допомогою наших сучасних лазерних процедур та омолоджуючої масажної терапії. Записуйтесь на прийом сьогодні.",
    bookNow: "Записатися",
    servicesTitle: "Психотерапевтичні послуги",
    servicesDescription: "Доказові підходи для підтримки вашого ментального здоров’я",
    learnMore: "Дізнатися більше",
    laserHairRemoval: "Індивідуальна терапія",
    massage: "Парна‑терапія",
    spaServices: "Робота з тривогою та стресом",
    groupTherapy: "Групова терапія",
    childTherapy: "Дитяча терапія",
    laserHairRemovalDesc: "Індивідуальні сесії з фокусом на ваші цілі та розвиток",
    massageDesc: "Покращення комунікації, довіри та емоційного зв’язку у відносинах",
    spaDesc: "Практичні інструменти для зниження тривоги, керування стресом і відновлення балансу",
    groupTherapyDesc: "Простір підтримки та віддзеркалення. Досвід разом і відчуття, що ви не одні.",
    childTherapyDesc: "Підтримка дітей і підлітків із тривогою, труднощами у школі та стосунках.",
    trainingDesc: "Професійні курси для спеціалістів індустрії краси",
    priceFrom: "від",
    price: "Ціна",
    whyChooseUs: "Чому саме я",
    modernEquipment: "Доказовий підхід",
    modernEquipmentDesc: "CBT/ACT інструменти у поєднанні з емпатичним стилем",
    experiencedSpecialists: "Ліцензований психотерапевт",
    experiencedSpecialistsDesc: "Професійна допомога, постійний розвиток і супервізія",
    individualApproach: "Індивідуальний план",
    individualApproachDesc: "Терапія під ваші потреби, темп і цінності",
    aboutTitle: "Про мене",
    aboutDescription: "Маю вищу психологічну освіту. Маю досвід 5 років. Працюю в методах: «Транзакційного аналізу» та «Інтегративної психотерапії з фокусом на стосунки», а також DBT. Я працюю з людьми, які втомилися носити в собі тривогу, провину, страх «бути не такими». Допомагаю підліткам, що шукають себе, парам, яким важко чути одне одного, і дорослим, які відкладають життя на «потім».",
    contactTitle: "Контакти",
    contactDescription: "Зв'яжіться з нами, щоб призначити зустріч або поставити запитання.",
    phone: "Телефон",
    email: "Email",
    address: "Адреса",
    portfolioTitle: "Наша робота",
    portfolioDescription: "Подивіться на дивовижні результати, яких досягли наші клієнти завдяки нашим процедурам.",
    bookingTitle: "Запис на консультацію",
    bookingDescription: "Запишіться на зустріч із психотерапевтом. Оберіть послугу, дату та час.",
    selectService: "Оберіть послугу",
    selectDate: "Оберіть дату",
    selectTime: "Оберіть час",
    fullName: "Повне ім'я",
    emailAddress: "Адреса email",
    phoneNumber: "Номер телефону",
    submit: "Надіслати",
    trainingTitle: "Події та групи",
    trainingDescription: "Анонси груп, воркшопів і відкритих зустрічей. Оберіть подію та дізнайтеся подробиці.",
    courses: "Курси",
    coursesDescription: "Навчайтеся у досвідчених професіоналів",
    reviewsTitle: "Відгуки клієнтів",
    reviewsDescription: "Що говорять про наші послуги наші клієнти",
    clientReviews: "Відгуки",
    reviewAnna: "Чудовий салон! Професійний персонал, сучасне обладнання. Результати лазерної епіляції перевершили всі очікування.",
    reviewMaria: "Масаж просто чарівний! Майстер врахував всі мої побажання. Дуже розслаблююча атмосфера. Обов'язково прийду ще.",
    reviewElena: "Відмінний сервіс та індивідуальний підхід. Прийнятні ціни та висока якість. Рекомендую всім друзям!",
    reviewOlga: "Затишна атмосфера, чистота та професіоналізм. Спа-процедури просто захоплюючі. Відчуваю себе оновленою!",
    reviewTatyana: "Записалася на курс масажу. Дуже досвідчений інструктор, матеріал подається зрозуміло. Дуже задоволена!",
    reviewSvetlana: "Все дуже професійно організовано. Зручне онлайн-бронювання, нагадування. Уважний та ввічливий персонал.",
    accountTitle: "Особистий кабінет",
    personalAccount: "Кабінет",
    adminTitle: "Панель адміністратора",
    adminPanel: "Адміністрування",
    welcomeMessage: "Вітаємо в салоні краси LaserTouch",
    pageUnderConstruction: "Ця сторінка знаходиться в розробці",
    myAppointments: "Мої записи",
    profileSettings: "Налаштування профілю",
    bookingHistory: "Історія бронювань",
    dashboard: "Панель управління",
    manageBookings: "Керувати бронюваннями",
    manageUsers: "Керувати користувачами",
    viewReports: "Переглянути звіти",
    notFoundTitle: "Схоже, ця сторінка зникла так само, як волосся після лазера!",
    notFoundSubtitle: "Ой! Ця ділянка вже ідеально гладка — сторінку не знайдено.",
    backToSmoothness: "Повернутися до гладкості",
    slide1Title: "Професійна лазерна епіляція",
    slide1Subtitle: "Відчуйте найвищий рівень косметичних процедур",
    slide1Description: "Передова лазерна технологія для постійного видалення волосся з мінімальним дискомфортом",
    slide2Title: "Розслаблююча масажна терапія",
    slide2Subtitle: "Омолодіть своє тіло та розум",
    slide2Description: "Професійні техніки масажу для здоров'я, доброго самопочуття та глибокого розслаблення",
    slide3Title: "Розкішні спа-послуги",
    slide3Subtitle: "Насолоджуйтесь преміальними процедурами",
    slide3Description: "Повний спа-досвід з доглядом за обличчям та процедурами для тіла",
    seniorMaster: "Старший майстер",
    massageTherapist: "Масажист",
    cosmetologist: "Косметолог",
    trainingSpecialist: "Спеціаліст з навчання",
    administrator: "Адміністратор",
    laserEpilationSpec: "Лазерна епіляція",
    classicSpaSpec: "Класичний і спа-масаж",
    facialBodyCareSpec: "Догляд за обличчям та тілом",
    coursesWorkshopsSpec: "Курси та майстер-класи",
    consultationBookingSpec: "Консультації та запис",
    experienceYears: "років досвіду",
    certifiedSpecialistTitle: "Сертифікований спеціаліст",
    clientsCount: "клієнтів",
    diplomaMassage: "Диплом з масажу",
    specialistYear: "Спеціаліст року 2023",
    careExpert: "Експерт з догляду",
    internationalCert: "Міжнародний сертифікат",
    topTrainer: "Топ-тренер",
    graduatesCount: "випускників",
    bestService: "Найкращий сервіс",
    clientOriented: "Клієнтоорієнтований",
    footerDescription: "Приватна психотерапевтична практика. Турботлива, доказова підтримка вашого благополуччя.",
    followUs: "Додаткова інформація",
    quickLinks: "Швидкі посилання",
    contactInfo: "Контактна інформація",
    allRightsReserved: "Усі права захищені.",
    workingHours: "",
    loading: "Завантаження...",
    error: "Помилка",
    success: "Успіх",
    close: "Закрити",
    save: "Зберегти",
    cancel: "Скасувати",
    confirm: "Підтвердити",
    duration: "Тривалість",
    minutes: "хв",
    buy: "Купити",
    hours: "годин",
    ourTeam: "Наша команда професіоналів",
    ourTeamDescription: "Познайомтеся з нашими сертифікованими спеціалістами з багаторічним досвідом",
    yearsExperience: "років досвіду",
    rating: "Рейтинг",
    certifiedSpecialist: "Сертифікований спеціаліст",
    clients: "клієнтів",
    kseniaNovak: "Ксения Гордиенко",
    howToFindUs: "Як нас знайти",
    locationDescription: "Ми знаходимося в зручному місці з відмінною транспортною доступністю",
    openInMaps: "Відкрити в картах",
    name: "Ім'я",
    namePlaceholder: "Ваше ім'я",
    phonePlaceholder: "+48 (___) ___-__-__",
    comments: "Коментар",
    commentsPlaceholder: "Додаткові побажання або запитання",
    bookAppointment: "Записатися",
    backToCourses: "Повернутися до курсів",
    courseDetails: "Деталі курсу",
    payment: "Оплата",
    paymentError: "Помилка оплати",
    paymentSuccess: "Оплата успішна!",
    paymentSuccessMessage: "Дякуємо за покупку курсу!",
    processing: "Обробка...",
    payAmount: "Сплатити",
    courseNotFound: "Курс не знайдено",
    returnToCourses: "Повернутися до курсів",
    cost: "Вартість",
    auth: {
      welcome: "Ласкаво просимо до LaserTouch",
      subtitle: "Увійдіть або створіть акаунт, щоб записатися на прийом",
      login: "Увійти",
      register: "Реєстрація",
      email: "Email",
      password: "Пароль",
      firstName: "Ім'я",
      lastName: "Прізвище",
      phone: "Номер телефону",
      emailPlaceholder: "Введіть email",
      passwordPlaceholder: "Введіть пароль",
      firstNamePlaceholder: "Введіть ім'я",
      lastNamePlaceholder: "Введіть прізвище",
      phonePlaceholder: "+48 (___) ___-__-__",
      loggingIn: "Входимо...",
      registering: "Реєструємо...",
      or: "або",
      googleLogin: "Увійти через Google",
      heroDescription: "Професійні косметичні послуги в центрі Варшави. Лазер, масаж, spa та навчання.",
      emailRequired: "Email обов'язковий",
      passwordRequired: "Пароль обов'язковий",
      firstNameRequired: "Ім'я обов'язкове",
      lastNameRequired: "Прізвище обов'язкове",
      phoneRequired: "Номер телефону обов'язковий",
      emailInvalid: "Введіть правильний email адрес",
      passwordMinLength: "Пароль повинен містити мінімум 6 символів",
      oauthError: "Помилка OAuth",
      oauthErrorMessage: "Вхід через Google не вдався. Спробуйте увійти через email/пароль.",
      googleTemporaryDisabled: "Вхід через Google тимчасово вимкнено",
      googleTemporaryDisabledMessage: "Будь ласка, використовуйте вхід через email/пароль поки ми виправляємо проблеми з Google OAuth.",
      loginWelcomeCreative: "Ви сьогодні чудово виглядаєте! Радий вас знову бачити!",
      loginWelcomeTitle: "З поверненням!"
    },
    laserEpilationCourse: "Групова терапія",
    laserEpilationCourseDesc: "Безпечний простір для досвіду разом: підтримка, віддзеркалення, взаємодія.",
    massageCourse: "Психоедукаційний воркшоп",
    massageCourseDesc: "Інструменти самодопомоги: тривога, межі, емоційна регуляція.",
    skinCareCourse: "Відкрита зустріч",
    skinCareCourseDesc: "Неформальна розмова про психотерапію, питання та відповіді.",
    // --- Новые ключи ---
    reviewFormTitle: "Залиште свій відгук",
    reviewFormDescription: "Поділіться своєю думкою про наш центр. Ваш відгук з'явиться після модерації.",
    reviewFormNameLabel: "Ваше ім'я (необов'язково)",
    reviewFormNamePlaceholder: "Анонімно",
    reviewFormTextLabel: "Ваш відгук",
    reviewFormTextPlaceholder: "Напишіть ваш відгук...",
    reviewFormRatingLabel: "Ваша оцінка",
    reviewFormSubmit: "Надіслати відгук",
    reviewFormSubmitting: "Відправка...",
    reviewFormPending: "Відгук на модерації",
    reviewFormAnonymous: "Анонімно",
    reviewApprove: "Схвалити",
    reviewApproving: "Схвалення...",
    reviewReject: "Відхилити",
    reviewRejecting: "Відхилення...",
    reviewStatusPending: "На модерації",
    reviewStatusPublished: "Опубліковано",
    reviewStatusRejected: "Відхилено",
    reviewDelete: "Видалити",
    reviewDeleting: "Видалення...",
    reviewDeleteConfirm: "Ви впевнені, що хочете видалити цей відгук?",
    reviewDeleted: "Відгук успішно видалено!",
    reviewDeleteError: "Не вдалося видалити відгук.",
    adminStatusUpdated: "Статус адміністратора оновлено",
    adminStatusUpdateFailed: "Не вдалося оновити статус адміністратора",
    appointmentCreated: "Запис успішно створено",
    appointmentError: "Не вдалося створити запис",
    fillAllFields: "Заповніть всі обов'язкові поля",
    reviewsTab: "Відгуки клієнтів",
    pricesTab: "Ціни та тривалість",
    appointment: "Запис",
    appointments: "Записи",
    calendar: "Календар",
    date: "Дата",
    forDate: "На дату",
    unknownClient: "Невідомий клієнт",
    clientWithoutAccount: "Клієнт без акаунту",
    user: "Користувач",
    role: "Роль",
    adminAccess: "Доступ адміністратора",
    searchUsers: "Пошук користувачів...",
    noUsersFound: "Користувачів не знайдено",
    noAppointments: "Немає записів",
    noAppointmentsThisDay: "Немає записів на цю дату",
    completed: "Завершено",
    confirmed: "Підтверджено",
    pending: "Очікує",
    approved: "Схвалено",
    rejected: "Відхилено",
    cancelled: "Скасовано",
    add: "Додати",
    create: "Створити",
    delete: "Видалити",
    deleteConfirm: "Видалити цей елемент?",
    deleteWarning: "Цю дію не можна скасувати.",
    editPricesDesc: "Редагуйте ціни та тривалість курсів і процедур",
    moderationReviewsDesc: "Модерація відгуків користувачів",
    courseName: "Назва курсу",
    courseDescription: "Опис курсу",
    serviceName: "Назва послуги",
    addCourse: "Додати курс",
    addService: "Додати послугу",
    loadingReviews: "Завантаження відгуків...",
    noReviews: "Відгуків немає",
    saving: "Збереження...",
    added: "Додано",
    deleted: "Видалено",
    saveError: "Помилка збереження",
    deleteError: "Помилка видалення",
    addError: "Помилка додавання",
    uploadError: "Помилка завантаження зображення",
    service: "Послуга",
    appointmentsFor: "Записи на",
    calendarDesc: "Переглядайте та керуйте всіма записами за датою",
    userManagement: "Управління користувачами",
    totalUsers: "Всього користувачів",
    regularUsers: "Звичайні користувачі",
    unauthorized: "Неавторизований",
    accessDenied: "Доступ заборонено",
    adminAccessRequired: "Потрібен доступ адміністратора",
    errorLoadingUsers: "Помилка завантаження користувачів",
    firstName: "Ім'я",
    lastName: "Прізвище",
    confirmAppointment: "Підтвердити запис",
    rejectAppointment: "Відхилити запис",
    completeAppointment: "Завершити запис",
    cancelAppointment: "Скасувати запис",
    appointmentConfirmed: "Запис підтверджено",
    appointmentRejected: "Запис відхилено",
    appointmentCompleted: "Запис завершено",
    appointmentCancelled: "Запис скасовано",
    confirmAppointmentMessage: "Ви впевнені, що хочете підтвердити цей запис?",
    rejectAppointmentMessage: "Ви впевнені, що хочете відхилити цей запис?",
    completeAppointmentMessage: "Ви впевнені, що хочете завершити цей запис?",
    cancelAppointmentMessage: "Ви впевнені, що хочете скасувати цей запис?",
    appointmentStatusUpdated: "Статус запису оновлено",
    appointmentStatusUpdateFailed: "Не вдалося оновити статус запису",
    timeSlotUnavailable: "Цей час зайнятий",
    timeSlotAvailable: "Час доступний",
    pastTimeError: "Не можна бронювати записи в минулому",
    timeSlotAlreadyBooked: "Цей час вже заброньований",
    booked: "Заброньовано",
    deleteAppointment: "Видалити Запис",
    deleteAppointmentConfirm: "Ви впевнені, що хочете видалити цей запис з панелі адміністратора? (Він залишиться видимим в облікових записах користувачів)",
    appointmentDeleted: "Запис видалено з панелі адміністратора",
    appointmentDeleteError: "Не вдалося видалити запис",
    deleting: "Видалення...",
    
    // Delete dialogs
    deleteCourse: "Видалити Курс",
    deleteCourseConfirm: "Ви впевнені, що хочете видалити цей курс? Цю дію не можна скасувати.",
    deleteService: "Видалити Послугу",
    deleteServiceConfirm: "Ви впевнені, що хочете видалити цю послугу? Цю дію не можна скасувати."
  }
};