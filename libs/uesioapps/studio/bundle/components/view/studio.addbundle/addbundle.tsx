import { ChangeEvent, FunctionComponent, useState } from "react"
import { definition, styles, wire, context, hooks } from "@uesio/ui"
import {
	Grid,
	Button,
	Card,
	CardContent,
	TextField,
	MenuItem,
} from "@material-ui/core"
import groupby from "lodash.groupby"
import keyby from "lodash.keyby"

type AddBundleDefinition = {
	installablebundleswire: string
	currentdependencies: string
}

interface Props extends definition.BaseProps {
	definition: AddBundleDefinition
}

function getRecordByStudioId(id: string, wire: wire.Wire) {
	const records = wire.getData()
	for (const record of records) {
		if (record.source["studio.id"] === id) {
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
			root: {},
			card: {
				margin: styles.getSpacing(props.context.getTheme(), 1),
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
			const namespace = source["uesio.namespace"]
			//We don't want to see ourselves, uesio or studio
			if (namespace === appName) return false
			if (namespace === "studio") return false
			return true
		})
		.map((record) => {
			const source = record.source
			const namespace = source["uesio.namespace"] as string
			const version = `v${source["uesio.major"]}.${source["uesio.minor"]}.${source["uesio.patch"]}`
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
				namespace: bundleInfo["uesio.namespace"],
				version: `v${bundleInfo["uesio.major"]}.${bundleInfo["uesio.minor"]}.${bundleInfo["uesio.patch"]}`,
			}
		}),
		"namespace"
	)

	return (
		<Grid className={classes.root} container={true}>
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
						color="primary"
						variant="contained"
						onClick={() =>
							installBundle(
								namespace,
								selectedVersion,
								depWire,
								workspaceId,
								context
							)
						}
					>
						Install
					</Button>
				)
				if (installed) {
					if (installedIsCurrent) {
						actionButton = (
							<Button
								color="secondary"
								variant="contained"
								onClick={() =>
									uninstallBundle(
										namespace,
										selectedVersion,
										depWire,
										workspaceId,
										context
									)
								}
							>
								Uninstall
							</Button>
						)
					} else {
						actionButton = (
							<Button
								color="primary"
								variant="contained"
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
							>
								Update
							</Button>
						)
					}
				}
				return (
					<Grid key={namespace} item={true} md={3} sm={4} xs={12}>
						<Card className={classes.card}>
							<CardContent>
								<Grid
									className={classes.root}
									container={true}
									alignContent="space-between"
								>
									<Grid xs={6} item={true}>
										<h3>{namespace}</h3>
									</Grid>
									<Grid xs={6} item={true}>
										<div
											style={{
												color: "primary",
												marginTop: "20px",
											}}
										>
											{installed
												? `installed: ${currentBundleVersions[namespace].version}`
												: ""}
										</div>
									</Grid>
								</Grid>
								<TextField
									select={true}
									className={classes.root}
									fullWidth={true}
									InputLabelProps={{
										disableAnimation: true,
										shrink: true,
									}}
									value={selectedVersion}
									onChange={(
										event: ChangeEvent<HTMLInputElement>
									): void => {
										setSelectedValues({
											...selectedValues,
											[namespace]: event.target.value,
										})
									}}
									size="small"
									label="version"
								>
									{versions.map((option, index) => (
										<MenuItem key={index} value={option}>
											{option}
										</MenuItem>
									))}
								</TextField>
								<div style={{ marginTop: "20px" }}>
									{actionButton}
								</div>
							</CardContent>
						</Card>
					</Grid>
				)
			})}
		</Grid>
	)
}

export default AddBundle
