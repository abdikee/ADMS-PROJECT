import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import auth from '../services/auth';

export function InactivityWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (!auth.isLoggedIn()) {
        setShowWarning(false);
        return;
      }

      const lastActivity = auth.getLastActivity();
      if (!lastActivity) return;

      const timeSinceLastActivity = Date.now() - lastActivity;
      const warningThreshold = auth.inactivityTimeout - 60000; // Show warning 1 minute before logout

      if (timeSinceLastActivity >= warningThreshold && timeSinceLastActivity < auth.inactivityTimeout) {
        setShowWarning(true);
        const remaining = Math.ceil((auth.inactivityTimeout - timeSinceLastActivity) / 1000);
        setTimeLeft(remaining);
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, []);

  const handleStayLoggedIn = () => {
    auth.updateActivity();
    setShowWarning(false);
  };

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            You will be logged out in {timeLeft} seconds due to inactivity. Click below to stay logged in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleStayLoggedIn}>
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
