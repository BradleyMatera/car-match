import React from 'react';
import { render, screen } from '@testing-library/react';
import Container from './index';

describe('Container Component', () => {
  test('renders with default props', () => {
    render(
      <Container data-testid="container">
        <div>Content</div>
      </Container>
    );
    
    const containerElement = screen.getByTestId('container');
    expect(containerElement).toBeInTheDocument();
    expect(containerElement).toHaveClass('container');
    expect(containerElement).toHaveClass('container-lg');
  });

  test('renders with custom size', () => {
    render(
      <Container 
        size="sm" 
        data-testid="container"
      >
        <div>Content</div>
      </Container>
    );
    
    const containerElement = screen.getByTestId('container');
    expect(containerElement).toBeInTheDocument();
    expect(containerElement).toHaveClass('container');
    expect(containerElement).toHaveClass('container-sm');
  });

  test('renders as fluid container', () => {
    render(
      <Container 
        fluid 
        data-testid="container"
      >
        <div>Content</div>
      </Container>
    );
    
    const containerElement = screen.getByTestId('container');
    expect(containerElement).toBeInTheDocument();
    expect(containerElement).toHaveClass('container');
    expect(containerElement).toHaveClass('container-fluid');
    expect(containerElement).not.toHaveClass('container-lg');
  });

  test('renders with custom className', () => {
    render(
      <Container 
        className="custom-class" 
        data-testid="container"
      >
        <div>Content</div>
      </Container>
    );
    
    const containerElement = screen.getByTestId('container');
    expect(containerElement).toBeInTheDocument();
    expect(containerElement).toHaveClass('container');
    expect(containerElement).toHaveClass('custom-class');
  });

  test('renders children correctly', () => {
    render(
      <Container data-testid="container">
        <div data-testid="content">Test Content</div>
      </Container>
    );
    
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
