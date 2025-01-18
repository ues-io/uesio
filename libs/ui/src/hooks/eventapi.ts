import { DependencyList, useEffect } from "react"

const useEvent = (
  eventName: string,
  callback: (event: CustomEvent) => void,
  deps: DependencyList = [],
) => {
  useEffect(() => {
    document.addEventListener(eventName, callback)
    return () => {
      document.removeEventListener(eventName, callback)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

const publish = (eventName: string, detail?: unknown) => {
  document.dispatchEvent(new CustomEvent(eventName, { detail }))
}

export { useEvent, publish }
