import { component, builder, definition, api } from "@uesio/ui"

const ParamsProp: builder.PropComponent<builder.ParamsProp> = (props) => {
	const TextField = component.getUtility("uesio/io.textfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const { path, context } = props

	if (!path) return null
	const definition = {} as definition.DefinitionMap
	if (!definition?.view) return null
	const params = api.view.useViewDef(definition.view as string)
		?.params as Record<string, Record<"type", string>>

	return (
		<>
			{params &&
				Object.keys(params).map((el: string) => {
					const paramPath = `${path}["${el}"]`
					console.log(paramPath)
					return (
						<FieldWrapper
							labelPosition="left"
							label={el}
							context={context}
							key={el}
							variant="uesio/builder.propfield"
						>
							<TextField
								value={/*valueAPI.get(paramPath)*/ ""}
								label={el}
								setValue={
									(/*value: string*/) => {
										//valueAPI.set(paramPath, value)
									}
								}
								context={context}
								variant="uesio/io.field:uesio/builder.propfield"
							/>
						</FieldWrapper>
					)
				})}
		</>
	)
}

export default ParamsProp
