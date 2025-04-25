package meta

import (
	"gopkg.in/yaml.v3"
)

type ReferenceMetadataWrapper ReferenceMetadata

type ReferenceMetadata struct {
	Collection      string   `yaml:"collection,omitempty" json:"uesio/studio.collection"`
	MultiCollection bool     `yaml:"multiCollection,omitempty" json:"uesio/studio.multicollection"`
	CollectionsRefs []string `yaml:"collections,omitempty" json:"uesio/studio.collections"`
	Namespace       string   `yaml:"-" json:"-"`
}

func (r *ReferenceMetadata) UnmarshalYAML(node *yaml.Node) error {
	var err error
	r.MultiCollection = GetNodeValueAsBool(node, "multiCollection", false)
	if r.MultiCollection {
		if collections := pickMetadataItems(node, "collections", r.Namespace); len(collections) > 0 {
			r.CollectionsRefs = collections
		}
	} else {
		r.Collection, err = pickRequiredMetadataItem(node, "collection", r.Namespace)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *ReferenceMetadata) MarshalYAML() (any, error) {
	if r.MultiCollection {
		if len(r.CollectionsRefs) > 0 {
			for i := range r.CollectionsRefs {
				r.CollectionsRefs[i] = GetLocalizedKey(r.CollectionsRefs[i], r.Namespace)
			}
		}
	} else {
		r.Collection = GetLocalizedKey(r.Collection, r.Namespace)
	}
	return (*ReferenceMetadataWrapper)(r), nil
}
