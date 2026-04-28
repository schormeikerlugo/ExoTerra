/**
 * Per-route document metadata. Relies on React 19's native support for
 * hoisting `<title>`, `<meta>` and `<link>` tags rendered anywhere in the
 * tree to <head> automatically.
 *
 * A baseline set of OG / twitter tags lives in index.html for the cold
 * load. This component overrides them when a specific route renders.
 */

interface Props {
  /** Final document title. We append " · ExoTerra" automatically unless `bare` is set. */
  title: string
  /** 1–2 sentence description for search results, link previews, etc. */
  description: string
  /** Skip the " · ExoTerra" suffix (used by the Landing page). */
  bare?: boolean
}

const SUFFIX = '· ExoTerra'

export function PageMeta({ title, description, bare }: Props) {
  const fullTitle = bare ? title : `${title} ${SUFFIX}`
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </>
  )
}
