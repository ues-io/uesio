import React, { FunctionComponent, useState } from "react"

import { FileProps } from "./filedefinition"
import { hooks, material, styles, wire } from "@uesio/ui"
import Edit from "@material-ui/icons/Edit"
import Icon from "../icon/icon"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: FileProps) => ({
			display: "block",
			lineHeight: 0,
			...styles.getMarginStyles(props.definition?.margin, theme),
		}),
		input: {
			display: "none",
		},
		avatar: (props: FileProps) => ({
			width: props.definition?.width ? props.definition.width : 200,
			height: props.definition?.height ? props.definition.height : 200,
		}),
		smallavatar: (props: FileProps) => ({
			width: props.definition?.width ? props.definition.width / 4 : 50,
			height: props.definition?.height ? props.definition.height / 4 : 50,
			border: `2px solid ${theme.palette.background.paper}`,
			cursor: "pointer",
		}),
	})
)

async function fetchFileInfo(
	fileUrl: RequestInfo,
	setMime: React.Dispatch<React.SetStateAction<string>>
) {
	const response = await fetch(fileUrl)
	const blob = await response.blob()
	setMime(blob.type)
}

async function handleChange(
	selectorFiles: FileList | null,
	fieldId: string,
	record: wire.WireRecord,
	wire: wire.Wire,
	uesio: hooks.Uesio,
	fileCollection: string
) {
	const collection = wire.getCollection()
	const collectionFullName = collection.getFullName()

	const idField = collection.getIdField()
	if (!idField) return

	const recordId = record.getFieldValue(idField.getId()) as string
	if (selectorFiles && recordId) {
		if (selectorFiles.length !== 1) {
			throw new Error("Too many files selected")
		}

		const file = selectorFiles[0]

		const fileId = await uesio.file.uploadFile(
			uesio.getContext(),
			file,
			file.name,
			fileCollection,
			collectionFullName,
			recordId,
			fieldId
		)

		record.set(fieldId, fileId)
	}
}

const File: FunctionComponent<FileProps> = (props) => {
	const {
		context,
		definition: { fieldId, id, fileCollection, displayAs },
	} = props
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record || !displayAs) {
		return null
	}

	const userFileId = record.getFieldValue(fieldId) as string
	const fileUrl = uesio.file.getUserFileURL(context, userFileId, true)
	const [mime, setMime] = useState("")
	fetchFileInfo(fileUrl, setMime)

	const iconJsx = (
		<Icon
			definition={{
				type: "file",
				size: "large",
			}}
			path={props.path}
			context={props.context}
		/>
	)

	if (displayAs === "button") {
		return (
			<div className={classes.root}>
				<label htmlFor={id}>
					<input
						type="file"
						className={classes.input}
						id={id}
						name={id}
						onChange={(e) =>
							handleChange(
								e.target.files,
								fieldId,
								record,
								wire,
								uesio,
								fileCollection
							)
						}
					/>
					<material.Button
						color="primary"
						variant="contained"
						component="span"
					>
						<Icon
							definition={{
								type: "librayadd",
								size: "small",
							}}
							path={props.path}
							context={props.context}
						/>
					</material.Button>
				</label>
			</div>
		)
	}

	if (!fileUrl) {
		return (
			<div className={classes.root}>
				<material.Badge
					overlap="circle"
					anchorOrigin={{
						vertical: "bottom",
						horizontal: "right",
					}}
					badgeContent={
						<div>
							<label htmlFor={id}>
								<input
									type="file"
									accept="image/*"
									className={classes.input}
									id={id}
									name={id}
									onChange={(e) =>
										handleChange(
											e.target.files,
											fieldId,
											record,
											wire,
											uesio,
											fileCollection
										)
									}
								/>
								<material.Avatar
									className={classes.smallavatar}
								>
									<Edit />
								</material.Avatar>
							</label>
						</div>
					}
				>
					<material.Avatar className={classes.avatar}>
						{iconJsx}
					</material.Avatar>
				</material.Badge>
			</div>
		)
	}

	if (mime) {
		const arrMime = mime.split("/", 2)
		const [mimeType, mimeSubType] = arrMime

		switch (mimeType) {
			case "image":
				if (displayAs === "preview") {
					return (
						<div className={classes.root}>
							<material.Avatar
								className={classes.avatar}
								src={fileUrl}
							/>
						</div>
					)
				} else if (displayAs === "file") {
					return (
						<div className={classes.root}>
							<material.Badge
								overlap="circle"
								anchorOrigin={{
									vertical: "bottom",
									horizontal: "right",
								}}
								badgeContent={
									<div>
										<label htmlFor={id}>
											<input
												type="file"
												accept="image/*"
												className={classes.input}
												id={id}
												name={id}
												onChange={(e) =>
													handleChange(
														e.target.files,
														fieldId,
														record,
														wire,
														uesio,
														fileCollection
													)
												}
											/>
											<material.Avatar
												className={classes.smallavatar}
											>
												<Edit />
											</material.Avatar>
										</label>
									</div>
								}
							>
								<material.Avatar
									className={classes.avatar}
									src={fileUrl}
								/>
							</material.Badge>
						</div>
					)
				}
				break
			case "application":
				if (displayAs === "preview") {
					return (
						<div className={classes.root}>
							<material.Avatar className={classes.avatar}>
								{iconJsx}
							</material.Avatar>
						</div>
					)
				}

				if (mimeSubType === "pdf") {
					return <iframe src={fileUrl} width="100%" height="500px" />
				} else {
					return (
						<material.Button
							variant="contained"
							color="primary"
							href={fileUrl}
							endIcon={iconJsx}
						>
							Download
						</material.Button>
					)
				}
				break
			default:
		}
	}

	return null
}

export default File
