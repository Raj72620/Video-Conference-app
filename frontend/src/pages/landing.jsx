import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@mui/material';
import { styled } from '@mui/system';
import '../App.css';

const GradientButton = styled(Button)({
  background: 'linear-gradient(45deg, #64b5f6 30%, #1976d2 90%)',
  color: 'white',
  padding: '12px 36px',
  fontSize: '1.2rem',
  fontWeight: 600,
  borderRadius: '50px',
  boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)',
  '&:hover': {
    background: 'linear-gradient(45deg, #1976d2 30%, #64b5f6 90%)',
  },
});

export default function LandingPage() {
    const router = useNavigate();

    return (
        <div className='landingPageContainer'>
            <nav className='landingNav'>
                <div className='navHeader'>
                    <h2 className='logo'>VideoConnect</h2>
                </div>
                <div className='navlist'>
                    <button className='navButton' onClick={() => router("/aljk23")}>
                        Join as Guest
                    </button>
                    <button className='navButton outlined' onClick={() => router("/auth")}>
                        Register
                    </button>
                    <button className='navButton primary' onClick={() => router("/auth")}>
                        Login
                    </button>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div className="heroContent">
                    <h1 className='heroTitle'>
                        Connect with your <span className='highlight-blue'>Loved Ones</span>
                    </h1>
                    <p className='heroSubtitle'>Bridge distances with crystal-clear Video Calls</p>
                    <div className='ctaButton'>
                        <GradientButton 
                            component={Link} 
                            to="/auth"
                            variant="contained"
                        >
                            Get Started
                        </GradientButton>
                    </div>
                </div>
                <div className="heroImage">
                </div>
            </div>
        </div>
    )
}