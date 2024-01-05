package auth

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseHost(t *testing.T) {

	type testCase struct {
		name                string
		description         string
		host                string
		expected_domainType string
		expected_domain     string
		expected_subdomain  string
	}

	var tests = []testCase{
		{
			"Scenario A",
			"Sub-Domain with Port",
			"studio.ues.io:3000",
			"subdomain",
			"ues.io:3000",
			"studio",
		},
		{
			"Scenario B",
			"Domain with Port",
			"uesio-dev.com:3000",
			"domain",
			"uesio-dev.com:3000",
			"",
		},
		{
			"Scenario C",
			"Domain with WWW. & Port",
			"www.thecloudmasters.com:3000",
			"domain",
			"www.thecloudmasters.com:3000",
			"",
		},
		{
			"Scenario D",
			"Sub-Domain no Port",
			"studio.ues.io",
			"subdomain",
			"ues.io",
			"studio",
		},
		{
			"Scenario E",
			"Domain no Port",
			"uesio-dev.com",
			"domain",
			"uesio-dev.com",
			"",
		},
		{
			"Scenario F",
			"Domain with WWW. and no Port",
			"www.thecloudmasters.com",
			"domain",
			"www.thecloudmasters.com",
			"",
		},
		{
			"Scenario G",
			"Scenario with www, port and subdomain",
			"www.hello.site.com",
			"domain",
			"www.hello.site.com",
			"",
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			domainType, domain, subdomain, _ := parseHost(tc.host)
			assert.Equal(t, domainType, tc.expected_domainType)
			assert.Equal(t, domain, tc.expected_domain)
			assert.Equal(t, subdomain, tc.expected_subdomain)
		})
	}
}
