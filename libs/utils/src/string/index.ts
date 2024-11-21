export function encodeUTF16LE(text: string) {
  return Array.from(text)
    .map((char: string) => char.charCodeAt(0))
    .reduce((acc: string, code: number) => {
      // Get the two bytes for the UTF-16 character
      const lowByte = code & 0xff;
      const highByte = (code >> 8) & 0xff;

      // Append the bytes in little-endian order
      return acc + String.fromCharCode(lowByte, highByte);
    }, '');
}
