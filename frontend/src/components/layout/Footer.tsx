import Link from "next/link";
import Image from "next/image";

export default function Footer({
  useImageBackground = false,
}: {
  useImageBackground?: boolean;
}) {
  return (
    <footer
      className={`border-t border-gold/30 relative overflow-hidden ${useImageBackground ? "" : "bg-charcoal"}`}
      style={
        useImageBackground
          ? {
              backgroundImage:
                "linear-gradient(rgba(28,28,28,0.55), rgba(28,28,28,0.8)), url(/images/recruitment/recruit-bg-4.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent pointer-events-none" />

      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(rgba(201,168,76,0.15) 1.5px, transparent 1.5px), radial-gradient(rgba(146,121,27,0.1) 1px, transparent 1px)",
          backgroundSize: "30px 30px, 60px 60px",
        }}
      />

      {/* Main columns */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-3 gap-x-4 gap-y-5 py-6 relative z-10 items-start sm:gap-x-8 sm:py-10 md:grid-cols-4 md:gap-12 md:py-14">
        {/* Logo */}
        <div className="col-span-3 flex flex-col items-center sm:items-start md:col-span-1">
          <Image
            src="/logo-crest.png"
            alt="Avyakta Logo"
            width={160}
            height={160}
            className="h-14 w-14 object-contain sm:h-24 sm:w-24 md:h-40 md:w-40"
          />
        </div>

        {/* About Us */}
        <div>
          <p className="font-heading text-gold text-sm tracking-[2px] uppercase mb-2 sm:text-lg sm:mb-4 md:text-xl md:tracking-[4px]">
            About Us
          </p>
          <div className="h-px bg-gold/20 mb-3 sm:mb-5" />
          <ul className="flex flex-col gap-2 list-none p-0 m-0 sm:gap-3">
            {[
              { label: "Mission", href: "/about#mission" },
              { label: "Vision", href: "/about#vision" },
              { label: "History", href: "/history" },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="font-body text-sm text-warm/60 sm:text-base hover:text-gold transition-colors duration-300 flex items-center gap-2 no-underline group"
                >
                  <span className="w-1 h-1 rounded-full bg-gold/30 group-hover:bg-gold transition-colors duration-300" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Explore */}
        <div>
          <p className="font-heading text-gold text-sm tracking-[2px] uppercase mb-2 sm:text-lg sm:mb-4 md:text-xl md:tracking-[4px]">
            Explore
          </p>
          <div className="h-px bg-gold/20 mb-3 sm:mb-5" />
          <ul className="flex flex-col gap-2 list-none p-0 m-0 sm:gap-3">
            {[
              { label: "Recruitment", href: "/recruitment" },
              { label: "Events", href: "/events" },
              { label: "Gallery", href: "/gallery" },
              { label: "Registrations", href: "/registrations" },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="font-body text-sm text-warm/60 sm:text-base hover:text-gold transition-colors duration-300 flex items-center gap-2 no-underline group"
                >
                  <span className="w-1 h-1 rounded-full bg-gold/30 group-hover:bg-gold transition-colors duration-300" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="font-heading text-gold text-sm tracking-[2px] uppercase mb-2 sm:text-lg sm:mb-4 md:text-xl md:tracking-[4px]">
            Contact
          </p>
          <div className="h-px bg-gold/20 mb-3 sm:mb-5" />
          <ul className="flex flex-col gap-2 list-none p-0 m-0 sm:gap-3">
            {[
              { label: "Instagram", href: "https://instagram.com/avyakta_ira" },
              { label: "Email Us", href: "mailto:avyakta@ecc.pes.edu" },
            ].map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm text-warm/60 sm:text-base hover:text-gold transition-colors duration-300 flex items-center gap-2 no-underline group"
                >
                  <span className="w-1 h-1 rounded-full bg-gold/30 group-hover:bg-gold transition-colors duration-300" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col items-center gap-1 py-4 text-center sm:px-6 sm:gap-2 sm:py-6 relative z-10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:text-left">
        <p className="font-body text-xs text-warm/40 tracking-wide sm:text-sm">
          {"© 2025 Avyakta · PESU EC · All rights reserved"}
        </p>
        <p className="font-accent italic text-xs text-gold/40 sm:text-sm tracking-wide">
          {"The Wholeness in Becoming"}
        </p>
      </div>
    </footer>
  );
}
