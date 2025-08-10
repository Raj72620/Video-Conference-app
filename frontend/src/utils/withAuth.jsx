import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
  const AuthComponent = (props) => {
    const router = useNavigate();

    const isAuthenticated = useCallback(() => {
      return !!localStorage.getItem("token");
    }, []);

    useEffect(() => {
      if (!isAuthenticated()) {
        router("/auth");
      }
    }, [isAuthenticated, router]);

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;