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
import { Snackbar, CircularProgress, Alert, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    const handleAuth = async () => {
        try {
            setLoading(true);
            setError("");

            // Basic validation
            if (!username.trim() || !password.trim()) {
                setError("Please fill in all fields");
                return;
            }

            if (formState === 1) {
                if (!name.trim()) {
                    setError("Please enter your name");
                    return;
                }
                if (!confirmPassword.trim()) {
                    setError("Please confirm your password");
                    return;
                }
                if (password !== confirmPassword) {
                    setError("Passwords do not match");
                    return;
                }
            }

            if (password.length < 6) {
                setError("Enter atleast 6 digit password");
                return;
            }

            if (formState === 0) {
                // Login
                await handleLogin(username, password);
            } else {
                // Register
                const result = await handleRegister(name, username, password);
                setMessage(result?.message || "Registration successful!");
                setOpen(true);
                setFormState(0); // Switch to login after registration
                setName("");
                setUsername("");
                setPassword("");
                setConfirmPassword("");
            }
        } catch (err) {
            console.error("Auth error:", err);

            // Extract error message from various possible error structures
            let errMsg = "Operation failed";

            if (typeof err === 'string') {
                errMsg = err;
            } else if (err?.message) {
                errMsg = err.message;
            } else if (err?.response?.data?.message) {
                errMsg = err.response.data.message;
            } else if (err?.data?.message) {
                errMsg = err.data.message; // From AuthContext re-throw
            } else if (JSON.stringify(err) !== "{}") {
                // Fallback for non-empty objects
                errMsg = JSON.stringify(err);
            }

            if (errMsg.includes("User Not Found") || (err?.status === 404)) {
                setError("User not found. Please Sign Up first.");
            } else if (errMsg.includes("already exists")) {
                setError("User already exists. Please login instead.");
            } else if (errMsg.includes("Invalid Username or password")) {
                setError("Invalid username or password.");
            } else {
                setError(errMsg);
            }
        } finally {
            setLoading(false);
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAuth();
        }
    }

    const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

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
                                    Login
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
                                        onKeyPress={handleKeyPress}
                                        sx={{ mb: 2 }}
                                    />
                                )}

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="username"
                                    label="Email Address"
                                    name="username"
                                    value={username}
                                    autoFocus={formState === 0}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyPress={handleKeyPress}
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
                                    onKeyPress={handleKeyPress}
                                    id="password"
                                    sx={{ mb: 2 }}
                                />

                                {formState === 1 && (
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        name="confirmPassword"
                                        label="Confirm Password"
                                        value={confirmPassword}
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        id="confirmPassword"
                                        sx={{ mb: 2 }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={handleClickShowConfirmPassword}
                                                        edge="end"
                                                    >
                                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}

                                {error && (
                                    <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
                                        {error}
                                    </Alert>
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
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : (formState === 0 ? "Sign In" : "Create Account")}
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setOpen(false)} severity="success" sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
}