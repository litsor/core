FROM alpine:3.4

ADD package.json /app/

RUN apk update \
 && apk add nodejs make gcc g++ python \
 && cd /app \
 && npm install --production \
 && apk del make gcc g++ python \
 && rm -Rf ~/.npm \
 && cd /app/node_modules \
 && find . -type f | grep '/test/' | xargs rm \
 && find . -type f -iname readme.md | xargs rm \
 && find . -type f -iname changelog.md | xargs rm \
 && find . -type f -iname history.md | xargs rm \
 && find . -type f -iname license | xargs rm \
 && rm -Rf dicer/test \
 && rm -Rf dicer/bench \
 && rm -Rf bluebird/js/browser \
 && rm -Rf ~/.node-gyp \
 && rm /var/cache/apk/*

ADD . /app

WORKDIR /app

EXPOSE 80

CMD ["node", "restapir.js"]
