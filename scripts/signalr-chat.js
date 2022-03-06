document.addEventListener("DOMContentLoaded", () => {
    // const LOCAL_BASE_URL = 'http://localhost:7071';
    // const REMOTE_BASE_URL = 'https://man-function-app.azurewebsites.net';

    // const getAPIBaseUrl = () => {
    //     const isLocal = /localhost/.test(window.location.href);
    //     return isLocal ? LOCAL_BASE_URL : REMOTE_BASE_URL;
    // }
    // const apiBaseUrl = getAPIBaseUrl();
    const apiBaseUrl = 'https://man-function-app.azurewebsites.net';
    // const apiBaseUrl = window.location.origin + ':7071';

    const chatObject = {
        userList: [],
        from_user: '',
        to_user: '',
        messages: {
            // "groupchat":[
            //      newMessages: 0;    
            //     {"sender": "maneesh","to":"groupchat","message":"Hello Samar this is group chat"},
            //     {"sender": "samar","to":"groupchat","message":"Hello Maneesh this is group chat"}
            // ]
        },
    };
    let connection = '';
    let activeUser = 0;
    let username = '';

    function storeMessageHistory(sender, receiver, message) {
        if (receiver) {
            let newMessageObj = {};
            let messageObj = chatObject.messages;
            if (messageObj.hasOwnProperty(receiver)) {
                newMessageObj = { "sender": sender, "to": receiver, "message": message };
                chatObject.messages[receiver].push(newMessageObj);
            } else {
                newMessageObj[receiver] = [{ "sender": sender, "to": receiver, "message": message }];
                chatObject.messages = Object.assign(chatObject.messages, newMessageObj);
            }
        }
    }
    // load chat history for the current selected user or for group chat
    function loadMessageHistory(forUser) {
        let messageObj = chatObject.messages;
        let messageBox = document.getElementById('messages');
        messageBox.innerHTML = "";
        messageBox.scrollTop = messageBox.scrollHeight;
        if (messageObj.hasOwnProperty(forUser)) {
            let messageList = messageObj[forUser];
            messageList.forEach(function (item, index) {
                messageCallback(item.sender, item.message);
            });

        }
    }

    function generateRandomName() {
        return Math.random().toString(36).substring(2, 10);
    }

    function createMessageEntry(encodedName, encodedMsg) {
        var entry = document.createElement('div');
        entry.classList.add("message-entry");
        if (encodedName === "_SYSTEM_") {
            entry.innerHTML = encodedMsg;
            entry.classList.add("text-center");
            entry.classList.add("system-message");
        } else if (encodedName === "_BROADCAST_") {
            entry.classList.add("text-center");
            entry.innerHTML = '<div class="text-center broadcast-message">' + encodedMsg + '</div>';
        } else if (encodedName === username) {
            if (encodedMsg.includes('https://samchatv1.blob.core.windows.net/fileuploadv2/')) {
                if (encodedMsg.includes('.pdf') || encodedMsg.includes('.doc') || encodedMsg.includes('.docx')) {
                    entry.innerHTML = '<div class="message-avatar pull-right">' + encodedName + '</div>' +
                    '<div class="message-content pull-right"><img class="message-content doc" src="./images/document.svg"><a href="' + encodedMsg + '" download>' + encodedMsg + '<a/></div>';
                } else {
                entry.innerHTML = '<div class="message-avatar pull-right">' + encodedName + '</div>' +
                    '<img class="message-content pull-right" style="width:300px" src="' + encodedMsg + '">';
                }
            } else {
                entry.innerHTML = '<div class="message-avatar pull-right">' + encodedName + '</div>' +
                    '<div class="message-content pull-right">' + encodedMsg + '<div>';
            }
        } else {
            if (encodedMsg.includes('https://samchatv1.blob.core.windows.net/fileuploadv2/')) {
                if (encodedMsg.includes('.pdf') || encodedMsg.includes('.doc') || encodedMsg.includes('.docx')) {
                    entry.innerHTML = '<div class="message-avatar pull-right">' + encodedName + '</div>' +
                    '<div class="message-content pull-right"><img class="message-content doc" src="./images/document.svg"><a href="' + encodedMsg + '" download>' + encodedMsg + '<a/></div>';
                } else {
                entry.innerHTML = '<div class="message-avatar pull-right">' + encodedName + '</div>' +
                    '<img class="message-content pull-right" style="width:300px" src="' + encodedMsg + '">';
                }
            } else {
                entry.innerHTML = '<div class="message-avatar pull-right">' + encodedName + '</div>' +
                    '<div class="message-content pull-right">' + encodedMsg + '<div>';
            }
        }
        return entry;
    }

    function sendMessage(sender, messageText) {
        console.log('send message called');
        if (chatObject.to_user && chatObject.to_user != "groupchat") { // send to specific user
            messageCallback(sender, messageText); // appending message for sender's own window
            storeMessageHistory(sender, chatObject.to_user, messageText);
            return axios.post(`${apiBaseUrl}/api/broadcast`, {
                sender: sender,
                userId: chatObject.to_user,
                text: messageText
            }, getAxiosConfig()).then(resp => resp.data).catch(err => {
                console.log('err in sending message: ', err);
                return err;
            });

        } else { // broadcast messge
            // storeMessageHistory(sender, 'groupchat', messageText);
            return axios.post(`${apiBaseUrl}/api/broadcast`, {
                sender: sender,
                text: messageText
            }, getAxiosConfig()).then(resp => resp.data).catch(err => {
                console.log('err in sending message else: ', err);
                return err;
            });

        }
    }

    function messageCallback(name, message) {
        if (!message) return;

        // Html encode display name and message.
        let encodedName = name;
        let encodedMsg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        let messageEntry = createMessageEntry(encodedName, encodedMsg);

        let messageBox = document.getElementById('messages');
        messageBox.appendChild(messageEntry);
        messageBox.scrollTop = messageBox.scrollHeight;
    }

    function bindConnectionMessage(connection) {
        let close = function (name, message) {
            setTimeout(() => connection.stop(), 10000);
        }

        // Create a function that the hub can call to broadcast messages.
        connection.on("newMessage", (res) => {
            let receiver = res.userId ? res.sender : 'groupchat';
            storeMessageHistory(res.sender, receiver, res.text);

            if (res.sender == chatObject.to_user && receiver != "groupchat") { // if current chat window is the one from which message came then show otherwise not
                messageCallback(res.sender, res.text);
            } else if (receiver == "groupchat" && chatObject.to_user == "groupchat") { // if group chat message is coming and current user is on group chat window then show
                messageCallback(res.sender, res.text);
            } else { // update the new message count and show the count on sender's name
                updateNewMessageCount(receiver, 1); // update user's new message count by 1
            }

        });
        connection.on('echo', messageCallback);
        connection.on('exit', close);
        connection.on('usersList', (message) => {
            // document.getElementById("messages").innerHTML = message;
            // displayUserList(message)
            storeUserList(message);
        });
        connection.onclose(onConnectionError);
    }

    function onConnected(connection) {
        console.log('connection started');
        // connection.invoke('broadcastMessage', '_SYSTEM_', username + ' JOINED');
        // sendMessage('_SYSTEM_', username + ' JOINED');
        document.getElementById('sendmessage').addEventListener('click', function (event) {
            // Call the broadcastMessage method on the hub.
            if (messageInput.value) {
                // connection.send('broadcastMessage', username, messageInput.value);
                sendMessage(username, messageInput.value);
            }

            // Clear text box and reset focus for next comment.
            messageInput.value = '';
            messageInput.focus();
            event.preventDefault();
        });
        document.getElementById('message').addEventListener('keypress', function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                document.getElementById('sendmessage').click();
                return false;
            }
        });
        document.getElementById('echo').addEventListener('click', function (event) {
            // Call the echo method on the hub.
            // connection.send('echo', username, messageInput.value);
            sendMessage(username, 'echo: ' + messageInput.value);

            // Clear text box and reset focus for next comment.
            messageInput.value = '';
            messageInput.focus();
            event.preventDefault();
        });
    }

    function onConnectionError(error) {
        if (error && error.message) {
            console.warn(error.message);
            var modal = document.getElementById('myModal');
        } else {
            var modal = document.getElementById('closeModal');
        }
        modal.classList.add('in');
        modal.style = 'display: block;';
    }

    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function getAxiosConfig() {
        const config = {
            headers: {}
        };
        return config;
    }

    function getSignalRNegotiation() {
        return axios.post(`${apiBaseUrl}/api/negotiate?userId=${username}`, null, getAxiosConfig())
            .then(resp => {
                return resp.data;
            })
            .catch(err => {
                return err;
            })
    }

    function initiateSingnalRConnection() {
        getSignalRNegotiation().then(info => {
            // make compatible with old and new SignalRConnectionInfo
            info.accessToken = info.accessToken || info.accessKey;
            info.url = info.url || info.endpoint;

            const options = {
                accessTokenFactory: () => info.accessToken
            };

            connection = new signalR.HubConnectionBuilder()
                .withUrl(info.url, options)
                .configureLogging(signalR.LogLevel.Information)
                .build();

            connection.start()
                .then(function () {
                    console.log('connection created');
                    onConnected(connection);
                })
                .catch(function (error) {
                    console.log('connection failed');
                    console.warn(error);
                });
            bindConnectionMessage(connection);
        }).catch(alert);
    }

    function registerUserCosmosDB(usrnm) {
        console.log('login called');
        return axios.get(`${apiBaseUrl}/api/login?username=${usrnm}`, null, getAxiosConfig())
            .then(resp => {
                return resp.data;
            })
            .catch(err => {
                console.log('err in login: ', err);
            });
    }

    function userChat(chatUser) {
        loadMessageHistory(chatUser);
        if (chatUser) { // if one to one chat initiated
            chatObject.from_user = username;
            chatObject.to_user = chatUser;
        }
    }
    function groupChat() {
        loadMessageHistory('groupchat');
        chatObject.from_user = username;
        chatObject.to_user = 'groupchat';
    }



    /*********** Left user listing code */
    // Fetch data from DB and display user list in left panel
    function getUsers(usrnm) {
        console.log('get users: ', usrnm);
        return axios.get(`${apiBaseUrl}/api/getUsers?username=${usrnm}`, null, { 'headers': {} })
            .then(function (resp) {
                console.log('resp: ', resp);
                return resp.data;
            })
            .catch(function (err) {
                console.log(261, err);
                return err;
            });
    }

    function storeUserList(data){
        if (data && data.items && data.items.length > 0) {
            if(chatObject.userList.length>0){ // update each userStatus only
                var items = data.items;
                for (var i = 0; i < items.length; i++) {
                    if(username.toLowerCase() !== data.items[i].name.toLowerCase()){
                        chatObject.userList[i].status = data.items[i].status;
                    }                
                }
            } else {
                let gItem = {name: 'groupchat', status: true};
                chatObject.userList = data.items; // override the userList array with same array coming from api
                chatObject.userList.splice(0,0,gItem);
            }
            displayUserList();
        }
        
    }

    function updateNewMessageCount(usrName, updateCount){
        if(chatObject.userList.length>0){ // update each userStatus only
            var items = chatObject.userList;
            for (var i = 0; i < items.length; i++) {
                if(usrName.toLowerCase() == chatObject.userList[i].name.toLowerCase()){
                    if(updateCount){
                        chatObject.userList[i].newMessages = chatObject.userList[i].newMessages?chatObject.userList[i].newMessages+updateCount:updateCount;
                    } else {
                        chatObject.userList[i].newMessages = 0;
                    }
                    
                    break;
                }                
            }
        } 
        displayUserList();
    }

    function displayUserList() {
        // storeUserList(data);
        if (chatObject.userList && chatObject.userList.length > 0) {
            var items = chatObject.userList;
            // var li = '<li class="list-group-item" data-index="0" data-name="Group chat"><img src="./images/avatar.jpg" alt="Avatar" class="avatar"><div class="status-circle active"></div>Group chat</li>';
            var li = '';
            for (var i = 0; i < items.length; i++) {
                if(username.toLowerCase() !== chatObject.userList[i].name.toLowerCase()){
                    let userStatus = items[i].status ? 'active' : '';
                    let displayName = items[i].name == "groupchat" ? "Group chat": items[i].name;
                    let badge = chatObject.userList[i].newMessages?(chatObject.userList[i].newMessages>1?chatObject.userList[i].newMessages+' new messages':chatObject.userList[i].newMessages+' new message'):0; 
                    li += '<li class="list-group-item" data-index="'+(i+1)+'" data-name="'+displayName+'"><img src="./images/avatar.jpg" alt="Avatar" class="avatar"><div class="status-circle '+userStatus+'"></div>' +displayName + '<span class="badge" data-notification="'+badge+'">'+badge+'</span></li>';
                }                
            }
            $('.user-list').html(li);
            displaySelectedUserOrGroup();
        }
    }

    function displayUserNameAtHeader(data) {
        try {
           var elem = $('.curret-user-item');
           var name = data.item.name;
           if (elem && elem.length > 0) {
                elem.find('.current-user').text(name);
                elem.addClass('visible');
           }
        } catch (e) {
           
        }
    }

    function updateChatHeader(name) {
        try {
            $('#active-chat-name').text(name);
        } catch (e) {
            console.log(e);
        }
    }

    function displaySelectedUserOrGroup() {
        try {
            $('.list-group-item').removeClass('active-chat');
            $('.list-group-item[data-index="' + activeUser + '"]').addClass('active-chat');
        } catch (e) {
            console.log(e);
        }
    }
    // Listner
    $(document).on('click', 'li.list-group-item', function () {
        var _this = $(this);
        var getId = _this.data('index');
        var name = _this.data('name');
        // active-chat-name
        console.log(name);
        activeUser = getId;
        displaySelectedUserOrGroup();
        updateChatHeader(name);
        if (name === 'groupchat' || name === 'Group chat') {
            groupChat();
            updateNewMessageCount('groupchat', 0); // update new message count to 0 for the selected group chat
        } else {
            userChat(name);
            updateNewMessageCount(name, 0); // update new message count to 0 for the selected user
        }

    });

    $(document).on('click', '#sign-out', function () {
        var usrnm = $(this).data('name');
        var res = axios.get(`${apiBaseUrl}/api/logout?username=${usrnm}`, null, { 'headers': {} })
            .then(function (resp) {
                console.log(resp.data);
                location.reload();
            })
            .catch(function () { return {} })
    });
    /*********** Left user listing code*/

    // ====================================== file upload ==================

    let filesList;
    const inputElement = document.getElementById("myFile");
    inputElement.addEventListener("change", getFiles, false);
   
    function getFiles() {
        filesList = this.files;
        console.log('fileList: ', filesList);
        handleFiles();
    }

    function handleFiles() {
        let formData = new FormData();
        formData.append('filename', filesList[0]);
        console.log('filename: ', formData.get('filename'));
        const headers = {'Content-Type': 'multipart/form-data', 'Access-Control-Allow-Origin': '*'};
        axios.post(`${apiBaseUrl}/api/uploadFile`, formData, {headers})
        .then(resp => {
            console.log('resp from upload file: ', resp, resp.data.url);
            sendMessage(username, resp?.data?.url);
            return resp.data;
        })
        .catch(err => {
            console.log('err gc: ', err);
        });
    }

    // +++++++++++++++++++++++++++++++++++++++++ file upload ends +++++++++++

    //*************************** execution starts from here ***************

    // Get the user name and store it to prepend to messages.
    username = generateRandomName();
    let promptMessage = 'Enter your name:';
    do {
        username = prompt(promptMessage, username);
        username = username.toLowerCase();
        if (!username || username.startsWith('_') || username.indexOf('<') > -1 || username.indexOf('>') > -1) {
            username = '';
            promptMessage = 'Invalid input. Enter your name:';
        }
    } while (!username)

    // Set initial focus to message input box.
    let messageInput = document.getElementById('message');
    messageInput.focus();

    // Get user list except loggedin User
    getUsers(username).then(function (users) {
        console.log('data', users);
        // displayUserList(users);
        storeUserList(users);
    })

    // adding current user in the DB and making status active in cosmos DB
    // registerUserCosmosDB(username);
    registerUserCosmosDB(username).then(function (user) {
        console.log('data', user);
        var name = user.item.name;
        $('#sign-out').data('name', name);
        displayUserNameAtHeader(user);
    })

    // registering user in signalR service
    initiateSingnalRConnection();
    // start groupChat
    groupChat();

    // ************************************* execution ends from here ***************
});