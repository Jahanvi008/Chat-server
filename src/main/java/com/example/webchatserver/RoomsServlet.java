package com.example.webchatserver;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import jakarta.servlet.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;

@WebServlet(name = "RoomsServlet", value = "/chat-servlet/rooms")
public class RoomsServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String result = "[";
        if(!ChatServlet.rooms.isEmpty()){
            for(String elem : ChatServlet.rooms){
                result += "\"";
                result  += elem;
                result += "\"";
                result += ",";
            }
            result  = result.substring(0,result.length() - 1);
        }

        result += "]";
        response.setContentType("text/plain");

        // send the random code as the response's content
        PrintWriter out = response.getWriter();
        out.println(result);

    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

    }
}
