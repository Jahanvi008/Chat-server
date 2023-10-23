// declare global variables
let ws;
let UserName = "";
let CurrentRoom = "";

let ListOfRooms = [];
let IndexPageAreaToUpdateRef = document.getElementById("main");
let ListOfRoomsTemplateRef = document.getElementById("ListOfRoomsTemplate");
let MessageInputAreaFormRef = "";
let LeaveRoomBtnRef = document.getElementById("LeaveRoomBtn");
let CreateAndJoinChatRoomBtnRef = document.getElementById(
  "CreateAndJoinChatRoomBtn"
);

let AlertUsernameHasNotBeenCreatedYetRef = document.createElement("div");
AlertUsernameHasNotBeenCreatedYetRef.innerHTML = `<div style="margin:1rem" class="alert alert-danger" role="alert">
  Please create a username first
</div>`;
let AlertUserHasNotLeftTheRoomYetRef = document.createElement("div");
AlertUserHasNotLeftTheRoomYetRef.innerHTML = `<div class="alert alert-danger" role="alert">
  Please use the 'Leave Room Button'
</div>`;

var addAlertToDom = (givenParentDOMElem, givenDOMElem) =>
  givenParentDOMElem.insertAdjacentElement("afterbegin", givenDOMElem);

// RightBubbleMessageHTML() renders the chat bubble that the sender sends and is from sender's POV
function RightBubbleMessageHTML(
  givenUsername,
  givenMessage,
  capturedTimeStamp
) {
  return `<div class="message right-message">
              <div
                class="message-img"
                style="
                  background-image: url(https://avatars.githubusercontent.com/u/90413603?v=4);
                "
              ></div>

              <div class="message-bubble">
                <div class="message-info">
                  <div class="message-info-name">${givenUsername}</div>
                  <div class="message-info-time">${capturedTimeStamp}</div>
                </div>

                <div class="message-text">${givenMessage}</div>
              </div>
            </div>`;
}

// LeftBubbleMessageHTML() renders the left chat bubbles for the sender to see. Only renders the chat bubble if other clients in the chat send messages. 
function LeftBubbleMessageHTML(givenUsername, givenMessage, capturedTimeStamp) {
  return `<div class="message left-message">
              <div
                class="message-img"
                style="
                  background-image: url(https://avatars.githubusercontent.com/u/59520945?v=4);
                "
              ></div>

              <div class="message-bubble">
                <div class="message-info">
                  <div class="message-info-name">${givenUsername}</div>
                  <div class="message-info-time">${capturedTimeStamp}</div>
                </div>

                <div class="message-text">${givenMessage}</div>
              </div>
            </div>`;
}

// sets the Username (global variable) 
function setUserName() {
  //access myForm using document object
  UserName = document.getElementById("usernameInput").value;
  renderHomeTemplate();
}

// renders the introduction content once the client has provided a username
function renderHomeTemplate() {
  IndexPageAreaToUpdateRef.innerHTML = ``;
  IndexPageAreaToUpdateRef.innerHTML = `
  <div class="content" id="area-to-update">
      <div style="display: flex; flex-direction: column;justify-content: center">
          <div id="LeftRoomAlert" style="visibility: hidden;" class="alert alert-success" role="alert">
            Success! You've left ${CurrentRoom}
          </div>
          <div class="jumbotron">
            <h1 class="display-4">Welcome, ${UserName}</h1>
            <p class="lead"> Please use the side bar to join any room you wish to chat in. </p>
            <hr class="my-4">
            <p>Alternatively, use the 'Create button' to create your own chat room!</p>
            <p class="lead">
                <a class="btn btn-light" id="CreateAndJoinChatRoomBtn" onclick="newRoom()" role="button">Join room</a>
            </p>
          </div> 
      </div>
  </div>
    `;
  CreateAndJoinChatRoomBtnRef.style.visibility = "visible";
}

// chatWindowTemplate() renders the chat room window once the client has entered a room
function chatWindowTemplate() {
  IndexPageAreaToUpdateRef.innerHTML = ``;
  IndexPageAreaToUpdateRef.innerHTML = `<div id="chat-area-to-update" class="content">
    <section id="chat-messaging-section" class="messager flex-shrink-1 ">
      <header class="messager-header">
        <div
                id="chat-room-header-title"
                class="messager-header-title"
        ></div>
        <div class="messager-header-options">
          <span><i class="fas fa-cog"></i></span>
        </div>
      </header>

      <main id="messager-chat" class="messager-chat">
        

      </main>

      <form id="messager-inputarea-form" class="messager-inputarea">
        <input
                type="text"
                class="messager-input"
                id="messager-input"
                placeholder="Enter your message..."
        />
        <button type="submit" class="messager-send-btn">Send</button>
      </form>
    </section>
  </div>`;
  CreateAndJoinChatRoomBtnRef.style.visibility = "hidden";
  LeaveRoomBtnRef.style.visibility = "visible";
  MessageInputAreaFormRef = document.getElementById("messager-inputarea-form");
  MessageInputAreaFormRef.addEventListener("submit", ProcessMessageInputted);
}

// ProcessMessageInputted() obtains the input from the client and sends it to the server socket for further processing. 
function ProcessMessageInputted(event) {
  let messageInputtedVal = document.getElementById("messager-input").value;

  let request = {
    type: "chat",
    msg: messageInputtedVal,
  };
  ws.send(JSON.stringify(request));
  document.getElementById("messager-input").value = "";
  event.preventDefault();
}

