const mockUsers = [
  {
    id: 'user1',
    username: 'car_lover',
    email: 'alex@example.com',
    name: 'Alex Johnson',
    role: 'user',
    // Ensuring user1 has all new fields for demo purposes
    displayTag: 'AJ',
    gender: 'male',
    location: { city: 'Los Angeles', state: 'CA', geoCoordinates: { lat: 34.0522, lon: -118.2437 } },
    premiumStatus: false,
    developerOverride: false,
    activityMetadata: { messageCountToday: 0, lastMessageDate: null },
  },
  {
    id: 'user2',
    username: 'speedster99',
    email: 'jane@example.com',
    name: 'Jane Smith',
    role: 'user'
    // Add new fields for other users too for consistency if they log in
  },
  {
    id: 'user3',
    username: 'classic_enthusiast',
    email: 'mike@example.com',
    name: 'Mike Davis',
    role: 'user'
  },
  {
    id: 'user4',
    username: 'drift_king',
    email: 'tom@example.com',
    name: 'Tom Wilson',
    role: 'user'
  },
  {
    id: 'user5',
    username: 'vintage_vibes',
    email: 'emma@example.com',
    name: 'Emma Brown',
    role: 'user'
  },
  {
    id: 'user6',
    username: 'turbo_fan',
    email: 'liam@example.com',
    name: 'Liam Garcia',
    role: 'user'
  },
  {
    id: 'user7',
    username: 'roadster_queen',
    email: 'sophia@example.com',
    name: 'Sophia Martinez',
    role: 'user'
  },
  {
    id: 'user8',
    username: 'muscle_car_mad',
    email: 'noah@example.com',
    name: 'Noah Lee',
    role: 'user'
  },
  {
    id: 'user9',
    username: 'jdm_lover',
    email: 'olivia@example.com',
    name: 'Olivia White',
    role: 'user'
  },
  {
    id: 'user10',
    username: 'gear_head',
    email: 'ethan@example.com',
    name: 'Ethan Harris',
    role: 'user'
  },
  {
    id: 'user11',
    username: 'retro_rider',
    email: 'ava@example.com',
    name: 'Ava Clark',
    role: 'user'
  },
  {
    id: 'user12',
    username: 'speed_demon',
    email: 'mason@example.com',
    name: 'Mason Walker',
    role: 'user'
  },
  {
    id: 'user13',
    username: 'classic_cruiser',
    email: 'isabella@example.com',
    name: 'Isabella Young',
    role: 'user'
  },
  {
    id: 'user14',
    username: 'tuner_tech',
    email: 'james@example.com',
    name: 'James King',
    role: 'user'
  },
  {
    id: 'user15',
    username: 'car_crafter',
    email: 'mia@example.com',
    name: 'Mia Scott',
    role: 'user'
  },
  // Add a few more diverse users for testing messaging scenarios
  {
    id: 'user16',
    username: 'premium_jane',
    email: 'premium.jane@example.com',
    name: 'Premium Jane Doe',
    role: 'user',
    displayTag: 'PJane',
    gender: 'female',
    location: { city: 'New York', state: 'NY', geoCoordinates: { lat: 40.7128, lon: -74.0060 } },
    premiumStatus: true,
    developerOverride: false,
    activityMetadata: { messageCountToday: 0, lastMessageDate: null },
  },
  {
    id: 'user17',
    username: 'dev_dave',
    email: 'dev.dave@example.com',
    name: 'Developer Dave',
    role: 'user',
    displayTag: 'DevMode',
    gender: 'male',
    location: { city: 'Austin', state: 'TX', geoCoordinates: { lat: 30.2672, lon: -97.7431 } },
    premiumStatus: false,
    developerOverride: true, // This user can test premium features
    activityMetadata: { messageCountToday: 0, lastMessageDate: null },
  },
  {
    id: 'user18',
    username: 'free_fred',
    email: 'fred@example.com',
    name: 'Free Fred',
    role: 'user',
    displayTag: 'FredF',
    gender: 'male',
    location: { city: 'Chicago', state: 'IL', geoCoordinates: { lat: 41.8781, lon: -87.6298 } },
    premiumStatus: false,
    developerOverride: false,
    activityMetadata: { messageCountToday: 0, lastMessageDate: null },
  }
];

