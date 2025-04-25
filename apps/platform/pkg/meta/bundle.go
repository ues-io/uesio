package meta

import (
	"errors"
	"fmt"
	"strings"
)

func NewBundle(namespace string, major, minor, patch int, description string) (*Bundle, error) {

	return &Bundle{
		App: &App{
			BuiltIn: BuiltIn{
				UniqueKey: namespace,
			},
		},
		Major:       major,
		Minor:       minor,
		Patch:       patch,
		Description: description,
	}, nil
}

func ParseVersionString(version string) (string, string, string, error) {
	//Remove the 'v' and split on dots
	if !strings.HasPrefix(version, "v") {
		return "", "", "", errors.New("Invalid version string")
	}
	parts := strings.Split(strings.Split(version, "v")[1], ".")
	if len(parts) != 3 {
		return "", "", "", errors.New("Invalid version string")
	}
	return parts[0], parts[1], parts[2], nil
}

type Bundle struct {
	BuiltIn     `yaml:",inline"`
	Major       int               `json:"uesio/studio.major"`
	Minor       int               `json:"uesio/studio.minor"`
	Patch       int               `json:"uesio/studio.patch"`
	App         *App              `json:"uesio/studio.app"`
	Description string            `json:"uesio/studio.description"`
	Version     string            `json:"uesio/studio.version"`
	Contents    *UserFileMetadata `json:"uesio/studio.contents"`
}

func (b *Bundle) GetVersionString() string {
	return fmt.Sprintf("v%v.%v.%v", b.Major, b.Minor, b.Patch)
}

func (b *Bundle) GetCollectionName() string {
	return BUNDLE_COLLECTION_NAME
}

func (b *Bundle) GetCollection() CollectionableGroup {
	return &BundleCollection{}
}

func (b *Bundle) SetField(fieldName string, value any) error {
	return StandardFieldSet(b, fieldName, value)
}

func (b *Bundle) GetField(fieldName string) (any, error) {
	return StandardFieldGet(b, fieldName)
}

func (b *Bundle) Loop(iter func(string, any) error) error {
	return StandardItemLoop(b, iter)
}

func (b *Bundle) Len() int {
	return StandardItemLen(b)
}

func (b *Bundle) UnmarshalJSON(data []byte) error {
	type alias Bundle
	return refScanner((*alias)(b), data)
}
