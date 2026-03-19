import Link from "next/link"

export default function NotFound() {
  return (
    <section className="not-found-card">
      <p className="eyebrow">404</p>
      <h1>That page is not on the desk right now.</h1>
      <p>
        The link may have changed, or the post might not be published yet.
      </p>
      <div className="hero__actions">
        <Link className="button-link" href="/">
          Return home
        </Link>
        <Link className="button-muted" href="/archive">
          Visit archive
        </Link>
      </div>
    </section>
  )
}
