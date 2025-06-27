package pe.edu.uni.APIEDUCA.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Builder
public class CitasDto {

    private long pacienteId;
    private long medicoId;
    private String fechaHora; // formato: "2024-06-15 14:30"
    private int duracionMinutos;
    private String motivoConsulta;
    private String observacionesCita;
    private long creadaPor; // ID del recepcionista

}