importScripts('/games/proxy/scramjet.codecs.js');

self.__scramjet$config = {
    prefix: '/games/proxy/scramjet/',
    codec: self.__scramjet$codecs.plain,
    config: '/games/proxy/scramjet.config.js',
    bundle: '/games/proxy/scramjet.bundle.js',
    worker: '/games/proxy/sw.js',
    client: '/games/proxy/scramjet.client.js',
    codecs: '/games/proxy/scramjet.codecs.js',
};

importScripts('/games/proxy/scramjet.worker.js');
