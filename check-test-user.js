const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = "mongodb+srv://konja:FOwKpkgg2uCIpDEn@datacollection.q70akxu.mongodb.net/?retryWrites=true&w=majority&appName=DataCollection";

async function checkTestUserAccess() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const projects = db.collection('projects');
    const users = db.collection('users');
    
    const projectId = '684eecdedd82941492bbe733';
    const testEmail = 'test@test.de';
    
    // Get the project
    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    console.log('\n=== Project Details ===');
    console.log('Project ID:', projectId);
    console.log('Project Name:', project.name);
    console.log('Project Owner ID:', project.userId);
    console.log('Team Members:');
    if (project.teamMembers) {
      project.teamMembers.forEach((member, index) => {
        console.log(`  ${index + 1}. Email: ${member.email}, UserID: ${member.userId}, Registered: ${member.isRegistered}`);
      });
    }
    
    // Get test user
    const testUser = await users.findOne({ email: testEmail });
    console.log('\n=== Test User Details ===');
    if (testUser) {
      console.log('User ID:', testUser._id.toString());
      console.log('Email:', testUser.email);
      console.log('Name:', testUser.name);
    } else {
      console.log('❌ Test user not found!');
      return;
    }
    
    // Check access for test user
    console.log('\n=== Access Check for test@test.de ===');
    const userId = testUser._id.toString();
    
    // Test 1: Owner
    const isOwner = project.userId === userId;
    console.log('1. Is Owner:', isOwner);
    
    // Test 2: Team member by userId
    const isTeamMemberById = project.teamMembers?.some(member => member.userId === userId);
    console.log('2. Is Team Member (by userId):', isTeamMemberById);
    
    // Test 3: Team member by email
    const isTeamMemberByEmail = project.teamMembers?.some(member => member.email === testEmail);
    console.log('3. Is Team Member (by email):', isTeamMemberByEmail);
    
    // Test 4: Collaborator
    const isCollaborator = project.collaborators?.includes(userId);
    console.log('4. Is Collaborator:', isCollaborator);
    
    const hasAnyAccess = isOwner || isTeamMemberById || isTeamMemberByEmail || isCollaborator;
    console.log('\n🔍 Final Result:', hasAnyAccess ? '✅ HAS ACCESS' : '❌ NO ACCESS');
    
    if (!hasAnyAccess) {
      console.log('\n=== Solution ===');
      console.log('The user test@test.de needs to be added to the project as a team member.');
      console.log('You can do this by:');
      console.log('1. Adding them via the project UI');
      console.log('2. Or manually adding them to the database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

checkTestUserAccess().catch(console.error);
