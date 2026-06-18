export function Footer() {
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
    <footer className="footer">
      <div className="container footer-row">
        <div className="footer-brand">
          <img src={`${basePath}/goalsguild-logo.png`} alt="GoalsGuild Coach logo" className="footer-logo" />
          <span>© {new Date().getFullYear()} GoalsGuild Coach</span>
        </div>
        <div className="footer-links">
          <a href={withBase("/features")}>Features</a>
          <a href={withBase("/tutorial")}>Tutorial</a>
          <a href={withBase("/faq")}>FAQ</a>
          <a href={withBase("/setup-mac")}>Mac Setup</a>
          <a href={withBase("/setup-windows")}>Windows Setup</a>
          <a href={withBase("/terms")}>Terms</a>
          <a href={withBase("/privacy")}>Privacy</a>
          <a href={withBase("/download")}>Download</a>
        </div>
      </div>
    </footer>
  );
}
