# Car-Match Layout System Documentation

This document provides an overview of the layout system implemented in the Car-Match application. The layout system is designed to be responsive, consistent, and easy to use.

## Table of Contents

1. [Grid System](#grid-system)
2. [Container System](#container-system)
3. [Flexbox System](#flexbox-system)
4. [Spacing System](#spacing-system)
5. [Section Component](#section-component)
6. [Layout Component](#layout-component)
7. [Responsive Design](#responsive-design)
8. [Usage Examples](#usage-examples)

## Grid System

The grid system is based on CSS Grid and provides a flexible way to create layouts. It's defined in `global.css` and can be used with the `Grid` component.

### Grid Classes

- `.grid`: Sets `display: grid` and a default gap
- `.grid-cols-{n}`: Sets the number of columns (1-12)
- `.sm:grid-cols-{n}`, `.md:grid-cols-{n}`, `.lg:grid-cols-{n}`, `.xl:grid-cols-{n}`: Responsive column settings
- `.col-span-{n}`: Sets how many columns an item spans
- `.gap-{size}`: Sets the gap size (xs, sm, md, lg, xl, 2xl, 3xl)

### Grid Component

```jsx
import Grid from '../components/Grid';

// Basic usage
<Grid cols={2} gap="md">
  <div>Column 1</div>
  <div>Column 2</div>
</Grid>

// Responsive grid
<Grid 
  cols={1} 
  smCols={2} 
  mdCols={3} 
  lgCols={4} 
  gap="lg"
>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</Grid>
```

## Container System

The container system provides consistent width constraints and padding for content. It's defined in `global.css` and can be used with the `Container` component.

### Container Classes

- `.container`: Base container with responsive max-width
- `.container-sm`, `.container-md`, `.container-lg`, `.container-xl`: Size variants
- `.container-fluid`: Full-width container

### Container Component

```jsx
import Container from '../components/Container';

// Default container (max-width: 1024px)
<Container>
  <div>Content</div>
</Container>

// Small container
<Container size="sm">
  <div>Content</div>
</Container>

// Fluid container
<Container fluid>
  <div>Content</div>
</Container>
```

## Flexbox System

The flexbox system provides utilities for creating flexible layouts. It's defined in `global.css` and can be used with the `Flex` component.

### Flexbox Classes

- `.flex`: Sets `display: flex`
- `.flex-{direction}`: Sets flex direction (row, col, row-reverse, col-reverse)
- `.flex-{wrap}`: Sets flex wrap (wrap, nowrap, wrap-reverse)
- `.justify-{value}`: Sets justify-content (start, end, center, between, around, evenly)
- `.items-{value}`: Sets align-items (start, end, center, baseline, stretch)

### Flex Component

```jsx
import Flex from '../components/Flex';

// Basic usage
<Flex direction="row" justify="between" items="center">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Flex>

// Column layout on mobile, row on desktop
<Flex className="flex-col-mobile flex-row-desktop" gap="lg">
  <div>Item 1</div>
  <div>Item 2</div>
</Flex>
```

## Spacing System

The spacing system provides consistent spacing values throughout the application. It's defined in `global.css` and can be used with the `Spacing` component or utility classes.

### Spacing Variables

- `--space-xs`: 0.25rem (4px)
- `--space-sm`: 0.5rem (8px)
- `--space-md`: 1rem (16px)
- `--space-lg`: 1.5rem (24px)
- `--space-xl`: 2rem (32px)
- `--space-2xl`: 3rem (48px)
- `--space-3xl`: 4rem (64px)

### Spacing Classes

- `.m-{size}`, `.mx-{size}`, `.my-{size}`, `.mt-{size}`, `.mr-{size}`, `.mb-{size}`, `.ml-{size}`: Margin utilities
- `.p-{size}`, `.px-{size}`, `.py-{size}`, `.pt-{size}`, `.pr-{size}`, `.pb-{size}`, `.pl-{size}`: Padding utilities

### Spacing Component

```jsx
import Spacing from '../components/Spacing';

// Add margin top
<Spacing mt="lg">
  <div>Content with margin top</div>
</Spacing>

// Add multiple spacing values
<Spacing mt="lg" mb="md" px="xl">
  <div>Content with multiple spacing values</div>
</Spacing>
```

## Section Component

The Section component provides a consistent way to create page sections with proper spacing and background colors.

### Section Component Props

- `background`: Background color (transparent, light, primary, secondary, dark)
- `spacing`: Spacing size (default, sm, lg, none)
- `container`: Whether to wrap content in a container (true/false)
- `containerSize`: Size of the container (sm, md, lg, xl)

### Section Component Usage

```jsx
import Section from '../components/Section';

// Basic section
<Section>
  <h2>Section Title</h2>
  <p>Section content</p>
</Section>

// Section with background and custom spacing
<Section background="primary" spacing="lg">
  <h2>Section Title</h2>
  <p>Section content</p>
</Section>

// Section without container
<Section container={false}>
  <div>Full-width content</div>
</Section>
```

## Layout Component

The Layout component provides the base layout structure for the application.

### Layout Component Usage

```jsx
import Layout from '../components/Layout';

// Basic usage
<Layout>
  <div>Page content</div>
</Layout>
```

## Responsive Design

The layout system is designed to be responsive by default. It uses CSS media queries to adjust layouts based on screen size.

### Breakpoints

- `--breakpoint-sm`: 640px
- `--breakpoint-md`: 768px
- `--breakpoint-lg`: 1024px
- `--breakpoint-xl`: 1280px

### Responsive Utilities

- `.xs\:hidden`, `.sm\:hidden`, `.md\:hidden`, `.lg\:hidden`, `.xl\:hidden`: Hide elements at specific breakpoints
- Responsive variants of grid, container, and spacing utilities

## Animations

The layout system includes several animation utilities that can be applied to elements:

### Animation Classes

- `.fade-in`: Fade in animation
- `.slide-in`: Slide in from left animation
- `.pulse`: Pulsing animation

### Animation Usage

```jsx
<div className="fade-in">
  <p>This content will fade in</p>
</div>

<div className="slide-in">
  <p>This content will slide in from the left</p>
</div>

<div className="pulse">
  <p>This content will pulse</p>
</div>
```

## Button Styles

The layout system includes several button styles:

### Button Classes

- `.btn`: Base button class
- `.btn-primary`: Primary button (blue)
- `.btn-secondary`: Secondary button (green)
- `.btn-outline`: Outline button

### Button Usage

```jsx
<a href="#" className="btn btn-primary">Primary Button</a>
<a href="#" className="btn btn-secondary">Secondary Button</a>
<a href="#" className="btn btn-outline">Outline Button</a>
```

## Card Components

The layout system includes card components for displaying content:

### Card Classes

- `.card`: Base card class
- `.card-img`: Card image
- `.card-content`: Card content container
- `.card-title`: Card title
- `.card-text`: Card text

### Card Usage

```jsx
<div className="card">
  <img src="image.jpg" alt="Card image" className="card-img" />
  <div className="card-content">
    <h3 className="card-title">Card Title</h3>
    <p className="card-text">Card content goes here.</p>
    <a href="#" className="btn btn-primary">Call to Action</a>
  </div>
</div>
```

## Carousel Integration

The layout system integrates with react-slick for carousel functionality:

### Carousel Usage

```jsx
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Carousel settings
const carouselSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 3,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 3000,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
  ],
};

// Carousel component
<div className="carousel-container">
  <Slider {...carouselSettings}>
    {items.map((item) => (
      <div key={item.id} className="carousel-slide">
        <div className="card">
          {/* Card content */}
        </div>
      </div>
    ))}
  </Slider>
</div>
```

## Usage Examples

For complete usage examples, see the `LayoutExample` component in `frontend/src/components/LayoutExample/index.js`.

To view the examples in the application, navigate to `/layout-example` in the browser.