const mockProfiles = [
  {
    id: 'user1',
    name: 'Alex Johnson',
    age: 29,
    location: 'Los Angeles, CA',
    bio: 'Classic car restoration expert. Current project: 1968 Mustang Fastback',
    carInterests: ['Muscle Cars', 'Classic Restoration'],
    cars: [
      {
        id: 1,
        name: '1968 Mustang Fastback',
        make: 'Ford',
        model: 'Mustang',
        year: 1968,
        description: 'Full frame-off restoration in progress',
        photos: [
          'https://images.unsplash.com/photo-1567818735868-e71b99932e29?q=80&w=2187&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
        ]
      }
    ],
    socialLinks: {
      instagram: '@classic_restos'
    }
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    age: 25,
    location: 'San Francisco, CA',
    bio: 'Speed junkie and track day enthusiast. Love pushing limits on the weekends.',
    carInterests: ['Track Days', 'Tuner Cars'],
    cars: [
      {
        id: 2,
        name: '2020 Subaru WRX STI',
        make: 'Subaru',
        model: 'WRX STI',
        year: 2020,
        description: 'Modified for track performance',
        photos: [
          'https://unsplash.com/photos/running-black-porsche-sedan-3ZUsNJhi_Ik'
        ]
      }
    ],
    socialLinks: {
      instagram: '@speedster99'
    }
  },
  {
    id: 'user3',
    name: 'Mike Davis',
    age: 34,
    location: 'San Diego, CA',
    bio: 'Collector of vintage European cars. Always hunting for rare finds.',
    carInterests: ['Vintage European', 'Car Shows'],
    cars: [
      {
        id: 3,
        name: '1972 Porsche 911',
        make: 'Porsche',
        model: '911',
        year: 1972,
        description: 'Restored to original specs',
        photos: [
          'https://unsplash.com/photos/red-porsche-911-on-road-CX5U5G6G8k'
        ]
      }
    ],
    socialLinks: {
      instagram: '@classic_enthusiast'
    }
  },
  {
    id: 'user4',
    name: 'Tom Wilson',
    age: 27,
    location: 'Phoenix, AZ',
    bio: 'Drift enthusiast. Building my dream drift car one mod at a time.',
    carInterests: ['Drifting', 'JDM'],
    cars: [
      {
        id: 4,
        name: '1995 Nissan 240SX',
        make: 'Nissan',
        model: '240SX',
        year: 1995,
        description: 'Custom drift build with SR20DET swap',
        photos: [
          'https://unsplash.com/photos/white-nissan-car-drifting-7kEpupB8vNk'
        ]
      }
    ],
    socialLinks: {
      instagram: '@drift_king'
    }
  },
  {
    id: 'user5',
    name: 'Emma Brown',
    age: 31,
    location: 'Austin, TX',
    bio: 'Vintage car lover with a soft spot for convertibles.',
    carInterests: ['Convertibles', 'Classic Cars'],
    cars: [
      {
        id: 5,
        name: '1965 Ford Falcon Convertible',
        make: 'Ford',
        model: 'Falcon',
        year: 1965,
        description: 'Restored convertible for weekend cruises',
        photos: [
          'https://unsplash.com/photos/red-convertible-car-parked-V8t2K8YQJ4'
        ]
      }
    ],
    socialLinks: {
      instagram: '@vintage_vibes'
    }
  },
  {
    id: 'user6',
    name: 'Liam Garcia',
    age: 28,
    location: 'Miami, FL',
    bio: 'Turbocharged car enthusiast. Always chasing the next boost.',
    carInterests: ['Turbo Cars', 'Drag Racing'],
    cars: [
      {
        id: 6,
        name: '2018 Dodge Challenger SRT',
        make: 'Dodge',
        model: 'Challenger SRT',
        year: 2018,
        description: 'Supercharged for drag strip dominance',
        photos: [
          'https://unsplash.com/photos/black-dodge-challenger-QYc4Q9YqJ8'
        ]
      }
    ],
    socialLinks: {
      instagram: '@turbo_fan'
    }
  },
  {
    id: 'user7',
    name: 'Sophia Martinez',
    age: 26,
    location: 'Seattle, WA',
    bio: 'Roadster enthusiast. Nothing beats open-top driving.',
    carInterests: ['Roadsters', 'Scenic Drives'],
    cars: [
      {
        id: 7,
        name: '2005 Mazda MX-5 Miata',
        make: 'Mazda',
        model: 'MX-5 Miata',
        year: 2005,
        description: 'Lightweight and nimble for twisty roads',
        photos: [
          'https://unsplash.com/photos/red-mazda-miata-parked-9Y8zK6YqN4'
        ]
      }
    ],
    socialLinks: {
      instagram: '@roadster_queen'
    }
  },
  {
    id: 'user8',
    name: 'Noah Lee',
    age: 33,
    location: 'Denver, CO',
    bio: 'Muscle car collector with a passion for American iron.',
    carInterests: ['Muscle Cars', 'Car Shows'],
    cars: [
      {
        id: 8,
        name: '1970 Chevrolet Chevelle SS',
        make: 'Chevrolet',
        model: 'Chevelle SS',
        year: 1970,
        description: 'Restored with original 454 big block',
        photos: [
          'https://unsplash.com/photos/black-chevrolet-chevelle-ZY8vW8YqM4'
        ]
      }
    ],
    socialLinks: {
      instagram: '@ scowling_muscle_car'
    }
  },
  {
    id: 'user9',
    name: 'Olivia White',
    age: 24,
    location: 'Chicago, IL',
    bio: 'JDM enthusiast. Always modding my cars for style and performance.',
    carInterests: ['JDM', 'Tuner Cars'],
    cars: [
      {
        id: 9,
        name: '2002 Honda Civic Si',
        make: 'Honda',
        model: 'Civic Si',
        year: 2002,
        description: 'Custom widebody with turbo kit',
        photos: [
          'https://unsplash.com/photos/white-honda-civic-parked-6J8zK9YqN2'
        ]
      }
    ],
    socialLinks: {
      instagram: '@jdm_lover'
    }
  },
  {
    id: 'user10',
  name: 'Ethan Harris',
  age: 30,
  location: 'Portland, OR',
  bio: 'Gearhead who loves wrenching on project cars.',
  carInterests: ['DIY Repairs', 'Project Cars'],
  cars: [
    {
        id: 10,
        name: '1985 Toyota MR2',
        make: 'Toyota',
        model: 'MR2',
        year: 1985,
        description: 'Ongoing restoration project',
        photos: [
          'https://unsplash.com/photos/red-toyota-mr2-parked-TY9zK8YqM6'
        ]
      }
    ],
    socialLinks: {
      instagram: '@gear_head'
    }
  },
  {
    id: 'user11',
    name: 'Ava Clark',
    age: 27,
    location: 'Boston, MA',
    bio: 'Retro car enthusiast with a love for 80s aesthetics.',
    carInterests: ['Retro Cars', 'Car Shows'],
    cars: [
      {
        id: 11,
        name: '1987 BMW 325i',
        make: 'BMW',
        model: '325i',
        year: 1987,
        description: 'Preserved with original interior',
        photos: [
          'https://unsplash.com/photos/white-bmw-325i-parked-4Y6zK9YqN8'
        ]
      }
    ],
    socialLinks: {
      instagram: '@retro_rider'
    }
  },
  {
    id: 'user12',
    name: 'Mason Walker',
    age: 29,
    location: 'Las Vegas, NV',
    bio: 'Speed enthusiast who lives for drag racing.',
    carInterests: ['Drag Racing', 'Muscle Cars'],
    cars: [
      {
        id: 12,
        name: '2019 Ford Mustang GT',
        make: 'Ford',
        model: 'Mustang GT',
        year: 2019,
        description: 'Modified for quarter-mile runs',
        photos: [
          'https://unsplash.com/photos/black-ford-mustang-GY8zK9YqM2'
        ]
      }
    ],
    socialLinks: {
      instagram: '@speed_demon'
    }
  },
  {
    id: 'user13',
    name: 'Isabella Young',
    age: 26,
    location: 'Charlotte, NC',
    bio: 'Classic car cruiser who loves long drives.',
    carInterests: ['Classic Cars', 'Road Trips'],
    cars: [
      {
        id: 13,
        name: '1969 Pontiac GTO',
        make: 'Pontiac',
        model: 'GTO',
        year: 1969,
        description: 'Restored for cross-country trips',
        photos: [
          'https://unsplash.com/photos/red-pontiac-gto-parked-3Y8zK9YqM4'
        ]
      }
    ],
    socialLinks: {
      instagram: '@classic_cruiser'
    }
  },
  {
    id: 'user14',
    name: 'James King',
    age: 32,
    location: 'Orlando, FL',
    bio: 'Tuner tech who specializes in ECU tuning.',
    carInterests: ['Tuner Cars', 'Performance Tuning'],
    cars: [
      {
        id: 14,
        name: '2015 Mitsubishi Lancer Evolution',
        make: 'Mitsubishi',
        model: 'Lancer Evolution',
        year: 2015,
        description: 'Custom tuned for max performance',
        photos: [
          'https://unsplash.com/photos/white-mitsubishi-lancer-parked-8Y6zK9YqM2'
        ]
      }
    ],
    socialLinks: {
      instagram: '@tuner_tech'
    }
  },
  {
    id: 'user15',
    name: 'Mia Scott',
    age: 28,
    location: 'Nashville, TN',
    bio: 'Car crafter who builds custom hot rods.',
    carInterests: ['Hot Rods', 'Custom Builds'],
    cars: [
      {
        id: 15,
        name: '1932 Ford Coupe',
        make: 'Ford',
        model: 'Coupe',
        year: 1932,
        description: 'Custom hot rod build in progress',
        photos: [
          'https://unsplash.com/photos/black-ford-coupe-parked-2Y8zK9YqM4'
        ]
      }
    ],
    socialLinks: {
      instagram: '@car_crafter'
    }
  },
];

