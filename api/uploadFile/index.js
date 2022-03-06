const { BlobServiceClient } = require("@azure/storage-blob");
let multipart = require("parse-multipart");
const AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=samchatv1;AccountKey=5bM7uxckeHklSickpBcve/wJsS9i1znXoK+p59gm5CTJODdj6SII/lHf5+IQSkiXszlwpYRbXo0kjfvigOTrMA==;EndpointSuffix=core.windows.net"

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    let bodyBuffer = Buffer.from(req.body);
    let boundary = multipart.getBoundary(req.headers['content-type']);
    let parts = multipart.Parse(bodyBuffer, boundary);
    const blobServiceClient = await BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const container = "fileuploadv2";
    const containerClient = await blobServiceClient.getContainerClient(container);
    const blobName = parts[0].filename;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const uploadBlobResponse = await blockBlobClient.upload(parts[0].data, parts[0].data.length);
    context.log('uploaded blob response: ', uploadBlobResponse);
    context.res = { status: 200, body: { file: uploadBlobResponse, url: blockBlobClient.url }};
    context.done();
}