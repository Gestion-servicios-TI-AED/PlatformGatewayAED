# Plataforma AED — Gateway

Punto de entrada único para unificar las apps de AED bajo un solo dominio,
sin fusionar sus códigos ni sus despliegues. Decisión y contexto completo
discutidos con el usuario el 2026-09-30 (ver historial de esa conversación
si hace falta el razonamiento completo) — resumen:

- **Backends separados, siempre.** Cada app maneja datos de un dominio de
  negocio distinto (RR.HH., Cartera, contratos...) — no hay razón para
  mezclarlos en un solo backend/base de datos sin importar la estrategia de
  frontend.
- **Etapa 1 (esto, lo que hay hoy en este repo): gateway con ruteo por
  path.** Un solo dominio, cada app bajo su propio prefijo
  (`/hrsm`, `/cartera`, ...), reenviado tal cual al contenedor de esa app
  — CERO cambios al backend de cada app, solo 2 build-args nuevos en el
  frontend (`VITE_API_BASE_URL`, `VITE_BASE_PATH`) para que sepa que no
  vive en la raíz. Esto da un dominio unificado, pero **cruzar de una app a
  otra sigue recargando la página completa** — es una limitación real del
  navegador al cruzar de un "path" a otro solo si son apps servidas por
  separado (no hay problema de origen cruzado porque comparten dominio,
  pero cada una es un bundle de JS distinto).
- **Etapa 2 (a futuro, NO empezada todavía): shell compartido con
  micro-frontends** (tipo Module Federation) para navegación sin recargas
  entre apps + nav persistente. Deliberadamente fuera de alcance de esta
  etapa — se decidió no arrancar por ahí directo porque es mucho más
  grande/riesgoso, y esta etapa 1 ya entrega valor real (dominio único) sin
  ese costo.
- **SSO (login único vía Azure AD):** completamente independiente de
  todo esto — funciona igual de bien con o sin gateway. Ver el módulo
  `auth.azure.js` de Solicitudes de Contratación como referencia, ya tiene
  parte de esto armado.

## Landing (React + Vite)

`gateway/` es una app React + Vite (mismo stack que las demás apps de AED,
tokens, `Badge` y `Field` copiados de la plantilla de diseño compartida, ver `DESIGN.md`). El `Dockerfile` la compila y
sirve el resultado con nginx, que además hace el ruteo por path. El catálogo
de tarjetas vive en `gateway/src/apps.js`: para habilitar una app, cambiar su
`estado` a `'disponible'` y poner su `href`. Desarrollo: `cd gateway && npm
install && npm run dev` (puerto 5190).

## Cómo se conecta una app nueva al gateway

1. En el `vite.config.js` del frontend de esa app, confirmar que lee
   `VITE_BASE_PATH` para `base` (copiar el patrón de HRMS si no lo tiene).
2. En su `main.jsx`, `<BrowserRouter basename={import.meta.env.BASE_URL}>`
   (mismo patrón que HRMS).
3. En su `Dockerfile`, agregar el `ARG`/`ENV` `VITE_BASE_PATH` junto al que
   ya tenga para `VITE_API_BASE_URL` (ver el Dockerfile de HRMS).
4. Acá en `gateway/nginx.conf.template`: agregar un bloque `location
   /esa-app/` nuevo (copiar el de `/hrsm/`, cambiar el nombre de la
   variable de upstream).
5. En `gateway/src/apps.js`, marcar su tarjeta como `disponible` con su `href`.
6. Pasarle a esa app, al buildear su imagen, `VITE_API_BASE_URL=/esa-app/api`
   y `VITE_BASE_PATH=/esa-app/`.

## Probar localmente

```
docker compose up --build
```

Requiere las variables de entorno reales de HRMS disponibles en el shell
(`PGHOST`, `PGPASSWORD`, etc. — las mismas de `3. SISTEMA DE GESTIÓN DE
RECURSOS HUMANOS/backend/.env`) para que el contenedor de HRMS pueda migrar
y conectar a la base. Después: `http://localhost:8080/` (landing) y
`http://localhost:8080/hrsm/` (HRMS real, funcionando bajo el prefijo).

## Producción (Coolify)

Desplegado como su propio recurso Docker en Coolify (Build Pack: Dockerfile,
Base Directory `/gateway`, Dockerfile Location `/Dockerfile`, Ports Exposes
`80`). Coolify usa Caddy como proxy de borde (no Traefik).

**`HRMS_UPSTREAM` en producción es el DOMINIO PÚBLICO de HRMS** (ej.
`xxxxx.tu-servidor.sslip.io`), NO `hrms:3000` como en local — descubierto
en vivo (2026-09-30): Coolify aísla cada "Project" en su propia red Docker,
y el gateway y HRMS quedaron en proyectos distintos, así que el nombre de
red interna ("hrms") nunca resuelve (`host not found in upstream`). Salir
por el dominio público de HRMS funciona sin importar en qué proyecto esté
cada app — el tráfico vuelve a entrar por el mismo Caddy del servidor, que
lo rutea al contenedor correcto por Host header (por eso
`proxy_set_header Host ${HRMS_UPSTREAM}` en vez de `$host` — ver el
comentario en `nginx.conf.template`). Si en algún momento se ponen todas
las apps bajo el mismo Project de Coolify, se podría volver a nombres de
red interna, pero no es necesario: el dominio público funciona igual de
bien y es más robusto a como esté organizado Coolify.

## Conectar Cartera (2026-10-06)

Cartera ya soporta el prefijo (`VITE_BASE_PATH`, `basename` del router y
cookies propias `cartera_*`), asi que el cambio fue solo del lado del gateway:
bloque `location /cartera/` en `nginx.conf.template` (con
`client_max_body_size 50m` y timeouts de 300 s, porque Cartera sube Excel de
hasta 50 MB y sincroniza con Zoho/HubSpot), tarjeta en `src/apps.js` y servicio
`cartera` en `docker-compose.yml` para probar en local.

**Orden de despliegue en Coolify (importante):**
1. Cartera: agregar los build-args `VITE_API_BASE_URL=/cartera/api` y
   `VITE_BASE_PATH=/cartera/` y redeployar (se incrustan al compilar). Mientras
   tanto, al mismo dominio propio de Cartera sigue sirviendo la app con esos
   valores, asi que conviene decidir si se mantiene su dominio directo o se
   deja solo bajo el gateway.
2. Gateway: definir la variable `CARTERA_UPSTREAM` (dominio publico de Cartera,
   sin `https://`) **antes** de redeployar el gateway. Sin ella, nginx no arranca
   (`${CARTERA_UPSTREAM}` queda vacio en el `proxy_pass`).
3. Cartera: `CORS_ORIGIN` ya no importa para el acceso por el gateway (mismo
   origen), pero mantenerlo en el dominio del gateway si se accede por ahi.
