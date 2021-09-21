import { FC, createContext } from "react"
import { component, styles, hooks, signal } from "@uesio/ui"
import { FormSectionProps } from "./formsectiondefinition"
import Layout from "../io.layout/layout"
export const FormStylesContext = createContext({})

const IOTitleBar = component.registry.getUtility("io.titlebar")

const FormSection: FC<FormSectionProps> = (props) => {
	const { definition, context, path } = props
	const { title, subtitle } = definition

	const classes = styles.useStyles(
		{
			root: {
				gap: "inherit",
				flex: "100%",
			},
			formArea: {
				marginBottom: "1em",
			},
		},
		props
	)

	return (
		<div className={classes.root}>
			<IOTitleBar
				context={context}
				variant={definition["uesio.variant"]}
				title={title}
				subtitle={subtitle}
				actions={
					<component.Slot
						definition={definition}
						listName="actions"
						path={path}
						accepts={["uesio.standalone"]}
						context={context}
					/>
				}
			/>

			<Layout
				definition={definition}
				context={context}
				slot={
					<component.Slot
						definition={props.definition}
						listName="columns"
						path={path}
						accepts={["io.column"]}
						context={context}
					/>
				}
			/>
		</div>
	)
}

export default FormSection
