import React from 'react';

interface ToastProps {
  message: string;
}

// Toast notification displayed at the bottom of the screen. It
// automatically fades in and out using CSS animations.
export default function Toast({ message }: ToastProps) {
  return <div className="toast">{message}</div>;
}