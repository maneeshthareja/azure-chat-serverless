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
    username = username.toLowerCase();
    let querySpec = {
        query: "SELECT * FROM users s WHERE LOWER(s.name) = " + "'" + username + "'"
    }

    const {resources: items} = await container.items.query(querySpec).fetchAll();

    let itm = items.find(item => item.name.toLowerCase() === username);

    let responseMessage;
    let status = 200;

    context.log('itm: ', itm);
    if (itm && itm.name) {
        responseMessage = "user exists";
        const { id, name } = itm;
        itm.status = true;
        const { resource: updatedItem } = await container.item(id).replace(itm);
        context.log('updatedItem: ', updatedItem);
    } else {
        let userCreds = {"name": username, "status": true}
        const { resource: createdItem } = await container.items.create(userCreds);
        itm = createdItem;
        responseMessage = "new user created";
    }

    const body = {responseMessage, status, item: itm};
    context.res = {body};
}
