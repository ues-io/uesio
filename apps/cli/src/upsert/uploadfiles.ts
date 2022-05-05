import path from "path"
import fs from "fs"

import type { definition } from "@uesio/ui"
import archiver from "archiver"

const uploadFiles = async (dirname: string, spec: definition.UploadSpec) => {
	if (!spec.collection) {
		console.log("No collection specified", spec)
		throw new Error("No collection specified")
	}

	// Read all the files from a folder

	// Create a zip file that contains data and metadata
	const archive = archiver("zip", {
		zlib: { level: 9 }, // Sets the compression level.
	})

	// good practice to catch warnings (ie stat failures and other non-blocking errors)
	archive.on("warning", (err) => {
		if (err.code === "ENOENT") {
			// log warning
		} else {
			// throw error
			throw err
		}
	})

	// good practice to catch this error explicitly
	archive.on("error", (err) => {
		throw err
	})

	// Here we add to the archive
	const files = await fs.promises
		.readdir(path.resolve(dirname))
		.catch(() => [])

	for (const filename of files) {
		const fileparts = path.parse(filename)
		console.log("Found File:", fileparts.name)
		const fullpath = path.resolve(dirname, filename)
		archive.append(fs.createReadStream(fullpath), { name: filename })
	}

	archive.finalize()

	console.log("Uploading Files...", dirname, spec)
	// Start a new job
	return archive
}

export { uploadFiles }
