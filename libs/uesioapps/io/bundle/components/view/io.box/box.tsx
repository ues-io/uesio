import { FunctionComponent, useRef } from "react"

import { component, styles, hooks } from "@uesio/ui"
import { BoxProps } from "./boxdefinition"

const Box: FunctionComponent<BoxProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	const ref = useRef<HTMLDivElement>(null)
	const uesio = hooks.useUesio(props)
	const { definition, context, path } = props
	return (
		<div
			ref={ref}
			className={classes.root}
			onClick={
				definition?.signals &&
				uesio.signal.getHandler(definition.signals)
			}
		>
			<component.Slot
				parentRef={ref}
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
