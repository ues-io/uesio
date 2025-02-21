import { definition, styles } from "@uesio/ui"
import { RefObject, useEffect, useRef, useState, useCallback } from "react"

type DraggableProps = {
  handleRef: RefObject<HTMLDivElement>
}

const StyleDefaults = Object.freeze({
  wrapper: ["absolute", "select-none", "z-30"],
})

const BuildBarDraggable: definition.UtilityComponent<DraggableProps> = (
  props,
) => {
  const { children, handleRef } = props

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({
    startX: 0,
    startY: 0,
  })

  const rootRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: MouseEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
    }
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()
      const newX = e.clientX - dragRef.current.startX
      const newY = e.clientY - dragRef.current.startY

      // Add boundary constraints
      const bounding = rootRef.current?.getBoundingClientRect()
      if (!bounding) return
      const maxX = window.innerWidth - bounding.width
      const maxY = window.innerHeight - bounding.height

      setPosition({
        x: Math.max(0, Math.min(position.x - newX, maxX)),
        y: Math.max(0, Math.min(position.y - newY, maxY)),
      })
    },
    // We actually don't want the updated values for position.x and position.y here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDragging],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    const handle = handleRef.current
    if (!handle) return

    handle.addEventListener("mousedown", handleMouseDown)

    return () => {
      handle.removeEventListener("mousedown", handleMouseDown)
    }
  }, [handleRef, handleMouseDown])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    } else {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={rootRef}
      className={classes.wrapper}
      style={{
        right: `${position.x}px`,
        bottom: `${position.y}px`,
      }}
    >
      {children}
    </div>
  )
}

export default BuildBarDraggable
