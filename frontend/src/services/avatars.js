// Catalog of all avatars in FitAI
export const DEFAULT_AVATARS = [
  {
    id: 'emoji_fox',
    name: 'Хитрый Лис',
    type: 'emoji',
    icon: '🦊',
    price: 0,
    isFree: true,
    description: 'Базовый аватар скорости и реакции',
  },
  {
    id: 'emoji_robot',
    name: 'Кибер Бот',
    type: 'emoji',
    icon: '🤖',
    price: 0,
    isFree: true,
    description: 'Базовый аватар ИИ-техники и точности',
  },
  {
    id: 'emoji_lion',
    name: 'Мощный Лев',
    type: 'emoji',
    icon: '🦁',
    price: 0,
    isFree: true,
    description: 'Базовый аватар силы и выносливости',
  },
];

export const SHOP_AVATARS = [
  {
    id: 'avatar_icon1',
    name: 'Неоновый Атлет',
    type: 'image',
    imageSrc: '/icons/icon1.jpeg',
    price: 100,
    isFree: false,
    description: 'Эксклюзивный неоновый арт чемпиона',
  },
  {
    id: 'avatar_icon2',
    name: 'Кибер Самурай',
    type: 'image',
    imageSrc: '/icons/icon2.jpeg',
    price: 200,
    isFree: false,
    description: 'Футуристический воин скорости и техники',
  },
  {
    id: 'avatar_icon3',
    name: 'Титан Силы',
    type: 'image',
    imageSrc: '/icons/icon3.jpeg',
    price: 300,
    isFree: false,
    description: 'Премиальный аватар элитного атлета',
  },
];

export const ALL_AVATARS = [...DEFAULT_AVATARS, ...SHOP_AVATARS];

export function getAvatarInfo(avatarId) {
  if (!avatarId) return DEFAULT_AVATARS[0];
  const found = ALL_AVATARS.find((a) => a.id === avatarId);
  if (found) return found;

  // Fallbacks for any legacy avatar IDs
  if (avatarId === 'avatar_cyberpunk') return SHOP_AVATARS[0];
  if (avatarId === 'avatar_ninja') return SHOP_AVATARS[1];
  if (avatarId === 'avatar_gold') return SHOP_AVATARS[2];

  return DEFAULT_AVATARS[0];
}
