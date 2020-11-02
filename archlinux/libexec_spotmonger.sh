#!/usr/bin/env bash

# set directories for scripts.
INI_FILES=${INI:-"/etc/systemjack"}
SCRIPT_DIR=${SCRIPTS:-"/usr/lib/systemjack"}

# load functions and environment
. "${SCRIPT_DIR}/functions.sh"
. "${INI_FILES}/env.sh"

# and, go!

spotmonger=$(which spotmonger)

if [ -z $DISPLAY ]; then
	die "spotmonger requires a GUI setup"
fi

if [ -x "$spotmonger" ]; then
	exec $spotmonger
else
	die "spotmonger binary not executable or not found"
fi
