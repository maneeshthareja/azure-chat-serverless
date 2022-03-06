module.exports = function (context, req) {
  const messageObject = req.body;
  context.bindings.signalRMessages = [{
    "target": "newMessage",
    "userId": messageObject.userId,
    "arguments": [ messageObject ]
  }];
  context.done();
  };