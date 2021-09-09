import { FC, useRef, useState, useEffect } from "react"
import { component, styles } from "@uesio/ui"
import { ColumnProps } from "./columndefinition"

const IOcolumn = component.registry.getUtility("io.column")

const Column: FC<ColumnProps> = (props) => {
	const { definition, context, path } = props

	const sharedProps = { context }

	const { getFlexStyles } =
		component.registry.getPropertiesDefinition("io.column")

	const classes = styles.useStyles(
		{
			root: {
				...(getFlexStyles && getFlexStyles()),
			},
		},
		props
	)

	const ref = useRef<HTMLDivElement>(null)
	const [width, setWidth] = useState(0)
	useEffect(() => {
		function handleResize() {
			setWidth(ref?.current?.offsetWidth || 0)
		}
		window.addEventListener("resize", handleResize)
		handleResize()
		return () => window.removeEventListener("resize", handleResize)
	}, [])

	return (
		<IOcolumn classes={classes} {...sharedProps}>
			<div ref={ref}>
				<h3>{width}</h3>
			</div>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				accepts={["io.griditem", "uesio.standalone", "uesio.field"]}
				context={context}
			/>
		</IOcolumn>
	)
}

export default Column
