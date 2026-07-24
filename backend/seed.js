const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Remove any old users and create fresh admin
    await User.deleteMany({});
    const user = new User({ username: 'Ansh', password: 'Ansh_0207' });
    await user.save();
    console.log('✅ Admin user created: Ansh / Ansh_0207');

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