const mockEvents = [
  {
    id: 1,
    title: 'Vintage Car Rally',
    date: '2025-07-20',
    location: 'Malibu, CA',
    description: 'Annual coastal cruise for pre-1980 vehicles. Show off your classic ride!',
    organizerId: 'user1',
    organizerUsername: 'car_lover', // Added for consistency
    rsvpCount: 45,
    tags: ['Classic Cars', 'Road Trip'],
    image: 'https://images.unsplash.com/photo-1474039369477-5e74ff1f0e57?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHZpbnRhZ2UlMjBjYXJ8ZW58MHx8MHx8fDA%3D',
    schedule: [
      { time: '9:00 AM', activity: 'Registration & Breakfast' },
      { time: '10:30 AM', activity: 'Group Photo Session' },
      { time: '11:00 AM', activity: 'Coastal Cruise Start' }
    ],
    testimonials: [
      {
        author: 'Sarah M.',
        text: 'Best car event Ive ever attended! Met amazing enthusiasts.',
        car: '1967 Chevrolet Camaro',
        avatar: 'https://unsplash.com/photos/orange-lamborghini-car-oUBjd22gF6w',
        date: '2025-04-15'
      },
      {
        author: 'James P.',
        text: 'Fantastic organization and great variety of vehicles.',
        car: '1970 Dodge Charger',
        avatar: 'https://unsplash.com/photos/black-shelby-car-on-road-YApiWyp0lqo',
        date: '2025-04-16'
      }
    ],
    comments: [
      {
        id: 1,
        user: 'CarLover92',
        text: "Can't wait for this! Bringing my 68 Mustang.",
        timestamp: '2025-04-20T09:00:00'
      },
      {
        id: 2,
        user: 'VintageVibes',
        text: 'Looking forward to the coastal views!',
        timestamp: '2025-04-21T10:15:00'
      },
      {
        id: 3,
        user: 'ClassicCruiser',
        text: 'Hope to see some rare classics this year!',
        timestamp: '2025-04-22T14:30:00'
      }
    ],
    organizer: {
      name: 'Classic Car Club',
      contact: 'events@classiccarclub.com',
      social: '@classiccarclub'
    }
  },
  {
    id: 2,
    title: 'Track Day Extravaganza',
    date: '2025-08-15',
    location: 'Sonoma Raceway, CA',
    description: 'High-performance track day for tuners and sports cars. Bring your fastest ride!',
    organizerId: 'user2',
    organizerUsername: 'speedster99',
    rsvpCount: 30,
    tags: ['Track Days', 'Tuner Cars'],
    image: 'https://images.unsplash.com/photo-1696182664993-880238f55be6?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    schedule: [
      { time: '7:00 AM', activity: 'Driver Check-in' },
      { time: '8:00 AM', activity: 'Track Safety Briefing' },
      { time: '9:00 AM', activity: 'Track Sessions Begin' }
    ],
    testimonials: [
      {
        author: 'Ryan T.',
        text: 'Adrenaline-pumping day with awesome drivers!',
        car: '2019 Porsche GT3',
        avatar: 'https://unsplash.com/photos/red-porsche-gt3-parked-7Y8zK9YqM4',
        date: '2025-03-10'
      }
    ],
    comments: [
      {
        id: 4,
        user: 'Speedster99',
        text: 'Bringing my WRX STI. Ready to hit the apexes!',
        timestamp: '2025-05-01T12:00:00'
      },
      {
        id: 5,
        user: 'DriftKing',
        text: 'Any drift sessions planned?',
        timestamp: '2025-05-02T09:45:00'
      }
    ],
    organizer: {
      name: 'Speed Enthusiast Network',
      contact: 'trackdays@speednet.com',
      social: '@speednet'
    }
  },
  {
    id: 3,
    title: 'JDM Meetup',
    date: '2025-09-10',
    location: 'Long Beach, CA',
    description: 'A celebration of Japanese car culture with car shows and swap meets.',
    organizerId: 'user9',
    organizerUsername: 'jdm_lover',
    rsvpCount: 50,
    tags: ['JDM', 'Car Shows'],
    image: 'https://images.unsplash.com/photo-1580427331730-b38f8dc1f355?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8SkRNJTIwY2Fyc3xlbnwwfHwwfHx8MA%3D%3D',
    schedule: [
      { time: '10:00 AM', activity: 'Car Show Setup' },
      { time: '12:00 PM', activity: 'Swap Meet Opens' },
      { time: '3:00 PM', activity: 'Awards Ceremony' }
    ],
    testimonials: [
      {
        author: 'Kenji S.',
        text: 'Amazing variety of JDM cars. Great vibe!',
        car: '1998 Nissan Skyline GT-R',
        avatar: 'https://unsplash.com/photos/white-nissan-skyline-parked-8Y6zK9YqM2',
        date: '2025-02-20'
      }
    ],
    comments: [
      {
        id: 6,
        user: 'JDMLover',
        text: 'Can’t wait to show off my Civic!',
        timestamp: '2025-05-03T15:20:00'
      },
      {
        id: 7,
        user: 'TunerTech',
        text: 'Bringing some rare JDM parts for the swap meet.',
        timestamp: '2025-05-04T11:10:00'
      }
    ],
    organizer: {
      name: 'JDM Culture Club',
      contact: 'events@jdmculture.com',
      social: '@jdmculture'
    }
  },
  {
    id: 4,
    title: 'Muscle Car Showdown',
    date: '2025-06-25',
    location: 'Las Vegas, NV',
    description: 'A showcase of American muscle cars with drag races and awards.',
    organizerId: 'user8',
    organizerUsername: 'muscle_car_mad',
    rsvpCount: 40,
    tags: ['Muscle Cars', 'Drag Racing'],
    image: 'https://images.unsplash.com/photo-1594136277951-b6e8e640c338?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8TXVzY2xlJTIwQ2FyJTIwU2hvd2Rvd258ZW58MHx8MHx8fDA%3D',
    schedule: [
      { time: '8:00 AM', activity: 'Car Show Opens' },
      { time: '1:00 PM', activity: 'Drag Race Qualifying' },
      { time: '4:00 PM', activity: 'Awards Ceremony' }
    ],
    testimonials: [
      {
        author: 'Mike R.',
        text: 'Epic event for muscle car fans!',
        car: '1969 Dodge Charger',
        avatar: 'https://unsplash.com/photos/black-dodge-charger-parked-9Y8zK9YqM4',
        date: '2025-03-01'
      }
    ],
    comments: [
      {
        id: 8,
        user: 'MuscleCarMad',
        text: 'Bringing my Chevelle SS. Ready for the drag strip!',
        timestamp: '2025-05-05T10:00:00'
      }
    ],
    organizer: {
      name: 'Muscle Car Alliance',
      contact: 'events@musclecaralliance.com',
      social: '@musclecaralliance'
    }
  },
  {
    id: 5,
    title: 'Hot Rod Cruise Night',
    date: '2025-07-05',
    location: 'Phoenix, AZ',
    description: 'Evening cruise for hot rods and custom builds with live music.',
    organizerId: 'user15',
    organizerUsername: 'car_crafter',
    rsvpCount: 35,
    tags: ['Hot Rods', 'Cruise Night'],
    image: 'https://images.unsplash.com/photo-1541348263662-e068662d82af',
    schedule: [
      { time: '6:00 PM', activity: 'Meetup and Car Display' },
      { time: '7:30 PM', activity: 'Cruise Begins' },
      { time: '9:00 PM', activity: 'Live Band Performance' }
    ],
    testimonials: [
      {
        author: 'Lisa K.',
        text: 'Loved the vibe and the custom builds!',
        car: '1935 Ford Roadster',
        avatar: 'https://unsplash.com/photos/red-ford-roadster-parked-5Y8zK9YqM4',
        date: '2025-04-10'
      }
    ],
    comments: [
      {
        id: 9,
        user: 'CarCrafter',
        text: 'My 32 Ford Coupe is ready to roll!',
        timestamp: '2025-05-06T14:20:00'
      }
    ],
    organizer: {
      name: 'Hot Rod Haven',
      contact: 'events@hotrodhaven.com',
      social: '@hotrodhaven'
    }
  },
  {
    id: 6,
    title: 'Convertible Coastal Drive',
    date: '2025-08-01',
    location: 'Santa Barbara, CA',
    description: 'Scenic drive for convertibles along the Pacific Coast Highway.',
    organizerId: 'user5',
    organizerUsername: 'vintage_vibes',
    rsvpCount: 25,
    tags: ['Convertibles', 'Road Trip'],
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a',
    schedule: [
      { time: '10:00 AM', activity: 'Meetup and Coffee' },
      { time: '11:00 AM', activity: 'Drive Begins' },
      { time: '2:00 PM', activity: 'Lunch Stop' }
    ],
    testimonials: [
      {
        author: 'Emma T.',
        text: 'Perfect day with the top down!',
        car: '1966 Ford Mustang Convertible',
        avatar: 'https://unsplash.com/photos/red-mustang-convertible-6Y8zK9YqM4',
        date: '2025-03-15'
      }
    ],
    comments: [
      {
        id: 10,
        user: 'VintageVibes',
        text: 'Can’t wait to cruise in my Falcon!',
        timestamp: '2025-05-07T09:30:00'
      }
    ],
    organizer: {
      name: 'Convertible Cruisers',
      contact: 'events@convertiblecruisers.com',
      social: '@convertiblecruisers'
    }
  },
  {
    id: 7,
    title: 'Drift Day Spectacular',
    date: '2025-09-20',
    location: 'Irwindale Speedway, CA',
    description: 'Drift sessions and competitions for JDM and tuner cars.',
    organizerId: 'user4',
    organizerUsername: 'drift_king',
    rsvpCount: 28,
    tags: ['Drifting', 'JDM'],
    image: 'https://images.unsplash.com/photo-1695237590082-260aa712160e?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8SkRNJTIwRHJpZnR8ZW58MHx8MHx8fDA%3D',
    schedule: [
      { time: '9:00 AM', activity: 'Driver Registration' },
      { time: '10:00 AM', activity: 'Practice Sessions' },
      { time: '2:00 PM', activity: 'Drift Competition' }
    ],
    testimonials: [
      {
        author: 'Jake L.',
        text: 'Best drift event I’ve been to!',
        car: '1997 Nissan 180SX',
        avatar: 'https://unsplash.com/photos/white-nissan-180sx-parked-4Y8zK9YqM4',
        date: '2025-04-05'
      }
    ],
    comments: [
      {
        id: 11,
        user: 'DriftKing',
        text: 'Ready to slide my 240SX!',
        timestamp: '2025-05-08T11:00:00'
      }
    ],
    organizer: {
      name: 'Drift Dynamics',
      contact: 'events@driftdynamics.com',
      social: '@driftdynamics'
    }
  },
  {
    id: 8,
    title: 'Euro Car Meet',
    date: '2025-10-05',
    location: 'San Francisco, CA',
    description: 'Gathering of European car enthusiasts with a focus on vintage models.',
    organizerId: 'user3',
    organizerUsername: 'classic_enthusiast',
    rsvpCount: 32,
    tags: ['Vintage European', 'Car Shows'],
    image: 'https://images.unsplash.com/photo-1617772010721-895955e79f1e?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8RXVybyUyMENhcnxlbnwwfHwwfHx8MA%3D%3D',
    schedule: [
      { time: '11:00 AM', activity: 'Car Show Begins' },
      { time: '1:00 PM', activity: 'Guest Speaker' },
      { time: '3:00 PM', activity: 'Awards' }
    ],
    testimonials: [
      {
        author: 'Anna B.',
        text: 'Loved seeing all the classic Euros!',
        car: '1975 BMW 2002',
        avatar: 'https://unsplash.com/photos/white-bmw-2002-parked-3Y8zK9YqM4',
        date: '2025-02-25'
      }
    ],
    comments: [
      {
        id: 12,
        user: 'ClassicEnthusiast',
        text: 'My 911 is ready to shine!',
        timestamp: '2025-05-09T12:45:00'
      }
    ],
    organizer: {
      name: 'Euro Car Collective',
      contact: 'events@eurocarcollective.com',
      social: '@eurocarcollective'
    }
  },
  {
    id: 9,
    title: 'Turbo Tuesday Meet',
    date: '2025-06-10',
    location: 'Miami, FL',
    description: 'Midweek meetup for turbocharged car enthusiasts.',
    organizerId: 'user6',
    organizerUsername: 'turbo_fan',
    rsvpCount: 20,
    tags: ['Turbo Cars', 'Meetup'],
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
    schedule: [
      { time: '6:00 PM', activity: 'Car Meet Begins' },
      { time: '7:00 PM', activity: 'Show and Tell' },
      { time: '8:00 PM', activity: 'Group Photo' }
    ],
    testimonials: [
      {
        author: 'Carlos M.',
        text: 'Great turnout for a weeknight!',
        car: '2017 Audi S3',
        avatar: 'https://unsplash.com/photos/white-audi-s3-parked-2Y8zK9YqM4',
        date: '2025-03-20'
      }
    ],
    comments: [
      {
        id: 13,
        user: 'TurboFan',
        text: 'Bringing my Challenger SRT!',
        timestamp: '2025-05-10T15:00:00'
      }
    ],
    organizer: {
      name: 'Turbo Tribe',
      contact: 'events@turbotribe.com',
      social: '@turbotribe'
    }
  },
  {
    id: 10,
    title: 'Roadster Rally',
    date: '2025-07-15',
    location: 'Seattle, WA',
    description: 'A rally for roadster enthusiasts with scenic drives.',
    organizerId: 'user7',
    organizerUsername: 'roadster_queen',
    rsvpCount: 22,
    tags: ['Roadsters', 'Scenic Drives'],
    image: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a',
    schedule: [
      { time: '9:00 AM', activity: 'Meetup and Breakfast' },
      { time: '10:00 AM', activity: 'Drive Begins' },
      { time: '1:00 PM', activity: 'Lunch Stop' }
    ],
    testimonials: [
      {
        author: 'Sophie R.',
        text: 'Amazing roads and great company!',
        car: '2000 Mazda Miata',
        avatar: 'https://unsplash.com/photos/red-mazda-miata-parked-1Y8zK9YqM4',
        date: '2025-04-01'
      }
    ],
    comments: [
      {
        id: 14,
        user: 'RoadsterQueen',
        text: 'My Miata is ready for this!',
        timestamp: '2025-05-11T10:30:00'
      }
    ],
    organizer: {
      name: 'Roadster Riders',
      contact: 'events@roadsterriders.com',
      social: '@roadsterriders'
    }
  },
  {
    id: 11,
    title: 'Retro Car Show',
    date: '2025-08-20',
    location: 'Boston, MA',
    description: 'Showcase of 80s and 90s cars with a nostalgic vibe.',
    organizerId: 'user11',
    organizerUsername: 'retro_rider',
    rsvpCount: 27,
    tags: ['Retro Cars', 'Car Shows'],
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2',
    schedule: [
      { time: '10:00 AM', activity: 'Car Show Opens' },
      { time: '12:00 PM', activity: 'Retro Music Performance' },
      { time: '2:00 PM', activity: 'Awards' }
    ],
    testimonials: [
      {
        author: 'Mark D.',
        text: 'Took me back to my childhood!',
        car: '1989 Toyota Supra',
        avatar: 'https://unsplash.com/photos/white-toyota-supra-parked-7Y8zK9YqM4',
        date: '2025-03-05'
      }
    ],
    comments: [
      {
        id: 15,
        user: 'RetroRider',
        text: 'My 325i is polished and ready!',
        timestamp: '2025-05-12T14:00:00'
      }
    ],
    organizer: {
      name: 'Retro Revival',
      contact: 'events@retrorevival.com',
      social: '@retrorevival'
    }
  },
  {
    id: 12,
    title: 'Drag Race Nationals',
    date: '2025-09-25',
    location: 'Las Vegas, NV',
    description: 'High-stakes drag racing event for muscle cars and tuners.',
    organizerId: 'user12',
    organizerUsername: 'speed_demon',
    rsvpCount: 38,
    tags: ['Drag Racing', 'Muscle Cars'],
    image: 'https://images.unsplash.com/photo-1653824508597-d55760000f65?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    schedule: [
      { time: '8:00 AM', activity: 'Qualifying Rounds' },
      { time: '1:00 PM', activity: 'Main Event Begins' },
      { time: '5:00 PM', activity: 'Finals and Awards' }
    ],
    testimonials: [
      {
        author: 'Tyler G.',
        text: 'Insane races and awesome crowd!',
        car: '2018 Chevrolet Camaro ZL1',
        avatar: 'https://unsplash.com/photos/black-camaro-zl1-parked-6Y8zK9YqM4',
        date: '2025-04-12'
      }
    ],
    comments: [
      {
        id: 16,
        user: 'SpeedDemon',
        text: 'My Mustang GT is geared up!',
        timestamp: '2025-05-13T11:20:00'
      }
    ],
    organizer: {
      name: 'Drag Race League',
      contact: 'events@dragraceleague.com',
      social: '@dragraceleague'
    }
  },
  {
    id: 13,
    title: 'Classic Car Auction',
    date: '2025-06-15',
    location: 'Charlotte, NC',
    description: 'Auction of rare classic cars with a pre-auction car show.',
    organizerId: 'user13',
    organizerUsername: 'classic_cruiser',
    rsvpCount: 42,
    tags: ['Classic Cars', 'Auctions'],
    image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d',
    schedule: [
      { time: '9:00 AM', activity: 'Car Show and Inspection' },
      { time: '12:00 PM', activity: 'Auction Begins' },
      { time: '4:00 PM', activity: 'Post-Auction Meet' }
    ],
    testimonials: [
      {
        author: 'Laura S.',
        text: 'Found a gem at this auction!',
        car: '1965 Shelby Cobra',
        avatar: 'https://unsplash.com/photos/blue-shelby-cobra-parked-4Y8zK9YqM4',
        date: '2025-03-25'
      }
    ],
    comments: [
      {
        id: 17,
        user: 'ClassicCruiser',
        text: 'Hoping to bid on a GTO!',
        timestamp: '2025-05-14T09:45:00'
      }
    ],
    organizer: {
      name: 'Classic Auction House',
      contact: 'events@classicauctionhouse.com',
      social: '@classicauctionhouse'
    }
  },
  {
    id: 14,
    title: 'Tuner Tech Workshop',
    date: '2025-07-30',
    location: 'Orlando, FL',
    description: 'Hands-on workshop for ECU tuning and performance mods.',
    organizerId: 'user14',
    organizerUsername: 'tuner_tech',
    rsvpCount: 15,
    tags: ['Tuner Cars', 'Workshops'],
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f',
    schedule: [
      { time: '10:00 AM', activity: 'ECU Tuning Basics' },
      { time: '1:00 PM', activity: 'Hands-on Tuning Session' },
      { time: '3:00 PM', activity: 'Q&A with Experts' }
    ],
    testimonials: [
      {
        author: 'Chris P.',
        text: 'Learned so much about tuning!',
        car: '2014 Subaru BRZ',
        avatar: 'https://unsplash.com/photos/white-subaru-brz-parked-2Y8zK9YqM4',
        date: '2025-04-20'
      }
    ],
    comments: [
      {
        id: 18,
        user: 'TunerTech',
        text: 'Ready to tune my Evo!',
        timestamp: '2025-05-15T12:00:00'
      }
    ],
    organizer: {
      name: 'Tuner Tech Academy',
      contact: 'events@tunertechacademy.com',
      social: '@tunertechacademy'
    }
  },
  {
    id: 15,
    title: 'DIY Car Repair Meet',
    date: '2025-08-10',
    location: 'Portland, OR',
    description: 'Community meetup for DIY car repairs and project car builds.',
    organizerId: 'user10',
    organizerUsername: 'gear_head',
    rsvpCount: 18,
    tags: ['DIY Repairs', 'Project Cars'],
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Q2FyJTIwUmVwYWlyfGVufDB8fDB8fHww',
    schedule: [
      { time: '11:00 AM', activity: 'Tool Swap Meet' },
      { time: '12:00 PM', activity: 'Repair Demos' },
      { time: '2:00 PM', activity: 'Project Car Showcase' }
    ],
    testimonials: [
      {
        author: 'Greg H.',
        text: 'Great tips for my project car!',
        car: '1983 Datsun 280ZX',
        avatar: 'https://unsplash.com/photos/red-datsun-280zx-parked-1Y8zK9YqM4',
        date: '2025-03-30'
      }
    ],
    comments: [
      {
        id: 19,
        user: 'GearHead',
        text: 'Bringing my MR2 for some help!',
        timestamp: '2025-05-16T10:15:00'
      }
    ],
    organizer: {
      name: 'DIY Garage Club',
      contact: 'events@diygarageclub.com',
      social: '@diygarageclub'
    }
  },
  {
    id: 16,
    title: 'Lowrider Showcase',
    date: '2025-09-15',
    location: 'Los Angeles, CA',
    description: 'Celebration of lowrider culture with custom cars and hydraulics demos.',
    organizerId: 'user1',
    organizerUsername: 'car_lover',
    rsvpCount: 50,
    tags: ['Lowriders', 'Car Shows'],
    image: 'https://images.unsplash.com/photo-1628565412954-ecb8eb6532d8?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8TG93cmlkZXJzfGVufDB8fDB8fHww',
    schedule: [
      { time: '12:00 PM', activity: 'Car Show Opens' },
      { time: '2:00 PM', activity: 'Hydraulics Demo' },
      { time: '4:00 PM', activity: 'Awards Ceremony' }
    ],
    testimonials: [
      {
        author: 'Maria V.',
        text: 'Incredible lowriders and great music!',
        car: '1994 Chevrolet Impala',
        avatar: 'https://unsplash.com/photos/red-chevrolet-impala-parked-7Y8zK9YqM4',
        date: '2025-04-25'
      }
    ],
    comments: [
      {
        id: 20,
        user: 'CarLover',
        text: 'Can’t wait to see the hydraulics!',
        timestamp: '2025-05-17T13:30:00'
      }
    ],
    organizer: {
      name: 'Lowrider Legends',
      contact: 'events@lowriderlegends.com',
      social: '@lowriderlegends'
    }
  },
  {
    id: 17,
    title: 'Off-Road Rally',
    date: '2025-06-20',
    location: 'Moab, UT',
    description: 'Off-road adventure for trucks and SUVs with trail rides.',
    organizerId: 'user2',
    organizerUsername: 'speedster99',
    rsvpCount: 20,
    tags: ['Off-Roading', 'Trucks'],
    image: 'https://images.unsplash.com/photo-1714496228779-48f5fe3fe154?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fE9mZiUyMFJvYWQlMjByYWxseXxlbnwwfHwwfHx8MA%3D%3D',
    schedule: [
      { time: '8:00 AM', activity: 'Trail Check-in' },
      { time: '9:00 AM', activity: 'Trail Rides Begin' },
      { time: '3:00 PM', activity: 'Campfire Meet' }
    ],
    testimonials: [
      {
        author: 'Tom B.',
        text: 'Epic trails and awesome views!',
        car: '2020 Jeep Wrangler',
        avatar: 'https://unsplash.com/photos/black-jeep-wrangler-parked-3Y8zK9YqM4',
        date: '2025-03-10'
      }
    ],
    comments: [
      {
        id: 21,
        user: 'Speedster99',
        text: 'Bringing my lifted Tacoma!',
        timestamp: '2025-05-18T11:00:00'
      }
    ],
    organizer: {
      name: 'Off-Road Outlaws',
      contact: 'events@offroadoutlaws.com',
      social: '@offroadoutlaws'
    }
  },
  {
    id: 18,
    title: 'Supercar Sunday',
    date: '2025-07-25',
    location: 'Miami, FL',
    description: 'Showcase of exotic supercars with a charity auction.',
    organizerId: 'user6',
    organizerUsername: 'turbo_fan',
    rsvpCount: 35,
    tags: ['Supercars', 'Charity'],
    image: 'https://images.unsplash.com/photo-1566024164372-0281f1133aa6?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8c3VwZXJjYXJ8ZW58MHx8MHx8fDA%3D',
    schedule: [
      { time: '10:00 AM', activity: 'Supercar Display' },
      { time: '1:00 PM', activity: 'Charity Auction' },
      { time: '3:00 PM', activity: 'Group Photo' }
    ],
    testimonials: [
      {
        author: 'Rachel F.',
        text: 'Stunning cars and a great cause!',
        car: '2021 Lamborghini Huracan',
        avatar: 'https://unsplash.com/photos/yellow-lamborghini-huracan-parked-2Y8zK9YqM4',
        date: '2025-04-15'
      }
    ],
    comments: [
      {
        id: 22,
        user: 'TurboFan',
        text: 'Hoping to see some rare exotics!',
        timestamp: '2025-05-19T09:45:00'
      }
    ],
    organizer: {
      name: 'Supercar Society',
      contact: 'events@supercarsociety.com',
      social: '@supercarsociety'
    }
  },
  {
    id: 19,
    title: 'Vintage Motorcycle Meet',
    date: '2025-08-05',
    location: 'Austin, TX',
    description: 'Gathering of vintage motorcycles with a ride-out.',
    organizerId: 'user5',
    organizerUsername: 'vintage_vibes',
    rsvpCount: 25,
    tags: ['Motorcycles', 'Vintage'],
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc',
    schedule: [
      { time: '9:00 AM', activity: 'Bike Show Opens' },
      { time: '11:00 AM', activity: 'Group Ride' },
      { time: '2:00 PM', activity: 'Lunch Meet' }
    ],
    testimonials: [
      {
        author: 'Steve W.',
        text: 'Great mix of classic bikes!',
        car: '1972 Harley-Davidson Sportster',
        avatar: 'https://unsplash.com/photos/black-harley-sportster-parked-1Y8zK9YqM4',
        date: '2025-03-15'
      }
    ],
    comments: [
      {
        id: 23,
        user: 'VintageVibes',
        text: 'Bringing my Triumph Bonneville!',
        timestamp: '2025-05-20T12:30:00'
      }
    ],
    organizer: {
      name: 'Vintage Riders',
      contact: 'events@vintageriders.com',
      social: '@vintageriders'
    }
  },
  {
    id: 20,
    title: 'Car Audio Competition',
    date: '2025-09-30',
    location: 'Dallas, TX',
    description: 'Competition for the best car audio systems with live demos.',
    organizerId: 'user9',
    organizerUsername: 'jdm_lover',
    rsvpCount: 30,
    tags: ['Car Audio', 'Competitions'],
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
    schedule: [
      { time: '10:00 AM', activity: 'Audio System Check-in' },
      { time: '12:00 PM', activity: 'Sound-Off Competition' },
      { time: '3:00 PM', activity: 'Awards' }
    ],
    testimonials: [
      {
        author: 'Kevin J.',
        text: 'Loudest systems I’ve ever heard!',
        car: '2005 Honda Accord',
        avatar: 'https://unsplash.com/photos/white-honda-accord-parked-7Y8zK9YqM4',
        date: '2025-04-10'
      }
    ],
    comments: [
      {
        id: 24,
        user: 'JDMLover',
        text: 'My Civic’s system is ready to compete!',
        timestamp: '2025-05-21T10:00:00'
      }
    ],
    organizer: {
      name: 'Bass Boomers',
      contact: 'events@bassboomers.com',
      social: '@bassboomers'
    }
  },
  {
    id: 21,
    title: 'Rallycross Challenge',
    date: '2025-06-30',
    location: 'Denver, CO',
    description: 'Rallycross event with dirt and pavement racing.',
    organizerId: 'user8',
    organizerUsername: 'muscle_car_mad',
    rsvpCount: 22,
    tags: ['Rallycross', 'Racing'],
    image: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a',
    schedule: [
      { time: '8:00 AM', activity: 'Driver Check-in' },
      { time: '9:00 AM', activity: 'Practice Laps' },
      { time: '11:00 AM', activity: 'Races Begin' }
    ],
    testimonials: [
      {
        author: 'Luke M.',
        text: 'Thrilling races on a tough course!',
        car: '2019 Subaru WRX',
        avatar: 'https://unsplash.com/photos/blue-subaru-wrx-parked-3Y8zK9YqM4',
        date: '2025-03-20'
      }
    ],
    comments: [
      {
        id: 25,
        user: 'MuscleCarMad',
        text: 'Hoping to try rallycross this year!',
        timestamp: '2025-05-22T14:15:00'
      }
    ],
    organizer: {
      name: 'Rallycross Renegades',
      contact: 'events@rallycrossrenegades.com',
      social: '@rallycrossrenegades'
    }
  },
  {
    id: 22,
    title: 'Electric Car Meetup',
    date: '2025-07-10',
    location: 'San Francisco, CA',
    description: 'Showcase of electric vehicles with test drives.',
    organizerId: 'user2',
    organizerUsername: 'speedster99',
    rsvpCount: 28,
    tags: ['Electric Cars', 'Meetup'],
    image: 'https://plus.unsplash.com/premium_photo-1681987448226-f8feb59a58e9?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    schedule: [
      { time: '10:00 AM', activity: 'EV Display Opens' },
      { time: '12:00 PM', activity: 'Test Drive Sessions' },
      { time: '2:00 PM', activity: 'Panel Discussion' }
    ],
    testimonials: [
      {
        author: 'Ellen P.',
        text: 'Great to see the future of cars!',
        car: '2023 Tesla Model Y',
        avatar: 'https://unsplash.com/photos/white-tesla-model-y-parked-2Y8zK9YqM4',
        date: '2025-04-05'
      }
    ],
    comments: [
      {
        id: 26,
        user: 'Speedster99',
        text: 'Excited to check out the EVs!',
        timestamp: '2025-05-23T11:30:00'
      }
    ],
    organizer: {
      name: 'EV Enthusiasts',
      contact: 'events@eventhusiasts.com',
      social: '@eventhusiasts'
    }
  },
  {
    id: 23,
    title: 'Car Restoration Workshop',
    date: '2025-08-15',
    location: 'Nashville, TN',
    description: 'Hands-on workshop for classic car restoration techniques.',
    organizerId: 'user15',
    organizerUsername: 'car_crafter',
    rsvpCount: 15,
    tags: ['Restoration', 'Workshops'],
    image: 'https://images.unsplash.com/photo-1562225517-1176a7751893?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y2FyJTIwcmVzdG9yfGVufDB8fDB8fHww',
    schedule: [
      { time: '9:00 AM', activity: 'Restoration Basics' },
      { time: '11:00 AM', activity: 'Hands-on Session' },
      { time: '2:00 PM', activity: 'Expert Q&A' }
    ],
    testimonials: [
      {
        author: 'Paul R.',
        text: 'Learned so much about bodywork!',
        car: '1968 Chevrolet Nova',
        avatar: 'https://unsplash.com/photos/red-chevrolet-nova-parked-1Y8zK9YqM4',
        date: '2025-03-25'
      }
    ],
    comments: [
      {
        id: 27,
        user: 'CarCrafter',
        text: 'Ready to restore my Ford Coupe!',
        timestamp: '2025-05-24T09:00:00'
      }
    ],
    organizer: {
      name: 'Restoration Pros',
      contact: 'events@restorationpros.com',
      social: '@restorationpros'
    }
  },
  {
    id: 24,
    title: 'Truck and SUV Meet',
    date: '2025-09-05',
    location: 'Phoenix, AZ',
    description: 'Gathering of trucks and SUVs with a tailgate party.',
    organizerId: 'user4',
    organizerUsername: 'drift_king',
    rsvpCount: 30,
    tags: ['Trucks', 'Meetup'],
    image: 'https://images.unsplash.com/photo-1598248691267-4a62dfdfd8a8?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHN1dnxlbnwwfHwwfHx8MA%3D%3D',
    schedule: [
      { time: '5:00 PM', activity: 'Truck Display' },
      { time: '6:00 PM', activity: 'Tailgate Party' },
      { time: '8:00 PM', activity: 'Group Photo' }
    ],
    testimonials: [
      {
        author: 'Jake T.',
        text: 'Awesome trucks and great food!',
        car: '2021 Ford F-150',
        avatar: 'https://unsplash.com/photos/black-ford-f150-parked-7Y8zK9YqM4',
        date: '2025-04-20'
      }
    ],
    comments: [
      {
        id: 28,
        user: 'DriftKing',
        text: 'Bringing my lifted Ram!',
        timestamp: '2025-05-25T12:45:00'
      }
    ],
    organizer: {
      name: 'Truck Titans',
      contact: 'events@trucktitans.com',
      social: '@trucktitans'
    }
  },
  {
    id: 25,
    title: 'Car Photography Workshop',
    date: '2025-06-25',
    location: 'Los Angeles, CA',
    description: 'Workshop for capturing stunning car photos.',
    organizerId: 'user1',
    organizerUsername: 'car_lover',
    rsvpCount: 12,
    tags: ['Photography', 'Workshops'],
    image: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a',
    schedule: [
      { time: '10:00 AM', activity: 'Photography Basics' },
      { time: '12:00 PM', activity: 'Car Photo Shoot' },
      { time: '2:00 PM', activity: 'Editing Tips' }
    ],
    testimonials: [
      {
        author: 'Sarah L.',
        text: 'Improved my car photography skills!',
        car: '2019 BMW M4',
        avatar: 'https://unsplash.com/photos/blue-bmw-m4-parked-3Y8zK9YqM4',
        date: '2025-03-30'
      }
    ],
    comments: [
      {
        id: 29,
        user: 'CarLover',
        text: 'Excited to shoot my Mustang!',
        timestamp: '2025-05-26T10:30:00'
      }
    ],
    organizer: {
      name: 'Car Snap Studio',
      contact: 'events@carsnapstudio.com',
      social: '@carsnapstudio'
    }
  },
  {
    id: 26,
    title: 'Vintage Truck Rally',
    date: '2025-07-20',
    location: 'Charlotte, NC',
    description: 'Rally for vintage trucks with a cross-country drive.',
    organizerId: 'user13',
    organizerUsername: 'classic_cruiser',
    rsvpCount: 20,
    tags: ['Vintage Trucks', 'Road Trip'],
    image: 'https://images.unsplash.com/photo-1578718505785-83ebf94ee1c7?q=80&w=2068&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    schedule: [
      { time: '8:00 AM', activity: 'Meetup and Breakfast' },
      { time: '9:00 AM', activity: 'Drive Begins' },
      { time: '3:00 PM', activity: 'Evening Meet' }
    ],
    testimonials: [
      {
        author: 'Frank D.',
        text: 'Loved cruising in my old Chevy!',
        car: '1955 Chevrolet 3100',
        avatar: 'https://unsplash.com/photos/red-chevrolet-3100-parked-2Y8zK9YqM4',
        date: '2025-04-01'
      }
    ],
    comments: [
      {
        id: 30,
        user: 'ClassicCruiser',
        text: 'My GTO is ready for the road!',
        timestamp: '2025-05-27T11:00:00'
      }
    ],
    organizer: {
      name: 'Vintage Truck Club',
      contact: 'events@vintagetruckclub.com',
      social: '@vintagetruckclub'
    }
  },
  {
    id: 27,
    title: 'Car Wrap Showcase',
    date: '2025-08-25',
    location: 'Miami, FL',
    description: 'Showcase of custom car wraps and vinyl designs.',
    organizerId: 'user6',
    organizerUsername: 'turbo_fan',
    rsvpCount: 25,
    tags: ['Car Wraps', 'Car Shows'],
    image: 'https://images.unsplash.com/photo-1699078042053-ecd9166d3f26?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    schedule: [
      { time: '11:00 AM', activity: 'Wrap Display Opens' },
      { time: '1:00 PM', activity: 'Wrap Demo' },
      { time: '3:00 PM', activity: 'Awards' }
    ],
    testimonials: [
      {
        author: 'Mia R.',
        text: 'Incredible designs and creativity!',
        car: '2018 Dodge Viper',
        avatar: 'https://unsplash.com/photos/green-dodge-viper-parked-1Y8zK9YqM4',
        date: '2025-04-10'
      }
    ],
    comments: [
      {
        id: 31,
        user: 'TurboFan',
        text: 'Showing off my new wrap!',
        timestamp: '2025-05-28T09:30:00'
      }
    ],
    organizer: {
      name: 'Wrap Warriors',
      contact: 'events@wrapwarriors.com',
      social: '@wrapwarriors'
    }
  },
  {
    id: 28,
    title: 'Microcar Meetup',
    date: '2025-09-10',
    location: 'Seattle, WA',
    description: 'Gathering of microcars and compact classics.',
    organizerId: 'user7',
    organizerUsername: 'roadster_queen',
    rsvpCount: 15,
    tags: ['Microcars', 'Car Shows'],
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a',
    schedule: [
      { time: '10:00 AM', activity: 'Car Show Opens' },
      { time: '12:00 PM', activity: 'Microcar Parade' },
      { time: '2:00 PM', activity: 'Awards' }
    ],
    testimonials: [
      {
        author: 'Tina S.',
        text: 'So many cute cars in one place!',
        car: '1960 Fiat 500',
        avatar: 'https://unsplash.com/photos/red-fiat-500-parked-7Y8zK9YqM4',
        date: '2025-03-15'
      }
    ],
    comments: [
      {
        id: 32,
        user: 'RoadsterQueen',
        text: 'Bringing my little BMW Isetta!',
        timestamp: '2025-05-29T12:00:00'
      }
    ],
    organizer: {
      name: 'Microcar Mania',
      contact: 'events@microcarmania.com',
      social: '@microcarmania'
    }
  },
  {
    id: 29,
    title: 'Car Detailing Demo',
    date: '2025-06-15',
    location: 'Orlando, FL',
    description: 'Demo of car detailing techniques with pro tips.',
    organizerId: 'user14',
    organizerUsername: 'tuner_tech',
    rsvpCount: 18,
    tags: ['Detailing', 'Workshops'],
    image: 'https://images.unsplash.com/photo-1605437241278-c1806d14a4d9?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Q2FyJTIwZGV0YWlsaW5nfGVufDB8fDB8fHww',
    schedule: [
      { time: '10:00 AM', activity: 'Detailing Basics' },
      { time: '12:00 PM', activity: 'Hands-on Demo' },
      { time: '2:00 PM', activity: 'Q&A with Detailers' }
    ],
    testimonials: [
      {
        author: 'Brian K.',
        text: 'My car has never looked better!',
        car: '2019 Mercedes-Benz C-Class',
        avatar: 'https://unsplash.com/photos/white-mercedes-c-class-parked-3Y8zK9YqM4',
        date: '2025-04-20'
      }
    ],
    comments: [
      {
        id: 33,
        user: 'TunerTech',
        text: 'Learning to detail my Evo!',
        timestamp: '2025-05-30T10:45:00'
      }
    ],
    organizer: {
      name: 'Detailing Pros',
      contact: 'events@detailingpros.com',
      social: '@detailingpros'
    }
  },
  {
    id: 30,
    title: 'Holiday Car Parade',
    date: '2025-12-15',
    location: 'San Diego, CA',
    description: 'Festive car parade with decorated vehicles.',
    organizerId: 'user3',
    organizerUsername: 'classic_enthusiast',
    rsvpCount: 40,
    tags: ['Parade', 'Holiday'],
    image: 'https://images.unsplash.com/photo-1541348263662-e068662d82af',
    schedule: [
      { time: '5:00 PM', activity: 'Car Decoration Meet' },
      { time: '6:00 PM', activity: 'Parade Begins' },
      { time: '8:00 PM', activity: 'After-Party' }
    ],
    testimonials: [
      {
        author: 'Clara M.',
        text: 'So much fun decorating my car!',
        car: '2015 Volkswagen Beetle',
        avatar: 'https://unsplash.com/photos/yellow-vw-beetle-parked-2Y8zK9YqM4',
        date: '2025-04-25'
      }
    ],
    comments: [
      {
        id: 34,
        user: 'ClassicEnthusiast',
        text: 'Decorating my Porsche for the holidays!',
        timestamp: '2025-05-31T13:00:00'
      }
    ],
    organizer: {
      name: 'Holiday Cruisers',
      contact: 'events@holidaycruisers.com',
      social: '@holidaycruisers'
    }
  },
];

