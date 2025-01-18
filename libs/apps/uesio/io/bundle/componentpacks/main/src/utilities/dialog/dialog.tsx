import { ReactNode } from "react"
import { definition, styles } from "@uesio/ui"
import DialogPlain from "../dialogplain/dialogplain"
import TitleBar from "../titlebar/titlebar"
import IconButton from "../iconbutton/iconbutton"
import Group from "../group/group"
import ScrollPanel from "../scrollpanel/scrollpanel"

interface DialogUtilityProps {
  onClose?: () => void
  width?: string
  height?: string
  title?: string
  actions?: ReactNode
  closeOnOutsideClick?: boolean
  closed?: boolean
}

const StyleDefaults = Object.freeze({
  content: [],
  footer: [],
})

const Dialog: definition.UtilityComponent<DialogUtilityProps> = (props) => {
  const { content, footer } = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.dialog",
  )
  const {
    context,
    title,
    onClose,
    width,
    height,
    children,
    actions,
    closeOnOutsideClick,
    closed,
  } = props
  return (
    <DialogPlain
      context={props.context}
      variant={props.variant}
      styleTokens={props.styleTokens}
      height={height}
      width={width}
      closed={closed}
      onClose={onClose}
      initialFocus={1}
      closeOnOutsideClick={closeOnOutsideClick}
    >
      <ScrollPanel
        header={
          <TitleBar
            title={title}
            variant="uesio/io.dialog"
            context={context}
            actions={
              <IconButton icon="close" onClick={onClose} context={context} />
            }
          />
        }
        footer={
          actions && (
            <Group className={footer} context={context}>
              {actions}
            </Group>
          )
        }
        context={context}
      >
        <div className={content}>{children}</div>
      </ScrollPanel>
    </DialogPlain>
  )
}

export default Dialog
