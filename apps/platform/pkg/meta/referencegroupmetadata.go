package meta

import "gopkg.in/yaml.v3"

type ReferenceGroupMetadataWrapper ReferenceGroupMetadata

type ReferenceGroupMetadata struct {
	Collection string `yaml:"collection,omitempty" json:"uesio/studio.collection"`
	Field      string `yaml:"field,omitempty" json:"uesio/studio.field"`
	OnDelete   string `yaml:"onDelete,omitempty" json:"uesio/studio.ondelete"`
	Namespace  string `yaml:"-" json:"-"`
}

func (r *ReferenceGroupMetadata) UnmarshalYAML(node *yaml.Node) error {
	var err error
	r.Collection, err = pickRequiredMetadataItem(node, "collection", r.Namespace)
	if err != nil {
		return err
	}
	r.Field, err = pickRequiredMetadataItem(node, "field", r.Namespace)
	if err != nil {
		return err
	}

	return node.Decode((*ReferenceGroupMetadataWrapper)(r))
}

func (r *ReferenceGroupMetadata) MarshalYAML() (interface{}, error) {
	r.Collection = removeDefault(GetLocalizedKey(r.Collection, r.Namespace), "uesio/core.platform")
	r.Field = removeDefault(GetLocalizedKey(r.Field, r.Namespace), "uesio/core.platform")
	return (*ReferenceGroupMetadataWrapper)(r), nil
}
