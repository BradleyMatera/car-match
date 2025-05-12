import React from 'react';
import Container from '../Container';
import Grid from '../Grid';
import Flex from '../Flex';
import Spacing from '../Spacing';
import Section from '../Section';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './LayoutExample.css';

const LayoutExample = () => {
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
  return (
    <div className="layout-example">
      {/* Container Example */}
      <Section>
        <h2 className="section-title">Container Example</h2>
        <div className="demo-box">
          <p>Default Container (max-width: 1024px)</p>
        </div>
        
        <Spacing mt="xl" />
        
        <Container size="sm">
          <div className="demo-box">
            <p>Small Container (max-width: 640px)</p>
          </div>
        </Container>
        
        <Spacing mt="xl" />
        
        <Container fluid>
          <div className="demo-box">
            <p>Fluid Container (max-width: 100%)</p>
          </div>
        </Container>
      </Section>
      
      {/* Grid Example */}
      <Section background="light">
        <h2 className="section-title">Grid Example</h2>
        <Grid cols={1} mdCols={2} lgCols={4} gap="lg">
          <div className="demo-box">Grid Item 1</div>
          <div className="demo-box">Grid Item 2</div>
          <div className="demo-box">Grid Item 3</div>
          <div className="demo-box">Grid Item 4</div>
        </Grid>
        
        <Spacing mt="xl" />
        
        <Grid cols={1} mdCols={3} gap="md">
          <div className="demo-box col-span-1 md:col-span-2">
            Spans 2 columns on medium screens
          </div>
          <div className="demo-box">
            1 column
          </div>
          <div className="demo-box">
            1 column
          </div>
          <div className="demo-box">
            1 column
          </div>
        </Grid>
      </Section>
      
      {/* Flex Example */}
      <Section>
        <h2 className="section-title">Flex Example</h2>
        <Flex justify="between" items="center" gap="md">
          <div className="demo-box flex-basis-quarter">Flex Item 1</div>
          <div className="demo-box flex-basis-quarter">Flex Item 2</div>
          <div className="demo-box flex-basis-quarter">Flex Item 3</div>
        </Flex>
        
        <Spacing mt="xl" />
        
        <Flex direction="col" mdCols={2} gap="lg" className="flex-col-mobile flex-row-desktop">
          <div className="demo-box">Stacks vertically on mobile</div>
          <div className="demo-box">Side by side on desktop</div>
        </Flex>
      </Section>
      
      {/* Spacing Example */}
      <Section background="light">
        <h2 className="section-title">Spacing Example</h2>
        <div className="demo-box">No spacing</div>
        
        <Spacing mt="md">
          <div className="demo-box">Margin top: md (1rem)</div>
        </Spacing>
        
        <Spacing mt="lg">
          <div className="demo-box">Margin top: lg (1.5rem)</div>
        </Spacing>
        
        <Spacing mt="xl">
          <div className="demo-box">Margin top: xl (2rem)</div>
        </Spacing>
        
        <Spacing mt="2xl">
          <div className="demo-box">Margin top: 2xl (3rem)</div>
        </Spacing>
        
        <div className="p-md demo-box">
          <p>Padding: md (1rem)</p>
        </div>
        
        <Spacing mt="md">
          <div className="p-lg demo-box">
            <p>Padding: lg (1.5rem)</p>
          </div>
        </Spacing>
      </Section>
      
      {/* Responsive Layout Example */}
      <Section>
        <h2 className="section-title">Responsive Layout Example</h2>
        <div className="dashboard-layout">
          <header className="dashboard-header demo-box">Header</header>
          <aside className="dashboard-sidebar demo-box">Sidebar</aside>
          <main className="dashboard-main demo-box">Main Content</main>
          <footer className="dashboard-footer demo-box">Footer</footer>
        </div>
      </Section>
      
      {/* Section Component Example */}
      <Section background="primary" spacing="lg">
        <h2 className="section-title">Section Component Example</h2>
        <p className="text-center">This section uses the Section component with primary background and large spacing</p>
        <div className="text-center" style={{ marginTop: '1rem' }}>
          <a href="#" className="btn btn-secondary">Secondary Button</a>
        </div>
      </Section>
      
      <Section background="secondary" spacing="sm">
        <h2 className="section-title">Another Section Example</h2>
        <p className="text-center">This section uses the Section component with secondary background and small spacing</p>
        <div className="text-center" style={{ marginTop: '1rem' }}>
          <a href="#" className="btn btn-primary">Primary Button</a>
        </div>
      </Section>
      
      {/* Carousel Example */}
      <Section>
        <h2 className="section-title">Carousel Example</h2>
        <p className="text-center">Using react-slick for carousel functionality</p>
        
        <div className="carousel-container">
          <Slider {...carouselSettings}>
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="carousel-slide">
                <div className="card">
                  <img 
                    src={`https://source.unsplash.com/random/300x200?car=${item}`} 
                    alt={`Car ${item}`} 
                    className="card-img" 
                  />
                  <div className="card-content">
                    <h3 className="card-title">Car Event {item}</h3>
                    <p className="card-text">Join us for an exciting car meetup with fellow enthusiasts.</p>
                    <a href="#" className="btn btn-primary">Learn More</a>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </Section>
      
      {/* Animation Examples */}
      <Section background="light">
        <h2 className="section-title">Animation Examples</h2>
        <Grid cols={1} mdCols={3} gap="lg">
          <div className="demo-box fade-in">
            <p>Fade In Animation</p>
          </div>
          <div className="demo-box slide-in">
            <p>Slide In Animation</p>
          </div>
          <div className="demo-box pulse">
            <p>Pulse Animation</p>
          </div>
        </Grid>
      </Section>
      
      {/* Button Examples */}
      <Section>
        <h2 className="section-title">Button Examples</h2>
        <Flex justify="center" gap="lg">
          <a href="#" className="btn btn-primary">Primary Button</a>
          <a href="#" className="btn btn-secondary">Secondary Button</a>
          <a href="#" className="btn btn-outline">Outline Button</a>
        </Flex>
      </Section>
      
      {/* Card Examples */}
      <Section background="light">
        <h2 className="section-title">Card Examples</h2>
        <Grid cols={1} mdCols={3} gap="lg">
          <div className="card">
            <img 
              src="https://source.unsplash.com/random/300x200?muscle+car" 
              alt="Muscle Car" 
              className="card-img" 
            />
            <div className="card-content">
              <h3 className="card-title">Muscle Cars</h3>
              <p className="card-text">Discover the power and style of American muscle cars.</p>
              <a href="#" className="btn btn-primary">Explore</a>
            </div>
          </div>
          
          <div className="card">
            <img 
              src="https://source.unsplash.com/random/300x200?jdm" 
              alt="JDM Car" 
              className="card-img" 
            />
            <div className="card-content">
              <h3 className="card-title">JDM Imports</h3>
              <p className="card-text">Experience the precision and innovation of Japanese imports.</p>
              <a href="#" className="btn btn-primary">Explore</a>
            </div>
          </div>
          
          <div className="card">
            <img 
              src="https://source.unsplash.com/random/300x200?classic+car" 
              alt="Classic Car" 
              className="card-img" 
            />
            <div className="card-content">
              <h3 className="card-title">Classic Cars</h3>
              <p className="card-text">Appreciate the timeless elegance of classic automobiles.</p>
              <a href="#" className="btn btn-primary">Explore</a>
            </div>
          </div>
        </Grid>
      </Section>
    </div>
  );
};

export default LayoutExample;
