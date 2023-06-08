package meta

type ValidationMetadata struct {
	Type  string `yaml:"type,omitempty" json:"uesio/studio.type"`
	Regex string `yaml:"regex,omitempty" json:"uesio/studio.regex"`
}
