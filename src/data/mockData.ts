import { Category, Service } from '../types';

export const categories: Category[] = [
  {
    id: '1',
    name: 'Photography',
    slug: 'photography',
    icon: 'Camera',
    description: 'Capture your most precious moments with professional photographers.',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80'
  },
  {
    id: '2',
    name: 'Videography',
    slug: 'videography',
    icon: 'Video',
    description: 'Cinematic storytelling for your special events.',
    image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80'
  },
  {
    id: '3',
    name: 'Event Decoration',
    slug: 'decoration',
    icon: 'Palette',
    description: 'Transform any space into a magical setting.',
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80'
  },
  {
    id: '4',
    name: 'Catering',
    slug: 'catering',
    icon: 'Utensils',
    description: 'Exquisite culinary experiences for your guests.',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80'
  },
  {
    id: '5',
    name: 'DJ and Music',
    slug: 'music',
    icon: 'Music',
    description: 'Set the perfect mood with professional DJs and live bands.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80'
  },
  {
    id: '6',
    name: 'Corporate Events',
    slug: 'corporate',
    icon: 'Briefcase',
    description: 'Professional event planning for your business needs.',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80'
  },
  {
    id: '7',
    name: 'Workshops',
    slug: 'workshops',
    icon: 'BookOpen',
    description: 'Educational and interactive learning experiences.',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80'
  }
];

export const services: Service[] = [
  {
    _id: 's1',
    category: 'photography',
    title: 'Premium Wedding Photography',
    description: 'Full-day coverage of your special day with two professional photographers.',
    date: '2024-06-15',
    location: 'Mumbai',
    price: 1500,
    totalSeats: 100,
    availableSeats: 45,
    rating: 4.9,
    images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80'
    ],
    createdBy: 'u1',
    badge: 'Trending'
  },
  {
    _id: 's2',
    category: 'catering',
    title: 'Luxury Buffet Experience',
    description: 'A wide variety of international cuisines served with elegance.',
    date: '2024-07-20',
    location: 'Delhi',
    price: 50,
    totalSeats: 200,
    availableSeats: 120,
    rating: 4.7,
    images: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80'
    ],
    createdBy: 'u2',
    badge: 'New'
  },
  {
    _id: 's3',
    category: 'music',
    title: 'Live Jazz Night',
    description: 'An evening of smooth jazz with world-class musicians.',
    date: '2024-08-05',
    location: 'Bangalore',
    price: 75,
    totalSeats: 150,
    availableSeats: 20,
    rating: 4.8,
    images: [
      'https://images.unsplash.com/photo-1514525253361-bee8718a340b?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1415201374777-01918182752f?auto=format&fit=crop&q=80'
    ],
    createdBy: 'u3',
    badge: 'Limited Seats'
  },
  {
    _id: 's4',
    category: 'decoration',
    title: 'Royal Palace Decor',
    description: 'Exquisite floral and lighting arrangements for a grand celebration.',
    date: '2024-09-12',
    location: 'Jaipur',
    price: 2500,
    totalSeats: 50,
    availableSeats: 15,
    rating: 4.9,
    images: [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80'
    ],
    createdBy: 'u1'
  },
  {
    _id: 's5',
    category: 'videography',
    title: 'Cinematic Event Film',
    description: 'Professional 4K videography with high-end editing and drone shots.',
    date: '2024-10-22',
    location: 'Goa',
    price: 1200,
    totalSeats: 80,
    availableSeats: 60,
    rating: 4.6,
    images: [
      'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80'
    ],
    createdBy: 'u2'
  },
  {
    _id: 's6',
    category: 'corporate',
    title: 'Tech Summit 2024',
    description: 'A gathering of industry leaders and innovators in the tech world.',
    date: '2024-11-15',
    location: 'Hyderabad',
    price: 200,
    totalSeats: 500,
    availableSeats: 350,
    rating: 4.5,
    images: [
      'https://images.unsplash.com/photo-1505373630103-f21ee09d9a98?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540575861501-7ad05823c95b?auto=format&fit=crop&q=80'
    ],
    createdBy: 'u3',
    badge: 'Trending'
  },
  {
    _id: 's7',
    category: 'workshops',
    title: 'Digital Marketing Workshop',
    description: 'Learn the latest trends and strategies in digital marketing from experts.',
    date: '2024-12-01',
    location: 'Pune',
    price: 100,
    totalSeats: 50,
    availableSeats: 10,
    rating: 4.7,
    images: [
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80'
    ],
    createdBy: 'u1',
    badge: 'Limited Seats'
  },
  {
    _id: 's8',
    category: 'music',
    title: 'Electronic Dance Festival',
    description: 'A night of high-energy electronic music with top DJs.',
    date: '2025-01-10',
    location: 'Goa',
    price: 150,
    totalSeats: 1000,
    availableSeats: 800,
    rating: 4.4,
    images: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80'
    ],
    createdBy: 'u2',
    badge: 'Trending'
  },
  {
    _id: 's9',
    category: 'photography',
    title: 'Fashion Portfolio Shoot',
    description: 'Professional fashion photography session with high-end equipment.',
    date: '2025-02-14',
    location: 'Mumbai',
    price: 800,
    totalSeats: 20,
    availableSeats: 5,
    rating: 4.9,
    images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80'
    ],
    createdBy: 'u3',
    badge: 'New'
  },
  {
    _id: 's10',
    category: 'catering',
    title: 'Traditional Indian Feast',
    description: 'Authentic Indian cuisine served in a traditional setting.',
    date: '2025-03-20',
    location: 'Chennai',
    price: 40,
    totalSeats: 300,
    availableSeats: 250,
    rating: 4.6,
    images: [
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1601050633647-81a35d377a6a?auto=format&fit=crop&q=80'
    ],
    createdBy: 'u1'
  },
  {
    _id: 's11',
    category: 'decoration',
    title: 'Modern Minimalist Decor',
    description: 'Clean and elegant decoration for modern events.',
    date: '2025-04-15',
    location: 'Bangalore',
    price: 1500,
    totalSeats: 100,
    availableSeats: 80,
    rating: 4.5,
    images: [
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80'
    ],
    createdBy: 'u2'
  },
  {
    _id: 's12',
    category: 'videography',
    title: 'Corporate Brand Film',
    description: 'High-quality videography for corporate branding and marketing.',
    date: '2025-05-10',
    location: 'Delhi',
    price: 2000,
    totalSeats: 30,
    availableSeats: 25,
    rating: 4.8,
    images: [
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518135714426-c18f566A4839?auto=format&fit=crop&q=80'
    ],
    createdBy: 'u3'
  }
];
