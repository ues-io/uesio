package meta

type SubField struct {
	Name       string `yaml:"name,omitempty" json:"uesio/studio.name"`
	Label      string `yaml:"label,omitempty" json:"uesio/studio.label"`
	Type       string `yaml:"type,omitempty" json:"uesio/studio.type"`
	SelectList string `yaml:"selectList,omitempty" json:"uesio/studio.selectlist"`
}
