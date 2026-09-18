import Image from "next/image";

interface RunnerProps {
  className?: string;
}

export function Runner({ className = "" }: RunnerProps) {
  return (
    <div className={`relative isolate flex flex-col items-center ${className}`}>
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(ellipse,rgba(139,123,255,0.14),transparent_68%)]" aria-hidden="true" />
      <div className="motion-safe:bob relative z-10 w-36 sm:w-48 md:w-64 lg:w-80">
        <Image
          src="/hero-logo.png"
          alt="InteractiveWorkout monogram shaped like an athlete in motion"
          width={1254}
          height={1254}
          priority
          sizes="(min-width: 1024px) 320px, (min-width: 768px) 256px, (min-width: 640px) 192px, 144px"
          className="h-auto w-full drop-shadow-[0_0_40px_rgba(200,245,66,0.22)]"
        />
      </div>
      <div className="relative -mt-1 h-5 w-36 md:mt-2 md:h-8 md:w-48" aria-hidden="true">
        <div className="absolute inset-0 rounded-[100%] bg-lime/20 blur-md" />
        <div className="absolute inset-x-2 top-1/2 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent" />
      </div>
    </div>
  );
}
