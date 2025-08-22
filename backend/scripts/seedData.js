require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Base = require('../models/Base');
const Asset = require('../models/Asset');
const Inventory = require('../models/Inventory');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Base.deleteMany({}),
      Asset.deleteMany({}),
      Inventory.deleteMany({})
    ]);

    console.log('Cleared existing data');

    // Create bases
    const bases = await Base.insertMany([
      {
        name: 'Fort Liberty',
        code: 'FL',
        location: {
          address: '2000 Reilly Road',
          city: 'Fort Liberty',
          state: 'North Carolina',
          country: 'United States',
          coordinates: {
            latitude: 35.1379,
            longitude: -79.0075
          }
        },
        description: 'Home of the XVIII Airborne Corps and 82nd Airborne Division'
      },
      {
        name: 'Camp Pendleton',
        code: 'CP',
        location: {
          address: 'Building 1133 Vandegrift Blvd',
          city: 'Camp Pendleton',
          state: 'California',
          country: 'United States',
          coordinates: {
            latitude: 33.3547,
            longitude: -117.3128
          }
        },
        description: 'Marine Corps Base Camp Pendleton'
      },
      {
        name: 'Fort Hood',
        code: 'FH',
        location: {
          address: '36000 TJ Mills Blvd',
          city: 'Fort Hood',
          state: 'Texas',
          country: 'United States',
          coordinates: {
            latitude: 31.1349,
            longitude: -97.7841
          }
        },
        description: 'Home of III Armored Corps'
      },
      {
        name: 'Naval Base San Diego',
        code: 'NBSD',
        location: {
          address: '3455 Senn Road',
          city: 'San Diego',
          state: 'California',
          country: 'United States',
          coordinates: {
            latitude: 32.6969,
            longitude: -117.1361
          }
        },
        description: 'Principal homeport of the Pacific Fleet'
      }
    ]);

    console.log('Created bases');

    // Create users
    const users = await User.insertMany([
      {
        username: 'admin',
        email: 'admin@military.gov',
        password: await bcrypt.hash('admin123', 12),
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        rank: 'Colonel'
      },
      {
        username: 'commander.fl',
        email: 'commander@fortliberty.mil',
        password: await bcrypt.hash('commander123', 12),
        role: 'base_commander',
        baseId: bases[0]._id,
        firstName: 'John',
        lastName: 'Smith',
        rank: 'Lieutenant Colonel'
      },
      {
        username: 'logistics.fl',
        email: 'logistics@fortliberty.mil',
        password: await bcrypt.hash('logistics123', 12),
        role: 'logistics_officer',
        baseId: bases[0]._id,
        firstName: 'Sarah',
        lastName: 'Johnson',
        rank: 'Major'
      },
      {
        username: 'commander.cp',
        email: 'commander@pendleton.mil',
        password: await bcrypt.hash('commander123', 12),
        role: 'base_commander',
        baseId: bases[1]._id,
        firstName: 'Michael',
        lastName: 'Davis',
        rank: 'Colonel'
      },
      {
        username: 'logistics.cp',
        email: 'logistics@pendleton.mil',
        password: await bcrypt.hash('logistics123', 12),
        role: 'logistics_officer',
        baseId: bases[1]._id,
        firstName: 'Emily',
        lastName: 'Wilson',
        rank: 'Captain'
      }
    ]);

    console.log('Created users');

    // Update base commanders
    await Base.findByIdAndUpdate(bases[0]._id, { commanderId: users[1]._id });
    await Base.findByIdAndUpdate(bases[1]._id, { commanderId: users[3]._id });

    // Create assets
    const assets = await Asset.insertMany([
      {
        name: 'M4 Carbine',
        category: 'weapon',
        subcategory: 'Assault Rifle',
        model: 'M4A1',
        manufacturer: 'Colt',
        specifications: {
          caliber: '5.56×45mm NATO',
          weight: '2.88 kg',
          length: '838 mm'
        },
        unitOfMeasure: 'piece',
        minimumStockLevel: 50
      },
      {
        name: 'M9 Pistol',
        category: 'weapon',
        subcategory: 'Handgun',
        model: 'M9',
        manufacturer: 'Beretta',
        specifications: {
          caliber: '9×19mm Parabellum',
          weight: '0.96 kg',
          length: '217 mm'
        },
        unitOfMeasure: 'piece',
        minimumStockLevel: 25
      },
      {
        name: 'HMMWV',
        category: 'vehicle',
        subcategory: 'Utility Vehicle',
        model: 'M1151',
        manufacturer: 'AM General',
        specifications: {
          engine: '6.5L V8 Diesel',
          weight: '2,721 kg',
          capacity: '4 personnel'
        },
        unitOfMeasure: 'unit',
        minimumStockLevel: 5
      },
      {
        name: 'M1A2 Abrams',
        category: 'vehicle',
        subcategory: 'Main Battle Tank',
        model: 'M1A2',
        manufacturer: 'General Dynamics',
        specifications: {
          engine: 'AGT1500 Gas Turbine',
          weight: '62,000 kg',
          crew: '4'
        },
        unitOfMeasure: 'unit',
        minimumStockLevel: 2
      },
      {
        name: '5.56mm Ammunition',
        category: 'ammunition',
        subcategory: 'Rifle Ammunition',
        model: 'M855A1',
        manufacturer: 'Various',
        specifications: {
          caliber: '5.56×45mm NATO',
          type: 'Enhanced Performance Round'
        },
        unitOfMeasure: 'box',
        isConsumable: true,
        minimumStockLevel: 1000
      },
      {
        name: '9mm Ammunition',
        category: 'ammunition',
        subcategory: 'Pistol Ammunition',
        model: 'M882',
        manufacturer: 'Various',
        specifications: {
          caliber: '9×19mm Parabellum',
          type: 'Ball'
        },
        unitOfMeasure: 'box',
        isConsumable: true,
        minimumStockLevel: 500
      },
      {
        name: 'Body Armor',
        category: 'equipment',
        subcategory: 'Personal Protection',
        model: 'IOTV',
        manufacturer: 'Various',
        specifications: {
          protection: 'Level IIIA',
          weight: '3.3 kg'
        },
        unitOfMeasure: 'piece',
        minimumStockLevel: 100
      },
      {
        name: 'Combat Helmet',
        category: 'equipment',
        subcategory: 'Personal Protection',
        model: 'ACH',
        manufacturer: 'Various',
        specifications: {
          protection: 'Ballistic',
          weight: '1.4 kg'
        },
        unitOfMeasure: 'piece',
        minimumStockLevel: 100
      },
      {
        name: 'MRE',
        category: 'supplies',
        subcategory: 'Food',
        model: 'Meal Ready-to-Eat',
        manufacturer: 'Various',
        specifications: {
          calories: '1200-1300',
          shelf_life: '3 years'
        },
        unitOfMeasure: 'box',
        isConsumable: true,
        minimumStockLevel: 5000
      },
      {
        name: 'Medical Kit',
        category: 'supplies',
        subcategory: 'Medical',
        model: 'IFAK',
        manufacturer: 'Various',
        specifications: {
          contents: 'Individual First Aid Kit',
          weight: '0.5 kg'
        },
        unitOfMeasure: 'piece',
        minimumStockLevel: 200
      }
    ]);

    console.log('Created assets');

    // Create initial inventory for each base
    const inventoryData = [];
    for (const base of bases) {
      for (const asset of assets) {
        const openingBalance = Math.floor(Math.random() * 100) + asset.minimumStockLevel;
        inventoryData.push({
          assetId: asset._id,
          baseId: base._id,
          openingBalance,
          currentBalance: openingBalance,
          assignedQuantity: Math.floor(openingBalance * 0.1),
          expendedQuantity: Math.floor(openingBalance * 0.05)
        });
      }
    }

    await Inventory.insertMany(inventoryData);
    console.log('Created inventory records');

    console.log('\n=== SEED DATA CREATED SUCCESSFULLY ===');
    console.log('\nDefault Login Credentials:');
    console.log('Admin: admin / admin123');
    console.log('Fort Liberty Commander: commander.fl / commander123');
    console.log('Fort Liberty Logistics: logistics.fl / logistics123');
    console.log('Camp Pendleton Commander: commander.cp / commander123');
    console.log('Camp Pendleton Logistics: logistics.cp / logistics123');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the seed script
const runSeed = async () => {
  await connectDB();
  await seedData();
};

if (require.main === module) {
  runSeed();
}

module.exports = { seedData };
