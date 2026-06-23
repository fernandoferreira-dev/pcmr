@Configuration
public class MqttConfig {

    @Value("${MQTT_BROKER_URL:tcp://localhost:1883}")
    private String brokerUrl;

    @Value("${MQTT_TOPIC:sensors/#}")
    private String topic;

    // Factory de ligação ao broker
    @Bean
    public MqttPahoClientFactory mqttClientFactory() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[]{ brokerUrl });
        options.setCleanSession(true);
        options.setAutomaticReconnect(true);
        factory.setConnectionOptions(options);
        return factory;
    }

    // Canal onde as mensagens chegam
    @Bean
    public MessageChannel mqttInputChannel() {
        return new DirectChannel();
    }

    // Adapter que subscreve o tópico
    @Bean
    public MessageProducerSupport mqttInbound() {
        MqttPahoMessageDrivenChannelAdapter adapter =
                new MqttPahoMessageDrivenChannelAdapter(
                        "spring-client-" + UUID.randomUUID(),
                        mqttClientFactory(),
                        topic
                );
        adapter.setCompletionTimeout(5000);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(1);
        adapter.setOutputChannel(mqttInputChannel());
        return adapter;
    }
}