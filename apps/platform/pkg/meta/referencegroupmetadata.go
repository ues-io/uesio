package meta

type ReferenceGroupMetadata struct {
	Collection string `yaml:"collection,omitempty" json:"uesio/studio.collection"`
	Field      string `yaml:"field,omitempty" json:"uesio/studio.field"`
	OnDelete   string `yaml:"onDelete,omitempty" json:"uesio/studio.ondelete"`
}
