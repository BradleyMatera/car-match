import React from 'react';
import { render, screen } from '@testing-library/react';
import Grid from './index';

describe('Grid Component', () => {
  test('renders with default props', () => {
    render(
      <Grid data-testid="grid">
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>
    );
    
    const gridElement = screen.getByTestId('grid');
    expect(gridElement).toBeInTheDocument();
    expect(gridElement).toHaveClass('grid');
    expect(gridElement).toHaveClass('grid-cols-1');
    expect(gridElement).toHaveClass('gap-md');
  });

  test('renders with custom props', () => {
    render(
      <Grid 
        cols={3} 
        gap="lg" 
        className="custom-class"
        data-testid="grid"
      >
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </Grid>
    );
    
    const gridElement = screen.getByTestId('grid');
    expect(gridElement).toBeInTheDocument();
    expect(gridElement).toHaveClass('grid');
    expect(gridElement).toHaveClass('grid-cols-3');
    expect(gridElement).toHaveClass('gap-lg');
    expect(gridElement).toHaveClass('custom-class');
  });

  test('renders with responsive props', () => {
    render(
      <Grid 
        cols={1} 
        smCols={2}
        mdCols={3}
        lgCols={4}
        data-testid="grid"
      >
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
        <div>Item 4</div>
      </Grid>
    );
    
    const gridElement = screen.getByTestId('grid');
    expect(gridElement).toBeInTheDocument();
    expect(gridElement).toHaveClass('grid-cols-1');
    expect(gridElement).toHaveClass('sm:grid-cols-2');
    expect(gridElement).toHaveClass('md:grid-cols-3');
    expect(gridElement).toHaveClass('lg:grid-cols-4');
  });

  test('renders children correctly', () => {
    render(
      <Grid data-testid="grid">
        <div data-testid="item-1">Item 1</div>
        <div data-testid="item-2">Item 2</div>
      </Grid>
    );
    
    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});
