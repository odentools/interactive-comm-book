# Device updater with using GitHub as upstream

set -eu

# Check the connection
curl -o /dev/null https://github.com/odentools/
if [ $? -ne 0 ]; then
	echo "[Updater] Could not connect to GitHub"
	exit 0
fi

# Get the current revision
before_rev=`git show -s --format=%H`

# Update
echo "[Updater] Checking..."
git fetch origin master
git reset --hard FETCH_HEAD

# Compare the current revision
rev=`git show -s --format=%H`
echo ""

if [ ${rev} != ${before_rev} ]; then
	echo "[Updater] Updated; New revision is ${rev}"
else
	echo "[Updater] Update checked; Current revision is latest"
fi

exit 0
