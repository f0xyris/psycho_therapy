import { relations } from "drizzle-orm/relations";
import { users, appointments, services, reviews } from "./schema";

export const appointmentsRelations = relations(appointments, ({one}) => ({
	user: one(users, {
		fields: [appointments.userId],
		references: [users.id]
	}),
	service: one(services, {
		fields: [appointments.serviceId],
		references: [services.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	appointments: many(appointments),
	reviews: many(reviews),
}));

export const servicesRelations = relations(services, ({many}) => ({
	appointments: many(appointments),
	reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
	service: one(services, {
		fields: [reviews.serviceId],
		references: [services.id]
	}),
}));