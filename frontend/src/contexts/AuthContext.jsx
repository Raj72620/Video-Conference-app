import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";


export const AuthContext = createContext({});

const client = axios.create({
       baseURL: `${server}/api/v1/users`,
    headers: {
        'Content-Type': 'application/json'
    }
})

export const AuthProvider = ({ children }) => {

    const authContext = useContext(AuthContext);


    const [userData, setUserData] = useState(authContext);


    const router = useNavigate();

const handleRegister = async (name, username, password) => {
    try {
        const response = await client.post("/register", {
            name,
            username, 
            password
        });
        
        console.log("Registration response:", response); // Debug log
        
        if (response.status !== httpStatus.CREATED) {
            throw new Error(response.data?.message || "Registration failed");
        }
        
        return response.data;
    } catch (err) {
        console.error("Registration error:", err.response?.data || err.message);
        throw err.response?.data || { message: "Registration failed" };
    }
}

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });

            console.log(username, password)
            console.log(request.data)

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                router("/home")
            }
        } catch (err) {
            throw err;
        }
    }

    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data
        } catch
         (err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request
        } catch (e) {
            throw e;
        }
    }


// Add this new function to the AuthProvider component
const deleteMeeting = async (meetingId) => {
    try {
        await client.delete(`/delete_meeting/${meetingId}`, {
            params: {
                token: localStorage.getItem("token")
            }
        });
        return true; // Indicate success
    } catch (err) {
        throw err;
    }
}

// Update the data object to include the new function
const data = {
    userData, setUserData, addToUserHistory, getHistoryOfUser, 
    handleRegister, handleLogin, deleteMeeting
}

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )

}