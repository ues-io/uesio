package meta

type JobSpec struct {
	JobType    string                  `json:"uesio/core.jobtype"`
	FileType   string                  `json:"uesio/core.filetype"`
	Collection string                  `json:"uesio/core.collection"`
	Mappings   map[string]FieldMapping `json:"uesio/core.mappings"`
}

type JobSpecRequest struct {
	JobType    string                  `json:"jobtype"`
	FileType   string                  `json:"filetype"`
	Collection string                  `json:"collection"`
	Mappings   map[string]FieldMapping `json:"mappings"`
}
