const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = "mongodb+srv://konja:FOwKpkgg2uCIpDEn@datacollection.q70akxu.mongodb.net/?retryWrites=true&w=majority&appName=DataCollection";
const PROJECT_ID = "684eecdedd82941492bbe733";
const TEST_EMAIL = "test@test.de";

async function addTestUserToProject() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ MongoDB verbunden');
    
    const db = client.db();
    const projects = db.collection('projects');
    const users = db.collection('users');
    
    // Projekt und Benutzer laden
    const project = await projects.findOne({ _id: new ObjectId(PROJECT_ID) });
    const user = await users.findOne({ email: TEST_EMAIL });
    
    if (!project) {
      console.log('❌ Projekt nicht gefunden');
      return;
    }
    
    if (!user) {
      console.log('❌ Benutzer nicht gefunden');
      return;
    }
    
    console.log('📋 Projekt:', project.name);
    console.log('👤 Benutzer:', user.name, user.email);
    
    // Prüfen, ob bereits Mitglied
    const isAlreadyMember = project.teamMembers?.some(member => member.email === TEST_EMAIL);
    if (isAlreadyMember) {
      console.log('⚠️ Benutzer ist bereits Teammitglied');
      return;
    }
    
    // Neues Teammitglied hinzufügen
    const newMember = {
      _id: new ObjectId().toString(),
      email: TEST_EMAIL,
      name: user.name,
      userId: user._id.toString(),
      isRegistered: true,
      roleId: "default-editor",
      role: "Editor",
      addedAt: new Date(),
      addedBy: project.userId
    };
    
    const currentTeamMembers = project.teamMembers || [];
    const updatedTeamMembers = [...currentTeamMembers, newMember];
    
    const currentCollaborators = project.collaborators || [];
    const updatedCollaborators = [...currentCollaborators, user._id.toString()];
    
    // Projekt aktualisieren
    const result = await projects.updateOne(
      { _id: new ObjectId(PROJECT_ID) },
      { 
        $set: { 
          teamMembers: updatedTeamMembers,
          collaborators: updatedCollaborators,
          updatedAt: new Date() 
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Test-Benutzer erfolgreich als Editor hinzugefügt!');
      console.log('📝 Rolle: Editor');
      console.log('📧 E-Mail:', TEST_EMAIL);
    } else {
      console.log('❌ Fehler beim Hinzufügen des Benutzers');
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await client.close();
  }
}

addTestUserToProject();
