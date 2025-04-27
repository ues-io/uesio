package meta

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/types/credentials"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

var apiKeyLocalMetadataNames = TrimYamlString(`
name: somecredential
type: API_KEY
apiKey:
    key: somesecret
    location: header
    locationName: Authorization
    locationValue: Bearer ${apikey}
entries:
    defaultSpaceId:
        type: configvalue
        value: someconfigvalue
`)

var apiKeyQualifiedMetadataReferences = TrimYamlString(`
name: somecredential
type: API_KEY
apiKey:
    key: luigi/foo.somesecret
    location: header
    locationName: Authorization
    locationValue: Bearer ${apikey}
entries:
    defaultSpaceId:
        type: configvalue
        value: luigi/foo.someconfigvalue
`)

var apiKeyThisAppMetadataReferences = TrimYamlString(`
name: somecredential
type: API_KEY
apiKey:
    key: this/app.somesecret
    location: header
    locationName: Authorization
    locationValue: Bearer ${apikey}
entries:
    defaultSpaceId:
        type: configvalue
        value: this/app.someconfigvalue
`)

var oauthFullyQualifiedNames = TrimYamlString(`
name: somecredential
type: OAUTH2_CREDENTIALS
oauth2:
    clientId: luigi/foo.clientid
    clientSecret: luigi/foo.clientsecret
    tokenUrl: luigi/foo.tokenurl
    authorizeUrl: luigi/foo.authorizeurl
    scopes: luigi/foo.scopes
entries:
    otherThing:
        type: configvalue
        value: luigi/foo.somethingelse
`)

func TestCredentialUnmarshal(t *testing.T) {

	type testCase struct {
		name        string
		description string
		yamlString  string
		path        string
		namespace   string
		expected    *Credential
		expectedErr error
	}

	var tests = []testCase{
		{
			"fully-qualify local references",
			"Make sure all local metadata references are fully-qualified with the credential's namespace",
			apiKeyLocalMetadataNames,
			"somecredential.yaml",
			"my/namespace",
			&Credential{
				BundleableBase: BundleableBase{
					Name:      "somecredential",
					Namespace: "my/namespace",
				},
				Type: "API_KEY",
				APIKey: &credentials.APIKeyCredentials{
					Key:           "my/namespace.somesecret",
					Location:      "header",
					LocationName:  "Authorization",
					LocationValue: "Bearer ${apikey}",
				},
				Entries: map[string]*credentials.CredentialEntry{
					"defaultSpaceId": {
						Type:  "configvalue",
						Value: "my/namespace.someconfigvalue",
					},
				},
			},
			nil,
		},
		{
			"unlocalize this/app, replace with credential's namespace",
			"Make sure references with this/app are replaced with the credential's namespace",
			apiKeyThisAppMetadataReferences,
			"somecredential.yaml",
			"my/namespace",
			&Credential{
				BundleableBase: BundleableBase{
					Name:      "somecredential",
					Namespace: "my/namespace",
				},
				Type: "API_KEY",
				APIKey: &credentials.APIKeyCredentials{
					Key:           "my/namespace.somesecret",
					Location:      "header",
					LocationName:  "Authorization",
					LocationValue: "Bearer ${apikey}",
				},
				Entries: map[string]*credentials.CredentialEntry{
					"defaultSpaceId": {
						Type:  "configvalue",
						Value: "my/namespace.someconfigvalue",
					},
				},
			},
			nil,
		},
		{
			"leave fully qualified namespaces alone",
			"Make sure references with an actual namespace are unchanged",
			apiKeyQualifiedMetadataReferences,
			"somecredential.yaml",
			"my/namespace",
			&Credential{
				BundleableBase: BundleableBase{
					Name:      "somecredential",
					Namespace: "my/namespace",
				},
				Type: "API_KEY",
				APIKey: &credentials.APIKeyCredentials{
					Key:           "luigi/foo.somesecret",
					Location:      "header",
					LocationName:  "Authorization",
					LocationValue: "Bearer ${apikey}",
				},
				Entries: map[string]*credentials.CredentialEntry{
					"defaultSpaceId": {
						Type:  "configvalue",
						Value: "luigi/foo.someconfigvalue",
					},
				},
			},
			nil,
		},
		{
			"credential name/file path mismatch",
			"Fail if our name doesn't match our file path",
			apiKeyLocalMetadataNames,
			"somecredential_badname.yaml",
			"my/namespace",
			nil,
			exceptions.NewBadRequestException("metadata name does not match filename: somecredential, somecredential_badname", nil),
		},
	}

	for _, tc := range tests {
		t.Run(tc.description, func(t *testing.T) {
			initial := (&CredentialCollection{}).GetItemFromPath(tc.path, tc.namespace)
			err := yaml.Unmarshal([]byte(tc.yamlString), initial)
			if tc.expectedErr != nil {
				assert.Equal(t, tc.expectedErr, err)
				return
			}
			if err != nil {
				assert.Nil(t, err, "Unexpected failure unmarshalling: %s", err.Error())
			} else {
				assert.EqualValues(t, initial, tc.expected)
			}
		})
	}
}

