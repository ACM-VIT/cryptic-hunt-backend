FROM node:16

# Create Directory for the Container
WORKDIR /usr/src/app

# Only copy the package.json file to work directory
COPY package.json .

# Install all Packages
RUN npm i

# Copy all other source code to work directory
COPY . .

# Migrate Prisma
RUN npx prisma generate

# run the server
CMD ["npm", "start"] 

EXPOSE 8081