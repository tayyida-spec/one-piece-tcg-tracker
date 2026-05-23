import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Image
        src="/logo.png"
        alt="Three Hats logo"
        width={80}
        height={80}
        className="mb-6 rounded-xl shadow-lg shadow-brand/20 ring-2 ring-brand/40"
        priority
      />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
