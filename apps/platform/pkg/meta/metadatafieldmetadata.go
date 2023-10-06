package meta

type MetadataFieldMetadata struct {
	Type     string `yaml:"type" json:"uesio/studio.type"`
	Grouping string `yaml:"grouping,omitempty" json:"uesio/studio.grouping"`
}

func (n *MetadataFieldMetadata) IsZero() bool {
	return n.Type == "" && n.Grouping == ""
}
