export const getChildAvatar = (name: string): string => {
  if (!name) return '?';
  const chars = Array.from(name);
  return chars[0].toUpperCase();
};

export const getChildName = (name: string): string => {
  if (!name) return '';
  const chars = Array.from(name);
  const firstChar = chars[0];
  if (firstChar && !/[a-zA-ZÀ-ÿ0-9]/.test(firstChar)) {
    return chars.slice(1).join('').trim();
  }
  return name.trim();
};

export const getChildFirstName = (name: string): string => {
  const cleanName = getChildName(name);
  return cleanName.split(' ')[0] || '';
};
