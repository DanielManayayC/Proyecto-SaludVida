package pe.edu.uni.APIEDUCA.rest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.uni.APIEDUCA.dto.RecordatorioDto;
import pe.edu.uni.APIEDUCA.service.RecordatorioService;

import java.util.List;

@RestController
@RequestMapping("/api/recordatorios")
public class RecordatorioRest {

    @Autowired
    private RecordatorioService notificacionService;

    @GetMapping("/pendientes")
    public ResponseEntity<?> obtenerRecordatoriosPendientes() {
        try {
            List<RecordatorioDto> recordatorios = notificacionService.obtenerRecordatoriosPendientes();
            return ResponseEntity.ok(recordatorios);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/enviar/{idRecordatorio}")
    public ResponseEntity<?> procesarEnvioRecordatorio(@PathVariable long idRecordatorio) {
        try {
            RecordatorioDto resultado = notificacionService.procesarEnvioRecordatorio(idRecordatorio);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}