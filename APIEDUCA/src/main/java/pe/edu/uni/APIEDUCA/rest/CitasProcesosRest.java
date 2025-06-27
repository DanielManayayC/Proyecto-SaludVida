package pe.edu.uni.APIEDUCA.rest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.uni.APIEDUCA.dto.CitasProcesosDto;
import pe.edu.uni.APIEDUCA.service.CitasProcesosService;

@RestController
@RequestMapping("/api/citas")
public class CitasProcesosRest {

    @Autowired
    public CitasProcesosService citasProcesosService;

    @PostMapping("/cancelar")
    public ResponseEntity<?> cancelarCita(@RequestBody CitasProcesosDto bean) {
        try {
            CitasProcesosDto result = citasProcesosService.cancelarCita(bean);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/reprogramar")
    public ResponseEntity<?> reprogramarCita(@RequestBody CitasProcesosDto bean) {
        try {
            CitasProcesosDto result = citasProcesosService.reprogramarCita(bean);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
