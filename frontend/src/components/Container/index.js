import React from 'react';
import './Container.css';

const Container = ({
  children,
  size = 'lg',
  fluid = false,
  className = '',
  ...props
}) => {
  // Build the class names based on props
  const containerClasses = [
    'container',
    fluid ? 'container-fluid' : '',
    !fluid ? `container-${size}` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
};

export default Container;
