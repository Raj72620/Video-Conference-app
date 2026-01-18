import { Server } from "socket.io"
import { Meeting } from "../models/meeting.model.js"

let connections = {}
let messages = {}
let timeOnline = {}
let users = {}
let bannedUsers = {}

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });
    io.on("connection", (socket) => {
        console.log("SOMETHING CONNECTED")
        socket.on("join-call", (path, username) => {

            // Check if user is banned
            if (bannedUsers[path] && bannedUsers[path].has(username)) {
                socket.emit("user-banned");
                return;
            }

            if (connections[path] === undefined) {
                connections[path] = []
            }
            connections[path].push(socket.id)
            users[socket.id] = username

            timeOnline[socket.id] = new Date();

            // Collect all users in this room to send names
            const roomUsers = connections[path].map(id => ({
                socketId: id,
                username: users[id] || 'Guest'
            }));

            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path], roomUsers)
            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
                }
            }

        })

        // Handle signaling for WebRTC

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        // Handle chat messages

        socket.on("chat-message", (data, sender) => {

            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {


                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }

                    return [room, isFound];

                }, ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                console.log("message", matchingRoom, ":", sender, data)

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }

        })

        // Handle Hand Raise
        socket.on("toggle-hand", (isRaised, meetingCode) => {
            if (connections[meetingCode]) {
                connections[meetingCode].forEach(socketId => {
                    if (socketId !== socket.id) {
                        io.to(socketId).emit("hand-update", socket.id, isRaised);
                    }
                });
            }
        });

        // Handle Reactions
        socket.on("send-reaction", (emoji, meetingCode) => {
            if (connections[meetingCode]) {
                connections[meetingCode].forEach(socketId => {
                    io.to(socketId).emit("reaction-update", socket.id, emoji);
                });
            }
        });

        // Handle Kick User
        socket.on("kick-user", (targetSocketId, meetingCode) => {
            const targetUsername = users[targetSocketId];

            // Add to banned list
            if (!bannedUsers[meetingCode]) {
                bannedUsers[meetingCode] = new Set();
            }
            if (targetUsername) {
                bannedUsers[meetingCode].add(targetUsername);
            }

            // Notify target
            io.to(targetSocketId).emit("kicked");

            // Allow disconnection cleanup to handle the rest (user-left) 
            // but force disconnect/cleanup from connections immediately to prevent lag
            // Actually, best to let client disconnect, but if they are malicious they might stay.
            // We should force remove.

            if (connections[meetingCode]) {
                // Notify others immediately
                connections[meetingCode].forEach(elem => {
                    if (elem !== targetSocketId) {
                        io.to(elem).emit('user-left', targetSocketId, targetUsername);
                    }
                });

                // Remove from connections array manually to ensure strict removal
                const index = connections[meetingCode].indexOf(targetSocketId);
                if (index !== -1) {
                    connections[meetingCode].splice(index, 1);
                }
            }

            // Force disconnect logic
            const targetSocket = io.sockets.sockets.get(targetSocketId);
            if (targetSocket) {
                targetSocket.disconnect(true);
            }
        });

        // Handle End Meeting
        socket.on("end-meeting", async (roomKey, meetingCodeInput, callback) => {
            try {
                // Determine the DB meeting code (prefer explicit input, fallback to roomKey)
                const dbMeetingCode = meetingCodeInput || roomKey;

                console.log(`Ending meeting: Room=${roomKey}, Code=${dbMeetingCode}`);

                // Notify all users in the room
                if (connections[roomKey]) {
                    connections[roomKey].forEach(socketId => {
                        io.to(socketId).emit("meeting-ended");
                    });

                    // Clear connections specifically for this room
                    delete connections[roomKey];
                    delete messages[roomKey];
                    if (bannedUsers[roomKey]) delete bannedUsers[roomKey];
                }

                // Update DB
                await Meeting.findOneAndUpdate(
                    { meetingCode: dbMeetingCode },
                    { isEnded: true, endTime: new Date() }
                );

                // Acknowledge completion if callback provided
                if (typeof callback === 'function') callback();

            } catch (e) {
                console.error("Error ending meeting:", e);
                if (typeof callback === 'function') callback({ error: e.message });
            }
        })

        // Handle disconnection

        socket.on("disconnect", () => {

            var diffTime = Math.abs(timeOnline[socket.id] - new Date())

            var key

            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {

                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k

                        const leaverName = users[socket.id];
                        delete users[socket.id];

                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id, leaverName)
                        }

                        var index = connections[key].indexOf(socket.id)

                        connections[key].splice(index, 1)


                        if (connections[key].length === 0) {
                            delete connections[key]
                        }
                    }
                }
            }
        })
    })

    return io;
}