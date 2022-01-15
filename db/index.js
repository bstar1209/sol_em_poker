import mongoose from 'mongoose'
import { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } from '../config/index.js'
import userModel from './models/user.js';

const connectDB = async () => {
  mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}`, {
    dbName: DB_NAME,
    user: DB_USERNAME,
    pass: DB_PASSWORD
  });

  // let users = await userModel.find({});
}

const saveUser = async (obj) => {
  await userModel.updateOne({
    username: obj.username,
  }, { username: obj.username }, { upsert: true });
};

const getUser = async (username) => {
  const res = await userModel.findOne({ username: username });
  return res;
};

export default {
  connectDB,
  saveUser,
  getUser,
}