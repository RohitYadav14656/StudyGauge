import mongoose from 'mongoose';

let mongoServer;

beforeAll(async () => {
  // Set JWT secret for tests
  process.env.JWT_SECRET = 'testsecret123';
  process.env.JWT_EXPIRES_IN = '1h';

  if (process.env.SKIP_DB === 'true') {
    return;
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'testdb',
    },
    spawnTimeoutMS: 60000,
  });
  const uri = mongoServer.getUri();

  // Close the Mongoose connection if one exists before connecting
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  if (mongoServer) {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoServer.stop();
  }
});

afterEach(async () => {
  if (mongoServer && mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  }
});
