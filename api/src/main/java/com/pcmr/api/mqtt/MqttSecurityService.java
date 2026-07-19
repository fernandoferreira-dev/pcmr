package com.pcmr.api.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcmr.api.dto.MqttEnvelopeDTO;
import com.pcmr.api.security.CipherUtil;
import com.pcmr.api.security.Crc32Util;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class MqttSecurityService {

    private static final Logger log = LoggerFactory.getLogger(MqttSecurityService.class);

    private final CipherUtil cipherUtil;
    private final ObjectMapper mapper = new ObjectMapper();

    public MqttSecurityService(@Value("${MQTT_CIPHER_KEY}") String chaveBase64) throws Exception {

        // Exibe a chave em hexadecimal para conferência
        byte[] keyBytes = Base64.getDecoder().decode(chaveBase64);

        StringBuilder hex = new StringBuilder();
        for (byte b : keyBytes) {
            hex.append(String.format("%02X", b));
        }

        log.info("CHAVE_3DES ATUAL NO JAVA (HEX): {}", hex);

        this.cipherUtil = new CipherUtil(chaveBase64);
    }

    /**
     * Cifra o payload e empacota em um envelope JSON.
     */
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

    /**
     * Desempacota o envelope, decifra o conteúdo e valida o CRC32.
     */
    public String desempacotarEDecifrar(String payloadEnvelope) throws Exception {

        MqttEnvelopeDTO envelope =
                mapper.readValue(payloadEnvelope, MqttEnvelopeDTO.class);

        byte[] iv = Base64.getDecoder().decode(envelope.getIv());
        byte[] cifrado = Base64.getDecoder().decode(envelope.getData());

        byte[] plano = cipherUtil.decifrar(cifrado, iv);

        long crcCalculado = Crc32Util.calcular(plano);

        if (crcCalculado != envelope.getCrc()) {
            throw new SecurityException(
                    "CRC32 inválido — integridade dos dados comprometida (esperado="
                            + envelope.getCrc()
                            + ", calculado="
                            + crcCalculado
                            + ")"
            );
        }

        return new String(plano, StandardCharsets.UTF_8);
    }
}