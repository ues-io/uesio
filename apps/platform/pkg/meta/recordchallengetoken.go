package meta

import (
	"errors"
)

func NewRecordChallengeToken(key string) (*RecordChallengeToken, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Record Challeng Token: " + key)
	}
	return NewBaseRecordChallengeToken(namespace, name), nil
}

func NewBaseRecordChallengeToken(namespace, name string) *RecordChallengeToken {
	return &RecordChallengeToken{BundleableBase: NewBase(namespace, name)}
}

type RecordChallengeToken struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	//Type            string            `yaml:"type" json:"uesio/studio.type"` //TO-DO is this even used?
	Collection      string            `yaml:"collection" json:"uesio/studio.collection"`
	Conditions      []*TokenCondition `yaml:"conditions"  json:"uesio/studio.conditions"`
	Token           string            `yaml:"token"  json:"uesio/studio.token"`
	UserAccessToken string            `yaml:"useraccesstoken" json:"uesio/studio.useraccesstoken"` //TO-DO userAccessToken lower or upper
	Access          string            `yaml:"access" json:"uesio/studio.access"`
}

func (rct *RecordChallengeToken) GetCollectionName() string {
	return RECORDCHALLENGETOKEN_COLLECTION_NAME
}

func (rct *RecordChallengeToken) GetBundleFolderName() string {
	return RECORDCHALLENGETOKEN_FOLDER_NAME
}

func (rct *RecordChallengeToken) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(rct, fieldName, value)
}

func (rct *RecordChallengeToken) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(rct, fieldName)
}

func (rct *RecordChallengeToken) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(rct, iter)
}

func (rct *RecordChallengeToken) Len() int {
	return StandardItemLen(rct)
}
