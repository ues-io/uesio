import { FunctionComponent, SyntheticEvent } from "react"

const IconButton = component.registry.getUtility("uesio/io.iconbutton")
import { component, definition } from "@uesio/ui"

interface Props extends definition.UtilityProps {
	title: string
	defaultExpanded: boolean
	action?: string
	actionColor?: string
	actionOnClick?: () => void
}

const IOExpandPanel = component.registry.getUtility("uesio/io.expandpanel")
const TitleBar = component.registry.getUtility("uesio/io.titlebar")

const ExpandPanel: FunctionComponent<Props> = ({
	children,
	action,
	title,
	defaultExpanded,
	actionOnClick,
	context,
	styles,
}) => (
	<IOExpandPanel
		defaultExpanded={defaultExpanded}
		context={context}
		styles={styles}
		toggle={
			<TitleBar
				title={title}
				context={context}
				actions={
					<>
						{action && (
							<IconButton
								onClick={(event: SyntheticEvent): void => {
									event.stopPropagation()
									actionOnClick?.()
								}}
								icon={action}
								context={context}
							/>
						)}
					</>
				}
				variant="studio.expandpanel"
			/>
		}
		variant="studio.expandpanel"
	>
		{children}
	</IOExpandPanel>
)

export default ExpandPanel
