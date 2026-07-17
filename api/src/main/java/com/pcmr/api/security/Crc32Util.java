package com.pcmr.api.security;

import java.util.zip.CRC32;

public class Crc32Util {
    public static long calcular(byte[] dados) {
        CRC32 crc = new CRC32();
        crc.update(dados);
        return crc.getValue();
    }
}