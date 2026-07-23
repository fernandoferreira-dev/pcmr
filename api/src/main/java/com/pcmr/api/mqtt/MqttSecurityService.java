package com.pcmr.api.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcmr.api.dto.MqttEnvelopeDTO;
import com.pcmr.api.security.CipherUtil;
import com.pcmr.api.security.Crc32Util;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class MqttSecurityService {

    private final CipherUtil cipherUtil;
    private final ObjectMapper mapper = new ObjectMapper();

    public MqttSecurityService(@Value("${MQTT_CIPHER_KEY}") String chaveBase64) throws Exception {
        this.cipherUtil = new CipherUtil(chaveBase64);
    }

    public String cifrarEEmpacotar(String payloadPlano) throws Exception {
        if (payloadPlano == null || payloadPlano.isEmpty()) {
            throw new IllegalArgumentException("Payload plano não pode ser nulo ou vazio");
        }

        byte[] iv = cipherUtil.gerarIv();
        // 1. Obter os bytes exatos em UTF-8 antes de cifrar
        byte[] plano = payloadPlano.getBytes(StandardCharsets.UTF_8);
        
        // 2. Cifrar os bytes
        byte[] cifrado = cipherUtil.cifrar(plano, iv);
        
        // 3. Calcular CRC32 EXATAMENTE a partir dos bytes em texto limpo (UTF-8)
        long crc = Crc32Util.calcular(plano);

        MqttEnvelopeDTO envelope = new MqttEnvelopeDTO();
        envelope.setIv(Base64.getEncoder().encodeToString(iv));
        envelope.setData(Base64.getEncoder().encodeToString(cifrado));
        envelope.setCrc(crc);

        return mapper.writeValueAsString(envelope);
    }

    public String desempacotarEDecifrar(String payloadEnvelope) throws Exception {
        if (payloadEnvelope == null || payloadEnvelope.isBlank()) {
            throw new IllegalArgumentException("Envelope de mensagem vazio");
        }

        MqttEnvelopeDTO envelope = mapper.readValue(payloadEnvelope, MqttEnvelopeDTO.class);

        byte[] iv = Base64.getDecoder().decode(envelope.getIv());
        byte[] cifrado = Base64.getDecoder().decode(envelope.getData());

        //Decifrar AES-128-CBC
        byte[] plano = cipherUtil.decifrar(cifrado, iv);

        //Calcular o CRC32 sobre os bytes descriptografados
        long crcCalculado = Crc32Util.calcular(plano);
        String jsonString = new String(plano, StandardCharsets.UTF_8);

        //Validação estrita do CRC32
        if (crcCalculado != envelope.getCrc()) {
            throw new SecurityException(
                    "CRC32 inválido — integridade dos dados comprometida (esperado=" +
                            envelope.getCrc() + ", calculado=" + crcCalculado + ")"
            );
        }

        return jsonString;
    }
}