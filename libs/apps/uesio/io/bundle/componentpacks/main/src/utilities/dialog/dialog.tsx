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
}

const StyleDefaults = Object.freeze({
	blocker: [],
	wrapper: [],
	inner: [],
	content: [],
	footer: [],
})

const Dialog: definition.UtilityComponent<DialogUtilityProps> = (props) => {
	const { blocker, wrapper, inner, content, footer } =
		styles.useUtilityStyleTokens(StyleDefaults, props, "uesio/io.dialog")
	const { context, title, onClose, width, height, children, actions } = props
	return (
		<DialogPlain
			context={props.context}
			height={height}
			width={width}
			onClose={onClose}
			initialFocus={1}
			classes={{
				blocker,
				wrapper,
				inner,
			}}
		>
			<ScrollPanel
				header={
					<TitleBar
						title={title}
						variant="uesio/io.dialog"
						context={context}
						actions={
							<IconButton
								icon="close"
								onClick={onClose}
								context={context}
							/>
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
