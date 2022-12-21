package meta

import (
	"fmt"
	"strings"
)

type UserFileMetadata struct {
	ID            string    `json:"uesio/core.id"`
	UniqueKey     string    `json:"uesio/core.uniquekey"`
	CollectionID  string    `json:"uesio/core.collectionid"`
	MimeType      string    `json:"uesio/core.mimetype"`
	FieldID       string    `json:"uesio/core.fieldid"`
	FileSourceID  string    `json:"uesio/core.filesourceid"`
	Path          string    `json:"uesio/core.path"`
	RecordID      string    `json:"uesio/core.recordid"`
	Type          string    `json:"uesio/core.type"`
	CreatedBy     *User     `json:"uesio/core.createdby"`
	Owner         *User     `json:"uesio/core.owner"`
	UpdatedBy     *User     `json:"uesio/core.updatedby"`
	UpdatedAt     int64     `json:"uesio/core.updatedat"`
	CreatedAt     int64     `json:"uesio/core.createdat"`
	itemMeta      *ItemMeta `json:"-"`
	ContentLength int64     `json:"uesio/core.contentlength"`
}

func (ufm *UserFileMetadata) GetCollectionName() string {
	return ufm.GetCollection().GetName()
}

func (ufm *UserFileMetadata) GetCollection() CollectionableGroup {
	return &UserFileMetadataCollection{}
}

func (ufm *UserFileMetadata) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ufm, fieldName, value)
}

func (ufm *UserFileMetadata) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ufm, fieldName)
}

func (ufm *UserFileMetadata) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ufm, iter)
}

func (ufm *UserFileMetadata) Len() int {
	return StandardItemLen(ufm)
}

func (ufm *UserFileMetadata) GetItemMeta() *ItemMeta {
	return ufm.itemMeta
}

func (ufm *UserFileMetadata) SetItemMeta(itemMeta *ItemMeta) {
	ufm.itemMeta = itemMeta
}

func (ufm *UserFileMetadata) GetFullPath(tenantID string) string {
	tenantPath := strings.ReplaceAll(tenantID, ":", "/")
	collectionPath := strings.ReplaceAll(ufm.CollectionID, ".", "/")
	fieldPath := strings.ReplaceAll(ufm.FieldID, ".", "/")
	if ufm.FieldID != "" {
		return fmt.Sprintf("files/%s/%s/%s/field/%s/%s", tenantPath, collectionPath, ufm.RecordID, fieldPath, ufm.Path)
	}
	return fmt.Sprintf("files/%s/%s/%s/attachment/%s", tenantPath, collectionPath, ufm.RecordID, ufm.Path)
}