const mockMessages = [
  {
    id: 1,
    conversationId: 1,
    senderId: 'user1',
    text: 'Hey Jane! Are you going to the Vintage Car Rally?',
    timestamp: '2025-05-05T14:30:00Z',
    status: 'read'
  },
  {
    id: 2,
    conversationId: 1,
    senderId: 'user2',
    text: 'Yes! I can’t wait to see all the classics.',
    timestamp: '2025-05-05T14:35:00Z',
    status: 'read'
  },
  {
    id: 3,
    conversationId: 2,
    senderId: 'user3',
    text: 'Tom, got any tips for drifting my 240SX?',
    timestamp: '2025-05-06T09:00:00Z',
    status: 'delivered'
  },
  {
    id: 4,
    conversationId: 2,
    senderId: 'user4',
    text: 'Yeah, start with tire pressure and suspension tweaks. Want to meet up?',
    timestamp: '2025-05-06T09:15:00Z',
    status: 'read'
  },
  {
    id: 5,
    conversationId: 3,
    senderId: 'user9',
    text: 'Hey James, can you tune my Evo for the JDM meetup?',
    timestamp: '2025-05-07T10:20:00Z',
    status: 'read'
  },
  {
    id: 6,
    conversationId: 3,
    senderId: 'user14',
    text: 'Sure, let’s schedule a session next week.',
    timestamp: '2025-05-07T10:25:00Z',
    status: 'read'
  },
  {
    id: 7,
    conversationId: 4,
    senderId: 'user5',
    text: 'Sophia, love your Miata! Any mods planned?',
    timestamp: '2025-05-08T11:30:00Z',
    status: 'delivered'
  },
  {
    id: 8,
    conversationId: 4,
    senderId: 'user7',
    text: 'Thanks! Thinking about a roll bar and new seats.',
    timestamp: '2025-05-08T11:40:00Z',
    status: 'read'
  },
  {
    id: 9,
    conversationId: 5,
    senderId: 'user6',
    text: 'Noah, your Chevelle is a beast! What’s the horsepower?',
    timestamp: '2025-05-09T13:00:00Z',
    status: 'delivered'
  },
  {
    id: 10,
    conversationId: 5,
    senderId: 'user8',
    text: 'Around 450hp. Want to check it out at the rally?',
    timestamp: '2025-05-09T13:10:00Z',
    status: 'read'
  },
  // --- START: Additional Mock Messages for Demo ---
  // Simulating messages for 'user1' (Alex Johnson, free user)
  // Message from a premium user (user16) to user1 (free) - should be locked for user1
  {
    id: 11,
    // conversationId: 6, // Assuming new conversation ID system if not using backend's yet
    senderId: 'user16', // Premium Jane
    senderUsername: 'premium_jane',
    senderEffectivePremiumStatus: true,
    recipientId: 'user1', // Alex Johnson (free)
    recipientUsername: 'car_lover',
    recipientEffectivePremiumStatus: false,
    text: 'Hello Alex, this is a message from a premium user! You should see this as locked or blurred. Hope you upgrade soon to see my full message and enjoy unlimited chatting!',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: false, // Unread for Alex
    status: 'delivered' // Using 'status' for old compatibility, backend uses 'read' boolean
  },
  // Message from user1 (free) to user16 (premium)
  {
    id: 12,
    // conversationId: 6,
    senderId: 'user1',
    senderUsername: 'car_lover',
    senderEffectivePremiumStatus: false,
    recipientId: 'user16',
    recipientUsername: 'premium_jane',
    recipientEffectivePremiumStatus: true,
    text: 'Hi Premium Jane, thanks for your message! I see it\'s a bit blurry. I might upgrade soon.',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    read: false, // Unread for Jane
    status: 'delivered'
  },
  // Another unread message for user1 from another free user (user18)
  {
    id: 13,
    // conversationId: 7,
    senderId: 'user18', // Free Fred
    senderUsername: 'free_fred',
    senderEffectivePremiumStatus: false,
    recipientId: 'user1', // Alex
    recipientUsername: 'car_lover',
    recipientEffectivePremiumStatus: false,
    text: 'Hey Alex, saw your Mustang at the last meet. Looked great! Are you going to the downtown cruise next week?',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    read: false, // Unread for Alex
    status: 'delivered'
  },
  // A message sent by user1 to user18
  {
    id: 14,
    // conversationId: 7,
    senderId: 'user1',
    senderUsername: 'car_lover',
    senderEffectivePremiumStatus: false,
    recipientId: 'user18',
    recipientUsername: 'free_fred',
    recipientEffectivePremiumStatus: false,
    text: 'Thanks Fred! Yeah, planning to be there. Should be fun!',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
    read: true, // Assume Fred read it
    status: 'read'
  },
   // System-like message (though backend doesn't explicitly support this type yet, can be simulated)
  {
    id: 15,
    senderId: 'system', // Special sender ID
    senderUsername: 'CarMatch System',
    senderEffectivePremiumStatus: true, // System messages are not gated
    recipientId: 'user1',
    recipientUsername: 'car_lover',
    recipientEffectivePremiumStatus: false,
    text: 'Welcome to CarMatch! Complete your profile to find better matches.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: true,
    systemMessage: true, // Add a flag for system messages
    status: 'read'
  }
  // --- END: Additional Mock Messages ---
];

