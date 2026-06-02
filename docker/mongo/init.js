// Créer un utilisateur pour l'application
db = db.getSiblingDB('marketplace');

// db.createUser({
//   user: 'app_user',
//   pwd: 'app_secret',
//   roles: [
//     {
//       role: 'readWrite',
//       db: 'marketplace'
//     }
//   ]
// });

// Créer des collections avec validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'createdAt'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^.+@.+$'
        },
        password: {
          bsonType: 'string'
        },
        roles: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          }
        },
        createdAt: {
          bsonType: 'date'
        },
        updatedAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

// Créer des index
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

console.log('MongoDB initialization completed!');