import { SyntheticEvent } from "react"
import { definition, component } from "@uesio/ui"

interface Props {
	title: string
	icon: string
	onClick?: (event: SyntheticEvent) => void
	disabled?: boolean
	className?: string
}

const ActionButton: definition.UtilityComponent<Props> = (props) => {
	const IconButton = component.getUtility("uesio/io.iconbutton")
	const { title, onClick, icon, disabled, context, className, id } = props

	return (
		<IconButton
			id={id}
			onClick={onClick}
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
