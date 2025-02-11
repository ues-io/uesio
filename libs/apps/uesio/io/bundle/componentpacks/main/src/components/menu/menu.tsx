import {
  autoUpdate,
  useFloating,
  autoPlacement,
  offset,
  useInteractions,
  useDismiss,
  useClick,
  FloatingPortal,
  FloatingFocusManager,
  arrow,
  FloatingArrow,
} from "@floating-ui/react"
import { component, definition, styles } from "@uesio/ui"
import { useRef, useState } from "react"
import IconButton from "../../utilities/iconbutton/iconbutton"

type MenuDefinition = {
  trigger?: definition.DefinitionList
  content?: definition.DefinitionList
  arrow?: boolean
  closeButton?: boolean
}

const StyleDefaults = Object.freeze({
  menu: [],
  trigger: [],
  arrow: [],
  closeButton: [],
})

const Menu: definition.UC<MenuDefinition> = (props) => {
  const { definition, context, componentType } = props
  const [isOpen, setIsOpen] = useState(false)

  const classes = styles.useStyleTokens(StyleDefaults, props)

  const arrowRef = useRef(null)

  const onOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  const floating = useFloating({
    open: isOpen,
    onOpenChange,
    placement: "bottom-start",
    middleware: [
      offset(12),
      autoPlacement({ allowedPlacements: ["top-start", "bottom-start"] }),
      ...(definition.arrow
        ? [
            arrow({
              element: arrowRef,
            }),
          ]
        : []),
    ],
    whileElementsMounted: autoUpdate,
  })

  const { floatingStyles, refs } = floating

  const dismiss = useDismiss(floating.context)
  const click = useClick(floating.context)

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ])

  return (
    <>
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        className={classes.trigger}
      >
        <component.Slot
          definition={definition}
          listName="trigger"
          path={props.path}
          context={context}
          componentType={componentType}
        />
      </div>
      {isOpen && (
        <FloatingPortal
          root={refs.domReference.current?.closest<HTMLElement>(".uesio-theme")}
        >
          <FloatingFocusManager
            initialFocus={-1}
            context={floating.context}
            modal={false}
          >
            <div
              ref={refs.setFloating}
              className={classes.menu}
              style={floatingStyles}
              {...getFloatingProps()}
            >
              <component.Slot
                definition={definition}
                listName="content"
                path={props.path}
                context={context}
                componentType={componentType}
              />
              {definition.arrow && (
                <FloatingArrow
                  width={10}
                  height={5}
                  className={classes.arrow}
                  strokeWidth={1}
                  ref={arrowRef}
                  context={floating.context}
                />
              )}
              {definition.closeButton && (
                <IconButton
                  icon="close"
                  className={classes.closeButton}
                  context={context}
                  onClick={() => {
                    setIsOpen(false)
                  }}
                />
              )}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}

export default Menu
