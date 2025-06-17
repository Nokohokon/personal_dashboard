const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = "mongodb+srv://konja:FOwKpkgg2uCIpDEn@datacollection.q70akxu.mongodb.net/?retryWrites=true&w=majority&appName=DataCollection";

async function addTestUserToProject() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const projects = db.collection('projects');
    
    const projectId = '684eecdedd82941492bbe733';
    const testUserId = '684ef4819c19b441b4fe5e93'; // From previous debug output
    const testEmail = 'test@test.de';
    const testName = 'Test';
    
    console.log('📝 Adding user to project...');
    console.log('Project ID:', projectId);
    console.log('User ID:', testUserId);
    console.log('Email:', testEmail);
    
    // Add the user as a team member
    const newTeamMember = {
      _id: new ObjectId().toString(),
      email: testEmail,
      name: testName,
      userId: testUserId,
      isRegistered: true,
      roleId: null,
      role: 'collaborator',
      addedAt: new Date(),
      addedBy: '684ee4e3dd82941492bbe72f' // Project owner ID
    };
    
    // Update project: add to teamMembers and collaborators arrays
    const result = await projects.updateOne(
      { _id: new ObjectId(projectId) },
      {
        $push: {
          teamMembers: newTeamMember,
          collaborators: testUserId
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount === 1) {
      console.log('✅ Successfully added test@test.de to the project!');
    } else {
      console.log('❌ Failed to update project');
    }
    
    // Verify the update
    const updatedProject = await projects.findOne({ _id: new ObjectId(projectId) });
    console.log('\n📋 Updated project team members:');
    updatedProject.teamMembers?.forEach((member, index) => {
      console.log(`  ${index + 1}. ${member.name} (${member.email}) - ${member.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

console.log('🚀 Starting script to add test@test.de to project...');
addTestUserToProject().catch(console.error);
