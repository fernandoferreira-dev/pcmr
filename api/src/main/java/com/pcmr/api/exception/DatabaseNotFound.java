package com.pcmr.api.exception;

public class DatabaseNotFound extends RuntimeException {

    public DatabaseNotFound() {
        super("Database resource not found");
    }

    public DatabaseNotFound(String message) {
        super(message);
    }
}
