import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// This is where you define your "Supabase" tables
export const products = pgTable('products', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    price: text('price'), // Stored as text for simplicity in demo
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const posts = pgTable('posts', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    authorId: uuid('author_id'),
    published: boolean('published').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});
