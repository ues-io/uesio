package meta

type SubField struct {
	Name       string                 `yaml:"name,omitempty" json:"uesio/studio.name"`
	Label      string                 `yaml:"label,omitempty" json:"uesio/studio.label"`
	Type       string                 `yaml:"type,omitempty" json:"uesio/studio.type"`
	SelectList string                 `yaml:"selectList,omitempty" json:"uesio/studio.selectlist"`
	Number     *NumberMetadata        `yaml:"number,omitempty" json:"uesio/studio.number"`
	Metadata   *MetadataFieldMetadata `yaml:"metadata,omitempty" json:"uesio/studio.metadata"`
}

func (s *SubField) IsZero() bool {
	return s == nil
}
