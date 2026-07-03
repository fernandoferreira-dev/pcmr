# Database Schema

## tipo_utilizador
| Campo              | Tipo | Chave |
|-------------------|------|--------|
| id_tipo_utilizador | PK | Primary Key |
| nome              | VARCHAR | |
| descricao         | VARCHAR | |

---

## pessoa
| Campo             | Tipo | Chave |
|------------------|------|--------|
| id_pessoa        | PK | Primary Key |
| nome             | VARCHAR | |
| data_nascimento  | DATE | |
| email            | VARCHAR | |

---

## utilizador
| Campo                    | Tipo | Chave |
|-------------------------|------|--------|
| id_utilizador           | PK | Primary Key |
| id_tipo_utilizador      | FK | Foreign Key → tipo_utilizador.id_tipo_utilizador |
| id_pessoa               | FK | Foreign Key → pessoa.id_pessoa |
| username                | VARCHAR | |
| password                | VARCHAR | |
| data_criacao            | DATETIME | |
| data_ultima_atualizacao | DATETIME | |

---

## utilizador_paciente_acesso
| Campo         | Tipo | Chave |
|--------------|------|--------|
| id_token     | PK | Primary Key |
| id_utilizador| FK | Foreign Key → utilizador.id_utilizador |
| token_acesso | VARCHAR | |
| data_inicio  | DATETIME | |
| data_fim     | DATETIME | |

---

## acesso_biometrico
| Campo                 | Tipo | Chave |
|----------------------|------|--------|
| id_acesso_biometrico | PK | Primary Key |
| id_utilizador        | FK | Foreign Key → utilizador.id_utilizador |
| imp_acesso           | VARCHAR | |
| data_registo         | DATETIME | |

---

## sensor
| Campo       | Tipo | Chave |
|------------|------|--------|
| id_sensor  | PK | Primary Key |
| nome       | VARCHAR | |
| localizacao| VARCHAR | |
| estado     | VARCHAR | |

---

## estado_sensor
| Campo              | Tipo | Chave |
|-------------------|------|--------|
| id_estado_sensor  | PK | Primary Key |
| id_sensor         | FK | Foreign Key → sensor.id_sensor |
| resultado         | VARCHAR | |
| gdh               | DATETIME | |
| versao_firmware   | VARCHAR | |

---

## consulta
| Campo               | Tipo | Chave |
|--------------------|------|--------|
| id_consulta        | PK | Primary Key |
| gdh_consulta       | DATETIME | |
| id_pessoa_medico   | FK | Foreign Key → pessoa.id_pessoa |
| id_pessoa_paciente | FK | Foreign Key → pessoa.id_pessoa |
| observacoes        | TEXT | |

---

## diagnostico
| Campo                 | Tipo | Chave |
|----------------------|------|--------|
| id_diagnostico       | PK | Primary Key |
| id_consulta          | FK | Foreign Key → consulta.id_consulta |
| id_sensor            | FK | Foreign Key → sensor.id_sensor |
| gdh_diagnostico      | DATETIME | |
| temperatura          | FLOAT | |
| bpm                  | INT | |
| magnitude_g          | FLOAT | |
| relacao_causa_efeito | TEXT | |

---

# Relacionamentos

- tipo_utilizador 1 ─── N utilizador
- pessoa 1 ─── N utilizador
- utilizador 1 ─── N utilizador_paciente_acesso
- utilizador 1 ─── N acesso_biometrico
- pessoa 1 ─── N consulta (médico)
- pessoa 1 ─── N consulta (paciente)
- consulta 1 ─── N diagnostico
- sensor 1 ─── N diagnostico
- sensor 1 ─── N estado_sensor