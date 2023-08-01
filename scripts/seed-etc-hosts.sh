# Adds local subdomains to /etc/hosts so that they resolve
all_hosts="uesio-dev.com studio.uesio-dev.com www.uesio-dev.com docs.uesio-dev.com tests.uesio-dev.com"
sudo echo "127.0.0.1 $all_hosts" | sudo tee -a /etc/hosts