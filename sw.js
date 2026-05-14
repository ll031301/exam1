// 社工考试题库 PWA - Service Worker
// 使用 cache-first 策略实现离线缓存

const CACHE_NAME = 'shegong-tiku-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安装事件：预缓存所有资源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] 预缓存资源');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(function() {
      // 立即激活，不等待旧的 Service Worker 被替换
      return self.skipWaiting();
    })
  );
});

// 激活事件：清理旧版本缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName !== CACHE_NAME;
        }).map(function(cacheName) {
          console.log('[SW] 删除旧缓存:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      // 立即控制所有页面
      return self.clients.claim();
    })
  );
});

// 请求拦截：cache-first 策略
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        // 缓存命中，直接返回缓存内容
        return cachedResponse;
      }
      // 缓存未命中，尝试从网络获取
      return fetch(event.request).then(function(networkResponse) {
        // 只缓存同源的成功响应
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(function() {
        // 网络请求失败，返回离线提示（仅对导航请求）
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
