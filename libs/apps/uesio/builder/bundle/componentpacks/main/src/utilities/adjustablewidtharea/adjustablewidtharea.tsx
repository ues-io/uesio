import { definition, styles } from "@uesio/ui"
import { useEffect, useRef, useState } from "react"
import throttle from "lodash/throttle"

const usePanels = (
  element: HTMLDivElement | null,
): [(arg: boolean) => void, number] => {
  const [width, setWidth] = useState(300)
  const [dragging, setDragging] = useState(false)
  const panelPosition = element?.getBoundingClientRect().left

  useEffect(() => {
    if (!dragging) return

    // woah not soo fast
    const throttledMouseHandler = throttle((e) => {
      if (!dragging) return

      const mouseX = e.clientX

      if (!panelPosition || !mouseX) return

      const change = panelPosition - mouseX
      const x = width + change
      const min = 250
      const max = 600

      if (x < min) {
        setWidth(min)
        return
      }
      if (x > max) {
        setWidth(max)
        return
      }

      setWidth(x)
    }, 50)

    document.addEventListener("mousemove", throttledMouseHandler)
    document.addEventListener("mouseup", () => setDragging(false))

    return () => {
      document.removeEventListener("mousemove", throttledMouseHandler)
      document.removeEventListener("mouseup", () => setDragging(false))
    }
    // NOTE: We do NOT want to add throttledMouseHandler to this deps list,
    // like eslint is suggesting -- that creates a very bad experience
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging])

  return [setDragging, width]
}

const separatorStyles = [
  "flex",
  "items-center",
  "cursor-ew-resize",
  "absolute",
  "inset-0",
  "h-full",
  "group",
  "z-10",
  "w-2",
]

const grabberStyles = [
  "bg-[rgb(255,94,47)]",
  "w-1",
  "h-12",
  "rounded",
  "-translate-x-1/2",
  "opacity-50",
  "cursor-ew-resize",
  "transition-all",
  "absolute",
  "group-hover:opacity-100",
]

const AdjustableWidthArea: definition.UtilityComponent = (props) => {
  const slideRef = useRef<HTMLDivElement>(null)
  const [setDragging, width] = usePanels(slideRef.current)

  const classes = styles.useUtilityStyleTokens(
    {
      root: [`w-[${width + "px"}]`, "relative"],
      separator: separatorStyles,
      grabber: grabberStyles,
    },
    props,
  )

  return (
    <div ref={slideRef} className={classes.root}>
      <div
        role="seperator"
        aria-valuenow={0}
        onMouseDown={() => setDragging(true)}
        className={classes.separator}
      >
        <span className={classes.grabber} />
      </div>
      {props.children}
    </div>
  )
}

export default AdjustableWidthArea