const mockConversations = [
  {
    id: 1,
    participants: ['user1', 'user2'],
    lastMessage: 'Yes! I can’t wait to see all the classics.',
    unread: 0
  },
  {
    id: 2,
    participants: ['user3', 'user4'],
    lastMessage: 'Yeah, start with tire pressure and suspension tweaks. Want to meet up?',
    unread: 0
  },
  {
    id: 3,
    participants: ['user9', 'user14'],
    lastMessage: 'Sure, let’s schedule a session next week.',
    unread: 0
  },
  {
    id: 4,
    participants: ['user5', 'user7'],
    lastMessage: 'Thanks! Thinking about a roll bar and new seats.',
    unread: 0
  },
  {
    id: 5,
    participants: ['user6', 'user8'],
    lastMessage: 'Around 450hp. Want to check it out at the rally?',
    unread: 0
  },
];

const mockApi = {
  // Initializes mock data by storing it in localStorage if not already present
  initMockData: () => {
    // Check if data already exists in localStorage
    if (!localStorage.getItem('carMatchData')) {
      const initialData = {
        users: mockUsers,
        profiles: mockProfiles,
        events: mockEvents,
        messages: mockMessages,
        conversations: mockConversations
      };
      localStorage.setItem('carMatchData', JSON.stringify(initialData));
    }
    return Promise.resolve();
  },

  // Handles user authentication and profile management
  login: (credentials) => Promise.resolve({ token: 'mock-token', user: mockUsers[0] }),
  register: (userData) => Promise.resolve({ ...userData, id: Date.now() }),
  getCurrentUser: () => {
    // Prefer real auth state from localStorage when available
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        return Promise.resolve(JSON.parse(stored));
      }
    } catch (e) {
      // ignore and fall back to mock
    }
    if (!mockUsers.length) {
      return Promise.reject('No user logged in');
    }
    return Promise.resolve(mockUsers[0]);
  },

  // Manages conversation and messaging functionality
  getConversations: () => Promise.resolve(mockConversations),
  getMessages: (conversationId) => {
    // If a conversationId is provided, filter by it; otherwise return all
    if (typeof conversationId === 'number') {
      return Promise.resolve(mockMessages.filter(m => m.conversationId === conversationId));
    }
    return Promise.resolve([...mockMessages].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp)));
  },
  sendMessage: (message) => {
    // Creates and stores a new message with a unique ID and timestamp
    const newMessage = {
      ...message,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: 'delivered'
    };
    mockMessages.push(newMessage);
    return Promise.resolve(newMessage);
  },

  // Manages event-related operations
  getEvents: () => Promise.resolve(mockEvents), // This will now serve the full mockEvents list
  createEvent: (event) => Promise.resolve({ ...event, id: Date.now() }),
  rsvpToEvent: (userIdOrEventId, maybeEventId) => {
    // Support both (eventId) and (userId, eventId) signatures
    const eventId = typeof maybeEventId === 'number' ? maybeEventId : userIdOrEventId;
    const event = mockEvents.find(e => e.id === eventId);
    if (event) event.rsvpCount = (event.rsvpCount || 0) + 1;
    const storedData = JSON.parse(localStorage.getItem('carMatchData') || '{}');
    storedData.events = mockEvents;
    localStorage.setItem('carMatchData', JSON.stringify(storedData));
    return Promise.resolve(event);
  },
  cancelRsvp: (userIdOrEventId, maybeEventId) => {
    const eventId = typeof maybeEventId === 'number' ? maybeEventId : userIdOrEventId;
    const event = mockEvents.find(e => e.id === eventId);
    if (event) event.rsvpCount = Math.max(0, (event.rsvpCount || 0) - 1);
    const storedData = JSON.parse(localStorage.getItem('carMatchData') || '{}');
    storedData.events = mockEvents;
    localStorage.setItem('carMatchData', JSON.stringify(storedData));
    return Promise.resolve(event);
  },
  getUserEvents: (userId) => Promise.resolve(mockEvents.filter(e => e.organizerId === userId)),

  // Manages user profile operations
  getProfile: (userId) => {
    const profile = mockProfiles.find(p => p.id === userId);
    if (!profile) {
      return Promise.reject('Profile not found');
    }
    const userRecord = mockUsers.find(u => u.id === userId);
    return Promise.resolve({ ...profile, email: userRecord ? userRecord.email : '' });
  },
  updateProfile: (profile) => Promise.resolve(profile),
  uploadPhoto: (file) => Promise.resolve({
    // Generates a URL for the uploaded file
    url: URL.createObjectURL(file),
    id: Date.now()
  }),

  // Handles user discovery and matching
  discoverUsers: () => Promise.resolve(mockProfiles),
  getMatches: () => Promise.resolve(mockProfiles.slice(0, 4)),
  
  // Manages event comments
  addComment: (eventId, comment) => {
    // Adds a comment to the specified event
    const event = mockEvents.find(e => e.id === eventId);
    if (!event) return Promise.reject('Event not found');
    
    event.comments.push(comment);
    // Updates localStorage with the modified event data
    const storedData = JSON.parse(localStorage.getItem('carMatchData')) || {};
    storedData.events = mockEvents;
    localStorage.setItem('carMatchData', JSON.stringify(storedData));
    
    return Promise.resolve(comment);
  }
};

