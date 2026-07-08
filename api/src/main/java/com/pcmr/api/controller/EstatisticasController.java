package com.pcmr.api.controller;

import com.pcmr.api.dto.EstatisticasOverviewDTO;
import com.pcmr.api.service.EstatisticasService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/estatisticas")
public class EstatisticasController {

    @Autowired
    private EstatisticasService estatisticasService;

    @GetMapping("/overview")
    public ResponseEntity<EstatisticasOverviewDTO> overview() {
        return ResponseEntity.ok(estatisticasService.obterOverview());
    }
}