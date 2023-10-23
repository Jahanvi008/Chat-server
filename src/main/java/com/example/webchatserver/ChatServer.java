package com.example.webchatserver;


import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;


/**
 * This class represents a web socket server, a new connection is created and it receives a roomID as a parameter
 * **/
@ServerEndpoint(value="/ws/{roomID}")
public class ChatServer {

    // contains a static List of ChatRoom used to control the existing rooms and their users
    /** Chat Room has two attributes
        - code
        - List of people in the chat room
    **/
    public static List<ChatRoom> listOfChatRooms = new ArrayList<ChatRoom>();

    /*
    open(...) - logs and adds client to the chat room whenever a new connection is opened. 
    param:
         String roomID - represents the room code from where the client is trying to open a connection with the server.
         Session session - represents the client socket and has attributes about the client. 
    returns: void
    */
    @OnOpen
    public void open(@PathParam("roomID") String roomID, Session session) throws IOException, EncodeException {

        // accessing the roomID parameter
        System.out.println("Path parameter: " + roomID);

        // Check if the chat room already exists, if not create a new one with a random alphanumeric code
        ChatRoom chatRoom = FindChatRoom(roomID);
        if(chatRoom == null){
            ChatRoom newChatRoomCreated = new ChatRoom(roomID, session.getId());
            listOfChatRooms.add(newChatRoomCreated);
        }
        else{
            // setting the username as a empty string. Will set the username in the onMessage func
            chatRoom.getUsers().put(session.getId(),"");
            System.out.print("Room already exists! Adding new client " + session.getId() + "to the chat room : " + chatRoom.getCode());
        }

        // Greet the new user
        session.getBasicRemote().sendText("{\"type\": \"Open\"" + ","+ "\"username\": \"" + "Server" + "\", \"message\":\"" + "Welcome to the chat room " + roomID + "\"}");

    }

    /*
    close(...) - logs and removes client from the chat room whenever a connection is closed. 
    param:
         String roomID - represents the room code from where the client is trying to close a connection with the server.
         Session session - represents the client socket and has attributes about the client. 
    returns: void
    */
    @OnClose
    public void close(@PathParam("roomID") String roomID, Session session) throws IOException, EncodeException {
        ChatRoom chatRoom = FindChatRoom(roomID);
        if(chatRoom == null)
            throw new IOException("Server: Room does not exist");
        String username = FindUsernameInChatRoom(chatRoom.getCode(), session.getId());
        BroadcastMessage(chatRoom, session, "{\"type\": \"Close\"" + ","+ "\"username\": \"" + "Server" + "\", \"message\":\"" + username + " left the chat room." + "\"}");
        chatRoom.getUsers().remove(session.getId());

    }

    /*
    handleMessage(...) - logs and broadcasts messages from the incoming client to rest of the clients in the given room. 
    param:
         String roomID - represents the room code from where the client is trying to broadcast the message to their audience. 
         Session session - represents the client socket and has attributes about the client. 
    returns: void
    */
    @OnMessage
    public void handleMessage(@PathParam("roomID") String roomID, String comm, Session session) throws IOException, EncodeException {
//        example getting unique userID that sent this message
        String userId = session.getId();

//        Example conversion of json messages from the client
        JSONObject jsonmsg = new JSONObject(comm);
        String type = (String) jsonmsg.get("type");
        String message = (String) jsonmsg.get("msg");

        String chatRoomCode = roomID;
        ChatRoom result = FindChatRoom(chatRoomCode);

        if (result == null){
            throw new IOException(" Room is non-existent !");
        }

        switch(type) {
            case "setUserName":
                UpdateUsernameInChatRoom(chatRoomCode, userId, message);
                BroadcastMessage(result,session,"{\"type\": \"SetUserName\"" + ","+ "\"username\": \"" + "Server" + "\", \"message\":\"" + message + " joined the room." + "\"}");
            case "chat":
                String senderUsername = FindUsernameInChatRoom(chatRoomCode, userId);
                // only send a message if it is not the username
                if(senderUsername != message)
                    BroadcastMessage(result,session,"{\"type\": \"chat\"" + ","+ "\"username\": \"" + senderUsername + "\", \"message\":\"" + message + "\"}");
                break;
            default:
                throw new IOException("error : client sent wrong instruction. ");
        }

    }


    public static ChatRoom FindChatRoom(String givenChatRoomCode){
        String reFormattedChatRoomCode = givenChatRoomCode.replace("\r\n", "");
        ChatRoom result = listOfChatRooms.stream()
                .filter(givenChatRoom -> reFormattedChatRoomCode.toString().equalsIgnoreCase(givenChatRoom.getCode().toString()))
                .findAny()
                .orElse(null);

        return result;

    }

    /*
    BroadcastMessage(ChatRoom givenChatRoom, Session session, String givenJSONObjToBeBroadcasted) - filters users and broadcasts messages towards the filtered audience. 
    params: 
        ChatRoom givenChatRoom : represents the chat room that the broadcasted message is meant for. 
        Session session: contains all the attributes of all the clients that are currently connected to the server. 
        String givenJSONObj: represents the message meant to be broadcasted. 
    returns:
        The number of people, the message was broadcasted to. 
    */
    public static int BroadcastMessage(ChatRoom givenChatRoom, Session session, String givenJSONObjToBeBroadcasted) throws IOException{
        int countPeers = 0;
        for (Session peer : session.getOpenSessions()){ //broadcast this person left the server
            if(givenChatRoom.getUsers().containsKey(peer.getId())) { // broadcast only to those in the same room
                peer.getBasicRemote().sendText(givenJSONObjToBeBroadcasted);
                countPeers++; // count how many peers are left in the room
            }
        }
        return countPeers;
    }

    /*
    UpdateUsernameInChatRoom(...) updates the username within the given chat room
    */
    public static void  UpdateUsernameInChatRoom(String givenChatRoomCode, String givenSessionID, String givenUserName){
        String reFormattedChatRoomCode = givenChatRoomCode.replace("\r\n", "");
        ChatRoom result = listOfChatRooms.stream()
                .filter(givenChatRoom -> reFormattedChatRoomCode.toString().equalsIgnoreCase(givenChatRoom.getCode().toString()))
                .findAny()
                .orElse(null);
        if(result == null)
            throw new RuntimeException("Client whose username is to be updated does not exist! Please try again! ");
        result.getUsers().put(givenSessionID, givenUserName);
    }

     /*
    FindUsernameInChatRoom(...) finds the username within the given chat room and returns it as a String. 
    */
    public static String  FindUsernameInChatRoom(String givenChatRoomCode, String givenSessionID) throws IOException{
        String reFormattedChatRoomCode = givenChatRoomCode.replace("\r\n", "");
        ChatRoom result = listOfChatRooms.stream()
                .filter(givenChatRoom -> reFormattedChatRoomCode.toString().equalsIgnoreCase(givenChatRoom.getCode().toString()))
                .findAny()
                .orElse(null);
        if(result == null)
            throw new IOException("Chat room cannot be found");

        return result.getUsers().get(givenSessionID);

    }

}

