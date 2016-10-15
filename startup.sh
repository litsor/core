#!/bin/bash
docker run --name testredis -d -p 6379:6379 redis > /dev/null
docker run --name testrethinkdb -d -p 28015:28015 rethinkdb > /dev/null
mkdir /tmp/cache
