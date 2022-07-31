# syntax = docker/dockerfile:1.4
FROM node:14-alpine as deps

ENV NODE_ENV production
WORKDIR /usr/src

RUN apk --update --no-cache add git
COPY package.json yarn.lock ./

RUN yarn install --production

# ---
FROM deps as builder

ENV NODE_ENV build

COPY . .
RUN yarn install
RUN yarn build

# ---

FROM deps as runtime

COPY --from=builder /usr/src/dist/ /usr/src/dist/

CMD ["yarn", "start:prod"]
