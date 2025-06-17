const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = "mongodb+srv://konja:FOwKpkgg2uCIpDEn@datacollection.q70akxu.mongodb.net/?retryWrites=true&w=majority&appName=DataCollection";

async function quickAddTestUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    
    const db = client.db();
    const projects = db.collection('projects');
    
    const projectId = '684eecdedd82941492bbe733';
    
    // Simply add test@test.de as a team member directly
    const result = await projects.updateOne(
      { _id: new ObjectId(projectId) },
      {
        $push: {
          teamMembers: {
            _id: new ObjectId().toString(),
            email: 'test@test.de',
            name: 'Test User',
            userId: '684ef4819c19b441b4fe5e93',
            isRegistered: true,
            roleId: null,
            role: 'collaborator',
            addedAt: new Date(),
            addedBy: '684ee4e3dd82941492bbe72f'
          },
          collaborators: '684ef4819c19b441b4fe5e93'
        }
      }
    );
    
    console.log('Update result:', result.modifiedCount > 0 ? 'SUCCESS' : 'FAILED');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

quickAddTestUser();
