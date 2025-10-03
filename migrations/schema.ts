import { pgTable, foreignKey, serial, integer, timestamp, text, index, varchar, jsonb, unique, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const appointments = pgTable("appointments", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	serviceId: integer("service_id").notNull(),
	appointmentDate: timestamp("appointment_date", { mode: 'string' }).notNull(),
	status: text().default('pending').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "appointments_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "appointments_service_id_services_id_fk"
		}),
]);

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: varchar().notNull(),
	password: varchar(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	googleId: varchar("google_id"),
	phone: text(),
	isAdmin: boolean("is_admin").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_google_id_unique").on(table.googleId),
]);

export const courses = pgTable("courses", {
	id: serial().primaryKey().notNull(),
	name: jsonb().notNull(),
	description: jsonb().notNull(),
	price: integer().notNull(),
	duration: integer().notNull(),
	category: text().notNull(),
	imageUrl: text("image_url"),
});

export const reviews = pgTable("reviews", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	serviceId: integer("service_id"),
	name: varchar(),
	rating: integer().notNull(),
	comment: text().notNull(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reviews_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "reviews_service_id_services_id_fk"
		}),
]);

export const services = pgTable("services", {
	id: serial().primaryKey().notNull(),
	name: jsonb().notNull(),
	description: jsonb().notNull(),
	price: integer().notNull(),
	duration: integer().notNull(),
	category: text().notNull(),
});
