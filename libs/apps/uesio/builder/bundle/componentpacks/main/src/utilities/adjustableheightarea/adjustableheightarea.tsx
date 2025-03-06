import { definition, styles, api } from "@uesio/ui"
import { useRef } from "react"

const StyleDefaults = Object.freeze({
  handle: [
    "cursor-ns-resize",
    "h-2",
    "bg-panel_divider_color",
    "hover:bg-panel_divider_hover_color",
    "transition-colors",
  ],
})

const INITIAL_HEIGHT = 300

type Props = {
  componentId: string
}

const AdjustableHeightArea: definition.UtilityComponent<Props> = (props) => {
  const { componentId } = props
  const [height, setHeight] = api.component.useState<number>(
    componentId,
    INITIAL_HEIGHT,
  )
  const startY = useRef(0)
  const startHeight = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    startY.current = e.clientY
    startHeight.current = height || INITIAL_HEIGHT
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    e.preventDefault()
    const newHeight = startHeight.current + (startY.current - e.clientY)
    setHeight(newHeight > 0 ? newHeight : 0)
  }

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault()
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  return (
    <div style={{ height: `${height}px` }}>
      <div onMouseDown={handleMouseDown} className={classes.handle} />
      {props.children}
    </div>
  )
}

export default AdjustableHeightArea
