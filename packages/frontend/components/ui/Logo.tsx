import Image from 'next/image';

export default function Logo() {
  return (
    <Image 
      src="/CymaLogo.svg" 
      alt="Logo CymaIngenieria" 
      width={0} 
      height={0} 
      className="w-full h-full" 
      priority
    />
  );
}