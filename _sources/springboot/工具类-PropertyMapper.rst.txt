工具类-PropertyMapper
=======================

在查看Spring Boot源码的时候发现了这样一处代码:

.. code-block:: java

    public void customize(ConfigurableTomcatWebServerFactory factory) {
        ServerProperties.Tomcat properties = this.serverProperties.getTomcat();
        PropertyMapper map = PropertyMapper.get().alwaysApplyingWhenNonNull();
        map.from(properties::getBasedir).to(factory::setBaseDirectory);
        ......
    }

代码路径： :code:`org.springframework.boot.autoconfigure.web.embedded.TomcatWebServerFactoryCustomizer#customize`

上面代码的应用场景是读取配置文件中关于 :code:`prefix = "server"` 的配置，当值不为空的时候就给工厂类中对应的属性赋值。使用这种方式避免了我们对于大量对于值判断的代码:

.. code-block:: java

    if (properties.getBaseDir != null) {
        factory.setBaseDirectory(properties.getBaseDir);
    }
    ......

根据PropertyMapper类的描述为：一个实用工具，可用于将值从指定的源对象映射到目标对象。主要旨在辅助将 :code:`@ConfigurationProperties` 中的配置映射到第三方类时使用。