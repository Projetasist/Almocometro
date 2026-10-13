import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
export const employees=sqliteTable("employees",{id:text("id").primaryKey(),name:text("name").notNull(),department:text("department").notNull(),normalized:text("normalized").notNull(),createdDate:text("created_date").notNull(),deletedDate:text("deleted_date"),contact:text("contact")},t=>[uniqueIndex("idx_employee_identity").on(t.normalized,t.department)]);
export const replies=sqliteTable("replies",{id:text("id").primaryKey(),employeeId:text("employee_id").notNull().references(()=>employees.id),employeeName:text("employee_name"),employeeDepartment:text("employee_department"),date:text("date").notNull(),answer:integer("answer").notNull(),updatedAt:text("updated_at").notNull()},t=>[uniqueIndex("idx_replies_day_employee").on(t.date,t.employeeId)]);
export const dailyControl=sqliteTable("daily_control",{date:text("date").primaryKey(),mode:text("mode").notNull(),updatedAt:text("updated_at").notNull()});

export const lunchPrices=sqliteTable("lunch_prices",{date:text("date").primaryKey(),cents:integer("cents").notNull()});
