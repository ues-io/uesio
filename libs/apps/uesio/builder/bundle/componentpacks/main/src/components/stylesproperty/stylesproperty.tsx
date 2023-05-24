import { component, definition, metadata } from "@uesio/ui"
import { FullPath } from "../../api/path"
import { get, set } from "../../api/defapi"
import { getComponentDef } from "../../api/stateapi"

type Props = {
	componentType: metadata.MetadataKey
	componentPath: FullPath
}

const StylesProperty: definition.UC<Props> = (props) => {
	const {
		context,
		definition: { componentPath, componentType },
	} = props

	const TitleBar = component.getUtility("uesio/io.titlebar")
	const PillBox = component.getUtility("uesio/io.pillbox")
	const tokensPath = componentPath.addLocal("uesio.styleTokens")
	const tokensByRegion = (get(context, tokensPath) || {}) as Record<
		string,
		string[]
	>
	const styleRegions = getComponentDef(context, componentType)
		?.styleRegions || {
		root: {},
	}

	const setRegionTokens = (regionName: string, tokens: string[]) => {
		set(context, tokensPath, {
			...tokensByRegion,
			[regionName]: tokens,
		})
	}

	return (
		<>
			{Object.keys(styleRegions).map((regionName) => {
				const regionTokens =
					tokensByRegion[regionName] || ([] as string[])
				const addRegionToken = (token: string) =>
					setRegionTokens(regionName, [
						...regionTokens.filter((t) => t !== token),
						token,
					])
				const removeRegionToken = (deletedVal: string) => {
					setRegionTokens(
						regionName,
						regionTokens.filter((t) => t !== deletedVal)
					)
				}
				return (
					<div key={regionName}>
						<TitleBar
							title={regionName}
							variant="uesio/builder.propsubsection"
							context={context}
						/>
						<PillBox
							context={context}
							items={regionTokens}
							onDelete={removeRegionToken}
							onAdd={addRegionToken}
							addLabel="Add Token"
						/>
					</div>
				)
			})}
		</>
	)
}

export default StylesProperty
