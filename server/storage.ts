import {
  users,
  services,
  appointments,
  reviews,
  courses,
  workingHours,
  type User,
  type Service,
  type Appointment,
  type Review,
  type Course,
  type InsertUser,
  type InsertService,
  type InsertAppointment,
  type InsertReview,
} from "../shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, or, gte, lt, ne, sql } from "drizzle-orm";
import session from "express-session";
import pgSimple from "connect-pg-simple";

// Interface for storage operations
export interface IStorage {
  // User operations for local and OAuth authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserAdminStatus(id: number, isAdmin: boolean): Promise<User>;
  
  // Service operations
  getAllServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  getService(id: number): Promise<Service | undefined>;
  deleteService(id: number): Promise<void>;
  
  // Appointment operations
  getAllAppointments(): Promise<any[]>;
  getAppointmentsByUserId(userId: number): Promise<any[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  createAppointmentForClient(appointment: any): Promise<Appointment>;
  getRecentAppointments(limit?: number): Promise<any[]>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined>;
  getAppointmentById(id: number): Promise<any | undefined>;
  getConflictingAppointments(startDate: Date, endDate: Date, excludeId?: number): Promise<any[]>;
  deleteAppointment(id: number): Promise<void>;

  // Working hours operations
  getWorkingHoursByDate(date: string): Promise<{ id: number; date: string; startTime: string; endTime: string } | null>;
  upsertWorkingHours(date: string, startTime: string, endTime: string): Promise<{ id: number; date: string; startTime: string; endTime: string }>;

  getAllReviews(): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  rejectReview(id: number): Promise<Review | undefined>;
  deleteReview(id: number): Promise<void>;

  getAllCourses(): Promise<Course[]>;
  createCourse(course: typeof courses.$inferInsert): Promise<Course>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseById(id: number): Promise<Course | undefined>;
  updateCourse(id: number, data: Partial<Course>): Promise<Course>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    if (process.env.NODE_ENV === "production") {
      const PostgresStore = pgSimple(session);
      this.sessionStore = new PostgresStore({
        pool,
        tableName: 'sessions',
        createTableIfMissing: true,
      });
    } else {
      this.sessionStore = new session.MemoryStore();
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as any)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() } as any)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserAdminStatus(id: number, isAdmin: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isAdmin, updatedAt: new Date() } as any)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllServices(): Promise<Service[]> {
    const servicesData = await db.select().from(services);
    return servicesData;
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(serviceData as any)
      .returning();
    return service;
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async updateService(id: number, data: Partial<Service>): Promise<Service> {
    const [service] = await db
      .update(services)
      .set({ ...data })
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getAllAppointments(): Promise<any[]> {
    const result = await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        isOnline: appointments.isOnline,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        clientName: appointments.clientName,
        clientPhone: appointments.clientPhone,
        clientEmail: appointments.clientEmail,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
        },
        service: {
          id: services.id,
          name: services.name,
          duration: services.duration,
          price: services.price,
        },
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.isDeletedFromAdmin, false))
      .orderBy(desc(appointments.createdAt));
    
    return result;
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined> {
    const [appointment] = await db
      .update(appointments)
      .set({ status } as any)
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }

  async getAppointmentById(id: number): Promise<any | undefined> {
    const [appointment] = await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        clientName: appointments.clientName,
        clientPhone: appointments.clientPhone,
        clientEmail: appointments.clientEmail,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
        },
        service: {
          id: services.id,
          name: services.name,
          duration: services.duration,
          price: services.price,
        },
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.id, id));
    return appointment;
  }

  async getConflictingAppointments(startDate: Date, endDate: Date, excludeId?: number): Promise<any[]> {
    const conditions = [
      eq(appointments.status, "confirmed"),
              eq(appointments.isDeletedFromAdmin, false),
      or(
        and(
          gte(appointments.appointmentDate, startDate),
          lt(appointments.appointmentDate, endDate)
        ),
        and(
          lt(appointments.appointmentDate, startDate),
          gte(
            sql`${appointments.appointmentDate} + INTERVAL '1 minute' * ${services.duration}`,
            startDate
          )
        )
      )
    ];

    if (excludeId) {
      conditions.push(ne(appointments.id, excludeId));
    }

    return await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        status: appointments.status,
        service: {
          id: services.id,
          duration: services.duration,
        },
      })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(and(...conditions));
  }

  async deleteAppointment(id: number): Promise<void> {
    try {
      await db.delete(appointments).where(eq(appointments.id, id));
    } catch (error) {
      console.error(`Error deleting appointment ${id}:`, error);
      throw error;
    }
  }

  async getWorkingHoursByDate(date: string): Promise<{ id: number; date: string; startTime: string; endTime: string } | null> {
    const [row] = await db
      .select({
        id: workingHours.id,
        date: workingHours.date,
        startTime: workingHours.startTime,
        endTime: workingHours.endTime,
      })
      .from(workingHours)
      .where(eq(workingHours.date, date));
    return row || null;
  }

  async upsertWorkingHours(date: string, startTime: string, endTime: string): Promise<{ id: number; date: string; startTime: string; endTime: string }> {
    const existing = await this.getWorkingHoursByDate(date);
    if (existing) {
      const [updated] = await db
        .update(workingHours)
        .set({ startTime, endTime, updatedAt: new Date() } as any)
        .where(eq(workingHours.id, existing.id))
        .returning({ id: workingHours.id, date: workingHours.date, startTime: workingHours.startTime, endTime: workingHours.endTime });
      return updated;
    }
    const [inserted] = await db
      .insert(workingHours)
      .values({ date, startTime, endTime } as any)
      .returning({ id: workingHours.id, date: workingHours.date, startTime: workingHours.startTime, endTime: workingHours.endTime });
    return inserted;
  }

  async getAppointmentsByUserId(userId: number): Promise<any[]> {
    return await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        isOnline: appointments.isOnline,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        service: {
          id: services.id,
          name: services.name,
          duration: services.duration,
          price: services.price,
        },
      })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.userId, userId))
      .orderBy(desc(appointments.appointmentDate));
  }

  async createAppointment(appointmentData: any): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(appointmentData)
      .returning();
    return appointment;
  }

  async createAppointmentForClient(appointmentData: any): Promise<Appointment> {
    const appointmentDataForClient = {
      ...appointmentData,
      userId: null,
      clientName: appointmentData.clientInfo?.name || null,
      clientPhone: appointmentData.clientInfo?.phone || null,
      clientEmail: appointmentData.clientInfo?.email || null,
    };
    
    delete appointmentDataForClient.clientInfo;
    
    const [appointment] = await db
      .insert(appointments)
      .values(appointmentDataForClient)
      .returning();
    
    return appointment;
  }

  async getRecentAppointments(limit = 10): Promise<any[]> {
    const result = await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        clientName: appointments.clientName,
        clientPhone: appointments.clientPhone,
        clientEmail: appointments.clientEmail,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
        },
        service: {
          id: services.id,
          name: services.name,
          duration: services.duration,
          price: services.price,
        },
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.isDeletedFromAdmin, false))
      .orderBy(desc(appointments.createdAt))
      .limit(limit);
    
    return result;
  }

  async getAllReviews(): Promise<Review[]> {
    return await db.select().from(reviews);
  }

  async getReviewsByStatus(status: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.status, status));
  }

  async approveReview(id: number): Promise<Review | undefined> {
    const [review] = await db
      .update(reviews)
      .set({ status: "approved" } as any)
      .where(eq(reviews.id, id))
      .returning();
    return review;
  }

  async rejectReview(id: number): Promise<Review | undefined> {
    const [review] = await db
      .update(reviews)
      .set({ status: "rejected" } as any)
      .where(eq(reviews.id, id))
      .returning();
    return review;
  }

  async deleteReview(id: number): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(reviewData as any)
      .returning();
    return review;
  }

  async getAllCourses(): Promise<Course[]> {
    const coursesData = await db.select().from(courses);
    return coursesData;
  }

  async createCourse(courseData: typeof courses.$inferInsert): Promise<Course> {
    const { id, ...data } = courseData as any;
    const [course] = await db
      .insert(courses)
      .values(data)
      .returning();
    return course;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseById(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async updateCourse(id: number, data: Partial<Course>): Promise<Course> {
    const [course] = await db
      .update(courses)
      .set({ ...(data as any) })
      .where(eq(courses.id, id))
      .returning();
    return course;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }
}

export const storage = new DatabaseStorage();