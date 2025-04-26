package platform

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_passwordPolicyValidation(t *testing.T) {
	tests := []struct {
		name     string
		password string
		expected error
	}{
		{
			name:     "Valid Password",
			password: "ValidPassword123!",
			expected: nil,
		},
		{
			name:     "Invalid Password - Too Short",
			password: "Short1!",
			expected: errors.New("at least 8 characters"),
		},
		{
			name:     "Invalid Password - No Uppercase",
			password: "invalidpassword123!",
			expected: errors.New("at least 1 upper case"),
		},
		{
			name:     "Invalid Password - No Lowercase",
			password: "INVALIDPASSWORD123!",
			expected: errors.New("at least 1 lower case"),
		},
		{
			name:     "Invalid Password - No special character",
			password: "ValidPassword123",
			expected: errors.New("at least 1 special character"),
		},
		{
			name:     "Invalid Password - Invalid special character (space)",
			password: "Valid Password123",
			expected: errors.New("at least 1 special character"),
		},
		{
			name:     "Invalid Password - No number",
			password: "ValidPassword!",
			expected: errors.New("at least 1 number"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := passwordPolicyValidation(tt.password)
			if tt.expected != nil {
				assert.ErrorContains(t, result, tt.expected.Error())
			} else {
				assert.Nil(t, result)
			}

		})
	}
}
