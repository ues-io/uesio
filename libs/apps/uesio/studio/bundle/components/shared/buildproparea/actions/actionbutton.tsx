import { SyntheticEvent, FunctionComponent } from "react"
import { definition, component } from "@uesio/ui"

interface Props extends definition.BaseProps {
	title: string
	icon: string
	onClick?: (event: SyntheticEvent) => void
	disabled?: boolean
}

const IconButton = component.registry.getUtility("uesio/io.iconbutton")

const ActionButton: FunctionComponent<Props> = (props) => {
	const { title, onClick, icon, disabled, context } = props

	return (
		<IconButton
			onClick={onClick}
			size="small"
			color="#444"
			disabled={disabled}
			icon={icon}
			label={title}
			tooltipPlacement="bottom"
			context={context}
		/>
	)
}

export default ActionButton
