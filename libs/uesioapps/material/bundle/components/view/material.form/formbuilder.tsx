import { FunctionComponent } from "react"
import { hooks, component } from "@uesio/ui"
import { FormProps, FormDefinition } from "./formdefinition"
import Form from "./form"

const FormBuilder: FunctionComponent<FormProps> = (props) => {
	const { path, context } = props
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(path) as FormDefinition
	const buildView = uesio.builder.useView()
	const isStructureView = buildView === "structureview"

	return (
		<>
			{isStructureView ? (
				<div
					style={{
						border: "1px dashed #ccc",
						minHeight: "40px",
						margin: "8px",
						backgroundColor: "#f5f5f5",
					}}
				>
					<component.Slot
						definition={definition}
						listName="columns"
						path={path}
						accepts={["material.formcolumn"]}
						context={context.addFrame({ noMerge: isStructureView })}
					/>
				</div>
			) : (
				<Form {...props} definition={definition} />
			)}
		</>
	)
}

export default FormBuilder
