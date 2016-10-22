FROM alpine:3.4

ADD . /app

RUN apk update \
 && apk add nodejs \
 && rm /var/cache/apk/*

RUN cd /app \
 && npm install --production \
 && rm -Rf ~/.npm \
 && cd /app/node_modules \
 && find . -type f | grep '/test/' | xargs rm \
 && find . -type f -iname readme.md | xargs rm \
 && find . -type f -iname license | xargs rm

WORKDIR /app

EXPOSE 80

CMD ["node", "restapir.js"]
