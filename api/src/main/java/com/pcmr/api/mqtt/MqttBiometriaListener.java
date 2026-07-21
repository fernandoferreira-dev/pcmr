package com.pcmr.api.mqtt;

import com.pcmr.api.service.BiometriaService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.Base64;

@Component
public class MqttBiometriaListener implements MqttCallback {

    @Autowired
    private BiometriaService biometriaService;

    @Value("${MQTT_BROKER_URL:tcp://mosquitto:1883}")
    private String brokerUrl;

    @Value("${MQTT_CIPHER_KEY:y1RpGJ0lRkxFEB29C7qmJ0KU2u8skiwrKwWWpj+jyGs=}")
    private String cipherKeyBase64;

    private MqttClient mqttClient;
    private final ObjectMapper mapper = new ObjectMapper();
    private byte[] aesKey;

    @PostConstruct
    public void init() {
        // Decodificar a chave AES do Base64 (igual ao ESP32)
        this.aesKey = Base64.getDecoder().decode(cipherKeyBase64);

        try {
            mqttClient = new MqttClient(brokerUrl, "spring-biometria-listener-" + System.currentTimeMillis());
            MqttConnectOptions options = new MqttConnectOptions();
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);

            mqttClient.setCallback(this);
            mqttClient.connect(options);

            mqttClient.subscribe("casa/biometria/enroll");
            mqttClient.subscribe("casa/biometria/login");

            System.out.println("✅ MQTT Biometria Listener iniciado com decifragem AES-256");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String encryptedPayload = new String(message.getPayload());
        System.out.println("📥 Recebido [" + topic + "] (cifrado)");

        try {
            // Decifrar o envelope
            String plainJson = decryptEnvelope(encryptedPayload);

            if (plainJson == null) {
                System.err.println("❌ Falha na decifragem/validade CRC");
                return;
            }

            JsonNode root = mapper.readTree(plainJson);

            if (topic.equals("casa/biometria/enroll")) {
                if (root.has("id_sensor")) {
                    int idSensor = root.get("id_sensor").asInt();
                    biometriaService.completarRegisto(idSensor, true);
                    System.out.println("✅ Enrollment bem-sucedido! ID Sensor: " + idSensor);
                } else if (root.has("erro")) {
                    biometriaService.completarRegisto(0, false);
                    System.out.println("❌ Erro no Enrollment: " + root.get("motivo").asText());
                }
            } 
            else if (topic.equals("casa/biometria/login")) {
                if (root.has("id_sensor")) {
                    int idSensor = root.get("id_sensor").asInt();
                    biometriaService.completarDeteccao(idSensor);
                    System.out.println("✅ Login biométrico detetado: ID " + idSensor);
                }
            }
        } catch (Exception e) {
            System.err.println("Erro ao processar mensagem: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String decryptEnvelope(String envelopeJson) throws Exception {
        JsonNode envelope = mapper.readTree(envelopeJson);

        String ivB64 = envelope.get("iv").asText();
        String dataB64 = envelope.get("data").asText();
        long crcEsperado = envelope.get("crc").asLong();

        byte[] iv = Base64.getDecoder().decode(ivB64);
        byte[] cifrado = Base64.getDecoder().decode(dataB64);

        // Decifrar AES-256-CBC
        javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("AES/CBC/PKCS5Padding");
        javax.crypto.spec.SecretKeySpec keySpec = new javax.crypto.spec.SecretKeySpec(aesKey, "AES");
        javax.crypto.spec.IvParameterSpec ivSpec = new javax.crypto.spec.IvParameterSpec(iv);
        
        cipher.init(javax.crypto.Cipher.DECRYPT_MODE, keySpec, ivSpec);
        byte[] decrypted = cipher.doFinal(cifrado);

        // Remover padding PKCS7
        int padding = decrypted[decrypted.length - 1];
        byte[] plain = new byte[decrypted.length - padding];
        System.arraycopy(decrypted, 0, plain, 0, plain.length);

        // Verificar CRC32
        long crcCalculado = calculateCRC32(plain);
        if (crcCalculado != crcEsperado) {
            System.err.println("❌ CRC inválido! Esperado: " + crcEsperado + " | Calculado: " + crcCalculado);
            return null;
        }

        return new String(plain);
    }

    private long calculateCRC32(byte[] data) {
        long crc = 0xFFFFFFFFL;
        for (byte b : data) {
            crc = (crc >>> 8) ^ CRC32_TABLE[(int)(crc ^ (b & 0xFF)) & 0xFF];
        }
        return crc ^ 0xFFFFFFFFL;
    }

    private static final long[] CRC32_TABLE = new long[256];
    static {
        for (int i = 0; i < 256; i++) {
            long c = i;
            for (int j = 0; j < 8; j++) {
                c = (c & 1) == 1 ? (0xEDB88320L ^ (c >>> 1)) : (c >>> 1);
            }
            CRC32_TABLE[i] = c;
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        System.out.println("⚠️ MQTT conexão perdida: " + cause.getMessage());
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {}
}