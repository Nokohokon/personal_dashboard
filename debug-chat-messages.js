const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = "mongodb+srv://konja:FOwKpkgg2uCIpDEn@datacollection.q70akxu.mongodb.net/?retryWrites=true&w=majority&appName=DataCollection";

async function debugChatMessages() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const projects = db.collection('projects');
    const users = db.collection('users');
    const projectChat = db.collection('projectChat');
    
    const projectId = '684eecdedd82941492bbe733';
    const testUserEmail = 'test@test.de';
    
    console.log('\n=== 1. Checking Project ===');
    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    
    if (!project) {
      console.log('❌ Project not found');
      return;
    }
    
    console.log('✅ Project found:', project.name);
    console.log('Project Owner ID:', project.userId);
    console.log('Team Members:', project.teamMembers?.length || 0);
    
    if (project.teamMembers && project.teamMembers.length > 0) {
      console.log('\n--- Team Members Details ---');
      project.teamMembers.forEach((member, index) => {
        console.log(`Member ${index + 1}:`);
        console.log(`  Email: ${member.email}`);
        console.log(`  Name: ${member.name}`);
        console.log(`  User ID: ${member.userId}`);
        console.log(`  Role: ${member.role}`);
        console.log(`  Role ID: ${member.roleId}`);
        console.log(`  Registered: ${member.isRegistered}`);
        console.log('---');
      });
    }
    
    console.log('\n=== 2. Checking Test User ===');
    const testUser = await users.findOne({ email: testUserEmail });
    
    if (!testUser) {
      console.log('❌ Test user not found in database');
      return;
    }
    
    console.log('✅ Test user found:');
    console.log('  ID:', testUser._id.toString());
    console.log('  Name:', testUser.name);
    console.log('  Email:', testUser.email);
    
    console.log('\n=== 3. Testing Chat Access ===');
    const testUserId = testUser._id.toString();
    
    // Test the same access query that the chat API uses
    const accessQuery = {
      _id: new ObjectId(projectId),
      $or: [
        { userId: testUserId },
        { 'teamMembers.userId': testUserId },
        { 'teamMembers.email': testUserEmail.toLowerCase() }
      ]
    };
    
    console.log('Access Query:', JSON.stringify(accessQuery, null, 2));
    
    const accessResult = await projects.findOne(accessQuery);
    console.log('Access Result:', accessResult ? '✅ GRANTED' : '❌ DENIED');
    
    if (!accessResult) {
      console.log('\n🔍 Detailed Analysis:');
      
      // Check owner access
      const isOwner = project.userId === testUserId;
      console.log('Is Owner:', isOwner);
      
      // Check team member by userId
      const isTeamMemberByUserId = project.teamMembers?.some(member => 
        member.userId === testUserId
      );
      console.log('Is Team Member by User ID:', isTeamMemberByUserId);
      
      // Check team member by email
      const isTeamMemberByEmail = project.teamMembers?.some(member => 
        member.email === testUserEmail.toLowerCase()
      );
      console.log('Is Team Member by Email:', isTeamMemberByEmail);
      
      console.log('\n❌ No access found. User needs to be added to the project team!');
    }
    
    console.log('\n=== 4. Checking Chat Messages ===');
    const messages = await projectChat
      .find({ projectId: projectId })
      .sort({ timestamp: 1 })
      .toArray();
    
    console.log(`📨 Found ${messages.length} messages in project chat`);
    
    if (messages.length > 0) {
      console.log('\n--- Recent Messages ---');
      messages.slice(-5).forEach((msg, index) => {
        console.log(`Message ${index + 1}:`);
        console.log(`  From: ${msg.userName || msg.userEmail}`);
        console.log(`  Message: ${msg.message}`);
        console.log(`  Timestamp: ${msg.timestamp}`);
        console.log('---');
      });
    } else {
      console.log('📭 No messages found in project chat');
    }
    
    console.log('\n=== 5. Solution ===');
    if (!accessResult) {
      console.log('To fix this issue:');
      console.log('1. Add test@test.de as a team member to the project');
      console.log('2. Use the Team Management in the project details');
      console.log('3. Or run: node add-test-user.js');
    } else {
      console.log('✅ User has access to the project. Chat should work!');
      if (messages.length === 0) {
        console.log('💡 Try sending a test message in the chat to verify it works.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

debugChatMessages().catch(console.error);
