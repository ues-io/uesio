package fileadapt

type FileDetails struct {
	ContentLength   int64
	Path            string `json:"name"`
	CollectionID    string `json:"collectionID"`
	RecordID        string `json:"recordID"`
	RecordUniqueKey string
	FieldID         string            `json:"fieldID"`
	Params          map[string]string `json:"params"`
}
