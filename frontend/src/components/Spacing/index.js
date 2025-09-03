import React from 'react';
import './Spacing.css';

const Spacing = ({
  children,
  m,
  mx,
  my,
  mt,
  mr,
  mb,
  ml,
  p,
  px,
  py,
  pt,
  pr,
  pb,
  pl,
  className = '',
  ...props
}) => {
  // Build the class names based on props
  const spacingClasses = [
    // Margin
    m ? `m-${m}` : '',
    mx ? `mx-${mx}` : '',
    my ? `my-${my}` : '',
    mt ? `mt-${mt}` : '',
    mr ? `mr-${mr}` : '',
    mb ? `mb-${mb}` : '',
    ml ? `ml-${ml}` : '',
    
    // Padding
    p ? `p-${p}` : '',
    px ? `px-${px}` : '',
    py ? `py-${py}` : '',
    pt ? `pt-${pt}` : '',
    pr ? `pr-${pr}` : '',
    pb ? `pb-${pb}` : '',
    pl ? `pl-${pl}` : '',
    
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={spacingClasses} {...props}>
      {children}
    </div>
  );
};

export default Spacing;
