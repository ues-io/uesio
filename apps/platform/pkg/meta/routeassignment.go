package meta

import (
	"fmt"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

func NewRouteAssignment(collectionKey, namespace, viewType string) (*RouteAssignment, error) {
	return NewBaseRouteAssignment(collectionKey, namespace, viewType), nil
}

func NewBaseRouteAssignment(collectionKey, namespace, viewType string) *RouteAssignment {
	return &RouteAssignment{
		BundleableBase: NewBase(namespace, ""),
		Type:           viewType,
		Collection:     collectionKey,
	}
}

type RouteAssignment struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:"-"`
	Type           string `yaml:"type" json:"uesio/studio.type"`
	RouteRef       string `yaml:"route" json:"uesio/studio.route"`
	Collection     string `yaml:"-" json:"uesio/studio.collection"`
}

type RouteAssignmentWrapper RouteAssignment

func (r *RouteAssignment) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s:%s", workspace, r.Collection, r.Type)
}

func (r *RouteAssignment) GetKey() string {
	return fmt.Sprintf("%s:%s.%s", r.Collection, r.Namespace, r.Type)
}

func (r *RouteAssignment) GetPath() string {
	collectionNamespace, collectionName, _ := ParseKey(r.Collection)
	nsUser, appName, _ := ParseNamespace(collectionNamespace)
	return filepath.Join(nsUser, appName, collectionName, r.Type) + ".yaml"
}

func (r *RouteAssignment) GetCollectionName() string {
	return ROUTE_ASSIGNMENT_COLLECTION_NAME
}

func (r *RouteAssignment) GetBundleFolderName() string {
	return ROUTE_ASSIGNMENT_FOLDER_NAME
}

func (r *RouteAssignment) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(r, fieldName, value)
}

func (r *RouteAssignment) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(r, fieldName)
}

func (r *RouteAssignment) Loop(iter func(string, interface{}) error) error {
	itemMeta := r.GetItemMeta()
	for _, fieldName := range ROUTE_ASSIGNMENT_FIELDS {
		if itemMeta != nil && !itemMeta.IsValidField(fieldName) {
			continue
		}
		val, err := r.GetField(fieldName)
		if err != nil {
			return err
		}
		err = iter(fieldName, val)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *RouteAssignment) Len() int {
	return StandardItemLen(r)
}

func (r *RouteAssignment) UnmarshalYAML(node *yaml.Node) error {

	err := setMapNode(node, "collection", r.Collection)
	if err != nil {
		return err
	}
	err = validateRequiredMetadataItem(node, "route")
	if err != nil {
		return err
	}
	return node.Decode((*RouteAssignmentWrapper)(r))
}
