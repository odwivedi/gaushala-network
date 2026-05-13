import { MongoClient, ObjectId } from 'mongodb';
import logger from '@/lib/logger';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27018';
const DB_NAME = 'gaushala_network';

let client: MongoClient | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    logger.info('DB', 'db-mongo.ts', 'MongoDB connected');
  }
  return client;
}

export async function getArticleContent(mongoContentId: string): Promise<string> {
  try {
    const c = await getMongoClient();
    const doc = await c.db(DB_NAME).collection('article_contents').findOne({ _id: new ObjectId(mongoContentId) });
    return doc?.content || '';
  } catch (err) {
    logger.error('DB', 'db-mongo.ts', 'getArticleContent failed', { mongoContentId, err: String(err) });
    return '';
  }
}

export async function saveArticleContent(content: string, existingId?: string): Promise<string> {
  try {
    const c = await getMongoClient();
    const col = c.db(DB_NAME).collection('article_contents');
    if (existingId) {
      await col.updateOne({ _id: new ObjectId(existingId) }, { $set: { content, updatedAt: new Date() } });
      return existingId;
    }
    const result = await col.insertOne({ content, createdAt: new Date() });
    return result.insertedId.toString();
  } catch (err) {
    logger.error('DB', 'db-mongo.ts', 'saveArticleContent failed', { err: String(err) });
    throw err;
  }
}

export { ObjectId };
