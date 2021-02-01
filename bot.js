const Discord = require('discord.js');
const client = new Discord.Client({ ws: { intents: ['GUILDS', 'GUILD_MEMBERS'] } });
const mongo = require('mongodb').MongoClient;
const MONGO_URL = " /* db url goes here https://www.mongodb.com/ */ ";

client.login(' /* API token goes here: get one from here: https://discord.com/developers/applications */ ');

//back up on leave
client.on("guildMemberRemove", (person) => {
    mongo.connect(MONGO_URL, { useUnifiedTopology: true }).then((mongoClient) => {
        var storeDB = mongoClient.db('roles');

        var roles = [];
        var nick = "";

        //get info

        for (var role of person.roles.cache) {
            roles.push(role[1].id.toString());
        }

        nick = person.nickname;

        //store

        storeDB.collection("roles").find({ "id": person.id }).toArray(function (err, result) {
            if (!err) {
                if (result.length == 1) { //for members that are already in the database
                    var myquery = { "id": person.id };
                    var newvalues = { $set: { "roles": JSON.stringify(roles), "nick": nick } };
                    storeDB.collection("roles").updateOne(myquery, newvalues, function (err, res) {
                        if (err) throw err;
                    });
                } else { //for members that aren't on tbe database yet
                    storeDB.collection("roles").insertOne({ "id": person.id, "roles": JSON.stringify(roles), "nick": nick }, function (err, res) {
                        if (err) throw err;
                    });
                }
            }
        });
    });
});

//restore on join
client.on('guildMemberAdd', (joiner) => {
    mongo.connect(MONGO_URL, { useUnifiedTopology: true }).then((mongoClient) => {
        var storeDB = mongoClient.db('roles');

        storeDB.collection("roles").find({ "id": joiner.id }).toArray(function (err, result) {
            if (!err) {
                if (result.length == 1) {
                    for (var id of JSON.parse(result[0].roles)) {
                        if (id.length != 0) {
                            joiner.roles.add(id).catch(function (er) {
                                console.error(er);
                            });
                        }
                    }

                    if (result[0].nick) {
                        joiner.setNickname(result[0].nick);
                    }
                }
            }
        });
    });
});