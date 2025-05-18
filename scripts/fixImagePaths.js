const mongoose = require('mongoose');
const Land = require('../models/Land'); // Adjust path as needed
require('dotenv').config();

async function fixImagePaths() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const lands = await Land.find({});
    let updated = 0;

    for (let land of lands) {
      if (land.images && land.images.length > 0) {
        const fixedImages = land.images.map(image => {
          // Extract just the filename
          const filename = image.split(/[\/\\]/).pop();
          return filename;
        });
        
        await Land.findByIdAndUpdate(land._id, { images: fixedImages });
        updated++;
      }
    }

    console.log(`Updated ${updated} land records`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixImagePaths();