import { FC, createContext } from "react"
import { component, styles, hooks, signal } from "@uesio/ui"
import { FormSectionProps } from "./formsectiondefinition"
import Layout from "../io.layout/layout"
export const FormStylesContext = createContext({})

const IOTitleBar = component.registry.getUtility("io.titlebar")

const FormSection: FC<FormSectionProps> = (props) => {
	const { definition, context, path } = props
	const { title, subtitle } = definition
	const uesio = hooks.useUesio(props)

	const classes = styles.useStyles(
		{
			root: {
				display: "block",
			},
			formArea: {
				marginBottom: "1em",
			},
			actionsBar: {
				textAlign: "right",
			},
		},
		props
	)

	return (
		<div>
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
