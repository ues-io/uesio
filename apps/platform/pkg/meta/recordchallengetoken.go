package meta

import (
	"fmt"
	"path"
)

func NewRecordChallengeToken(collectionKey, key string) (*RecordChallengeToken, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, fmt.Errorf("bad key for record challenge token: %s : %s", collectionKey, key)
	}
	return NewBaseRecordChallengeToken(collectionKey, namespace, name), nil
}

func NewBaseRecordChallengeToken(collectionKey, namespace, name string) *RecordChallengeToken {
	return &RecordChallengeToken{BundleableBase: NewBase(namespace, name), CollectionRef: collectionKey}
}

type RecordChallengeToken struct {
	BuiltIn         `yaml:",inline"`
	BundleableBase  `yaml:",inline"`
	CollectionRef   string            `yaml:"-" json:"uesio/studio.collection"`
	Conditions      []*TokenCondition `yaml:"conditions"  json:"uesio/studio.conditions"`
	Token           string            `yaml:"token"  json:"uesio/studio.token"`
	UserAccessToken string            `yaml:"useraccesstoken" json:"uesio/studio.useraccesstoken"`
	Access          string            `yaml:"access" json:"uesio/studio.access"`
}

func (rct *RecordChallengeToken) GetCollection() CollectionableGroup {
	return &RecordChallengeTokenCollection{}
}

func (rct *RecordChallengeToken) GetCollectionName() string {
	return RECORDCHALLENGETOKEN_COLLECTION_NAME
}

func (rct *RecordChallengeToken) GetBundleFolderName() string {
	return RECORDCHALLENGETOKEN_FOLDER_NAME
}

func (rct *RecordChallengeToken) GetPath() string {
	collectionNamespace, collectionName, _ := ParseKey(rct.CollectionRef)
	nsUser, appName, _ := ParseNamespace(collectionNamespace)
	return path.Join(nsUser, appName, collectionName, rct.Name) + ".yaml"
}

func (rct *RecordChallengeToken) SetField(fieldName string, value any) error {
	return StandardFieldSet(rct, fieldName, value)
}

func (rct *RecordChallengeToken) GetField(fieldName string) (any, error) {
	return StandardFieldGet(rct, fieldName)
}

func (rct *RecordChallengeToken) Loop(iter func(string, any) error) error {
	return StandardItemLoop(rct, iter)
}

func (rct *RecordChallengeToken) Len() int {
	return StandardItemLen(rct)
}
