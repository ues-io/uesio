#!/bin/bash

# TODO: This can likely be migrated to use devcert-cli or devcert to simplify the overall approach and have a more reliable registration of 
# trusted certificates based on the local machine.  There is an npm install for the cli or the package can be used via a node script instead
# of a shell script.  There are other tools out there that are similar as well, devcert just one example.
# See https://github.com/davewasmer/devcert-cli & https://github.com/davewasmer/devcert

set -e

# Get script directory and set file paths
SCRIPT_DIR="$( dirname "${BASH_SOURCE[0]:-$0}" )"
CERT_FILE="$SCRIPT_DIR/certificate.crt"
KEY_FILE="$SCRIPT_DIR/private.key"
CONFIG_FILE="$SCRIPT_DIR/config.txt"
domains=()

trust_cert_macos() {
    sudo security add-trusted-cert -d -r trustRoot -k "/Library/Keychains/System.keychain" "$CERT_FILE"
}

trust_cert_linux() {
    # Check common CA certificate directories (e.g. Debian/Ubuntu)
    if [ -d "/usr/local/share/ca-certificates" ]; then
        sudo cp "$CERT_FILE" /usr/local/share/ca-certificates/
        sudo update-ca-certificates
    elif [ -d "/etc/pki/ca-trust/source/anchors" ]; then
        # For RHEL/CentOS/Fedora
        sudo cp "$CERT_FILE" /etc/pki/ca-trust/source/anchors/
        sudo update-ca-trust
    elif [ -d "/etc/ca-certificates/trust-source/anchors" ]; then
        # Arch Linux
        sudo cp "$CERT_FILE" /etc/ca-certificates/trust-source/anchors/
        sudo trust extract-compat       
    else
        echo "Warning: Could not find CA certificate directory. Certificate must be trusted manually."
        return 1
    fi
}

# collect the domains
for domain in "$@"; do
    if [ "${domain}" = "-p" ]; then
      if [[ -z "${UESIO_PRIMARY_DOMAIN}" ]]; then        
          echo "Error: UESIO_PRIMARY_DOMAIN is not set, please make sure its set."
          exit 1
      else 
          domains+=($UESIO_PRIMARY_DOMAIN)                
      fi
    elif [[ "${domain}" == "localhost" ]]; then
        echo "Error: Localhost is included by default, no need to specify it."
        exit 1
    elif ! [[ "$domain" =~ ^([a-zA-Z0-9](-?[a-zA-Z0-9])*\.)+[a-zA-Z]{2,}$ ]]; then
        echo "Error: $domain is invalid. Domain names can only contain valid characters and must be at least two-parts (e.g., mysite.com)."
        exit 1
    else
        domains+=("${domain}")
    fi
done

# Check if certificate exists
if [ -f "$CERT_FILE" ]; then
    read -p "SSL certificate already exists. Delete and continue? (y/N) " answer
    case ${answer:0:1} in
        y|Y )
            rm "$CERT_FILE" "$KEY_FILE"
            echo "Existing certificate deleted."
            ;;
        * )
            echo "Cancelled, existing certificate preserved."
            exit 1
            ;;
    esac
fi

# If domains were provided, we will create a temporary config file with the default alt_names from config.txt 
# plus two for each domain specified - the domain itself and a wildcard for that domain (e.g., mydomain.com & *.mydomain.com)
config_arg="$CONFIG_FILE"
if [ $# -gt 0 ]; then
    # Create temporary config file
    temp_config=$(mktemp)
    trap 'rm -f "$temp_config"' EXIT

    # Copy config file to temp
    cp "$CONFIG_FILE" "$temp_config"

    # Extract complete [alt_names] section
    alt_names=$(awk '/^\[alt_names\]/{p=1;print;next} /^\[/{p=0} p{print}' "$CONFIG_FILE")

    # Get highest DNS number
    dns_count=$(echo "$alt_names" | grep -E '^DNS\.[0-9]+' | 
                sed 's/DNS\.\([0-9]\+\).*/\1/' | sort -rn | head -1)
    dns_count=${dns_count:-0}

    # Deduplicate
    mapfile -t domains < <(printf "%s\n" "${domains[@]}" | awk '!seen[$0]++')

    # Add new domains to alt_names section
    for domain in "${domains[@]}"; do
        dns_count=$((dns_count + 1))
        alt_names+=$'\nDNS.'"${dns_count} = ${domain}"
        dns_count=$((dns_count + 1))
        alt_names+=$'\nDNS.'"${dns_count} = *.${domain}"
    done

    sed '/^\[alt_names\]/,/^\[/{//!d; /^\[alt_names\]/d}' "$CONFIG_FILE" > "$temp_config"
    printf "\n%s\n" "$alt_names" >> "$temp_config"

    config_arg="$temp_config"
fi

# Generate certificate using either original or temp config
openssl req -new -x509 -newkey rsa:2048 -sha256 -nodes \
    -keyout "$KEY_FILE" -days 3560 -out "$CERT_FILE" \
    -config "$config_arg"
echo "SSL Certificate and private key created!"

# Trust the certificate based on OS
if [[ "$(uname)" == "Darwin" ]]; then
    if trust_cert_macos; then
        echo "Certificate trusted in macOS keychain"
    else
        echo "Failed to trust certificate in macOS keychain"
        exit 1
    fi
else
    if trust_cert_linux; then
        echo "Certificate trusted in system CA store"
    else
        echo "Failed to trust certificate. You may need to trust it manually."
        exit 1
    fi
fi

# Show the certificate details
echo "====================================="
openssl x509 -in "$CERT_FILE" -text -noout

