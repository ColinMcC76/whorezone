import React, { ReactNode } from 'react';

interface CardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

// Generic card component with optional icon and title. Used across
// benefits, server list and other places to create a consistent look.
export default function Card({ title, icon, children }: CardProps) {
  return (
    <div className="card">
      {icon && <div className="card-icon">{icon}</div>}
      <div className="card-title">{title}</div>
      <div className="card-content">{children}</div>
    </div>
  );
}