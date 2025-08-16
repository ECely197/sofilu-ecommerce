# Usamos una imagen oficial de Node.js que incluye todo lo necesario para Puppeteer
FROM ghcr.io/puppeteer/puppeteer:21.5.0

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las dependencias del proyecto
RUN npm install

# Copiamos el resto del código de nuestra aplicación
COPY . .

# Le decimos a Docker que nuestra app correrá en el puerto 3000
EXPOSE 3000

# El comando para iniciar nuestra aplicación
CMD [ "node", "src/server.js" ]