import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  decimal,
  varchar,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for local authentication and Google OAuth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // For local auth, null for OAuth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id").unique(), // For Google OAuth
  phone: text("phone"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: jsonb("name").notNull(),
  description: jsonb("description").notNull(),
  price: integer("price").notNull(), // price in kopecks
  duration: integer("duration").notNull(), // duration in minutes
  category: text("category").notNull(), // 'laser', 'massage', 'spa', 'training'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // теперь не обязательное для клиентов без аккаунта
  serviceId: integer("service_id").references(() => services.id).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  isOnline: boolean("is_online").default(false),
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'completed', 'cancelled'
  notes: text("notes"),
  messengerType: text("messenger_type"),
  messengerContact: text("messenger_contact"),
  isDeletedFromAdmin: boolean("is_deleted_from_admin").default(false), // новое поле для отслеживания удаления из админки
  // Поля для клиентов без аккаунта
  clientName: varchar("client_name"),
  clientPhone: varchar("client_phone"),
  clientEmail: varchar("client_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // теперь не notNull
  serviceId: integer("service_id").references(() => services.id), // теперь не notNull
  name: varchar("name"), // новое поле для имени
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment").notNull(),
  status: text("status").notNull().default("pending"), // новое поле для модерации
  createdAt: timestamp("created_at").defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: jsonb("name").notNull(),
  description: jsonb("description").notNull(),
  price: integer("price").notNull(), // price in kopecks
  duration: integer("duration").notNull(), // duration in hours
  category: text("category").notNull(),
  imageUrl: text("image_url"), // ссылка на картинку
  docUrl: text("doc_url"), // ссылка на загруженный документ (docx/pdf)
});

// Working hours per specific calendar date (YYYY-MM-DD) with a single active range
export const workingHours = pgTable("working_hours", {
  id: serial("id").primaryKey(),
  date: varchar("date").notNull().unique(),
  startTime: varchar("start_time").notNull(), // format HH:mm
  endTime: varchar("end_time").notNull(),   // format HH:mm
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as any);

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
} as any);

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
} as any).extend({
  userId: z.number().optional(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
} as any);

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
} as any);

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

// Types for working hours
export type WorkingHours = typeof workingHours.$inferSelect;
