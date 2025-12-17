import mongoose, { Connection, Model, Schema } from 'mongoose';


export interface IDatabaseConnections {
  default: Connection;
  medical: Connection;
  food: Connection;
}


let connections: IDatabaseConnections | null = null;

const DATABASE_URIS = {
  default: process.env.MONGO_URI || 'mongodb+srv:27017/test',
  medical: process.env.MEDICAL_MONGO_URI || 'mongodb+srv:27017/medical',
  food: process.env.FOOD_MONGO_URI || 'mongodb+srv:27017/food',
};


export const connectDatabases = async (): Promise<IDatabaseConnections> => {
  if (connections) {
    return connections;
  }

  try {

    const defaultConnection = await mongoose.createConnection(DATABASE_URIS.default).asPromise();
    console.log('✅ Подключено к основной базе данных (test)');


    const medicalConnection = await mongoose.createConnection(DATABASE_URIS.medical).asPromise();
    console.log('✅ Подключено к базе данных медицинских журналов (medician_journals)');


    const foodConnection = await mongoose.createConnection(DATABASE_URIS.food).asPromise();
    console.log('✅ Подключено к базе данных журналов по питанию (food_journals)');

    connections = {
      default: defaultConnection,
      medical: medicalConnection,
      food: foodConnection,
    };

    return connections;
  } catch (error) {
    console.error('❌ Ошибка подключения к базам данных:', error);
    throw error;
  }
};

export const getConnection = (database: keyof IDatabaseConnections): Connection => {
  if (!connections) {
    throw new Error('Базы данных не подключены. Вызовите connectDatabases() сначала.');
  }
  return connections[database];
};

export const createModelFactory = <T>(
  modelName: string,
  schema: Schema,
  collectionName: string,
  database: keyof IDatabaseConnections
): (() => Model<T>) => {
  return () => {
    const connection = getConnection(database);
    return connection.model<T>(modelName, schema, collectionName);
  };
};