const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = "mongodb+srv://konja:FOwKpkgg2uCIpDEn@datacollection.q70akxu.mongodb.net/?retryWrites=true&w=majority&appName=DataCollection";

async function checkSessionAndDB() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const projects = db.collection('projects');
    const users = db.collection('users');
    
    console.log('\n=== PROJECT ANALYSIS ===');
    const projectId = '684eecdedd82941492bbe733';
    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    
    if (project) {
      console.log(`Project: ${project.name}`);
      console.log(`Project Owner ID: ${project.userId}`);
      console.log(`Team Members:`);
      if (project.teamMembers) {
        project.teamMembers.forEach((member, index) => {
          console.log(`  ${index + 1}. Email: ${member.email}`);
          console.log(`     User ID: ${member.userId}`);
          console.log(`     Name: ${member.name}`);
          console.log(`     Registered: ${member.isRegistered}`);
          console.log(`     Role: ${member.role}`);
          console.log('');
        });
      }
    }
    
    console.log('\n=== USER ANALYSIS ===');
    const allUsers = await users.find({}).toArray();
    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log('');
    });
    
    console.log('\n=== ACCESS CHECK ANALYSIS ===');
    console.log('Checking different user IDs against project access...');
    
    // Test verschiedene User IDs aus der Datenbank
    for (const user of allUsers) {
      const userId = user._id.toString();
      const userEmail = user.email;
      
      console.log(`\nChecking access for User: ${user.name} (${userEmail})`);
      console.log(`User ID: ${userId}`);
      
      // Prüfe die verschiedenen Zugriffsbedingungen aus der Chat-Route
      const accessQueries = [
        { userId: userId },
        { 'teamMembers.userId': userId },
        { 'teamMembers.email': userEmail }
      ];
      
      for (let i = 0; i < accessQueries.length; i++) {
        const query = {
          _id: new ObjectId(projectId),
          ...accessQueries[i]
        };
        
        const hasAccess = await projects.findOne(query);
        console.log(`  Query ${i + 1} (${Object.keys(accessQueries[i])[0]}): ${hasAccess ? 'ACCESS GRANTED' : 'ACCESS DENIED'}`);
      }
      
      // Vollständige $or Query wie in der Chat-Route
      const fullQuery = {
        _id: new ObjectId(projectId),
        $or: [
          { userId: userId },
          { 'teamMembers.userId': userId },
          { 'teamMembers.email': userEmail }
        ]
      };
      
      const fullAccess = await projects.findOne(fullQuery);
      console.log(`  Full $or Query: ${fullAccess ? 'ACCESS GRANTED' : 'ACCESS DENIED'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkSessionAndDB().catch(console.error);
