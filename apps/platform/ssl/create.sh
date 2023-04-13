#!/bin/bash

# Generate a new primary key
openssl req -new -x509 -newkey rsa:2048 -sha256 -nodes -keyout private.key -days 3560 -out certificate.crt -config config.txt

# OS X shortcut to automatically trust the certificate
if [[ "$(uname)" == "Darwin" ]]; then 
	sudo security add-trusted-cert -d -r trustRoot -k "/Library/Keychains/System.keychain" "$PWD/certificate.crt"
fi
