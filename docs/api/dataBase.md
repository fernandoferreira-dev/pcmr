# Database Schema

## TipoUtilizador
| Field              | Type | Key |
|-------------------|------|-----|
| idTipoUtilizador  | PK   | Primary Key |
| nome              |      | |
| descricao         |      | |

---

## utilizador
| Field                  | Type | Key |
|-----------------------|------|-----|
| idUtilizador          | PK   | Primary Key |
| idTipoUtilizador      | FK   | Foreign Key → TipoUtilizador.idTipoUtilizador |
| idPessoa              | FK   | Foreign Key → Pessoa.idPessoa |
| username              |      | |
| password              |      | |
| dataCriacao           |      | |
| dataUltimaAtualizacao |      | |

---

## UtilizadorPacienteAcesso
| Field         | Type | Key |
|--------------|------|-----|
| idToken      | PK   | Primary Key |
| idUtilizador | FK   | Foreign Key → utilizador.idUtilizador |
| tokenAcesso  |      | |
| dataInicio   |      | |
| dataFim      |      | |

---

## Pessoa
| Field            | Type | Key |
|-----------------|------|-----|
| idPessoa        | PK   | Primary Key |
| nome            |      | |
| dataNascimento  |      | |
| email           |      | |

---

## Consulta
| Field             | Type | Key |
|------------------|------|-----|
| idConsulta       | PK   | Primary Key |
| idDiagnostico    | FK   | Foreign Key → Diagnostico.idDiagnostico |
| gdhConsulta      |      | |
| idPessoaMedico   | FK   | Foreign Key → Pessoa.idPessoa |
| idPessoaPaciente | FK   | Foreign Key → Pessoa.idPessoa |
| observacoes      |      | |

---

## Diagnostico
| Field               | Type | Key |
|--------------------|------|-----|
| idDiagnostico      | PK   | Primary Key |
| idConsulta         | FK   | Foreign Key → Consulta.idConsulta |
| idSensor           | FK   | Foreign Key → Sensor.idSensor |
| gdhDiagnostico     |      | |
| temperatura        |      | |
| bpm                |      | |
| magnitude_g        |      | |
| relacaoCausaEfeito |      | |

---

## Sensor
| Field        | Type | Key |
|-------------|------|-----|
| idSensor    | PK   | Primary Key |
| nome        |      | |
| localizacao |      | |
| estado      |      | |

---

## EstadoSensor
| Field             | Type | Key |
|------------------|------|-----|
| idEstadoSensor   | PK   | Primary Key |
| idSensor         | FK   | Foreign Key → Sensor.idSensor |
| resultado        |      | |
| gdh              |      | |
| versaoFirmware   |      | |

---

# Relationships

- TipoUtilizador 1 ─── N utilizador
- Pessoa 1 ─── N utilizador
- utilizador 1 ─── N UtilizadorPacienteAcesso
- Pessoa 1 ─── N Consulta (como Médico)
- Pessoa 1 ─── N Consulta (como Paciente)
- Consulta 1 ─── 1 Diagnostico
- Sensor 1 ─── N Diagnostico
- Sensor 1 ─── N EstadoSensor