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
        byte[] iv = cipherUtil.gerarIv();
        byte[] plano = payloadPlano.getBytes(StandardCharsets.UTF_8);
        byte[] cifrado = cipherUtil.cifrar(plano, iv);
        long crc = Crc32Util.calcular(plano);

        MqttEnvelopeDTO envelope = new MqttEnvelopeDTO();
        envelope.setIv(Base64.getEncoder().encodeToString(iv));
        envelope.setData(Base64.getEncoder().encodeToString(cifrado));
        envelope.setCrc(crc);

        return mapper.writeValueAsString(envelope);
    }

    public String desempacotarEDecifrar(String payloadEnvelope) throws Exception {
        MqttEnvelopeDTO envelope = mapper.readValue(payloadEnvelope, MqttEnvelopeDTO.class);

        byte[] iv = Base64.getDecoder().decode(envelope.getIv());
        byte[] cifrado = Base64.getDecoder().decode(envelope.getData());
        byte[] plano = cipherUtil.decifrar(cifrado, iv);

        long crcCalculado = Crc32Util.calcular(plano);
        if (crcCalculado != envelope.getCrc()) {
            throw new SecurityException(
                    "CRC32 inválido — integridade dos dados comprometida (esperado=" +
                            envelope.getCrc() + ", calculado=" + crcCalculado + ")"
            );
        }

        return new String(plano, StandardCharsets.UTF_8);
    }
}