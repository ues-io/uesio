package auth

import (
	"reflect"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func Test_createUser(t *testing.T) {
	type args struct {
		username     string
		firstName    string
		lastName     string
		email        string
		jobTitle     string
		company      string
		noEmployees  string
		country      string
		signupMethod *meta.SignupMethod
	}
	tests := []struct {
		name    string
		args    args
		want    *meta.User
		wantErr string
	}{
		{
			"signup method has no profile - should return error",
			args{
				signupMethod: &meta.SignupMethod{
					BundleableBase: meta.BundleableBase{
						Name:      "platform",
						Namespace: "uesio/core",
					},
				},
			},
			nil,
			"signup method uesio/core.platform is missing the profile property",
		},
		{
			"Missing the property firstName - should return error",
			args{
				lastName:    "uesio",
				email:       "luigi@ues.io",
				jobTitle:    "dev",
				noEmployees: "10",
				country:     "switzerland",
				username:    "xycj",
				signupMethod: &meta.SignupMethod{
					BundleableBase: meta.BundleableBase{
						Name:      "platform",
						Namespace: "uesio/core",
					},
					Profile: "Standard",
				},
			},
			nil,
			"Missing the property First Name",
		},
		{
			"Missing the properties: jobTitle, company, noEmployees - shouldn't return error",
			args{
				firstName: "luigi",
				lastName:  "uesio",
				email:     "luigi@ues.io",
				country:   "switzerland",
				username:  "xycj",
				signupMethod: &meta.SignupMethod{
					BundleableBase: meta.BundleableBase{
						Name:      "platform",
						Namespace: "uesio/core",
					},
					Profile: "Standard",
				},
			},
			&meta.User{
				FirstName: "Luigi",
				LastName:  "Uesio",
				Email:     "luigi@ues.io",
				Country:   "Switzerland",
				Username:  "xycj",
				Profile:   "Standard",
				Language:  "en",
				Type:      "PERSON",
			},
			"",
		},
		{
			"should populate all fields",
			args{
				firstName:   "luigi",
				lastName:    "uesio",
				email:       "luigi@ues.io",
				jobTitle:    "dev",
				company:     "TCM",
				noEmployees: "10",
				country:     "switzerland",
				username:    "xycj",
				signupMethod: &meta.SignupMethod{
					BundleableBase: meta.BundleableBase{
						Name:      "platform",
						Namespace: "uesio/core",
					},
					Profile: "Standard",
				},
			},
			&meta.User{
				FirstName:   "Luigi",
				LastName:    "Uesio",
				Email:       "luigi@ues.io",
				JobTitle:    "Dev",
				Company:     "TCM",
				NoEmployees: "10",
				Country:     "Switzerland",
				Username:    "xycj",
				Profile:     "Standard",
				Language:    "en",
				Type:        "PERSON",
			},
			"",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := createUser(tt.args.username, tt.args.email, tt.args.signupMethod, tt.args.firstName, tt.args.lastName, tt.args.country, tt.args.company, tt.args.jobTitle, tt.args.noEmployees)
			if tt.wantErr != "" {
				if err != nil {
					assert.Equal(t, tt.wantErr, err.Error())
				} else {
					t.Errorf("createUser() error = %v, wantErr %v", err, tt.wantErr)
				}
				return
			}
			if !reflect.DeepEqual(*got, *tt.want) {
				t.Errorf("createUser() got = %v, want %v", got, tt.want)
			}
		})
	}
}
