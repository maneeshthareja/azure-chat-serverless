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

    const { resources: items } = await container.items.query(querySpec).fetchAll();

    let itm = items.find(item => item.name.toLowerCase() === username);

    const { id } = itm;
    itm.status = false;
    const { resource: updatedItem } = await container.item(id).replace(itm);
    context.log('updatedItem: ', updatedItem);

    let responseMessage = 'Successfully signed out';
    let status = 200;

    const body = { responseMessage, status };
    context.res = { body };
}
