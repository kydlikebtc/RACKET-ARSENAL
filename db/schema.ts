import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const decisionRooms = sqliteTable("decision_rooms", {
  ownerKey: text("owner_key").primaryKey(),
  baselineId: text("baseline_id"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const decisionCandidates = sqliteTable(
  "decision_candidates",
  {
    ownerKey: text("owner_key")
      .notNull()
      .references(() => decisionRooms.ownerKey, { onDelete: "cascade" }),
    racketId: text("racket_id").notNull(),
    status: text("status", {
      enum: ["candidate", "trial", "eliminated", "final"],
    }).notNull(),
    note: text("note").notNull().default(""),
    sortOrder: integer("sort_order").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.ownerKey, table.racketId] }),
    index("decision_candidates_owner_order_idx").on(
      table.ownerKey,
      table.sortOrder,
    ),
    check(
      "decision_candidates_status_check",
      sql`${table.status} IN ('candidate', 'trial', 'eliminated', 'final')`,
    ),
    check(
      "decision_candidates_note_length_check",
      sql`length(${table.note}) <= 120`,
    ),
  ],
);

export const trialFeedback = sqliteTable(
  "trial_feedback",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ownerKey: text("owner_key").notNull(),
    racketId: text("racket_id").notNull(),
    control: integer("control").notNull(),
    power: integer("power").notNull(),
    comfort: integer("comfort").notNull(),
    verdict: text("verdict").notNull(),
    note: text("note").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("trial_feedback_owner_created_idx").on(
      table.ownerKey,
      table.createdAt,
    ),
    check(
      "trial_feedback_control_check",
      sql`${table.control} BETWEEN 1 AND 5`,
    ),
    check(
      "trial_feedback_power_check",
      sql`${table.power} BETWEEN 1 AND 5`,
    ),
    check(
      "trial_feedback_comfort_check",
      sql`${table.comfort} BETWEEN 1 AND 5`,
    ),
    check(
      "trial_feedback_verdict_length_check",
      sql`length(${table.verdict}) BETWEEN 1 AND 40`,
    ),
    check(
      "trial_feedback_note_length_check",
      sql`length(${table.note}) <= 240`,
    ),
  ],
);
