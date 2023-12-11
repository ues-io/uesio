package meta

import (
	"gopkg.in/yaml.v3"
)

type ReferenceMetadataWrapper ReferenceMetadata

type ReferenceMetadata struct {
	Collection      string   `yaml:"collection,omitempty" json:"uesio/studio.collection"`
	MultiCollection bool     `yaml:"multicollection,omitempty" json:"uesio/studio.multicollection"`
	CollectionsRefs []string `yaml:"collections,omitempty" json:"uesio/studio.collections"`
	Namespace       string   `yaml:"-" json:"-"`
}

func (r *ReferenceMetadata) UnmarshalYAML(node *yaml.Node) error {
	var err error
	r.MultiCollection = GetNodeValueAsBool(node, "multicollection", false)
	if !r.MultiCollection {
		r.Collection, err = pickRequiredMetadataItem(node, "collection", r.Namespace)
		if err != nil {
			return err
		}
	}
	return node.Decode((*ReferenceMetadataWrapper)(r))
}

func (r *ReferenceMetadata) MarshalYAML() (interface{}, error) {
	r.Collection = removeDefault(GetLocalizedKey(r.Collection, r.Namespace), "uesio/core.platform")
	return (*ReferenceMetadataWrapper)(r), nil
}
