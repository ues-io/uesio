import { FunctionComponent, useState } from "react"
import { definition, styles, wire, context, hooks, component } from "@uesio/ui"
import groupby from "lodash/groupBy"
import keyby from "lodash/keyBy"

type AddBundleDefinition = {
	installablebundleswire: string
	currentdependencies: string
}

interface Props extends definition.BaseProps {
	definition: AddBundleDefinition
}

const Grid = component.registry.getUtility("io.grid")
const Tile = component.registry.getUtility("io.tile")
const Button = component.registry.getUtility("io.button")
const SelectField = component.registry.getUtility("io.selectfield")
const TitleBar = component.registry.getUtility("io.titlebar")

function getRecordByStudioId(id: string, wire: wire.Wire) {
	const records = wire.getData()
	for (const record of records) {
		if (record.source["uesio.id"] === id) {
			return record
		}
	}
}
async function installBundle(
	namespace: string,
	version: string,
	depWire: wire.Wire,
	workspaceId: string,
	context: context.Context
) {
	depWire.createRecord({
		"studio.bundle": { "uesio.id": `${namespace}_${version}` },
		"studio.workspaceid": workspaceId,
	})
	await depWire.save(context)
	return depWire.load(context)
}
function uninstallBundle(
	namespace: string,
	version: string,
	depWire: wire.Wire,
	workspaceId: string,
	context: context.Context
) {
	const record = getRecordByStudioId(
		`${workspaceId}_${namespace}_${version}`,
		depWire
	)
	if (!record) return
	depWire.markRecordForDeletion(record.getId())
	return depWire.save(context)
}
async function updateBundle(
	namespace: string,
	version: string,
	oldVersion: string,
	depWire: wire.Wire,
	workspaceId: string,
	context: context.Context
) {
	const oldRecord = getRecordByStudioId(
		`${workspaceId}_${namespace}_${oldVersion}`,
		depWire
	)

	if (!oldRecord) return
	depWire.markRecordForDeletion(oldRecord.getId())
	return installBundle(namespace, version, depWire, workspaceId, context)
}
const AddBundle: FunctionComponent<Props> = (props) => {
	const {
		definition: { installablebundleswire, currentdependencies },
		context,
	} = props
	const uesio = hooks.useUesio(props)
	const classes = styles.useStyles(
		{
			root: {
				gridTemplateColumns: "1fr 1fr 1fr",
				columnGap: "8px",
			},
		},
		props
	)
	const [selectedValues, setSelectedValues] = useState(
		{} as Record<string, string>
	)
	const depWire = uesio.wire.useWire(currentdependencies || "")
	const route = context.getRoute()
	if (!depWire || !route) return null
	const appName = route.params?.appname

	const workspaceId = `${appName}_${route.params?.workspacename}`
	const bundles = uesio.wire
		.useWire(installablebundleswire || "")
		?.getData()
		.filter((record) => {
			const source = record.source
			const namespace = source["studio.app"]
			//We don't want to see ourselves, uesio or studio
			if (namespace === appName) return false
			if (namespace === "studio") return false
			return true
		})
		.map((record) => {
			const source = record.source
			const namespace = source["studio.app"] as string
			const version = `v${source["studio.major"]}.${source["studio.minor"]}.${source["studio.patch"]}`
			return {
				namespace,
				version,
			}
		})
	const deps = depWire.getData().map((record) => record.source)
	if (!bundles || !deps) return null
	const bundleGrouping = groupby(bundles, "namespace")
	const bundleNamespaces = Object.keys(bundleGrouping)
	const currentBundleVersions = keyby(
		deps.map((dep) => {
			const bundleInfo = dep["studio.bundle"] as wire.PlainWireRecord
			return {
				namespace: bundleInfo["studio.app"],
				version: `v${bundleInfo["studio.major"]}.${bundleInfo["studio.minor"]}.${bundleInfo["studio.patch"]}`,
			}
		}),
		"namespace"
	)

	return (
		<Grid className={classes.root} context={context}>
			{bundleNamespaces.map((namespace) => {
				const versions = bundleGrouping[namespace]
					.map((entry) => entry.version)
					.sort()
					.reverse()
				const installed = !!currentBundleVersions[namespace]
				const versionSelected = selectedValues[namespace]
				const installedVersion =
					installed && currentBundleVersions[namespace].version
				const selectedVersion =
					versionSelected || installedVersion || versions[0]
				const installedIsCurrent = installedVersion === selectedVersion
				let actionButton = (
					<Button
						variant="io.primary"
						context={context}
						label="Install"
						onClick={() =>
							installBundle(
								namespace,
								selectedVersion,
								depWire,
								workspaceId,
								context
							)
						}
					/>
				)
				if (installed) {
					if (installedIsCurrent) {
						actionButton = (
							<Button
								variant="io.secondary"
								context={context}
								label="Uninstall"
								onClick={() =>
									uninstallBundle(
										namespace,
										selectedVersion,
										depWire,
										workspaceId,
										context
									)
								}
							/>
						)
					} else {
						actionButton = (
							<Button
								variant="io.primary"
								context={context}
								label="Update"
								onClick={() =>
									updateBundle(
										namespace,
										selectedVersion,
										installedVersion,
										depWire,
										workspaceId,
										context
									)
								}
							/>
						)
					}
				}
				return (
					<Tile
						key={namespace}
						context={context}
						variant="io.item"
						styles={{
							root: {
								alignItems: "top",
							},
						}}
					>
						<TitleBar
							context={context}
							title={namespace}
							subtitle={
								installed
									? `installed: ${currentBundleVersions[namespace].version}`
									: ""
							}
						/>
						<SelectField
							context={context}
							value={selectedVersion}
							setValue={(value: string): void => {
								setSelectedValues({
									...selectedValues,
									[namespace]: value,
								})
							}}
							label="version"
							options={versions.map((option, index) => ({
								key: index,
								label: option,
							}))}
						/>
						<div style={{ marginTop: "20px" }}>{actionButton}</div>
					</Tile>
				)
			})}
		</Grid>
	)
}

export default AddBundle
