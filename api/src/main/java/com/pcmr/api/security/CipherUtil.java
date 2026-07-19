package com.pcmr.api.security;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

public class CipherUtil {

    private static final String ALGORITMO = "DESede";
    private static final String TRANSFORMACAO = "DESede/CBC/PKCS5Padding";
    private static final int IV_TAMANHO_BYTES = 8; // tamanho de bloco DES/3DES

    private final SecretKeySpec chave;

    public CipherUtil(String chaveBase64) {
        byte[] chaveBytes = Base64.getDecoder().decode(chaveBase64);
        
        // CORREÇÃO: Usamos os bytes brutos diretamente no SecretKeySpec.
        // Isto impede o Java de alterar os bits de paridade, garantindo 
        // compatibilidade total com o mbedtls do ESP32.
        this.chave = new SecretKeySpec(chaveBytes, ALGORITMO);
    }

    public byte[] gerarIv() {
        byte[] iv = new byte[IV_TAMANHO_BYTES];
        new SecureRandom().nextBytes(iv);
        return iv;
    }

    public byte[] cifrar(byte[] dados, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance(TRANSFORMACAO);
        cipher.init(Cipher.ENCRYPT_MODE, chave, new IvParameterSpec(iv));
        return cipher.doFinal(dados);
    }

    public byte[] decifrar(byte[] dadosCifrados, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance(TRANSFORMACAO);
        cipher.init(Cipher.DECRYPT_MODE, chave, new IvParameterSpec(iv));
        return cipher.doFinal(dadosCifrados);
    }
}