package file

import (
	"testing"
)

func TestFileRequest_TreatAsImmutable(t *testing.T) {
	tests := []struct {
		name        string
		fileRequest *FileRequest
		want        bool
	}{
		{
			"treat resources without a version as mutable",
			&FileRequest{
				Version: "",
			},
			false,
		},
		{
			"treat non-uesio resources with a version as immutable",
			&FileRequest{
				Version:   "v0.0.1",
				Namespace: "zach/foo",
			},
			true,
		},
		{
			"treat uesio resources with a version of v0.0.1 as mutable",
			&FileRequest{
				Version:   "v0.0.1",
				Namespace: "uesio/studio",
			},
			false,
		},
		{
			"treat uesio resources with any other version as immutable",
			&FileRequest{
				Version:   "abcd1234",
				Namespace: "uesio/studio",
			},
			true,
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			if got := tt.fileRequest.TreatAsImmutable(); got != tt.want {
				t.Errorf("TreatAsImmutable() = %v, want %v", got, tt.want)
			}
		})
	}
}
