package pe.edu.uni.APIEDUCA.rest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.uni.APIEDUCA.dto.CitasDto;
import pe.edu.uni.APIEDUCA.service.CitasService;

@RestController
@RequestMapping("/api/citas")
public class CitasRest {

    @Autowired
    public CitasService citasService;

    @PostMapping("/programar")
    public ResponseEntity<?> programarCita(@RequestBody CitasDto bean) {
        try {
            CitasDto result = citasService.programarCita(bean);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
