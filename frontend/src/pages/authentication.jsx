import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

const defaultTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default function Authentication() {
    const [username, setUsername] = React.useState();
    const [password, setPassword] = React.useState();
    const [name, setName] = React.useState();
    const [error, setError] = React.useState();
    const [message, setMessage] = React.useState();
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

let handleAuth = async () => {
    try {
        if (formState === 0) {
            await handleLogin(username, password); 
        } else {
            const result = await handleRegister(name, username, password);
            console.log("Registration result:", result);
            
            if (result?.message) {
                setMessage(result.message);
                setOpen(true);
                setError("");
                setFormState(0);
                setName("");
                setUsername("");
                setPassword("");
            }
        }
    } catch (err) {
        console.error("Auth error:", err);
        setError(err.message || "Operation failed");
    }
}





    return (
        <ThemeProvider theme={defaultTheme}>
            <CssBaseline />
            <Grid 
                container 
                component="main" 
                sx={{ 
                    height: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 2
                }}
            >
                <Grid 
                    item 
                    xs={12} 
                    sm={8} 
                    md={6} 
                    lg={4}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Paper 
                        elevation={10}
                        sx={{
                            p: 4,
                            width: '100%',
                            borderRadius: 4,
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                            backdropFilter: 'blur(8px)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                                <LockOutlinedIcon />
                            </Avatar>
                            <Typography component="h1" variant="h5">
                                {formState === 0 ? 'Sign in' : 'Sign up'}
                            </Typography>

                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                width: '100%',
                                my: 2,
                                gap: 1
                            }}>
                                <Button 
                                    variant={formState === 0 ? "contained" : "outlined"} 
                                    onClick={() => { setFormState(0); setError("") }}
                                    sx={{ flex: 1 }}
                                >
                                    Sign In
                                </Button>
                                <Button 
                                    variant={formState === 1 ? "contained" : "outlined"} 
                                    onClick={() => { setFormState(1); setError("") }}
                                    sx={{ flex: 1 }}
                                >
                                    Sign Up
                                </Button>
                            </Box>

                            <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
                                {formState === 1 && (
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="name"
                                        label="Full Name"
                                        name="name"
                                        value={name}
                                        autoFocus
                                        onChange={(e) => setName(e.target.value)}
                                        sx={{ mb: 2 }}
                                    />
                                )}

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="username"
                                    label="Username"
                                    name="username"
                                    value={username}
                                    autoFocus={formState === 0}
                                    onChange={(e) => setUsername(e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    value={password}
                                    type="password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    id="password"
                                    sx={{ mb: 2 }}
                                />

                                {error && (
                                    <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                                        {error}
                                    </Typography>
                                )}

                                <Button
                                    type="button"
                                    fullWidth
                                    variant="contained"
                                    sx={{ 
                                        mt: 3, 
                                        mb: 2,
                                        py: 1.5,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontSize: '1rem'
                                    }}
                                    onClick={handleAuth}
                                >
                                    {formState === 0 ? "Sign In" : "Create Account"}
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                message={message}
                onClose={() => setOpen(false)}
            />
        </ThemeProvider>
    );
}