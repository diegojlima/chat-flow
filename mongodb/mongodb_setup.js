
const mongoClient = new MongoClient('mongodb://localhost:27017', { useUnifiedTopology: true });
mongoClient.connect(err => {
  const db = mongoClient.db('chat2shop');
  db.createCollection('conversations', (err, res) => {
    if (err) throw err;
    console.log('Collection created!');
    mongoClient.close();
  });
});
