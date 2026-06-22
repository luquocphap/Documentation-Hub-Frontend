FROM node:24.14.1-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN mkdir -p public/lib/webviewer \
    && cp -R node_modules/@pdftron/webviewer/public/. public/lib/webviewer/

EXPOSE 5173

CMD ["sh", "-c", "npm run build && npm run preview -- --host 0.0.0.0 --port 5173"]