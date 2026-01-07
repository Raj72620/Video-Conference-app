import axios from "axios";
import httpStatus from "http-status";
import { createContext, useState } from "react";
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
    const [userData, setUserData] = useState(() => {
        try {
            const user = localStorage.getItem("user");
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error("Error parsing user data:", e);
            return null;
        }
    });

    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            const response = await client.post("/register", {
                name,
                username,
                password
            });

            console.log("Registration response:", response);

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
            const response = await client.post("/login", {
                username: username,
                password: password
            });

            console.log("Login response:", response.data);

            if (response.status === httpStatus.OK) {
                localStorage.setItem("token", response.data.token);

                // Store complete user data with safely accessed properties
                const backendUser = response.data.user || {};

                const userData = {
                    name: backendUser.name || "Guest",
                    username: backendUser.username || username,
                    email: backendUser.email || backendUser.username || "No email"
                };

                localStorage.setItem("user", JSON.stringify(userData));
                setUserData(userData);
                router("/home");
                return response.data;
            }
        } catch (err) {
            console.error("Login error:", err.response?.data || err.message);
            throw err.response?.data || { message: "Login failed" };
        }
    }

    const getHistoryOfUser = async () => {
        try {
            const response = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return response.data;
        } catch (err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            const response = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return response.data;
        } catch (e) {
            throw e;
        }
    }

    const deleteMeeting = async (meetingId) => {
        try {
            await client.delete(`/delete_meeting/${meetingId}`, {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return true;
        } catch (err) {
            throw err;
        }
    }

    const refreshUserData = () => {
        try {
            const user = localStorage.getItem("user");
            if (user) {
                setUserData(JSON.parse(user));
            }
        } catch (e) {
            console.error("Error refreshing user data", e);
        }
    }

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUserData(null);
        router("/auth");
    }

    const data = {
        userData,
        setUserData,
        addToUserHistory,
        getHistoryOfUser,
        handleRegister,
        handleLogin,
        deleteMeeting,
        refreshUserData,
        logout
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
}