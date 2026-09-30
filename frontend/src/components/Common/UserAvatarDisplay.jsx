import React from 'react';
import { getAvatarInfo } from '../../services/avatars';

export function UserAvatarDisplay({
  avatarId,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  className = '',
}) {
  const avatar = getAvatarInfo(avatarId);

  const sizeClasses = {
    sm: 'w-7 h-7 text-sm rounded-lg',
    md: 'w-9 h-9 text-base rounded-xl',
    lg: 'w-12 h-12 text-2xl rounded-2xl',
    xl: 'w-20 h-20 text-4xl rounded-2xl',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  if (avatar.type === 'image' && avatar.imageSrc) {
    return (
      <img
        src={avatar.imageSrc}
        alt={avatar.name}
        className={`${currentSizeClass} object-cover border border-purple-500/40 shadow-md ${className}`}
      />
    );
  }

  return (
    <div
      className={`${currentSizeClass} bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-600 flex items-center justify-center border border-white/20 shadow-md select-none shrink-0 ${className}`}
    >
      <span>{avatar.icon || '🦊'}</span>
    </div>
  );
}
