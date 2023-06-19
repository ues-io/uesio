package auth

import (
	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"reflect"
	"testing"
)

func Test_createUser(t *testing.T) {
	type args struct {
		username     string
		email        string
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
			"should populate all fields",
			args{
				username: "luigi.vampa",
				email:    "luigi@ues.io",
				signupMethod: &meta.SignupMethod{
					BundleableBase: meta.BundleableBase{
						Name:      "platform",
						Namespace: "uesio/core",
					},
					Profile: "Standard",
				},
			},
			&meta.User{
				Username:  "luigi.vampa",
				Email:     "luigi@ues.io",
				FirstName: "Luigi",
				Profile:   "Standard",
				LastName:  "Vampa",
				Language:  "en",
				Type:      "PERSON",
			},
			"",
		},
		{
			"should default to using username for both first and last if delimiters not matched",
			args{
				username: "xycj",
				email:    "luigi@ues.io",
				signupMethod: &meta.SignupMethod{
					BundleableBase: meta.BundleableBase{
						Name:      "platform",
						Namespace: "uesio/core",
					},
					Profile: "Standard",
				},
			},
			&meta.User{
				Username:  "xycj",
				Email:     "luigi@ues.io",
				FirstName: "Xycj",
				Profile:   "Standard",
				LastName:  "Xycj",
				Language:  "en",
				Type:      "PERSON",
			},
			"",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := createUser(tt.args.username, tt.args.email, tt.args.signupMethod)
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
