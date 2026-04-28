import { useLocation } from 'react-router-dom'
import { StateScreen } from '../components/HUD/StateScreen'
import { PageMeta } from '../components/seo/PageMeta'

export function NotFoundPage() {
  const location = useLocation()
  return (
    <>
      <PageMeta
        title="Lost contact (404)"
        description="The route you requested isn't on the archive's map."
      />
      <StateScreen
        variant="not-found"
        code="ERR_404"
        title="Lost contact."
        message="The route you requested isn't on the archive's map. Either the path drifted, the link is older than the schema, or this signal never existed."
        detail={`requested · ${location.pathname}${location.search}`}
        primaryAction={{ label: 'Return to base', to: '/' }}
        secondaryAction={{ label: 'Browse catalog', to: '/catalog' }}
      />
    </>
  )
}
