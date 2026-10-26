import Link from "next/link";

export type InfoSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export default function InfoPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: InfoSection[];
}) {
  return (
    <main className="site-container info-page py-12 sm:py-20">
      <header className="info-hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
          {intro}
        </p>
      </header>

      <div className="info-sections">
        {sections.map((section, index) => (
          <section className="info-section" key={section.heading}>
            <span className="info-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul>
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="info-contact">
        <div>
          <p className="eyebrow">KEEP THE CONVERSATION GOING</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Have a question?
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Get in touch with the Amebo &apos;n Tech team.
          </p>
        </div>
        <Link className="button-primary" href="/contact">
          Contact us <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
