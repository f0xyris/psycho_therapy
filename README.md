# LaserTouch - Beauty Salon Website

A modern, responsive website for a beauty salon with appointment booking, course purchases, and automated email notifications.

## 🌟 Features

- **Appointment Booking System** - Easy online appointment scheduling
- **Course Purchases** - Secure payment processing with Stripe
- **Email Notifications** - Automated email system for appointments and purchases
- **Multi-language Support** - Ukrainian, English, Russian, and Polish
- **Admin Panel** - Complete management system for appointments, services, and courses
- **Responsive Design** - Works perfectly on all devices
- **Modern UI/UX** - Beautiful, intuitive interface

## 🚀 Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Payment:** Stripe integration
- **Email:** Nodemailer with SMTP
- **Authentication:** Passport.js with Google OAuth
- **Deployment:** Vercel-ready

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account
- Gmail account (for SMTP)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/f0xyris/LaserTouch.git
   cd LaserTouch
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL=your_postgresql_url

   # Stripe
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # SMTP
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # Session
   SESSION_SECRET=your_session_secret

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. **Run database migrations**

   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🌐 Deployment

Ready for Vercel (Hobby plan safe):

- Uses a single server bundle locally (`server/`) and serverless endpoints under `api/` for Vercel.
- Keep total serverless functions under Hobby limit (<= 12). Existing routes are consolidated; demo mode does not add extra functions.
- Environment variables required on Vercel: `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `SMTP_*` (if using emails), `BASE_URL`.

Steps:

1. Push the repo to GitHub.
2. Import in Vercel.
3. Set env vars.
4. Deploy.

Client is built with Vite; Vercel config (`vercel.json`) routes API calls to serverless functions and serves the SPA.

## 📧 Email System

The website includes a comprehensive email notification system:

- **Appointment Submitted** - Confirmation when user books appointment
- **Appointment Confirmed** - Notification when admin confirms appointment
- **Course Purchased** - Confirmation after successful course payment

## 🎨 Customization

- **Services:** Add/modify services in the admin panel
- **Courses:** Manage training courses through admin interface
- **Languages:** Add new languages by updating translation files
- **Styling:** Customize with Tailwind CSS classes

## 📱 Admin Features

- User management
- Appointment management
- Service and course management
- Review moderation
- Email testing interface

### Demo Admin Mode (Preview)

- Quick access link: `/login-admin`.
- After redirect, you’ll land on `/admin` as a demo admin.
- Privacy: personal data is masked (email/phone/name parts), notes hidden.
- Safety: any create/update/delete is simulated and not written to DB.
- You can fully navigate admin, open tabs, try creating services/courses; server returns simulated items.

To disable demo mode, just logout or clear the `auth_token` in LocalStorage.

## 🔒 Security

- Secure authentication with Passport.js
- CSRF protection
- Input validation with Zod
- Secure payment processing
- Environment variable protection

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please contact the development team.
