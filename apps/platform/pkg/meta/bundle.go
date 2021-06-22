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
		AppID:       namespace,
		Major:       strconv.Itoa(versionParts[0]),
		Minor:       strconv.Itoa(versionParts[1]),
		Patch:       strconv.Itoa(versionParts[2]),
		Description: description,
	}, nil
}

// Bundle struct
type Bundle struct {
	ID          string    `uesio:"uesio.id"`
	Major       string    `uesio:"uesio.major"`
	Minor       string    `uesio:"uesio.minor"`
	Patch       string    `uesio:"uesio.patch"`
	AppID       string    `uesio:"uesio.appid"`
	Description string    `uesio:"uesio.description"`
	itemMeta    *ItemMeta `yaml:"-" uesio:"-"`
	CreatedBy   *User     `uesio:"uesio.createdby"`
	UpdatedBy   *User     `uesio:"uesio.updatedby"`
	UpdatedAt   int64     `uesio:"uesio.updatedat"`
	CreatedAt   int64     `uesio:"uesio.createdat"`
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

// GetCollectionName function
func (b *Bundle) GetCollectionName() string {
	return b.GetCollection().GetName()
}

// GetCollection function
func (b *Bundle) GetCollection() CollectionableGroup {
	var bc BundleCollection
	return &bc
}

// SetField function
func (b *Bundle) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(b, fieldName, value)
}

// GetField function
func (b *Bundle) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(b, fieldName)
}

// Loop function
func (b *Bundle) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(b, iter)
}

// GetItemMeta function
func (b *Bundle) GetItemMeta() *ItemMeta {
	return b.itemMeta
}

// SetItemMeta function
func (b *Bundle) SetItemMeta(itemMeta *ItemMeta) {
	b.itemMeta = itemMeta
}
