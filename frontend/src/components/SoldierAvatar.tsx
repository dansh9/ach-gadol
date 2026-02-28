import Image from "next/image";

export default function SoldierAvatar({
  className = "h-8 w-8",
  size = 64,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/logo-full.jpg"
      alt="אח גדול"
      width={size}
      height={size}
      className={`object-cover ${className}`}
      priority
    />
  );
}
