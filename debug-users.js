const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://konja:FOwKpkgg2uCIpDEn@datacollection.q70akxu.mongodb.net/?retryWrites=true&w=majority&appName=DataCollection";

async function debugUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const users = db.collection('users');
    
    const allUsers = await users.find({}).toArray();
    
    console.log('\n=== Alle Benutzer in der Datenbank ===');
    allUsers.forEach((user, index) => {
      console.log(`\nBenutzer ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Hat Passwort: ${user.password ? 'Ja' : 'Nein'}`);
      console.log(`  EmailVerified: ${user.emailVerified}`);
      console.log(`  Erstellt am: ${user.createdAt}`);
    });
    
    console.log(`\nGesamtanzahl der Benutzer: ${allUsers.length}`);
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

debugUsers().catch(console.error);
