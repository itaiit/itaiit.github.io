---
title: Spring Boo中embed tomcat的加载流程分析
weight: 3
---

# Spring Boo中embed tomcat的加载流程分析
我们来了解一下spring boot中内置的tomcat：embed tomcat的创建过程。

通过Tomcat的官网[介绍](https://tomcat.apache.org/tomcat-10.1-doc/architecture/overview.html)，我们可以了解到Tomcat中有Server、Service、Connector、Engine、Host、Context这几个术语。它们之间的关系如图：
![img](/assets/1764223903595-1f939a7c-3484-4dfa-9b2e-aa52871c8052.png)
在上面的图中，
1. Server（服务器）

    在 Tomcat 体系中，一个 Server 代表整个容器。Tomcat 提供了 Server 接口的默认实现，用户很少对其进行自定义。

2. Service（服务）

    Service 是一个位于 Server 内部的中间组件，它将一个或多个 Connector（连接器）绑定到唯一一个 Engine（引擎）。用户很少自定义 Service 元素，因为其默认实现简单且已足够满足需求：即 Service 接口。

3. Engine（引擎）

    Engine 代表某个特定 Service 的请求处理流水线。由于一个 Service 可能包含多个 Connector，Engine 会接收并处理来自这些连接器的所有请求，并将响应交还给相应的连接器，由其传回客户端。虽然可以实现 Engine 接口以提供自定义引擎，但这种情况并不常见。

4. Host（虚拟主机）

    Host 表示一个网络名称（例如 www.yourcompany.com）与 Tomcat 服务器的关联。一个 Engine 可包含多个 Host，且 Host 元素还支持网络别名，如 yourcompany.com 和 abc.yourcompany.com。用户很少创建自定义 Host，因为 StandardHost 实现已提供了大量附加功能。

5. Connector（连接器）

    Connector 负责处理与客户端的通信，每一个Connector里面有一个协议处理器可以处理某种网络协议的客户端通信。可以处理的协议有：HTTP/1.1、AJP/1.3和导入到类路径中的某种协议（会通过反射进行获取）。

6. Context（上下文）

    Context 代表一个 Web 应用程序。一个 Host 可包含多个 Context，每个 Context 拥有唯一的路径（path）。虽然可以实现 Context 接口以创建自定义上下文，但这种情况极为少见，因为 StandardContext 已提供了丰富的附加功能。

## 启动一个Tomcat的示例代码

1. 引入embed-tomcat依赖：
```xml
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-tomcat</artifactId>
      <version>3.2.12</version>
  </dependency>
```
2. 编写示例类：
```java
public class TomcatApp {
    public static void main(String[] args) {
        Tomcat tomcat = new Tomcat();
        tomcat.setPort(8080);
        try {
            Connector connector = tomcat.getConnector();
            tomcat.getHost().setAutoDeploy(false);
            tomcat.addContext("/app", "files");
            // 增加一个servlet
            Wrapper servlet = tomcat.addServlet("/app", "default", "io.itaiit.servlet.DispatcherServlet");
            servlet.addMapping("/");
            servlet.setLoadOnStartup(1);
            // 启动tomcat
            tomcat.start();
            System.out.println("tomcat started.......");
        } catch (LifecycleException e) {
            throw new RuntimeException(e);
        }
    }
}

public class DispatcherServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        System.out.println("DispatcherServlet.doGet");
    }
}
```
3. 启动之后，可以在浏览器中请求：*http://localhost:8080/app*；请求会进入servlet的doGet方法。
## Spring Boot中tomcat的创建过程
在Spring Boot中，当容器是servlet类型的时候，通过`ApplicationContextFactory`工厂会创建出`AnnotationConfigServletWebServerApplicationContext`类型的容器上下文对象。在Spring Boot的启动生命周期中的刷新阶段(`org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext#onRefresh`)，会创建Tomcat服务器，并进行启动。

1. **刷新容器**：
```java
@Override
protected void onRefresh() {
    super.onRefresh();
    try {
        createWebServer();
    }
    catch (Throwable ex) {
        throw new ApplicationContextException("Unable to start web server", ex);
    }
}
```
2. **创建WebServer**：
```java
private void createWebServer() {
    ......
    ServletWebServerFactory factory = getWebServerFactory();
    createWebServer.tag("factory", factory.getClass().toString());
    this.webServer = factory.getWebServer(getSelfInitializer());
    createWebServer.end();
    ......
}
```
当我们使用tomcat作为容器的时候，`WebServerFactory`会返回`TomcatServletWebServerFactory`。我们来看`getWebServer`方法：

3. **创建Tomcat**：
```java
public WebServer getWebServer(ServletContextInitializer... initializers) {
    ......
    // 创建tomcat
    Tomcat tomcat = new Tomcat();
    File baseDir = (this.baseDirectory != null) ? this.baseDirectory : createTempDir("tomcat");
    tomcat.setBaseDir(baseDir.getAbsolutePath());
    ......
    Connector connector = new Connector(this.protocol);
    connector.setThrowOnFailure(true);
    // 添加connector
    tomcat.getService().addConnector(connector);
    customizeConnector(connector);
    tomcat.setConnector(connector);
    tomcat.getHost().setAutoDeploy(false);
    configureEngine(tomcat.getEngine());
    // 配置context
    prepareContext(tomcat.getHost(), initializers);
    return getTomcatWebServer(tomcat);
}
```
4. **配置Context**：
```java
protected void prepareContext(Host host, ServletContextInitializer[] initializers) {
    File documentRoot = getValidDocumentRoot();
    // 创建Context实例
    TomcatEmbeddedContext context = new TomcatEmbeddedContext();
    context.setName(getContextPath());
    context.setDisplayName(getDisplayName());
    context.setPath(getContextPath());
    File docBase = (documentRoot != null) ? documentRoot : createTempDir("tomcat-docbase");
    context.setDocBase(docBase.getAbsolutePath());
    context.addLifecycleListener(new FixContextListener());
    ......
    if (isRegisterDefaultServlet()) {
        addDefaultServlet(context);
    }
    if (shouldRegisterJspServlet()) {
        addJspServlet(context);
        addJasperInitializer(context);
    }
    context.addLifecycleListener(new StaticResourceConfigurer(context));
    ServletContextInitializer[] initializersToUse = mergeInitializers(initializers);
    host.addChild(context);
    // 配置context，添加spring拓展的servlet
    configureContext(context, initializersToUse);
    ......
}
```
在context中存在一个`Map<ServletContainerInitializer,Set<Class<?>>> initializers`类型的成员变量，里面保存了`ServletContainerInitializer`接口的实现和用于执行`onStartup`方法的时候的`Set<Class<?>>`类型参数。

在上面配置Context的时候，则是通过`addServletContainerInitializer`方法，手动添加进去。
```java
protected void configureContext(Context context, ServletContextInitializer[] initializers) {
    TomcatStarter starter = new TomcatStarter(initializers);
    if (context instanceof TomcatEmbeddedContext embeddedContext) {
        embeddedContext.setStarter(starter);
        embeddedContext.setFailCtxIfServletStartFails(true);
    }
    // 将TomcatStarter添加进initializers中，TomcatStarter也是ServletContainerInitializer接口的实现类
    context.addServletContainerInitializer(starter, NO_CLASSES);
    ......
    for (TomcatContextCustomizer customizer : this.tomcatContextCustomizers) {
        customizer.customize(context);
    }
}
```
在这里我们可以看到在spring boot中，创建tomcat的时候把`TomcatStarter`添加进了context中，而`TomcatStarter`实现了`ServletContainerInitializer`接口。

我们查看`ServletContainerInitializer`接口实现类，会发现还有一个`SpringServletContainerInitializer`实现类。这个类是在`META-INF/services/jakarta.servlet.ServletContainerInitializer`文件中定义的，使用的是SPI机制加载，需要注意的是在spring boot项目中，**这个类不会被加载生效，只有通过打包成war部署到外部的tomcat中的时候，才会被加载**。
## ServletContextInitializer拓展
在embed tomcat的启动过程中，tomcat会在初始化Context的时候执行`ServletContainerInitializer`的onStartup方法：
```java
@Override
public void onStartup(Set<Class<?>> classes, ServletContext servletContext) throws ServletException {
    try {
        for (ServletContextInitializer initializer : this.initializers) {
            initializer.onStartup(servletContext);
        }
    }
    catch (Exception ex) {
        ......
    }
}
```
TomcatStarter的initializers成员变量在前面创建TomcatStarter的时候已经进行了赋值；其中主要的一个initializer是在`factory.getWebServer`的时候传递的`getSelfInitializer()`：
```java
private org.springframework.boot.web.servlet.ServletContextInitializer getSelfInitializer() {
    return this::selfInitialize;
}

private void selfInitialize(ServletContext servletContext) throws ServletException {
    prepareWebApplicationContext(servletContext);
    registerApplicationScope(servletContext);
    WebApplicationContextUtils.registerEnvironmentBeans(getBeanFactory(), servletContext);
    for (ServletContextInitializer beans : getServletContextInitializerBeans()) {
        beans.onStartup(servletContext);
    }
}
```
上面的函数式接口相当于下面的代码：
```java
new ServletContextInitializer() {
    @Override
    public void onStartup(ServletContext servletContext) throws ServletException {
        prepareWebApplicationContext(servletContext);
        registerApplicationScope(servletContext);
        WebApplicationContextUtils.registerEnvironmentBeans(getBeanFactory(), servletContext);
        for (ServletContextInitializer beans : getServletContextInitializerBeans()) {
            beans.onStartup(servletContext);
        }
    }
}
```
当执行initializer.onStartup的时候就会执行selfInitiailize方法。可以看到在该方法中会获取`getServletContextInitializerBeans()`。

在`getServletContextInitializerBeans()`方法中会查找spring容器中所有类型为`ServletContextInitializer`的对象。其中包括有：
- `ServletRegistrationBean`: 一个用于在 Servlet 3.0+ 容器中注册 Servlet 的 ServletContextInitializer。其功能类似于 ServletContext 提供的注册特性，但采用了对 Spring Bean 友好的设计。`DispatcherServletRegistrationBean` 就是其中的一个子类，向tomcat中配置DispatcherServlet。
- `FilterRegistrationBean`: 一个用于在 Servlet 3.0+ 容器中注册过滤器（Filters）的 ServletContextInitializer。其功能类似于 ServletContext 提供的注册特性，但采用了对 Spring Bean 友好的设计。
- `DelegatingFilterProxyRegistrationBean`: 一个用于在 Servlet 3.0+ 容器中注册 DelegatingFilterProxy 的 ServletContextInitializer。其功能类似于 ServletContext 提供的注册特性，但采用了对 Spring Bean 友好的设计。

    实际委托的 Filter 的 Bean 名称应通过构造函数参数 targetBeanName 指定。与 FilterRegistrationBean 不同，此处引用的过滤器不会被提前实例化。事实上，如果委托的过滤器 Bean 被标记为 @Lazy，那么它将完全不会被实例化，直到该过滤器被实际调用时才会创建。
- `ServletListenerRegistrationBean`: 一个用于在 Servlet 3.0+ 容器中注册事件监听器（EventListeners）的 ServletContextInitializer。其功能类似于 ServletContext 提供的注册特性，但采用了对 Spring Bean 友好的设计。
- `ServletContextInitializer`: 该接口用于以编程方式配置 Servlet 3.0+ 的上下文。与 WebApplicationInitializer 不同，实现此接口的类（且未同时实现 WebApplicationInitializer）不会被 SpringServletContainerInitializer 自动检测到，因此也不会被 Servlet 容器自动启动引导。

通过调试可以看到获取到的实例对象，这些都是通过自动配置加载到容器中的。
![](/assets/servlet-context-initializer-beans.png)