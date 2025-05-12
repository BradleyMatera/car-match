import React from 'react';
import { render, screen } from '@testing-library/react';
import Section from './index';

// Mock the Container component
jest.mock('../Container', () => {
  return function MockContainer({ children, size, ...props }) {
    return (
      <div data-testid="mock-container" data-size={size} {...props}>
        {children}
      </div>
    );
  };
});

describe('Section Component', () => {
  test('renders with default props', () => {
    render(
      <Section data-testid="section">
        <div>Section Content</div>
      </Section>
    );
    
    const sectionElement = screen.getByTestId('section');
    expect(sectionElement).toBeInTheDocument();
    expect(sectionElement).toHaveClass('section');
    expect(sectionElement).toHaveClass('section-spacing-default');
    
    // Check that it renders with a container by default
    const containerElement = screen.getByTestId('mock-container');
    expect(containerElement).toBeInTheDocument();
    expect(containerElement).toHaveAttribute('data-size', 'lg');
  });

  test('renders with custom background', () => {
    render(
      <Section 
        background="primary" 
        data-testid="section"
      >
        <div>Section Content</div>
      </Section>
    );
    
    const sectionElement = screen.getByTestId('section');
    expect(sectionElement).toBeInTheDocument();
    expect(sectionElement).toHaveClass('section-bg-primary');
  });

  test('renders with custom spacing', () => {
    render(
      <Section 
        spacing="lg" 
        data-testid="section"
      >
        <div>Section Content</div>
      </Section>
    );
    
    const sectionElement = screen.getByTestId('section');
    expect(sectionElement).toBeInTheDocument();
    expect(sectionElement).toHaveClass('section-spacing-lg');
  });

  test('renders without container', () => {
    render(
      <Section 
        container={false} 
        data-testid="section"
      >
        <div data-testid="direct-child">Direct Child</div>
      </Section>
    );
    
    const sectionElement = screen.getByTestId('section');
    expect(sectionElement).toBeInTheDocument();
    
    // Check that it doesn't render with a container
    expect(screen.queryByTestId('mock-container')).not.toBeInTheDocument();
    
    // Check that the children are rendered directly
    expect(screen.getByTestId('direct-child')).toBeInTheDocument();
  });

  test('renders with custom container size', () => {
    render(
      <Section 
        containerSize="sm" 
        data-testid="section"
      >
        <div>Section Content</div>
      </Section>
    );
    
    const sectionElement = screen.getByTestId('section');
    expect(sectionElement).toBeInTheDocument();
    
    // Check that the container has the correct size
    const containerElement = screen.getByTestId('mock-container');
    expect(containerElement).toBeInTheDocument();
    expect(containerElement).toHaveAttribute('data-size', 'sm');
  });

  test('renders with custom className', () => {
    render(
      <Section 
        className="custom-class" 
        data-testid="section"
      >
        <div>Section Content</div>
      </Section>
    );
    
    const sectionElement = screen.getByTestId('section');
    expect(sectionElement).toBeInTheDocument();
    expect(sectionElement).toHaveClass('section');
    expect(sectionElement).toHaveClass('custom-class');
  });

  test('renders children correctly', () => {
    render(
      <Section data-testid="section">
        <div data-testid="section-content">Test Section Content</div>
      </Section>
    );
    
    expect(screen.getByTestId('section-content')).toBeInTheDocument();
    expect(screen.getByText('Test Section Content')).toBeInTheDocument();
  });
});
