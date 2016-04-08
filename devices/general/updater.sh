# Device updater with using GitHub as upstream

set -eu

curl https://github.com/odentools/
if [ $? -ne 0 ]; then
	echo "Could not connect to GitHub"
	exit 0
fi

echo "Updating..."
git fetch origin master
git reset --hard FETCH_HEAD

exit 0
