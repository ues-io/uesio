package meta

import (
	"fmt"
)

func NewBundle(namespace string, major, minor, patch int, description string) (*Bundle, error) {

	return &Bundle{
		App: &App{
			UniqueKey: namespace,
		},
		Major:       major,
		Minor:       minor,
		Patch:       patch,
		Description: description,
	}, nil
}

type Bundle struct {
	ID          string    `uesio:"uesio/core.id"`
	UniqueKey   string    `yaml:"-" uesio:"uesio/core.uniquekey"`
	Major       int       `uesio:"uesio/studio.major"`
	Minor       int       `uesio:"uesio/studio.minor"`
	Patch       int       `uesio:"uesio/studio.patch"`
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
	return fmt.Sprintf("v%v.%v.%v", b.Major, b.Minor, b.Patch)
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
