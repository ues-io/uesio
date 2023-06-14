package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"testing"
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
			args{},
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
			"allow major version increase with minor/patch set to 0",
			args{
				lastBundle: &meta.Bundle{
					Major: 1,
					Minor: 2,
					Patch: 2,
				},
				params: map[string]interface{}{
					"major":       2,
					"minor":       0,
					"patch":       0,
					"description": "Major release",
				},
			},
			2,
			0,
			0,
			"Major release",
		},
		{
			"allow minor version increase with patch set to 0",
			args{
				lastBundle: &meta.Bundle{
					Major: 1,
					Minor: 2,
					Patch: 2,
				},
				params: map[string]interface{}{
					"major":       1,
					"minor":       3,
					"patch":       0,
					"description": "Minor release",
				},
			},
			1,
			3,
			0,
			"Minor release",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotMajor, gotMinor, gotPatch, gotDescription := resolveBundleParameters(tt.args.params, tt.args.lastBundle)
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
