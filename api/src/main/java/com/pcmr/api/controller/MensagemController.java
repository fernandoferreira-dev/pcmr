package com.pcmr.api.controller;

import com.pcmr.api.dto.MensagemDTO;
import com.pcmr.api.dto.NovaMensagemRequestDTO;
import com.pcmr.api.dto.UtilizadorResumoDTO;
import com.pcmr.api.model.Utilizador;
import com.pcmr.api.repository.UserRepository;
import com.pcmr.api.service.MensagemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mensagens")
public class MensagemController {

    @Autowired
    private MensagemService mensagemService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/recebidas")
    public ResponseEntity<List<MensagemDTO>> recebidas(
            @RequestParam Long userId,
            @RequestParam(required = false) String pesquisa
    ) {
        return ResponseEntity.ok(mensagemService.listarRecebidas(userId, pesquisa));
    }

    @GetMapping("/enviadas")
    public ResponseEntity<List<MensagemDTO>> enviadas(
            @RequestParam Long userId,
            @RequestParam(required = false) String pesquisa
    ) {
        return ResponseEntity.ok(mensagemService.listarEnviadas(userId, pesquisa));
    }

    @PostMapping
    public ResponseEntity<?> enviar(@RequestBody NovaMensagemRequestDTO req) {
        try {
            MensagemDTO dto = mensagemService.enviar(req);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/lida")
    public ResponseEntity<?> marcarComoLida(@PathVariable Long id, @RequestParam Long userId) {
        try {
            mensagemService.marcarComoLida(id, userId);
            return ResponseEntity.ok(Map.of("sucesso", true));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("erro", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/guardar")
    public ResponseEntity<?> alternarGuardada(@PathVariable Long id, @RequestParam Long userId) {
        try {
            MensagemDTO dto = mensagemService.alternarGuardada(id, userId);
            return ResponseEntity.ok(dto);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("erro", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> apagar(@PathVariable Long id, @RequestParam Long userId) {
        try {
            mensagemService.apagar(id, userId);
            return ResponseEntity.ok(Map.of("sucesso", true));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("erro", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @GetMapping("/utilizadores/procurar")
    public ResponseEntity<List<UtilizadorResumoDTO>> procurarUtilizadores(
            @RequestParam String nome,
            @RequestParam(required = false) Long excluirId
    ) {
        // No método procurarUtilizadores
        List<Utilizador> resultados = userRepository.findByPessoa_NomeContainingIgnoreCase(nome);

        List<UtilizadorResumoDTO> dtos = resultados.stream()
        .filter(u -> excluirId == null || !u.getIdUtilizador().equals(excluirId))
        // Filtro adicional: Não listar o utilizador "sistema" na busca de contactos do Admin
        .filter(u -> !"sistema".equalsIgnoreCase(u.getUsername()))
        .map(u -> new UtilizadorResumoDTO(
                u.getIdUtilizador(),
                u.getPessoa().getNome(),
                u.getPessoa().getEmail(),
                u.getTipoUtilizador().getNome()
        ))
        .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}