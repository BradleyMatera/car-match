import React from 'react';
import './Flex.css';

const Flex = ({
  children,
  direction = 'row',
  wrap = 'nowrap',
  justify = 'start',
  items = 'stretch',
  gap = 'md',
  className = '',
  ...props
}) => {
  // Build the class names based on props
  const flexClasses = [
    'flex',
    `flex-${direction}`,
    `flex-${wrap}`,
    `justify-${justify}`,
    `items-${items}`,
    gap ? `gap-${gap}` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={flexClasses} {...props}>
      {children}
    </div>
  );
};

export default Flex;
