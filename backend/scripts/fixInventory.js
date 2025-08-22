require('dotenv').config();
const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');

const fixInventory = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Reset assigned quantities to 0 and increase current balance
    const result = await Inventory.updateMany(
      {},
      {
        $set: { assignedQuantity: 0 },
        $inc: { currentBalance: 50 } // Add 50 more units to each inventory
      }
    );
    
    console.log(`Updated ${result.modifiedCount} inventory records`);
    console.log('✅ All inventory now has sufficient available quantity for assignments');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

fixInventory();
