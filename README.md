# 🚀 Video Conference App  
**Real-time HD video conferencing with robust controls**  

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-2ea44f?style=for-the-badge&logo=netlify&logoColor=white)](http://videoconferenceapp123.netlify.app)  
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)  

---s
Video-Conference-app
/
README.md
in
main



## ✨ Key Features  
| Feature | Description |  
|---------|-------------|  
| **🎥 HD Video Streaming** | High-definition video with adaptive bitrate |  
| **🔇 Dynamic Controls** | Mute audio/video, end call, and participant management |  
| **👥 Multi-User Rooms** | Join/create rooms with unique links |  
| **⚡ Low Latency** | WebRTC-powered real-time communication |  
| **📊 Session Analytics** | Track call duration and participants (MongoDB-backed) |  

---

## 🛠️ Tech Stack  
### Core  
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)  
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)  
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)  
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)  
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)  

### UI & Deployment  
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)  
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)  

---

## 🎥 System Architecture  
```mermaid  
graph TD  
  A[Client] -->|WebRTC| B[Signaling Server]  
  B -->|Session Data| C[(MongoDB)]  
  A -->|Media Streams| D[Peer Connection]  
