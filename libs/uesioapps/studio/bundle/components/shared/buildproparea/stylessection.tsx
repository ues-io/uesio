import { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { builder } from "@uesio/ui"
import PropList from "./proplist"

const StylesSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, context, propsDef, valueAPI } = props

	const properties: builder.PropDescriptor[] = [
		{
			name: "uesio.variant",
			type: "METADATA",
			metadataType: "COMPONENTVARIANT",
			label: "Variant",
			groupingParents: 1,
			getGroupingFromKey: true,
		},
		{
			name: "uesio.styles",
			type: "STYLESLIST",
			label: "Variant",
		},
	]

	return (
		<PropList
			path={path}
			propsDef={propsDef}
			properties={properties}
			context={context}
			valueAPI={valueAPI}
		/>
	)
}

export default StylesSection
