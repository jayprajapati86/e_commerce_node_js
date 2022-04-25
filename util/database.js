const mongodb = require('mongodb');
const MdbClient = mongodb.MongoClient;

let _db;

const mdbConnect = (callback) => {
    MdbClient.connect('mongodb+srv://root:jay86900@cluster0.hslxi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority')
        .then(client => {
            console.log('connected successfully!');
            _db = client.db();
            callback();
        })
        .catch(err => {
            console.log(err);
            throw err;
        });
};

const getDb = () => {
    if (_db) {
        return _db;
    }
    throw 'No DATABASE FOUND!';
}

exports.mdbConnect = mdbConnect;
exports.getDb = getDb;
