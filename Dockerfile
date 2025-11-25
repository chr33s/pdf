# docker buildx build --platform linux/amd64 --tag pdf . --load

FROM node:22

RUN apt-get update && apt-get install -y make openjdk-17-jre-headless

WORKDIR /usr/local/app
RUN chown node:node /usr/local/app
COPY --chown=node:node . .
USER node

SHELL ["/bin/bash", "-l", "-c"]
# RUN npm ci --include=dev
RUN npm install
RUN npm run check
ENV EMSDK=/usr/local/app/emsdk
ENV EMSCRIPTEN_ROOT=$EMSDK/upstream/emscripten
ENV PATH=$PATH:$EMSDK:$EMSCRIPTEN_ROOT
RUN git clone https://github.com/emscripten-core/emsdk.git && \
		cd emsdk && \
		git checkout 4.0.20 && \
		./emsdk install 4.0.20 && \
		./emsdk activate 4.0.20 --permanent && \
		perl -pi -e "s|NODE_JS = emsdk_path \+ '/node/[^']*/bin/node'|NODE_JS = 'node'|" "$EMSDK/.emscripten" && \
		echo "source \"$EMSDK/emsdk_env.sh\"" >> $HOME/.bash_profile && \
		source "$EMSDK/emsdk_env.sh" && \
		emcc --version
RUN git submodule update --init --recursive
RUN npm run workspace build
RUN npm run workspace test
