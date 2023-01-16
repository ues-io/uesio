import { SyntheticEvent, FunctionComponent } from "react"
import { definition, component } from "@uesio/ui"

interface Props extends definition.UtilityProps {
	title: string
	icon: string
	onClick?: (event: SyntheticEvent) => void
	disabled?: boolean
	className?: string
}

const ActionButton: FunctionComponent<Props> = (props) => {
	const IconButton = component.getUtility("uesio/io.iconbutton")
	const { title, onClick, icon, disabled, context, className } = props

	return (
		<IconButton
			onClick={onClick}
			size="small"
			disabled={disabled}
			icon={icon}
			className={className}
			variant="uesio/builder.actionbutton"
			label={title}
			tooltipPlacement="bottom"
			tooltipOffset={10}
			context={context}
		/>
	)
}

export default ActionButton
