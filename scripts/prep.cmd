echo >/dev/null # >nul & GOTO WINDOWS & rem ^
echo 'Processing for Linux'

# Marshalling tests need to use built node_sqlite3.node, but bindings helper
# doesn't look in the right place.  There's probably a smart way to fix this,
# but since this only affects tests of our fork, this script just makes a
# link in the place where marshalling tests expect.

set -e

expected=$(echo "console.log('node-v' + process.versions.modules + '-' + process.platform + '-' + process.arch)" | node)
if [ ! -e lib/binding/$expected/node_sqlite3.node ]; then
  cd lib/binding
  target=$(find . -iname "node_sqlite3.node" | head -n1)
  mkdir -p $expected
  ln -s ../$target $expected/node_sqlite3.node
  echo Added lib/binding/$expected/node_sqlite3.node
  cd ../..
fi

if [ ! -e build ]; then
  ln -s build-tmp-napi-v6 build
  echo Added build
fi

exit 0

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

:WINDOWS
echo "Processing for Windows"

REM Do Windows CMD commands here... for example:
SET StartDir=%cd%

REM Then, when all Windows commands are complete... the script is done.
