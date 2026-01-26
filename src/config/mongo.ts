import { MongoClient, MongoClientOptions } from 'mongodb';

// Define the global MongoDB client cache for serverless environments
declare global {
    var _mongoClientPromise: Promise<MongoClient> | null;
    var _mongoClient: MongoClient | null;
}

// Prevent multiple instances in development when hot reloading
if (!global._mongoClient) {
    global._mongoClient = null;
}
if (!global._mongoClientPromise) {
    global._mongoClientPromise = null;
}

const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

if (!MONGODB_URI) {
    throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

// Configuration options for MongoDB connection
const options: MongoClientOptions = {
    serverSelectionTimeoutMS: 15000, // 15 seconds timeout for server selection
    socketTimeoutMS: 45000,          // 45 seconds timeout for socket operations
    maxPoolSize: 10,                 // Maximum number of connections in the connection pool
    minPoolSize: 2,                  // Minimum number of connections in the pool
    maxIdleTimeMS: 30000,            // Close connections after 30 seconds of inactivity
    retryWrites: true,               // Enable retryable writes
    retryReads: true,                // Enable retryable reads
};

/**
 * Creates a new MongoDB client instance
 * @returns Promise<MongoClient>
 */
async function createMongoClient(): Promise<MongoClient> {
    try {
        console.log('🔄 Creating new MongoDB client instance...');

        const client = new MongoClient(MONGODB_URI, options);
        await client.connect();

        // Ensure the connection is healthy
        await client.db().admin().ping();

        console.log('✅ Successfully connected to MongoDB');
        return client;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

/**
 * Gets the singleton MongoDB client instance
 * In production, creates a new client each time
 * In development, reuses the same client via global cache to prevent connection leaks
 * @returns Promise<MongoClient>
 */
export async function getMongoClient(): Promise<MongoClient> {
    if (process.env.NODE_ENV === 'production') {
        // In production, create a new client instance each time
        // Connection pooling handles efficiency
        return await createMongoClient();
    } else {
        // In development, use the global cache to prevent multiple connections
        // due to hot reloading
        if (!global._mongoClientPromise) {
            global._mongoClientPromise = createMongoClient();
        }
        return await global._mongoClientPromise;
    }
}

/**
 * Gets the MongoDB database instance
 * @param dbName - Name of the database to use (optional, defaults to the one in connection string)
 * @returns Promise containing the database instance
 */
export async function getDatabase(dbName?: string) {
    const client = await getMongoClient();

    // Extract database name from connection string if not provided
    if (!dbName) {
        const url = new URL(MONGODB_URI);
        dbName = url.pathname.substring(1); // Remove leading slash
        if (dbName.includes('?')) {
            dbName = dbName.split('?')[0]; // Remove query parameters
        }
    }

    return client.db(dbName);
}

/**
 * Closes the MongoDB connection
 * Should be used carefully in serverless environments
 */
export async function closeMongoConnection(): Promise<void> {
    if (global._mongoClient) {
        await global._mongoClient.close();
        global._mongoClient = null;
        global._mongoClientPromise = null;
        console.log('🔌 Closed MongoDB connection');
    }
}

// Export the client for direct use if needed
export { MONGODB_URI };