const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = "mongodb+srv://konja:FOwKpkgg2uCIpDEn@datacollection.q70akxu.mongodb.net/?retryWrites=true&w=majority&appName=DataCollection";

async function debugChatAccess() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const projects = db.collection('projects');
    const users = db.collection('users');
    
    const projectId = '684eecdedd82941492bbe733';
    
    // Get the project
    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    
    if (!project) {
      console.log('❌ Project not found');
      return;
    }
    
    console.log('\n=== Project Details ===');
    console.log('Project ID:', projectId);
    console.log('Project Name:', project.name);
    console.log('Project Owner ID:', project.userId);
    console.log('Team Members:', JSON.stringify(project.teamMembers, null, 2));
    console.log('Collaborators:', project.collaborators);
    
    // Get all users
    const allUsers = await users.find({}).toArray();
    
    console.log('\n=== All Users ===');
    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
    });
    
    // Test access for each user
    console.log('\n=== Testing Access for Each User ===');
    
    for (const user of allUsers) {
      console.log(`\n--- Testing access for ${user.name} (${user.email}) ---`);
      
      // Test 1: Owner access
      const ownerAccess = project.userId === user._id.toString();
      console.log(`✓ Owner access: ${ownerAccess}`);
      
      // Test 2: Team member by userId
      const teamMemberByUserId = project.teamMembers?.some(member => 
        member.userId === user._id.toString()
      );
      console.log(`✓ Team member by userId: ${teamMemberByUserId}`);
      
      // Test 3: Team member by email
      const teamMemberByEmail = project.teamMembers?.some(member => 
        member.email === user.email
      );
      console.log(`✓ Team member by email: ${teamMemberByEmail}`);
      
      // Test 4: Collaborator
      const collaboratorAccess = project.collaborators?.includes(user._id.toString());
      console.log(`✓ Collaborator access: ${collaboratorAccess}`);
      
      // Final access check
      const hasAccess = ownerAccess || teamMemberByUserId || teamMemberByEmail || collaboratorAccess;
      console.log(`🔍 Final access result: ${hasAccess ? '✅ GRANTED' : '❌ DENIED'}`);
    }
    
    // Check what the Chat API query would look like
    console.log('\n=== Chat API Access Query ===');
    const testUserId = '684ee4e3dd82941492bbe72f'; // Konja's ID
    const testEmail = 'private@konja-rehm.de';
    
    const accessQuery = {
      _id: new ObjectId(projectId),
      $or: [
        { userId: testUserId },
        { 'teamMembers.userId': testUserId },
        { 'teamMembers.email': testEmail }
      ]
    };
    
    console.log('Query:', JSON.stringify(accessQuery, null, 2));
    
    const accessResult = await projects.findOne(accessQuery);
    console.log('Query result:', accessResult ? '✅ Access granted' : '❌ Access denied');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

debugChatAccess().catch(console.error);
