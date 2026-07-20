package com.pcmr.api.security;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

public class CipherUtil {

    private static final String ALGORITMO = "AES";
    private static final String TRANSFORMACAO = "AES/CBC/PKCS5Padding";
    private static final int IV_TAMANHO_BYTES = 16; // tamanho de bloco AES

    private final SecretKeySpec chave;

    public CipherUtil(String chaveBase64) throws Exception {
        byte[] chaveBytes = Base64.getDecoder().decode(chaveBase64);
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