const cacheName = self.location.pathname
const pages = [

  "/docs/example/",
  "/docs/example/spring-boot/spring-boot%E4%B9%8Bweb%E6%9C%8D%E5%8A%A1%E5%99%A8%E7%9A%84%E5%90%AF%E5%8A%A8%E6%B5%81%E7%A8%8B%E5%88%86%E6%9E%90/",
  "/docs/example/table-of-contents/with-toc/",
  "/docs/example/spring-boot/spring-boot%E4%B9%8Bdispatcherhandler%E5%88%86%E6%9E%90%E4%B8%8Egateway%E5%AE%9E%E7%8E%B0/",
  "/docs/example/table-of-contents/without-toc/",
  "/docs/example/spring-boot/spring-boo%E4%B8%ADembed-tomcat%E7%9A%84%E5%8A%A0%E8%BD%BD%E6%B5%81%E7%A8%8B%E5%88%86%E6%9E%90/",
  "/docs/example/spring-boot/",
  "/posts/creating-a-new-theme/",
  "/posts/migrate-from-jekyll/",
  "/docs/example/table-of-contents/",
  "/docs/example/spring-boot/spring-boot-%E5%AF%B9%E4%BA%8Eaop-%E7%9A%84%E8%A7%A3%E6%9E%90%E5%8E%9F%E7%90%86/",
  "/docs/example/spring-boot/spring-boot%E4%B8%AD%E7%9A%84%E5%B7%A5%E5%85%B7%E7%B1%BB-propertymapper/",
  "/docs/example/collapsed/",
  "/",
  "/posts/",
  "/posts/goisforlovers/",
  "/categories/",
  "/categories/development/",
  "/tags/development/",
  "/posts/hugoisforlovers/",
  "/tags/go/",
  "/categories/golang/",
  "/tags/golang/",
  "/tags/hugo/",
  "/tags/",
  "/tags/templates/",
  "/tags/themes/",
  "/docs/example/collapsed/3rd-level/4th-level/",
  "/docs/example/collapsed/3rd-level/",
  "/docs/example/hidden/",
  "/docs/shortcodes/",
  "/docs/shortcodes/buttons/",
  "/docs/shortcodes/columns/",
  "/docs/shortcodes/details/",
  "/docs/shortcodes/experimental/",
  "/docs/shortcodes/experimental/asciinema/",
  "/docs/shortcodes/experimental/badges/",
  "/docs/shortcodes/experimental/cards/",
  "/docs/shortcodes/experimental/images/",
  "/docs/shortcodes/hints/",
  "/docs/shortcodes/mermaid/",
  "/docs/shortcodes/section/",
  "/docs/shortcodes/section/first-page/",
  "/docs/shortcodes/section/second-page/",
  "/docs/shortcodes/steps/",
  "/docs/shortcodes/tabs/",
  "/docs/",
  "/docs/shortcodes/katex/",
  "/showcases/",
  "/book.min.cc2c524ed250aac81b23d1f4af87344917b325208841feca0968fe450f570575.css",
  "/en.search-data.min.bba4380bb259754d9b3068a7e5226c72bfe6cc4196942058ea5cc322b7a66633.json",
  "/en.search.min.548e0a397bbc874d14ba736e1d68c59c55eb62eddb0c4a61bdb7891ecd5c1c00.js",
  
];

self.addEventListener("install", function (event) {
  self.skipWaiting();

  caches.open(cacheName).then((cache) => {
    return cache.addAll(pages);
  });
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  /**
   * @param {Response} response
   * @returns {Promise<Response>}
   */
  function saveToCache(response) {
    if (cacheable(response)) {
      return caches
        .open(cacheName)
        .then((cache) => cache.put(request, response.clone()))
        .then(() => response);
    } else {
      return response;
    }
  }

  /**
   * @param {Error} error
   */
  function serveFromCache(error) {
    return caches.open(cacheName).then((cache) => cache.match(request.url));
  }

  /**
   * @param {Response} response
   * @returns {Boolean}
   */
  function cacheable(response) {
    return response.type === "basic" && response.ok && !response.headers.has("Content-Disposition")
  }

  event.respondWith(fetch(request).then(saveToCache).catch(serveFromCache));
});
