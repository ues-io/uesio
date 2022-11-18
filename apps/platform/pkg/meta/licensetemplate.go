package meta

type LicenseTemplate struct {
	ID           string    `json:"uesio/core.id"`
	UniqueKey    string    `json:"uesio/core.uniquekey"`
	App          *App      `json:"uesio/studio.app"`
	MonthlyPrice float64   `json:"uesio/studio.monthlyprice"`
	AutoCreate   bool      `json:"uesio/studio.autocreate"`
	itemMeta     *ItemMeta `json:"-"`
	CreatedBy    *User     `json:"uesio/core.createdby"`
	Owner        *User     `json:"uesio/core.owner"`
	UpdatedBy    *User     `json:"uesio/core.updatedby"`
	UpdatedAt    int64     `json:"uesio/core.updatedat"`
	CreatedAt    int64     `json:"uesio/core.createdat"`
}

func (lt *LicenseTemplate) GetCollectionName() string {
	return lt.GetCollection().GetName()
}

func (lt *LicenseTemplate) GetCollection() CollectionableGroup {
	return &LicenseTemplateCollection{}
}

func (lt *LicenseTemplate) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(lt, fieldName, value)
}

func (lt *LicenseTemplate) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(lt, fieldName)
}

func (lt *LicenseTemplate) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(lt, iter)
}

func (lt *LicenseTemplate) Len() int {
	return StandardItemLen(lt)
}

func (lt *LicenseTemplate) GetItemMeta() *ItemMeta {
	return lt.itemMeta
}

func (lt *LicenseTemplate) SetItemMeta(itemMeta *ItemMeta) {
	lt.itemMeta = itemMeta
}
