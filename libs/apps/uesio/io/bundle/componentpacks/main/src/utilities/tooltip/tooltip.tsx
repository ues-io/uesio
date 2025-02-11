import { cloneElement, isValidElement, useRef, useState } from "react"
import { definition, styles } from "@uesio/ui"
import {
  useFloating,
  useInteractions,
  arrow,
  offset,
  shift,
  useHover,
  Placement,
  FloatingPortal,
  FloatingArrow,
} from "@floating-ui/react"

interface TooltipUtilityProps {
  text: string
  placement?: Placement
  offset?: number
}

const StyleDefaults = Object.freeze({
  tooltip: [
    "px-2",
    "py-1.5",
    "bg-slate-800",
    "text-slate-100",
    "z-10",
    "text-xs",
    "rounded",
  ],
  arrow: ["fill-slate-800"],
})

const Tooltip: definition.UtilityComponent<TooltipUtilityProps> = (props) => {
  const { children } = props
  const arrowRef = useRef(null)
  const [open, setOpen] = useState<boolean>(false)
  const { x, y, strategy, refs, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: props.placement,
    middleware: [
      shift(),
      offset(props.offset || 0),
      arrow({
        element: arrowRef,
      }),
    ],
  })

  const hover = useHover(context, {
    restMs: 400,
    // if their cursor never rests, open it after 1000 ms (fallback)
    delay: { open: 1000 },
  })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover])

  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  return (
    <>
      {isValidElement(children) &&
        cloneElement(
          children,
          getReferenceProps({
            ref: refs.setReference,
            ...children.props,
          }),
        )}
      {open && (
        <FloatingPortal
          root={refs.domReference.current?.closest<HTMLElement>(".uesio-theme")}
        >
          {
            <div
              {...getFloatingProps()}
              className={classes.tooltip}
              ref={refs.setFloating}
              style={{
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
                width: "max-content",
              }}
            >
              {props.text}
              <FloatingArrow
                width={12}
                height={6}
                className={classes.arrow}
                ref={arrowRef}
                context={context}
              />
            </div>
          }
        </FloatingPortal>
      )}
    </>
  )
}

export default Tooltip
