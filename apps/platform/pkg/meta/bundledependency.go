package meta

import "fmt"

type BundleDependency struct {
	ID        string     `uesio:"uesio/core.id"`
	UniqueKey string     `yaml:"-" uesio:"uesio/core.uniquekey"`
	Workspace *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	App       *App       `yaml:"-" uesio:"uesio/studio.app"`
	Bundle    *Bundle    `uesio:"uesio/studio.bundle"`
	itemMeta  *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64      `yaml:"-" uesio:"uesio/core.createdat"`
}

func (b *BundleDependency) GetVersionString() string {
	bundle := b.Bundle
	if bundle == nil {
		return ""
	}
	return fmt.Sprintf("v%v.%v.%v", bundle.Major, bundle.Minor, bundle.Patch)
}

func (b *BundleDependency) GetBundleName() string {
	if b.Bundle == nil || b.Bundle.App == nil {
		return ""
	}
	return b.Bundle.App.UniqueKey
}

func (b *BundleDependency) GetAppName() string {
	if b.App == nil {
		return ""
	}
	return b.App.FullName
}

func (b *BundleDependency) GetCollectionName() string {
	return b.GetCollection().GetName()
}

func (b *BundleDependency) GetCollection() CollectionableGroup {
	var bc BundleDependencyCollection
	return &bc
}

func (b *BundleDependency) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(b, fieldName, value)
}

func (b *BundleDependency) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(b, fieldName)
}

func (b *BundleDependency) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(b, iter)
}

func (b *BundleDependency) Len() int {
	return StandardItemLen(b)
}

func (b *BundleDependency) GetItemMeta() *ItemMeta {
	return b.itemMeta
}

func (b *BundleDependency) SetItemMeta(itemMeta *ItemMeta) {
	b.itemMeta = itemMeta
}
