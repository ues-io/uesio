import { FunctionComponent } from "react"

import { component, styles, hooks } from "@uesio/ui"
import { BoxProps } from "./boxdefinition"
const Proplist = component.getUtility("uesio/builder.proplist")
const Box: FunctionComponent<BoxProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
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
			<Proplist
				valueAPI={{
					get: () => "",
				}}
				path={path}
				properties={[
					{
						name: "text",
						type: "TEXT",
						label: "Text",
					},
					{
						name: "icon",
						type: "ICON",
						label: "Icon",
					},
				]}
				context={context}
			/>

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
