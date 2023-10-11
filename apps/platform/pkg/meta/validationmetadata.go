package meta

type ValidationMetadata struct {
	Type      string `yaml:"type,omitempty" json:"uesio/studio.type"`
	Regex     string `yaml:"regex,omitempty" json:"uesio/studio.regex"`
	SchemaUri string `yaml:"schemaUri,omitempty" json:"uesio/studio.schema_uri"`
}
