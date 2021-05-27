import { FunctionComponent, SyntheticEvent } from "react"

const IconButton = component.registry.getUtility("io.iconbutton")
import { component, definition } from "@uesio/ui"

interface Props extends definition.BaseProps {
	title: string
	defaultExpanded: boolean
	action?: string
	actionColor?: string
	actionOnClick?: () => void
}

const IOExpandPanel = component.registry.getUtility("io.expandpanel")

const ExpandPanel: FunctionComponent<Props> = ({
	children,
	action,
	title,
	defaultExpanded,
	actionOnClick,
	context,
}) => (
	<IOExpandPanel
		label={title}
		defaultExpanded={defaultExpanded}
		context={context}
		actions={
			action && (
				<IconButton
					onClick={(event: SyntheticEvent): void => {
						event.stopPropagation()
						actionOnClick?.()
					}}
					size="small"
					icon={action}
					context={context}
				/>
			)
		}
	>
		{children}
	</IOExpandPanel>
)

export default ExpandPanel
