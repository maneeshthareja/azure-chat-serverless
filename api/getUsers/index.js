const CosmosClient = require("@azure/cosmos").CosmosClient;
const endpoint = "https://tokenquery.documents.azure.com:443/";
const key = "gDJyh4zoqpK1OTbWqg1UePcdVlpy5aP4k79KsNZmrO0M1SnRorZT2dJ38Wdbhdr1D7Czj7lp9bwJTjhHRkVk8g==";
const client = new CosmosClient({ endpoint, key });
const databaseId = "usersDB";
const containerId = "users";
const database = client.database(databaseId);
const container = database.container(containerId);


module.exports = async function (context, req) {
    let username = (req.query.username || (req.body && req.body.username));
    let querySpec = {
        query: "SELECT * FROM c ORDER BY c._ts DESC"
    }
    // context.log('username: ', username);
    if (username) {
        username = username.toLowerCase();
        querySpec = {
            query: "SELECT * FROM c WHERE LOWER(c.name) != '"+username+"' ORDER BY c._ts DESC"
        }
    }
    // context.log('querySpec: ', querySpec);
    
    const {resources: items} = await container.items.query(querySpec).fetchAll();
    // context.log('itm: ', items);
    const responseMessage = "User list";
    const status = 200;
    const body = {responseMessage, status, items};
    context.res = {body};
}