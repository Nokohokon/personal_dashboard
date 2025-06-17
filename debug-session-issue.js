const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = "mongodb+srv://konja:FOwKpkgg2uCIpDEn@datacollection.q70akxu.mongodb.net/?retryWrites=true&w=majority&appName=DataCollection";

async function debugSessionIssue() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const projects = db.collection('projects');
    const users = db.collection('users');
    
    const projectId = '684eecdedd82941492bbe733';
    const testEmail = 'private@konja-rehm.de';
    
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
    
    // Get the user from email
    const user = await users.findOne({ email: testEmail });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('\n=== User Details ===');
    console.log('User ID:', user._id.toString());
    console.log('User Email:', user.email);
    console.log('User Name:', user.name);
    
    // Check if the user ID matches the project owner
    const isOwner = project.userId === user._id.toString();
    console.log('\n=== Access Check ===');
    console.log('Is Owner:', isOwner);
    
    // Test different queries that the API might use
    console.log('\n=== Testing Different Access Queries ===');
    
    // Query 1: By user ID as string
    const query1 = {
      _id: new ObjectId(projectId),
      $or: [
        { userId: user._id.toString() },
        { 'teamMembers.userId': user._id.toString() },
        { 'teamMembers.email': testEmail }
      ]
    };
    
    const result1 = await projects.findOne(query1);
    console.log('Query 1 (string ID):', result1 ? '✅ SUCCESS' : '❌ FAILED');
    
    // Query 2: By user ID as ObjectId
    const query2 = {
      _id: new ObjectId(projectId),
      $or: [
        { userId: user._id },
        { 'teamMembers.userId': user._id },
        { 'teamMembers.email': testEmail }
      ]
    };
    
    const result2 = await projects.findOne(query2);
    console.log('Query 2 (ObjectId):', result2 ? '✅ SUCCESS' : '❌ FAILED');
    
    // Query 3: Only by email (fallback)
    const query3 = {
      _id: new ObjectId(projectId),
      $or: [
        { 'teamMembers.email': testEmail }
      ]
    };
    
    const result3 = await projects.findOne(query3);
    console.log('Query 3 (email only):', result3 ? '✅ SUCCESS' : '❌ FAILED');
    
    // Query 4: Check project owner directly
    const query4 = {
      _id: new ObjectId(projectId),
      userId: user._id.toString()
    };
    
    const result4 = await projects.findOne(query4);
    console.log('Query 4 (owner check):', result4 ? '✅ SUCCESS' : '❌ FAILED');
    
    console.log('\n=== Suggested Fix ===');
    console.log('The API should use the user email to find the user ID from the database first.');
    console.log('Then use that verified user ID for access checks.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

debugSessionIssue().catch(console.error);
