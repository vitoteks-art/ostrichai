import { Hono } from 'hono';
import { db } from './db';
import { products, posts } from './db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// Middleware: Logger & Error Handling
app.use('*', async (c, next) => {
    console.log(`[${c.req.method}] ${c.req.url}`);
    await next();
});

app.get('/', (c) => {
    return c.text('Hono + Drizzle Backend is Running!');
});

// Products API (Supabase CRUD replacement)
app.get('/products', async (c) => {
    const allProducts = await db.select().from(products);
    return c.json(allProducts);
});

app.post('/products', async (c) => {
    const body = await c.req.json();
    const newProduct = await db.insert(products).values(body).returning();
    return c.json(newProduct, 201);
});

// Posts API
app.get('/posts', async (c) => {
    const allPosts = await db.select().from(posts);
    return c.json(allPosts);
});

app.get('/posts/:id', async (c) => {
    const id = c.req.param('id');
    const post = await db.select().from(posts).where(eq(posts.id, id));
    if (post.length === 0) return c.json({ error: 'Post not found' }, 404);
    return c.json(post[0]);
});

export default {
    port: 3000,
    fetch: app.fetch,
};
