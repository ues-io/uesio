package meta

type FileMetadata struct {
	Accept     string `yaml:"accept,omitempty" json:"uesio/studio.accept"`
	FileSource string `yaml:"filesource,omitempty" json:"uesio/studio.filesource"`
}
