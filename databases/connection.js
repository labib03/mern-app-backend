import mongoose from "mongoose";

import { MongoClient } from "mongodb";
import ENV from "../config.js";

const client = new MongoClient(ENV.MONGO_URL);

async function connect() {
  mongoose.set("strictQuery", true);
  // const db = await mongoose.connect(getUri);
  const db = await mongoose.connect(ENV.MONGO_URL);
  console.log("Database Connected");
  return db;
}

// export async function connectToMongo() {
//   const myobj = { name: "Company Inc", address: "Highway 37" };
//   try {
//     await client.connect();
//     console.log("Success connect to mongo client");
//     const db = await client.db("labib");
//     const collection = await db.collection("latihan");

//     await collection.insertOne(myobj);

//     client.close();
//   } catch (error) {
//     throw new Error(error);
//   }
// }

export default connect;
