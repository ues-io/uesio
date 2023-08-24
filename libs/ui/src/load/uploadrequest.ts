type UploadRequest = {
	collectionID: string
	recordID: string
	fieldID?: string
	params?: Record<string, string>
}

export type { UploadRequest }
