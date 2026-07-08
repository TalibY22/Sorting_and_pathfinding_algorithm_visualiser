FROM docker.io/library/nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY index.html  /usr/share/nginx/html/
COPY style.css   /usr/share/nginx/html/
COPY app.js      /usr/share/nginx/html/

# Ensure nginx worker (non-root) can read the files
RUN chmod -R 755 /usr/share/nginx/html

RUN sed -i 's/listen\s*80;/listen 8080;/' /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]