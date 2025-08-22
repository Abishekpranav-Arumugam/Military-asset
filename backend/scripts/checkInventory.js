require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Inventory = require('../models/Inventory');
const Asset = require('../models/Asset');
const Base = require('../models/Base');

const checkInventory = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const inventories = await Inventory.find()
      .populate('assetId', 'name')
      .populate('baseId', 'name')
      .sort({ 'baseId.name': 1, 'assetId.name': 1 });
    
    console.log('\n=== CURRENT INVENTORY STATUS ===\n');
    
    if (inventories.length === 0) {
      console.log('❌ No inventory records found!');
      console.log('Run the seed script first: npm run seed');
      return;
    }
    
    inventories.forEach(inv => {
      const available = inv.currentBalance - inv.assignedQuantity;
      const status = available > 0 ? '✅' : '❌';
      console.log(`${status} ${inv.assetId?.name} at ${inv.baseId?.name}:`);
      console.log(`   Current: ${inv.currentBalance}, Assigned: ${inv.assignedQuantity}, Available: ${available}`);
      console.log('');
    });
    
    // Show assets with low availability
    const lowStock = inventories.filter(inv => (inv.currentBalance - inv.assignedQuantity) < 5);
    if (lowStock.length > 0) {
      console.log('\n⚠️  ASSETS WITH LOW AVAILABILITY (< 5 units):');
      lowStock.forEach(inv => {
        const available = inv.currentBalance - inv.assignedQuantity;
        console.log(`   ${inv.assetId?.name} at ${inv.baseId?.name}: ${available} available`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  }
};

checkInventory();
