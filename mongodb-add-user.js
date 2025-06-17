// MongoDB Query to add test@test.de to the project
db.projects.updateOne(
  { _id: ObjectId("684eecdedd82941492bbe733") },
  {
    $push: {
      teamMembers: {
        _id: new ObjectId().toString(),
        email: "test@test.de",
        name: "Test",
        userId: "684ef4819c19b441b4fe5e93",
        isRegistered: true,
        roleId: null,
        role: "collaborator",
        addedAt: new Date(),
        addedBy: "684ee4e3dd82941492bbe72f"
      },
      collaborators: "684ef4819c19b441b4fe5e93"
    }
  }
)

// Verify the update
db.projects.findOne(
  { _id: ObjectId("684eecdedd82941492bbe733") },
  { teamMembers: 1, collaborators: 1 }
)
