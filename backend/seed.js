const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const User = require('./models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Remove any old users and create fresh accounts
    await User.deleteMany({});
    const user1 = new User({ username: 'Ansh', password: 'Ansh_0207' });
    const user2 = new User({ username: 'admin', password: 'admin123' });
    await user1.save();
    await user2.save();
    console.log('✅ Accounts created: Ansh / Ansh_0207 AND admin / admin123');

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
