# syntax=docker/dockerfile:1

# Imagen oficial de nginx: cualquier archivo en /etc/nginx/templates/*.template
# se procesa con envsubst (reemplaza las variables ${...}) y el resultado se
# escribe en /etc/nginx/conf.d/ al arrancar el contenedor -- asi el mismo
# Dockerfile sirve para local y para Coolify, solo cambian las env vars.
FROM nginx:1.27-alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY index.html /usr/share/nginx/html/index.html
COPY aed-logo.png /usr/share/nginx/html/aed-logo.png

EXPOSE 80
