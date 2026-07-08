

FROM docker.io/library/nginx:alpine

# Remove the default Nginx placeholder page
RUN rm -rf /usr/share/nginx/html/*

COPY index.html  /usr/share/nginx/html/
COPY style.css   /usr/share/nginx/html/
COPY app.js      /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
