const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = "mongodb+srv://konja:FOwKpkgg2uCIpDEn@datacollection.q70akxu.mongodb.net/?retryWrites=true&w=majority&appName=DataCollection";

async function addTestUserToProject() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const projects = db.collection('projects');
    const users = db.collection('users');
    
    const projectId = '684eecdedd82941492bbe733';
    const testUserEmail = 'test@test.de';
    
    console.log('\n=== 1. Checking Project ===');
    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    
    if (!project) {
      console.log('❌ Project not found');
      return;
    }
    
    console.log('✅ Project found:', project.name);
    
    console.log('\n=== 2. Checking Test User ===');
    const testUser = await users.findOne({ email: testUserEmail });
    
    if (!testUser) {
      console.log('❌ Test user not found in database');
      return;
    }
    
    console.log('✅ Test user found:', testUser.name);
    
    console.log('\n=== 3. Checking if already a member ===');
    const isAlreadyMember = project.teamMembers?.some(member => 
      member.email === testUserEmail || member.userId === testUser._id.toString()
    );
    
    if (isAlreadyMember) {
      console.log('✅ User is already a team member');
      
      // Show existing member details
      const existingMember = project.teamMembers.find(member => 
        member.email === testUserEmail || member.userId === testUser._id.toString()
      );
      console.log('Member details:');
      console.log('  Email:', existingMember.email);
      console.log('  Role:', existingMember.role);
      console.log('  Role ID:', existingMember.roleId);
      console.log('  User ID:', existingMember.userId);
      
      return;
    }
    
    console.log('\n=== 4. Adding user as Editor ===');
    
    const newMember = {
      _id: new ObjectId().toString(),
      email: testUserEmail,
      name: testUser.name,
      userId: testUser._id.toString(),
      isRegistered: true,
      roleId: "default-editor",
      role: "Editor",
      addedAt: new Date(),
      addedBy: project.userId // Added by project owner
    };
    
    // Add to team members
    const currentTeamMembers = project.teamMembers || [];
    const updatedTeamMembers = [...currentTeamMembers, newMember];
    
    // Add to collaborators
    const currentCollaborators = project.collaborators || [];
    const updatedCollaborators = [...currentCollaborators, testUser._id.toString()];
    
    console.log('Adding member:', newMember);
    
    const result = await projects.updateOne(
      { _id: new ObjectId(projectId) },
      { 
        $set: { 
          teamMembers: updatedTeamMembers,
          collaborators: updatedCollaborators,
          updatedAt: new Date() 
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Successfully added test user to project team');
      console.log('✅ User now has Editor role with these permissions:');
      console.log('  - Can view all project content');
      console.log('  - Can create and edit notes, documents, contacts, events');
      console.log('  - Can participate in team chat');
      console.log('  - Cannot edit project settings or manage team');
    } else {
      console.log('❌ Failed to add user to project');
    }
    
    console.log('\n=== 5. Verifying access ===');
    const updatedProject = await projects.findOne({
      _id: new ObjectId(projectId),
      $or: [
        { userId: testUser._id.toString() },
        { 'teamMembers.userId': testUser._id.toString() },
        { 'teamMembers.email': testUserEmail.toLowerCase() }
      ]
    });
    
    if (updatedProject) {
      console.log('✅ Access verification successful - Chat should now work!');
    } else {
      console.log('❌ Access verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

addTestUserToProject().catch(console.error);
