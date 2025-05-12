import React from 'react';
import Container from '../Container';
import './Section.css';

const Section = ({
  children,
  className = '',
  background = 'transparent',
  spacing = 'default',
  container = true,
  containerSize = 'lg',
  ...props
}) => {
  // Build the class names based on props
  const sectionClasses = [
    'section',
    `section-spacing-${spacing}`,
    background !== 'transparent' ? `section-bg-${background}` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <section className={sectionClasses} {...props}>
      {container ? (
        <Container size={containerSize}>
          {children}
        </Container>
      ) : (
        children
      )}
    </section>
  );
};

export default Section;
