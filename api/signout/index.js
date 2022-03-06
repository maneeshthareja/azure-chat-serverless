const CosmosClient = require("@azure/cosmos").CosmosClient;
const endpoint = "https://tokenquery.documents.azure.com:443/";
const key = "gDJyh4zoqpK1OTbWqg1UePcdVlpy5aP4k79KsNZmrO0M1SnRorZT2dJ38Wdbhdr1D7Czj7lp9bwJTjhHRkVk8g==";
const client = new CosmosClient({ endpoint, key });
const databaseId = "usersDB";
const containerId = "users";
const database = client.database(databaseId);
const container = database.container(containerId);


module.exports = async function (context, req) {
    const username = (req.query.username || (req.body && req.body.username));

    let querySpec = {
        query: "SELECT * FROM users s WHERE s.name = " + "'" + username + "'"
    }

    const {resources: items} = await container.items.query(querySpec).fetchAll();

    let itm = items.find(item => item.name === username);
    
    const responseMessage = "user signed out";
    let status = 200;

    context.log('itm: ', itm);
    const itmId = itm.id;
    let newObj = itm;
    newObj.status = false;
    const { resource: updatedItem } = await container.item(itmId).replace(newObj);
    itm = updatedItem;

    const body = {responseMessage, status, item: itm};
    context.res = {body};
}
