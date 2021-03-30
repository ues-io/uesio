import { FunctionComponent } from "react"

import { component, styles, hooks } from "@uesio/ui"
import { BoxProps } from "./boxdefinition"

const useStyles = styles.getUseStyles(["root"])

const Box: FunctionComponent<BoxProps> = (props) => {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const { definition, context, path } = props
	return (
		<div
			className={classes.root}
			onClick={
				definition?.signals &&
				uesio.signal.getHandler(definition.signals)
			}
		>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				accepts={["uesio.standalone"]}
				context={context}
			/>
		</div>
	)
}

export default Box
