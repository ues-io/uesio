import { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import { builder } from "@uesio/ui"
import PropList from "./proplist"

const ConditionalDisplaySection: FunctionComponent<SectionRendererProps> = (
	props
) => {
	const { path, context, propsDef, valueAPI } = props
	const section = props.section as builder.PropListSection

	const properties: builder.PropDescriptor[] = [
		{
			name: "uesio.display",
			type: "CONDITIONALDISPLAY",
			label: "Conditional Display",
		},
	]

	return (
		<ExpandPanel
			defaultExpanded={false}
			title={section.title}
			context={context}
		>
			<PropList
				path={path}
				propsDef={propsDef}
				properties={properties}
				context={context}
				valueAPI={valueAPI}
			/>
		</ExpandPanel>
	)
}

export default ConditionalDisplaySection
