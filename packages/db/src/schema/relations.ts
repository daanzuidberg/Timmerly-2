import { relations } from 'drizzle-orm';
import { oneTimeTokens, sessions, users } from './auth';
import { availabilityDays, certificates, companyProfiles, professionalProfiles, verifications, workHistory } from './profiles';
import { applications, conversations, messages, projects, timesheetEntries, timesheets } from './projects';
import { favorites, notifications, reports, reviews, savedProjects } from './social';

/** Relaties voor de query-API (`db.query.x.findMany({ with: ... })`). */
export const usersRelations = relations(users, ({ one, many }) => ({
  professionalProfile: one(professionalProfiles, { fields: [users.id], references: [professionalProfiles.userId] }),
  companyProfile: one(companyProfiles, { fields: [users.id], references: [companyProfiles.userId] }),
  sessions: many(sessions),
  tokens: many(oneTimeTokens),
  verifications: many(verifications),
  notifications: many(notifications),
  reviewsReceived: many(reviews, { relationName: 'subject' })
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({ user: one(users, { fields: [sessions.userId], references: [users.id] }) }));

export const professionalProfilesRelations = relations(professionalProfiles, ({ one, many }) => ({
  user: one(users, { fields: [professionalProfiles.userId], references: [users.id] }),
  certificates: many(certificates),
  availabilityDays: many(availabilityDays),
  workHistory: many(workHistory),
  applications: many(applications)
}));

export const companyProfilesRelations = relations(companyProfiles, ({ one, many }) => ({
  user: one(users, { fields: [companyProfiles.userId], references: [users.id] }),
  projects: many(projects)
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({ profile: one(professionalProfiles, { fields: [certificates.profileId], references: [professionalProfiles.id] }) }));
export const availabilityDaysRelations = relations(availabilityDays, ({ one }) => ({ profile: one(professionalProfiles, { fields: [availabilityDays.profileId], references: [professionalProfiles.id] }) }));
export const workHistoryRelations = relations(workHistory, ({ one }) => ({ profile: one(professionalProfiles, { fields: [workHistory.profileId], references: [professionalProfiles.id] }) }));
export const verificationsRelations = relations(verifications, ({ one }) => ({ user: one(users, { fields: [verifications.userId], references: [users.id] }) }));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  company: one(companyProfiles, { fields: [projects.companyId], references: [companyProfiles.id] }),
  applications: many(applications),
  savedBy: many(savedProjects)
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  project: one(projects, { fields: [applications.projectId], references: [projects.id] }),
  profile: one(professionalProfiles, { fields: [applications.profileId], references: [professionalProfiles.id] }),
  conversation: one(conversations, { fields: [applications.id], references: [conversations.applicationId] }),
  timesheets: many(timesheets),
  reviews: many(reviews)
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  application: one(applications, { fields: [conversations.applicationId], references: [applications.id] }),
  messages: many(messages)
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] })
}));

export const timesheetsRelations = relations(timesheets, ({ one, many }) => ({
  application: one(applications, { fields: [timesheets.applicationId], references: [applications.id] }),
  entries: many(timesheetEntries)
}));
export const timesheetEntriesRelations = relations(timesheetEntries, ({ one }) => ({ timesheet: one(timesheets, { fields: [timesheetEntries.timesheetId], references: [timesheets.id] }) }));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  application: one(applications, { fields: [reviews.applicationId], references: [applications.id] }),
  author: one(users, { fields: [reviews.authorId], references: [users.id], relationName: 'author' }),
  subject: one(users, { fields: [reviews.subjectId], references: [users.id], relationName: 'subject' })
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  owner: one(users, { fields: [favorites.ownerId], references: [users.id], relationName: 'owner' }),
  target: one(users, { fields: [favorites.targetId], references: [users.id], relationName: 'target' })
}));
export const savedProjectsRelations = relations(savedProjects, ({ one }) => ({
  project: one(projects, { fields: [savedProjects.projectId], references: [projects.id] }),
  user: one(users, { fields: [savedProjects.userId], references: [users.id] })
}));
export const notificationsRelations = relations(notifications, ({ one }) => ({ user: one(users, { fields: [notifications.userId], references: [users.id] }) }));
export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, { fields: [reports.reporterId], references: [users.id], relationName: 'reporter' }),
  targetUser: one(users, { fields: [reports.targetUserId], references: [users.id], relationName: 'targetUser' }),
  targetProject: one(projects, { fields: [reports.targetProjectId], references: [projects.id] })
}));
