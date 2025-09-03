# Car-Match Components

This directory contains reusable components for the Car-Match application. Below is an overview of the layout and UI components available.

## Layout Components

These components provide the foundation for creating consistent layouts throughout the application.

### Layout

The base layout component that wraps the main content of the application.

```jsx
import Layout from './Layout';

<Layout>
  <div>Content</div>
</Layout>
```

### Container

Provides a responsive container with consistent max-width and padding.

```jsx
import Container from './Container';

<Container>
  <div>Content</div>
</Container>
```

### Grid

A flexible grid system based on CSS Grid.

```jsx
import Grid from './Grid';

<Grid cols={2} mdCols={3} lgCols={4} gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</Grid>
```

### Flex

A component for creating flexible layouts using Flexbox.

```jsx
import Flex from './Flex';

<Flex direction="row" justify="between" items="center">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Flex>
```

### Section

A component for creating consistent page sections.

```jsx
import Section from './Section';

<Section background="light" spacing="lg">
  <h2>Section Title</h2>
  <p>Section content</p>
</Section>
```

### Spacing

A utility component for adding consistent spacing.

```jsx
import Spacing from './Spacing';

<Spacing mt="lg" mb="md">
  <div>Content with spacing</div>
</Spacing>
```

## UI Components

These components are specific to the Car-Match application UI.

### EntryModal

The entry modal for user login/signup.

### Home

The home page component.

### Events

The events page component that includes a carousel using react-slick.

### Profile

The user profile component.

### Settings

The settings page component.

### SignUp

The signup component.

### Messages

The messages component.

## UI Elements

The layout system includes various UI elements that can be used across the application.

### Buttons

```jsx
<a href="#" className="btn btn-primary">Primary Button</a>
<a href="#" className="btn btn-secondary">Secondary Button</a>
<a href="#" className="btn btn-outline">Outline Button</a>
```

### Cards

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

### Carousel

```jsx
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const carouselSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 3,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 3000,
};

<div className="carousel-container">
  <Slider {...carouselSettings}>
    {items.map((item) => (
      <div key={item.id} className="carousel-slide">
        {/* Slide content */}
      </div>
    ))}
  </Slider>
</div>
```

### Animations

```jsx
<div className="fade-in">Fade In Animation</div>
<div className="slide-in">Slide In Animation</div>
<div className="pulse">Pulse Animation</div>
```

## Example Usage

For a complete demonstration of the layout components, see the `LayoutExample` component.

```jsx
import LayoutExample from './LayoutExample';

<LayoutExample />
```

## Documentation

For detailed documentation on the layout system, see the [Layout System Documentation](../docs/layout-system.md).