// gets a list of rooms from the chat-servlet server endpoint and renders it on the browser. 
function GetListOfRooms() {
  ListOfRoomsTemplateRef.innerHTML = ``;
  // calling the ChatServlet to retrieve a new room ID
  let callURL =
    "http://localhost:8080/WSChatServer-1.0-SNAPSHOT/chat-servlet/rooms";
  fetch(callURL, {
    method: "GET",
    headers: {
      Accept: "text/plain",
    },
  })
    .then((response) => response.text())
    .then((response) => {
      console.log(response);
      console.log(JSON.parse(response));
      ListOfRooms = JSON.parse(response);
      if (ListOfRooms.length != 0) {
        for (room in ListOfRooms) {
          const tempLI = document.createElement("li");
          tempLI.style.alignSelf = "center";
          tempLI.style.paddingInline = "0.75rem";
          tempLI.innerHTML = `<a class="nav-link" href="#" onClick="enterRoom('${ListOfRooms[room]}')">${ListOfRooms[room]}</a>`;
          ListOfRoomsTemplateRef.insertAdjacentElement("beforeend", tempLI);
        }
      }
    });
}

// newRoom() processes a new chat room request by the client. 
function newRoom() {
  // calling the ChatServlet to retrieve a new room ID
  // this is a new change

  let callURL = "http://localhost:8080/WSChatServer-1.0-SNAPSHOT/chat-servlet";
  fetch(callURL, {
    method: "GET",
    headers: {
      Accept: "text/plain",
    },
  })
    .then((response) => response.text())
    .then((response) => {
      GetListOfRooms();
      enterRoom(response);
    }); // enter the room with the code

  CreateAndJoinChatRoomBtnRef.style.visibility = "hidden";
  LeaveRoomBtnRef.style.visibility = "visible";
}

function SetCurrentRoom(givenCode) {
  CurrentRoom = givenCode;
}
function GetCurrentRoom() {
  return CurrentRoom;
}

function enterRoom(code) {
  // refresh the list of rooms

  // create the web socket
  ws = new WebSocket(
    "ws://localhost:8080/WSChatServer-1.0-SNAPSHOT/ws/" + code
  );

  if (UserName == "") {
    addAlertToDom(
      document.getElementById("area-to-update"),
      AlertUsernameHasNotBeenCreatedYetRef
    );
    console.error(
      "Something went wrong. Cannot send username to the server. Please restart application"
    );
    throw new UserException(
      "Something went wrong. Cannot send username to the server. Please restart application"
    );
  } else if (CurrentRoom != "") {
    addAlertToDom(
      document.getElementById("chat-messaging-section"),
      AlertUserHasNotLeftTheRoomYetRef
    );
    console.error(
      "Something went wrong. Cannot send username to the server. Please restart application"
    );
  } else {
    chatWindowTemplate();
    var ChatRoomTitleRef = document.getElementById("chat-room-header-title");
    ChatRoomTitleRef.innerHTML = `${code}`;
    SetCurrentRoom(code);

    let request = {
      type: "setUserName",
      msg: UserName,
    };

    ws.onopen = () => ws.send(JSON.stringify(request));
    let ListOfMessagesAreaRef = document.getElementById("messager-chat");
    // parse messages received from the server and update the UI accordingly
    ws.onmessage = function (event) {
      console.log("Server sending data : ", event.data);
      // parsing the server's message as json
      let message = JSON.parse(event.data);
      console.log(" Message " + message.message);
      console.log(" Username " + message.username);
      const wrapperDiv = document.createElement("div");
      wrapperDiv.style.marginBottom = "10px";
      // handle message
      var capturedTimeStamp = new Date().toLocaleTimeString();
      if (message.username == UserName && message.message != UserName) {
        wrapperDiv.innerHTML = RightBubbleMessageHTML(
          UserName,
          message.message,
          capturedTimeStamp
        );
        ListOfMessagesAreaRef.insertAdjacentElement("beforeend", wrapperDiv);
      } else if (message.username == "Server") {
        wrapperDiv.classList.add("form-tex");
        wrapperDiv.classList.add("text-muted");
        wrapperDiv.style.marginBlock = "1.25rem";
        wrapperDiv.style.textAlign = "center";
        wrapperDiv.innerHTML = message.message;
        ListOfMessagesAreaRef.insertAdjacentElement("beforeend", wrapperDiv);
      } else if (message.message != UserName) {
        wrapperDiv.innerHTML = LeftBubbleMessageHTML(
          message.username,
          message.message,
          capturedTimeStamp
        );
        ListOfMessagesAreaRef.insertAdjacentElement("beforeend", wrapperDiv);
      }
    };
  }
}

// closes the client socket once the client requests to leave a room
function leaveRoom() {
  console.log("Closing ws ", ws);
  ws.close();
  LeaveRoomBtnRef.style.visibility = "hidden";
  renderHomeTemplate();
  let LeftRoomAlertRef = document.getElementById("LeftRoomAlert");
  LeftRoomAlertRef.style.visibility = "visible";
  CurrentRoom = "";
}

(function () {})();

GetListOfRooms();

// fetch the list of chat rooms every 100 seconds to get the latest list of chat rooms. 
setInterval(GetListOfRooms, 100 * 1000);
window.onbeforeunload = function () {
  ws.close();
  ws.onclose = function () {}; // disable onclose handler first
  clearInterval(setInterval);
};
