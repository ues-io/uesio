package meta

import (
	"errors"

	"gopkg.in/yaml.v3"
)

func NewSignupMethod(key string) (*SignupMethod, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for SignupMethod: " + key)
	}
	return NewBaseSignupMethod(namespace, name), nil
}

func NewBaseSignupMethod(namespace, name string) *SignupMethod {
	return &SignupMethod{BundleableBase: NewBase(namespace, name)}
}

type EmailTemplateOptions struct {
	EmailSubject string `yaml:"emailSubject" json:"uesio/studio.emailsubject"`
	EmailBody    string `yaml:"emailBody" json:"uesio/studio.emailbody"`
	Redirect     string `yaml:"redirect" json:"uesio/studio.redirect"`
}
type SignupMethod struct {
	AuthSource       string               `yaml:"authsource" json:"uesio/studio.authsource"`
	Profile          string               `yaml:"profile" json:"uesio/studio.profile"`
	UsernameTemplate string               `yaml:"usernameTemplate" json:"uesio/studio.usernametemplate"`
	LandingRoute     string               `yaml:"landingRoute" json:"uesio/studio.landingroute"`
	UsernameRegex    string               `yaml:"usernameRegex" json:"uesio/studio.usernameregex"`
	AdminCreate      EmailTemplateOptions `yaml:"adminCreate" json:"uesio/studio.admincreate"`
	Signup           EmailTemplateOptions `yaml:"signup" json:"uesio/studio.signup"`
	ForgotPassword   EmailTemplateOptions `yaml:"forgotPassword" json:"uesio/studio.forgotpassword"`
	BuiltIn          `yaml:",inline"`
	BundleableBase   `yaml:",inline"`
}

type SignupMethodWrapper SignupMethod

func (sm *SignupMethod) GetCollectionName() string {
	return SIGNUPMETHOD_COLLECTION_NAME
}

func (sm *SignupMethod) GetBundleFolderName() string {
	return SIGNUPMETHOD_FOLDER_NAME
}

func (sm *SignupMethod) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(sm, fieldName, value)
}

func (sm *SignupMethod) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(sm, fieldName)
}

func (sm *SignupMethod) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(sm, iter)
}

func (sm *SignupMethod) Len() int {
	return StandardItemLen(sm)
}

func (sm *SignupMethod) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, sm.Name)
	if err != nil {
		return err
	}
	return node.Decode((*SignupMethodWrapper)(sm))
}