func TestCredentialMarshal(t *testing.T) {

	type testCase struct {
		name              string
		description       string
		initial           *Credential
		expectedString    string
		expectedPath      string
		expectedNamespace string
	}

	var tests = []testCase{
		{
			"apiKey: local metadata references",
			"all credentials should be fully localized",
			&Credential{
				BundleableBase: BundleableBase{
					Name:      "somecredential",
					Namespace: "my/namespace",
				},
				Type: "API_KEY",
				APIKey: &credentials.APIKeyCredentials{
					Key:           "somesecret",
					Location:      "header",
					LocationName:  "Authorization",
					LocationValue: "Bearer ${apikey}",
				},
				Entries: map[string]*credentials.CredentialEntry{
					"defaultSpaceId": {
						Name:  "defaultSpaceId",
						Type:  "configvalue",
						Value: "someconfigvalue",
					},
				},
			},
			apiKeyLocalMetadataNames,
			"somecredential.yaml",
			"my/namespace",
		},
		{
			"apiKey: fully-qualified metadata references",
			"fully-qualified references to other namespaces should be retained",
			&Credential{
				BundleableBase: BundleableBase{
					Name:      "somecredential",
					Namespace: "my/namespace",
				},
				Type: "API_KEY",
				APIKey: &credentials.APIKeyCredentials{
					Key:           "luigi/foo.somesecret",
					Location:      "header",
					LocationName:  "Authorization",
					LocationValue: "Bearer ${apikey}",
				},
				Entries: map[string]*credentials.CredentialEntry{
					"defaultSpaceId": {
						Name:  "defaultSpaceId",
						Type:  "configvalue",
						Value: "luigi/foo.someconfigvalue",
					},
				},
			},
			apiKeyQualifiedMetadataReferences,
			"somecredential.yaml",
			"my/namespace",
		},
	}

	for _, tc := range tests {
		t.Run(tc.description, func(t *testing.T) {

			result, err := yaml.Marshal(tc.initial)
			if err != nil {
				t.Errorf("Unexpected failure marshalling: %s", err.Error())
			}
			assert.Equal(t, tc.expectedString, string(result))
			assert.Equal(t, tc.expectedPath, tc.initial.GetPath())
			assert.Equal(t, tc.expectedNamespace, tc.initial.GetNamespace())
		})
	}

}

func TestCredentialRoundTrip(t *testing.T) {
	type testCase struct {
		name       string
		path       string
		namespace  string
		yamlString string
	}

	var tests = []testCase{
		{
			"round-trip with local references",
			"somecredential.yaml",
			"my/namespace",
			apiKeyLocalMetadataNames,
		},
		{
			"round-trip with fully-qualified names",
			"somecredential.yaml",
			"my/namespace",
			oauthFullyQualifiedNames,
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.name, func(t *testing.T) {
			initial := (&CredentialCollection{}).GetItemFromPath(tc.path, tc.namespace)
			err := yaml.Unmarshal([]byte(tc.yamlString), initial)
			if err != nil {
				t.Errorf("Unexpected failure unmarshalling: %s", err.Error())
			}

			result, err := yaml.Marshal(initial)
			if err != nil {
				t.Errorf("Unexpected failure marshalling: %s", err.Error())
			}
			assert.Equal(t, tc.yamlString, string(result))
		})
	}
}
