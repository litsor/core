FROM alpine:3.9

ADD core/package.json /app/core/
ADD core/package-lock.json /app/core/

RUN apk update \
 && apk add nodejs-current nodejs-npm make gcc g++ python \
 && cd /app/core \
 && npm ci --production \
 && apk del nodejs-npm make gcc g++ python \
 && rm -Rf ~/.npm \
 && cd /app/core/node_modules \
 && find . -type f | grep '/test/' | xargs rm \
 && find . -type f -iname readme.md | xargs rm \
 && find . -type f -iname changelog.md | xargs rm \
 && find . -type f -iname history.md | xargs rm \
 && find . -type f -iname license | xargs rm \
 && rm /var/cache/apk/* \
 && echo '#!/bin/ash' > /usr/bin/repl \
 && echo 'node /app/core/repl.js' >> /usr/bin/repl \
 && chmod +x /usr/bin/repl

ADD . /app

WORKDIR /app

EXPOSE 80

CMD ["node", "litsor.js"]
