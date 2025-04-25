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

type SignupMethod struct {
	BuiltIn                   `yaml:",inline"`
	BundleableBase            `yaml:",inline"`
	AuthSource                string `yaml:"authsource" json:"uesio/studio.authsource"`
	Profile                   string `yaml:"profile,omitempty" json:"uesio/studio.profile"`
	UsernameTemplate          string `yaml:"usernameTemplate,omitempty" json:"uesio/studio.usernametemplate"`
	LandingRoute              string `yaml:"landingRoute,omitempty" json:"uesio/studio.landingroute"`
	AutoLogin                 bool   `yaml:"autoLogin" json:"uesio/studio.autologin"`
	EnableSelfSignup          bool   `yaml:"enableSelfSignup" json:"uesio/studio.enableselfsignup"`
	UsernameRegex             string `yaml:"usernameRegex,omitempty" json:"uesio/studio.usernameregex"`
	UsernameFormatExplanation string `yaml:"usernameFormatExplanation,omitempty" json:"uesio/studio.usernameformatexplanation"`
	CreateLoginBot            string `yaml:"createLoginBot,omitempty" json:"uesio/studio.createloginbot"`
	SignupBot                 string `yaml:"signupBot,omitempty" json:"uesio/studio.signupbot"`
	ResetPasswordBot          string `yaml:"resetPasswordBot,omitempty" json:"uesio/studio.resetpasswordbot"`
}

type SignupMethodWrapper SignupMethod

func (sm *SignupMethod) GetCollection() CollectionableGroup {
	return &SignupMethodCollection{}
}

func (sm *SignupMethod) GetCollectionName() string {
	return SIGNUPMETHOD_COLLECTION_NAME
}

func (sm *SignupMethod) GetBundleFolderName() string {
	return SIGNUPMETHOD_FOLDER_NAME
}

func (sm *SignupMethod) SetField(fieldName string, value any) error {
	return StandardFieldSet(sm, fieldName, value)
}

func (sm *SignupMethod) GetField(fieldName string) (any, error) {
	return StandardFieldGet(sm, fieldName)
}

func (sm *SignupMethod) Loop(iter func(string, any) error) error {
	return StandardItemLoop(sm, iter)
}

func (sm *SignupMethod) Len() int {
	return StandardItemLen(sm)
}

func (sm *SignupMethod) UnmarshalYAML(node *yaml.Node) error {
	if err := validateNodeName(node, sm.Name); err != nil {
		return err
	}
	if err := node.Decode((*SignupMethodWrapper)(sm)); err != nil {
		return err
	}
	sm.AuthSource = GetFullyQualifiedKey(sm.AuthSource, sm.Namespace)
	sm.CreateLoginBot = GetFullyQualifiedKey(sm.CreateLoginBot, sm.Namespace)
	sm.SignupBot = GetFullyQualifiedKey(sm.SignupBot, sm.Namespace)
	sm.ResetPasswordBot = GetFullyQualifiedKey(sm.ResetPasswordBot, sm.Namespace)
	sm.LandingRoute = GetFullyQualifiedKey(sm.LandingRoute, sm.Namespace)
	sm.Profile = GetFullyQualifiedKey(sm.Profile, sm.Namespace)
	return nil
}

func (sm *SignupMethod) MarshalYAML() (any, error) {
	sm.AuthSource = GetLocalizedKey(sm.AuthSource, sm.Namespace)
	sm.CreateLoginBot = GetLocalizedKey(sm.CreateLoginBot, sm.Namespace)
	sm.SignupBot = GetLocalizedKey(sm.SignupBot, sm.Namespace)
	sm.ResetPasswordBot = GetLocalizedKey(sm.ResetPasswordBot, sm.Namespace)
	sm.LandingRoute = GetLocalizedKey(sm.LandingRoute, sm.Namespace)
	sm.Profile = GetLocalizedKey(sm.Profile, sm.Namespace)
	return (*SignupMethodWrapper)(sm), nil
}
