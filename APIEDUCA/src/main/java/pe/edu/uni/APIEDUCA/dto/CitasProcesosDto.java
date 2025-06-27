package pe.edu.uni.APIEDUCA.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Builder
public class CitasProcesosDto {
    private long citaId;
    private long medicoId;
    private String fechaHora; // Para reprogramación
    private long usuarioId; // ID del usuario que realiza la acción
    private String motivo;
    private String accion; // "CANCELAR" o "REPROGRAMAR"
}
