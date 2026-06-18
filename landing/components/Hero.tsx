import Image from "next/image";

export function Hero() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const withBase = (href: string) => {
    if (!href.startsWith("/")) return href;
    const [pathPart, hashPart] = href.split("#");
    const hash = hashPart ? `#${hashPart}` : "";
    if (pathPart === "/") return `${basePath}/index.html${hash}`;
    const normalized = pathPart.endsWith(".html") ? pathPart : `${pathPart}.html`;
    return `${basePath}${normalized}${hash}`;
  };
  return (
    <section className="hero">
      <div className="container">
        <h1 className="hero-title">
          Real-Time Interview Coaching <span className="hero-highlight">That Gets You Hired</span>
        </h1>
        <p className="hero-subtitle">
          GoalsGuild Coach gives live interview suggestions, post-call summaries, and career optimization tools so you can perform better in every hiring round.
        </p>
        <p className="hero-subtitle">
          Requires an LLM backend: either configure a provider API key (OpenAI, Anthropic, Gemini, Groq, OpenRouter) or run an Ollama model locally.
        </p>
        <div className="hero-cta">
          <a href={withBase("/checkout")} className="btn btn-primary">Buy Lifetime Access</a>
          <a href={withBase("/trial")} className="btn btn-secondary">Start 7-Day Trial</a>
        </div>
        <div className="hero-image-wrapper">
          <Image 
            src={`${basePath}/og-image.png`}
            alt="GoalsGuild Coach Preview" 
            width={1200} 
            height={630} 
            className="hero-image"
            priority
          />
        </div>
      </div>
    </section>
  );
}
