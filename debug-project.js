const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = "mongodb+srv://konja:FOwKpkgg2uCIpDEn@datacollection.q70akxu.mongodb.net/?retryWrites=true&w=majority&appName=DataCollection";

async function checkProject() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const projects = db.collection('projects');
    
    // Check if the specific project exists
    const projectId = '684eecdedd82941492bbe733';
    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    
    console.log('\n=== Project Check ===');
    console.log(`Project ID: ${projectId}`);
    console.log(`Project exists: ${!!project}`);
    
    if (project) {
      console.log(`Project name: ${project.name}`);
      console.log(`Project owner: ${project.userId}`);
      console.log(`Team members: ${JSON.stringify(project.teamMembers || [])}`);
    }
    
    // List all projects for debugging
    const allProjects = await projects.find({}).toArray();
    console.log(`\nTotal projects in database: ${allProjects.length}`);
    allProjects.forEach((p, index) => {
      console.log(`${index + 1}. ${p.name} (${p._id}) - Owner: ${p.userId}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

checkProject().catch(console.error);
