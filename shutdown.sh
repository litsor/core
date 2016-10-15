#!/bin/bash
rm -Rf /tmp/cache
docker stop testredis > /dev/null 2>&1
docker stop testrethinkdb > /dev/null 2>&1
docker rm testredis > /dev/null 2>&1
docker rm testrethinkdb > /dev/null 2>&1
echo ""
