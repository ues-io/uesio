package meta

type AutoNumberMetadata struct {
	Prefix string `yaml:"prefix,omitempty" json:"uesio/studio.prefix"`
}

var DefaultAutoNumberMetadata = AutoNumberMetadata{Prefix: ""}