// --- START: ADDITIONS FOR REAL API INTEGRATION ---
// Backend URL configurable via REACT_APP_API_BASE_URL (for production/Pages). If not set, stay fully mock.
const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL) || '';

const realApi = {
  registerUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData) });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `HTTP error! status: ${response.status}`); }
    return response.json();
  },
  loginUser: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `HTTP error! status: ${response.status}`); }
    return response.json();
  },
  upgradeToPremium: async (token, userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/upgrade-to-premium`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `HTTP error! status: ${response.status}`); }
    return response.json();
  },
  toggleDevOverride: async (token, userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/toggle-dev-override`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `HTTP error! status: ${response.status}`); }
    return response.json();
  },
  fetchMessages: async (token, category, filters = {}) => {
    let queryString = `?category=${encodeURIComponent(category)}`;
    if (filters.filterGender) queryString += `&filterGender=${encodeURIComponent(filters.filterGender)}`;
    if (filters.filterRadius) queryString += `&filterRadius=${encodeURIComponent(filters.filterRadius)}`;
    if (filters.sortBy) queryString += `&sortBy=${encodeURIComponent(filters.sortBy)}`;
    const response = await fetch(`${API_BASE_URL}/messages/inbox${queryString}`, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `HTTP error! status: ${response.status}`); }
    return response.json();
  },
  sendMessage: async (token, recipientUsername, text) => { 
    const response = await fetch(`${API_BASE_URL}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ recipientUsername, text }) });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `HTTP error! status: ${response.status}`); }
    return response.json();
  },
  createEvent: async (token, eventData) => {
    const response = await fetch(`${API_BASE_URL}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(eventData) });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `HTTP error! status: ${response.status}`); }
    return response.json();
  },
  getEvents: async () => { // This is the realApi.getEvents
    const response = await fetch(`${API_BASE_URL}/events`);
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `HTTP error! status: ${response.status}`); }
    return response.json();
  },
  rsvpToEvent: async (token, eventId) => {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/rsvp`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `HTTP error! status: ${response.status}`); }
    return response.json();
  },
  getMyRsvps: async (token) => {
    const response = await fetch(`${API_BASE_URL}/my-rsvps`, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `HTTP error! status: ${response.status}`); }
    return response.json();
  }
};

// Add mock equivalents for auth flows so the app can run without a backend
mockApi.loginUser = async (username, password) => {
  // naive mock auth: accept any non-empty user/pass, return first mock user with token
  if (!username || !password) throw new Error('Username and password are required');
  const baseUser = mockUsers[0] || { id: 'mock', username: 'mock', name: 'Mock User' };
  return { 
    token: 'mock-token',
    userId: baseUser.id,
    username: baseUser.username,
    name: baseUser.name,
    displayTag: baseUser.displayTag || 'Mock',
    premiumStatus: !!baseUser.premiumStatus,
    developerOverride: !!baseUser.developerOverride
  };
};

mockApi.registerUser = async (userData) => {
  const newUser = { id: String(Date.now()), role: 'user', ...userData };
  mockUsers.push(newUser);
  return { message: 'User registered successfully', userId: newUser.id };
};

const combinedApi = (() => {
  const useRealBackend = !!API_BASE_URL;
  const base = useRealBackend ? { ...mockApi, ...realApi } : { ...mockApi };
  // Choose events source based on env; mock by default for richer UI content
  base.getEvents = () => {
    const useRealEvents = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_USE_REAL_EVENTS) === 'true';
    return useRealEvents && useRealBackend ? realApi.getEvents() : Promise.resolve(mockEvents);
  };
  return base;
})();

export default combinedApi;
