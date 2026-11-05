import { useEffect, useState } from 'react'

/** Live result of a CSS media query. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** Below Tailwind's `md` breakpoint: phones, where the side rails don't fit. */
export const useIsCompact = () => useMediaQuery('(max-width: 767px)')

/** Primary input is a finger, so there is no hover and no right button. */
export const useIsTouch = () => useMediaQuery('(pointer: coarse)')
