import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Diva Factory | Kawaii Collectibles, Luxury Press‑On Nails & Boutique",
  description:
    "Meet Diva Factory — a Las Vegas boutique blending kawaii collectibles, salon‑quality press‑on nails, and curated accessories. Learn our story, curation process, craftsmanship, and sustainability.",
  keywords: [
    "Diva Factory",
    "kawaii collectibles",
    "blind boxes",
    "Y2K toys",
    "press-on nails",
    "luxury nails",
    "boutique accessories",
    "Las Vegas boutique",
    "nail art",
    "curated shop",
  ],
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Diva Factory | Collectibles • Nails • Boutique",
    description: "Las Vegas home for kawaii collectibles, luxury press‑on nails, and curated boutique treasures.",
    url: "/about",
    siteName: "Diva Factory",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Diva Factory | Collectibles • Nails • Boutique",
    description: "Las Vegas home for kawaii collectibles, luxury press‑on nails, and curated boutique treasures.",
  },
};

export default function About() {
  // ====== Schema ======
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Diva Factory",
    url: "https://divafactorynails.com",
    logo: "https://divafactorynails.com/CODEWRX2.png",
    sameAs: ["https://www.instagram.com/", "https://www.tiktok.com/", "https://www.facebook.com/"],
    address: { "@type": "PostalAddress", addressLocality: "Las Vegas", addressRegion: "NV", addressCountry: "US" },
    areaServed: ["United States"],
    brand: { "@type": "Brand", name: "Diva Factory", slogan: "Pastel Y2K for everyday icons" },
  } as const;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://divafactorynails.com" },
      { "@type": "ListItem", position: 2, name: "About", item: "https://divafactorynails.com/about" },
    ],
  } as const;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What types of products do you carry?", acceptedAnswer: { "@type": "Answer", text: "We blend three pillars: kawaii collectibles (including blind boxes), salon‑quality press‑on nails, and curated boutique accessories." } },
      { "@type": "Question", name: "What makes your press‑on nails special?", acceptedAnswer: { "@type": "Answer", text: "Hand‑finished with salon‑grade gel on premium ABS bases, inclusive sizing, and detailed application & care guides for long wear." } },
      { "@type": "Question", name: "How do you curate collectibles & accessories?", acceptedAnswer: { "@type": "Answer", text: "We source authentic releases from trusted partners and select pieces that match our pastel Y2K aesthetic and community requests." } },
      { "@type": "Question", name: "Where do you ship from?", acceptedAnswer: { "@type": "Answer", text: "We ship from Las Vegas, NV. Processing time is listed on each product page; shipping times depend on the carrier." } },
    ],
  } as const;

  return (
    <main className="min-h-screen relative overflow-x-hidden text-gray-200">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ====== HERO ====== */}
      <section className="relative py-24">
        {/* background sparkles */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="animate-pulse-sparkle absolute top-24 left-1/4 w-8 h-8 bg-[url('/star.svg')] bg-no-repeat bg-center opacity-60" />
          <div className="animate-pulse-sparkle absolute top-1/2 left-2/3 w-6 h-6 bg-[url('/star.svg')] bg-no-repeat bg-center opacity-40" />
          <div className="animate-pulse-sparkle absolute bottom-20 right-1/4 w-10 h-10 bg-[url('/star.svg')] bg-no-repeat bg-center opacity-50" />
        </div>
        <div className="container mx-auto px-6 text-center">
          <nav className="mb-6 text-sm text-fuchsia-700" aria-label="Breadcrumb">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">→</span>
            <span className="text-fuchsia-900/70">About</span>
          </nav>

          <h1 className="font-shuneva text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-fuchsia-500 to-blue-400 drop-shadow-[0_2px_12px_rgba(255,0,180,0.2)]">
            Diva Factory
          </h1>
          <p className="font-shuneva max-w-3xl mx-auto mt-4 text-lg text-fuchsia-700">
            Your pastel Y2K destination for <strong>kawaii collectibles</strong>, <strong>luxury press‑on nails</strong>, and <strong>curated boutique treasures</strong>—made for everyday icons in Las Vegas and beyond.
          </p>

          {/* quick value props */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {t:'Collectibles Curation', d:'Authentic blind boxes & kawaii finds'},
              {t:'Nail Artistry', d:'Salon‑grade gel, reusable wear'},
              {t:'Boutique Experience', d:'Thoughtful packaging & helpful support'},
            ].map((c)=> (
              <div key={c.t} className="rounded-2xl border border-pink-200/60 bg-gradient-to-br from-pink-900/10 to-purple-900/10 p-5 shadow-xl">
                <h3 className="font-shuneva font-bold text-pink-200">{c.t}</h3>
                <p className="font-shuneva text-gray-200 text-sm mt-1">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== OUR STORY (short + image placeholder) ====== */}
      <section className="container mx-auto px-6 py-16 grid lg:grid-cols-2 gap-10 items-center" aria-labelledby="our-story">
        <div>
          <h2 id="our-story" className="font-shuneva text-5xl md:text-4xl font-bold text-fuchsia-600 drop-shadow-sm mb-4">Our Story</h2>
          <p className="font-shuneva text-gray-200 mb-4 text-4xl">Founded in <strong>2025</strong> in Las Vegas, Diva Factory started as a love letter to pastel Y2K culture. What began with custom nail sets quickly expanded into a <strong>curated boutique</strong> of <strong>collectibles</strong>, <strong>press‑on nails</strong>, and <strong>accessories</strong>—all chosen to spark joy and self‑expression.</p>
          <p className="font-shuneva text-gray-200 text-4xl">We keep our promise simple: cute, quality, and kind. Clear product details, inclusive sizing, authentic releases, and a community‑first vibe.</p>
          <div className="mt-6 text-sm text-fuchsia-800">
            <Link href="/shop" className="underline hover:text-fuchsia-600 mr-4">Shop All</Link>
            <Link href="/collections/collectibles" className="underline hover:text-fuchsia-600 mr-4">Collectibles</Link>
            <Link href="/collections/nails" className="underline hover:text-fuchsia-600 mr-4">Press‑On Nails</Link>
            <Link href="/collections/boutique" className="underline hover:text-fuchsia-600">Boutique</Link>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-pink-200 bg-gradient-to-br from-pink-900/10 to-blue-900/10 p-6 shadow-xl text-center">
          <div className="h-48 md:h-64 rounded-xl bg-gradient-to-br from-pink-100 via-fuchsia-100 to-blue-100 flex items-center justify-center">
            <img
              src="/uploads/divanailslogo.svg"
              alt="Diva Factory brand logo"
              className="max-h mx-auto"
            />
          </div>
          <p className="font-shuneva text-xs text-gray-200 mt-3">Tip: feature a mix of nails + collectibles in one hero shot for instant brand clarity.</p>
        </div>
      </section>

      {/* ====== HOW WE CURATE & CRAFT ====== */}
      <section className="bg-gradient-to-r from-pink-150 to-blue-150 py-16" aria-labelledby="how-it-works">
        <div className="container mx-auto px-6">
          <h2 id="how-it-works" className="font-shuneva text-3xl md:text-4xl font-bold text-fuchsia-600 mb-8">How We Curate & Craft</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[{n:'1',t:'Discover',d:'We scout the cutest drops and authentic releases that fit our pastel Y2K vibe.'},{n:'2',t:'Design & Finish',d:'Hand‑finish nail sets with salon‑grade gel; select accessories with quality in mind.'},{n:'3',t:'Pack & Ship',d:'Boutique‑style packaging, quick processing, and responsive support.'}].map(step => (
              <div key={step.n} className="rounded-xl bg-gradient-to-br from-pink-900/10 to-purple-900/10 border border-white/60 p-6 shadow">
                <div className="font-shuneva text-3xl font-bold text-pink-500">{step.n}</div>
                <h3 className="font-shuneva text-xl font-bold mt-2">{step.t}</h3>
                <p className="font-shuneva text-gray-200 mt-1 text-sm">{step.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-sm flex flex-wrap gap-4">
            <Link href="/nail-guide" className="underline text-fuchsia-700 hover:text-fuchsia-600">Nail application & care guide</Link>
            <Link href="/blog" className="underline text-fuchsia-700 hover:text-fuchsia-600">Collectible unboxings & style tips</Link>
          </div>
        </div>
      </section>

      {/* ====== PILLARS (split) ====== */}
      <section className="container mx-auto px-6 py-16 grid lg:grid-cols-3 gap-10" aria-labelledby="pillars">
        <h2 id="pillars" className="sr-only">Our Three Pillars</h2>
        <div className="bg-gradient-to-br from-pink-900/10 to-purple-900/10 rounded-2xl p-6 border border-pink-200 shadow-xl">
          <h3 className="font-shuneva text-2xl font-bold text-pink-500 mb-2">Collectibles</h3>
          <p className="font-shuneva text-gray-200">From blind boxes to plushies and desk buddies, we curate authentic, on‑theme releases that are actually in stock—no fakes, no fluff.</p>
          <Link href="/collections/collectibles" className="underline text-pink-600 mt-2 inline-block">Shop Collectibles</Link>
        </div>
        <div className="bg-gradient-to-br from-pink-900/10 to-purple-900/10 rounded-2xl p-6 border border-pink-200 shadow-xl">
          <h3 className="font-shuneva text-2xl font-bold text-fuchsia-500 mb-2">Nails</h3>
          <p className="font-shuneva text-gray-200">Premium ABS bases, salon‑grade gel finishes, inclusive sizing, and reusable wear. Cute without the salon time.</p>
          <Link href="/collections/nails" className="underline text-fuchsia-600 mt-2 inline-block">Shop Nails</Link>
        </div>
        <div className="bg-gradient-to-br from-pink-900/10 to-purple-900/10 rounded-2xl p-6 border border-pink-200 shadow-xl">
          <h3 className="font-shuneva text-2xl font-bold text-blue-500 mb-2">Boutique</h3>
          <p className="font-shuneva text-gray-200">Curated accessories and gifts that complete the look—packed with care and ready to delight.</p>
          <Link href="/collections/boutique" className="underline text-blue-600 mt-2 inline-block">Shop Boutique</Link>
        </div>
      </section>

      {/* ====== SOCIAL PROOF ====== */}
      <section className="py-16 text-center" aria-labelledby="loved-by-divas">
        <h2 id="loved-by-divas" className="font-shuneva text-4xl font-bold text-fuchsia-600 drop-shadow-sm">
          <span aria-hidden="true" className="mr-2">💖</span> Loved by Divas
        </h2>
        <p className="font-shuneva text-pink-700 mt-2">Real reviews from our community.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-8">
          {["Obsessed with my press‑ons AND the kawaii plushies! Everything is so cute!","Best place for Y2K vibes! My nails, room decor, and toy collection are all from here!","Quality is amazing! My nails last weeks and the toys are collector‑worthy. 100% recommend!"].map((q, i) => (
            <figure key={i} className="bg-gradient-to-br from-pink-900/10 to-purple-900/10 p-6 rounded-xl shadow-xl w-80 border-2 border-pink-200 hover:shadow-2xl transition transform hover:-translate-y-2">
              <blockquote className="font-shuneva text-fuchsia-700">“{q}”</blockquote>
              <figcaption className="font-shuneva text-sm font-bold mt-3 text-pink-500">— Customer</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ====== FAQ (collapsible) ====== */}
      <section className="container mx-auto px-6 pb-12" aria-labelledby="about-faqs">
        <h2 id="about-faqs" className="font-shuneva text-3xl md:text-4xl font-bold text-fuchsia-600 drop-shadow-sm mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            {q:'What products do you carry?', a:'Three pillars: kawaii collectibles (blind boxes, plushies, figures), salon‑quality press‑on nails, and curated boutique accessories.'},
            {q:'How do you ensure authenticity for collectibles?', a:'We work with trusted partners and verify releases—no bootlegs, ever.'},
            {q:'Where do you ship from?', a:'Las Vegas, NV. Processing time is separate from carrier transit time.'},
            {q:'Are your nails reusable?', a:'Yes—remove gently, clean off adhesive, and store them in their case for next time.'},
          ].map((item) => (
            <details key={item.q} className="bg-gradient-to-br from-pink-900/10 to-purple-900/10 p-5 rounded-xl border border-white/40">
              <summary className="font-shuneva font-semibold cursor-pointer list-none flex items-center justify-between">
                <span>{item.q}</span>
                <span className="text-pink-500 text-xl">+</span>
              </summary>
              <div className="mt-3 font-shuneva text-gray-200">{item.a.includes('size & care guide') ? (<>
                Yes—check our <Link href="/nail-guide" className="underline">size & care guide</Link> for measuring at home and choosing shapes/lengths.
              </>) : item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 py-14 text-center">
        <div className="container mx-auto px-6">
          <h2 className="font-shuneva text-4xl font-bold text-white drop-shadow-sm mb-3">Ready to explore something cute?</h2>
          <p className="font-shuneva text-white/90 max-w-2xl mx-auto">Discover authentic collectibles, salon‑quality press‑on nails, and boutique accessories—curated for your Y2K heart.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link href="/collections/collectibles" className="font-shuneva px-8 py-3 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-blue-400 text-white font-semibold rounded-full shadow-lg hover:saturate-125 transition duration-300 transform hover:-translate-y-1">Shop Collectibles</Link>
            <Link href="/collections/nails" className="font-shuneva px-8 py-3 bg-gradient-to-r from-fuchsia-500 to-blue-500 text-white font-semibold rounded-full shadow-lg hover:saturate-125 transition duration-300 transform hover:-translate-y-1">Shop Nails</Link>
            <Link href="/collections/boutique" className="font-shuneva px-8 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold rounded-full shadow-lg hover:saturate-125 transition duration-300 transform hover:-translate-y-1">Shop Boutique</Link>
          </div>
          <div className="mt-6 text-sm text-fuchsia-100">
            <Link href="/faq" className="underline hover:text-white mr-4">FAQ</Link>
            <Link href="/faq/shipping-info" className="underline hover:text-white mr-4">Shipping Info</Link>
            <Link href="/nail-guide" className="underline hover:text-white">Nail Guide</Link>
          </div>
        </div>
      </section>
    </main>
  );
}