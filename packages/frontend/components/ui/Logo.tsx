import Image from 'next/image';

const DEFAULT_WIDTH = 180;
const DEFAULT_HEIGHT = 48;

export default function Logo() {
  return (
    <Image
      src="/CymaLogo.svg"
      alt="Logo CymaIngenieria"
      width={DEFAULT_WIDTH}
      height={DEFAULT_HEIGHT}
      priority
      style={{ height: 'auto', width: '100%', maxWidth: `${DEFAULT_WIDTH}px` }}
    />
  );
}
