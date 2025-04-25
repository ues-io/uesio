package meta

import "fmt"

type BundleDependency struct {
	BuiltIn   `yaml:",inline"`
	Workspace *Workspace `json:"uesio/studio.workspace"`
	App       *App       `json:"uesio/studio.app"`
	Bundle    *Bundle    `json:"uesio/studio.bundle"`
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

func (b *BundleDependency) GetCollection() CollectionableGroup {
	return &BundleDependencyCollection{}
}

func (b *BundleDependency) GetCollectionName() string {
	return BUNDLEDEPENDENCY_COLLECTION_NAME
}

func (b *BundleDependency) SetField(fieldName string, value any) error {
	return StandardFieldSet(b, fieldName, value)
}

func (b *BundleDependency) GetField(fieldName string) (any, error) {
	return StandardFieldGet(b, fieldName)
}

func (b *BundleDependency) Loop(iter func(string, any) error) error {
	return StandardItemLoop(b, iter)
}

func (b *BundleDependency) Len() int {
	return StandardItemLen(b)
}
