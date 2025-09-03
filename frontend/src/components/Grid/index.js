import React from 'react';
import './Grid.css';

const Grid = ({
  children,
  cols = 1,
  smCols,
  mdCols,
  lgCols,
  xlCols,
  gap = 'md',
  className = '',
  ...props
}) => {
  // Build the class names based on props
  const gridClasses = [
    'grid',
    `grid-cols-${cols}`,
    smCols ? `sm:grid-cols-${smCols}` : '',
    mdCols ? `md:grid-cols-${mdCols}` : '',
    lgCols ? `lg:grid-cols-${lgCols}` : '',
    xlCols ? `xl:grid-cols-${xlCols}` : '',
    `gap-${gap}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

export default Grid;
