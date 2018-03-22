FROM alpine:3.7

ADD package.json /app/

RUN apk update \
 && apk add nodejs nodejs-npm \
 && cd /app \
 && npm install --production \
 && apk del nodejs-npm \
 && rm -Rf ~/.npm \
 && cd /app/node_modules \
 && find . -type f | grep '/test/' | xargs rm \
 && find . -type f -iname readme.md | xargs rm \
 && find . -type f -iname changelog.md | xargs rm \
 && find . -type f -iname history.md | xargs rm \
 && find . -type f -iname license | xargs rm \
 && rm /var/cache/apk/*

ADD . /app

WORKDIR /app

EXPOSE 80

CMD ["node", "restapir.js"]
