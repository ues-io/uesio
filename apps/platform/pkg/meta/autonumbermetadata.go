package meta

type AutoNumberMetadata struct {
	Prefix       string `yaml:"prefix,omitempty" json:"uesio/studio.prefix"`
	LeadingZeros int    `yaml:"leadingZeros,omitempty" json:"uesio/studio.leadingzeros"`
}

var DefaultAutoNumberMetadata = AutoNumberMetadata{Prefix: "", LeadingZeros: 4}
