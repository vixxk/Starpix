// High-resolution posters hosted on S3 matching the reference layout exactly
export const POSTERS = {
  durgaPuja: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/f30784b5-3698-40f5-9f55-4eae4622fcd4.jpg',
  goodMorning: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/ccead801-2abb-4d74-8f50-7bee9c53fa7a.jpg',
  goodNight: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/eb57459c-c20d-4bbb-8fee-5f5464efb57d.jpg',
  togetherAlways: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/d81f4913-f71e-433f-b803-c3f27777967c.jpg',
  happyDiwali: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/6adc6e37-9b98-4470-9a27-e2915e73b4e3.jpg',
};

export const DEFAULT_PLANS = [
  {
    id: '7days',
    name: '7 Days Access',
    price: 29,
    durationDays: 7,
    periodKey: 'sub_plan_7_days',
    ctaKey: 'sub_cta_7_days',
    badgeText: '',
    badgeType: '',
    badgeKey: '',
    features: [
      'sub_feat_all_premium',
      'sub_feat_daily_new',
      'sub_feat_no_ads',
    ],
  },
  {
    id: '30days',
    name: '30 Days Access',
    price: 119,
    durationDays: 30,
    periodKey: 'sub_plan_30_days',
    ctaKey: 'sub_cta_30_days',
    badgeText: 'MOST POPULAR',
    badgeType: 'popular',
    badgeKey: 'sub_most_popular',
    features: [
      'sub_feat_all_premium',
      'sub_feat_daily_new',
      'sub_feat_full_access_30',
      'sub_feat_no_ads',
    ],
  },
  {
    id: '1year',
    name: '1 Year Access',
    price: 599,
    durationDays: 365,
    periodKey: 'sub_plan_1_year',
    ctaKey: 'sub_cta_1_year',
    badgeText: 'BEST VALUE',
    badgeType: 'best_value',
    badgeKey: 'sub_best_value',
    features: [
      'sub_feat_all_premium',
      'sub_feat_daily_new',
      'sub_feat_full_access_year',
      'sub_feat_no_ads',
      'sub_feat_exclusive_festivals',
    ],
  },
];

export const DEFAULT_CHECKLIST = [
  { id: 'templates', text: 'Thousands of Premium Templates', textKey: 'sub_feat_thousands', iconType: 'p_box' },
  { id: 'morning_night', text: 'Good Morning & Good Night Special', textKey: 'sub_feat_morning_night', iconType: 'sun' },
  { id: 'festival_devotional', text: 'Festival & Devotional Special', textKey: 'sub_feat_festival_devotional', iconType: 'flower' },
  { id: 'trending_viral', text: 'Trending & Viral Designs', textKey: 'sub_feat_trending_viral', iconType: 'trending' },
  { id: 'personalization', text: 'Name & Photo Personalization', textKey: 'sub_feat_name_photo', iconType: 'person' },
  { id: 'download_share', text: 'HD Download & Fast Share', textKey: 'sub_feat_download_share', iconType: 'download' },
  { id: 'new_content', text: 'Daily New Content Added', textKey: 'sub_feat_new_content', iconType: 'sparkles' },
];

