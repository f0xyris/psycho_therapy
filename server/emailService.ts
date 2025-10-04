import nodemailer from 'nodemailer';

const emailConfig = {
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.SMTP_USER || '',
    clientId: process.env.GMAIL_CLIENT_ID || '',
    clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
    refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
    accessToken: process.env.GMAIL_ACCESS_TOKEN || ''
  }
};

const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
};

const transporter = nodemailer.createTransport(
  emailConfig.auth.clientId ? emailConfig as any : smtpConfig
);

const emailTemplates = {
  appointmentSubmitted: {
    subject: {
      ua: 'Ваша заявка на запис прийнята',
      en: 'Your appointment request has been submitted',
      ru: 'Ваша заявка на запись принята',
      pl: 'Twoja prośba o wizytę została złożona'
    },
    body: {
      ua: `
        <!DOCTYPE html>
        <html lang="uk">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Заявка прийнята</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">📅</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Заявка прийнята!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Ваша заявка успішно подана</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Доброго дня!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Дякуємо за запис на прийом. Ваша заявка успішно подана і знаходиться на розгляді модератора.</p>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #8b5cf6;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Деталі запису</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Послуга:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{serviceName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Дата:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Час:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentTime}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #6366f1; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">4</span>
                    <span style="color: #6b7280; font-size: 14px;">Формат:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentFormat}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">!</span>
                    <span style="color: #6b7280; font-size: 14px;">Статус:</span>
                    <span style="color: #f59e0b; font-weight: 600; margin-left: 8px;">Очікує підтвердження</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Ми повідомимо вас електронною поштою, коли модератор підтвердить ваш запис.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}" style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">Переглянути сайт</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">З найкращими побажаннями, від</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">Анни Кухарської</p>
            </div>
          </div>
        </body>
        </html>
      `,
      en: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Submitted</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">📅</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Appointment Submitted!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Your request has been successfully submitted</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Hello!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Thank you for booking an appointment. Your request has been successfully submitted and is under moderator review.</p>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #8b5cf6;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Appointment Details</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Service:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{serviceName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Date:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Time:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentTime}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">4</span>
                    <span style="color: #6b7280; font-size: 14px;">Format:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentFormat}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #6366f1; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">4</span>
                    <span style="color: #6b7280; font-size: 14px;">Format:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentFormat}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">!</span>
                    <span style="color: #6b7280; font-size: 14px;">Status:</span>
                    <span style="color: #f59e0b; font-weight: 600; margin-left: 8px;">Pending confirmation</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">We will notify you by email when the moderator confirms your appointment.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}" style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">Visit Website</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">Best regards,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">LaserTouch Team</p>
              <div style="margin-top: 20px;">
                <span style="color: #8b5cf6; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      ru: `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Заявка принята</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">📅</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Заявка принята!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Ваша заявка успешно подана</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Добрый день!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Спасибо за запись на прием. Ваша заявка успешно подана и находится на рассмотрении модератора.</p>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #8b5cf6;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Детали записи</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Услуга:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{serviceName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Дата:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Время:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentTime}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">!</span>
                    <span style="color: #6b7280; font-size: 14px;">Статус:</span>
                    <span style="color: #f59e0b; font-weight: 600; margin-left: 8px;">Ожидает подтверждения</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Мы уведомим вас по электронной почте, когда модератор подтвердит вашу запись.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}" style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">Посетить сайт</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">С наилучшими пожеланиями,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">Команда LaserTouch</p>
              <div style="margin-top: 20px;">
                <span style="color: #8b5cf6; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      pl: `
        <!DOCTYPE html>
        <html lang="pl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Wniosek złożony</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">📅</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Wniosek złożony!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Twoja prośba została pomyślnie złożona</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Dzień dobry!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Dziękujemy za umówienie wizyty. Twoja prośba została pomyślnie złożona i jest w trakcie przeglądu przez moderatora.</p>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #8b5cf6;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Szczegóły wizyty</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Usługa:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{serviceName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Data:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Godzina:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentTime}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">!</span>
                    <span style="color: #6b7280; font-size: 14px;">Status:</span>
                    <span style="color: #f59e0b; font-weight: 600; margin-left: 8px;">Oczekuje potwierdzenia</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Powiadomimy Cię e-mailem, gdy moderator potwierdzi Twoją wizytę.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}" style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">Odwiedź stronę</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">Z poważaniem,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">Zespół LaserTouch</p>
              <div style="margin-top: 20px;">
                <span style="color: #8b5cf6; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }
  },
  appointmentConfirmed: {
    subject: {
      ua: 'Ваш запис підтверджено',
      en: 'Your appointment has been confirmed',
      ru: 'Ваша запись подтверждена',
      pl: 'Twoja wizyta została potwierdzona'
    },
    body: {
      ua: `
        <!DOCTYPE html>
        <html lang="uk">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Запис підтверджено</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">✅</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Запис підтверджено!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Ваш запис на прийом підтверджено</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Доброго дня!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Раді повідомити, що ваш запис на прийом підтверджено модератором.</p>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Деталі запису</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Послуга:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{serviceName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Дата:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Час:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentTime}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">!</span>
                    <span style="color: #6b7280; font-size: 14px;">Статус:</span>
                    <span style="color: #10b981; font-weight: 600; margin-left: 8px;">Підтверджено</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Будь ласка, приходьте за 10 хвилин до призначеного часу.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}" style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">Переглянути сайт</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">З найкращими побажаннями,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">Команда LaserTouch</p>
              <div style="margin-top: 20px;">
                <span style="color: #10b981; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      en: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">✅</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Appointment Confirmed!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Your appointment has been confirmed</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Hello!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">We are pleased to inform you that your appointment has been confirmed by the moderator.</p>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Appointment Details</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Service:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{serviceName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Date:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Time:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentTime}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">!</span>
                    <span style="color: #6b7280; font-size: 14px;">Status:</span>
                    <span style="color: #10b981; font-weight: 600; margin-left: 8px;">Confirmed</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Please arrive 10 minutes before the scheduled time.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}" style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">Visit Website</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">Best regards,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">LaserTouch Team</p>
              <div style="margin-top: 20px;">
                <span style="color: #10b981; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      ru: `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Запис подтверждена</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">✅</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Запис подтверждена!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Ваша запись подтверждена</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Добрый день!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Рады сообщить, что ваша запись на прием подтверждена модератором.</p>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Детали записи</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Услуга:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{serviceName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Дата:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Время:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentTime}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">!</span>
                    <span style="color: #6b7280; font-size: 14px;">Статус:</span>
                    <span style="color: #10b981; font-weight: 600; margin-left: 8px;">Подтверждено</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Пожалуйста, приходите за 10 минут до назначенного времени.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}" style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">Посетить сайт</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">С наилучшими пожеланиями,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">Команда LaserTouch</p>
              <div style="margin-top: 20px;">
                <span style="color: #10b981; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      pl: `
        <!DOCTYPE html>
        <html lang="pl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Wizyta potwierdzona</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">✅</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Wizyta potwierdzona!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Twoja wizyta została potwierdzona</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Dzień dobry!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Miło nam poinformować, że Twoja wizyta została potwierdzona przez moderatora.</p>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Szczegóły wizyty</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Usługa:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{serviceName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Data:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Godzina:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentTime}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">!</span>
                    <span style="color: #6b7280; font-size: 14px;">Status:</span>
                    <span style="color: #10b981; font-weight: 600; margin-left: 8px;">Potwierdzona</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Prosimy przyjść 10 minut przed umówionym czasem.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}" style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">Odwiedź stronę</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">Z poważaniem,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">Zespół LaserTouch</p>
              <div style="margin-top: 20px;">
                <span style="color: #10b981; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }
  },
  coursePurchased: {
    subject: {
      ua: 'Курс успішно придбано',
      en: 'Course successfully purchased',
      ru: 'Курс успешно приобретен',
      pl: 'Kurs został pomyślnie zakupiony'
    },
    body: {
      ua: `
        <!DOCTYPE html>
        <html lang="uk">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Курс успішно придбано</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">🎓</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Курс успішно придбано!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Дякуємо за покупку курсу навчання</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Доброго дня!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Дякуємо за покупку курсу навчання. Ваш платіж успішно оброблено.</p>
              
              <!-- Course Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Деталі курсу</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Назва курсу:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{courseName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Тривалість:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{courseDuration}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Вартість:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{coursePrice}</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Наші інструктори зв\'яжуться з вами найближчим часом для узгодження деталей навчання.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">Переглянути сайт</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">З найкращими побажаннями,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">Команда LaserTouch</p>
              <div style="margin-top: 20px;">
                <span style="color: #f59e0b; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      en: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Course Successfully Purchased</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">🎓</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Course Successfully Purchased!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Thank you for purchasing the training course</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Hello!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Thank you for purchasing the training course. Your payment has been successfully processed.</p>
              
              <!-- Course Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Course Details</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Course name:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{courseName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Duration:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{courseDuration}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Price:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{coursePrice}</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Our instructors will contact you soon to coordinate the training details.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">Visit Website</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">Best regards,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">LaserTouch Team</p>
              <div style="margin-top: 20px;">
                <span style="color: #f59e0b; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      ru: `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Курс успешно приобретен</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">🎓</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Курс успешно приобретен!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Спасибо за покупку курса обучения</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Добрый день!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Спасибо за покупку курса обучения. Ваш платеж успешно обработан.</p>
              
              <!-- Course Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Детали курса</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Название курса:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{courseName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Продолжительность:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{courseDuration}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Стоимость:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{coursePrice}</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Наши инструкторы свяжутся с вами в ближайшее время для согласования деталей обучения.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">Посетить сайт</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">С наилучшими пожеланиями,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">Команда LaserTouch</p>
              <div style="margin-top: 20px;">
                <span style="color: #f59e0b; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      pl: `
        <!DOCTYPE html>
        <html lang="pl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Kurs został pomyślnie zakupiony</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">🎓</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Kurs został pomyślnie zakupiony!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Dziękujemy za zakup kursu szkoleniowego</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Dzień dobry!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Dziękujemy za zakup kursu szkoleniowego. Twoja płatność została pomyślnie przetworzona.</p>
              
              <!-- Course Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Szczegóły kursu</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Nazwa kursu:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{courseName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Czas trwania:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{courseDuration}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Cena:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{coursePrice}</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Nasi instruktorzy skontaktują się z Tobą wkrótce, aby uzgodnić szczegóły szkolenia.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">Odwiedź stronę</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">Z poważaniem,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">Zespół LaserTouch</p>
              <div style="margin-top: 20px;">
                <span style="color: #f59e0b; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }
  },
  
  // Admin notification for new appointments
  adminAppointmentNotification: {
    subject: {
      ua: 'Новий запис на прийом - потребує підтвердження',
      en: 'New appointment booking - requires confirmation',
      ru: 'Новая запись на прием - требует подтверждения',
      pl: 'Nowa rezerwacja wizyty - wymaga potwierdzenia'
    },
    body: {
      ua: `
        <!DOCTYPE html>
        <html lang="uk">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Новий запис на прийом</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">🔔</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Новий запис на прийом!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Потребує підтвердження</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Доброго дня!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Отримано новий запис на прийом. Клієнт очікує підтвердження.</p>
              
              <!-- Client Details Card -->
              <div style="background-color: #fef2f2; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #dc2626;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">👤 Інформація про клієнта</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Ім'я:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{clientName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Email:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{clientEmail}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Телефон:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{clientPhone}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">💬</span>
                    <span style="color: #6b7280; font-size: 14px;">Месенджер:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{messengerInfo}</span>
                  </div>
                </div>
              </div>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #8b5cf6;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Деталі запису</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Послуга:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{serviceName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Дата:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Час:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentTime}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #6366f1; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">4</span>
                    <span style="color: #6b7280; font-size: 14px;">Формат:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentFormat}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; margin-right: 12px;">!</span>
                    <span style="color: #6b7280; font-size: 14px;">Статус:</span>
                    <span style="color: #f59e0b; font-weight: 600; margin-left: 8px;">Очікує підтвердження</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Будь ласка, підтвердіть або відхиліть цей запис в адміністративній панелі.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}/admin" style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">Перейти до адмін панелі</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">З найкращими побажаннями,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">Система LaserTouch</p>
              <div style="margin-top: 20px;">
                <span style="color: #dc2626; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      en: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Appointment Booking</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">🔔</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">New Appointment Booking!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Requires confirmation</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Hello!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">A new appointment booking has been received. The client is awaiting confirmation.</p>
              
              <!-- Client Details Card -->
              <div style="background-color: #fef2f2; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #dc2626;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">👤 Client Information</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Name:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{clientName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Email:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{clientEmail}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Phone:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{clientPhone}</span>
                  </div>
                </div>
              </div>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #8b5cf6;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Appointment Details</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Service:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{serviceName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Date:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Time:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentTime}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">!</span>
                    <span style="color: #6b7280; font-size: 14px;">Status:</span>
                    <span style="color: #f59e0b; font-weight: 600; margin-left: 8px;">Awaiting confirmation</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Please confirm or reject this appointment in the admin panel.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}/admin" style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">Go to Admin Panel</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">Best regards,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">LaserTouch System</p>
              <div style="margin-top: 20px;">
                <span style="color: #dc2626; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      ru: `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Новая запись на прием</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">🔔</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Новая запись на прием!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Требует подтверждения</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Добрый день!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Получена новая запись на прием. Клиент ожидает подтверждения.</p>
              
              <!-- Client Details Card -->
              <div style="background-color: #fef2f2; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #dc2626;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">👤 Информация о клиенте</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Имя:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{clientName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Email:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{clientEmail}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Телефон:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{clientPhone}</span>
                  </div>
                </div>
              </div>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #8b5cf6;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Детали записи</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Услуга:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{serviceName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Дата:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Время:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentTime}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">!</span>
                    <span style="color: #6b7280; font-size: 14px;">Статус:</span>
                    <span style="color: #f59e0b; font-weight: 600; margin-left: 8px;">Ожидает подтверждения</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Пожалуйста, подтвердите или отклоните эту запись в административной панели.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}/admin" style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">Перейти в админ панель</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">С наилучшими пожеланиями,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">Система LaserTouch</p>
              <div style="margin-top: 20px;">
                <span style="color: #dc2626; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      pl: `
        <!DOCTYPE html>
        <html lang="pl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nowa rezerwacja wizyty</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px; color: white; width: 100%; display: flex; justify-content: center; align-items: center;">🔔</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Nowa rezerwacja wizyty!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Wymaga potwierdzenia</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Dzień dobry!</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Otrzymano nową rezerwację wizyty. Klient oczekuje potwierdzenia.</p>
              
              <!-- Client Details Card -->
              <div style="background-color: #fef2f2; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #dc2626;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">👤 Informacje o kliencie</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Imię:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{clientName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Email:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{clientEmail}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Telefon:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{clientPhone}</span>
                  </div>
                </div>
              </div>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #8b5cf6;">
                <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">📋 Szczegóły wizyty</h3>
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">1</span>
                    <span style="color: #6b7280; font-size: 14px;">Usługa:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{serviceName}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">2</span>
                    <span style="color: #6b7280; font-size: 14px;">Data:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #8b5cf6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">3</span>
                    <span style="color: #6b7280; font-size: 14px;">Czas:</span>
                    <span style="color: #111827; font-weight: 500; margin-left: 8px;">{appointmentTime}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px;">!</span>
                    <span style="color: #6b7280; font-size: 14px;">Status:</span>
                    <span style="color: #f59e0b; font-weight: 600; margin-left: 8px;">Oczekuje potwierdzenia</span>
                  </div>
                </div>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Proszę potwierdzić lub odrzucić tę rezerwację w panelu administracyjnym.</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{SITE_URL}/admin" style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">Przejdź do panelu admin</a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">Z poważaniem,</p>
              <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0;">System LaserTouch</p>
              <div style="margin-top: 20px;">
                <span style="color: #dc2626; font-size: 24px; font-weight: bold;">LaserTouch</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }
};

function formatDate(date: Date, language: string = 'ua'): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  const locales = {
    ua: 'uk-UA',
    en: 'en-US',
    ru: 'ru-RU',
    pl: 'pl-PL'
  };
  
  return date.toLocaleDateString(locales[language as keyof typeof locales] || 'uk-UA', options);
}

function formatTime(date: Date, language: string = 'ua'): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const locales = {
    ua: 'uk-UA',
    en: 'en-US',
    ru: 'ru-RU',
    pl: 'pl-PL'
  };
  
  return date.toLocaleTimeString(locales[language as keyof typeof locales] || 'uk-UA', options);
}

async function sendEmail(to: string, template: keyof typeof emailTemplates, data: any, language: string = 'ua') {
  try {
    const emailTemplate = emailTemplates[template];
    const subject = emailTemplate.subject[language as keyof typeof emailTemplate.subject] || emailTemplate.subject.ua;
    
    let body = emailTemplate.body[language as keyof typeof emailTemplate.body] || emailTemplate.body.ua;

    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      body = body.replace(new RegExp(placeholder, 'g'), data[key]);
    });

    body = body.replace(/{SITE_URL}/g, process.env.SITE_URL || 'https://psycho-therapy.vercel.app');
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'LaserTouch'}" <${process.env.SMTP_USER || 'noreply@lasertouch.com'}>`,
      to: to,
      subject: subject,
      html: body
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

function getAppointmentFormat(language: string, isOnline: boolean): string {
  const map: Record<string, { online: string; offline: string }> = {
    ua: { online: 'Онлайн', offline: 'Офлайн' },
    ru: { online: 'Онлайн', offline: 'Офлайн' },
    en: { online: 'Online', offline: 'Offline' },
    pl: { online: 'Online', offline: 'Offline' },
  };
  const m = map[language] || map['ua'];
  return isOnline ? m.online : m.offline;
}

export async function sendAppointmentSubmittedEmail(
  userEmail: string, 
  serviceName: string, 
  appointmentDate: Date,
  isOnline: boolean,
  language: string = 'ua'
) {
  const data = {
    serviceName: serviceName,
    appointmentDate: formatDate(appointmentDate, language),
    appointmentTime: formatTime(appointmentDate, language),
    appointmentFormat: getAppointmentFormat(language, isOnline)
  };
  
  return sendEmail(userEmail, 'appointmentSubmitted', data, language);
}

export async function sendAppointmentConfirmedEmail(
  userEmail: string, 
  serviceName: string, 
  appointmentDate: Date,
  isOnline: boolean,
  language: string = 'ua'
) {
  const data = {
    serviceName: serviceName,
    appointmentDate: formatDate(appointmentDate, language),
    appointmentTime: formatTime(appointmentDate, language),
    appointmentFormat: getAppointmentFormat(language, isOnline)
  };
  
  return sendEmail(userEmail, 'appointmentConfirmed', data, language);
}

export async function sendCoursePurchasedEmail(
  userEmail: string, 
  courseName: string, 
  courseDuration: string, 
  coursePrice: string, 
  language: string = 'ua'
) {
  const data = {
    courseName: courseName,
    courseDuration: courseDuration,
    coursePrice: coursePrice
  };
  
  return sendEmail(userEmail, 'coursePurchased', data, language);
}

export async function sendAdminAppointmentNotification(
  adminEmail: string,
  clientName: string,
  clientEmail: string,
  clientPhone: string,
  serviceName: string,
  appointmentDate: Date,
  isOnline: boolean,
  language: string = 'ua',
  messengerType: string | null = null,
  messengerContact: string | null = null
) {
  const messengerNames: { [key: string]: string } = {
    telegram: 'Telegram',
    instagram: 'Instagram',
    viber: 'Viber',
    whatsapp: 'WhatsApp'
  };
  
  const messengerInfo = messengerType && messengerContact
    ? `${messengerNames[messengerType] || messengerType}: ${messengerContact}`
    : 'Не вказано';
  
  const data = {
    clientName: clientName,
    clientEmail: clientEmail,
    clientPhone: clientPhone,
    serviceName: serviceName,
    appointmentDate: formatDate(appointmentDate, language),
    appointmentTime: formatTime(appointmentDate, language),
    appointmentFormat: getAppointmentFormat(language, isOnline),
    messengerInfo: messengerInfo
  };
  
  return sendEmail(adminEmail, 'adminAppointmentNotification', data, language);
}

export async function testEmailConfiguration() {
  try {
    await transporter.verify();

    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
} 