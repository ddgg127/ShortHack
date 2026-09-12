import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const solvedRequests = sqliteTable('solved_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketId: text('ticket_id').notNull(),
  description: text('description').notNull(),
  summary: text('summary').notNull(),
  category: text('category').notNull(),
  priority: text('priority').notNull(),
  missing: text('missing').notNull(),
  nextAction: text('next_action').notNull(),
  draft: text('draft').notNull(),
  source: text('source').notNull(),
  confidence: integer('confidence').notNull(),
  resolvedAt: text('resolved_at').notNull()
}, (table) => [
  uniqueIndex('idx_solved_requests_ticket_id').on(table.ticketId),
  index('idx_solved_requests_resolved_at').on(table.resolvedAt)
]);
