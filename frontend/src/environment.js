// Should point to your local server during development
export default process.env.NODE_ENV === 'production' 
  ? 'https://video-conference-app-53ks.onrender.com'
  : 'http://localhost:8080';