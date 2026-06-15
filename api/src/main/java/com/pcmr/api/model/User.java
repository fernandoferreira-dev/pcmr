package com.pcmr.api.model;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity

public enum User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private string usesr;
    private string password;
}
