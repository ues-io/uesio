import { Fragment, FunctionComponent } from "react"
import { SectionRendererProps } from "../../../../../studio/bundle/components/shared/buildproparea/sectionrendererdefinition"
import { builder, component, definition, hooks } from "@uesio/ui"

const TitleBar = component.getUtility("uesio/io.titlebar")

const ColumnSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, context, propsDef, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const viewDefId = uesio.getViewDefId()

	if (!viewDefId) return null
	const columns = valueAPI.get(
		`${path}["columns"]`
	) as definition.DefinitionList
	console.log({ columns })
	const properties: builder.PropDescriptor[] = [
		// 	{
		// 		name: "uesio.variant",
		// 		type: "METADATA",
		// 		metadataType: "COMPONENTVARIANT",
		// 		label: "Variant",
		// 		groupingParents: 1,
		// 		getGroupingFromKey: true,
		// 	},
	]
	// return <p>hello world</p>
	return (
		<>
			{/* <PropList
				path={path}
				propsDef={propsDef}
				properties={properties}
				context={context}
				valueAPI={valueAPI}
			/> */}

			{columns.map((column, i) => {
				const columnDef = column["uesio/io.column"] as Record<
					string,
					unknown
				>
				console
				return (
					<Fragment key={i}>
						<div>
							<button
								onClick={() => {
									uesio.builder.moveDefinition(
										`${path}["columns"]["${i}"]`,
										`${path}["columns"]["${i - 1}"]`,
										`uesio/io.column`
									)
								}}
							>
								up
							</button>
							<button
								onClick={() => {
									uesio.builder.setSelectedNode(
										"viewdef",
										viewDefId,
										`${path}["columns"]["${i}"]`
									)
								}}
							>
								{columnDef?.field as string}
							</button>
						</div>
						{/* <TitleBar
							variant="uesio/studio.propsubsection"
							title={i}
							context={context}
						/> */}
					</Fragment>
				)
			})}
		</>
	)
}

export default ColumnSection
