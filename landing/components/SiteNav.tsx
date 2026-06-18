type SiteNavProps = {
  ctaHref?: string;
  ctaLabel?: string;
};

export function SiteNav({ ctaHref = "/trial", ctaLabel = "Start Trial" }: SiteNavProps) {
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
    <nav className="navbar">
      <div className="container navbar-inner">
        <a href={withBase("/")} className="brand">
          <img src={`${basePath}/goalsguild-logo.png`} alt="GoalsGuild Coach logo" className="brand-logo" />
          <span>GoalsGuild Coach</span>
        </a>
        <div className="nav-menu">
          <a href={withBase("/features")}>Features</a>
          <a href={withBase("/tutorial")}>Tutorial</a>
          <a href={withBase("/#pricing")}>Pricing</a>
          <a href={withBase("/faq")}>FAQ</a>
          <a href={withBase(ctaHref)} className="btn btn-primary">{ctaLabel}</a>
        </div>
      </div>
    </nav>
  );
}
