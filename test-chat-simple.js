const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = "mongodb+srv://konja:FOwKpkgg2uCIpDEn@datacollection.q70akxu.mongodb.net/?retryWrites=true&w=majority&appName=DataCollection";

async function testChat() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // 1. Find a test user (current user)
    const testUser = await db.collection('users').findOne({ email: 'test@test.de' });
    if (!testUser) {
      console.log('❌ Test user not found. Create user first!');
      return;
    }
    
    console.log('✅ Test user found:', testUser.email);
    const userId = testUser._id.toString();
    
    // 2. Find first project that user has access to
    const project = await db.collection('projects').findOne({
      $or: [
        { userId: userId },
        { collaborators: userId },
        { 'teamMembers.userId': userId },
        { 'teamMembers.email': testUser.email.toLowerCase() }
      ]
    });
    
    if (!project) {
      console.log('❌ No accessible project found for user');
      return;
    }
    
    console.log('✅ Found accessible project:', project.name);
    const projectId = project._id.toString();
    
    // 3. Check existing chat messages
    const existingMessages = await db.collection('projectChat')
      .find({ projectId: projectId })
      .toArray();
      
    console.log(`📨 Existing messages: ${existingMessages.length}`);
    
    // 4. If no messages exist, create a test message
    if (existingMessages.length === 0) {
      console.log('📝 Creating test message...');
      
      const testMessage = {
        projectId: projectId,
        userId: userId,
        userName: testUser.name || 'Test User',
        userEmail: testUser.email,
        message: 'Test message - Chat funktioniert!',
        timestamp: new Date(),
        type: 'message'
      };
      
      const result = await db.collection('projectChat').insertOne(testMessage);
      console.log('✅ Test message created with ID:', result.insertedId.toString());
    }
    
    // 5. Verify messages can be retrieved
    const allMessages = await db.collection('projectChat')
      .find({ projectId: projectId })
      .sort({ timestamp: 1 })
      .toArray();
      
    console.log(`✅ Final check: ${allMessages.length} messages found`);
    
    if (allMessages.length > 0) {
      console.log('\n--- Latest Messages ---');
      allMessages.slice(-3).forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.userName}: ${msg.message}`);
        console.log(`   (${msg.timestamp})`);
      });
    }
    
    console.log('\n🎉 Chat system should work now!');
    console.log(`🔗 Test with project ID: ${projectId}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testChat().catch(console.error);
