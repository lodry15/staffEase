const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SPECIAL = '!@#$%^&*';

export function generateTemporaryPassword(length: number = 12): string {
  const allChars = UPPERCASE + LOWERCASE + NUMBERS + SPECIAL;
  
  // Ensure at least one character from each category
  let password = 
    UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)] +
    LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)] +
    NUMBERS[Math.floor(Math.random() * NUMBERS.length)] +
    SPECIAL[Math.floor(Math.random() * SPECIAL.length)];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}