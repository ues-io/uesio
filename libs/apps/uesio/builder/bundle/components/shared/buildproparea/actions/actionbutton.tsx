import { SyntheticEvent, FunctionComponent } from "react"
import { definition, component } from "@uesio/ui"

interface Props extends definition.BaseProps {
	title: string
	icon: string
	onClick?: (event: SyntheticEvent) => void
	disabled?: boolean
	className?: string
}

const IconButton = component.getUtility("uesio/io.iconbutton")

const ActionButton: FunctionComponent<Props> = (props) => {
	const { title, onClick, icon, disabled, context, className } = props

	return (
		<IconButton
			onClick={onClick}
			size="small"
			disabled={disabled}
			icon={icon}
			className={className}
			variant="uesio/studio.actionbutton"
			label={title}
			tooltipPlacement="bottom"
			context={context}
		/>
	)
}

export default ActionButton
