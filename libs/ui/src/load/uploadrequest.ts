type UploadRequest = {
	collectionID: string
	recordID: string
	fieldID?: string
	overwrite?: boolean
	params?: Record<string, string>
}

export type { UploadRequest }
