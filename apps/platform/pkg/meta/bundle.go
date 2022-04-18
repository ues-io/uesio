package meta

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

func getPartsFromVersion(version string) ([]int, error) {
	errorObj := errors.New("version must be formatted like so: v#.#.#, gave: " + version)
	if !strings.HasPrefix(version, "v") {
		return nil, errorObj
	}
	version = strings.TrimPrefix(version, "v")
	parts := strings.Split(version, ".")
	if len(parts) != 3 {
		return nil, errorObj
	}
	partsAsNums := make([]int, 3)
	for i, part := range parts {
		asInt, err := strconv.Atoi(part)
		if err != nil {
			return nil, errorObj
		}
		partsAsNums[i] = asInt
	}
	return partsAsNums, nil
}

func NewBundle(namespace, version, description string) (*Bundle, error) {
	versionParts, err := getPartsFromVersion(version)
	if err != nil {
		return nil, err
	}
	return &Bundle{
		App: &App{
			ID: namespace,
		},
		Major:       strconv.Itoa(versionParts[0]),
		Minor:       strconv.Itoa(versionParts[1]),
		Patch:       strconv.Itoa(versionParts[2]),
		Description: description,
	}, nil
}

type Bundle struct {
	ID          string    `uesio:"uesio/core.id"`
	Major       string    `uesio:"uesio/studio.major"`
	Minor       string    `uesio:"uesio/studio.minor"`
	Patch       string    `uesio:"uesio/studio.patch"`
	App         *App      `uesio:"uesio/studio.app"`
	Description string    `uesio:"uesio/studio.description"`
	Version     string    `uesio:"uesio/studio.version"`
	itemMeta    *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy   *User     `yaml:"-" uesio:"uesio/core.createdby"`
	Owner       *User     `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy   *User     `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt   int64     `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt   int64     `yaml:"-" uesio:"uesio/core.createdat"`
}

func (b *Bundle) GetVersionString() string {
	return fmt.Sprintf("v%s.%s.%s", b.Major, b.Minor, b.Patch)
}

func (b *Bundle) GetNextPatchVersionString() (string, error) {
	patch, err := strconv.Atoi(b.Patch)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("v%s.%s.%s", b.Major, b.Minor, strconv.Itoa(patch+1)), nil
}

func (b *Bundle) GetCollectionName() string {
	return b.GetCollection().GetName()
}

func (b *Bundle) GetCollection() CollectionableGroup {
	var bc BundleCollection
	return &bc
}

func (b *Bundle) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(b, fieldName, value)
}

func (b *Bundle) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(b, fieldName)
}

func (b *Bundle) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(b, iter)
}

func (b *Bundle) Len() int {
	return StandardItemLen(b)
}

func (b *Bundle) GetItemMeta() *ItemMeta {
	return b.itemMeta
}

func (b *Bundle) SetItemMeta(itemMeta *ItemMeta) {
	b.itemMeta = itemMeta
}
