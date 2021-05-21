import { SyntheticEvent, FunctionComponent } from "react"
import SmallIconButton from "../../smalliconbutton"
import { styles, definition } from "@uesio/ui"

interface Props extends definition.BaseProps {
	title: string
	icon: string
	onClick?: (event: SyntheticEvent) => void
	disabled?: boolean
}

const ActionButton: FunctionComponent<Props> = (props) => {
	const { title, onClick, icon, disabled } = props
	const classes = styles.useStyles(
		{
			root: {
				marginRight: "8px",
			},
		},
		props
	)

	return (
		<SmallIconButton
			title={title}
			onClick={onClick}
			icon={icon}
			disabled={disabled}
			className={classes.root}
		/>
	)
}

export default ActionButton
