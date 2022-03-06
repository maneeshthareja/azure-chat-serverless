const CosmosClient = require("@azure/cosmos").CosmosClient;

const endpoint = "https://tokenquery.documents.azure.com:443/";
const key = "gDJyh4zoqpK1OTbWqg1UePcdVlpy5aP4k79KsNZmrO0M1SnRorZT2dJ38Wdbhdr1D7Czj7lp9bwJTjhHRkVk8g==";

const client = new CosmosClient({ endpoint, key });

const databaseId = "usersDB";
const containerId = "users";

const database = client.database(databaseId);
const container = database.container(containerId);




module.exports = async function (context, req) {

    let userCreds = {
        "name": req.query.name,
    }

    const { resource: createdItem } = await container.items.create(userCreds);

    const responseMessage = "Yay, successfully created item in DB";

    // context.log('JavaScript HTTP trigger function processed a request.');

    // const name = (req.query.name || (req.body && req.body.name));
    // const responseMessage = "hello brother"; 
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}