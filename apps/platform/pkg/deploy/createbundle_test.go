package deploy

import (
	"testing"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

func Test_resolveBundleParameters(t *testing.T) {
	type args struct {
		params     map[string]interface{}
		lastBundle *meta.Bundle
	}
	tests := []struct {
		name            string
		args            args
		wantMajor       int
		wantMinor       int
		wantPatch       int
		wantDescription string
	}{
		{
			"no params or previous bundle",
			args{
				params: map[string]interface{}{},
			},
			0,
			0,
			1,
			"",
		},
		{
			"use most recent bundle if major/minor/patch are not ALL provided and valid",
			args{
				lastBundle: &meta.Bundle{
					Major: 1,
					Minor: 2,
					Patch: 2,
				},
				params: map[string]interface{}{
					"major":       2,
					"minor":       3,
					"patch":       "fooooo",
					"description": "great new version",
				},
			},
			1,
			2,
			3,
			"great new version",
		},
		{
			"use most recent bundle if params does NOT include valid major/minor/patch",
			args{
				lastBundle: &meta.Bundle{
					Major: 1,
					Minor: 2,
					Patch: 2,
				},
				params: map[string]interface{}{
					"major":       2,
					"minor":       3,
					"description": "another",
				},
			},
			1,
			2,
			3,
			"another",
		},
		{
			"use major/minor/patch from params ONLY if they are all valid",
			args{
				lastBundle: &meta.Bundle{
					Major: 1,
					Minor: 2,
					Patch: 2,
				},
				params: map[string]interface{}{
					"major": 2,
					"minor": 3,
					"patch": 4,
				},
			},
			2,
			3,
			4,
			"",
		},
		{
			"allow custom major release",
			args{
				lastBundle: &meta.Bundle{
					Major: 1,
					Minor: 2,
					Patch: 2,
				},
				params: map[string]interface{}{
					"major":       2,
					"minor":       1,
					"patch":       1,
					"description": "Major release",
				},
			},
			2,
			1,
			1,
			"Major release",
		},
		{
			"allow custom minor release",
			args{
				lastBundle: &meta.Bundle{
					Major: 1,
					Minor: 2,
					Patch: 2,
				},
				params: map[string]interface{}{
					// Use string values to simulate requests from the Studio UI
					"major":       "2",
					"minor":       "4",
					"patch":       "5",
					"description": "custom minor release",
				},
			},
			2,
			4,
			5,
			"custom minor release",
		},
		{
			"major release",
			args{
				lastBundle: &meta.Bundle{
					Major: 1,
					Minor: 2,
					Patch: 2,
				},
				params: map[string]interface{}{
					"type":        "major",
					"description": "Spring release",
				},
			},
			2,
			0,
			0,
			"Spring release",
		},
		{
			"minor release",
			args{
				lastBundle: &meta.Bundle{
					Major: 1,
					Minor: 2,
					Patch: 2,
				},
				params: map[string]interface{}{
					"type":        "minor",
					"description": "Spring point release",
				},
			},
			1,
			3,
			0,
			"Spring point release",
		},
		{
			"patch release",
			args{
				lastBundle: &meta.Bundle{
					Major: 1,
					Minor: 2,
					Patch: 2,
				},
				params: map[string]interface{}{
					"type":        "patch",
					"description": "Nightly build",
				},
			},
			1,
			2,
			3,
			"Nightly build",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.args.params["app"] = "testapp"
			tt.args.params["workspaceName"] = "testworkspace"
			options, err := NewCreateBundleOptions(tt.args.params)
			if err != nil {
				t.Errorf("error resolving params %v", err)
				return
			}
			gotMajor, gotMinor, gotPatch, gotDescription := resolveBundleParameters(options, tt.args.lastBundle)
			if gotMajor != tt.wantMajor {
				t.Errorf("resolveBundleParameters() gotMajor = %v, want %v", gotMajor, tt.wantMajor)
			}
			if gotMinor != tt.wantMinor {
				t.Errorf("resolveBundleParameters() gotMinor = %v, want %v", gotMinor, tt.wantMinor)
			}
			if gotPatch != tt.wantPatch {
				t.Errorf("resolveBundleParameters() gotPatch = %v, want %v", gotPatch, tt.wantPatch)
			}
			if gotDescription != tt.wantDescription {
				t.Errorf("resolveBundleParameters() gotDescription = %v, want %v", gotDescription, tt.wantDescription)
			}
		})
	}
}
