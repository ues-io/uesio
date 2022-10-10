import { FunctionComponent } from "react"

import { component, styles, hooks } from "@uesio/ui"
import { BoxProps } from "./boxdefinition"
const Box: FunctionComponent<BoxProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	const uesio = hooks.useUesio(props)
	const { definition, context, path } = props
	console.log({ definition })
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
