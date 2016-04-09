# Device updater with using GitHub as upstream

# Check the connection
curl -o /dev/null https://github.com/odentools/
if [ $? -ne 0 ]; then
	echo "[Updater] Could not connect to GitHub"
	exit 0
fi

# Stop the process when an error occurred
set -eu

# Get the current revision
before_rev=`git show -s --format=%H`

# Update
echo "[Updater] Checking..."
git fetch origin master
git reset --hard FETCH_HEAD

# Install the dependencies
echo "[Updater] Install dependencies..."
npm instal --production

# Compare the current revision
rev=`git show -s --format=%H`
echo ""

if [ ${rev} != ${before_rev} ]; then
	echo "[Updater] Updated; New revision is ${rev}"
else
	echo "[Updater] Update checked; Current revision is latest"
fi

exit 0
