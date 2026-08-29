import { Asset } from 'expo-asset';
import type { Candidate, CandidatePhoto, Match, ProfileContent } from '@/types/opendating';

type AssetModule = Parameters<typeof Asset.fromModule>[0];

const PHOTO_SOURCES = {
  alex: require('../../assets/demo/alex.png') as AssetModule,
  emma: require('../../assets/demo/emma.png') as AssetModule,
  marcus: require('../../assets/demo/marcus.png') as AssetModule,
  jordan: require('../../assets/demo/jordan.png') as AssetModule,
};

function photo(id: string, source: AssetModule, order = 0): CandidatePhoto {
  return {
    id,
    order,
    url: Asset.fromModule(source).uri,
  };
}

export function getScreenshotProfileContent(): ProfileContent {
  return {
    display_name: 'Alex',
    age: 28,
    gender: 'woman',
    bio: 'Coffee enthusiast, weekend hiker, and lover of bad puns. Looking for someone who laughs at my jokes.',
    interests: ['hiking', 'coffee', 'photography', 'cooking'],
    relationship_intent: 'long_term',
    prompts: [
      {
        question: 'Two truths and a lie',
        answer: 'I once climbed Kilimanjaro. I speak three languages. I hate chocolate.',
      },
    ],
    photos: [photo('alex-1', PHOTO_SOURCES.alex)],
    v: '0.1',
  };
}

export function getScreenshotCandidates(): Candidate[] {
  return [
    {
      pubkey: 'demo-candidate-1',
      candidate_grant: 'demo-grant-1',
      distance_bucket: 'nearby',
      profile: {
        display_name: 'Emma',
        age: 25,
        gender: 'woman',
        bio: 'Dog parent, yoga teacher, and always looking for the best brunch spots.',
        photos: [photo('emma-1', PHOTO_SOURCES.emma)],
        interests: ['yoga', 'dogs', 'brunch', 'travel'],
        relationship_intent: 'long_term',
        prompts: [
          {
            question: 'My simple pleasures',
            answer: 'Morning coffee, rainy Sundays, and fresh sourdough.',
          },
        ],
      },
    },
    {
      pubkey: 'demo-candidate-2',
      candidate_grant: 'demo-grant-2',
      distance_bucket: 'within 5 mi',
      profile: {
        display_name: 'Marcus',
        age: 31,
        gender: 'man',
        bio: 'Software engineer by day, rock climber by weekend. Looking for a partner in crime.',
        photos: [photo('marcus-1', PHOTO_SOURCES.marcus)],
        interests: ['climbing', 'music', 'road trips', 'tacos'],
        relationship_intent: 'long_term',
        prompts: [
          {
            question: "I'm weirdly good at...",
            answer: 'Parallel parking and remembering useless movie quotes.',
          },
        ],
      },
    },
    {
      pubkey: 'demo-candidate-3',
      candidate_grant: 'demo-grant-3',
      distance_bucket: 'nearby',
      profile: {
        display_name: 'Jordan',
        age: 27,
        gender: 'nonbinary',
        bio: 'Art curator, vinyl collector, coffee fan, and weekend gallery wanderer.',
        photos: [photo('jordan-1', PHOTO_SOURCES.jordan)],
        interests: ['art', 'vinyl', 'coffee', 'museums'],
        relationship_intent: 'figuring_out',
        prompts: [
          {
            question: 'A fun fact about me',
            answer: 'I once got lost in a museum for six hours and loved every minute.',
          },
        ],
      },
    },
  ];
}

export function getScreenshotMatches(): Match[] {
  const now = Math.floor(Date.now() / 1000);
  return getScreenshotCandidates().slice(0, 2).map((candidate, index) => ({
    match_id: `demo-match-${index + 1}`,
    pubkey: candidate.pubkey,
    created_at: now - (index + 1) * 3600,
    profile: candidate.profile,
    distance_bucket: candidate.distance_bucket,
  }));
}
